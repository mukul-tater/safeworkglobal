# SafeWork Global Mobile (React Native CLI)

Native iOS and Android app for **SafeWork Global**, sharing the same Supabase backend as the web portal.

## What’s included

- **Public** — Home, job search, job details, auth (email or mobile login)
- **Worker** — Bottom tabs (Home / Jobs / Journey / Applications / More), GCC journey essentials + KYC, profile editor, document upload, gated job apply, messaging inbox, bind-mobile OTP
- **Employer** — Bottom tabs (Home / Jobs / Post / Hiring / More), enriched post-job form, messaging
- **Admin / Partner** — Drawer portals with live list screens; partner register worker with OTP

## Prerequisites

- Node.js 22+
- Xcode (iOS) / Android Studio (Android)
- CocoaPods (`gem install cocoapods`)
- Backend API running if you need MSG91 OTP (`API_BASE_URL`)

## Setup

```sh
cd mobile
npm install
cp .env.example .env
# Fill SUPABASE_URL, SUPABASE_ANON_KEY, optional API_BASE_URL

cd ios && bundle install && bundle exec pod install && cd ..
```

**Never commit `.env`.** Rotate keys if they were previously committed.

## Run

```sh
npm start
npm run android   # or npm run ios
```

## Deep links

Custom scheme: `safeworkglobal://jobs/<jobId>`

## Honest parity notes

Mobile mirrors core worker/employer flows. Some web-only surfaces (full quiz CMS, Razorpay native checkout, SSVN/SRN/SEN partner networks, interviewer queue, admin journey-ops) still lean on the web portal; journey progress syncs via shared Supabase tables.

## Project structure

```
mobile/src/
  components/   UI + DataListScreen + ErrorBoundary
  config/       env + navigation menus
  contexts/     Auth + Network
  hooks/        useWorkerJobAccess
  integrations/ Supabase client + types
  lib/          auth email helpers, OTP API, portal access
  navigation/   root + role navigators (tabs + drawers)
  screens/      public / worker / employer / admin / partner
  services/     verificationService (GCC journey)
  theme/        colors, spacing, typography
```
