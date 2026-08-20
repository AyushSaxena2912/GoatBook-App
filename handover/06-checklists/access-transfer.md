# Access Transfer Checklist

Fill this during handover. Store actual secrets in a password manager — **not** in git.

## Accounts / ownership

| System | Account / URL | Transferred? | New owner email |
|--------|---------------|--------------|-----------------|
| AWS Console | (account ID / IAM) | ☐ | |
| GitHub repo | AyushSaxena2912/GoatBook-App | ☐ | |
| GitHub Actions secrets | repo Settings → Secrets | ☐ | |
| Resend | resend.com | ☐ | |
| Cloudinary | cloudinary.com | ☐ | |
| Cashfree | merchant dashboard | ☐ | |
| Domain / DNS (if any) | | ☐ | |
| Google Play Console (if any) | | ☐ | |
| Expo account (if used) | | ☐ | |

## Secrets package (encrypted transfer)

| Secret | Received? | Location after transfer |
|--------|-----------|-------------------------|
| EC2 SSH private key | ☐ | |
| `backend/.env` full file | ☐ | |
| RDS master / app DB password | ☐ | |
| `JWT_SECRET` | ☐ | |
| `RESEND_API_KEY` | ☐ | |
| Cloudinary keys + unsigned preset ownership | ☐ | |
| Cashfree app id/secret | ☐ | |
| Android `release.keystore` + passwords + alias | ☐ | |
| GitHub `EC2_SSH_KEY` + Android secrets | ☐ | |

## Verify after transfer

- [ ] Can SSH to EC2  
- [ ] Can open AWS EC2 + RDS consoles in `eu-north-1`  
- [ ] Can push to GitHub `main`  
- [ ] Can trigger/deploy Actions  
- [ ] Can download latest APK artifact  
- [ ] Login works on production API  
- [ ] Can send a test Resend email  
- [ ] Can upload a test image to Cloudinary  
