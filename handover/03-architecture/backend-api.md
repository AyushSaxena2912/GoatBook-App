# Backend API

## Entry

- File: `backend/server.js`
- Default port: `5001` (`PORT` env)
- Binds: `0.0.0.0`
- CORS: open (all origins)

## Route mount points

| Prefix | Module folder |
|--------|----------------|
| `/api/auth` | `modules/auth` |
| `/api/users` | `modules/users` |
| `/api/breeds` | `modules/breeds` |
| `/api/animals` | `modules/animals` |
| `/api/locations` | `modules/locations` |
| `/api/weights` | `modules/weights` |
| `/api/farms` | `modules/farms` |
| `/api/vaccines` | `modules/vaccines` |
| `/api/reports` | `modules/reports` |
| `/api/transactions` | `modules/animals` (animal sale/death style txs) |
| `/api/matings` | `modules/matings` |
| `/api/breedings` | `modules/breedings` |
| `/api/subscriptions` | `modules/subscriptions` |
| `/api/analytics` | `modules/analytics` |
| `/api/notifications` | `modules/notifications` |
| `/api/formulations` | `modules/feedFormulation` |
| `/api/finances` | `modules/transactions` |

Diagnostics:

- `GET /` — health string  
- `GET /api/test-db` — Prisma `SELECT 1`

## Auth highlights

| Endpoint | Notes |
|----------|-------|
| `POST /api/auth/register` | Creates user + owner employee + farm + subscription + seeds |
| `POST /api/auth/login` | Email **or** phone + password |
| `POST /api/auth/forgot-password` | 6-digit code via Resend (email users) |
| `POST /api/auth/reset-password` | Verify code + set new password |

## Docker runtime

- `backend/Dockerfile` (Node 20 Alpine)
- `CMD`: `npm run build && npm start`
- `npm run build` runs `prisma db push --accept-data-loss` — **be careful in production schema changes**

## Key middleware

`backend/middleware/auth.js`

- JWT verify  
- Load user + employee  
- Block terminated employees  
- Validate farm membership  
- Block expired subscriptions (`402`) except subscription/profile paths  
