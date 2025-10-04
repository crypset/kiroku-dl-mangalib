import { Manga, Chapter, Page } from "../teapot/models/index.js";
import { print } from "../shared/utils.js";

export class MangaService {
  async getOrCreateManga(url, title = null) {
    const [manga, created] = await Manga.findOrCreate({
      where: { url },
      defaults: { url, title },
    });

    if (created) {
      print(`Created New Manga: ${title || url}`, "success");
    } else {
      print(`Manga already exists in DB: ${title || url}`, "info");
    }

    return manga;
  }

  async saveChapters(mangaId, chapters) {
    const savedChapters = [];
    let newCount = 0;
    let existingCount = 0;

    for (const chapter of chapters) {
      const [chapterRecord, created] = await Chapter.findOrCreate({
        where: { url: chapter.url },
        defaults: {
          mangaId,
          name: chapter.name,
          url: chapter.url,
        },
      });

      if (created) {
        newCount++;
      } else {
        existingCount++;
      }

      savedChapters.push(chapterRecord);
    }

    print(
      `Saved Chapters: ${newCount} new, ${existingCount} already existed`,
      "success"
    );

    return savedChapters;
  }

  async getUndownloadedChapters(mangaId) {
    return await Chapter.findAll({
      where: {
        mangaId,
        isDownloaded: false,
      },
      order: [["id", "ASC"]],
    });
  }

  async markChapterAsDownloaded(chapterId, totalPages) {
    const chapter = await Chapter.findByPk(chapterId);
    if (chapter) {
      chapter.isDownloaded = true;
      chapter.totalPages = totalPages;
      await chapter.save();
      print(`Chapter ${chapter.name} marked as downloaded`, "success");
    }
  }

  async savePages(chapterId, totalPages) {
    const chapter = await Chapter.findByPk(chapterId);
    if (!chapter) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }

    const baseUrl = chapter.url;
    const pages = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageUrl = `${baseUrl}?p=${pageNum}`;

      const [page, created] = await Page.findOrCreate({
        where: {
          chapterId,
          pageNumber: pageNum,
        },
        defaults: {
          chapterId,
          pageNumber: pageNum,
          url: pageUrl,
        },
      });

      pages.push(page);
    }

    print(
      `Saved ${totalPages} pages for chapter ${chapter.name}`,
      "info"
    );
    return pages;
  }

  async getUndownloadedPages(chapterId) {
    return await Page.findAll({
      where: {
        chapterId,
        isDownloaded: false,
      },
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
      percentage: total > 0 ? (downloaded / total) * 100 : 0,
    };
  }
}
