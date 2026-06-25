export interface Config {
    baseUrl: string;
    apiToken: string;
    apiKey?: string;
    readonly: boolean;
}

export function loadConfig(): Config {
    const baseUrl = (process.env.REMNAWAVE_BASE_URL || '').replace(/\/+$/, '');
    const apiToken = process.env.REMNAWAVE_API_TOKEN || '';
    const apiKey = process.env.REMNAWAVE_API_KEY;
    const readonly = process.env.REMNAWAVE_READONLY === 'true';

    return {
        baseUrl,
        apiToken,
        apiKey,
        readonly,
    };
}

export function isConfigured(config: Config): boolean {
    return !!config.baseUrl && !!config.apiToken;
}
