import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, isConfigured } from '../src/config.js';

describe('loadConfig', () => {
    beforeEach(() => {
        delete process.env.REMNAWAVE_BASE_URL;
        delete process.env.REMNAWAVE_API_TOKEN;
        delete process.env.REMNAWAVE_API_KEY;
        delete process.env.REMNAWAVE_READONLY;
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
        expect(config.readonly).toBe(false);
        expect(isConfigured(config)).toBe(true);
    });

    it('loads config with all env vars', () => {
        process.env.REMNAWAVE_BASE_URL = 'https://panel.example.com';
        process.env.REMNAWAVE_API_TOKEN = 'token123';
        process.env.REMNAWAVE_API_KEY = 'key456';
        process.env.REMNAWAVE_READONLY = 'true';
        const config = loadConfig();
        expect(config.baseUrl).toBe('https://panel.example.com');
        expect(config.apiToken).toBe('token123');
        expect(config.apiKey).toBe('key456');
        expect(config.readonly).toBe(true);
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
});
