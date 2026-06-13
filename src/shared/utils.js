import chalk from "chalk";
import gradient from "gradient-string";
import { LOG_COLORS, LOG_SYMBOLS } from "../config/app.config.js";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function print(text, type = "info") {
  const config = {
    info: {
      symbol: LOG_SYMBOLS.info,
      label: "[INFO]",
      labelColor: chalk.hex(LOG_COLORS.info),
      styledText: chalk.hex(LOG_COLORS.text),
    },
    system: {
      symbol: LOG_SYMBOLS.system,
      label: "[SYSTEM]",
      labelColor: chalk.hex(LOG_COLORS.system),
      styledText: chalk.hex(LOG_COLORS.text),
    },
    data: {
      symbol: LOG_SYMBOLS.data,
      label: "[DATA_STREAM]",
      labelColor: chalk.hex(LOG_COLORS.data),
      styledText: chalk.hex(LOG_COLORS.text),
    },
    warning: {
      symbol: LOG_SYMBOLS.warning,
      label: "[WARN]",
      labelColor: chalk.hex(LOG_COLORS.warning),
      styledText: chalk.hex(LOG_COLORS.text),
    },
    success: {
      symbol: LOG_SYMBOLS.success,
      label: "[SUCCESS]",
      labelColor: chalk.hex(LOG_COLORS.success),
      styledText: chalk.hex(LOG_COLORS.text),
    },
    error: {
      symbol: LOG_SYMBOLS.error,
      label: "[ERROR]",
      labelColor: chalk.hex(LOG_COLORS.error),
      styledText: chalk.hex(LOG_COLORS.text),
    },
  };
  const timestamp = new Date().toISOString().replace("T", "_").substring(0, 19);

  const log_line = `${config[type].symbol} ${chalk.hex(LOG_COLORS.dim)(
    LOG_SYMBOLS.separator
  )} ${chalk.hex(LOG_COLORS.dim)(timestamp)} ${chalk.hex(LOG_COLORS.dim)(
    LOG_SYMBOLS.separator
  )} ${config[type].labelColor(config[type].label)} ${config[type].styledText(
    text
  )}`;

  console.log(log_line);
}

export function banner(text, subtitle = null) {
  console.log("\n");

  const gradient_title = gradient([
    LOG_COLORS.titleStart,
    LOG_COLORS.titleMiddle,
    LOG_COLORS.titleEnd,
  ])(text);

  console.log(gradient_title);

  if (subtitle) {
    const centeredSubtitle = chalk.hex(LOG_COLORS.subtitle)(subtitle);
    console.log(centeredSubtitle);
  }

  console.log("\n");
}

export function _error(text) {
  const current_date = new Date();

  console.log(
    LOG_SYMBOLS.error +
      " |" +
      ` ${current_date.toLocaleString()} ` +
      "|" +
      " [ERROR]" +
      ` ${text}`
  );
}
