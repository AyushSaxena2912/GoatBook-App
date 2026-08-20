# Environment Variables (names only)

Create `backend/.env` on EC2 and locally. **Values are transferred privately** — not in this pack.

## Required / used by backend

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (RDS) |
| `JWT_SECRET` | Signs login tokens |
| `PORT` | API port (default `5001`) |
| `NODE_ENV` | `production` on EC2 |
| `PUBLIC_URL` | Optional self-ping URL |
| `RESEND_API_KEY` | Forgot-password emails |
| `CLOUDINARY_CLOUD_NAME` | Image uploads (server helper) |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `CASHFREE_APP_ID` | Subscription payments |
| `CASHFREE_SECRET_KEY` | Subscription payments |
| `CASHFREE_BASE_URL` | Cashfree API base (sandbox/live) |
| `FRONTEND_URL` | Payment return URL base |

## Frontend (not via .env today)

| Item | Location | Notes |
|------|----------|-------|
| API base URL | `frontend/src/api/index.js` (`RENDER_URL`) | Currently raw EC2 IP |
| Cloudinary unsigned upload | `frontend/src/utils/cloudinary.js` | `CLOUD_NAME` + `UPLOAD_PRESET` hardcoded |
| Cashfree mode | `SubscriptionScreen.js` | `mode: 'sandbox'` |

## GitHub Actions secrets

| Secret | Used by |
|--------|---------|
| `EC2_SSH_KEY` | Backend deploy |
| `ANDROID_KEYSTORE_BASE64` | APK signing |
| `ANDROID_KEYSTORE_PASSWORD` | APK signing |
| `ANDROID_KEY_PASSWORD` | APK signing |
| `ANDROID_KEY_ALIAS` | APK signing |

## EC2 file locations

| Path on server | Purpose |
|----------------|---------|
| `~/GoatBook-App` | Cloned repo |
| `~/GoatBook-App/backend/.env` | Runtime env for Docker `--env-file` |
