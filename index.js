import { print, _error, banner } from "./src/shared/utils.js";
import { MangaDownloader } from "./src/service/download.service.js";
import {
  initializeDatabase,
  closeDatabase,
} from "./src/teapot/sqlite/sqlite_db.js";
import { USE_DATABASE } from "./src/config/app.config.js";
import { WELCOM_MESSAGE, SUB_TITLE } from "./src/shared/message.js";

async function main() {
  let downloader = null;

  try {
    banner(WELCOM_MESSAGE, SUB_TITLE);
    print("Starting Mangalib downloader...", "system");

    if (!USE_DATABASE) {
      print("Database is disabled in config", "system");
      return;
    }

    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      print("Failed to initialize database. Exiting...", "error");
      return;
    }

    downloader = new MangaDownloader();
    await downloader.initialize();
    await downloader.downloadAll();

    print("Download completed successfully!", "success");
  } catch (error) {
    print(`Error: ${error.message}`, "error");
    console.error(error.stack);
  } finally {
    await cleanup(downloader);
  }
}

async function cleanup(downloader) {
  try {
    if (downloader) {
      await downloader.close();
    }
    await closeDatabase();
    print("Cleanup completed. Shutting down...", "system");
  } catch (error) {
    print(`Cleanup error: ${error.message}`, "error");
  }
}

process.on("SIGINT", async () => {
  print("Received interrupt signal. Shutting down gracefully...", "system");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  print("Received terminate signal. Shutting down gracefully...", "system");
  process.exit(0);
});

main()
  .then(() => process.exit(0))
  .catch((error) => {
    print(`Unhandled error: ${error.message}`, "error");
    console.error(error.stack);
    process.exit(1);
  });
