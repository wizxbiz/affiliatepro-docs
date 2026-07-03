"use strict";

// ============================================================
// slip_verifier.js — verify a Thai bank-transfer slip via SlipOK
// (https://slipok.com). NOT a Google service — keeps us independent.
// Reads creds from env: SLIPOK_API_KEY, SLIPOK_BRANCH_ID.
//
// SlipOK also auto-rejects DUPLICATE slips (same transRef per branch),
// which gives us anti-replay for free.
//
// Returns a normalized result so the webhook never has to know the
// SlipOK response shape:
//   { ok, isSlip, amount, transRef, bank, raw, error }
// ============================================================

/**
 * @param {Buffer} buffer        raw image bytes of the slip
 * @param {number} expectedAmount amount we expect (helps SlipOK validate)
 */
async function verifySlip(buffer, expectedAmount = 0) {
  const apiKey = process.env.SLIPOK_API_KEY || "";
  const branchId = process.env.SLIPOK_BRANCH_ID || "";
  if (!apiKey || !branchId) {
    return { ok: false, isSlip: false, error: "SLIPOK_NOT_CONFIGURED" };
  }
  try {
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const form = new FormData();
    form.append("amount", String(expectedAmount || 0));
    form.append("files", blob, "slip.jpg");

    const resp = await fetch(`https://api.slipok.com/api/line/apikey/${branchId}`, {
      method: "POST",
      headers: { "x-lib-apikey": apiKey },
      body: form,
    });
    const result = await resp.json().catch(() => null);

    // success:false → not a slip, duplicate, or amount mismatch → not auto-verifiable
    if (!result || result.success !== true) {
      return {
        ok: false,
        isSlip: false,
        error: (result && result.message) || "SLIP_REJECTED",
        raw: result,
      };
    }
    const data = result.data || {};
    return {
      ok: true,
      isSlip: true,
      amount: Number(data.amount) || 0,
      transRef: data.transRef || data.transRefId || null,
      bank: data.receivingBank || data.sendingBank || null,
      raw: data,
    };
  } catch (e) {
    return { ok: false, isSlip: false, error: e.message };
  }
}

module.exports = { verifySlip };
