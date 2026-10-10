# RoadWatch interaction audit — 10 October 2026

The public Sites app and the updated local app were checked through the in-app browser. This audit covers the available demo controls; it does not certify an unconfigured live backend.

## Fixes

- Queue inputs now remount when URL filters change, so Reset and filter navigation show the values actually used by the result list.
- The CSV export preview uses normal layout instead of covering queue controls, with an explicit Close export action.
- CSV and practice JSON exports have persistent download links, inspectable previews, copy buttons, and success/failure feedback. Blob URLs remain valid until the export changes or unmounts.
- The unconfigured sign-in page offers working practice and role perspective links, without an unusable login form or displayed seed passwords.
- A street filtered out of search no longer appears as the selected map geometry.
- Queue, repair memory, calendar, activity, map and repair-history links preserve the selected demo role. Authenticated roles still come from the backend.
- Unavailable AI, follow-up and shared repair actions explain the required backend or account setup.
- The error boundary recognizes stale JavaScript chunks after deployment and offers a full-page reload instead of repeatedly resetting a cached failed import. A reload was verified to recover an open tab after the version changed.

## Browser checks completed

- Dashboard trend switches (7, 30 and 90 days), activity switches, chart values, risk explanations, walkthrough Next/Back/jump/close, and queue search/filter/sort controls.
- Queue search for RW-0007 with assigned status and due-date sorting returned one Station Road job. Reset restored six jobs and cleared the displayed selections. Overdue, repeat and awaiting-review queues returned their expected single examples.
- Citizen ticket links opened the retained timeline and linked repair. Repair history and reviewer perspective links were inspected.
- Real-road search, street selection, original OSM source link, empty search and selection clearing were exercised.
- Dataset annotation toggle removed all six overlays and restored them. All three AI audit snapshots and all nine presentation Q&A disclosures opened.
- Practice: blank required description prevented submission; a valid report was created, severity and sensitive location confirmed, contractor assigned, required repair evidence recorded, and reviewer closure saved with all four timeline events after reload.
- Practice photo input rejected a Markdown file and accepted a real PNG sample, rendered as a local data URL. A second ticket could be created and the older closed ticket selected again.
- Reset Cancel preserved the ticket. Clear practice data was not executed against existing stored records.
- Practice JSON export preview was available and Copy export succeeded. Download-event capture timed out in the in-app browser for both the original hidden-anchor approach and the persistent link. Actual download completion is therefore unverified in this browser; preview and copy provide an alternative.

## Handoff follow-up verification

- Fresh public `/login` displayed “Choose your perspective” and no seed passwords; its practice link opened `/try` successfully at 390 × 844. Screenshots are included in the source ZIP. A physical phone was not available for testing.
- The public JSON download was retried from a fresh tab at phone width. No completed download event was captured after eight seconds. It remains unverified; this is not proof that all browsers fail to download it.
- RW-0008's wording now distinguishes its separate incident from the five tickets sharing the earlier College Road incident. The ticket details expose the simulated 30-metre separation from RW-0007 and the 20-metre grouping limit.
- Role-restricted live views do not infer that an incident has only one report merely because only one report is visible.

## Automated validation

- 77 regression tests passed, including four ticket-linkage checks; 10 live database integration tests were skipped because no test database was configured.
- TypeScript validation and the Next.js production build passed.
- Public hosting is built separately using the Sites Vinext adapter before publication.

## Live integration limits

Supabase authentication, shared report uploads, saved municipal changes, reviewer return-to-officer actions, follow-up submission, and provider-backed AI calls need configured credentials and a real backend. Their shared-demo controls are intentionally disabled or replaced with available practice links. The browser practice uses local persistence and simulated roles; it is not real authorization or shared storage.
