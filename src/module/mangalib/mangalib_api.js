import { print, sleep } from "../../shared/utils.js";
import fs from "fs/promises";
import path from "path";
import { DOWNLOAD_DIR } from "../../config/app.config.js";

export class MangalibAPI {
  constructor(context) {
    this.context = context;
    this.baseDownloadPath = path.join(process.cwd(), DOWNLOAD_DIR);
    this.maxRetries = 3; // Максимальна кількість спроб
    this.retryDelay = 2000; // Затримка між спробами (мс)
  }

  async getChaptersList(url) {
    const page = await this.context.newPage();

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const mainContainerSelectors = [
        "#app > div:nth-child(1) > div:nth-child(2) > div:nth-child(6) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1)",
        "#app > div:nth-child(1) > div:nth-child(2) > div:nth-child(7) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1)",
      ];

      const mainContainerPath = await this.findWorkingSelector(
        page,
        mainContainerSelectors
      );

      if (!mainContainerPath) {
        throw new Error(
          "Could not find chapters container with any known selector"
        );
      }

      print(`Using selector: ${mainContainerPath}`, "info");

      const chapters = await this.scrollAndCollectChapters(
        page,
        mainContainerPath
      );

      print(`Retrieved ${chapters.length} chapters`, "success");
      return chapters;
    } catch (error) {
      print(`getChaptersList: ${error.message}`, "error");
      throw error;
    } finally {
      await this.closePage(page);
    }
  }

  async findWorkingSelector(page, selectors) {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        return selector;
      } catch {
        continue;
      }
    }
    return null;
  }

  async downloadChapter(chapterUrl, chapterName, mangaTitle) {
    let page = null;

    try {
      page = await this.context.newPage();

      await page.goto(chapterUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const total = await this.getTotalPages(page);
      print(`Chapter has ${total} pages`, "info");

      const chapterDir = await this.createChapterDirectory(
        mangaTitle,
        chapterName
      );

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        await this.downloadPageWithRetry(page, chapterUrl, chapterDir, pageNum);
        await sleep(1000);
      }

      print(`Chapter ${chapterName} downloaded successfully`, "success");
      return total;
    } catch (error) {
      print(`downloadChapter: ${error.message}`, "error");
      throw error;
    } finally {
      await this.closePage(page);
    }
  }

  async getTotalPages(page) {
    const rawPages = await page.textContent(
      "#app > div:nth-child(1) > main > div > footer > label"
    );

    const [, total] = rawPages.split("/").map((t) => parseInt(t.trim(), 10));

    return total;
  }

  async downloadPageWithRetry(page, chapterUrl, chapterDir, pageNum) {
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.downloadPage(page, chapterUrl, chapterDir, pageNum);
        return; // Успішно завантажено
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          print(
            `Page ${pageNum} failed (attempt ${attempt}/${this.maxRetries}), retrying...`,
            "warning"
          );
          await sleep(this.retryDelay);
        } else {
          print(
            `Page ${pageNum} failed after ${this.maxRetries} attempts`,
            "error"
          );
        }
      }
    }

    // Якщо всі спроби провалились
    throw lastError;
  }

  async downloadPage(page, chapterUrl, chapterDir, pageNum) {
    try {
      const pageUrl = `${chapterUrl}${chapterUrl.includes('?') ? '&' : '?'}p=${pageNum}`;

      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Додаємо очікування мережевого спокою
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
        // Ігноруємо помилку, продовжуємо
      });

      const imageQuery = `div[data-page="${pageNum}"] > img`;
      
      // Спочатку чекаємо на елемент
      await page.waitForSelector(imageQuery, { timeout: 30000 });
      
      // Потім чекаємо поки картинка завантажиться
      await page.waitForFunction(
        (selector) => {
          const img = document.querySelector(selector);
          return img && img.complete && img.naturalHeight > 0;
        },
        imageQuery,
        { timeout: 30000 }
      );

      const imageUrl = await page.$eval(imageQuery, (img) => img.src);
      await this.downloadImage(page, imageUrl, chapterDir, pageNum);
    } catch (error) {
      print(`downloadPage ${pageNum}: ${error.message}`, "error");
      throw error;
    }
  }

  async downloadImage(page, imageUrl, chapterDir, pageNum) {
    try {
      const imageData = await page.evaluate(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }, imageUrl);

      const base64Data = imageData.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");

      const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
      const fileName = `page_${pageNum.toString().padStart(3, "0")}${ext}`;
      const filePath = path.join(chapterDir, fileName);

      await fs.writeFile(filePath, buffer);
      print(`Downloaded page ${pageNum}`, "info");

      return filePath;
    } catch (error) {
      print(`downloadImage: ${error.message}`, "error");
      throw error;
    }
  }

  async createChapterDirectory(mangaTitle, chapterName) {
    const sanitizeName = (name) => name.replace(/[<>:"/\\|?*]/g, "_").trim();

    const mangaDir = path.join(this.baseDownloadPath, sanitizeName(mangaTitle));
    const chapterDir = path.join(mangaDir, sanitizeName(chapterName));

    await fs.mkdir(chapterDir, { recursive: true });

    return chapterDir;
  }

  async scrollAndCollectChapters(page, containerSelector) {
    return await page.evaluate(async (selector) => {
      const chaptersMap = new Map();
      const container = document.querySelector(selector);

      if (!container) {
        throw new Error("Container not found");
      }

      const collectVisibleChapters = () => {
        const chapterContainers = container.querySelectorAll(":scope > div");

        chapterContainers.forEach((chapterContainer) => {
          const link = chapterContainer.querySelector("a");
          if (link) {
            const name = link.textContent?.trim() || null;
            const url = link.href || null;

            if (name && url && !chaptersMap.has(url)) {
              chaptersMap.set(url, { name, url });
            }
          }
        });
      };

      await new Promise((resolve) => {
        let totalHeight = 0;
        let lastChaptersCount = 0;
        let stableCount = 0;
        const distance = 100;
        const maxStableChecks = 5;

        const timer = setInterval(() => {
          collectVisibleChapters();

          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          const currentChaptersCount = chaptersMap.size;

          if (totalHeight >= scrollHeight) {
            if (currentChaptersCount === lastChaptersCount) {
              stableCount++;
              if (stableCount >= maxStableChecks) {
                clearInterval(timer);
                collectVisibleChapters();
                resolve();
              }
            } else {
              stableCount = 0;
              lastChaptersCount = currentChaptersCount;
              totalHeight = scrollHeight - distance;
            }
          }
        }, 100);
      });

      return Array.from(chaptersMap.values());
    }, containerSelector);
  }

  async scrollPageToBottom(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async closePage(page) {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {});
    }
  }
}