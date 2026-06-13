import "dotenv/config";
import config from "../../config.json" with { type: "json" };

const app = config.app ?? {};
const api = config.api ?? {};
const database = config.database ?? {};
const download = config.download ?? {};

export const DOWNLOAD_DIR = app.downloadDir ?? "downloads";

export const API_BASE_URL = api.baseUrl ?? "https://api.cdnlibs.org/api";
export const IMAGE_BASE_URL = api.imageBaseUrl ?? "https://img3.mixlib.me";
export const API_HEADERS = {
  "client-time-zone": api.timeZone ?? "Europe/Kiev",
  "content-type": "application/json",
  "site-id": String(api.siteId ?? 1),
  Referer: api.referer ?? "https://mangalib.me/",
};
export const IMAGE_HEADERS = {
  accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "accept-language": api.acceptLanguage ?? "en-US,en;q=0.5",
  Referer: api.referer ?? "https://mangalib.me/",
};

export const CHAPTER_DELAY = download.delay ?? 4000;
export const PAGE_DELAY = download.pageDelay ?? 300;
export const SEARCH_DELAY = download.searchDelay ?? 6000;
export const MAX_RETRIES = download.maxRetries ?? 3;
export const RETRY_DELAY = download.retryDelay ?? 2000;
export const SKIP_ERRORS = download.skipErrors ?? true;
export const GLOBAL_SKIP_DOWNLOADED = download.skipDownloaded ?? true;

export const USE_DATABASE =
  (download.useDatabase ?? true) && (database.enabled ?? true);
export const DB_STORAGE = database.storage ?? "./pot.sqlite";
export const DB_SYNC = database.sync ?? true;
export const DB_LOGGING = database.logging ?? false;

// Each search accepts: name, url, branch, scan, and skipDownloaded.
export const SEARCH_LIST = config.searches ?? [];

export const LOG_COLORS = {
  text: "#B8B8B8",
  dim: "#808080",
  info: "#9CC4B2",
  system: "#B8B8B8",
  data: "#A7D6D6",
  warning: "#CBBFA4",
  success: "#8FA98F",
  error: "#A62626",
  titleStart: "#2E2E2E",
  titleMiddle: "#A6A6A6",
  titleEnd: "#F2F2F2",
  subtitle: "#555555",
};
export const LOG_SYMBOLS = {
  info: "i",
  system: "*",
  data: ">",
  warning: "!",
  success: "+",
  error: "x",
  separator: "|",
};

export const WELCOME_MESSAGE =
  "\n" +
  " mm   mmm     ##                         mm                 \n" +
  ' ##  ##"      ""                         ##                 \n' +
  ' ##m##      ####      ##m####   m####m   ## m##"   ##    ## \n' +
  ' #####        ##      ##"      ##"  "##  ##m##     ##    ## \n' +
  ' ##  ##m      ##      ##       ##    ##  ##"##m    ##    ## \n' +
  ' ##   ##m  mmm##mmm   ##       "##mm##"  ##  "#m   ##mmm### \n' +
  ' ""    ""  """"""""   ""         """"    ""   """   """" ""\n';
export const SUB_TITLE = "  Mangalib Download Tool\n  by Seth The White";
