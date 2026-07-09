#!/usr/bin/env node
/**
 * Thoughtbox Channel — Claude Code Channel Server
 *
 * Subscribes to the Thoughtbox /events SSE stream and pushes protocol
 * lifecycle events (Ulysses, Theseus) into the active Claude Code session
 * via the `claude/channel` notification surface.
 *
 * Configuration via environment variables:
 *   THOUGHTBOX_URL      - Optional override for the Thoughtbox HTTP server URL;
 *                         when absent, derives from local Claude settings
 *                         written by `thoughtbox init`
 *   THOUGHTBOX_SESSION  - Optional active Thoughtbox session id; when set,
 *                         only events for this session are forwarded
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { extractApiKeyFromLocalConfig, findThoughtboxBaseUrl, loadLocalThoughtboxConfig, } from "./cli/config.js";
import { EventFilter } from "./event-filter.js";
import { EventClient } from "./event-client.js";
import { PollingEventClient } from "./polling-event-client.js";
const THOUGHTBOX_SESSION = process.env.THOUGHTBOX_SESSION;
/**
 * Pick the event transport. A local server serves the in-process /events SSE
 * stream; a hosted (remote) server is multi-replica and only exposes the
 * pull endpoint, so poll there. THOUGHTBOX_CHANNEL_MODE forces a transport.
 */
function selectTransport(baseUrl) {
    const override = process.env.THOUGHTBOX_CHANNEL_MODE;
    if (override === "sse" || override === "poll")
        return override;
    if (override !== undefined) {
        console.error(`[Channel] Warning: THOUGHTBOX_CHANNEL_MODE="${override}" is not supported; falling back to URL-based transport detection`);
    }
    try {
        const host = new URL(baseUrl).hostname;
        return host === "localhost" || host === "127.0.0.1" || host === "::1"
            ? "sse"
            : "poll";
    }
    catch {
        return "poll";
    }
}
const instructions = [
    "Thoughtbox protocol events arrive as <channel source=\"thoughtbox-channel\" ...>.",
    "",
    "- ulysses_outcome (S=2): STOP. Call tb.ulysses({ operation: \"reflect\", ... }) before further mutations.",
    "- ulysses_reflect: Reflection recorded. S reset to 0. You may continue.",
    "- theseus_checkpoint: Review checkpoint result. If not approved, address feedback before continuing.",
    "- theseus_visa: Visa granted for an out-of-scope file. Proceed with caution.",
    "- theseus_outcome: Test result recorded. If B > 0, consider reverting recent changes.",
].join("\n");
const mcp = new Server({ name: "thoughtbox-channel", version: "0.1.0" }, {
    capabilities: {
        experimental: {
            "claude/channel": {},
        },
    },
    instructions,
});
const filter = new EventFilter({ sessionId: THOUGHTBOX_SESSION });
function formatEventContent(event) {
    const d = event.data;
    switch (event.type) {
        case "ulysses_init":
            return `Ulysses session started: ${d.problem}`;
        case "ulysses_outcome":
            return `Outcome: ${d.assessment} (S=${d.S})${Number(d.S) >= 2 ? ". REFLECT required before further mutations." : ""}`;
        case "ulysses_reflect":
            return `Reflection recorded. S reset to 0. Hypothesis: ${d.hypothesis}`;
        case "ulysses_complete":
            return `Ulysses session ${d.status}`;
        case "theseus_init":
            return `Theseus refactoring session started. Scope: ${Array.isArray(d.scope) ? d.scope.join(", ") : d.scope}`;
        case "theseus_visa":
            return `Visa granted for ${d.filePath}: ${d.justification}`;
        case "theseus_checkpoint":
            return `Checkpoint ${d.approved ? "approved" : "needs review"} (B=${d.B})`;
        case "theseus_outcome":
            return `Tests ${d.testsPassed ? "passed" : "failed"} (B=${d.B})`;
        case "theseus_complete":
            return `Theseus session ${d.status}`;
        default:
            return JSON.stringify(d);
    }
}
function formatEventMeta(event) {
    const meta = {
        event: event.type,
        source: event.source,
        session_id: event.sessionId,
    };
    if (event.type === "ulysses_outcome" && Number(event.data.S) >= 2) {
        meta.severity = "high";
    }
    if (event.type === "theseus_outcome" && !event.data.testsPassed) {
        meta.severity = "high";
    }
    for (const [key, val] of Object.entries(event.data)) {
        if (typeof val === "string" || typeof val === "number") {
            meta[key] = String(val);
        }
    }
    return meta;
}
async function pushEvent(event) {
    if (!filter.shouldForward(event))
        return;
    try {
        await mcp.notification({
            method: "notifications/claude/channel",
            params: {
                content: formatEventContent(event),
                meta: formatEventMeta(event),
            },
        });
    }
    catch (err) {
        console.error("[Channel] Failed to push event:", err);
    }
}
function isMissingConfigError(error) {
    return error?.code === "ENOENT";
}
/**
 * Resolve the server base URL and API key. The URL comes from THOUGHTBOX_URL
 * when set, otherwise from the MCP server `thoughtbox init` wrote to local
 * Claude settings; the key always comes from local settings. Returns null
 * (channel stays idle, never exits) when either is missing.
 */
async function resolveConnection() {
    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    let baseUrl = process.env.THOUGHTBOX_URL ?? null;
    let apiKey = null;
    try {
        const config = await loadLocalThoughtboxConfig(projectDir);
        apiKey = extractApiKeyFromLocalConfig(config.settingsLocal);
        baseUrl = baseUrl ?? findThoughtboxBaseUrl(config.settingsLocal);
    }
    catch (error) {
        if (isMissingConfigError(error)) {
            return null;
        }
        console.error("[Channel] Failed to load local Claude settings:", error);
        throw error;
    }
    if (!baseUrl || !apiKey)
        return null;
    return { baseUrl, apiKey };
}
async function start() {
    await mcp.connect(new StdioServerTransport());
    console.error("[Channel] MCP stdio transport connected");
    const connection = await resolveConnection();
    if (!connection) {
        console.error("[Channel] Thoughtbox URL/key not configured in local Claude settings; channel idle until thoughtbox init runs");
        return;
    }
    const { baseUrl, apiKey } = connection;
    const mode = selectTransport(baseUrl);
    console.error(`[Channel] Connecting to ${baseUrl} (${mode})`);
    const clientConfig = {
        baseUrl,
        apiKey,
        ...(THOUGHTBOX_SESSION ? { sessionId: THOUGHTBOX_SESSION } : {}),
        onEvent: (event) => void pushEvent(event),
        onError: (err) => console.error(`[Channel] ${mode} error:`, err.message),
        onConnect: () => console.error(`[Channel] Connected to event stream (${mode})`),
    };
    const client = mode === "sse"
        ? new EventClient(clientConfig)
        : new PollingEventClient(clientConfig);
    client.connect().catch((err) => {
        console.error("[Channel] Failed to connect event stream:", err);
    });
}
start().catch((err) => {
    console.error("[Channel] Fatal error:", err);
    process.exit(1);
});
