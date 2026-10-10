# RoadWatch finals handoff

Public app: https://roadwatch-hema-protohack.hemabhushantadithuri.chatgpt.site

Open `/presentation` for the pitch, three-minute demo, architecture and Q&A. Open `/try` for the browser-local end-to-end lifecycle.

## Team evidence — awaiting the team's confirmation

- Product / UX owner and actual contribution: not supplied by the team.
- Workflow / backend owner and actual contribution: not supplied by the team.
- Data / AI owner and actual contribution: not supplied by the team.
- Demo / QA owner and actual contribution: not supplied by the team.
- Actual event start, finish and time spent: not supplied; Git timestamps do not establish attendance or event duration.
- Work built during the event versus prepared beforehand: not supplied; this distinction requires the team's event records.

Combine roles if needed. Do not infer individual contributions or a 3–4 hour build from generated documentation. Use commit history and the team's real event records.

The code, UI changes, tests and deployment work in this Codex session were AI-assisted. The generated Git author identity does not prove that a particular human teammate implemented a change. Do not present these six pending facts as completed evidence.

## Verified engineering evidence

- The source history records the staged MVP, sourced road and photo data, expanded operations dashboard, practice lifecycle, presentation page and interaction fixes.
- `docs/BUTTON-AUDIT.md` records tested controls and the limits of live-backend and download verification.
- The separate-incident example is RW-0008 versus RW-0007: their simulated Station Road pins are approximately 30 metres apart and their incident IDs differ. The grouping rule allows at most 20 metres.
- Fresh public `/login` and `/try` were inspected at a 390 × 844 phone-sized browser viewport. This is browser verification, not a physical-phone test.
- The downloadable handoff includes a portable Git bundle and readable commit log. See `docs/GITHUB-HANDOFF.md` for restoring history and the current publication status.

## Rehearsal checklist

- On the presentation device, create a practice report, assign it, record repair evidence, verify it and reload.
- Show the preserved citizen ticket and all four timeline events.
- Explain that practice storage is local to the browser and role previews are simulation.
- Identify real Kaggle photos and OSM road data separately from simulated histories and repair illustration.
- Show the deterministic priority components and repeat-failure example.
- Each member answers a question about the part they actually contributed.
- State the next milestone: configure and verify live Supabase workflows; evaluate trained ML before claiming model performance.

## Deliverable standard coverage

The main public flow was previously read only. The new practice implements report → assignment → after-evidence → reviewer closure, with browser persistence, validation, recoverable errors and an inspectable timeline. The existing dashboard, navigation, real-data provenance, source structure and public build remain available. `/presentation` supplies the explanation and live-demo script.

This is a meaningful evaluation MVP. It does not establish operational multiuser readiness: backend credentials and live integration tests remain outstanding. Teamwork, actual event duration and judge response must be demonstrated by the team; they cannot be satisfied by code alone.
