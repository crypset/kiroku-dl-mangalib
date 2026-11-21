import { print, sleep } from "../shared/utils.js";
import { ProviderFactory } from "../module/provider_factory.js";
import { MangaService } from "./manga.service.js";
import {
  CHAPTER_DELAY,
  GLOBAL_SKIP_DOWNLOADED,
  SEARCH_DELAY,
  SEARCH_LIST,
  SKIP_ERRORS,
} from "../config/app.config.js";

export class MangaDownloader {
  constructor() {
    this.providerFactory = new ProviderFactory();
    this.mangaService = new MangaService();
    // Kept for backward compatibility if accessed externally
    this.api = this.providerFactory.providers[0];
  }

  /**
   * initialize() kept for API compatibility with index.js,
   * but nothing needs to be set up now (no browser).
   */
  async initialize() {
    print("Downloader initialized (Multi-provider API mode)", "success");
  }

  async downloadAll() {
    for (const [index, search] of SEARCH_LIST.entries()) {
      try {
        await this.processManga(search);
      } catch (error) {
        if (!SKIP_ERRORS) throw error;
        print(`Skipping "${search.name || search.url}" after error`, "warning");
      }

      if (index < SEARCH_LIST.length - 1) {
        await sleep(SEARCH_DELAY);
      }
    }
  }

  async processManga(search) {
    try {
      print(`Processing: ${search.name || search.url}`, "info");

      const provider = this.providerFactory.getProvider(search.url);
      const mangaSlug = provider.extractMangaSlug(search.url);

      // Persist manga record
      const manga = await this.mangaService.getOrCreateManga(
        search.url,
        search.name
      );

      // If manga is marked as completed and scan is disabled, skip chapter check
      if (manga.isCompleted && search.scan === false) {
        print(
          `Manga "${manga.title || mangaSlug}" is completed and scan=false, skipping chapter check`,
          "info"
        );
        // Still download any chapters that are already in DB but not downloaded
        const pending = await this.mangaService.getChapters(manga.id, true);
        if (pending.length === 0) {
          print(`No pending chapters for "${manga.title || mangaSlug}"`, "info");
          return;
        }
        print(`${pending.length} pending chapters to download`, "info");
        await this.downloadPendingChapters(
          pending,
          manga,
          mangaSlug,
          search.branch,
          provider
        );
        return;
      }

      // Fetch fresh chapter list from the appropriate provider
      const apiChapters = await provider.getChaptersList(search.url);

      // If manga title is missing in DB but was extracted by provider, persist it
      if (!manga.title && provider.lastExtractedTitle) {
        manga.title = provider.lastExtractedTitle;
        await manga.save();
      }

      // Save new chapters to DB (skips already-known ones)
      await this.mangaService.saveApiChapters(manga.id, apiChapters);

      // Get all chapters that haven't been downloaded yet
      const skipDownloaded =
        search.skipDownloaded ?? GLOBAL_SKIP_DOWNLOADED;
      const undownloaded = await this.mangaService.getChapters(
        manga.id,
        skipDownloaded
      );
      print(`Chapters to download: ${undownloaded.length}`, "info");

      const displayTitle = manga.title || search.name || mangaSlug;

      if (undownloaded.length === 0) {
        print(`"${displayTitle}" is up to date`, "success");
        return;
      }

      await this.downloadPendingChapters(
        undownloaded,
        manga,
        mangaSlug,
        search.branch,
        provider
      );

      print(`Completed: ${displayTitle}`, "success");
    } catch (error) {
      print(
        `Error processing manga "${search.name || search.url}": ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  async downloadPendingChapters(
    chapters,
    manga,
    mangaSlug,
    branchConfig,
    provider = this.api
  ) {
    const displayTitle = manga.title || mangaSlug;
    for (const chapter of chapters) {
      await this.downloadChapter(
        chapter,
        displayTitle,
        mangaSlug,
        branchConfig,
        provider
      );
      await sleep(CHAPTER_DELAY);
    }
  }

  async downloadChapter(
    chapter,
    mangaTitle,
    mangaSlug,
    branchConfig,
    provider = this.api
  ) {
    try {
      // chapter.meta holds the raw API chapter object stored during saveApiChapters
      const chapterMeta = chapter.meta ? JSON.parse(chapter.meta) : null;

      if (!chapterMeta) {
        print(`No metadata for chapter "${chapter.name}", skipping`, "warning");
        return;
      }

      const totalPages = await provider.downloadChapter(
        chapterMeta,
        mangaTitle,
        mangaSlug,
        branchConfig
      );

      await this.mangaService.markChapterAsDownloaded(chapter.id, totalPages);
    } catch (error) {
      print(
        `Error downloading chapter "${chapter.name}": ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  /**
   * close() kept for API compatibility with index.js cleanup.
   */
  async close() {
    print("Downloader closed", "system");
  }
}
