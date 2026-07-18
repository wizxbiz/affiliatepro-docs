"use strict";

// ============================================================
// subscription_plans.js — single source of truth for plans
// price ↔ duration ↔ display name. Used by:
//   • slip auto-verify (match paid amount → plan)
//   • /approve admin command
//   • renewal-code issuance / redemption
// Keep this in sync if pricing changes — everything reads from here.
// ============================================================

const PLANS = {
  "99":   { months: 1,  name: "รายเดือน (99฿)",            team: false, amount: 99 },
  "259":  { months: 3,  name: "3 เดือน (259฿)",            team: false, amount: 259 },
  "699":  { months: 12, name: "รายปี (699฿)",              team: false, amount: 699 },
  "399":  { months: 1,  name: "Team Pack รายเดือน (399฿)", team: true,  amount: 399 },
  "999":  { months: 3,  name: "Team Pack 3 เดือน (999฿)",  team: true,  amount: 999 },
  "2490": { months: 12, name: "Team Pack รายปี (2,490฿)",  team: true,  amount: 2490 },
};

// "2,490฿" / "฿259" / 99 → "2490" / "259" / "99"
function normalizePrice(raw) {
  if (raw === null || raw === undefined) return "";
  return String(raw).replace(/[^\d]/g, "");
}

function getPlan(priceOrCode) {
  return PLANS[normalizePrice(priceOrCode)] || null;
}

// Match an actual PAID amount (SlipOK returns a number) to a known plan.
function getPlanByAmount(amount) {
  const a = Math.round(Number(amount) || 0);
  for (const code of Object.keys(PLANS)) {
    if (PLANS[code].amount === a) return { code, ...PLANS[code] };
  }
  return null;
}

module.exports = { PLANS, getPlan, getPlanByAmount, normalizePrice };
