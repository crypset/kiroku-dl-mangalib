import "dotenv/config";
import config from "../../config.json" with { type: "json" };

export const RULE34_API_KEY = process.env.RULE34_API_KEY || null;
export const USER_ID = process.env.USER_ID || null;
export const RULE34_BASE_URL =
  config.api.baseUrl || "https://api.rule34.xxx/index.php";
export const BASE_POST_LIMIT = config.api.basePostLimit ?? 100;
export const DELAY_TIME = config.download.delayTime ?? 2000;
export const GLOBAL_SKIP_DOWNLOADED = config.download.skipDownloaded ?? false;
export const USE_DATABASE = config.download.useDatabase ?? false;
export const SKIP_ERRORS = config.download.skipErrors ?? true;
export const DOWNLOAD_DIR = config.app.downloadDir ?? "downloads";
export const SEARCH_LIST = config.searches ?? [];
export const TAGS_BLACKLIST = config.tags?.blacklist ?? [];
export const HEADLESS = config.browser.headless ?? true;
export const VIEWPORT_WIDTH = config.browser.viewport.width || 1280;
export const VIEWPORT_HEIGHT = config.browser.viewport.height || 720;
export const USERAGENT = config.browser.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const BROWSER_ARGS = config.browser.args || [];
export const BROWSER_TIMEOUT = config.browser.timeout || 30000;
