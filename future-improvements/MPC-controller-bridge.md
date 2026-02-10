# MPC-Thoughtbox Bridge: Design Specification

> **Project:** Agent DAW — Physical MIDI Controller for AI Agent Orchestration
> **Version:** 1.0.0
> **Date:** 2026-02-07
> **Author:** glassBead + Claude (collaborative design)
> **Hardware:** Akai MPC Studio (MK2/Black)
> **Target:** Thoughtbox MCP Server v2.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Hardware Reference](#3-hardware-reference)
4. [MIDI Implementation](#4-midi-implementation)
5. [Bridge Layer ("Agent DAW")](#5-bridge-layer-agent-daw)
6. [Timing Model](#6-timing-model)
7. [Stage-Aware Progressive Disclosure](#7-stage-aware-progressive-disclosure)
8. [Pad Mapping Tables](#8-pad-mapping-tables)
9. [Function Button Assignments](#9-function-button-assignments)
10. [Touch Strip & Encoder](#10-touch-strip--encoder)
11. [Feedback Channels](#11-feedback-channels)
12. [Voice Integration](#12-voice-integration)
13. [Sequence Recording](#13-sequence-recording)
14. [BridgeConfig Schema](#14-bridgeconfig-schema)
15. [Observatory WebSocket Protocol](#15-observatory-websocket-protocol)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [Appendix A: Thoughtbox Operation Reference](#appendix-a-thoughtbox-operation-reference)
18. [Appendix B: Mental Models Catalog](#appendix-b-mental-models-catalog)
19. [Appendix C: Cipher Protocol Quick Reference](#appendix-c-cipher-protocol-quick-reference)

---

## 1. Executive Summary

### What

A middleware bridge ("Agent DAW") that translates Akai MPC Studio MIDI input into Thoughtbox MCP operations, providing a physical performance interface for orchestrating AI agents.

### Why

1. **Motor intuition** — Embodied fluency for agent coordination, like a musician playing an instrument
2. **10x+ throughput** — Pads route operations, voice provides content, eliminating keyboard bottlenecks
3. **Real-time performance** — Live multi-agent orchestration with transport controls, quantization, and sequence recording

### How

```
┌──────────────┐     USB MIDI      ┌──────────────┐      MCP        ┌──────────────┐
│  MPC Studio  │◄──────────────────►│  Agent DAW   │◄───────────────►│  Thoughtbox  │
│  (hardware)  │  Notes, CC, SysEx │  (bridge)     │  3 gateways     │  (server)    │
└──────────────┘                   └──────┬───────┘                  └──────┬───────┘
                                          │ WebSocket :1729                 │
                                          ◄────────────────────────────────►│
                                          │         Observatory             │
                                          │                                 │
                                    ┌─────▼───────┐                         │
                                    │  Voice STT   │  Content input          │
                                    │  (external)  │  via voice buffer       │
                                    └─────────────┘                         │
```

---

## 2. System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Agent DAW (Node.js)                          │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐               │
│  │  MIDI I/O    │  │ Clock Engine │  │ Stage Manager │               │
│  │  (easymidi)  │  │ (24 PPQN)   │  │              │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘               │
│         │                │                 │                        │
│  ┌──────▼──────────────────▼─────────────────▼───────┐              │
│  │              Dispatch Scheduler                    │              │
│  │  • Quantizes pad events to beat/bar grid           │              │
│  │  • Batches simultaneous hits ("chords")            │              │
│  │  • Manages sustained/loop temporality              │              │
│  └──────────────────────┬────────────────────────────┘              │
│                         │                                           │
│  ┌──────────────────────▼────────────────────────────┐              │
│  │              MCP Client Pool                       │              │
│  │  ┌───────────────┐ ┌──────────┐ ┌──────────────┐ │              │
│  │  │thoughtbox_    │ │thoughtbox│ │observability_ │ │              │
│  │  │gateway        │ │_hub      │ │gateway        │ │              │
│  │  └───────────────┘ └──────────┘ └──────────────┘ │              │
│  └───────────────────────────────────────────────────┘              │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Feedback        │  │ Sequence     │  │ Voice Buffer  │          │
│  │ Renderer        │  │ Recorder     │  │ Manager       │          │
│  │ (→ pad RGB,     │  │ (capture &   │  │ (STT intake)  │          │
│  │  LCD, strip)    │  │  replay)     │  │               │          │
│  └─────────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. PAD PRESS → MIDI Note On (ch, note, velocity)
                    │
2.              Clock Engine quantizes to beat grid
                    │
3.              Stage Manager checks: is this pad active at current stage?
                    │
4.              Dispatch Scheduler resolves:
                    ├── operation (from pad mapping)
                    ├── args (from voice buffer / encoder / touch strip)
                    └── temporal mode (oneshot / sustained / loop)
                    │
5.              MCP Client dispatches to appropriate gateway
                    │
6.              Thoughtbox processes, emits Observatory event
                    │
7.              WebSocket event → Feedback Renderer
                    │
8.              Renderer → MIDI SysEx → Pad RGB update
```

---

## 3. Hardware Reference

### Akai MPC Studio Control Surface

| Control | Count | Type | MIDI Behavior |
|---------|-------|------|---------------|
| Pads | 16 (× 8 banks = 128 slots) | Velocity + pressure sensitive, RGB backlit | Note On/Off, Aftertouch |
| Encoder | 1 | 360° rotary with push button | CC (relative), Note for push |
| Touch Strip | 1 | Capacitive strip with LED indicators | CC (absolute, 0-127) |
| Function Buttons | 39 | LED-backlit momentary switches | Note On/Off or CC |
| LCD | 1 | Small monochrome display | SysEx |

### Hardware Constraints

- **No Q-Link knobs** — no dedicated continuous controllers beyond encoder + touch strip
- **No faders** — all continuous control via encoder (relative) or touch strip (absolute)
- **USB bus powered** — single USB cable for MIDI and power
- **MIDI I/O** — 3.5mm TRS jacks (for chaining external gear, not primary)

---

## 4. MIDI Implementation

### MPC Studio MIDI Map

> **IMPORTANT:** These are approximate defaults. The first implementation task is to run a MIDI monitor and capture the actual note/CC numbers for your specific MPC Studio model. The bridge should have a calibration mode for this.

#### Pads (Bank A Default)

| Pad | Grid Position | Expected MIDI Note | Channel |
|-----|--------------|-------------------|---------|
| 1 | Bottom-left | 37 (C#1) | 10 |
| 2 | | 36 (C1) | 10 |
| 3 | | 42 (F#1) | 10 |
| 4 | | 82 (A#4) | 10 |
| 5 | | 40 (E1) | 10 |
| 6 | | 38 (D1) | 10 |
| 7 | | 46 (A#1) | 10 |
| 8 | | 44 (G#1) | 10 |
| 9 | | 48 (C2) | 10 |
| 10 | | 47 (B1) | 10 |
| 11 | | 45 (A1) | 10 |
| 12 | Top-right | 43 (G1) | 10 |
| 13 | | 49 (C#2) | 10 |
| 14 | | 55 (G2) | 10 |
| 15 | | 51 (D#2) | 10 |
| 16 | | 53 (F2) | 10 |

> **Bank switching:** When changing pad banks (A-H), the MPC sends different note numbers or the same notes on different channels. Map empirically during calibration.

#### Encoder

| Action | MIDI Message |
|--------|-------------|
| Rotate CW | CC 100, value 1 (relative) |
| Rotate CCW | CC 100, value 127 (relative) |
| Push | Note On (specific note TBD) |

#### Touch Strip

| Action | MIDI Message |
|--------|-------------|
| Position | CC 1 (or CC TBD), value 0-127 |
| Touch start | Depends on model |
| Touch end | Value returns to center or holds |

#### Function Buttons

| Button | Expected MIDI | Type |
|--------|-------------|------|
| Play | CC 118, val 127 | Momentary |
| Stop | CC 117, val 127 | Momentary |
| Record | CC 119, val 127 | Momentary |
| Overdub | CC TBD | Momentary |
| Pad Bank ← | CC TBD | Momentary |
| Pad Bank → | CC TBD | Momentary |
| Main | CC TBD | Momentary |
| Shift | CC TBD | Held modifier |
| Note Repeat | CC TBD | Toggle |

> All CC/Note values marked TBD must be captured via MIDI monitor during calibration.

### SysEx: Pad RGB Control

The MPC Studio supports programmatic pad color control via SysEx messages. The exact format varies by model revision.

**Expected SysEx format (MPC Studio MK2 / Black):**

```
F0 47 7F [device_id] [command] [pad_number] [red] [green] [blue] F7
```

Where:
- `F0` = SysEx start
- `47 7F` = Akai manufacturer ID
- `[device_id]` = Model-specific (often `25` for MPC Studio)
- `[command]` = Pad color set command (often `65`)
- `[pad_number]` = 0-15 (current bank)
- `[red] [green] [blue]` = 0-127 each
- `F7` = SysEx end

> **CRITICAL:** This must be reverse-engineered or found in community documentation. Start with [MPC-Forums](https://www.mpc-forums.com) and MIDI monitor capture of the MPC software's own pad color changes. The bridge needs a `sysex-probe` utility.

### SysEx: LCD Control

If accessible (model-dependent):

```
F0 47 7F [device_id] [lcd_command] [text_bytes...] F7
```

> May not be available on all MPC Studio models. Fall back to Observatory web UI for visual feedback if LCD is not SysEx-addressable.

---

## 5. Bridge Layer ("Agent DAW")

### Technology Stack

```yaml
runtime: Node.js (ESM)
midi_library: easymidi (or node-midi for lower-level SysEx)
mcp_client: "@modelcontextprotocol/sdk"
websocket: ws (for Observatory connection)
clock: custom 24 PPQN implementation
config: JSON file + hot-reload via file watcher
```

### Module Structure

```
agent-daw/
├── src/
│   ├── index.ts                 # Entry point, wires everything
│   ├── midi/
│   │   ├── input.ts             # MIDI input handler, note/CC/SysEx parsing
│   │   ├── output.ts            # SysEx pad color, LCD, touch strip LEDs
│   │   ├── calibrate.ts         # Interactive calibration mode
│   │   └── constants.ts         # Note/CC mappings (generated by calibration)
│   ├── clock/
│   │   ├── engine.ts            # 24 PPQN clock, transport state machine
│   │   └── quantizer.ts         # Beat/bar quantization of events
│   ├── stage/
│   │   ├── manager.ts           # Stage 0/1/2/3 state machine
│   │   └── surface.ts           # Pad surface reconfiguration per stage
│   ├── dispatch/
│   │   ├── scheduler.ts         # Quantized dispatch queue
│   │   ├── resolver.ts          # Pad → operation resolution
│   │   └── temporal.ts          # Oneshot/sustained/loop handlers
│   ├── mcp/
│   │   ├── pool.ts              # MCP client connections (3 gateways)
│   │   ├── gateway.ts           # thoughtbox_gateway client
│   │   ├── hub.ts               # thoughtbox_hub client
│   │   └── observability.ts     # observability_gateway client
│   ├── feedback/
│   │   ├── renderer.ts          # Observatory events → MIDI output
│   │   ├── colors.ts            # Color palette and animation definitions
│   │   └── lcd.ts               # LCD text formatting
│   ├── sequence/
│   │   ├── recorder.ts          # Capture pad sequences
│   │   └── player.ts            # Replay recorded sequences
│   ├── voice/
│   │   └── buffer.ts            # Voice-to-text content buffer
│   └── config/
│       ├── bridge-config.ts     # BridgeConfig schema + loader
│       └── pad-mappings.ts      # Complete pad mapping definitions
├── config/
│   ├── default.json             # Default BridgeConfig
│   └── calibration.json         # Hardware-specific MIDI mappings
├── package.json
└── tsconfig.json
```

### Startup Sequence

```
1. Load config/default.json + config/calibration.json
2. Open MIDI input/output ports (scan for "MPC Studio")
3. Connect MCP clients to Thoughtbox (stdio or HTTP)
4. Connect WebSocket to Observatory (ws://localhost:1729)
5. Initialize clock engine (paused)
6. Set stage to 0
7. Paint Stage 0 pad surface (boot colors)
8. Send get_state to check for existing session
9. Ready — waiting for pad input
```

---

## 6. Timing Model

### MIDI Clock as Orchestration Primitive

The bridge generates an internal MIDI clock at configurable BPM. This clock serves as the orchestration resolution grid.

```
BPM = 120 (default)
PPQN = 24 (pulses per quarter note)
Ticks per second = (120 × 24) / 60 = 48
Beat duration = 500ms
Bar duration = 2000ms (4/4 time)
```

### Transport Controls

| Button | Action | Effect |
|--------|--------|--------|
| **Play** | Start clock | Clock ticks begin, quantized dispatches enabled |
| **Stop** | Halt clock | Running agents continue, scheduled dispatches suspended |
| **Record** | Arm recording | Subsequent pad hits captured as sequence |
| **Overdub** | Layer mode | New pad hits added to existing sequence |

When clock is **stopped**, pad hits dispatch immediately (no quantization). This is "free time" mode — useful for setup operations.

When clock is **running**, pad hits quantize to the configured grid.

### Temporal Categories

Every pad mapping has a `temporal` property that determines how it interacts with the clock:

#### One-Shot (`temporal: 'oneshot'`)

Fire-and-forget. Pad press queues a single MCP call, quantized to the beat grid.

```
Pad press at tick 18 (within beat 1)
  → quantize to beat boundary (tick 24)
  → dispatch operation
  → pad flashes on dispatch
  → pad color changes when Observatory confirms completion
```

**Operations:** `thought`, `create_problem`, `mark_consensus`, `mental_models.get_model`, `notebook.run_cell`, `session.export`, `knowledge.create_pattern`

#### Sustained (`temporal: 'sustained'`)

Held pad. Duration or aftertouch pressure modulates operation parameters.

```
Pad press (Note On, velocity V)
  → begin operation with initial params
  → aftertouch (pressure changes) → modulate depth/count/scope
  → Pad release (Note Off) → finalize/stop
```

**Pressure mapping for deep_analysis:**
- Light pressure (0-42): `analysisType: 'patterns'`
- Medium pressure (43-84): `analysisType: 'cognitive_load'`
- Hard pressure (85-127): `analysisType: 'full'`

**Operations:** `deep_analysis`, `session.search`, `read_thoughts` (encoder scrolls while held)

#### Loop (`temporal: 'loop'`)

Repeating operation, synced to clock divisions. Enabled via Note Repeat mode.

```
Note Repeat ON + Pad press
  → dispatch operation every N beats/bars
  → BPM controls loop tightness
  → Pad release stops loop
```

**Loop intervals (configurable per pad):**

| Interval | At 120 BPM | Use Case |
|----------|-----------|----------|
| 1 beat | 500ms | Aggressive polling |
| 4 beats (1 bar) | 2s | Active monitoring |
| 8 beats (2 bars) | 4s | Standard health check |
| 16 beats (4 bars) | 8s | Relaxed monitoring |
| 32 beats (8 bars) | 16s | Background maintenance |

**Operations:** `observability_gateway.health`, `hub.workspace_status`, `session.extract_learnings`

### Quantization Modes

| Mode | Behavior | When |
|------|----------|------|
| `'immediate'` | No quantization, dispatch on Note On | Clock stopped, or critical ops |
| `'beat'` | Snap to next beat boundary | Default for most operations |
| `'bar'` | Snap to next bar (downbeat) | Heavy operations, batch dispatches |
| `'4bar'` | Snap to next 4-bar phrase | Extract learnings, major analysis |

### Chord Detection (Multi-Agent Dispatch)

When multiple pads are hit within the same quantization window, the bridge batches them as a "chord" — simultaneous coordinated dispatch.

```
Within same beat window:
  Pad 1 (Bank 2) = create_problem    ─┐
  Pad 5 (Bank 2) = create_proposal   ─┤── dispatched together
  Pad 9 (Bank 2) = mark_consensus    ─┘   as coordinated batch
```

This enables **call-and-response patterns**: Agent A on beat 1, Agent B on beat 3 — structural timing relationships for multi-agent workflows.

---

## 7. Stage-Aware Progressive Disclosure

The bridge mirrors Thoughtbox's stage system. As the server advances stages, the pad surface reconfigures automatically.

### Stage Transitions

```
Stage 0 (Boot)
  │
  ├── Pad 2: start_new (voice provides title)  ──► Stage 1
  ├── Pads 3-12: load_context (recent sessions) ──► Stage 1
  │
Stage 1 (Session Active, Pre-Cipher)
  │
  ├── Pad 1 (Bank 1): cipher                   ──► Stage 2
  │
Stage 2 (Full Performance Surface)
  │
  │   All 8 banks × 16 pads active
  │   Full Thoughtbox capabilities unlocked
  │
Stage 3 (Domain Active — future)
  │   Domain-specific tools enabled if configured
```

### Stage Detection

The bridge detects stage transitions via:

1. **MCP response parsing** — `start_new` returns session confirmation → advance to Stage 1
2. **Observatory events** — `session_started` WebSocket event → confirm Stage 1
3. **Cipher response** — successful `cipher` operation → advance to Stage 2
4. **Error handling** — `STAGE_REQUIREMENT_NOT_MET` error → display current stage on LCD

### Surface Reconfiguration

On stage change, the bridge:

1. Updates internal stage state
2. Recalculates active pad set (filter by `minimumStage`)
3. Sends SysEx to repaint all 16 visible pads with new colors
4. Updates LCD with stage indicator
5. Emits stage change event for sequence recorder

---

## 8. Pad Mapping Tables

### Bank 1 — Stage 0: Boot Surface

> Only active at Stage 0. Replaced by Thought Engine at Stage 2.

| Pad | Label | Color | Operation | Gateway | Args | Temporal |
|-----|-------|-------|-----------|---------|------|----------|
| 1 | Get State | White (dim) | `get_state` | `thoughtbox_gateway` | — | immediate |
| 2 | New Session | Blue | `start_new` | `thoughtbox_gateway` | `{ sessionTitle: fromVoice }` | immediate |
| 3 | Recent #0 | Cyan | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[0] }` | immediate |
| 4 | Recent #1 | Cyan | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[1] }` | immediate |
| 5 | Recent #2 | Cyan | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[2] }` | immediate |
| 6 | Recent #3 | Cyan | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[3] }` | immediate |
| 7 | Recent #4 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[4] }` | immediate |
| 8 | Recent #5 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[5] }` | immediate |
| 9 | Recent #6 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[6] }` | immediate |
| 10 | Recent #7 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[7] }` | immediate |
| 11 | Recent #8 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[8] }` | immediate |
| 12 | Recent #9 | Cyan dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: MRU[9] }` | immediate |
| 13 | — | Off | — | — | — | — |
| 14 | — | Off | — | — | — | — |
| 15 | — | Off | — | — | — | — |
| 16 | Health | Green | `health` | `observability_gateway` | — | immediate |

> **Encoder** scrolls through sessions beyond the first 10. **LCD** shows session title for highlighted pad.

---

### Bank 1 — Stage 1: Session Active, Pre-Cipher

| Pad | Label | Color | Operation | Gateway | Args | Temporal |
|-----|-------|-------|-----------|---------|------|----------|
| 1 | Load Cipher | Gold (pulsing) | `cipher` | `thoughtbox_gateway` | — | immediate |
| 2 | List Sessions | Cyan | `session` | `thoughtbox_gateway` | `{ subOperation: 'list' }` | oneshot |
| 3 | Search Sessions | Cyan | `session` | `thoughtbox_gateway` | `{ subOperation: 'search', args: { query: fromVoice } }` | oneshot |
| 4 | Export Session | Cyan dim | `session` | `thoughtbox_gateway` | `{ subOperation: 'export' }` | oneshot |
| 5 | Deep Analysis | Purple | `deep_analysis` | `thoughtbox_gateway` | `{ analysisType: fromPressure }` | sustained |
| 6 | — | Off | — | — | — | — |
| 7 | — | Off | — | — | — | — |
| 8 | — | Off | — | — | — | — |
| 9-16 | Quick-switch | White dim | `load_context` | `thoughtbox_gateway` | `{ sessionId: active[N] }` | immediate |

---

### Bank 1 — Stage 2: Thought Engine (Core Instrument)

> This is the primary performance surface.

| Pad | Label | Color | Operation | Gateway | Args | Temporal | Shift Action |
|-----|-------|-------|-----------|---------|------|----------|-------------|
| 1 | **Record Thought** | Green | `thought` | `thoughtbox_gateway` | `{ thought: fromVoice, nextThoughtNeeded: true }` | oneshot (beat) | `nextThoughtNeeded: false` (final thought) |
| 2 | Read Last N | Teal | `read_thoughts` | `thoughtbox_gateway` | `{ last: fromEncoder }` | sustained | Read specific # |
| 3 | Read Specific | Teal dim | `read_thoughts` | `thoughtbox_gateway` | `{ thoughtNumber: fromEncoder }` | sustained | Read range |
| 4 | Get Structure | Teal dim | `get_structure` | `thoughtbox_gateway` | — | oneshot | — |
| 5 | Create Branch | Yellow | `thought` | `thoughtbox_gateway` | `{ branchFromThought: fromEncoder, branchId: fromVoice }` | oneshot | — |
| 6 | Switch Branch | Yellow dim | `read_thoughts` | `thoughtbox_gateway` | `{ branchId: fromVoice }` | oneshot | List branches |
| 7 | Revise Thought | Orange | `thought` | `thoughtbox_gateway` | `{ isRevision: true, revisesThought: fromEncoder, thought: fromVoice }` | oneshot | — |
| 8 | Critique | Red | `thought` | `thoughtbox_gateway` | `{ critique: true, thought: fromVoice }` | oneshot | — |
| 9 | **H** (Hypothesis) | Blue bright | Cipher marker | — | Prefixes voice with `H\|` | — | — |
| 10 | **E** (Evidence) | Blue | Cipher marker | — | Prefixes voice with `E\|` | — | — |
| 11 | **C** (Conclusion) | Blue dim | Cipher marker | — | Prefixes voice with `C\|` | — | — |
| 12 | **Q** (Question) | White | Cipher marker | — | Prefixes voice with `Q\|` | — | — |
| 13 | **R** (Revision) | Orange | Cipher marker | — | Prefixes voice with `R\|^` | — | — |
| 14 | **P** (Plan) | Green dim | Cipher marker | — | Prefixes voice with `P\|` | — | — |
| 15 | **O** (Observation) | Magenta | Cipher marker | — | Prefixes voice with `O\|` | — | — |
| 16 | **A** (Assumption) | Amber | Cipher marker | — | Prefixes voice with `A\|` | — | — |

> **Cipher markers (pads 9-16):** These modify the *next* thought recorded via Pad 1. Press a cipher type, then press Record Thought — the bridge prepends the cipher format to the voice content. Cipher pad lights up to show it's "armed."

---

### Bank 2 — Hub Operations

| Pad | Label | Color | Operation | Gateway | Args | Temporal |
|-----|-------|-------|-----------|---------|------|----------|
| 1 | Create Problem | Red | `create_problem` | `thoughtbox_hub` | `{ title: fromVoice, description: fromVoice }` | oneshot |
| 2 | Claim Problem | Red dim | `claim_problem` | `thoughtbox_hub` | `{ problemId: fromEncoder }` | oneshot |
| 3 | Update Problem | Orange | `update_problem` | `thoughtbox_hub` | `{ problemId: fromEncoder, status: fromVoice }` | oneshot |
| 4 | List Problems | Orange dim | `list_problems` | `thoughtbox_hub` | — | oneshot |
| 5 | Create Proposal | Blue | `create_proposal` | `thoughtbox_hub` | `{ title: fromVoice, sourceBranch: fromVoice }` | oneshot |
| 6 | Review Proposal | Blue dim | `review_proposal` | `thoughtbox_hub` | `{ proposalId: fromEncoder, verdict: fromVoice }` | oneshot |
| 7 | Merge Proposal | Green | `merge_proposal` | `thoughtbox_hub` | `{ proposalId: fromEncoder }` | oneshot |
| 8 | List Proposals | Green dim | `list_proposals` | `thoughtbox_hub` | — | oneshot |
| 9 | Mark Consensus | Gold | `mark_consensus` | `thoughtbox_hub` | `{ name: fromVoice, thoughtRef: fromEncoder }` | oneshot |
| 10 | Endorse Consensus | Gold dim | `endorse_consensus` | `thoughtbox_hub` | `{ consensusId: fromEncoder }` | oneshot |
| 11 | List Consensus | White | `list_consensus` | `thoughtbox_hub` | — | oneshot |
| 12 | Post Message | Cyan | `post_message` | `thoughtbox_hub` | `{ content: fromVoice, problemId: fromEncoder }` | oneshot |
| 13 | Read Channel | Cyan dim | `read_channel` | `thoughtbox_hub` | `{ problemId: fromEncoder }` | sustained |
| 14 | Dynamic: Active Problem 1 | Red pulse | `claim_problem` | `thoughtbox_hub` | Dynamic | oneshot |
| 15 | Dynamic: Active Problem 2 | Red pulse | `claim_problem` | `thoughtbox_hub` | Dynamic | oneshot |
| 16 | Dynamic: Active Problem 3 | Red pulse | `claim_problem` | `thoughtbox_hub` | Dynamic | oneshot |

---

### Bank 3 — Mental Models

> Each pad triggers `mental_models.get_model` with the corresponding model name.

| Pad | Model ID | Title | Color |
|-----|----------|-------|-------|
| 1 | `rubber-duck` | Rubber Duck Debugging | Yellow |
| 2 | `five-whys` | Five Whys | Yellow |
| 3 | `pre-mortem` | Pre-Mortem Analysis | Orange |
| 4 | `steelmanning` | Steelmanning | Blue |
| 5 | `fermi-estimation` | Fermi Estimation | Green |
| 6 | `trade-off-matrix` | Trade-off Matrix | Purple |
| 7 | `decomposition` | Problem Decomposition | Cyan |
| 8 | `inversion` | Inversion | Red |
| 9 | `abstraction-laddering` | Abstraction Laddering | Teal |
| 10 | `constraint-relaxation` | Constraint Relaxation | Magenta |
| 11 | `assumption-surfacing` | Assumption Surfacing | Amber |
| 12 | `adversarial-thinking` | Adversarial Thinking | Red dim |
| 13 | `time-horizon-shifting` | Time Horizon Shifting | Blue dim |
| 14 | `impact-effort-grid` | Impact-Effort Grid | Green dim |
| 15 | `opportunity-cost` | Opportunity Cost | Purple dim |
| 16 | List/Search | List by tag | White |

> **All pads:** `gateway: 'thoughtbox_gateway'`, `operation: 'mental_models'`, `args: { subOperation: 'get_model', args: { name: <model_id> } }`, `temporal: 'oneshot'`
>
> **Pad 16 (Shift):** `{ subOperation: 'list_tags' }`

---

### Bank 4 — Knowledge Graph

| Pad | Label | Color | Operation | Args | Temporal |
|-----|-------|-------|-----------|------|----------|
| 1 | Create Pattern | Green | `knowledge` | `{ subOperation: 'create_pattern', args: fromVoice }` | oneshot |
| 2 | Find Patterns | Cyan | `knowledge` | `{ subOperation: 'find_patterns', args: { query: fromVoice } }` | oneshot |
| 3 | Link Session | Blue | `knowledge` | `{ subOperation: 'link_session', args: fromVoice }` | oneshot |
| 4-16 | Dynamic: Recent Patterns | White dim → colored | Dynamic from Observatory | Dynamic | oneshot |

> **All via `thoughtbox_gateway`**

---

### Bank 5 — Notebook / Code

| Pad | Label | Color | Operation | Args | Temporal |
|-----|-------|-------|-----------|------|----------|
| 1 | Create Notebook | Green | `notebook` | `{ subOperation: 'create', args: { name: fromVoice } }` | oneshot |
| 2 | Add Cell | Green dim | `notebook` | `{ subOperation: 'add_cell', args: fromVoice }` | oneshot |
| 3 | Run Cell | Blue bright | `notebook` | `{ subOperation: 'run_cell', args: { cellId: fromEncoder } }` | oneshot |
| 4 | Update Cell | Orange | `notebook` | `{ subOperation: 'update_cell', args: fromVoice }` | oneshot |
| 5 | Install Deps | Yellow | `notebook` | `{ subOperation: 'install_deps', args: fromVoice }` | oneshot |
| 6 | Export | Cyan | `notebook` | `{ subOperation: 'export' }` | oneshot |
| 7-16 | Dynamic: Active Cells | White dim | `notebook.run_cell` | `{ cellId: dynamic }` | oneshot |

> **All via `thoughtbox_gateway`**

---

### Bank 6 — Macros / Sequences

> User-recorded orchestration patterns. Each pad triggers a saved sequence.

| Pad | Label | Color | Content |
|-----|-------|-------|---------|
| 1-16 | User-defined | Magenta (filled) / Dim (empty) | Recorded pad sequences |

> **Shift + Pad:** Enter record mode for that slot.
> **Pad press (no shift):** Replay sequence, quantized to current clock.

---

### Bank 7 — Agent Status Dashboard

> Each pad represents a registered agent. Colors driven by Observatory.

| Pad | Content | Color States |
|-----|---------|-------------|
| 1-16 | Dynamic: Registered agents | See color table below |

**Agent Status Colors:**

| Status | Color | Animation |
|--------|-------|-----------|
| Idle | White dim | Solid |
| Working | Blue | Pulse |
| Consensus reached | Green | Solid |
| Needs review | Amber | Pulse |
| Blocked/Error | Red | Flash |
| Offline | Off | — |

> **Pad press:** Show agent detail on LCD (name, current work, session).
> **Shift + Pad:** Send message to agent's workspace channel.

---

### Bank 8 — Prompts / Advanced

| Pad | Label | Color | Action | Temporal |
|-----|-------|-------|--------|----------|
| 1 | Subagent Summarize (RLM) | Purple | Trigger `subagent-summarize` prompt | oneshot |
| 2 | Evolution Check (A-Mem) | Purple dim | Trigger `evolution-check` prompt | oneshot |
| 3 | Interleaved Thinking | Purple dim | Trigger `interleaved-thinking` prompt | oneshot |
| 4 | Extract Learnings | Cyan | `session.extract_learnings` | oneshot |
| 5 | Session Discovery | Cyan dim | `session.discovery` | oneshot |
| 6 | Session Analyze | Blue | `session.analyze` | oneshot |
| 7 | — | Off | — | — |
| 8 | — | Off | — | — |
| 9-16 | User-definable | White dim | Custom operations | — |

---

## 9. Function Button Assignments

### Transport (Primary)

| Button | Normal | With Clock Running |
|--------|--------|-------------------|
| **Play** | Start clock at configured BPM | — (already running) |
| **Stop** | — (already stopped) | Stop clock, suspend scheduled dispatches |
| **Record** | Arm sequence recording | Recording: capture all pad events |
| **Overdub** | — | Layer new events onto current sequence |

### Navigation

| Button | Action | Shift + Button |
|--------|--------|---------------|
| **Pad Bank ←** | Previous bank (1→8 wrap) | Jump to Bank 1 |
| **Pad Bank →** | Next bank (8→1 wrap) | Jump to Bank 7 (Agent Dashboard) |
| **Encoder Push** | Confirm / Select | Cancel / Back |

### Mode Switches

| Button | Action |
|--------|--------|
| **Main** | Return to Bank 1 (context-sensitive: Stage 0 boot or Stage 2 thoughts) |
| **Shift** (held) | Activate alternate pad actions (see Shift Action column in pad tables) |
| **Note Repeat** | Toggle loop mode — held pads auto-dispatch at clock divisions |
| **Undo** | Undo last dispatched operation (if Thoughtbox supports) |
| **Full Level** | All velocities max (bypass velocity-sensitive parameter mapping) |
| **16 Level** | Spread single pad across 16 velocity levels (useful for deep_analysis pressure) |

---

## 10. Touch Strip & Encoder

### Touch Strip

The touch strip is the primary continuous controller — the most valuable real estate on the device.

**Default assignment: BPM Control (Orchestration Intensity)**

```
Touch strip position 0-127 maps to BPM range:

Position 0   = 60 BPM  (relaxed, 1 tick/sec at PPQN=24)
Position 64  = 120 BPM (standard)
Position 127 = 240 BPM (aggressive)

LEDs on strip show current BPM zone:
  Green zone (60-90):   Relaxed monitoring
  Blue zone (90-150):   Standard orchestration
  Red zone (150-240):   High-intensity coordination
```

**Shift + Touch Strip: Confidence Threshold**

```
Position 0-127 maps to confidence threshold 0.0-1.0
Used for consensus operations (mark_consensus, review_proposal)
```

**Context-sensitive override:** When a sustained pad is held, touch strip can control that operation's primary parameter instead of BPM.

### Encoder (360° Rotary)

**Default: Scroll / Navigate**

The encoder is context-sensitive based on what operation is active:

| Context | CW Rotation | CCW Rotation | Push |
|---------|------------|-------------|------|
| Stage 0 (boot) | Next session in MRU list | Previous session | Load highlighted session |
| Read Thoughts (held) | Next thought | Previous thought | — |
| Any "fromEncoder" field | Increment value | Decrement value | Confirm value |
| Idle | Scroll LCD display | Scroll LCD display | — |

---

## 11. Feedback Channels

### Observatory WebSocket (Primary Feedback)

Connect to `ws://localhost:1729` on bridge startup.

**Subscribe to events:**

```json
{ "type": "subscribe", "sessionId": "<current_session_id>" }
```

**Event → Pad Color Mapping:**

| Observatory Event | Feedback Action |
|-------------------|----------------|
| `thought_added` | Bank 1, Pad 1 flashes green → returns to solid |
| `thought_revised` | Bank 1, Pad 7 flashes orange → returns |
| `branch_created` | Bank 1, Pad 5 flashes yellow → new branch pad activates |
| `session_started` | Stage transition → repaint entire surface |
| `session_ended` | Return to Stage 0 boot surface |
| Agent status changes | Bank 7 pad color updates |
| Problem created | Bank 2, Pad 14-16 dynamic slot populates |
| Consensus reached | Bank 2, Pad 9 pulses gold |
| Health degraded | Bank 1 Stage 0, Pad 16 turns amber/red |

### JSONL Event Stream (Secondary)

If `THOUGHTBOX_EVENTS_ENABLED=true` and `THOUGHTBOX_EVENTS_DEST=stderr`:

The bridge can parse stderr JSONL lines for additional event triggers:

```jsonl
{"type":"thought_added","timestamp":"...","payload":{"sessionId":"...","thoughtNumber":5}}
```

Useful as fallback when Observatory WebSocket is unavailable.

### LCD Display

Compact status information (if SysEx-accessible):

```
Line 1: [Stage X] Session: <title truncated>
Line 2: T:<thought_count> B:<branch_count> A:<agent_count>
```

If LCD is not SysEx-addressable, all visual feedback goes through pad colors and the Observatory web UI.

### Touch Strip LEDs

LED strip shows BPM zone (green/blue/red gradient) or confidence threshold level when in Shift mode.

---

## 12. Voice Integration

### Separation of Concerns

```
VOICE provides CONTENT  →  what to think about
PADS provide ROUTING    →  which operation, gateway, workspace
```

This separation enables 10x+ throughput: the performer speaks naturally while simultaneously routing with hands.

### Voice Buffer Architecture

```
┌─────────────┐     STT      ┌─────────────┐
│ Microphone   │─────────────►│ Voice Buffer │
│ (external)   │              │              │
└─────────────┘              │  content: "" │
                              │  ready: bool │
                              │  cipher: ""  │
                              └──────┬──────┘
                                     │
                              Pad press resolves
                              voice buffer into
                              operation args
```

### Workflow Example

```
1. Voice: "The API latency is caused by unindexed database queries"
2. Press Pad 9 (Bank 1) → arm cipher type "H" (Hypothesis)
3. Press Pad 1 (Bank 1) → Record Thought
4. Bridge dispatches:
   thoughtbox_gateway({
     operation: 'thought',
     args: {
       thought: "H|The API latency is caused by unindexed database queries",
       nextThoughtNeeded: true
     }
   })
5. Voice buffer cleared, cipher type cleared
```

### Voice Input Providers (External)

The bridge exposes a simple API for voice-to-text providers to push content:

```typescript
// HTTP endpoint on bridge
POST http://localhost:3333/voice
Content-Type: application/json
{ "text": "The API latency is caused by..." }

// Or Unix socket
// Or stdin pipe from STT process
```

Compatible with: Whisper, macOS Dictation, Talon Voice, any STT that can POST text.

---

## 13. Sequence Recording

### Recording Workflow

```
1. Press Record button → arm recording
2. Optionally start clock (Play) for quantized recording
3. Perform pad sequence (any banks, any timing)
4. Press Stop → recording saved to sequence buffer
5. Navigate to Bank 6 → press empty pad slot to save
```

### Sequence Data Format

```typescript
interface SequenceEvent {
  tick: number;              // Clock position (0-based from record start)
  bank: number;              // Which bank was active
  pad: number;               // Which pad (1-16)
  velocity: number;          // 0-127
  duration?: number;         // Ticks held (for sustained)
  aftertouch?: number[];     // Pressure curve (for sustained)
}

interface Sequence {
  id: string;
  name: string;              // User-assigned via voice
  events: SequenceEvent[];
  lengthTicks: number;       // Total sequence length
  bpmRecorded: number;       // BPM at recording time
  createdAt: string;
}
```

### Playback

Sequences replay at current BPM (time-stretched from recorded BPM). Each event re-triggers the pad's current mapping — so if pad mappings change (stage transition, bank reconfiguration), the sequence adapts.

---

## 14. BridgeConfig Schema

```typescript
// ─── Color Types ───

interface RGBColor {
  r: number;  // 0-127 (MIDI SysEx range)
  g: number;
  b: number;
}

type Animation = 'solid' | 'pulse' | 'flash';

// ─── Pad Mapping ───

interface DynamicColor {
  event: string;                         // Observatory event type
  condition?: string;                    // JS expression evaluated against payload
  color: RGBColor;
  animation: Animation;
}

interface PadMapping {
  bank: number;                          // 1-8
  pad: number;                           // 1-16
  label: string;                         // Human-readable name
  minimumStage: 0 | 1 | 2 | 3;
  gateway: 'thoughtbox_gateway' | 'thoughtbox_hub' | 'observability_gateway' | null;
  operation: string;                     // Gateway operation name
  subOperation?: string;                 // For operations with sub-ops
  args?: Record<string, any>;            // Static args
  argSources?: {                         // Dynamic arg resolution
    [argName: string]: 'fromVoice' | 'fromEncoder' | 'fromTouchStrip' | 'fromPressure' | 'dynamic';
  };
  color: RGBColor;
  colorWhen?: DynamicColor[];            // Dynamic color from Observatory events
  temporal: 'oneshot' | 'sustained' | 'loop';
  quantize: 'immediate' | 'beat' | 'bar' | '4bar';
  loopInterval?: number;                 // Beats between repeats (for loop temporal)
  shiftAction?: Partial<PadMapping>;     // Alternate action when Shift held
}

// ─── Function Button Mapping ───

interface FunctionButtonMapping {
  button: string;                        // Button identifier
  midiNote?: number;                     // MIDI note number
  midiCC?: number;                       // Or CC number
  action: string;                        // Internal action name
  shiftAction?: string;                  // Action when Shift held
}

// ─── Encoder Mapping ───

interface EncoderContext {
  context: string;                       // When this mapping is active
  cwAction: string;                      // Clockwise rotation
  ccwAction: string;                     // Counter-clockwise
  pushAction: string;                    // Push button
}

interface EncoderMapping {
  midiCC: number;                        // CC number for rotation
  pushNote: number;                      // Note number for push
  contexts: EncoderContext[];
}

// ─── Touch Strip Mapping ───

interface TouchStripMapping {
  midiCC: number;
  defaultMapping: {
    parameter: string;                   // 'bpm' | 'confidence' | etc.
    min: number;
    max: number;
  };
  shiftMapping: {
    parameter: string;
    min: number;
    max: number;
  };
}

// ─── Clock Config ───

interface ClockConfig {
  defaultBPM: number;                    // Default: 120
  minBPM: number;                        // Default: 60
  maxBPM: number;                        // Default: 240
  ppqn: 24;                              // Fixed at 24
  defaultQuantize: 'beat' | 'bar';       // Default: 'beat'
}

// ─── MCP Connection Config ───

interface MCPConfig {
  transport: 'stdio' | 'http';
  httpUrl?: string;                      // For HTTP transport
  command?: string;                      // For stdio transport
  args?: string[];                       // For stdio transport
}

// ─── Top-Level Config ───

interface BridgeConfig {
  version: string;                       // Config schema version
  clock: ClockConfig;
  mcp: {
    gateway: MCPConfig;
    hub: MCPConfig;
    observability: MCPConfig;
  };
  observatory: {
    url: string;                         // Default: 'ws://localhost:1729'
    reconnectInterval: number;           // ms, default: 5000
  };
  voice: {
    endpoint: string;                    // Default: 'http://localhost:3333/voice'
    timeout: number;                     // ms to wait for voice before dispatching without
  };
  midi: {
    inputDevice: string;                 // MIDI device name pattern (regex)
    outputDevice: string;
    sysexDeviceId: number;               // MPC Studio SysEx device ID
    calibrationFile: string;             // Path to calibration.json
  };
  pads: PadMapping[];
  functionButtons: FunctionButtonMapping[];
  encoder: EncoderMapping;
  touchStrip: TouchStripMapping;
  sequences: {
    storageDir: string;                  // Where to save recorded sequences
  };
}
```

---

## 15. Observatory WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('ws://localhost:1729');

ws.on('open', () => {
  // Subscribe to current session
  ws.send(JSON.stringify({
    type: 'subscribe',
    sessionId: currentSessionId
  }));
});
```

### Incoming Event Types

```typescript
type ObservatoryEvent =
  | { type: 'session_snapshot'; payload: SessionSnapshotPayload }
  | { type: 'thought_added'; payload: ThoughtAddedPayload }
  | { type: 'thought_revised'; payload: ThoughtRevisedPayload }
  | { type: 'thought_branched'; payload: ThoughtBranchedPayload }
  | { type: 'session_started'; payload: SessionStartedPayload }
  | { type: 'session_ended'; payload: SessionEndedPayload }
  | { type: 'error'; payload: ErrorPayload };
```

### Feedback Renderer Pipeline

```
Observatory Event
      │
      ▼
Parse event type
      │
      ▼
Match against pad colorWhen rules
      │
      ▼
Generate SysEx color commands
      │
      ▼
Queue with animation timing
      │
      ▼
Send via MIDI output
```

### Color Palette Constants

```typescript
const COLORS = {
  // Core operations
  THOUGHT_GREEN:    { r: 0,   g: 127, b: 0   },
  READ_TEAL:        { r: 0,   g: 100, b: 80  },
  BRANCH_YELLOW:    { r: 127, g: 127, b: 0   },
  REVISE_ORANGE:    { r: 127, g: 60,  b: 0   },
  CRITIQUE_RED:     { r: 127, g: 0,   b: 0   },

  // Hub
  PROBLEM_RED:      { r: 100, g: 10,  b: 10  },
  PROPOSAL_BLUE:    { r: 10,  g: 10,  b: 100 },
  CONSENSUS_GOLD:   { r: 127, g: 100, b: 0   },
  CHANNEL_CYAN:     { r: 0,   g: 100, b: 127 },

  // Mental Models
  MODEL_YELLOW:     { r: 127, g: 127, b: 20  },
  MODEL_BLUE:       { r: 20,  g: 50,  b: 127 },

  // System
  HEALTH_GREEN:     { r: 0,   g: 127, b: 20  },
  HEALTH_AMBER:     { r: 127, g: 80,  b: 0   },
  HEALTH_RED:       { r: 127, g: 0,   b: 0   },
  BOOT_CYAN:        { r: 0,   g: 80,  b: 127 },
  CIPHER_GOLD:      { r: 127, g: 100, b: 0   },
  PROMPT_PURPLE:    { r: 80,  g: 0,   b: 127 },
  MACRO_MAGENTA:    { r: 127, g: 0,   b: 80  },
  SESSION_WHITE:    { r: 60,  g: 60,  b: 60  },
  OFF:              { r: 0,   g: 0,   b: 0   },
} as const;
```

---

## 16. Implementation Roadmap

### Phase 1: Foundation (Get MIDI Flowing)

1. **Calibration utility** — Interactive mode: press each pad, button, encoder, touch strip → capture MIDI messages → write `calibration.json`
2. **MIDI I/O layer** — Open device, parse Note On/Off, CC, SysEx
3. **SysEx probe** — Find the pad RGB control command for your MPC Studio model
4. **Basic pad painting** — Set all 16 pads to a static color pattern

### Phase 2: MCP Connection

5. **MCP client pool** — Connect to Thoughtbox (start with stdio transport)
6. **Stage 0 boot** — `get_state` on startup, paint boot surface, `start_new` / `load_context`
7. **Stage transitions** — Wire `cipher` → Stage 2 surface repaint

### Phase 3: Core Instrument

8. **Clock engine** — Internal 24 PPQN clock, transport buttons
9. **Dispatch scheduler** — Quantized pad → operation dispatch
10. **Bank 1 Stage 2** — Thought Engine (Record Thought, Read, Branch, Revise, Critique)
11. **Voice buffer** — HTTP endpoint for STT, wire to `fromVoice` args

### Phase 4: Full Surface

12. **Bank 2** — Hub operations
13. **Bank 3** — Mental Models
14. **Bank 4-5** — Knowledge Graph, Notebook
15. **Cipher type markers** — Pads 9-16 arm cipher prefix

### Phase 5: Feedback Loop

16. **Observatory WebSocket** — Connect, subscribe, parse events
17. **Feedback renderer** — Event → pad color pipeline
18. **LCD updates** — If SysEx accessible
19. **Agent Dashboard (Bank 7)** — Dynamic agent status pads

### Phase 6: Performance Features

20. **Sequence recorder** — Capture and replay pad sequences
21. **Bank 6 macros** — Save/load/trigger sequences
22. **Touch strip BPM** — Continuous BPM control
23. **Encoder context-switching** — Scroll behaviors per active operation
24. **Chord detection** — Multi-pad batch dispatch

### Phase 7: Polish

25. **Shift actions** — Alternate pad behaviors
26. **Note Repeat loops** — Auto-dispatch at clock divisions
27. **Error handling** — Stage requirement errors → LCD feedback
28. **Hot-reload config** — Watch `default.json` for live remapping
29. **Bank 8 prompts** — Advanced cognitive patterns

---

## Appendix A: Thoughtbox Operation Reference

### thoughtbox_gateway Operations

| Operation | Stage | Sub-operations | Description |
|-----------|-------|---------------|-------------|
| `get_state` | 0 | — | Check current session state |
| `start_new` | 0 | — | Create new session (→ Stage 1) |
| `load_context` | 0 | — | Resume existing session (→ Stage 1) |
| `cipher` | 1 | — | Load protocol notation (→ Stage 2) |
| `session` | 1 | `list`, `get`, `search`, `resume`, `export`, `analyze`, `extract_learnings`, `discovery` | Session management |
| `deep_analysis` | 1 | — | `analysisType`: `patterns`, `cognitive_load`, `decision_points`, `full` |
| `thought` | 2 | — | Record reasoning step |
| `read_thoughts` | 2 | — | Retrieve past thoughts |
| `get_structure` | 2 | — | Graph topology |
| `notebook` | 2 | `create`, `add_cell`, `update_cell`, `run_cell`, `install_deps`, `export` | Code execution |
| `mental_models` | 2 | `get_model`, `list_models`, `list_tags` | Reasoning frameworks |
| `knowledge` | 2 | `create_pattern`, `find_patterns`, `link_session` | Knowledge graph |

### thoughtbox_hub Operations

| Operation | Description |
|-----------|-------------|
| `register` | Register agent identity |
| `whoami` | Check current identity |
| `create_workspace` | Create collaboration space |
| `join_workspace` | Join existing workspace |
| `list_workspaces` | List available workspaces |
| `workspace_status` | Current workspace state |
| `create_problem` | Define work item |
| `claim_problem` | Assign to self |
| `update_problem` | Change status/resolution |
| `list_problems` | List workspace problems |
| `create_proposal` | Submit solution branch |
| `review_proposal` | Review with verdict |
| `merge_proposal` | Accept and merge |
| `list_proposals` | List workspace proposals |
| `mark_consensus` | Create decision record |
| `endorse_consensus` | Co-sign decision |
| `list_consensus` | List decisions |
| `post_message` | Post to problem channel |
| `read_channel` | Read problem discussion |

### observability_gateway Operations

| Operation | Description |
|-----------|-------------|
| `health` | Service health check |
| `metrics` | PromQL instant query |
| `metrics_range` | PromQL range query |
| `sessions` | List active sessions |
| `session_info` | Detailed session info |
| `alerts` | Prometheus alert status |
| `dashboard_url` | Grafana dashboard URL |

---

## Appendix B: Mental Models Catalog

| # | Model ID | Title | Tags |
|---|----------|-------|------|
| 1 | `rubber-duck` | Rubber Duck Debugging | debugging |
| 2 | `five-whys` | Five Whys | debugging, problem-solving |
| 3 | `pre-mortem` | Pre-Mortem Analysis | planning, risk-management |
| 4 | `steelmanning` | Steelmanning | decision-making |
| 5 | `fermi-estimation` | Fermi Estimation | planning, analysis |
| 6 | `trade-off-matrix` | Trade-off Matrix | decision-making |
| 7 | `decomposition` | Problem Decomposition | planning, problem-solving |
| 8 | `inversion` | Inversion | decision-making, risk-management |
| 9 | `abstraction-laddering` | Abstraction Laddering | problem-solving, analysis |
| 10 | `constraint-relaxation` | Constraint Relaxation | problem-solving |
| 11 | `assumption-surfacing` | Assumption Surfacing | analysis |
| 12 | `adversarial-thinking` | Adversarial Thinking | risk-management |
| 13 | `time-horizon-shifting` | Time Horizon Shifting | planning, decision-making |
| 14 | `impact-effort-grid` | Impact-Effort Grid | planning, decision-making |
| 15 | `opportunity-cost` | Opportunity Cost | decision-making |

---

## Appendix C: Cipher Protocol Quick Reference

### Type Markers

| Marker | Meaning | Pad (Bank 1) |
|--------|---------|-------------|
| `H` | Hypothesis | 9 |
| `E` | Evidence | 10 |
| `C` | Conclusion | 11 |
| `Q` | Question | 12 |
| `R` | Revision | 13 |
| `P` | Plan | 14 |
| `O` | Observation | 15 |
| `A` | Assumption | 16 |

### Format

```
{thought_number}|{type}|{references}|{content}
```

### Logical Operators

| Symbol | Meaning |
|--------|---------|
| `→` | implies / leads to |
| `←` | derived from |
| `∴` | therefore |
| `∵` | because |
| `∧` | and |
| `∨` | or |
| `¬` | not |
| `⊕` | supports |
| `⊖` | contradicts |

### Reference Syntax

| Pattern | Meaning |
|---------|---------|
| `[SN]` | Reference to thought N |
| `^[SN]` | Revision of thought N |
| `S1,S2` | Multiple references |

---

*End of specification. Build sequence: Phase 1 → 7. Start with `calibrate.ts`.*