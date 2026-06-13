
# ARCHITECTURE

project-root
├── config.json
├── config2.json
├── index.js
├── LICENSE
├── package.json
├── README.md
├── spam.js
├── data/
│   ├── default/
│   └── session/
├── docs/
│   └── ARCHITECTURE.md
├── downloads/
└── src/
    ├── config/
    │   ├── index.js
    │   ├── default.json
    │   └── env.js
    ├── module/
    │   ├── downloader/
    │   │   ├── index.js
    │   │   ├── fetcher.js
    │   │   └── queue.js
    │   ├── parser/
    │   │   ├── index.js
    │   │   ├── mangaParser.js
    │   │   └── chapterParser.js
    │   ├── scraper/
    │   │   ├── index.js
    │   │   └── siteAdapters/
    │   │       └── mangalibAdapter.js
    │   └── storage/
    │       ├── index.js
    │       └── sqlite.js
    ├── service/
    │   ├── api/
    │   │   ├── index.js
    │   │   └── routes/
    │   │       └── downloads.js
    │   ├── worker/
    │   │   ├── index.js
    │   │   └── jobs/
    │   └── scheduler/
    │       └── cron.js
    ├── shared/
    │   ├── logger.js
    │   ├── constants.js
    │   ├── utils/
    │   │   ├── fs.js
    │   │   └── helpers.js
    │   └── types/
    └── teapot/
        ├── index.js
        └── README.md

Short legend:
- `data/` — application data and sessions
- `docs/` — project documentation
- `downloads/` — downloaded series/chapters
- `src/` — source code (split into submodules)

This file was generated automatically. I can expand the structure with more
detail if needed.
