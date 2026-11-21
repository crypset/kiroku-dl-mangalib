import { print, sleep } from "../../shared/utils.js";
import fs from "fs/promises";
import path from "path";
import { BaseProvider } from "../base/base_provider.js";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class SeimangaAPI extends BaseProvider {
  constructor(options = {}) {
    super(options);
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  /**
   * Checks if this provider handles the given URL.
   */
  canHandle(url) {
    return /(?:seimanga\.me|zazaza\.me|grouple\.co|mintmanga|readmanga|selfmanga)/i.test(
      url
    );
  }

  /**
   * Extracts the manga slug from a Seimanga URL.
   * e.g. "https://1.seimanga.me/ty_byla_ne_moei_sestroi__a_moei_nevestoi__"
   *      becomes "ty_byla_ne_moei_sestroi__a_moei_nevestoi__"
   */
  extractMangaSlug(url) {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      throw new Error(`Cannot extract manga slug from URL: ${url}`);
    }
    return parts[0];
  }

  /**
   * Helper to get request headers for Seimanga HTML pages.
   */
  getPageHeaders(referer) {
    return {
      "User-Agent": this.userAgent,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,uk;q=0.8,en-US;q=0.7,en;q=0.6",
      ...(referer ? { Referer: referer } : {}),
    };
  }

  /**
   * Helper to get request headers for image downloads.
   */
  getImageHeaders(referer) {
    return {
      "User-Agent": this.userAgent,
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.9,uk;q=0.8,en-US;q=0.7,en;q=0.6",
      Referer: referer || "https://1.seimanga.me/",
    };
  }

  /**
   * Extracts the title of the manga from the HTML page.
   */
  extractMangaTitle(html, fallbackSlug) {
    // 1. Try hero main title element
    const heroMatch = html.match(
      /<h1[^>]*class="[^"]*cr-hero-names__main[^"]*"[^>]*>([\s\S]*?)<\/h1>/i
    );
    if (heroMatch) {
      const title = heroMatch[1].replace(/<[^>]+>/g, "").trim();
      if (title) return title;
    }

    // 2. Try <title> tag
    const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleTagMatch) {
      let rawTitle = titleTagMatch[1].replace(/<[^>]+>/g, "").trim();
      // Remove prefixes/suffixes like "Манга " and "- SeiManga"
      rawTitle = rawTitle
        .replace(/^Манга\s+/i, "")
        .replace(/\s+Новые главы.*$/i, "")
        .replace(/\s*-\s*(?:SeiManga|ZazaZa|[A-Za-z0-9_-]+).*$/i, "")
        .trim();
      if (rawTitle) return rawTitle;
    }

    return fallbackSlug;
  }

  /**
   * Fetches chapters list from the manga page.
   * Returns array of chapter metadata objects, ordered chronologically (first chapter to last).
   */
  async getChaptersList(mangaUrl) {
    const slug = this.extractMangaSlug(mangaUrl);
    const parsedUrl = new URL(mangaUrl);
    const origin = parsedUrl.origin;

    print(`Fetching chapters for: ${slug} (${origin})`, "info");

    const response = await this.fetchWithRetry(mangaUrl, {
      headers: this.getPageHeaders(origin + "/"),
    });

    const html = await response.text();

    // Extract title and store it for download service
    this.lastExtractedTitle = this.extractMangaTitle(html, slug);

    const chapters = [];
    const rowRegex = /<tr[^>]*class="[^"]*item-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const rowHtml = match[1];

      const idMatch = match[0].match(/data-id="([^"]+)"/);
      const volMatch = match[0].match(/data-vol="([^"]+)"/);
      const numMatch = match[0].match(/data-num="([^"]+)"/);

      const linkMatch = rowHtml.match(
        /<a[^>]*href="([^"]+)"[^>]*class="[^"]*chapter-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i
      );
      if (!linkMatch) continue;

      const href = linkMatch[1].trim();

      // Clean chapter text (strip <span class="chapterNew"> etc.)
      let rawText = linkMatch[2]
        .replace(/<span[^>]*class=['"][^'"]*chapterNew[^'"]*['"][^>]*>[\s\S]*?<\/span>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .replace(/\s+/g, " ");

      // Extract volume and chapter number from href or data attributes
      let volume = volMatch ? volMatch[1] : null;
      let number = numMatch ? String(Number(numMatch[1]) / 10) : null;

      const hrefParts = href.match(/\/vol([^/?#]+)\/([^/?#]+)/);
      if (hrefParts) {
        if (!volume) volume = hrefParts[1];
        if (!number) number = hrefParts[2];
      }

      // Extract optional subtitle / name
      let name = rawText;
      const prefixRegex = new RegExp(`^${volume}\\s*-\\s*${number}\\s*`, "i");
      if (prefixRegex.test(name)) {
        name = name.replace(prefixRegex, "").trim();
      }

      // Also clean duplicate "Глава X" from name if it matches number
      const chapterPrefixRegex = new RegExp(`^Глава\\s*${number}\\.?\\s*`, "i");
      if (chapterPrefixRegex.test(name)) {
        name = name.replace(chapterPrefixRegex, "").trim();
      }

      // Ensure chapter URL has ?mtr=true to bypass mature gate
      const chapterUrlObj = new URL(href, origin);
      chapterUrlObj.searchParams.set("mtr", "true");
      chapterUrlObj.hash = "";

      chapters.push({
        id: idMatch ? idMatch[1] : null,
        volume: volume ? (isNaN(Number(volume)) ? volume : Number(volume)) : 1,
        number: number ? (isNaN(Number(number)) ? number : Number(number)) : 1,
        name: name,
        url: chapterUrlObj.href,
        origin: origin,
      });
    }

    if (chapters.length === 0) {
      // Fallback: search for any chapter-link with /vol in href if table layout differs
      const linkRegex = /<a[^>]*href="([^"]*\/vol[^"?#]+\/[^"?#]+)[^"]*"[^>]*class="[^"]*chapter-link[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      let linkMatch;
      const seenUrls = new Set();

      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const href = linkMatch[1].trim();
        const fullUrlObj = new URL(href, origin);
        fullUrlObj.searchParams.set("mtr", "true");
        fullUrlObj.hash = "";

        if (seenUrls.has(fullUrlObj.href)) continue;
        seenUrls.add(fullUrlObj.href);

        const hrefParts = href.match(/\/vol([^/?#]+)\/([^/?#]+)/);
        const volume = hrefParts ? hrefParts[1] : 1;
        const number = hrefParts ? hrefParts[2] : 1;

        let rawText = linkMatch[2]
          .replace(/<[^>]+>/g, "")
          .trim()
          .replace(/\s+/g, " ");

        chapters.push({
          id: null,
          volume: isNaN(Number(volume)) ? volume : Number(volume),
          number: isNaN(Number(number)) ? number : Number(number),
          name: rawText,
          url: fullUrlObj.href,
          origin: origin,
        });
      }
    }

    if (chapters.length === 0) {
      throw new Error(`No chapters found for ${slug} on ${origin}`);
    }

    // Chapters in HTML are listed newest first.
    // Reverse them so they are ordered chronologically (Volume 1 Chapter 1 first).
    chapters.reverse();

    // Assign sequential 1-based index
    chapters.forEach((ch, idx) => {
      ch.index = idx + 1;
    });

    print(`Found ${chapters.length} chapters`, "success");
    return chapters;
  }

  /**
   * Fetches pages list for a chapter URL.
   * Strips anti-scraping query hashes so that actual images are downloaded.
   */
  async getChapterPages(chapterUrl) {
    const urlObj = new URL(chapterUrl);
    urlObj.searchParams.set("mtr", "true");

    const response = await this.fetchWithRetry(urlObj.href, {
      headers: this.getPageHeaders(urlObj.origin + "/"),
    });

    const html = await response.text();

    // Look for rm_h.readerInit(chapterInfo, [[...]], ...)
    const match = html.match(/rm_h\.readerInit\s*\([^,]+,\s*(\[\[[\s\S]*?\]\])/);
    if (!match) {
      throw new Error(
        `Failed to locate readerInit data on chapter page: ${chapterUrl}`
      );
    }

    let rawPics;
    try {
      rawPics = new Function(`return ${match[1]}`)();
    } catch (error) {
      throw new Error(
        `Failed to parse reader pictures array: ${error.message}`
      );
    }

    if (!Array.isArray(rawPics) || rawPics.length === 0) {
      throw new Error(`Empty pictures array for chapter: ${chapterUrl}`);
    }

    return rawPics.map((p, idx) => {
      const host = p[0];
      let imgPath = p[2] || "";

      // STRIP anti-scraping query string (honeypot check discovered in rm_h.reader.preparePicUrl)
      if (imgPath.includes("?")) {
        imgPath = imgPath.substring(0, imgPath.indexOf("?"));
      }

      const fullUrl = host + (imgPath.startsWith("/") ? imgPath.slice(1) : imgPath);
      const ext = path.extname(new URL(fullUrl).pathname) || ".png";

      return {
        slug: String(idx + 1).padStart(3, "0"),
        url: fullUrl,
        ext: ext,
        width: p[3],
        height: p[4],
      };
    });
  }

  /**
   * Downloads all pages for a chapter.
   */
  async downloadChapter(chapterData, mangaTitle, mangaSlug, branchConfig) {
    const { volume, number, name, url, origin } = chapterData;

    const chapterFolderName = this.buildChapterFolderName(volume, number, name);
    print(`Downloading: ${chapterFolderName}`, "info");

    const pages = await this.getChapterPages(url);
    print(`  ${pages.length} pages found`, "info");

    const chapterDir = await this.createChapterDirectory(
      mangaTitle,
      chapterFolderName
    );

    const refererOrigin = origin || (url ? new URL(url).origin : "https://1.seimanga.me");

    let successCount = 0;

    for (const page of pages) {
      const downloaded = await this.downloadPageWithRetry(
        page,
        chapterDir,
        refererOrigin
      );
      if (downloaded) successCount++;
      await sleep(this.pageDelay);
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
  async downloadPageWithRetry(page, chapterDir, refererOrigin) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.downloadPage(page, chapterDir, refererOrigin);
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
   */
  async downloadPage(page, chapterDir, refererOrigin) {
    const fileName = `${page.slug}${page.ext || ".png"}`;
    const filePath = path.join(chapterDir, fileName);

    // Skip if already exists on disk
    try {
      await fs.access(filePath);
      print(`  Page ${page.slug} already on disk, skipping`, "info");
      return filePath;
    } catch {
      // File does not exist, proceed
    }

    const response = await this.fetchWithRetry(page.url, {
      headers: this.getImageHeaders(refererOrigin + "/"),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for image ${page.url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error(`Empty image buffer for page ${page.slug}`);
    }

    await fs.writeFile(filePath, buffer);
    print(`  Saved page ${page.slug}`, "info");

    return filePath;
  }
}
