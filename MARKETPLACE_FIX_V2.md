# Marketplace Fix V2: Enhanced Rate Limit Handling

## Problem
The previous fix (Background Worker) solved the webhook timeout, but the worker itself was still hitting LINE API Rate Limits (429) because the retry backoff was too short (~7s total).

## Solution
1. **Aggressive Backoff:** Increased retry count to 5 and base delay to 2s.
   - Retry 1: 2s
   - Retry 2: 4s
   - Retry 3: 8s
   - Retry 4: 16s
   - Retry 5: 32s
   - **Total Wait:** ~62 seconds.
   - This allows enough time for the LINE API "per minute" quota to reset.

2. **Robust Error Handling:**
   - Updated `retryWithBackoff` to handle `5xx` server errors as well.
   - Added a final "fallback" error notification if all retries fail.

## Status
- Deployment verified: Function discovery succeeded.
- Code updated in `functions/marketplaceSystem.js`.

## Verification
- User should try `/aiโพสต์` again.
- If rate limited, the bot will now wait up to a minute before delivering the result, instead of failing.
