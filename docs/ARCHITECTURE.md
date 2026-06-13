# Architecture

## Components

```text
index.js
  -> MangaDownloader
     -> MangalibAPI
     -> MangaService
        -> Sequelize models
           -> SQLite
```

- `index.js` starts the application, initializes SQLite, runs the downloader,
  and closes resources.
- `src/config/app.config.js` is the single source of runtime constants and
  applies defaults to values read from `config.json`.
- `src/service/download.service.js` coordinates searches, chapter downloads,
  error handling, and delays between work items.
- `src/module/mangalib/mangalib_api.js` calls the Mangalib API, retries failed
  requests, creates download directories, and writes images.
- `src/service/manga.service.js` persists manga, chapter metadata, page state,
  and download progress.
- `src/teapot/models/` contains the Sequelize models and relationships.
- `src/teapot/sqlite/sqlite_db.js` owns the SQLite connection lifecycle.

## Data Model

```text
Manga 1 -> many Chapter 1 -> many Page
```

- `Manga` stores the configured URL, title, and completion flag.
- `Chapter` stores a stable key, raw API metadata, download state, and page
  count.
- `Page` supports detailed page tracking, although the current download path
  primarily tracks completion at chapter level.

## Configuration Boundary

Operational constants belong in `src/config/app.config.js`. Values intended for
users are exposed through `config.example.json`; source modules import the
normalized exports and do not contain service URLs, retry counts, or delay
values.

## Directory Layout

```text
.
|-- config.example.json
|-- docs/
|   |-- ARCHITECTURE.md
|   `-- README.md
|-- index.js
|-- package.json
`-- src/
    |-- config/app.config.js
    |-- module/mangalib/mangalib_api.js
    |-- service/
    |   |-- download.service.js
    |   `-- manga.service.js
    |-- shared/utils.js
    `-- teapot/
        |-- models/
        `-- sqlite/sqlite_db.js
```
