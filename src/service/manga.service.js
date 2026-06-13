import { Manga, Chapter, Page } from "../teapot/models/index.js";
import { print } from "../shared/utils.js";

export class MangaService {
  async getOrCreateManga(url, title = null) {
    const [manga, created] = await Manga.findOrCreate({
      where: { url },
      defaults: { url, title },
    });

    if (created) {
      print(`Created new manga: ${title || url}`, "success");
    } else {
      print(`Manga already in DB: ${title || url}`, "info");
    }

    return manga;
  }

  /**
   * Saves raw API chapter objects into the DB.
   * Each chapter's full JSON is stored in the `meta` column so that
   * download.service.js can use volume/number/branches without re-fetching.
   */
  async saveApiChapters(mangaId, apiChapters) {
    let newCount = 0;
    let existingCount = 0;

    for (const apiChapter of apiChapters) {
      const { number, name, index } = apiChapter;

      // Stable unique key: mangaId + chapter index from API
      const chapterKey = `manga:${mangaId}:chapter:${index}`;

      const [, created] = await Chapter.findOrCreate({
        where: {
          mangaId,
          // Use the URL column as a unique key per chapter per manga
          url: chapterKey,
        },
        defaults: {
          mangaId,
          name: name?.trim() || `Chapter ${number}`,
          url: chapterKey,
          meta: JSON.stringify(apiChapter),
        },
      });

      if (created) {
        newCount++;
      } else {
        existingCount++;
      }
    }

    print(
      `Chapters: ${newCount} new, ${existingCount} already existed`,
      "success"
    );
  }

  async getChapters(mangaId, skipDownloaded = true) {
    return await Chapter.findAll({
      where: skipDownloaded ? { mangaId, isDownloaded: false } : { mangaId },
      order: [["id", "ASC"]],
    });
  }

  async markChapterAsDownloaded(chapterId, totalPages) {
    const chapter = await Chapter.findByPk(chapterId);
    if (chapter) {
      chapter.isDownloaded = true;
      chapter.totalPages = totalPages;
      await chapter.save();
      print(`Marked as downloaded: ${chapter.name}`, "success");
    }
  }

  // Page tracking

  /**
   * Saves page records for a chapter.
   * pageList is the array from MangalibAPI.getChapterPages().
   */
  async savePages(chapterId, pageList) {
    let newCount = 0;

    for (const p of pageList) {
      const [, created] = await Page.findOrCreate({
        where: { chapterId, pageNumber: p.slug },
        defaults: {
          chapterId,
          pageNumber: p.slug,
          url: p.url,
        },
      });
      if (created) newCount++;
    }

    print(`Pages saved: ${newCount} new for chapter ${chapterId}`, "info");
  }

  async getUndownloadedPages(chapterId) {
    return await Page.findAll({
      where: { chapterId, isDownloaded: false },
      order: [["pageNumber", "ASC"]],
    });
  }

  async markPageAsDownloaded(pageId, filePath) {
    const page = await Page.findByPk(pageId);
    if (page) {
      page.isDownloaded = true;
      page.filePath = filePath;
      await page.save();
    }
  }

  async getChapterProgress(chapterId) {
    const total = await Page.count({ where: { chapterId } });
    const downloaded = await Page.count({
      where: { chapterId, isDownloaded: true },
    });

    return {
      total,
      downloaded,
      percentage: total > 0 ? Math.round((downloaded / total) * 100) : 0,
    };
  }
}
