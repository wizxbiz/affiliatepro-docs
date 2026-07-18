# Marketplace AI Post Fix Summary

## Problem
The `/aiโพสต์` command was failing with `429 Too Many Requests` errors from the LINE API.
- **Root Cause:** The AI generation process (Gemini Vision) takes 5-10 seconds. The LINE Webhook expects a response within 1 second.
- **Consequence:** LINE timed out and retried the webhook multiple times (up to 3 times).
- **Amplification:** Each retry triggered a new AI generation and a new "Processing" reply. This caused a flood of requests, hitting the LINE Rate Limit (429) and potentially burning quota.

## Solution Implemented
We have refactored the system to use an **Asynchronous Background Worker** pattern.

### 1. Decoupled Webhook (`functions/marketplaceSystem.js`)
- Modified `handleAIPostImage` to be lightweight.
- It now:
  1. Replies "Processing..." immediately.
  2. Queues a task to Firestore (`marketplace_tasks` collection).
  3. Returns `200 OK` to LINE immediately.
- **Benefit:** Prevents LINE timeouts and retries.

### 2. Background Worker (`functions/index.js`)
- Added `exports.marketplaceWorker` (Firestore Trigger).
- Listens for new tasks in `marketplace_tasks`.
- Executes the heavy AI logic in the background (up to 120 seconds allowed).
- Sends the final result via `pushMessage`.

### 3. Robustness
- **Retry Logic:** The worker still uses `retryWithBackoff` for LINE API calls, but now it's safe from webhook timeouts.
- **Status Tracking:** Tasks are marked as `pending` -> `processing` -> `completed`/`failed` in Firestore, allowing for debugging and preventing duplicate processing.

## Verification
1. Deploy the functions: `firebase deploy --only functions`
2. Test `/aiโพสต์` by sending an image.
3. The bot should reply "Processing..." instantly.
4. A few seconds later, the AI result should appear.
5. Check Firestore `marketplace_tasks` to see the task status.

## Files Modified
- `functions/marketplaceSystem.js`: Added `processAIPostTask`, updated `handleAIPostImage`.
- `functions/index.js`: Added `marketplaceWorker` trigger and imports.
