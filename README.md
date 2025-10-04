# kiroku-dl-mangalib

A Node.js application for downloading manga from Mangalib.me with automatic chapter tracking and download management.

## Features

- 📚 Download complete manga series automatically
- 🔄 Track downloaded chapters to avoid duplicates
- 💾 SQLite database for persistent download history
- 🌐 Browser automation with Playwright
- ⚙️ Configurable download settings
- 🎯 Multiple manga support through config
- 🔁 Automatic retry on failed downloads
- 📊 Progress tracking and logging

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd mangalib-downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

## Configuration

The application is configured through `config.json` file in the root directory.

### Basic Configuration

```json
{
  "app": {
    "downloadDir": "downloads"
  },
  "browser": {
    "headless": true,
    "timeout": 30000
  },
  "download": {
    "delay": 4000,
    "pageDelay": 4000,
    "searchDelay": 6000,
    "skipDownloaded": true,
    "useDatabase": true
  },
  "database": {
    "enabled": true,
    "sync": true
  },
  "searches": [
    {
      "name": "Your Manga Name",
      "url": "https://mangalib.me/ru/manga/xxxxx--manga-name?section=chapters",
      "skipDownloaded": true
    }
  ]
}
```

### Configuration Options

#### App Settings
- `downloadDir` - Directory where manga will be saved (default: `downloads`)

#### Browser Settings
- `headless` - Run browser in headless mode (default: `true`)
- `timeout` - Maximum time to wait for page loads in milliseconds (default: `30000`)

#### Download Settings
- `delay` - Delay between downloads in milliseconds (default: `4000`)
- `pageDelay` - Delay between page downloads in milliseconds (default: `4000`)
- `searchDelay` - Delay between search operations in milliseconds (default: `6000`)
- `skipDownloaded` - Skip already downloaded chapters (default: `true`)
- `useDatabase` - Use database for tracking downloads (default: `true`)

#### Database Settings
- `enabled` - Enable database functionality (default: `true`)
- `sync` - Automatically sync database schema (default: `true`)

#### Searches
Add manga you want to download in the `searches` array:
- `name` - Display name for the manga
- `url` - Full URL to the manga's chapters page on Mangalib.me
- `skipDownloaded` - Skip already downloaded chapters for this manga

## Usage

### Basic Usage

1. **Configure your manga list**
   
   Edit `config.json` and add manga URLs to the `searches` array:
   ```json
   "searches": [
     {
       "name": "Oshi no Ko",
       "url": "https://mangalib.me/ru/manga/29759--oshi-no-ko?section=chapters",
       "skipDownloaded": true
     }
   ]
   ```

2. **Run the downloader**
   ```bash
   npm start
   ```
   or
   ```bash
   node index.js
   ```

### Finding Manga URLs

1. Go to [Mangalib.me](https://mangalib.me)
2. Search for your desired manga
3. Navigate to the manga's page
4. Add `?section=chapters` to the URL
5. Copy the complete URL

Example: `https://mangalib.me/ru/manga/29759--oshi-no-ko?section=chapters`

## Project Structure

```
mangalib-downloader/
├── src/
│   ├── config/
│   │   └── app.config.js      # Application configuration
│   ├── module/
│   │   ├── browser/
│   │   │   └── browser.js     # Browser initialization
│   │   └── mangalib/
│   │       └── mangalib_api2.js  # Mangalib API wrapper
│   ├── service/
│   │   ├── download.service.js   # Download orchestration
│   │   └── manga.service.js      # Database operations
│   ├── shared/
│   │   ├── utils.js           # Utility functions
│   │   └── message.js         # Messages and constants
│   └── teapot/
│       ├── models/            # Sequelize models
│       └── sqlite/
│           └── sqlite_db.js   # Database initialization
├── downloads/                  # Downloaded manga (auto-created)
├── config.json                # Main configuration file
├── index.js                   # Application entry point
└── package.json
```

## Database

The application uses SQLite to track downloads. The database file is created automatically in the root directory.

### Database Schema

- **Manga** - Stores manga information (title, URL)
- **Chapter** - Stores chapter information (name, URL, download status)
- **Page** - Stores individual page information (optional, for detailed tracking)

The database ensures:
- No duplicate downloads
- Resume capability after interruption
- Download history tracking

## Download Structure

Downloaded manga will be organized as follows:

```
downloads/
└── Manga Title/
    ├── Chapter 1/
    │   ├── page_001.jpg
    │   ├── page_002.jpg
    │   └── ...
    ├── Chapter 2/
    │   ├── page_001.jpg
    │   └── ...
    └── ...
```

## Troubleshooting

### Common Issues

**"Database is disabled in config"**
- Ensure `useDatabase` is set to `true` in `config.json`

**"Failed to initialize database"**
- Check file permissions in the project directory
- Ensure SQLite is properly installed with dependencies

**Browser fails to start**
- Run `npx playwright install chromium` again
- Check if you have enough disk space
- Try setting `headless: false` to see what's happening

**Download fails or hangs**
- Increase timeout values in `config.json`
- Check your internet connection
- Verify the manga URL is correct and accessible

**"Could not find chapters container"**
- The website structure may have changed
- Verify the URL includes `?section=chapters`
- Try accessing the URL manually in a browser

## Performance Tips

- Keep `headless: true` for better performance
- Adjust delay values based on your internet speed and Mangalib's rate limits
- Use `skipDownloaded: true` to avoid re-downloading
- Run one manga at a time for stability

## Limitations

- This tool is for personal use only
- Respect Mangalib's terms of service and rate limits
- Downloaded content should not be redistributed
- The tool may break if Mangalib changes their website structure

## Contributing

This is a quick utility project. Feel free to fork and modify for your needs.

## Disclaimer

This tool is provided for educational purposes only. Users are responsible for complying with Mangalib's terms of service and applicable copyright laws. The authors are not responsible for any misuse of this software.

## License

MIT License - feel free to use and modify as needed.

---

**Note**: This is a quick utility tool built for personal manga downloading. It may require updates if the Mangalib website structure changes.