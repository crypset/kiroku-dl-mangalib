# Kiroku Mangalib Downloader

Kiroku is a Node.js command-line downloader for manga hosted on Mangalib. It
uses Mangalib's JSON API directly, downloads chapter images sequentially, and
stores chapter state in SQLite so later runs only download new content.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
cp config.example.json config.json
npm start
```

On Windows PowerShell, copy the configuration with:

```powershell
Copy-Item config.example.json config.json
```

`config.json`, `pot.sqlite`, and downloaded files are local runtime data and
must not be committed.

## Configuration

All runtime settings are read by `src/config/app.config.js`. The checked-in
`config.example.json` contains every supported option and its recommended
default.

### App

| Option | Default | Description |
| --- | --- | --- |
| `app.downloadDir` | `downloads` | Root directory for downloaded manga. |

### API

| Option | Default | Description |
| --- | --- | --- |
| `api.baseUrl` | `https://api.cdnlibs.org/api` | Mangalib JSON API base URL. |
| `api.imageBaseUrl` | `https://img3.mixlib.me` | Image host base URL. |
| `api.referer` | `https://mangalib.me/` | Referer sent with API requests. |
| `api.timeZone` | `Europe/Kiev` | Time zone header sent to the API. |
| `api.siteId` | `1` | Mangalib site identifier. |
| `api.acceptLanguage` | `en-US,en;q=0.5` | Image request language header. |

### Download

All delay values are in milliseconds.

| Option | Default | Description |
| --- | --- | --- |
| `download.pageDelay` | `300` | Small pause after each image download. |
| `download.delay` | `4000` | Pause between chapters. |
| `download.searchDelay` | `6000` | Pause between manga entries. |
| `download.maxRetries` | `3` | Maximum request attempts. |
| `download.retryDelay` | `2000` | Pause before retrying a failed request. |
| `download.skipErrors` | `true` | Continue with the next manga after an error. |
| `download.skipDownloaded` | `true` | Skip chapters marked as downloaded by default. |
| `download.useDatabase` | `true` | Enable the required SQLite state store. |

### Database

| Option | Default | Description |
| --- | --- | --- |
| `database.enabled` | `true` | Enable SQLite. |
| `database.sync` | `true` | Synchronize Sequelize models at startup. |
| `database.storage` | `./pot.sqlite` | SQLite file path. |
| `database.logging` | `false` | Enable Sequelize SQL logging. |

### Searches

Each object in `searches` supports:

| Option | Required | Description |
| --- | --- | --- |
| `name` | yes | Display name and download folder name. |
| `url` | yes | Full Mangalib manga URL. |
| `branch` | no | One-based branch number or translation-team slug. |
| `scan` | no | With `false`, skip API scans when the DB manga record is completed. |
| `skipDownloaded` | no | Override the global skip setting for this manga. |

Example:

```json
{
  "name": "Example Manga",
  "url": "https://mangalib.me/ru/manga/12345--example",
  "branch": 1,
  "scan": true,
  "skipDownloaded": true
}
```

## Runtime Flow

1. Initialize and synchronize SQLite.
2. Read each manga entry from `config.json`.
3. Fetch its chapter list from the Mangalib API.
4. Save newly discovered chapter metadata.
5. Download pending chapter images sequentially.
6. Wait `pageDelay` after every image and mark completed chapters in SQLite.

Downloaded files are organized as:

```text
downloads/
  Manga Title/
    Volume 1 Chapter 2 Chapter Name/
      1.png
      2.png
```

## Verification

Run the static syntax check:

```bash
npm run check
```

The project currently has no automated unit or integration tests.

## Notes

- `scan: false` only skips scans after the manga row has `isCompleted = true`.
- Deleting `pot.sqlite` resets all download history.
- A chapter remains pending when any page still fails after all retries.
- Use the downloader only where you have permission and respect service limits.
