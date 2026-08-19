import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    SUPPORT_PROMPTS,
    SUPPORT_RESOURCES,
    SUPPORT_TOOLS,
} from './support-profile.js';

/**
 * McpServer exposes both the short registration methods and the newer
 * `register*` aliases. Both are gated: intercepting only one set would leave a
 * hole the moment anyone reaches for the other.
 */
const GATED_METHODS: Record<string, ReadonlySet<string>> = {
    tool: SUPPORT_TOOLS,
    registerTool: SUPPORT_TOOLS,
    resource: SUPPORT_RESOURCES,
    registerResource: SUPPORT_RESOURCES,
    prompt: SUPPORT_PROMPTS,
    registerPrompt: SUPPORT_PROMPTS,
};

/**
 * Wraps a server so that registrations outside the support profile are dropped.
 * Registration modules see an ordinary McpServer and stay unaware of modes.
 *
 * Skipped registrations return `undefined`, so callers must not use the return
 * value of a registration call.
 */
export function restrictToSupport(server: McpServer): McpServer {
    return new Proxy(server, {
        get(target, prop) {
            // Read with `target` as the receiver. McpServer is a class using
            // private fields, and forwarding the proxy as the receiver makes
            // those reads throw.
            const value = Reflect.get(target, prop, target);
            if (typeof value !== 'function') {
                return value;
            }

            const allowed = typeof prop === 'string' ? GATED_METHODS[prop] : undefined;
            if (!allowed) {
                return value.bind(target);
            }

            return (name: string, ...rest: unknown[]) =>
                allowed.has(name) ? value.apply(target, [name, ...rest]) : undefined;
        },
    });
}
