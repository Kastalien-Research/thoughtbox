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
export {};
