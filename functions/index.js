"use strict";

// ============================================================
// THIN ORCHESTRATOR — index.js
// All business logic lives in the modules below.
// admin.initializeApp() MUST stay here and only here.
// ============================================================

const admin = require("firebase-admin");
admin.initializeApp({
  serviceAccountId: "wizx-admin@appinjproject.iam.gserviceaccount.com",
  storageBucket: "appinjproject.firebasestorage.app"
});
console.log("✅ Firebase Admin initialized with default credentials");

const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({
  maxInstances: 5,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB"
});

const { onRequest } = require("firebase-functions/v2/https");

// ── Module imports ────────────────────────────────────────────────────────────
const plasticsAI           = require("./plastics_ai_engine");
const plasticsWebhook      = require("./plastics_webhook");
const tuktukWebhook        = require("./tuktuk_webhook");
const tuktukFunctions      = require("./tuktuk_functions");
const marketplaceFunctions = require("./marketplace_functions");
const webPushFunctions     = require("./web_push_functions");
const utilityFunctions     = require("./utility_functions");
const adminApi             = require("./admin_api_handlers");
const scheduledTasks       = require("./scheduled_tasks");
const marketplaceWebAPI    = require("./marketplaceWebAPI");
const analyticsSystem      = require("./analyticsSystem");
const tokenomicsFunctions  = require("./tokenomics_functions");

// ── Marketplace REST API (thin wrappers kept here for backward-compat) ────────
exports.marketplaceGetProducts = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getProducts);

exports.marketplaceGetProduct = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getProduct);

exports.marketplaceGetStats = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getStats);

exports.marketplaceGetRelated = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.getRelatedProducts);

exports.marketplaceRecordContact = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.recordContact);

exports.marketplaceShare = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.shareProductPreview);

exports.communityShare = onRequest({
  region: "us-central1",
  memory: "256MiB",
  cors: true,
}, marketplaceWebAPI.shareCommunityPreview);

exports.fetchExternalProduct = onRequest({
  region: "asia-southeast1",
  cors: true,
}, async (req, res) => {
  return marketplaceWebAPI.fetchExternalProduct(req, res);
});

// ── module.exports — single source of truth for Cloud Functions ──────────────
module.exports = {
  // ── Plastics AI system ──────────────────────────────────────────────────
  lineWebhook:       plasticsWebhook.lineWebhook,
  getGeminiResponse: plasticsAI.getGeminiResponse,

  // ── TukTuk webhook ──────────────────────────────────────────────────────
  lineWebhookTuktuk: tuktukWebhook.lineWebhookTuktuk,

  // ── TukTuk / Escrow / Search / WIN Rider ───────────────────────────────
  createSubscriptionInvoice: tuktukFunctions.createSubscriptionInvoice,
  getSearchSuggestions:      tuktukFunctions.getSearchSuggestions,
  advancedMarketplaceSearch: tuktukFunctions.advancedMarketplaceSearch,
  verifyPaymentSlip:         tuktukFunctions.verifyPaymentSlip,
  createEscrowRecord:        tuktukFunctions.createEscrowRecord,
  buyerConfirmReceipt:       tuktukFunctions.buyerConfirmReceipt,
  onOrderCreated:            tuktukFunctions.onOrderCreated,
  onNewWinRiderRequest:      tuktukFunctions.onNewWinRiderRequest,

  // ── Marketplace functions ───────────────────────────────────────────────
  marketplaceLineAuth:       marketplaceFunctions.marketplaceLineAuth,
  marketplacePostProduct:    marketplaceFunctions.marketplacePostProduct,
  marketplaceAIGeneratePost: marketplaceFunctions.marketplaceAIGeneratePost,
  lineLoginCallback:         marketplaceFunctions.lineLoginCallback,
  checkFreeUsage:            marketplaceFunctions.checkFreeUsage,
  educationAI:               marketplaceFunctions.educationAI,
  aiContentAssist:           marketplaceFunctions.aiContentAssist,

  // ── Marketplace REST API (wrapped above, re-exported for SDK callers) ───
  marketplaceGetProducts:    exports.marketplaceGetProducts,
  marketplaceGetProduct:     exports.marketplaceGetProduct,
  marketplaceGetStats:       exports.marketplaceGetStats,
  marketplaceGetRelated:     exports.marketplaceGetRelated,
  marketplaceRecordContact:  exports.marketplaceRecordContact,
  marketplaceShare:          exports.marketplaceShare,
  communityShare:            exports.communityShare,
  fetchExternalProduct:      exports.fetchExternalProduct,

  // ── Web Push Notifications ──────────────────────────────────────────────
  saveWebPushSubscription: webPushFunctions.saveWebPushSubscription,
  sendTestPush:            webPushFunctions.sendTestPush,
  onOrderCreatedPush:      webPushFunctions.onOrderCreatedPush,
  onEscrowReleasedPush:    webPushFunctions.onEscrowReleasedPush,
  onNewMessagePush:        webPushFunctions.onNewMessagePush,

  // ── Utility functions ───────────────────────────────────────────────────
  manageMemory:    utilityFunctions.manageMemory,
  healthCheck:     utilityFunctions.healthCheck,
  submitFeedback:  utilityFunctions.submitFeedback,
  r2PresignedUrl:  utilityFunctions.r2PresignedUrl,

  // ── Admin API (verifyWebPin lives in admin_api_handlers, untouched) ─────
  adminCreatePin:         adminApi.adminCreatePin,
  adminBroadcast:         adminApi.adminBroadcast,
  adminGetStats:          adminApi.adminGetStats,
  verifyWebPin:           adminApi.verifyWebPin,
  refreshWebSession:      adminApi.refreshWebSession,
  verifyLineLogin:        adminApi.verifyLineLogin,
  generateLineToken:      adminApi.generateLineToken,
  verifyLineToken:        adminApi.verifyLineToken,
  adminRecordTransaction: adminApi.adminRecordTransaction,
  adminCleanup:           adminApi.adminCleanup,
  adminGetTransactions:   adminApi.adminGetTransactions,
  adminGetWebhookLogs:    adminApi.adminGetWebhookLogs,

  // ── Scheduled tasks ─────────────────────────────────────────────────────
  dailyReset:              scheduledTasks.dailyReset,
  scheduledPremiumCheck:   scheduledTasks.scheduledPremiumCheck,
  scheduledWeeklyCleanup:  scheduledTasks.scheduledWeeklyCleanup,
  scheduledPublisher:      scheduledTasks.scheduledPublisher,
  scheduledNewsAutomator:  scheduledTasks.scheduledNewsAutomator,
  checkSellerTrialExpiry:  scheduledTasks.checkSellerTrialExpiry,
  autoReleaseEscrow:       scheduledTasks.autoReleaseEscrow,

  // ── Analytics ───────────────────────────────────────────────────────────
  trackPageView:     analyticsSystem.trackPageView,
  trackEvent:        analyticsSystem.trackEvent,
  getAnalyticsStats: analyticsSystem.getAnalyticsStats,

  // ── Tokenomics (server-validated coin award & redemption) ────────────────
  awardPoints:   tokenomicsFunctions.awardPoints,
  redeemPoints:  tokenomicsFunctions.redeemPoints,

};
