import { describe, expect, it } from 'vitest';
import { subscriptionUrlFromTelegramLookup } from '../src/tools/users.js';

describe('subscriptionUrlFromTelegramLookup', () => {
    it('returns the only non-empty subscription URL without account metadata', () => {
        expect(subscriptionUrlFromTelegramLookup({
            response: {
                users: [
                    {
                        username: 'vasya',
                        subscriptionUrl: 'https://panel.example.com/sub/vasya',
                        vlessUuid: 'credential-that-must-not-leak',
                    },
                    { username: 'without-link' },
                    { subscriptionUrl: '   ' },
                ],
            },
        })).toEqual({
            status: 'found',
            subscriptionUrl: 'https://panel.example.com/sub/vasya',
        });
    });

    it('does not return any URL when distinct accounts match the same Telegram ID', () => {
        expect(subscriptionUrlFromTelegramLookup({
            response: {
                users: [
                    { subscriptionUrl: 'https://panel.example.com/sub/one' },
                    { subscriptionUrl: 'https://panel.example.com/sub/two' },
                ],
            },
        })).toEqual({
            status: 'ambiguous',
            subscriptionUrl: null,
            matchCount: 2,
        });
    });

    it('returns not_found for an unrecognised response', () => {
        expect(subscriptionUrlFromTelegramLookup({ response: { users: null } })).toEqual({
            status: 'not_found',
            subscriptionUrl: null,
        });
    });
});
