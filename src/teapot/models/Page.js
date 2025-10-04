import { DataTypes } from "sequelize";
import { sequelize } from "../sqlite/sqlite_db.js";
import { Chapter } from "./Chapter.js";

export const Page = sequelize.define(
  "Page",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Chapter,
        key: "id",
      },
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDownloaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "pages",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["chapterId", "pageNumber"],
      },
    ],
  }
);
