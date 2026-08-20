# Database (Prisma + RDS)

## Connection

- Provider: PostgreSQL  
- Hosted: AWS RDS in `eu-north-1`  
- Client: Prisma (`backend/prisma/schema.prisma`)  
- Runtime config: `backend/config/prisma.js` (adds connect_timeout)

## Core models

| Model | Purpose |
|-------|---------|
| `users` | Login identity |
| `employees` | Role profile linked to user |
| `farms` | Tenant |
| `farm_employees` | Membership |
| `animals` | Livestock |
| `breeds` | Per-farm breeds |
| `locations` | Farm pens/areas |
| `weights` | Weight logs |
| `vaccines` / `vaccination_records` / `vaccination_schedules` | Vaccination |
| `matings` | Mating records |
| `breedings` | Delivery / kids |
| `subscriptions` | Plan + trial/expiry |
| `transactions` | Farm finances |
| `animal_transactions` | Animal sale/death style events |
| `feedFormulation` / `formulationIngredients` | Feed |
| `reminders` | Notification reminders |

## Enums worth knowing

- Animal status: `LIVE | SOLD | DEAD`  
- Female condition: `PREGNANT | NONE | KID | EMPTY`  
- Mating type: `NATURAL | AI | ET`  
- Mating status: `NOT_SUCCESSFUL | PREGNANT | MISCARRIAGE`  
- Plans: `BASIC | STANDARD | ADVANCED | ULTIMATE`

## Schema change caution

Production container start runs:

```bash
npx prisma db push --accept-data-loss
```

Prefer reviewed migrations for production-critical changes. There is also `backend/prisma/fix-enum.js` for historical `MATED` → `PREGNANT` cleanup.

## ERD

See `backend/ERD.md` in the repo for a diagram snapshot.
