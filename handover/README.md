# GoatBook — Project Handover Pack

**Product:** GoatBook (Goat Farm Management)  
**Prepared:** 5 Aug 2026  
**Audience:** Client / new technical owner / support team  
**Repo:** `AyushSaxena2912/GoatBook-App`

Read this folder **in order** if you are taking over the project.

---

## Start here (15 minutes)

1. Read [01-overview/project-summary.md](01-overview/project-summary.md)  
2. Read [01-overview/current-live-status.md](01-overview/current-live-status.md)  
3. Complete [06-checklists/access-transfer.md](06-checklists/access-transfer.md) with the outgoing team  
4. Complete [06-checklists/day-of-handover.md](06-checklists/day-of-handover.md)

---

## Folder map

```
handover/
├── README.md                          ← you are here
├── 01-overview/                       ← what the product is + live snapshot
├── 02-setup/                          ← run locally (frontend + backend)
├── 03-architecture/                   ← system design, API, DB, app structure
├── 04-ops/                            ← AWS, deploy, CI/CD, runbooks, issues
├── 05-data/                           ← live farm report (CSV/JSON/MD)
└── 06-checklists/                     ← access + handover signing checklists
```

| Path | Use when… |
|------|-----------|
| [01-overview/project-summary.md](01-overview/project-summary.md) | Explaining the product to business/tech |
| [01-overview/current-live-status.md](01-overview/current-live-status.md) | Checking what’s live right now |
| [02-setup/local-development.md](02-setup/local-development.md) | Setting up laptop to develop |
| [02-setup/environment-variables.md](02-setup/environment-variables.md) | Configuring `.env` (names only) |
| [03-architecture/system-architecture.md](03-architecture/system-architecture.md) | Understanding how pieces connect |
| [03-architecture/backend-api.md](03-architecture/backend-api.md) | Working on API modules |
| [03-architecture/frontend-app.md](03-architecture/frontend-app.md) | Working on Android/Expo app |
| [03-architecture/database.md](03-architecture/database.md) | Schema / Prisma / RDS |
| [04-ops/aws-infrastructure.md](04-ops/aws-infrastructure.md) | EC2 / RDS / networking |
| [04-ops/deployment-cicd.md](04-ops/deployment-cicd.md) | Deploy backend or build APK |
| [04-ops/third-party-services.md](04-ops/third-party-services.md) | Resend / Cloudinary / Cashfree |
| [04-ops/runbook.md](04-ops/runbook.md) | Fixing common outages |
| [04-ops/known-issues-roadmap.md](04-ops/known-issues-roadmap.md) | Risks + recommended next work |
| [05-data/farms-report.md](05-data/farms-report.md) | Client farm usage report |
| [05-data/farms.csv](05-data/farms.csv) | Excel export |
| [06-checklists/access-transfer.md](06-checklists/access-transfer.md) | Transfer accounts & keys |
| [06-checklists/day-of-handover.md](06-checklists/day-of-handover.md) | Final sign-off |

---

## Important rules

- This pack **does not contain passwords / private keys / `.env` values**.  
- Secrets must be transferred separately via a secure channel (password manager / encrypted zip).  
- Always work in AWS region **`eu-north-1` (Stockholm)**.
