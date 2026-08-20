# Deployment & CI/CD

## Backend deploy

File: `.github/workflows/deploy.yaml`

**Trigger:** push to `main` changing `backend/**` or the workflow file.

**Steps:**

1. SSH to EC2 (`ubuntu@13.60.172.93`) using `EC2_SSH_KEY`  
2. `cd ~/GoatBook-App && git pull origin main`  
3. Stop/remove `goatbook-api`  
4. `docker build -t goatbook-backend ./backend`  
5. `docker run ... --env-file ~/GoatBook-App/backend/.env -e NODE_ENV=production`

If EC2 IP changes, update `host:` in this workflow **and** frontend API URL.

## Android APK build

File: `.github/workflows/build-apk.yaml`

**Trigger:** push to `main` changing `frontend/**` (or workflow/scripts).

**Steps (summary):**

1. Node 20 + JDK 17 + Android SDK  
2. `npm install` in `frontend`  
3. `npx expo prebuild --platform android`  
4. Decode release keystore from secrets  
5. Gradle assemble release  
6. Upload artifact (signed APK)

### Required GitHub secrets

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_KEY_ALIAS`

Losing the keystore means you cannot update the same Play Store / package signature.

## Manual release checklist (IP change)

1. Confirm new EC2 public IP / Elastic IP  
2. Update `frontend/src/api/index.js`  
3. Update `.github/workflows/deploy.yaml` host  
4. Bump `version` + `versionCode` in `frontend/app.json`  
5. Push to `main` → wait for APK artifact  
6. Distribute APK / Play update  
7. Smoke test login + create mating/animal  
