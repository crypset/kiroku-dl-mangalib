import { print, sleep } from "../../shared/utils.js";
import fs from "fs/promises";
import path from "path";
import {
  API_BASE_URL,
  API_HEADERS,
  DOWNLOAD_DIR,
  IMAGE_BASE_URL,
  IMAGE_HEADERS,
  MAX_RETRIES,
  PAGE_DELAY,
  RETRY_DELAY,
} from "../../config/app.config.js";

export class MangalibAPI {
  constructor() {
    this.baseDownloadPath = path.join(process.cwd(), DOWNLOAD_DIR);
    this.maxRetries = MAX_RETRIES;
    this.retryDelay = RETRY_DELAY;
  }

  /**
   * Extracts the manga slug from a full mangalib URL.
   * e.g. "https://mangalib.me/ru/manga/9664--dosanko-gyaru-is-mega-cute?section=chapters"
   *      becomes "9664--dosanko-gyaru-is-mega-cute"
   */
  extractMangaSlug(url) {
    const match = url.match(/\/manga\/([^/?#]+)/);
    if (!match) throw new Error(`Cannot extract manga slug from URL: ${url}`);
    return match[1];
  }

  /**
   * Resolves which branch index to use.
   * branchConfig can be:
   *   - undefined / null: use index 0 (first branch)
   *   - number: use that index - 1 (1-based)
   *   - string: match by slug
   */
  resolveBranchIndex(branches, branchConfig) {
    if (!branchConfig) return 0;

    if (typeof branchConfig === "number") {
      const idx = branchConfig - 1;
      if (idx < 0 || idx >= branches.length) {
        print(
          `Branch ${branchConfig} not found, falling back to first branch`,
          "warning"
        );
        return 0;
      }
      return idx;
    }

    // string slug
    const idx = branches.findIndex((b) =>
      b.teams?.some((t) => t.slug === branchConfig)
    );
    if (idx === -1) {
      print(
        `Branch slug "${branchConfig}" not found, falling back to first branch`,
        "warning"
      );
      return 0;
    }
    return idx;
  }

  /**
   * Fetches the full chapters list for a manga.
   * Returns an array of chapter objects from the API (data[]).
   */
  async getChaptersList(mangaUrl) {
    const slug = this.extractMangaSlug(mangaUrl);
    const apiUrl = `${API_BASE_URL}/manga/${slug}/chapters`;

    print(`Fetching chapters for: ${slug}`, "info");

    const response = await this.fetchWithRetry(apiUrl, { headers: API_HEADERS });
    const json = await response.json();

    if (!json?.data) {
      throw new Error(`Unexpected chapters response for ${slug}`);
    }

    print(`Found ${json.data.length} chapters`, "success");
    return json.data; // raw API chapter objects
  }

  /**
   * Fetches page list for a single chapter.
   * Returns pages array from data.pages.
   */
  async getChapterPages(mangaSlug, volume, number, branchId) {
    const params = new URLSearchParams({
      volume,
      number,
      ...(branchId ? { branch_id: branchId } : {}),
    });

    const apiUrl = `${API_BASE_URL}/manga/${mangaSlug}/chapter?${params}`;

    const response = await this.fetchWithRetry(apiUrl, { headers: API_HEADERS });
    const json = await response.json();

    if (!json?.data?.pages) {
      throw new Error(
        `Unexpected pages response for vol${volume} ch${number}`
      );
    }

    return json.data.pages;
  }

  /**
   * Downloads all pages for a chapter and saves them to disk.
   * Returns number of successfully downloaded pages.
   */
  async downloadChapter(chapterData, mangaTitle, mangaSlug, branchConfig) {
    const { volume, number, name, branches } = chapterData;

    // Resolve branch
    const branchIdx = this.resolveBranchIndex(branches ?? [], branchConfig);
    const branch = branches?.[branchIdx];
    const branchId = branch?.branch_id ?? null;

    // Build chapter folder name: "Volume 1 Chapter 0 Oneshot" or "Volume 1 Chapter 1"
    const chapterFolderName = this.buildChapterFolderName(volume, number, name);

    print(`Downloading: ${chapterFolderName}`, "info");

    // Get pages
    const pages = await this.getChapterPages(mangaSlug, volume, number, branchId);
    print(`  ${pages.length} pages found`, "info");

    const chapterDir = await this.createChapterDirectory(
      mangaTitle,
      chapterFolderName
    );

    let successCount = 0;

    for (const page of pages) {
      const downloaded = await this.downloadPageWithRetry(page, chapterDir);
      if (downloaded) successCount++;
      await sleep(PAGE_DELAY);
    }

    print(
      `  Done: ${successCount}/${pages.length} pages saved`,
      successCount === pages.length ? "success" : "warning"
    );

    if (successCount !== pages.length) {
      throw new Error(
        `Chapter incomplete: downloaded ${successCount}/${pages.length} pages`
      );
    }

    return successCount;
  }

  /**
   * Downloads a single page image with retry logic.
   */
  async downloadPageWithRetry(page, chapterDir) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.downloadPage(page, chapterDir);
        return true;
      } catch (error) {
        if (attempt < this.maxRetries) {
          print(
            `  Page ${page.slug} failed (attempt ${attempt}/${this.maxRetries}), retrying...`,
            "warning"
          );
          await sleep(this.retryDelay);
        } else {
          print(
            `  Page ${page.slug} failed after ${this.maxRetries} attempts: ${error.message}`,
            "error"
          );
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Downloads a single page image to disk.
   * File name: <slug>.png (or original extension from image filename).
   */
  async downloadPage(page, chapterDir) {
    // Build image URL from the configured image host and API page path.
    // page.url looks like "//manga/dosanko-gyaru-is-mega-cute/chapters/3555341/filename.png"
    const imageUrl = `${IMAGE_BASE_URL}${page.url.replace(/^\/\//, "/")}`;

    const ext = path.extname(page.image) || ".png";
    const fileName = `${page.slug}${ext}`;
    const filePath = path.join(chapterDir, fileName);

    // Skip if already exists on disk
    try {
      await fs.access(filePath);
      print(`  Page ${page.slug} already on disk, skipping`, "info");
      return filePath;
    } catch {
      // File does not exist, proceed
    }

    const response = await this.fetchWithRetry(imageUrl, {
      headers: IMAGE_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for image ${imageUrl}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error(`Empty image buffer for page ${page.slug}`);
    }

    await fs.writeFile(filePath, buffer);
    print(`  Saved page ${page.slug}`, "info");

    return filePath;
  }

  // Helpers

  buildChapterFolderName(volume, number, name) {
    let folderName = `Volume ${volume} Chapter ${number}`;
    if (name && name.trim()) {
      folderName += ` ${name.trim()}`;
    }
    return folderName;
  }

  async createChapterDirectory(mangaTitle, chapterName) {
    const sanitize = (s) => s.replace(/[<>:"/\\|?*]/g, "_").trim();
    const dir = path.join(
      this.baseDownloadPath,
      sanitize(mangaTitle),
      sanitize(chapterName)
    );
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

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
