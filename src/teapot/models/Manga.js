import { DataTypes } from "sequelize";
import { sequelize } from "../sqlite/sqlite_db.js";

export const Manga = sequelize.define(
  "Manga",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "manga",
    timestamps: true,
  }
);
