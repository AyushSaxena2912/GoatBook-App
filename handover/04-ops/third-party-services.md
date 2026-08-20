# Third-Party Services

## Resend (transactional email)

- Used for: forgot-password codes  
- Env: `RESEND_API_KEY`  
- Code: `backend/modules/auth/auth.controller.js`  
- Current From (needs production fix): `GoatBook <onboarding@resend.dev>`  
- Free tier (approx): **3,000 emails/month**, **100/day**, 1 verified domain  

**Production requirement:** verify client domain and change `from` to e.g. `noreply@yourdomain.com`.

Phone-only accounts: code is logged server-side only (no SMS yet).

## Cloudinary (images)

- Frontend unsigned upload: cloud `dvtfv9vvr`, preset `goatbook_preset`  
- Also backend env vars for signed/server usage  
- Used by animal/employee/farm/profile/finance screens  

Ensure Cloudinary account ownership is transferred.

## Cashfree (subscriptions)

- Backend: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_BASE_URL`  
- Frontend currently initializes Cashfree in **sandbox** mode  
- Before real billing: switch to production keys + `mode: 'production'`

## Expo push notifications

- Backend uses `expo-server-sdk`  
- Worker setup in `backend/utils/notificationWorker.js` (started from `server.js`)

## GitHub

- Repo hosting + Actions minutes  
- Transfer org/owner access during handover  
