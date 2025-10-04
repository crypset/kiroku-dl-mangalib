import { Manga } from "./Manga.js";
import { Chapter } from "./Chapter.js";
import { Page } from "./Page.js";

Chapter.belongsTo(Manga, { foreignKey: "mangaId", onDelete: "CASCADE" });
Manga.hasMany(Chapter, { foreignKey: "mangaId" });

Page.belongsTo(Chapter, { foreignKey: "chapterId", onDelete: "CASCADE" });
Chapter.hasMany(Page, { foreignKey: "chapterId" });

export { Manga, Chapter, Page };
