"use strict";

// ============================================================
// TOKENOMICS CLOUD FUNCTIONS
// Server-side validation for all coin award & redemption.
//
// Why here and not in the Flutter client?
//   - Client code can be reverse-engineered / modified
//   - pointsOverride, mission type, and refId must be trusted
//     from the server, not from the app
//   - Idempotency and rate-limit checks must be atomic
// ============================================================

const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Lazy getter — avoids calling admin.firestore() before initializeApp()
const db = () => admin.firestore();

// ── Mission point values (server-authoritative, no client override) ──────────
const DEFAULT_POINTS = {
  videoWatch:    5,
  postCreation: 20,
  locationPin:  50,
  share:        10,
  purchase:    100,
  referral:    200,
  dailyLogin:   10,
  like:          1,
  comment:       3,
  follow:        5,
};

// ── Allowed mission types ─────────────────────────────────────────────────────
const VALID_MISSIONS = new Set(Object.keys(DEFAULT_POINTS));

// ── Reward costs (server-authoritative) ───────────────────────────────────────
const REWARD_COSTS = {
  discount20:     200,
  boostPost:      500,
  lineSticker:    300,
  premiumMonth:  1000,
  freeShipping:   150,
};

// ── Idempotency key strategy per mission type ─────────────────────────────────
// Returns the Firestore document ID used as the idempotency key.
// If the document already exists inside the transaction, the award is rejected.
function getIdempotencyKey(missionType, refId, uid, today) {
  switch (missionType) {
    // Permanent: one award per target ever
    case "like":
    case "follow":
      if (!refId) throw new HttpsError("invalid-argument", `refId is required for ${missionType}`);
      return `${missionType}_${refId}`;

    // Permanent: one award per transaction/order/referral ever
    case "purchase":
    case "referral":
      if (!refId) throw new HttpsError("invalid-argument", `refId is required for ${missionType}`);
      return `${missionType}_${refId}`;

    // Daily per-content: one award per piece of content per day
    case "videoWatch":
    case "share":
    case "comment":
      if (!refId) throw new HttpsError("invalid-argument", `refId is required for ${missionType}`);
      return `${missionType}_${refId}_${today}`;

    // Daily global: one award per day (no refId needed)
    case "postCreation":
    case "locationPin":
    case "dailyLogin":
      return `${missionType}_${today}`;

    default:
      return `${missionType}_${refId || "noref"}_${today}`;
  }
}

// ── Fetch remote tokenomics config (with fallback) ────────────────────────────
async function getPointsConfig() {
  try {
    const configDoc = await db().collection("system_config").doc("tokenomics").get();
    if (configDoc.exists) {
      return { ...DEFAULT_POINTS, ...configDoc.data() };
    }
  } catch (_) { /* fall through to defaults */ }
  return { ...DEFAULT_POINTS };
}

// ── Resolve primary user document (users or line_users) ──────────────────────
// Returns { ref, collection } for the user's primary document.
async function resolveUserRef(transaction, uid) {
  const usersRef = db().collection("users").doc(uid);
  const usersDoc = await transaction.get(usersRef);
  if (usersDoc.exists) return { ref: usersRef, doc: usersDoc };

  const lineRef = db().collection("line_users").doc(uid);
  const lineDoc = await transaction.get(lineRef);
  if (lineDoc.exists) return { ref: lineRef, doc: lineDoc };

  return null; // user not found
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: awardPoints
// Called from Flutter: FirebaseFunctions.instance.httpsCallable('awardPoints')
// ─────────────────────────────────────────────────────────────────────────────
exports.awardPoints = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    // 1. Auth guard — must be a signed-in user
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to earn coins.");
    }

    const { missionType, refId, description } = request.data;
    const uid = request.auth.uid;

    // 2. Mission type validation
    if (!missionType || !VALID_MISSIONS.has(missionType)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid missionType: "${missionType}". Must be one of: ${[...VALID_MISSIONS].join(", ")}`
      );
    }

    // 3. Load server-side point config (no client pointsOverride accepted)
    const config = await getPointsConfig();
    const today  = new Date().toISOString().substring(0, 10);
    const idempotencyKey = getIdempotencyKey(missionType, refId, uid, today);

    // 4. Atomic transaction: idempotency check + balance update
    let coinsAwarded = 0;
    let newBalance   = 0;

    await db().runTransaction(async (transaction) => {
      // 4a. Resolve user document (users or line_users)
      const userResult = await resolveUserRef(transaction, uid);
      if (!userResult) {
        throw new HttpsError("not-found", "User document not found.");
      }
      const { ref: userRef, doc: userDoc } = userResult;
      const userData = userDoc.data();

      // 4b. Check idempotency — if key already exists, skip (not an error)
      const idempotencyRef = userRef.collection("point_logs").doc(idempotencyKey);
      const idempotencyDoc = await transaction.get(idempotencyRef);
      if (idempotencyDoc.exists) {
        coinsAwarded = 0;
        newBalance   = userData.coins ?? 0;
        return; // already awarded — idempotent no-op
      }

      // 4c. Calculate points (server config only, no client override)
      let points = config[missionType] ?? DEFAULT_POINTS[missionType] ?? 1;

      // 4d. Daily streak bonus for dailyLogin
      if (missionType === "dailyLogin") {
        const streakConfigDoc = await db().collection("system_config").doc("streak_bonus").get();
        const streakConfig    = streakConfigDoc.exists ? streakConfigDoc.data() : {};
        const streakBonusDays  = streakConfig.days  ?? 7;
        const streakBonusCoins = streakConfig.coins ?? 50;

        const lastLoginDate   = userData.lastLoginDate ?? null;
        const currentStreak   = userData.dailyStreak   ?? 0;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().substring(0, 10);

        const newStreak = lastLoginDate === yesterdayStr ? currentStreak + 1 : 1;
        if (newStreak % streakBonusDays === 0) points += streakBonusCoins;

        transaction.update(userRef, {
          dailyStreak:   newStreak,
          lastLoginDate: today,
        });
      }

      coinsAwarded = points;
      newBalance   = (userData.coins ?? 0) + points;

      // 4e. Write idempotency log (deterministic doc ID = idempotency key)
      transaction.set(idempotencyRef, {
        missionType,
        points,
        refId:       refId   ?? null,
        description: description ?? missionType,
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4f. Update user balance
      transaction.update(userRef, {
        coins:          admin.firestore.FieldValue.increment(points),
        lifetimePoints: admin.firestore.FieldValue.increment(points),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4g. Update leaderboard (upsert)
      const leaderboardRef = db().collection("leaderboard").doc(uid);
      transaction.set(
        leaderboardRef,
        {
          uid,
          totalCoins: admin.firestore.FieldValue.increment(points),
          updatedAt:  admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return { success: true, coinsAwarded, newBalance };
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: redeemPoints
// Fixes TOCTOU race: balance check is INSIDE the transaction (atomic).
// Called from Flutter: FirebaseFunctions.instance.httpsCallable('redeemPoints')
// ─────────────────────────────────────────────────────────────────────────────
exports.redeemPoints = onCall(
  { region: "us-central1", enforceAppCheck: false },
  async (request) => {
    // 1. Auth guard
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to redeem coins.");
    }

    const { rewardType, description } = request.data;
    const uid = request.auth.uid;

    // 2. Validate rewardType and resolve cost server-side
    const cost = REWARD_COSTS[rewardType];
    if (cost === undefined) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid rewardType: "${rewardType}". Must be one of: ${Object.keys(REWARD_COSTS).join(", ")}`
      );
    }

    let newBalance = 0;

    await db().runTransaction(async (transaction) => {
      const userRef = db().collection("users").doc(uid);
      const userDoc = await transaction.get(userRef);

      // Fallback to line_users if not in users
      let resolvedRef = userRef;
      let resolvedDoc = userDoc;
      if (!userDoc.exists) {
        resolvedRef = db().collection("line_users").doc(uid);
        resolvedDoc = await transaction.get(resolvedRef);
      }

      if (!resolvedDoc.exists) {
        throw new HttpsError("not-found", "User document not found.");
      }

      const currentCoins = resolvedDoc.data().coins ?? 0;

      // 3. Balance check INSIDE transaction — atomic, no TOCTOU race
      if (currentCoins < cost) {
        throw new HttpsError(
          "failed-precondition",
          `Insufficient coins. Required: ${cost}, available: ${currentCoins}.`
        );
      }

      newBalance = currentCoins - cost;

      // 4. Deduct balance
      transaction.update(resolvedRef, {
        coins:      admin.firestore.FieldValue.increment(-cost),
        totalSpent: admin.firestore.FieldValue.increment(cost),
      });

      // 5. Write spend log
      const logRef = resolvedRef.collection("point_logs").doc();
      transaction.set(logRef, {
        type:        "spend",
        points:      -cost,
        amount:      -cost,
        rewardType,
        description: description ?? rewardType,
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      });

      // 6. Create voucher
      const voucherRef = resolvedRef.collection("vouchers").doc();
      const expiresAt  = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      transaction.set(voucherRef, {
        rewardType,
        cost,
        status:    "active",
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true, newBalance };
  }
);
