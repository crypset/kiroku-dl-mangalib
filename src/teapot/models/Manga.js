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
    // When true + search.scan === false, chapter list won't be re-fetched.
    // Set this manually in the DB (or via future admin command) once a series ends.
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "manga",
    timestamps: true,
  }
);