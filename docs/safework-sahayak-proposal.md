# SafeWork Sahayak — AI Voice Platform Proposal

**Product:** SafeWorkGlobal / GigBridge  
**Document:** Technical & Product Proposal  
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft for review

---

## Executive Summary

SafeWorkGlobal today serves Indian workers seeking verified overseas (GCC) employment through a web-based worker portal. That model works for literate, digitally comfortable users — roughly **2–5%** of the target population. The remaining **95%+** cannot reliably navigate websites, read long instructions, or complete multi-step forms on a smartphone.

**SafeWork Sahayak** is a **separate AI-enabled platform** — not an add-on to the current dashboard — where workers interact by **voice and WhatsApp**, not by reading and clicking. The platform listens, understands Hindi/Hinglish, acts on the worker’s behalf (profile updates, job matching, next-step guidance), and responds in **short audio or simple yes/no choices**.

> **Product motto:** *People are smart, not phones. The platform must be smart — not the user.*

This proposal recommends building Sahayak as an independent product surface (`safework-sahayak`) connected to the existing GigBridge core via a secure API bridge. Estimated MVP timeline: **8–10 weeks**. Estimated MVP operating cost: **₹0–15,000/month** at pilot scale (500–1,000 workers), using free tiers and Indian AI infrastructure credits.

---

## 1. Problem Statement

### 1.1 Who we serve

| Segment | Estimated share | Current platform fit |
|---------|-----------------|----------------------|
| Literate, app-comfortable workers | 2–5% | Good — web portal, forms, dashboard |
| Semi-literate, WhatsApp-only users | 40–50% | Poor — too much reading required |
| Low-literacy, voice-first users | 45–55% | **Fails** — navigation and text are barriers |

### 1.2 Why the current `/home` dashboard is insufficient

The Phase-1 worker dashboard (`/home`) assumes users can:

- Understand dashboard concepts (stats, completion %, cards)
- Read Hindi and English subtitles
- Choose among multiple links and actions
- Self-navigate onboarding across several screens

For users comparable to **uneducated grandparents** using a smartphone, this is equivalent to handing them a form in a language they barely read. The device is not the problem — **the interface expects skills most workers do not have**.

### 1.3 Business impact of inaction

- High drop-off during registration and onboarding
- Low skill-media upload rates (employers cannot shortlist)
- Support burden on WhatsApp and e-Mitra partners
- Platform growth capped at the literate minority
- Competitive disadvantage vs. agents who offer human, in-person help

---

## 2. Vision & Product Principles

### 2.1 Vision

Every Indian worker — regardless of education — can find overseas work by **speaking** to SafeWork, the same way they would ask a trusted person for help.

### 2.2 Design principles

| Principle | Meaning |
|-----------|---------|
| **Platform pushes, user doesn’t hunt** | Jobs and reminders come to WhatsApp/voice — not “open the app and browse” |
| **Voice first, text optional** | Mic is the primary UI; text is for the 2–5% who prefer it |
| **One thing at a time** | One question, one action, one audio reply — never a wall of text |
| **Pictures over paragraphs** | Country flags, trade icons, ✅/❌ — not menus |
| **Do it for them** | Infer, pre-fill, and act — don’t teach website navigation |
| **Human fallback always** | WhatsApp and e-Mitra partners remain available |
| **Separate product** | Sahayak is not mixed into the literate-user web portal |

### 2.3 North-star experience

> *“Worker ko website padhni nahi — platform unki sunegi aur unke liye kaam karegi.”*  
> Workers should not have to read the website — the platform listens and works for them.

---

## 3. Proposed Solution: SafeWork Sahayak

### 3.1 What Sahayak is

A **standalone AI assistant platform** with three worker-facing channels:

| Channel | Description | Primary audience |
|---------|-------------|------------------|
| **Sahayak PWA** | Installable web app — one screen, big mic button | Smartphone users |
| **WhatsApp bot** | Voice notes + simple buttons in WhatsApp | All workers (familiar UI) |
| **e-Mitra assisted mode** | Partner speaks/registers on behalf of worker | In-person, lowest-literacy users |

### 3.2 What Sahayak is not

- Not a chat widget on `/home`
- Not a redesign of the existing worker dashboard
- Not a replacement for the core employer, admin, or partner portals
- Not a legal/visa advisory bot (guidance only, with disclaimers)

### 3.3 Core capabilities (by phase)

| Capability | Phase 1 (MVP) | Phase 2 | Phase 3 |
|------------|---------------|---------|---------|
| Hindi/Hinglish voice in → voice out | ✅ | ✅ | ✅ |
| “Profile kitna complete hai?” | ✅ | ✅ | ✅ |
| Voice onboarding (replace forms) | Partial | ✅ | ✅ |
| Job match → 1 recommended job | ✅ | ✅ | ✅ |
| WhatsApp voice note handling | ✅ | ✅ | ✅ |
| Proactive job alerts (WhatsApp) | — | ✅ | ✅ |
| Skill video quality tips | — | ✅ | ✅ |
| Missed-call / IVR callback | — | — | ✅ |
| Regional languages beyond Hindi | — | Partial | ✅ |

---

## 4. Architecture

### 4.1 Separation from GigBridge core

```
┌──────────────────────────────────────────────────────────────────┐
│                     WORKER-FACING SURFACES                        │
├─────────────────────────────┬────────────────────────────────────┤
│  GIGBRIDGE CORE (existing)  │  SAFEWORK SAHAYAK (new)            │
│  ─────────────────────────  │  ──────────────────────            │
│  safeworkglobal.com         │  voice.safeworkglobal.com        │
│  /home, /onboarding, /jobs  │  OR installable PWA tab            │
│  Text-heavy web portal      │  Mic + WhatsApp only               │
│  Employers, admins, partners│  Workers (95%+)                    │
└──────────────┬──────────────┴──────────────────┬─────────────────┘
               │                                  │
               └──────── Internal REST API ───────┘
                    (phone-linked identity)
```

### 4.2 System components

```
Worker (voice / WhatsApp)
        │
        ▼
┌───────────────────┐
│  Channel Gateway  │  PWA WebSocket / WhatsApp webhook
└─────────┬─────────┘
          ▼
┌───────────────────┐
│   Orchestrator    │  Conversation state machine (LangGraph or custom)
│   (FastAPI)       │  Intent → action → response
└─────────┬─────────┘
          │
    ┌─────┼─────┬─────────────┐
    ▼     ▼     ▼             ▼
  STT   LLM   TTS      GigBridge Internal API
 (Sarvam) (Gemini) (Sarvam)  (profile, jobs, onboarding)
    │                       │
    └──── Redis sessions ───┘
              │
         Supabase (logs, media metadata)
```

### 4.3 Integration contract (GigBridge core)

Sahayak **reads and writes** via a new internal API on the existing Express backend. No direct database access from the AI service.

| Endpoint (proposed) | Method | Purpose |
|---------------------|--------|---------|
| `/api/internal/sahayak/worker/:phone` | GET | Resolve worker by phone, return profile summary |
| `/api/internal/sahayak/onboarding/:phone` | GET | Onboarding stage, missing fields (no PII dump) |
| `/api/internal/sahayak/jobs/match/:phone` | GET | Top N job matches for worker |
| `/api/internal/sahayak/profile/:phone` | PATCH | Update allowed fields from voice extraction |
| `/api/internal/sahayak/events` | POST | Analytics: conversation outcomes |

**Security:** Service-to-service API key, IP allowlist, rate limits. Aadhaar/passport numbers never sent to LLM.

### 4.4 Repository structure (recommended)

```
safework-sahayak/                    # NEW repository
├── apps/
│   ├── voice-pwa/                   # Vite + React PWA (mic-first UI)
│   └── whatsapp-webhook/            # Meta Cloud API webhook service
├── services/
│   └── orchestrator/                # Python FastAPI — AI brain
├── packages/
│   └── gigbridge-client/            # Typed HTTP client for core API
├── docs/
├── docker-compose.yml
└── README.md

gigbridge-global/                    # EXISTING — minimal additions only
└── backend/src/routes/
    └── internalSahayakRoutes.ts     # Internal API for Sahayak
```

---

## 5. Technology Stack

### 5.1 Recommended stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Sahayak frontend** | Vite + React PWA | Team familiarity; installable “app tab”; offline shell |
| **AI backend** | Python 3.12 + FastAPI | Best AI/voice ecosystem; async-friendly |
| **Orchestration** | LangGraph or custom FSM | Structured conversation flows |
| **LLM** | Google Gemini 2.5 Flash | Free tier; strong multilingual; tool calling |
| **STT** | Sarvam AI (+ Bhashini PoC) | Hindi/Hinglish accuracy; India-sovereign option |
| **TTS** | Sarvam Bulbul | Natural Hindi voices; low cost per reply |
| **WhatsApp** | Meta Cloud API (direct) | No BSP markup; worker-initiated = free replies |
| **Auth** | Firebase Phone Auth | Already used in GigBridge; phone = identity |
| **Sessions** | Upstash Redis | Free tier; conversation state per phone |
| **Persistence** | Supabase (free tier) | Session logs, voice note metadata |
| **Hosting** | Cloudflare Pages + Railway/Render | Low cost; fast deploy |
| **Core platform** | Existing Express + SQLite + Supabase | Unchanged; API bridge only |

### 5.2 Alternatives considered

| Option | Verdict |
|--------|---------|
| Add AI to current React dashboard | **Rejected** — wrong UX for target users |
| Flutter native app | Deferred — PWA sufficient for MVP; lower cost |
| OpenAI Whisper only | **Insufficient** for Hindi accents at scale |
| WhatsApp BSP (WATI, Interakt) | Deferred — adds ₹2k–5k/mo; use Meta direct first |
| Self-hosted LLM (Ollama) | Deferred — ops burden; revisit at scale |

---

## 6. User Journeys

### 6.1 Journey A — Ram, welder, Rajasthan (low literacy)

1. Ram hears about SafeWork from an e-Mitra poster: *“WhatsApp par ‘Hi’ bhejo.”*
2. Ram sends **“Hi”** on WhatsApp → bot replies with a **voice note** in Hindi: *“Namaste Ram ji, main SafeWork Sahayak hoon. Aap kaunsa kaam karte hain?”*
3. Ram sends a **30-second voice note**: *“Main welder hoon, 5 saal ka experience, UAE jana chahta hoon.”*
4. Sahayak extracts: skill=welder, experience=5yr, country=UAE → creates/updates profile via internal API.
5. Bot sends: **one job card** (audio summary + image) + buttons **[Haan, sunna hai]** **[Baad mein]**
6. Ram taps **Haan** → hears salary, location, requirements in 20 seconds.
7. Bot: *“Apply karne ke liye ek photo bhejiye jisme aap welding karte dikh rahe ho.”* — one ask only.
8. Ram never opens a website.

### 6.2 Journey B — Literate worker (optional web)

1. Opens `voice.safeworkglobal.com` → phone OTP → one mic screen.
2. Same backend as WhatsApp; optional text transcript for users who can read.
3. Can still use main portal at `/home` if preferred — **two products, one identity**.

### 6.3 Journey C — e-Mitra partner (assisted)

1. Partner opens **assisted mode** (simplified UI, not worker dashboard).
2. Worker speaks; partner confirms; Sahayak processes voice and updates profile.
3. Worker gives thumb impression / verbal “haan” on partner’s phone.

---

## 7. Sahayak PWA — UI Specification

### 7.1 Screen inventory (entire app)

| Screen | Elements | Reading required |
|--------|----------|------------------|
| Login | Phone number + OTP | Minimal (numbers only) |
| Home | Large mic, status icon, optional speaker replay | **None** |
| Choice | 2–3 large images (flags, trades) | **None** |
| Confirm | Two buttons: Haan / Nahi | **None** |

**No:** sidebar, breadcrumbs, stats cards, job lists, percentage bars, English subtitles.

### 7.2 Wireframe (home screen)

```
┌────────────────────────────────────┐
│         SafeWork Sahayak           │
│                                    │
│            ┌──────┐                │
│            │  🎤  │                │
│            │ BOLiye│               │
│            └──────┘                │
│                                    │
│     🔊 "1 naukri aapke liye"       │
│         [ ▶ Suno ]                 │
│                                    │
│      [  Haan  ]    [  Nahi  ]      │
│                                    │
│  ─────────────────────────────     │
│  WhatsApp par bhi baat karo →      │
└────────────────────────────────────┘
```

---

## 8. AI Conversation Design

### 8.1 Supported intents (MVP)

| Intent | Example (Hindi/Hinglish) | Action |
|--------|--------------------------|--------|
| `greeting` | “Hi”, “Namaste” | Welcome + ask skill or status |
| `profile_status` | “Meri profile complete hai?” | Fetch onboarding %, speak missing steps |
| `set_skill` | “Main electrician hoon” | Update primary skill |
| `set_country` | “UAE jana hai” | Set preferred GCC country |
| `find_jobs` | “Naukri dikhao” | Return top 1 match (audio) |
| `help` | “Madad chahiye” | Offer WhatsApp human / e-Mitra |
| `unknown` | Unclear audio | Ask again simply; never long text |

### 8.2 Response rules

- Maximum **20 seconds** audio per reply
- Maximum **one question** per turn
- Never read Aadhaar, PAN, or passport numbers aloud
- Disclaim: *“Yeh general jankari hai, final decision aapka.”* for salary/visa topics
- Fallback to human: *“Main aapko humari team se WhatsApp par jod deta hoon.”*

### 8.3 Privacy & data handling

| Data | LLM access | Storage |
|------|------------|---------|
| Phone number | Hashed in logs only | Redis + Supabase |
| Name, skill, experience | Yes (for extraction) | Core worker DB |
| Aadhaar, PAN, passport | **Never** | Core DB only |
| Voice recordings | Transcribed then deleted (configurable retention) | Supabase storage, 30-day TTL |

---

## 9. Cost Analysis

### 9.1 Free and low-cost resources

| Service | Free tier / credits | Best use |
|---------|---------------------|----------|
| Google Gemini Flash | ~1,500 req/day, no card | Conversation brain |
| Groq Whisper | 2,000 req/day | Dev/staging STT |
| Sarvam AI | ₹100–1,000 signup credits | Production Hindi STT/TTS |
| Sarvam Startup Program | 6–12 months credits (apply) | Pilot scale |
| Bhashini ULCA | PoC free; production licensed | Government DPI option |
| Meta WhatsApp API | Free if user messages first | Primary channel |
| Upstash Redis | 10k commands/day | Sessions |
| Supabase | Free tier | Logs, metadata |
| Cloudflare Pages | Generous free | PWA hosting |
| Railway / Render | Free–low tier | FastAPI hosting |
| Firebase Auth | Free tier | Phone OTP |

### 9.2 Estimated monthly cost (India)

| Scale | Workers active | Est. monthly cost | Notes |
|-------|----------------|-------------------|-------|
| **PoC** | 50–100 | **₹0–2,000** | Free tiers; user-initiated WhatsApp |
| **Pilot** | 500–1,000 | **₹3,000–15,000** | Sarvam STT/TTS; some utility WhatsApp templates |
| **Growth** | 5,000–10,000 | **₹50,000–1,50,000** | Paid Sarvam/Bhashini; proactive alerts |
| **Scale** | 50,000+ | Custom | Volume discounts; possible self-host |

### 9.3 WhatsApp cost model (India, 2026)

| Message type | Approx. cost | Strategy |
|--------------|--------------|----------|
| User messages first → reply in 24h | **Free** | **Default design** |
| Utility template (job alert, reminder) | ~₹0.12/msg | Phase 2 only, 1/day max |
| Marketing template | ~₹0.86/msg | **Avoid** |

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–4)

| Week | Deliverable |
|------|-------------|
| 1 | Repo setup; internal API spec; Firebase phone auth in PWA |
| 2 | FastAPI orchestrator; Gemini integration; basic Hindi text flow |
| 3 | Sarvam STT + TTS pipeline; mic UI in PWA |
| 4 | GigBridge bridge: profile status + single job match |

**Exit criteria:** Worker speaks in Hindi → hears profile status or one job in PWA.

### Phase 2 — WhatsApp & onboarding (Weeks 5–8)

| Week | Deliverable |
|------|-------------|
| 5 | Meta WhatsApp Cloud API webhook; voice note in → voice out |
| 6 | Voice onboarding flow (skill, experience, country) |
| 7 | e-Mitra assisted mode (minimal partner UI) |
| 8 | Pilot with 50 workers; metrics dashboard |

**Exit criteria:** End-to-end onboarding via WhatsApp voice only; no website required.

### Phase 3 — Polish & scale (Weeks 9–12)

| Week | Deliverable |
|------|-------------|
| 9 | Proactive job alert (utility template, opt-in) |
| 10 | Apply Sarvam Startup Program; Bhashini PoC evaluation |
| 11 | Skill video upload nudge via WhatsApp deep link |
| 12 | Production hardening, monitoring, cost alerts |

**Exit criteria:** 500-worker pilot; <20% drop-off vs. web onboarding benchmark.

---

## 11. Success Metrics

### 11.1 Primary KPIs

| Metric | Target (pilot) | Measurement |
|--------|----------------|-------------|
| Onboarding completion (voice-only) | ≥ 60% | vs. ~30% web baseline (estimate) |
| Time to first job recommendation | < 5 minutes | From first “Hi” |
| Voice interaction success rate | ≥ 80% | Intent understood without repeat |
| Worker-initiated return rate (7-day) | ≥ 40% | WhatsApp/PWA reopen |
| Support tickets per 100 workers | −50% | vs. web-only cohort |

### 11.2 Secondary KPIs

- Average audio reply length (target: < 20 sec)
- Skill media upload rate after voice nudge
- Job application rate from Sahayak recommendations
- Cost per active worker per month
- Partner-assisted registrations via Sahayak

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor Hindi STT accuracy | High | Sarvam + confirm back verbally; “Did I understand right?” |
| LLM hallucination on visa/salary | High | RAG over approved content; disclaimers; human escalation |
| WhatsApp policy / template rejection | Medium | User-initiated flows; pre-approve utility templates |
| Worker distrust of “robot” | Medium | Hindi voice persona; always offer human; e-Mitra presence |
| PII leakage to LLM | Critical | Redaction layer; never pass Aadhaar/PAN; audit logs |
| Cost overrun at scale | Medium | Per-user rate limits; cache FAQ; startup credits |
| Bhashini PoC → production gap | Medium | Plan Sarvam as production path from day one |

---

## 13. Team & Resources Required

### 13.1 Minimum team (MVP)

| Role | Effort | Responsibility |
|------|--------|----------------|
| Backend / AI engineer | 1 FTE × 10 weeks | FastAPI, orchestrator, Sahayak ↔ core API |
| Frontend engineer | 0.5 FTE × 6 weeks | PWA mic UI, Firebase auth |
| Product / Hindi UX | 0.25 FTE ongoing | Conversation scripts, voice persona |
| DevOps | 0.1 FTE | Deploy, secrets, monitoring |

### 13.2 External applications (start immediately)

- [Sarvam AI Startup Program](https://www.sarvam.ai/startup-program) — 6–12 months API credits
- [Bhashini ULCA](https://bhashini.gov.in/) — PoC access for government-aligned narrative
- Google for Startups / cloud credits — optional GCP hosting
- Meta Business verification — WhatsApp Cloud API (1–2 week lead time)

---

## 14. Relationship to Existing GigBridge Modules

| Module | Change |
|--------|--------|
| Worker portal (`/home`, `/onboarding`) | **No change** for literate users |
| Express worker API | **Add** internal Sahayak routes |
| Supabase jobs | **Read** via existing queries / new match endpoint |
| Firebase auth | **Shared** phone identity |
| e-Mitra partner portal | **Add** assisted mode entry point (Phase 2) |
| Employer / admin | **No change** |

---

## 15. Recommendation

**Proceed with SafeWork Sahayak as a separate product**, built in a new repository, targeting WhatsApp and voice PWA as primary channels. Do not integrate AI into the current worker dashboard.

**Immediate next steps:**

1. **Approve** this proposal and allocate 10-week MVP budget (₹0–15k/mo infra + engineering time).
2. **Apply** for Sarvam Startup Program and begin Meta Business verification.
3. **Spec** internal API endpoints on GigBridge core (Section 4.3).
4. **Create** `safework-sahayak` repository and Phase 1 sprint plan.
5. **Pilot** with 50 workers in one district via e-Mitra before wider rollout.

---

## 16. Appendix

### A. Glossary

| Term | Meaning |
|------|---------|
| Sahayak | Hindi for “helper” — AI assistant product name |
| GCC | Gulf Cooperation Council countries (UAE, Saudi, Qatar, etc.) |
| STT | Speech-to-text |
| TTS | Text-to-speech |
| PWA | Progressive Web App — installable web app |
| e-Mitra | Rajasthan government digital service center partner model |

### B. Reference links

- [Google Gemini API](https://ai.google.dev/)
- [Sarvam AI Docs](https://docs.sarvam.ai/)
- [Bhashini API Docs](https://dibd-bhashini.gitbook.io/bhashini-apis)
- [WhatsApp Cloud API Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
- [Upstash Redis](https://upstash.com/)
- [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

### C. Document history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 2026 | — | Initial proposal |

---

*This document is intended for internal planning, stakeholder review, and grant/partner applications. Technical details should be validated against current API pricing and terms at implementation time.*
