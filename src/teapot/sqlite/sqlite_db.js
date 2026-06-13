import { Sequelize } from "sequelize";
import { print } from "../../shared/utils.js";
import {
  DB_LOGGING,
  DB_STORAGE,
  DB_SYNC,
} from "../../config/app.config.js";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_STORAGE,
  logging: DB_LOGGING,
});

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    print("Database connection established successfully", "system");

    if (DB_SYNC) {
      await sequelize.sync();
      print("Database models synchronized", "system");
    }

    return true;
  } catch (error) {
    print(`Unable to connect to the database: ${error.message}`, "error");
    return false;
  }
}

export async function closeDatabase() {
  try {
    await sequelize.close();
    print("Database connection closed", "system");
  } catch (error) {
    print(`Error closing database: ${error.message}`, "error");
  }
}

export default sequelize;
