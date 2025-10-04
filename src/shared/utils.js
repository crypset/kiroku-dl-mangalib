import chalk from "chalk";
import gradient from "gradient-string";

const colors = {
  primary: "#F4F4F4", // Pure white (main text)
  secondary: "#C0C0C0", // Light gray (borders/separators)
  dark: "#1A1A1A", // Deep black (backgrounds)
  accent: "#FFFFFF", // Bright white (highlights)
  warning: "#F4F4F4", // White (warnings in Nier are white)
  error: "#F4F4F4", // White (even errors are white in Nier)
  success: "#F4F4F4", // White (consistent with game's UI)
  info: "#F4F4F4", // White (all text is white/light)
  pod: "#F4F4F4", // White (Pod text)
  system: "#F4F4F4", // White (system messages)
  dim: "#808080", // Darker gray for less important text
  system_core_grey: "#B8B8B8",
  data: "#A7D6D6",
  muted_amber: "#CBBFA4",
  aqua_screen: "#9CC4B2",
  pale_green: "#8FA98F",
  dark_gray: "#2E2E2E",
  silver: "#A6A6A6",
  warm_white: "#F2F2F2",
  red_alert: "#A62626",
  cool_grey: "#555555",
  beige_gold: "#CBBFA4",

  cosmic: "#1E3A8A",
  galaxy: "#7C3AED",
  supernova: "#F59E0B",
  plasma: "#EC4899",
  asteroid: "#6B7280",
  comet: "#10B981",
  aurora: "#06B6D4",
  solar: "#F97316", 
  meteor: "#EF4444",
};

const symbols = {
  android: "■",
  pod: "●",
  data: "◆", // Diamond (data streams)
  system: "▲", // Triangle (system alerts)
  warning: "▼", // Inverted triangle (warnings)
  error: "✕", // X mark (minimal error symbol)
  success: "◉", // Circle with dot (completion)
  info: "○", // Empty circle (information)
  loading: "◐", // Half circle (loading)
  separator: "│", // Vertical line (separators)
  corner: "└", // Corner piece
  line: "─",
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function print(text, type = "info") {
  const config = {
    info: {
      symbol: symbols.info,
      label: "[INFO]",
      labelColor: chalk.hex(colors.aqua_screen),
      styledText: chalk.hex(colors.system_core_grey),
    },
    system: {
      symbol: symbols.system,
      label: "[SYSTEM]",
      labelColor: chalk.hex(colors.system_core_grey),
      styledText: chalk.hex(colors.system_core_grey),
    },
    data: {
      symbol: symbols.data,
      label: "[DATA_STREAM]",
      labelColor: chalk.hex(colors.data),
      styledText: chalk.hex(colors.system_core_grey),
    },
    warning: {
      symbol: symbols.warning,
      label: "[WARN]",
      labelColor: chalk.hex(colors.muted_amber),
      styledText: chalk.hex(colors.system_core_grey),
    },
    success: {
      symbol: symbols.success,
      label: "[SUCCESS]",
      labelColor: chalk.hex(colors.pale_green),
      styledText: chalk.hex(colors.system_core_grey),
    },
    error: {
      symbol: symbols.error,
      label: "[ERROR]",
      labelColor: chalk.hex(colors.red_alert),
      styledText: chalk.hex(colors.system_core_grey),
    },
  };
  const timestamp = new Date().toISOString().replace("T", "_").substring(0, 19);

  const log_line = `${config[type].symbol} ${chalk.hex(colors.dim)(
    symbols.separator
  )} ${chalk.hex(colors.dim)(timestamp)} ${chalk.hex(colors.dim)(
    symbols.separator
  )} ${config[type].labelColor(config[type].label)} ${config[type].styledText(
    text
  )}`;

  console.log(log_line);
}

export function banner(text, subtitle = null) {
  console.log("\n");

  const gradient_title = gradient([
    colors.dark_gray,
    colors.silver,
    colors.warm_white,
  ])(text);

  console.log(gradient_title);

  if (subtitle) {
    const centeredSubtitle = chalk.hex(colors.cool_grey)(subtitle);
    console.log(centeredSubtitle);
  }

  console.log("\n");
}

export function _error(text) {
  const current_date = new Date();

  console.log(
    symbols.error +
      " |" +
      ` ${current_date.toLocaleString()} ` +
      "|" +
      " [ERROR]" +
      ` ${text}`
  );
}
