# SafeWorkGlobal — What Is Wrong, In Simple Language

**Date:** 16 September 2026  
**Source:** [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md)  
**Question:** What should we do now? Should we follow the 24-hour plan?  
**Answer:** **Yes. Do the 24-hour plan first. Do not launch paid worker journeys until those items are done.**

This note is for product, ops, and engineering. It does not replace the technical audit.

---

## What to do now

1. **Do not go live with real payments or treat the worker journey as “secure” yet.** The website can stay up for marketing, but the paid GCC path is not safe.
2. **Start the 24-hour plan today.** It only covers the issues that can lose money, wipe files, or create fake admin/worker accounts.
3. **Do not start a big rewrite.** Do not change login to cookies. Do not rebuild the backend. Do not “turn the old safety bypass back on” without a careful allow-list.
4. **After the 24-hour work, smoke-test**, then do the 48-hour items (OTP on the server, webhooks, live Razorpay keys, interviewer fix).

The 24-hour plan is the right next step because it is small, high-impact, and mostly database/API locks — not a redesign.

---

## Launch status

| Area | Status |
|------|--------|
| Public website / about / jobs listing | Can stay online |
| Worker signup, payment, GCC journey | **Blocked** |
| Taking real money on Razorpay | **Blocked** (also still on test keys) |
| Partner / admin portals | Use with caution until blockers are closed |

---

## Must fix in the next 24 hours

These are the current **show-stoppers**.

### 1. A worker can skip paying

**In simple terms:** The app is supposed to make workers pay, interview, and pass tests before bond. A worker who knows how to call the database can jump straight to the bond step and skip payment.

**Why it matters:** People can complete the journey without paying ~₹35,400.

**24-hour action:** Stop workers from setting their stage to `bond` (and other paid/staff-only stages) themselves.

---

### 2. One payment can unlock many accounts

**In simple terms:** After someone pays on Razorpay, another account can reuse that same payment ID and get marked as paid without paying again.

**Why it matters:** One real payment could unlock many free journeys.

**24-hour action:** Only accept a payment that belongs to **that worker’s own order**, for the **correct amount**, and never reuse a payment ID.

---

### 3. Anyone might be able to delete all uploaded files

**In simple terms:** There is an internal “empty the storage buckets” function. It does not properly check that an admin asked for this. The public website key may be enough to call it.

**Why it matters:** Passports, photos, videos, and assessment evidence could all be wiped.

**24-hour action:** Turn this function off in production. Confirm it returns “not allowed” / “not found”.

---

### 4. A logged-in user might be able to create an admin

**In simple terms:** An old “create demo users” tool is still callable by any logged-in person. It can create an admin account.

**Why it matters:** Someone could take over the whole platform.

**24-hour action:** Turn that tool off for normal users.

---

### 5. Accounts can be created without proving the phone OTP on the server

**In simple terms:** Signup is supposed to require a real SMS OTP. The server currently trusts the app when it says “OTP already done.” Anyone can create a fully confirmed worker or partner account, and can also mark a phone as “already taken.”

**Why it matters:** Fake workers/partners; real people’s phone numbers can be blocked.

**24-hour action:** Stop public access to those create-account shortcuts. Full “OTP checked on the server” can finish in 48 hours, but lock the hole now.

---

### 6. Production Razorpay is still in test mode

**In simple terms:** The live website still uses Razorpay test keys. Checkout shows TEST MODE. Customers are not actually charged.

**Why it matters:** You cannot collect real fees. Switching keys later without fixing payment reuse (item 2) is also dangerous.

**24-hour action:** Decide: stay on test keys until payments are locked, **then** switch to live keys. Do not switch keys before item 2 is fixed.

---

### Extra 24-hour locks (do these in the same pass)

| Issue | In simple terms | Action |
|-------|-----------------|--------|
| Hidden “skip payment / skip interview” buttons | The website hides them on production, but the server shortcuts still exist | Turn the server shortcuts off |
| Anyone can tick “my mobile is verified” | The bind-mobile screen can be skipped in the database | Block users from setting that flag themselves |
| Anyone without a role can pick “interviewer” | Interviewer is a staff role | Only allow worker / employer / partner as self-serve roles |
| OTP “dev bypass” on the server | A leftover switch can skip SMS if it was left on | Confirm it is off in production |

**Do not** turn the old “verification bypass” flag back on while doing this. That flag is how skip-payment used to work. Restoring it would reopen the hole.

---

## Should wait until 48 hours (not 24-hour blockers)

These are real, but they should not delay the emergency locks above.

| Issue | In simple terms |
|-------|-----------------|
| No Razorpay webhook | If the user closes the browser after paying, the app may not mark them paid until they click “Sync”. Fix payment reuse first, then add a webhook. |
| Fee shopping | A worker might switch to a cheaper job before paying. Freeze the fee when the order is created. |
| Interviewer scoring may be broken | Non-admin interviewers may be unable to record a decision. Admins can still do it for a few days. |
| Anyone logged in can send emails | If Resend is connected, this can be used for spam. Lock it. |
| Contact form has no rate limit | Can flood the inbox. |
| Partner kiosk saves login tokens in the browser | Risky on a shared computer. |
| KYC links last a year | A leaked document link stays valid too long. |
| Old Express worker API | Dangerous **if** it is on the public internet. Confirm it is not. |
| No monitoring / no CI | Bugs will ship unnoticed. Add after the locks. |
| Security headers (CSP, HSTS) | Hardening, not the first fire. |

---

## What is already in good shape

You do **not** need to rebuild these:

- Users cannot make themselves **admin** through the normal signup screen.
- Admins cannot promote someone else to admin through the usual admin tool.
- The website cannot simply say “I paid” and have the database believe it (the payment mark is supposed to come from the server).
- Razorpay **order amount** is set on the server, not typed by the user. The secret key is not in the frontend.
- A partner can pay for a worker only if they actually manage that worker.
- Employers cannot publish jobs or change the service fee themselves.
- Profiles are not open to the anonymous public.
- Password-reset links cannot send people to a random evil website.
- Production website already hides the “skip journey” buttons and the local OTP bypass in the **browser**. (The **server** holes still need closing.)

---

## 24-hour plan (do this, in this order)

1. Turn off / delete **purge-storage** in production.
2. Turn off **seed demo users**, **skip payment**, **skip interview**, and **create account without server OTP** for normal users.
3. Stop workers jumping to **bond**.
4. Lock Razorpay so a payment only counts for that worker’s order, that amount, and cannot be reused.
5. In the dashboard: confirm OTP bypass is off. Do **not** switch to live Razorpay keys until step 4 is done.
6. Stop users from ticking “mobile verified” themselves. Stop self-assigning the interviewer role.
7. Recheck: purge-storage is dead; a worker cannot jump to bond; a worker cannot seed an admin.

Then do a short smoke test:

- Sign up as a worker.
- Confirm you **cannot** skip to bond.
- Pay with **test** keys (until live keys are intentionally switched).
- Confirm only a real capture for **your** order unlocks the next stage.
- Confirm a second account **cannot** reuse that payment.

---

## 48-hour plan (after the locks hold)

1. Check OTP on the **server** when creating accounts.
2. Freeze the fee when the Razorpay order is created.
3. Add a Razorpay webhook so payment still works if the browser closes.
4. Switch to **live** Razorpay keys if you want real money. Confirm Checkout is not in TEST MODE.
5. Fix interviewer scoring **without** turning skip-payment back on.
6. Lock the email-sending function; slow down the contact form.
7. Shorten KYC download links.
8. Confirm the old Express API is not public.
9. Add basic error monitoring.

---

## Simple decision

| If you want to… | Then… |
|-----------------|--------|
| Keep the marketing site up | Fine |
| Let workers pay and complete GCC | **Finish the 24-hour plan first** |
| Collect real money | 24-hour plan **plus** live Razorpay keys **plus** (ideally) webhook |
| Rebuild the app | **No.** That is slower and riskier than locking the holes |

**Recommendation:** Proceed with the 24-hour plan immediately. Treat it as production-blocking security work, not a feature sprint.
