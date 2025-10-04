import { print, sleep } from "../shared/utils.js";
import { MangalibAPI } from "../module/mangalib/mangalib_api.js";
import { init } from "../module/browser/browser.js";
import { MangaService } from "./manga.service.js";
import { SEARCH_LIST, HEADLESS } from "../config/app.config.js";

export class MangaDownloader {
  constructor() {
    this.context = null;
    this.api = null;
    this.mangaService = new MangaService();
  }

  async initialize() {
    this.context = await init("default", HEADLESS);
    this.api = new MangalibAPI(this.context);
    print("Downloader initialized", "success");
  }

  async downloadAll() {
    if (!this.api) {
      throw new Error("Downloader not initialized. Call initialize() first.");
    }

    for (const search of SEARCH_LIST) {
      await this.processManga(search);
    }
  }

  async processManga(search) {
    try {
      print(`Processing: ${search.name || search.url}`, "info");

      const manga = await this.mangaService.getOrCreateManga(
        search.url.replace("https://mangalib.org", "https://mangalib.me").replace("from=catalog&", ""),
        search.name
      );

      const chapters = await this.api.getChaptersList(search.url);
      await this.mangaService.saveChapters(manga.id, chapters);

      const undownloadedChapters = await this.mangaService.getUndownloadedChapters(
        manga.id
      );

      print(`Undownloaded chapters: ${undownloadedChapters.length}`, "info");

      for (const chapter of undownloadedChapters) {
        await this.downloadChapter(chapter, manga.title);
        await sleep(2000);
      }

      print(`Completed: ${manga.title}`, "success");
    } catch (error) {
      print(`Error processing manga: ${error.message}`, "error");
      throw error;
    }
  }

  async downloadChapter(chapter, mangaTitle) {
    try {
      const totalPages = await this.api.downloadChapter(
        chapter.url,
        chapter.name,
        mangaTitle
      );

      await this.mangaService.markChapterAsDownloaded(chapter.id, totalPages);
    } catch (error) {
      print(`Error downloading chapter ${chapter.name}: ${error.message}`, "error");
      throw error;
    }
  }

  async close() {
    if (this.context) {
      try {
        await this.context.close();
        print("Browser context closed", "system");
      } catch (error) {
        print(`Error closing browser: ${error.message}`, "error");
      }
    }
  }
}