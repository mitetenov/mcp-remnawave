import { describe, expect, it } from 'vitest';
import { subscriptionUrlsFromTelegramLookup } from '../src/tools/users.js';

describe('subscriptionUrlsFromTelegramLookup', () => {
    it('returns only non-empty subscription URLs and optional usernames', () => {
        expect(subscriptionUrlsFromTelegramLookup({
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
            subscriptionUrls: [
                {
                    username: 'vasya',
                    subscriptionUrl: 'https://panel.example.com/sub/vasya',
                },
            ],
        });
    });

    it('returns an empty collection for an unrecognised response', () => {
        expect(subscriptionUrlsFromTelegramLookup({ response: { users: null } })).toEqual({
            subscriptionUrls: [],
        });
    });
});
