import { McpServer } from '@modelcontextprotocol/server';
import {
    SUPPORT_PROMPTS,
    SUPPORT_RESOURCES,
    SUPPORT_TOOLS,
} from './support-profile.js';

/**
 * SDK v2 removed the short registration aliases (`tool`/`resource`/`prompt`);
 * `registerTool`/`registerResource`/`registerPrompt` are the only entry points
 * left, so gating them is sufficient.
 */
const GATED_METHODS: Record<string, ReadonlySet<string>> = {
    registerTool: SUPPORT_TOOLS,
    registerResource: SUPPORT_RESOURCES,
    registerPrompt: SUPPORT_PROMPTS,
};

/**
 * Wraps a server so that registrations outside the support profile are dropped.
 * Registration modules see an ordinary McpServer and stay unaware of modes.
 *
 * This is a blast-radius boundary for filtering registrations, not a containment
 * boundary. Callers must not access the `.server` property on a restricted instance
 * to bypass the allowlist — direct access to `.server.setRequestHandler()` bypasses
 * all registration filtering. The actual security boundary is a scoped API token.
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
