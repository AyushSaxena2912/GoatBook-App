# Project Summary

## What is GoatBook?

GoatBook is an **Android mobile app** for goat farm owners and staff to manage day-to-day livestock operations:

- Animals (tags, status, photos)
- Mating & breeding
- Vaccinations (single + mass)
- Weights & farm locations
- Employees
- Finances / receipts
- Feed formulations
- Subscriptions / trial plans
- Push notifications

## Who uses it?

| Role | Access |
|------|--------|
| OWNER | Full farm control (created on registration) |
| EMPLOYEE / MANAGER / etc. | Farm-scoped access via `farm_employees` |

Multi-farm users select a farm after login (`X-Farm-ID` header).

## High-level stack

| Layer | Tech |
|-------|------|
| Mobile | React Native + Expo SDK 54 · package `com.goatwala.farm` |
| API | Node.js 20 + Express 5 |
| DB | PostgreSQL on **AWS RDS** (Prisma ORM) |
| Host | **AWS EC2** `t3.micro` · Docker · region `eu-north-1` |
| CI/CD | GitHub Actions (deploy backend + build signed APK) |
| Email | Resend (forgot password) |
| Images | Cloudinary (unsigned upload preset) |
| Payments | Cashfree (subscriptions; currently sandbox mode in app) |

## Repo layout

```
GoatBook-App/
├── backend/          # Express API + Prisma
├── frontend/         # Expo React Native app
├── .github/workflows # deploy.yaml, build-apk.yaml
├── scripts/          # helpers (e.g. sync-ip.js)
└── docker-compose.yml
```

## Business notes

- Registration creates: User → Employee (OWNER) → Farm → Subscription (trial default) → seed breeds/vaccines/formulation.
- Trial / subscription expiry is gated in auth middleware (`402` when expired).
- Most registered farms are low-usage; a few farms hold almost all animal data (see `05-data/`).
