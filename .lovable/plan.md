# SafeWork Global SEO, Google Jobs & AI Search Plan

## Goal
Upgrade the existing application—not replace it—so public job and guidance pages are crawlable, accurate, internally connected, Google Jobs-compatible, and easy for AI search systems to understand. Existing authentication, dashboards, onboarding, applications, payments, messaging, partner flows, and worker journey logic remain unchanged.

## Audit findings guiding the work
- Lovable currently pre-renders public pages for crawlers, so the existing React app can be improved without a framework migration.
- Public jobs already use stable-looking slugs, but the database trigger changes a slug when a title changes; old URLs are not redirected.
- Job schema markup currently invents an employer label, derives expiry as “posted + 3 months,” and forces INR. These must use real database values or be omitted.
- The public job query does not join a safe employer projection; raw employer profiles contain private compliance fields and must never be exposed.
- Active jobs are public, but closed/expired jobs are hidden by current access rules, preventing an honest historical “no longer accepting applications” page.
- The sitemap is manually maintained, omits individual jobs, and uses `www` while the canonical domain is `https://safeworkglobal.com`.
- Current public data contains active and closed UAE jobs. Category is inferred from text rather than stored, and `location` is the only city-like field.
- The site already has reusable SEO utilities, a public jobs list/detail experience, admin-only route protection, and basic visit analytics.
- The current SEO scan passes rendering, page basics, homepage metadata, and social-preview checks. It flags the `www` host in robots; the ignored sitemap finding reports the same host mismatch.

## Implementation phases

### 1. Technical SEO foundation
- Standardize every canonical, Open Graph URL, sitemap URL, and robots sitemap directive on `https://safeworkglobal.com`.
- Extend the existing SEO head utility to support multiple JSON-LD objects, per-route robots directives, and clean self-referencing canonicals with tracking/filter parameters removed.
- Add additive job SEO fields only where the current schema does not suffice: SEO title, meta description, canonical override, indexable flag, noindex reason, first-published timestamp, and stable slug controls.
- Freeze an indexed job slug after first publication. Add a slug-history/redirect table so a deliberate admin slug change resolves with a permanent redirect rather than breaking old links.
- Add an admin-controlled `seo_pages` table for country, city, category, category-city, resource, and employer pages. New public tables receive explicit grants, RLS, and admin-only writes.
- Keep filtered searches non-indexable by default. Only approved, useful database-backed landing pages become indexable.
- Correct the Not Found page metadata and noindex behavior. Preserve relevant closed-job URLs instead of redirecting all missing jobs to the homepage.

### 2. Complete public job pages
- Expand `/jobs/:slug` to display every available real field: employer, location, salary, vacancies, experience, type, contract details, hours, joining/expiry dates, benefits, eligibility, skills, description, application process, reference, posted/updated dates, and current availability.
- Never invent missing fields. Labels with no database value are omitted.
- Display native currency as the source of truth. Show an INR equivalent only when the `fx_rates` table contains a real applicable rate; otherwise omit it. No hardcoded conversion.
- Add a safe public job-detail database function/projection that returns only approved job and employer fields. Raw employer compliance/KYC data stays private.
- Preserve existing worker application rules. Closed, filled, paused, or expired pages disable application and recommend relevant active jobs.

### 3. Accurate structured data and breadcrumbs
- Build `JobPosting` JSON-LD from the same values visibly rendered on the page.
- Use the real employer name only when legitimately public; otherwise omit `hiringOrganization` rather than using “Verified employer.”
- Use actual `expires_at` for `validThrough`, actual currency for `baseSalary`, and add truthful identifier, employment type, location, and `directApply` values.
- Emit `JobPosting` only for currently available jobs. Add `BreadcrumbList` to public page hierarchies and accurate Organization/WebSite/WebPage/Article schema where applicable.
- Validate schema output against visible content and Google Jobs requirements.

### 4. Sitemap architecture and freshness
- Replace the hand-maintained sitemap with a generated sitemap index and focused child sitemaps for jobs, landing pages, employers, and resources when volume warrants it.
- Include only canonical, public, indexable URLs. Exclude login, dashboards, admin, account, internal APIs, filtered URLs, empty pages, and unavailable jobs.
- Use `updated_at` as `<lastmod>` only for meaningful page-specific changes; never use build time or the current date as a fallback.
- Generate sitemap content from the same active/public rules used by page loaders. Wire generation into preview/build publishing and provide admin sitemap status. If root-path dynamic updates are not supported by hosting, the admin will clearly show that a publish is required after job changes rather than pretending the sitemap updated live.
- Update robots rules without blocking public jobs or approved landing pages.

### 5. Country, city, category, and combined landing pages
- Add `/dubai-jobs`, `/uae-jobs`, `/gcc-jobs`, `/overseas-jobs`, `/[city]-jobs`, `/[country]-jobs`, `/jobs/[category]`, `/jobs/[category]/[country]`, and `/jobs/[category]/[city]` through one controlled landing-page system.
- Publish only pages with real matching jobs or substantial approved evergreen guidance. Empty/thin combinations remain noindex and stay out of sitemaps.
- Store a normalized trade/category and city for jobs instead of relying solely on title inference; backfill only from confidently mapped current records and leave uncertain values unset for review.
- Keep pagination crawlable while canonicalizing filter, sort, and tracking variants correctly.

### 6. Public employer profiles
- Add opt-in `/employers/:employerSlug` pages backed by a strict safe-field projection.
- Show only approved public company name, logo, industry, location, description, legitimate verification state, and active vacancies/categories.
- Never expose tax IDs, licence documents, contact records, onboarding answers, or other private employer fields.
- Add stable employer slugs and redirects for changed slugs.

### 7. Internal linking and related jobs
- Implement the hierarchy: Overseas Employment → GCC Jobs → UAE Jobs → Dubai Jobs → Categories → Individual Jobs.
- Add descriptive breadcrumbs and restrained contextual links from the homepage, jobs listing, landing pages, employers, and resources.
- Recommend active related jobs using category, city/country, salary, experience, and skills; never include expired or hidden listings.

### 8. Resources and useful content architecture
- Add `/resources` and `/resources/:articleSlug` using approved, original SafeWork guidance and current platform data.
- Reuse and consolidate existing visa, cultural, legal, FAQ, support, country-insight, and employer guidance where appropriate rather than duplicating content.
- Add Article/WebPage metadata only when accurate. Clearly distinguish platform job data from general guidance and avoid unsupported legal or immigration claims.

### 9. AI-search readability
- Structure public pages with concise factual summaries, descriptive headings, definition-style answers, source dates, breadcrumbs, and links to the underlying jobs or guidance.
- Add useful FAQ sections only where existing product facts support the answers.
- Do not add `/llms.txt` unless separately requested, and do not make claims that AI assistants must recommend SafeWork Global.

### 10. Admin SEO controls and health dashboard
- Add an admin-only SEO area using the existing admin route guard and layout.
- Controls: edit SEO title/description/canonical, index/noindex state and reason, stable slug, public employer state, landing-page content, search-snippet preview, JSON-LD preview, public URL, and sitemap inclusion/status.
- Health checks: public/indexable/noindex totals; active/paused/filled/expired jobs; missing metadata/slugs/schema; duplicate titles/descriptions; canonical conflicts; broken internal links; thin/empty landing pages; sitemap freshness.
- Metadata regeneration produces a reviewable draft from real fields; it never fabricates business facts and does not silently publish.

### 11. Performance and analytics
- Keep public pages mobile-first and reduce unnecessary job-list payloads, duplicate requests, and heavy below-the-fold rendering.
- Record privacy-conscious SEO events: landing-page view, job-page view, application start/completion, and registration completion, with referrer/UTM, country/city/category context, and no unnecessary personal data.
- Add admin reporting for organic landing pages and conversion rates. Clearly separate measured visits/conversions from estimates.

### 12. Verification and launch
- Test homepage, jobs list, active and unavailable job pages, country/city/category combinations, employer/resource pages, pagination, redirects, 404s, robots, every sitemap, canonicals, metadata, Open Graph, breadcrumbs, and JSON-LD.
- Verify anonymous access to public pages and continued protection of worker, employer, partner, interviewer, and admin areas.
- Confirm structured data exactly matches visible database values, including native salary currency and real expiry.
- Test desktop and mobile layouts plus existing sign-in, posting, application, payment, and dashboard smoke paths for regressions.
- After publishing, submit the sitemap and inspect representative URLs in Google Search Console. Search Console verification/submission remains an explicit external setup step; no verification or ranking result will be fabricated.

## Technical approach
- Reuse `SEOHead`, existing public layouts, jobs queries, admin navigation, role guards, design tokens, and current database tables.
- Use additive migrations with explicit grants and RLS. Admin authorization remains in `user_roles`/server-side checks.
- Use safe database functions or projections for public job/employer data; never broaden raw employer-profile access.
- Keep legacy job data intact and do not delete or replace the existing job architecture.
- Preserve Lovable crawler prerendering. A framework migration is not required for this implementation.

## Deliverables
- Public SEO route system and complete job pages.
- Accurate JobPosting, BreadcrumbList, Organization, WebSite, WebPage, and Article schema where applicable.
- Generated sitemap architecture and corrected robots/canonical configuration.
- Controlled landing pages, public employer pages, resources, internal links, related jobs, and unavailable-job handling.
- Admin SEO controls, SEO health dashboard, and organic-conversion reporting.
- Final developer/admin report covering routes, schema, components, indexation rules, expiry behavior, tests, and remaining Search Console actions.
