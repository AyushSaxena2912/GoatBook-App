# System Architecture

```text
┌─────────────────────┐         HTTP :80 /api
│  Android App        │ ──────────────────────┐
│  (Expo / RN)        │                       │
│  com.goatwala.farm  │                       ▼
└─────────────────────┘              ┌─────────────────┐
         │ uploads                   │  AWS EC2         │
         │ (images)                  │  goatbook-backend│
         ▼                           │  Docker host     │
┌─────────────────────┐              │  Node :5001      │
│  Cloudinary         │              └────────┬────────┘
└─────────────────────┘                       │ Prisma
                                              ▼
                                     ┌─────────────────┐
                                     │  AWS RDS         │
                                     │  PostgreSQL      │
                                     │  eu-north-1      │
                                     └─────────────────┘

Also: Resend (email), Cashfree (payments), Expo push notifications
```

## Request auth model

1. Client logs in → receives JWT  
2. Client stores token + selected `farmId` (SecureStore)  
3. Every API call sends:
   - `Authorization: Bearer <token>`
   - `X-Farm-ID: <farmUuid>` (when a farm is selected)
4. `backend/middleware/auth.js` validates user, farm membership, subscription expiry

## Multi-tenancy

Almost all business data is scoped by `farm_id`. Never query/update across farms without membership checks.

## Deploy flow

```text
git push main
   ├─ backend/**  → Deploy Backend workflow → SSH EC2 → docker rebuild
   └─ frontend/** → Build APK workflow → signed artifact on Actions
```
