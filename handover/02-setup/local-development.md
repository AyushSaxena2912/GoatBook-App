# Local Development Setup

## Prerequisites

- Node.js **≥ 20**
- npm
- Docker (optional, for local backend parity)
- Expo / Android Studio (for mobile)
- Access to RDS (or a local Postgres) via `DATABASE_URL`

## 1) Backend

```bash
cd backend
cp .env.example .env   # if example exists; otherwise create .env manually
# fill DATABASE_URL, JWT_SECRET, etc. (see environment-variables.md)
npm install
npm run build          # prisma generate + fix-enum + db push
npm run dev            # nodemon on PORT (default 5001)
```

Health checks:

- `http://localhost:5001/`
- `http://localhost:5001/api/test-db`

### Docker (same as production style)

```bash
# from repo root
docker compose up --build
# or on EC2 style:
docker build -t goatbook-backend ./backend
docker run --rm -p 5001:5001 --env-file ./backend/.env -e NODE_ENV=production goatbook-backend
```

## 2) Frontend (Expo)

```bash
cd frontend
npm install
npx expo start
```

API URL is hardcoded in:

`frontend/src/api/index.js` → `RENDER_URL`

For local API testing, temporarily point it to your machine IP / localhost (emulator nuances apply).

Android package: `com.goatwala.farm`  
Config: `frontend/app.json`

## 3) Useful scripts

| Command | Where | What |
|---------|-------|------|
| `npm run dev` | backend | Local API with nodemon |
| `npm start` | backend | Production-style node server |
| `npm run build` | backend | Prisma generate + enum fix + `db push` |
| `npx expo start` | frontend | Dev client |
| GitHub Action | CI | Signed release APK |

## 4) Do not commit

- `backend/.env`
- Android keystore / passwords
- Real API keys
- `logs.zip` / local dumps with PII if sharing publicly
