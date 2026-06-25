import { describe, it, expect } from 'vitest';
import { toolResult, toolError } from '../src/tools/helpers.js';

describe('toolResult', () => {
    it('wraps data in JSON content', () => {
        const result = toolResult({ foo: 'bar' });
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
        expect(JSON.parse(result.content[0].text)).toEqual({ foo: 'bar' });
    });

    it('handles arrays', () => {
        const result = toolResult([1, 2, 3]);
        expect(result.content).toHaveLength(1);
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).toEqual([1, 2, 3]);
    });

    it('handles strings', () => {
        const result = toolResult('hello');
        expect(result.content[0].text).toContain('hello');
    });

    it('handles null', () => {
        const result = toolResult(null);
        expect(result.content[0].text).toContain('null');
    });
});

describe('toolError', () => {
    it('formats Error objects', () => {
        const result = toolError(new Error('something went wrong'));
        expect(result.isError).toBe(true);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toBe('Error: something went wrong');
    });

    it('formats string errors', () => {
        const result = toolError('bad thing');
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Error: bad thing');
    });

    it('formats unknown errors', () => {
        const result = toolError({ code: 500 });
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Error: [object Object]');
    });
});
