export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    isSupport: boolean;
    /** Omitted by callers that build a Config by hand; the client falls back to the default. */
    timeoutMs?: number;
}

/** Generous enough for bulk operations, short enough that a caller gets an answer. */
export const DEFAULT_TIMEOUT_MS = 30_000;

export function loadConfig(): Config {
    const baseUrl = (process.env.REMNAWAVE_BASE_URL || '').replace(/\/+$/, '');
    const apiToken = process.env.REMNAWAVE_API_TOKEN || '';
    const apiKey = process.env.REMNAWAVE_API_KEY;
    // This flag guards an access boundary, so it is parsed fail-closed: only
    // the exact string 'false' unlocks full mode. An unset, empty or
    // misspelled value degrades to the restricted support surface.
    const isSupport = process.env.REMNAWAVE_IS_SUPPORT !== 'false';
    // A non-numeric or non-positive value falls back to the default rather
    // than disabling the timeout: an unbounded request is the failure mode
    // this setting exists to prevent.
    const parsedTimeout = Number(process.env.REMNAWAVE_TIMEOUT_MS);
    const timeoutMs =
        Number.isFinite(parsedTimeout) && parsedTimeout > 0
            ? parsedTimeout
            : DEFAULT_TIMEOUT_MS;

    return {
        baseUrl,
        apiToken,
        apiKey,
        isSupport,
        timeoutMs,
    };
}

export function isConfigured(config: Config): boolean {
    return !!config.baseUrl && !!config.apiToken;
}
