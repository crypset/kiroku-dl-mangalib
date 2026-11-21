import { MangalibAPI } from "./mangalib/mangalib_api.js";
import { SeimangaAPI } from "./seimanga/seimanga_api.js";

export class ProviderFactory {
  constructor(providers = null) {
    this.providers = providers ?? [
      new MangalibAPI(),
      new SeimangaAPI(),
    ];
  }

  /**
   * Registers a new provider.
   * @param {BaseProvider} provider
   */
  registerProvider(provider) {
    this.providers.push(provider);
  }

  /**
   * Returns the provider capable of handling the specified URL.
   * @param {string} url
   * @returns {BaseProvider}
   */
  getProvider(url) {
    if (!url || typeof url !== "string") {
      throw new Error(`Invalid URL provided: ${url}`);
    }

    const provider = this.providers.find((p) => p.canHandle(url));
    if (!provider) {
      throw new Error(
        `Unsupported manga provider for URL: ${url}. Supported domains include mangalib.me, seimanga.me, zazaza.me, etc.`
      );
    }

    return provider;
  }
}
