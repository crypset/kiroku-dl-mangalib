import { chromium } from "playwright";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { print } from "../../shared/utils.js";
import {
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  USERAGENT,
  BROWSER_ARGS,
} from "../../config/app.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function init(profile, headless = true) {
  try {
    const sessionFolderPath = join(__dirname, profile, "session");

    if (!fs.existsSync(sessionFolderPath)) {
      fs.mkdirSync(sessionFolderPath, { recursive: true });
    }

    const context = await chromium.launchPersistentContext(sessionFolderPath, {
      headless,
      args: BROWSER_ARGS,
      userAgent: USERAGENT,
      viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    });

    print("Created context for: " + profile, "success");
    return context;
  } catch (error) {
    print("Error creating context: " + error.message, "error");
  }
}
