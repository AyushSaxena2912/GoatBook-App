# Known Issues & Roadmap

## P0 — Stabilize API hostname

**Problem:** EC2 public IP changes without Elastic IP → apps break.  

**Do this first:**

1. Allocate + associate Elastic IP  
2. Buy/point domain `api.<domain>` → Elastic IP  
3. Put API URL as domain in app (one APK)  
4. Add HTTPS (Let’s Encrypt / Cloudflare / ALB) before Play Store  

## P1 — Production email

- Replace `onboarding@resend.dev`  
- Verify sending domain on Resend  
- Optional: SMS for phone-only forgot-password  

## P1 — Payments

- Cashfree still sandbox in app  
- Move to live credentials when billing goes live  

## P2 — Play Store

Benefits: no WhatsApp APK distribution for users.  

Still need builds for feature releases.  
Does **not** alone fix IP changes — domain does.

## P2 — Data hygiene

- Duplicate-looking farms (e.g. two Gokulagronomics entries)  
- Many trial farms with 0 animals — decide retention policy  

## P3 — Engineering hardening

- Replace `prisma db push --accept-data-loss` with proper migrations for prod  
- Move Cloudinary/API URLs to env config  
- Restrict CORS if needed  
- Add monitoring/alerts (EC2 status, disk, container health)  
