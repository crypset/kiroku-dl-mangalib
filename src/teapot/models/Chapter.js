import { DataTypes } from "sequelize";
import { sequelize } from "../sqlite/sqlite_db.js";
import { Manga } from "./Manga.js";

export const Chapter = sequelize.define(
  "Chapter",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mangaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Manga,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isDownloaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    totalPages: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "chapters",
    timestamps: true,
  }
);
