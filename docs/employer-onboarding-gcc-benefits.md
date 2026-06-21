# Employer Onboarding & GCC Benefits Package — Product Spec (Deferred)

> **Status:** Valid input, documented for future implementation.  
> **Priority:** Complete the worker module first; employer benefits checklist comes after.

---

## 1. Current employer onboarding (web)

5-step wizard in `src/pages/employer/EmployerOnboarding.tsx`:

| Step | Title | What it captures |
|------|-------|------------------|
| 1 | Basic Details | Name, mobile, email, company name, country, role (Owner/HR/Supervisor/Contractor) |
| 2 | Business Info | Business type, company size, work cities, office address/state, CIN, tax number |
| 3 | Hiring Needs | Skills/roles, worker type, headcount, job type, start date, source countries, salary (₹) |
| 4 | Verification | ID type + number (PAN/GST/CIN/Aadhaar); document upload deferred to profile |
| 5 | Payment & Safety | Payment method, billing address, GST, safety standards, PPE, site safety level |

Users can skip steps and finish later. Mobile onboarding is lighter (name, phone, company, country, business type only).

**Entry paths:**
- Full signup → `/employer/onboarding`
- Quick signup → `/employer/trust` → dashboard
- Post-onboarding checklist: verify email → profile → company info → post first job

---

## 2. Major platform features (after onboarding)

| Area | Features |
|------|----------|
| Profile & trust | My Profile, Company & KYC, background verification card |
| Hiring pipeline | Post Job, Manage Jobs, Search Workers, Saved Searches, Applications, Shortlist, Interviews, Offers |
| Operations | Formalities (visa, ECR, medical, police, contract, flight booking), Contracts, Escrow/Payments |
| Reporting | Compliance, Analytics, Messaging |

Formalities already track visa/medical/flights **post-hire** — not declared during onboarding or used for matching.

---

## 3. Benefits data today (fragmented)

| Layer | What exists | Gap |
|-------|-------------|-----|
| Employer onboarding | Nothing structured | Missing entirely |
| Post Job | Free-text benefits + visa checkbox | No accommodation/food/transport/insurance checkboxes |
| `jobs` table | `visa_sponsorship`, `benefits` (text) | No boolean benefit columns |
| Offers | Comma-separated benefits text | Unstructured, not filterable |
| Worker side | Preferred countries, salary, passport/visa | No benefits preferences checklist |
| Job discovery | Visa sponsorship filter | No benefit filters |

Older `job_postings` schema had `accommodation_provided`, `food_provided`, `transport_provided`, `insurance_provided` — not carried into current `jobs` table or UI.

---

## 4. What GCC employers look for

GCC countries: **UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain**.

### 4.1 Legal & company legitimacy (KYC)

**They expect:** Trade license / CR, VAT/TRN, MOL/Qiwa/MOHRE establishment, sponsor/PRO contact.

**We have:** India-centric IDs (CIN, GST, PAN, Aadhaar), generic company registration, placeholder KYC upload.

**Missing:** GCC registration types, establishment ID, trade license upload, verified employer badge.

### 4.2 Workforce benefits package (highest-value gap)

| Benefit | GCC expectation | Platform today |
|---------|-----------------|----------------|
| Accommodation | Company housing/camp | ❌ Not structured |
| Food / meals | Often included in camp | ❌ |
| Local transportation | Site bus / pickup | ❌ |
| International transportation | Airport pickup, repatriation | ❌ |
| Visa sponsorship | Work visa + iqama/residency | ⚠️ Job-level checkbox only |
| Flight tickets | Initial + biennial home leave | ⚠️ Post-hire formality only |
| Health insurance | Mandatory in UAE/KSA | ❌ |
| Medical (pre-employment) | GCC medical + fitness | ⚠️ Post-hire only |
| PPE / safety | Site equipment | ✅ Partial (onboarding step 5) |
| Annual leave / ticket home | 30 days + ticket every 2 years | ❌ |
| End-of-service gratuity | Legal requirement | ❌ |
| Overtime / working hours | 8–10 hr shifts | ❌ |

### 4.3 Hiring & sourcing

**They expect:** Nationality quotas, trade/skill, headcount, salary in AED/SAR/QAR, contract duration.

**We have:** Most in Step 3, but salary defaults to ₹, payment methods are India-focused (UPI/Cash), and Step 1 country uses worker nationality list instead of company location.

### 4.4 Compliance & payroll

**They expect:** WPS/Mudad, GOSI, local labor law contracts, PRO/visa timeline.

**We have:** Compliance reports, formalities tracking — not surfaced at onboarding.

### 4.5 Trust & operations

**They expect:** Verified profile, hiring timeline, escrow, direct communication.

**We have:** Trust page, escrow, messaging, worker verification — strong.

---

## 5. Proposed benefits checklist (for future implementation)

### Tier A — Core package

```
☐ Accommodation (company-provided housing/camp)
☐ Food / meals
☐ Local transportation (site commute)
☐ Visa sponsorship & processing
☐ Flight tickets (initial deployment)
☐ Flight tickets (periodic home leave — e.g. every 2 years)
☐ Health insurance
☐ Medical examination (pre-employment)
☐ PPE / safety equipment
```

### Tier B — Matching enhancements

```
☐ Airport pickup on arrival
☐ Annual paid leave (with days)
☐ End-of-service gratuity
☐ Overtime paid
☐ Family visa eligibility
☐ Training / certification provided
☐ Repatriation support
```

### Tier C — Optional detail per item

For each checked item:
- **Coverage:** Fully paid / partially paid / allowance amount
- **Notes:** e.g. "4-bed shared camp, 3 meals/day"

---

## 6. Recommended product design

### Where to put it

- **Employer default package:** New onboarding step or Company Profile section
- **Per-job overrides:** Post Job form inherits defaults, allows overrides
- **Worker preferences:** Mirror checklist on worker onboarding (required vs preferred)

### Data model (conceptual)

```typescript
// employer_profiles.benefits_package
{
  accommodation: { provided: boolean; details?: string },
  food: { provided: boolean },
  local_transport: { provided: boolean },
  visa_sponsorship: { provided: boolean },
  flight_tickets_initial: { provided: boolean },
  flight_tickets_leave: { provided: boolean; frequency?: string },
  health_insurance: { provided: boolean },
  medical_exam: { provided: boolean },
  // ...
}

// jobs.benefits_package — same shape, inherits employer default if empty
// worker_profiles.benefits_preferences — required[] + preferred[]
```

### Matching logic

- **Hard filter:** Worker requires accommodation → only employers/jobs where provided
- **Score boost:** More matching benefits = higher rank
- **Job discovery:** Benefit checkboxes alongside visa filter

### GCC onboarding fixes (related)

- Employer country = company location (GCC list first)
- Registration: Trade License, CR, VAT TRN
- Currency: AED/SAR/QAR/KWD default for GCC
- Payment: Bank transfer / WPS instead of UPI

---

## 7. Open questions (resolve before implementation)

1. **Checklist scope** — Tier A only first, or include leave/gratuity/family visa?
2. **Employer vs job level** — Default at company + per-job override?
3. **Worker side timing** — Same sprint as employer, or employer-first?
4. **Required vs optional** — Must employers select at least one benefit?
5. **GCC-first flow** — Separate onboarding when country = GCC, or dynamic fields?
6. **Display** — Benefit badges on employer profile and job cards (like visa badge)?

---

## 8. Summary

| Area | Status |
|------|--------|
| Basic company + hiring intent | ✅ Good |
| Safety / PPE | ✅ Partial |
| Visa (job level) | ⚠️ Checkbox only |
| Benefits checklist | ❌ **Highest value add — deferred** |
| GCC KYC / compliance | ❌ Missing |
| Worker ↔ employer benefit matching | ❌ Missing |
| Post-hire formalities | ✅ Exists but disconnected |
| Worker benefits preferences | ❌ Missing (add during worker module completion) |

---

## 9. Dependency on worker module

Benefits matching requires **worker-side preferences** (required vs preferred benefits). Complete the Phase-1 worker module (registration, onboarding, profile, job discovery) before implementing employer benefits checklist and cross-side matching.
