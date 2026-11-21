import fs from "fs/promises";
import path from "path";
import { print, sleep } from "../../shared/utils.js";
import {
  DOWNLOAD_DIR,
  MAX_RETRIES,
  PAGE_DELAY,
  RETRY_DELAY,
} from "../../config/app.config.js";

/**
 * Base abstract class for manga site providers.
 */
export class BaseProvider {
  constructor(options = {}) {
    this.baseDownloadPath = path.join(process.cwd(), DOWNLOAD_DIR);
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.retryDelay = options.retryDelay ?? RETRY_DELAY;
    this.pageDelay = options.pageDelay ?? PAGE_DELAY;
    this.lastExtractedTitle = null;
  }

  /**
   * Checks if this provider can handle the given URL.
   * @param {string} url
   * @returns {boolean}
   */
  canHandle(url) {
    throw new Error("canHandle() must be implemented by provider");
  }

  /**
   * Extracts the manga slug / identifier from a URL.
   * @param {string} url
   * @returns {string}
   */
  extractMangaSlug(url) {
    throw new Error("extractMangaSlug() must be implemented by provider");
  }

  /**
   * Fetches chapters list for the manga URL.
   * @param {string} mangaUrl
   * @returns {Promise<Array<object>>}
   */
  async getChaptersList(mangaUrl) {
    throw new Error("getChaptersList() must be implemented by provider");
  }

  /**
   * Downloads a single chapter.
   * @param {object} chapterData - Metadata of the chapter.
   * @param {string} mangaTitle
   * @param {string} mangaSlug
   * @param {number|string|null} branchConfig
   * @returns {Promise<number>} Number of downloaded pages.
   */
  async downloadChapter(chapterData, mangaTitle, mangaSlug, branchConfig) {
    throw new Error("downloadChapter() must be implemented by provider");
  }

  /**
   * Builds standardized chapter folder name.
   */
  buildChapterFolderName(volume, number, name) {
    let folderName = `Volume ${volume} Chapter ${number}`;
    if (name && typeof name === "string") {
      const trimmed = name.trim();
      // Avoid duplicating "Chapter X" if name already starts with or is Chapter X
      const lowerTrimmed = trimmed.toLowerCase();
      const defaultName = `chapter ${number}`.toLowerCase();
      if (trimmed && lowerTrimmed !== defaultName) {
        folderName += ` ${trimmed}`;
      }
    }
    return folderName;
  }

  /**
   * Sanitizes folder names for filesystem safety (especially on Windows).
   */
  sanitizeFolderName(name) {
    const sanitized = String(name)
      .replace(/[<>:"/\\|?*]/g, "_")
      .trim()
      .replace(/[. ]+$/g, "");

    return sanitized || "_";
  }

  /**
   * Creates directory for a chapter if it doesn't already exist.
   */
  async createChapterDirectory(mangaTitle, chapterName) {
    const dir = path.join(
      this.baseDownloadPath,
      this.sanitizeFolderName(mangaTitle),
      this.sanitizeFolderName(chapterName)
    );
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  /**
   * Generic fetch wrapper with retries and status checks.
   */
  async fetchWithRetry(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok && response.status !== 404) {
          throw new Error(`HTTP ${response.status}: ${url}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await sleep(this.retryDelay);
        }
      }
    }

    throw lastError;
  }
}
