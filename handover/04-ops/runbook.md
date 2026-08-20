# Operations Runbook

## 1) App cannot login / “cannot reach server”

1. Open `http://<PUBLIC_IP>/` in browser — should say `GoatBook API Running`  
2. Open `http://<PUBLIC_IP>/api/test-db` — should be `connected`  
3. If timeout:
   - EC2 running?  
   - Public IP same as app’s `RENDER_URL`?  
   - Security Group port 80 open?  
   - `docker ps` shows `goatbook-api`?  
4. If API up but login `Invalid credentials` → password issue (not infra)  
5. If `402` → subscription/trial expired  

## 2) Mating / animals not saving

Usually same as (1): API unreachable or wrong farm header / expired subscription.

Check:

- User selected a farm after login  
- Backend logs: `docker logs goatbook-api --tail 200`  
- Network errors vs `500` with Prisma message  

## 3) After EC2 stop/start

1. Read new Public IPv4 from AWS console  
2. Update API URL + deploy host  
3. Rebuild APK  
4. Prefer attaching Elastic IP so this never repeats  

## 4) Backend container crash loop

```bash
docker logs goatbook-api --tail 300
# common: bad DATABASE_URL, RDS SG blocked, prisma/env missing
```

Confirm RDS is `Available` and SG allows EC2 → 5432.

## 5) Redeploy without waiting for CI

SSH to EC2:

```bash
cd ~/GoatBook-App
git pull origin main
docker stop goatbook-api || true
docker rm -f goatbook-api || true
docker build -t goatbook-backend ./backend
docker run -d --name goatbook-api --network host --restart unless-stopped \
  --env-file ~/GoatBook-App/backend/.env -e NODE_ENV=production goatbook-backend
```

## 6) Forgot password emails not arriving

1. Resend dashboard delivery logs  
2. Confirm verified domain + production From address  
3. Check recipient spam  
4. Phone-only users will not get email  
