#!/usr/bin/env node
/**
 * Thoughtbox Channel — Claude Code Channel Server
 *
 * Subscribes to the Thoughtbox /events SSE stream and pushes protocol
 * lifecycle events (Ulysses, Theseus) into the active Claude Code session
 * via the `claude/channel` notification surface.
 *
 * Configuration via environment variables:
 *   THOUGHTBOX_URL      - Thoughtbox HTTP server URL (required)
 *   THOUGHTBOX_SESSION  - Optional active Thoughtbox session id; when set,
 *                         only events for this session are forwarded
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { extractApiKeyFromLocalConfig, loadLocalThoughtboxConfig, } from "./cli/config.js";
import { EventFilter } from "./event-filter.js";
import { EventClient } from "./event-client.js";
const THOUGHTBOX_URL = process.env.THOUGHTBOX_URL;
const THOUGHTBOX_SESSION = process.env.THOUGHTBOX_SESSION;
if (!THOUGHTBOX_URL) {
    console.error("THOUGHTBOX_URL is required");
    process.exit(1);
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
async function resolveApiKey() {
    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    try {
        const config = await loadLocalThoughtboxConfig(projectDir);
        return extractApiKeyFromLocalConfig(config.settingsLocal);
    }
    catch {
        return null;
    }
}
async function start() {
    const baseUrl = THOUGHTBOX_URL;
    console.error(`[Channel] Connecting to ${baseUrl}`);
    await mcp.connect(new StdioServerTransport());
    console.error("[Channel] MCP stdio transport connected");
    const apiKey = await resolveApiKey();
    if (!apiKey) {
        console.error("[Channel] Thoughtbox key not configured in local Claude settings; channel idle until thoughtbox init runs");
        return;
    }
    const eventClient = new EventClient({
        baseUrl,
        apiKey,
        ...(THOUGHTBOX_SESSION ? { sessionId: THOUGHTBOX_SESSION } : {}),
        onEvent: (event) => void pushEvent(event),
        onError: (err) => console.error("[Channel] SSE error:", err.message),
        onConnect: () => console.error("[Channel] Connected to event stream"),
    });
    eventClient.connect().catch((err) => {
        console.error("[Channel] Failed to connect event stream:", err);
    });
}
start().catch((err) => {
    console.error("[Channel] Fatal error:", err);
    process.exit(1);
});
