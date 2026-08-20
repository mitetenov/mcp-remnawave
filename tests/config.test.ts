import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, isConfigured } from '../src/config.js';

describe('loadConfig', () => {
    beforeEach(() => {
        delete process.env.REMNAWAVE_BASE_URL;
        delete process.env.REMNAWAVE_API_TOKEN;
        delete process.env.REMNAWAVE_API_KEY;
        delete process.env.REMNAWAVE_IS_SUPPORT;
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
