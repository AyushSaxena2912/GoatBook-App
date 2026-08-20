# Day-of Handover Checklist

Use this on the handover call / meeting.

## A. Walkthrough (outgoing → incoming)

- [ ] Product demo (login → farm select → add animal → mating → vaccination)  
- [ ] Show AWS EC2 + RDS in `eu-north-1`  
- [ ] Show Docker container healthy (`docker ps`, health URLs)  
- [ ] Show GitHub Actions (deploy + APK)  
- [ ] Show where `.env` lives on EC2  
- [ ] Explain IP risk + Elastic IP recommendation  
- [ ] Share this handover folder + encrypted secrets pack  

## B. Incoming team proves access

- [ ] SSH into EC2 successfully  
- [ ] Hit `/` and `/api/test-db` from laptop  
- [ ] Clone repo and run backend locally (or at least `npm install`)  
- [ ] Confirm GitHub admin/write access  
- [ ] Confirm AWS IAM access  

## C. Smoke tests on production

- [ ] Login with a known test/owner account  
- [ ] Create/read one animal record on a test farm (or agreed farm)  
- [ ] Create one mating record  
- [ ] Forgot-password email test (to a controlled inbox)  

## D. Sign-off

| Role | Name | Date | Signature / OK |
|------|------|------|----------------|
| Outgoing tech owner | | | |
| Incoming tech owner | | | |
| Client / business owner | | | |

**Notes / open items:**

-
-
-
