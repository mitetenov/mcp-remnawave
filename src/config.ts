export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    isSupport: boolean;
}

export function loadConfig(): Config {
    const baseUrl = (process.env.REMNAWAVE_BASE_URL || '').replace(/\/+$/, '');
    const apiToken = process.env.REMNAWAVE_API_TOKEN || '';
    const apiKey = process.env.REMNAWAVE_API_KEY;
    // This flag guards an access boundary, so it is parsed fail-closed: only
    // the exact string 'false' unlocks full mode. An unset, empty or
    // misspelled value degrades to the restricted support surface.
    const isSupport = process.env.REMNAWAVE_IS_SUPPORT !== 'false';

    return {
        baseUrl,
        apiToken,
        apiKey,
        isSupport,
    };
}

export function isConfigured(config: Config): boolean {
    return !!config.baseUrl && !!config.apiToken;
}
