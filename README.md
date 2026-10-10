# RoadWatch

**Rules lead. AI assists. Every repair is remembered.**

A mobile-first pothole reporting MVP built with Next.js App Router, TypeScript, Tailwind, Supabase Auth/Postgres/PostGIS/pgvector/private Storage, Leaflet/OpenStreetMap, and the OpenAI SDK. Citizens keep their permanent tickets even when several reports become one repair job. Recorded repair history identifies repeat failures and attaches the responsible contractor and warranty window.

Public demo: https://roadwatch-hema-protohack.hemabhushantadithuri.chatgpt.site

Published through Sites with public access. The separate hosting checkout in `sites/roadwatch` uses the Sites Vinext/Cloudflare Worker starter; this root project retains Next.js. The shared dashboard has no backend credentials and remains read only; its citizen records and repair histories are illustrative, with real dataset photos and a sourced OpenStreetMap road sample clearly labeled.

`/try` now provides a working browser-local practice: submit a report, assign its repair, record after-evidence, and verify closure. It saves tickets, photos and the four-step timeline in local storage, supports JSON export, validates inputs and retains the prior state when saving fails. Role switches are explicitly simulated. Practice records never become shared municipal records. `/report` offers this practice when Supabase is absent, while preserving the authenticated live flow when configured.

`/presentation` covers the six finals judging categories, the three-minute demo, architecture, scope, tradeoffs and judge Q&A. Fill actual team contributions and event timing in `docs/FINALS-HANDOFF.md`; code cannot prove teamwork or the 3–4 hour execution criterion. The offline acceptance suite now has 85 passing tests; the 10 live database tests remain skipped without credentials.

## Verification status

The application builds and the offline acceptance suite passes. No Supabase project credentials or OpenAI key were supplied. Docker Desktop is installed; its engine did not respond after a background startup attempt. The local Supabase start was stopped without obtaining a running database. **Live database/RLS, real authentication, private uploads, and an end-to-end repair workflow are therefore not yet verified.** The ten integration tests are implemented and skipped unless explicitly configured. SQL parsing is a syntax check, not a substitute for executing migrations or exercising RLS.

The 10 October 2026 UI review verified desktop and phone layouts, keyboard quick navigation, queue filtering, personal focus persistence and the complete practice repair flow through closure and reload. HTTP smoke checks covered 15 routes/assets with their expected statuses, including a missing-page 404. Both the Next.js and Sites production builds pass. The main dependency audit reports zero vulnerabilities; the Sites toolchain retains eight findings propagated from an unpatched braces dependency. No live OpenAI request was made or billed. See [the UI and reliability review](docs/UI-RELIABILITY-REVIEW.md) for evidence and remaining limits.

## Run the read-only demo

Requires Node.js 20.19+ (verified with Node 24). From this repository:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without Supabase environment values, every page is labeled **Demo data · read only**. Switch between Officer, Citizen, and Reviewer previews using the banner. This preview is illustrative and cannot create or change records. It never impersonates a real Supabase session. In a configured project URL parameters cannot change the authenticated role.

For a production build:

```sh
npm run build
npm start
```

## Local Supabase setup

1. Install/start Docker Desktop and ensure `docker info` returns successfully. The Supabase CLI is a project dev dependency.
2. Start the disposable local stack. Migrations and `supabase/seed.sql` run at startup:

```sh
npx supabase start
```

3. Obtain local connection values with `npx supabase status`. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Leave `OPENAI_API_KEY` empty to test the fully deterministic workflow. Do not share the local service-role key.
4. For seed photo upload only, add `SUPABASE_SERVICE_ROLE_KEY` to the ignored `.env.local`, then:

```sh
node --env-file=.env.local scripts/upload-demo-photos.mjs
```

Seed damage photos are six original CC0 dataset samples, with captions identifying their locations and report histories as simulated. Repair images are explicitly labeled **DEMO ILLUSTRATION**, not verified after-photos. The upload script puts both into the private bucket. SQL does not upload object bytes; skipping this step leaves seeded photos unavailable.

5. Restart Next.js after configuring the environment. Sign in using the demo credentials below.
6. To reset only the disposable local project, use `npx supabase db reset`, then upload demo photos again. This deletes local project data; do not use it against a database with records you need.
7. PowerShell convenience flow after a successful local start, with no existing `.env.local`:

```powershell
./scripts/check-local.ps1
```

This writes ignored local credentials without printing them, uploads fixtures, and runs the live acceptance tests. It refuses to overwrite existing configuration.

## Real pothole photo samples

`/evidence` displays six original images and 29 PASCAL VOC bounding boxes from [Yam Peleg’s Potholes Object Detection dataset](https://www.kaggle.com/datasets/yamqwe/potholes-object-detection), credited to [Make ML](https://makeml.app/datasets/potholes). Kaggle lists version 1 under CC0/Public Domain. Original PNGs are stored in `public/dataset-potholes`; original XML labels are retained in `data/pothole-samples`; `data/pothole-samples.json` records attribution, retrieval time, dimensions and SHA-256 hashes. The data card declares 600 images; only six selected samples were imported.

The demo tickets use these real damage photos with explicit captions. Dataset coordinates are bounding-box pixels, not GPS. Ticket locations, dates, severity, AI fixture responses, contractors and repair outcomes remain simulated. Dataset boxes are original annotations, not predictions from a trained RoadWatch model. No detection model was trained or evaluated, and this small sample is not an evaluation benchmark. Repair illustrations remain visibly labeled. The second suggested dataset, `ashishkumarak/training-setzip`, was not imported because Kaggle lists its license as Unknown.

To refresh the same six public samples (network required), run `./scripts/fetch-pothole-samples.ps1`, then `node scripts/generate-demo.mjs`. The fetch checks the license, PNG signatures and annotation bounds; the integrity tests additionally verify image dimensions and hashes. Re-upload seed photos to a configured development Supabase project using the command above; no cloud database or storage write was performed during this integration.

## Supabase cloud setup

Use a dedicated development project for the demo seed, not a municipality's production database.

1. Create a Supabase project. Set its Auth site URL to your Next.js origin. Email/password authentication is sufficient; user self-registration is outside this MVP.
2. Apply the eight `supabase/migrations/*.sql` files in filename order using the SQL Editor, or link the CLI and push:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

3. Execute `supabase/seed.sql` in that development project's SQL Editor. It creates three Auth users and identities plus server-owned profiles. The SQL deliberately provisions known demo passwords; rotate/remove those accounts before exposing a real deployment. Ordinary citizens cannot create or promote profiles through RLS.
4. Set public project URL and anon key in `.env.local` or your Next.js host's environment. Optional `OPENAI_API_KEY` is server-only. The service-role key is needed only for the fixture upload utility, **never** by the running application.
5. Upload private demo illustrations with the utility above. Build and deploy Next.js to a host supporting Server Actions and Node.js. Set the Auth site URL to the deployment origin. HTTPS is required for geolocation, microphone access, and production PWA installation.

The root project remains a standard Next.js application for the authenticated Supabase workflow. The separate `sites/roadwatch` checkout provides its Sites-compatible hosted demo and browser-local practice. The 10 October UI update could not be republished because the saved Sites project was unavailable to the current account; the source copies are synchronized for later deployment.

## Demo credentials

All three accounts use password `RoadWatchDemo!2026` and are displayed prominently on `/login` after setup:

- Citizen: `citizen@roadwatch.demo` — Priya Sharma
- Ward Officer: `officer@roadwatch.demo` — Arun Kumar
- Reviewer: `reviewer@roadwatch.demo` — Meera Rao

## Deterministic architecture

- All application writes are **Server Actions** in `lib/actions.ts`, `lib/auth-actions.ts`, and `lib/voice-actions.ts`. There are no REST write routes. Each action validates input and derives the user's role from `auth.getUser()` and a server-owned profile.
- Role-gated database functions execute multi-table changes atomically. Database triggers generate exactly one event per changed report/incident status, including initial creation. A reassignment that leaves status unchanged records a same-status event to preserve its written override reason. `status_events` rejects updates and deletes.
- **RLS** restricts citizens to their own reports and linked incidents/jobs/history, officers to their own ward, and reviewers across wards. The coordinate views use `security_invoker`. No authenticated direct INSERT/UPDATE/DELETE privileges exist on application tables. A final function allowlist removes default anonymous access and exposes only approved entry points and RLS read helpers.
- Photos use a **private** bucket, 6 MB size limit, supported MIME types, and server-side magic-byte validation. Server Components generate signed URLs with a 120-second TTL; vision uses a 60-second URL. Storage paths are removed before presentation. Runtime code uses the session's anon client; no service-role client bypasses RLS for AI or page queries.
- The database closure trigger handles both INSERT and UPDATE. Closure requires an after-photo, recorded repair, and reviewer verification. The Server Action rechecks the same gate before invoking the reviewer transaction.
- Pure source-of-truth logic lives in `lib/priority.ts`, `lib/merge.ts`, `lib/repeat.ts`, and `lib/risk.ts`.

Explainable rules:

1. **Grouping:** a rule suggests a match only for the same road segment, at most 20 metres away, and at most seven days apart; an officer always confirms. An officer may explicitly override distance/time with a reason, but cannot merge different segments or closed incidents.
2. **Priority:** round `50 × severity + 30 × sensitive_location + 20 × min(days_waiting / 7, 1)`. Future timestamps contribute zero waiting. Every component appears beside the score. The worked examples return **86** and **33**. Report count has no input to this function.
3. **Repeat queue:** a segment needs at least two accepted incidents opened in the last 90 days and a recent incident after a recorded repair on that segment. The latest earlier repair is linked at incident creation; display functions also recompute from history.
4. **Warranty attribution:** compute elapsed time from actual dates. The seed displays: **“Failed within 35 days of Metro Roads Ltd.'s repair, warranty window 90 days.”** Warranty failure classification uses fractional days, so 90 days plus an hour falls outside a 90-day warranty.
5. **Unresolved repair:** a citizen can append a follow-up note to their own repaired ticket. It appears in the ward officer's inbox on the next refresh and never changes status.

## AI governance

All OpenAI calls are in `lib/ai.ts`, protected by `server-only`. Model outputs are parsed through strict Zod schemas before storage. The wrapper uses a 10-second timeout, one retry, and a 24-hour, entity-scoped SHA-256 input cache read through RLS. Failures return no suggestion. A report is committed before optional AI; an AI failure cannot discard its ticket.

AI features:

- GPT-4o vision creates a photo-triage **suggestion**. Accept/Edit/Reject writes only the governance decision. Accepted/edited values can prefill an assignment form; an officer still confirms facts with a written reason.
- `text-embedding-3-small` uses 1536-dimensional note/vision-description embeddings and pgvector cosine similarity above 0.82 to surface open-incident candidates outside the geo/time rule. This is honestly labeled **semantic match**, not raw visual similarity. Preparing seed semantic search is an explicit officer action on Insights & audit. Duplicate Merge/Keep separate logs the human decision; merge and decision share a transaction.
- GPT-4o-mini provides an on-demand three-bullet incident brief. No model call runs during page load.
- Browser Web Speech transcription is editable. Optional GPT-4o-mini parsing creates a logged draft that the citizen must choose to use; typing works in browsers without speech recognition. Browser transcription may use the browser vendor's service.
- Repeat-risk is a deterministic **heuristic v1**, not trained ML or a calibrated probability. The six contributions are repairs in 180 days, days since repair, past severity, contractor warranty failure rate, sensitive-location density, and a seasonal flag. It has no authority over priority/status and is not an AI-generated fact.
- Contractor scorecard numbers are deterministic. A separately requested GPT-4o-mini narrative appears as a draft in the audit log with Accept/Reject controls.

`ai_suggestions` records model, model_version, confidence, input_snapshot, output, decision, decided_by, decided_at, created_at, and input_hash. New rows are pending. Non-pending decisions require actor and timestamp. Concurrent/repeated decisions are blocked by row locks and the pending-state guard. **No decision function writes severity, sensitive location, incident linkage, or status.** `confirm_duplicate` is the explicitly human-requested exception for grouping: it records acceptance first and then invokes the deterministic, officer-gated grouping function in the same transaction.

Live text/vision suggestions store a conservative policy confidence of 0.50; it is uncalibrated and not a probability supplied by a model. Semantic duplicate confidence is cosine similarity. Seed 0.78 badges are labeled model fixtures (`demo:gpt-4o`, `demo-fixture-v1`), never represented as live inference.

With no OpenAI key, live AI buttons/badges are disabled/hidden and all deterministic mutations remain usable. The isolated read-only preview deliberately displays clearly labeled fixture badges so judges can inspect the governance story without any API call. Seed suggestion rows remain auditable in the configured database even with AI disabled.

Audit through **Insights & audit → AI suggestion audit**: expand each snapshot and inspect its decision, human actor, and time. In Supabase SQL Editor:

```sql
select kind, model, model_version, confidence, input_snapshot, output,
       decision, decided_by, decided_at, created_at
from public.ai_suggestions
order by created_at desc;
```

Implementation references: [OpenAI vision model documentation](https://developers.openai.com/api/docs/models/gpt-4o) and [text embedding documentation](https://developers.openai.com/api/docs/guides/embeddings). The latter documents text inputs and 1536-dimensional default embeddings, hence the caption/note approach rather than pretending the embedding endpoint accepts photos.

## Acceptance tests

```sh
npm test
npm run typecheck
npm run check:sql
npm run build
```

For the live database suite, supply a seeded **disposable** project:

```powershell
$env:TEST_SUPABASE_URL = 'http://127.0.0.1:54321'
$env:TEST_SUPABASE_ANON_KEY = '<local anon key>'
$env:TEST_SUPABASE_SERVICE_ROLE_KEY = '<local service-role key>'
npm test
```

The service-role value is used only by the test that proves the database closure trigger also blocks privileged writes without evidence. All other integration tests use ordinary authenticated Citizen/Officer/Reviewer clients. Tests do not create a fake auth bypass. Rejected writes are expected to leave data unchanged.

Final verified output (9 October 2026):

```text
✓ tests/security-contract.test.ts (7 tests)
✓ tests/ai.test.ts (5 tests)
✓ tests/actions.test.ts (6 tests)
✓ tests/core.test.ts (32 tests)
✓ tests/warranty.test.ts (1 test)
✓ tests/road-network.test.ts (4 tests)
✓ tests/pothole-samples.test.ts (3 tests)
✓ tests/operations.test.ts (7 tests)
↓ tests/database.integration.test.ts (10 tests | 10 skipped)
Test Files  8 passed | 1 skipped (9)
Tests       65 passed | 10 skipped (75)
```

`npm run typecheck` exited 0. `next build` compiled successfully and generated all routes. PostgreSQL syntax parser passed every migration and the seed. Structural security checks explicitly identify themselves as structural; only the live suite can establish that actual Supabase grants, triggers, RLS, and persistence behave correctly. Production install prompt and phone/browser speech recognition remain device checks.

## Three-minute demo script

The read-only preview can show the entire repair-memory story immediately. For actual mutations, complete local/cloud setup and private fixture upload first; this live script is supplied but could not be executed here without a responding database.

1. **0:00–0:25 — lead with governance.** Show “Rules lead. AI assists.” Sign in as Citizen, submit a photo with GPS or a manual pin, and open its permanent ticket timeline. Refresh to show persistence. If presenting the read-only preview, inspect `RW-0001` instead and explicitly say it is demo data.
2. **0:25–0:55 — one job, five voices.** Sign in as Officer. Open College Road's earlier closed incident (`…0201`): `RW-0001` through `RW-0005` remain separate tickets linked to the same repair. Show the two Station Road incidents (`…0204` and `…0205`), about 30 metres apart and still separate.
3. **0:55–1:20 — explainable decisions.** Show priority components and the Overdue filter. Confirm grouping for your new report with a written reason. Confirm severity/sensitive location, owner, contractor, due date, and warranty. AI can only prefill these after a recorded decision.
4. **1:20–1:45 — evidence before closure.** Upload an after-photo and send the job for review. Sign in as Reviewer, inspect evidence, then verify closure with a reason. The seeded Hospital Road job (`…0207`) is already awaiting review if time is short. Explain that closure without an after-photo is blocked in the action and database.
5. **1:45–2:10 — prove the audit.** Open Insights & audit. Inspect `ai_suggestions`, including the seed's accepted row with actor/timestamp. With a live key, Accept/Edit/Reject a fresh draft and show that decision logging alone changes no incident fact or status.
6. **2:10–2:35 — the road remembers.** Return to College Road's later incident (`…0202`). Show its linked earlier contractor repair and road history. Show the repeat queue: two accepted incidents in 90 days with a recurrence after repair.
7. **2:35–3:00 — finish on accountability.** End on **“Failed within 35 days of Metro Roads Ltd.'s repair, warranty window 90 days.”** Beside it, show College Road's **HIGH** heuristic risk score and expand the six feature contributions. No report volume, unexplained model verdict, or automatic merge decides an outcome.

## Assumptions and scope choices

- One ward, Ward 12 in Chennai, with ten manually labeled road segments and approximate illustrative map coordinates. These are not municipal/GIS ground-truth records.
- Citizens choose the road segment; officers verify its grouping. Moving a report between segments is a later workflow, so even AI matches cannot currently merge different segments.
- Officer/reviewer profiles are administratively provisioned; no public signup or role editor exists. Reviewers verify; officers assign/repair. Seed citizens all belong to the same demo identity; additional citizens are isolated by reporter ID in RLS.
- “Accepted incident” means the officer created/grouped it. Default severity is 0.5 and sensitive location is false until confirmed at assignment; every assignment/override requires a written reason.
- Calendar due dates use UTC comparisons; displayed timeline timestamps use Asia/Kolkata. Priority waiting uses elapsed 24-hour days. A job due today becomes overdue tomorrow.
- Sequential tickets can have gaps after aborted transactions; numbers are never reused. Every successful ticket is permanent.
- Recorded repair, including pending verification, is sufficient repair history for the recurrence rule. Reviewer rejection clears the unverified repair evidence, so live recomputation removes that rejected repair's attribution.
- Report grouping never deletes tickets. Report and incident status changes each get their own event; a transaction affecting six records legitimately produces six events.
- Notifications are persisted follow-up notes in the officer inbox, visible after refresh, rather than outbound email/push. No additional service key is required.
- Scorecard scope follows the current role's RLS-visible records. A ward officer's contractor failure rate is ward-scoped; a reviewer can see cross-ward data. Only the earliest attributed recurrence per repair contributes to its warranty failure statistics.
- The seasonal heuristic flag is June–November, a coarse demo assumption rather than weather evidence. Fewer than 200 incidents means the MVP ships heuristic scoring only.
- Raw images are not input to the text embedding endpoint. A validated vision description and/or citizen note supplies semantic text. Seed embeddings are prepared only on request to control API cost.
- Fixture dates shift relative to now in the read-only preview to keep the demo story inspectable. Real Supabase dates persist and age normally. The preview is not used to prove database persistence.
- The service worker caches public PWA assets and a generic offline screen only. Authenticated pages, photos, and mutations always require a connection; no queued offline writes exist.
- Native speech support varies by browser. Model narrative and vision confidence are advisory. The 0.50 live confidence default is a declared policy placeholder, not a calibrated model estimate.
- Input-hash caching is per entity/role visibility. OpenAI is optional; no real model output or billing was claimed during this build.
- No external deployment, production database, or municipal integration was assumed. Browser mobile/PWA installation and a live multi-role demo require verification on a configured environment.

## Build later

Multilingual support, municipal integrations, WhatsApp bots, leaderboards, a trained and calibrated ML risk model with more than 200 labeled rows, a fine-tuned pothole classifier, road-segment correction, realtime/push notifications, paginated queues, request budgets/rate limits, and production observability.

## Phase history

Commits follow the requested numbered phases: schema/PWA; auth; reporting; officer workflow; reviewer gate; priority; repair memory; triage/governance; semantic deduplication; brief/voice; risk/scorecard; analytics; full seed story; acceptance tests, connected screens, polish, and this README. Screen assembly and integration were completed in phase 14 after the underlying workflow commits. No phase was squashed away.

## UI refresh and real-road explorer

The follow-up refresh adds a navy/mint operations interface, a prominent repair-memory story, a seven-step judge walkthrough including real dataset evidence, keyboard focus indicators, a skip link, reduced-motion support, and larger mobile controls. These are implementation improvements, not a claim of certified accessibility or a formal “2026 UI standard.” Browser automation timed out during this refresh, so visual desktop/mobile screenshot QA remains unverified. The dashboard and `/roads` both returned HTTP 200, and TypeScript passed.

`/roads` is a searchable, interactive catalogue of **80 real OpenStreetMap road segments / 41 named streets** in a central Chennai sample. Select a row to highlight its geometry and open its source way page. `data/chennai-roads.json` preserves attribution, source endpoint, query bounds, retrieval time, and the upstream snapshot time. The upstream data timestamp is **24 July 2026**, displayed in the UI; retrieval does not make that data real-time.

**Real road geometry is not real complaint history.** The repair-memory records, contractor names, failure dates, and images in the preview remain labeled demo data. No residents' contact information or grievance records were scraped. The [Greater Chennai Corporation grievance portal](https://erp.chennaicorporation.gov.in/pgr/) was reviewed as a reference, but no public licensed complaint/repair feed was verified or connected. Real citizen reports can be collected through the authenticated Supabase workflow after configuration.

Data attribution: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL 1.0. The source dataset is separately licensed under ODbL; this does not assign an OpenStreetMap software license to application code. Refresh the small cached extract explicitly, rather than calling public Overpass services on every page view:

```sh
npm run data:roads
```

The primary public endpoint refused the initial request. The successful extract used the Kumi instance (now Private.coffee), listed in the [OpenStreetMap public Overpass documentation](https://wiki.openstreetmap.org/wiki/Overpass_API). To select that documented instance for a later refresh in PowerShell:

```powershell
$env:OVERPASS_ENDPOINT = 'https://overpass.private.coffee/api/interpreter'
npm run data:roads
```

To prepare a real-road import for a configured Supabase database, first apply migration `202610090015_road_sources.sql`. Review each segment's jurisdiction: the sample is **not** a verified municipal ward boundary. Then generate reviewable SQL for the operator-reviewed ward:

```sh
npm run data:export -- --ward YOUR_VERIFIED_WARD_UUID --ward-assignment-reviewed
```

Review `data/import-roads.sql` before applying it through the SQL Editor. The utility validates numeric OSM IDs, names, coordinates, and the supplied UUID, uses deterministic road IDs, and preserves existing segments/tickets on conflicts. It writes a file only; it never modifies a database. Source URL, OSM way ID, and snapshot time are retained on imported road rows. No fictional incident is reassigned to a real road.

The dataset integration passed browser checks for the six-photo gallery, hiding/restoring all six annotation overlays, and the simulated-report caption on a ticket. Responsive DOM checks showed one gallery column at the phone-sized preview and two columns at the desktop preview, with no body overflow. A full-page gallery screenshot is saved locally as `output/dataset-evidence.jpg` (ignored by Git). The evidence page, ticket and incident pages, and all six PNG routes returned HTTP 200. The production build and TypeScript check passed. Live Supabase storage/authentication and model inference remain unverified.

## Operations dashboard features

### Repair countdown

Every complaint has a live fix-by timer. Before assignment, the target is seven days after its saved submission timestamp and is labeled as a planning target. After assignment, grouped complaints inherit the repair job's persisted officer due date. The entire due date is included in UTC; the countdown turns red at the following midnight and shows time overdue. Recording repair evidence freezes timing while reviewer verification remains a separate step. Verified tickets preserve whether the repair was early or late, and a rejected repair resumes its original deadline.

Timers appear on ticket lists/details, repair details, the dashboard queue and new reports, and the browser-local practice. A shared clock refreshes from wall time every second and after focus/visibility changes. Reloads derive time from original records instead of resetting a timer. Missing or invalid assigned dates display an unavailable state. No additional database migration, API key, background job or notification service is required. Live authentication and persistence still require the existing Supabase setup; unconfigured deployments serve labeled demo data plus browser-local practice.

The separately registered private deployment checkout is `sites/roadwatch-countdown`. The original inaccessible `sites/roadwatch` identity is preserved.

The dashboard now has an action center for report confirmation, unassigned work, pending verification and overdue jobs; switchable 7/30/90-day report/verified-repair trends; a four-stage repair pipeline; active workload by officer; a seven-day deadline calendar; and a ticket/repair activity filter with links to recorded histories. Trends use UTC calendar buckets, exclude future timestamps, and count a repair as verified only when its incident is closed and it has a recorded reviewer and verification timestamp. All summaries use the RLS-visible dataset; counts are not citywide coverage claims. The seed includes two additional scheduled assignments to demonstrate upcoming deadlines.

Search the active queue by road, permanent ticket ID or contractor, filter by status, and sort by priority, age or due date. Unscheduled jobs sort after dated jobs. Filtering and sorting never change the priority formula or database records. CSV export includes only the currently filtered visible queue, with a preview, demo filename labeling, escaped fields and protection against spreadsheet formulas. No private storage paths or user credentials are exported.

Browser verification confirmed the trend switches, ticket/repair activity filters, combined search/status/sort, clearing the filters, and a filtered single-job CSV preview. Responsive DOM checks showed one-column operations panels on a phone-sized viewport and multiple columns on desktop, with no body overflow. The in-app browser did not emit a download event for the Blob CSV link, so download completion remains unverified in that environment; CSV content and escaping passed unit tests. Dashboard screenshot: `output/operations-dashboard.jpg` (ignored by Git). Live Supabase integration tests remain skipped until configured.
