# GitHub and portable source history

The team supplied the repository https://github.com/keerthana911-netizen/ROADWATCH.
It contains the versioned root RoadWatch application. The public application demo is https://roadwatch-hema-protohack.hemabhushantadithuri.chatgpt.site.

The source ZIP includes these additional files under `history/`:

- `roadwatch.bundle`: full root-project commit history through the handoff commit, without local credentials or Git configuration.
- `COMMITS.txt`: readable commit hashes, timestamps and subjects.
- `README.md`: restore instructions.

To restore the versioned root project after extracting the ZIP:

```powershell
git clone .\RoadWatch\history\roadwatch.bundle .\RoadWatch-with-history
git -C .\RoadWatch-with-history log --oneline
```

The hosting adapter is supplied separately in the ZIP's `RoadWatch/sites/roadwatch/` directory. It is intentionally excluded from the root Git repository to prevent dependency and build conflicts. The Site service separately preserves its pushed source versions.

To obtain the source and its history directly from GitHub:

```powershell
git clone https://github.com/keerthana911-netizen/ROADWATCH.git
cd ROADWATCH
npm ci
npm run dev
```

The source ZIP additionally includes the separate hosting adapter and a portable history bundle. Secrets, installed dependencies and generated build caches are excluded.

Commit times and authors record source changes. They do not establish the hackathon's start/finish times, human ownership or whether a change happened at the event.

