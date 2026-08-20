import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, isConfigured, DEFAULT_TIMEOUT_MS } from '../src/config.js';

describe('loadConfig', () => {
    beforeEach(() => {
        delete process.env.REMNAWAVE_BASE_URL;
        delete process.env.REMNAWAVE_API_TOKEN;
        delete process.env.REMNAWAVE_API_KEY;
        delete process.env.REMNAWAVE_IS_SUPPORT;
        delete process.env.REMNAWAVE_TIMEOUT_MS;
    });

    it('returns empty baseUrl when REMNAWAVE_BASE_URL is missing', () => {
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        const config = loadConfig();
        expect(config.baseUrl).toBe('');
        expect(isConfigured(config)).toBe(false);
    });

    it('returns empty apiToken when REMNAWAVE_API_TOKEN is missing', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        const config = loadConfig();
        expect(config.apiToken).toBe('');
        expect(isConfigured(config)).toBe(false);
    });

    it('loads config with required env vars', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
        expect(config.apiToken).toBe('token123');
        expect(config.apiKey).toBeUndefined();
        expect(config.isSupport).toBe(true);
        expect(isConfigured(config)).toBe(true);
    });

    it('loads config with all env vars', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_API_KEY = 'key456';
        process.env.REMNAWAVE_IS_SUPPORT = 'false';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
        expect(config.apiToken).toBe('token123');
        expect(config.apiKey).toBe('key456');
        expect(config.isSupport).toBe(false);
    });

    it('defaults the request timeout when REMNAWAVE_TIMEOUT_MS is unset', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        expect(loadConfig().timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    });

    it('reads a positive numeric timeout', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_TIMEOUT_MS = '5000';
        expect(loadConfig().timeoutMs).toBe(5000);
    });

    it('falls back to the default rather than disabling the timeout on junk input', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        for (const value of ['0', '-1', '', 'soon', 'NaN', 'Infinity']) {
            process.env.REMNAWAVE_TIMEOUT_MS = value;
            expect(loadConfig().timeoutMs, `value: ${JSON.stringify(value)}`).toBe(
                DEFAULT_TIMEOUT_MS,
            );
        }
    });

    it('strips trailing slash from baseUrl', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com/';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
    });

    it('strips multiple trailing slashes', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com///';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
    });

    it('defaults to support mode when REMNAWAVE_IS_SUPPORT is unset', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        expect(loadConfig().isSupport).toBe(true);
    });

    it('leaves support mode only for the exact string "false"', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_IS_SUPPORT = 'false';
        expect(loadConfig().isSupport).toBe(false);
    });

    it('fails closed on near-miss values', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        for (const value of ['FALSE', 'False', '0', '', 'falce', 'true', 'no']) {
            process.env.REMNAWAVE_IS_SUPPORT = value;
            expect(loadConfig().isSupport, `value: ${JSON.stringify(value)}`).toBe(true);
        }
    });
});
