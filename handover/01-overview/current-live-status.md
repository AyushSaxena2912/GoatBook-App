# Current Live Status (as of 5 Aug 2026)

## Snapshot

| Item | Value |
|------|-------|
| AWS region | `eu-north-1` (Stockholm) |
| EC2 name | `goatbook-backend` |
| Instance type | `t3.micro` |
| Public IPv4 | **`13.60.172.93`** |
| Elastic IP | **Not attached** ⚠️ |
| API base (app) | `http://13.60.172.93/api` |
| Health | `GET http://13.60.172.93/` → `GoatBook API Running` |
| DB check | `GET http://13.60.172.93/api/test-db` → connected |
| App version | `1.2.0` (versionCode `12`) |
| Farms in RDS | **32** |
| Animals in RDS | **137** |

## Latest APK

- Actions run: https://github.com/AyushSaxena2912/GoatBook-App/actions/runs/30934863040  
- Artifact: https://github.com/AyushSaxena2912/GoatBook-App/actions/runs/30934863040/artifacts/8903443362  

## Verified on this IP

- API responds 200  
- RDS connectivity OK  
- Login for `goatwala@gmail.com` works against this backend  

## Risk flag

Public IP is **ephemeral**. If EC2 is stopped/started without Elastic IP, IP changes and **all installed apps break** until a new APK is released (or domain/Elastic IP is used).

See: [../04-ops/known-issues-roadmap.md](../04-ops/known-issues-roadmap.md)
