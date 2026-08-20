# AWS Infrastructure

## Region

**Always use `eu-north-1` (Europe – Stockholm).**

## Inventory

| Resource | Details |
|----------|---------|
| EC2 | `goatbook-backend` · `i-05b4c1aaaf39f73b1` · `t3.micro` |
| Public IP (5 Aug 2026) | `13.60.172.93` |
| Private IP | `172.31.33.175` |
| Elastic IP | None — **attach ASAP** |
| RDS | `goatbook-db....eu-north-1.rds.amazonaws.com` |
| VPC / Subnet | See EC2 console (same region) |

## Security Group inbound (minimum)

| Port | Reason |
|------|--------|
| 22 | SSH deploy / admin |
| 80 | App traffic (Android → API) |
| 5001 | Optional direct Node access / debug |

RDS SG must allow PostgreSQL (**5432**) from the EC2 security group.

## Runtime on EC2

- Repo path: `~/GoatBook-App`
- Container name: `goatbook-api`
- Network mode: `host`
- Restart policy: `unless-stopped`
- Env file: `~/GoatBook-App/backend/.env`

Useful SSH commands:

```bash
docker ps
docker logs -f goatbook-api --tail 200
curl http://127.0.0.1:5001/
curl http://127.0.0.1:5001/api/test-db
```

## Cost / ops tips

- Stopped EC2 without Elastic IP → new public IP → app outage  
- Keep Elastic IP associated while instance is running (free when attached)  
- Prefer domain → Elastic IP for stable API hostname  
