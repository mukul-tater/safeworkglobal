# GigBridge Mobile (React Native CLI)

Native iOS and Android app for **SafeWork Global / GigBridge**, mirroring the web app's portals:

- **Public** — Home, job search, job details, auth
- **Worker** — Dashboard, applications, documents, contracts, payments, messaging, and more
- **Employer** — Dashboard, post/manage jobs, applications, interviews, escrow, compliance
- **Admin** — User management, verification, disputes, reports
- **E-Mitra Partner** — Worker registration, compliance, notifications

Built with **React Native CLI** (not Expo), TypeScript, React Navigation, and Supabase.

## Prerequisites

- Node.js 22+
- Xcode (iOS)
- Android Studio + SDK (Android)
- CocoaPods (`gem install cocoapods`)

## Setup

```sh
cd mobile
npm install

# Copy Supabase credentials from the web app
cp .env.example .env
# Edit .env:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key

# iOS native deps
cd ios && bundle install && bundle exec pod install && cd ..
```

## Run

```sh
# Start Metro
npm start

# Android
npm run android

# iOS
npm run ios
```

## Project structure

```
mobile/
├── src/
│   ├── components/     # Shared UI + DataListScreen
│   ├── config/         # Navigation menus per portal
│   ├── contexts/       # AuthContext (Supabase)
│   ├── integrations/   # Supabase client + types
│   ├── lib/            # Utils (salary formatting, etc.)
│   ├── navigation/     # Root, public tabs, portal drawers
│   ├── screens/        # Feature screens by role
│   └── theme/          # Colors
├── android/            # React Native CLI Android project
└── ios/                # React Native CLI iOS project
```

## Feature parity

| Portal | Screens |
|--------|---------|
| Public | Home, Jobs, Job Detail, Auth, About, Contact, Privacy, Terms |
| Worker | 20+ screens (dashboard, profile, applications, contracts, travel, etc.) |
| Employer | 18+ screens (dashboard, post job, manage jobs, applications, escrow, etc.) |
| Admin | 19 screens (users, verification, disputes, compliance, etc.) |
| Partner | 5 screens (dashboard, workers, register, notifications, compliance) |

Screens load live data from the same Supabase tables as the web app. Dashboards and forms (job apply, post job, register worker) are fully interactive.

## Notes

- Uses the same Supabase backend as the Vite web app in the repo root.
- Role-based navigation: after login, users are routed to Worker / Employer / Admin / Partner drawers.
- New users without a role see the role selection screen.
