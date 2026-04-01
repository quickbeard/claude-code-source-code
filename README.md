<div align="center">

# Claude Code Source Code

</div>

---

## Table of Contents

- [How It Leaked](#how-it-leaked)
- [Intro](#intro)
- [Documentation](#-documentation)
- [Missing Modules](#missing-modules)
- [Directory Structure](#directory-structure)
- [Architecture](#architecture)
  - [Tool System](#1-tool-system)
  - [Command System](#2-command-system)
  - [Service Layer](#3-service-layer)
  - [Bridge System](#4-bridge-system)
  - [Permission System](#5-permission-system)
  - [Feature Flags](#6-feature-flags)
- [Key Files](#key-files)
- [Tech Stack](#tech-stack)
- [Design Patterns](#design-patterns)
- [GitPretty Setup](#gitpretty-setup)
- [Disclaimer](#disclaimer)

---

## How It Leaked

[Chaofan Shou (@Fried_rice)](https://x.com/Fried_rice) discovered that the published npm package for Claude Code included a `.map` file referencing the full, unobfuscated TypeScript source — downloadable as a zip from Anthropic's R2 storage bucket.

> **"Claude code source code has been leaked via a map file in their npm registry!"**
>
> — [@Fried_rice, March 31, 2026](https://x.com/Fried_rice/status/2038894956459290963)

---

## Intro

Claude Code is Anthropic's official CLI tool for interacting with Claude directly from the terminal: editing files, running commands, searching codebases, managing git workflows, and more.

|                 |                                                                         |
| --------------- | ----------------------------------------------------------------------- |
| **Leaked**      | 2026-03-31                                                              |
| **Language**    | TypeScript (strict)                                                     |
| **Runtime**     | [Bun](https://bun.sh)                                                   |
| **Terminal UI** | [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) |
| **Scale**       | ~1,900 files · 512,000+ lines of code                                   |

---

## Missing Modules

> **This source is incomplete.** 108 modules referenced by `feature()`-gated branches are **not included** in the npm package.
> They exist only in Anthropic's internal monorepo and were dead-code-eliminated at compile time.
> They **cannot** be recovered from `cli.js`, `sdk-tools.d.ts`, or any published artifact.

### Anthropic Internal Code (~70 modules, never published)

These modules have no source files anywhere in the npm package. They are internal Anthropic infrastructure.

<details>
<summary>Click to expand full list</summary>

| Module                                            | Purpose                                 | Feature Gate                |
| ------------------------------------------------- | --------------------------------------- | --------------------------- |
| `daemon/main.js`                                  | Background daemon supervisor            | `DAEMON`                    |
| `daemon/workerRegistry.js`                        | Daemon worker registry                  | `DAEMON`                    |
| `proactive/index.js`                              | Proactive notification system           | `PROACTIVE`                 |
| `contextCollapse/index.js`                        | Context collapse service (experimental) | `CONTEXT_COLLAPSE`          |
| `contextCollapse/operations.js`                   | Collapse operations                     | `CONTEXT_COLLAPSE`          |
| `contextCollapse/persist.js`                      | Collapse persistence                    | `CONTEXT_COLLAPSE`          |
| `skillSearch/featureCheck.js`                     | Remote skill feature check              | `EXPERIMENTAL_SKILL_SEARCH` |
| `skillSearch/remoteSkillLoader.js`                | Remote skill loader                     | `EXPERIMENTAL_SKILL_SEARCH` |
| `skillSearch/remoteSkillState.js`                 | Remote skill state                      | `EXPERIMENTAL_SKILL_SEARCH` |
| `skillSearch/telemetry.js`                        | Skill search telemetry                  | `EXPERIMENTAL_SKILL_SEARCH` |
| `skillSearch/localSearch.js`                      | Local skill search                      | `EXPERIMENTAL_SKILL_SEARCH` |
| `skillSearch/prefetch.js`                         | Skill prefetch                          | `EXPERIMENTAL_SKILL_SEARCH` |
| `coordinator/workerAgent.js`                      | Multi-agent coordinator worker          | `COORDINATOR_MODE`          |
| `bridge/peerSessions.js`                          | Bridge peer session management          | `BRIDGE_MODE`               |
| `assistant/index.js`                              | Kairos assistant mode                   | `KAIROS`                    |
| `assistant/AssistantSessionChooser.js`            | Assistant session picker                | `KAIROS`                    |
| `compact/reactiveCompact.js`                      | Reactive context compaction             | `CACHED_MICROCOMPACT`       |
| `compact/snipCompact.js`                          | Snip-based compaction                   | `HISTORY_SNIP`              |
| `compact/snipProjection.js`                       | Snip projection                         | `HISTORY_SNIP`              |
| `compact/cachedMCConfig.js`                       | Cached micro-compact config             | `CACHED_MICROCOMPACT`       |
| `sessionTranscript/sessionTranscript.js`          | Session transcript service              | `TRANSCRIPT_CLASSIFIER`     |
| `commands/agents-platform/index.js`               | Internal agents platform                | `ant` (internal)            |
| `commands/assistant/index.js`                     | Assistant command                       | `KAIROS`                    |
| `commands/buddy/index.js`                         | Buddy system notifications              | `BUDDY`                     |
| `commands/fork/index.js`                          | Fork subagent command                   | `FORK_SUBAGENT`             |
| `commands/peers/index.js`                         | Multi-peer commands                     | `BRIDGE_MODE`               |
| `commands/proactive.js`                           | Proactive command                       | `PROACTIVE`                 |
| `commands/remoteControlServer/index.js`           | Remote control server                   | `DAEMON` + `BRIDGE_MODE`    |
| `commands/subscribe-pr.js`                        | GitHub PR subscription                  | `KAIROS_GITHUB_WEBHOOKS`    |
| `commands/torch.js`                               | Internal debug tool                     | `TORCH`                     |
| `commands/workflows/index.js`                     | Workflow commands                       | `WORKFLOW_SCRIPTS`          |
| `jobs/classifier.js`                              | Internal job classifier                 | `TEMPLATES`                 |
| `memdir/memoryShapeTelemetry.js`                  | Memory shape telemetry                  | `MEMORY_SHAPE_TELEMETRY`    |
| `services/sessionTranscript/sessionTranscript.js` | Session transcript                      | `TRANSCRIPT_CLASSIFIER`     |
| `tasks/LocalWorkflowTask/LocalWorkflowTask.js`    | Local workflow task                     | `WORKFLOW_SCRIPTS`          |
| `protectedNamespace.js`                           | Internal namespace guard                | `ant` (internal)            |
| `protectedNamespace.js` (envUtils)                | Protected namespace runtime             | `ant` (internal)            |
| `coreTypes.generated.js`                          | Generated core types                    | `ant` (internal)            |
| `devtools.js`                                     | Internal dev tools                      | `ant` (internal)            |
| `attributionHooks.js`                             | Internal attribution hooks              | `COMMIT_ATTRIBUTION`        |
| `systemThemeWatcher.js`                           | System theme watcher                    | `AUTO_THEME`                |
| `udsClient.js` / `udsMessaging.js`                | UDS messaging client                    | `UDS_INBOX`                 |
| `systemThemeWatcher.js`                           | Theme watcher                           | `AUTO_THEME`                |

</details>

### Feature-Gated Tools (~20 modules, DCE'd from bundle)

These tools have type signatures in `sdk-tools.d.ts` but their implementations were stripped at compile time.

<details>
<summary>Click to expand full list</summary>

| Tool                      | Purpose                       | Feature Gate                |
| ------------------------- | ----------------------------- | --------------------------- |
| `REPLTool`                | Interactive REPL (VM sandbox) | `ant` (internal)            |
| `SnipTool`                | Context snipping              | `HISTORY_SNIP`              |
| `SleepTool`               | Sleep/delay in agent loop     | `PROACTIVE` / `KAIROS`      |
| `MonitorTool`             | MCP monitoring                | `MONITOR_TOOL`              |
| `OverflowTestTool`        | Overflow testing              | `OVERFLOW_TEST_TOOL`        |
| `WorkflowTool`            | Workflow execution            | `WORKFLOW_SCRIPTS`          |
| `WebBrowserTool`          | Browser automation            | `WEB_BROWSER_TOOL`          |
| `TerminalCaptureTool`     | Terminal capture              | `TERMINAL_PANEL`            |
| `TungstenTool`            | Internal perf monitoring      | `ant` (internal)            |
| `VerifyPlanExecutionTool` | Plan verification             | `CLAUDE_CODE_VERIFY_PLAN`   |
| `SendUserFileTool`        | Send files to users           | `KAIROS`                    |
| `SubscribePRTool`         | GitHub PR subscription        | `KAIROS_GITHUB_WEBHOOKS`    |
| `SuggestBackgroundPRTool` | Suggest background PRs        | `KAIROS`                    |
| `PushNotificationTool`    | Push notifications            | `KAIROS`                    |
| `CtxInspectTool`          | Context inspection            | `CONTEXT_COLLAPSE`          |
| `ListPeersTool`           | List active peers             | `UDS_INBOX`                 |
| `DiscoverSkillsTool`      | Skill discovery               | `EXPERIMENTAL_SKILL_SEARCH` |

</details>

### Text/Prompt Assets (~6 files)

These are internal prompt templates and documentation, never published.

<details>
<summary>Click to expand</summary>

| File                                                  | Purpose                                |
| ----------------------------------------------------- | -------------------------------------- |
| `yolo-classifier-prompts/auto_mode_system_prompt.txt` | Auto-mode system prompt for classifier |
| `yolo-classifier-prompts/permissions_anthropic.txt`   | Anthropic-internal permission prompt   |
| `yolo-classifier-prompts/permissions_external.txt`    | External user permission prompt        |
| `verify/SKILL.md`                                     | Verification skill documentation       |
| `verify/examples/cli.md`                              | CLI verification examples              |
| `verify/examples/server.md`                           | Server verification examples           |

</details>

### Why They're Missing

```
  Anthropic Internal Monorepo              Published npm Package
  ──────────────────────────               ─────────────────────
  feature('DAEMON') → true    ──build──→   feature('DAEMON') → false
  ↓                                         ↓
  daemon/main.js  ← INCLUDED    ──bundle─→  daemon/main.js  ← DELETED (DCE)
  tools/REPLTool  ← INCLUDED    ──bundle─→  tools/REPLTool  ← DELETED (DCE)
  proactive/      ← INCLUDED    ──bundle─→  (referenced but absent from src/)
```

Bun's `feature()` is a **compile-time intrinsic**:

- Returns `true` in Anthropic's internal build → code is kept in the bundle
- Returns `false` in the published build → code is dead-code-eliminated
- The 108 modules simply do not exist anywhere in the published artifact

---

## Documentation

For in-depth guides, see the [`docs/`](docs/) directory:

| Guide                                              | Description                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| **[Architecture](docs/architecture.md)**           | Core pipeline, startup sequence, state management, rendering, data flow         |
| **[Tools Reference](docs/tools.md)**               | Complete catalog of all ~40 agent tools with categories and permission model    |
| **[Commands Reference](docs/commands.md)**         | All ~85 slash commands organized by category                                    |
| **[Subsystems Guide](docs/subsystems.md)**         | Deep dives into Bridge, MCP, Permissions, Plugins, Skills, Tasks, Memory, Voice |
| **[Exploration Guide](docs/exploration-guide.md)** | How to navigate the codebase — study paths, grep patterns, key files            |

Also see: [CONTRIBUTING.md](CONTRIBUTING.md) · [MCP Server README](mcp-server/README.md)

---

## Directory Structure

```
src/
├── main.tsx                 # Entrypoint — Commander.js CLI parser + React/Ink renderer
├── QueryEngine.ts           # Core LLM API caller (~46K lines)
├── Tool.ts                  # Tool type definitions (~29K lines)
├── commands.ts              # Command registry (~25K lines)
├── tools.ts                 # Tool registry
├── context.ts               # System/user context collection
├── cost-tracker.ts          # Token cost tracking
│
├── tools/                   # Agent tool implementations (~40)
├── commands/                # Slash command implementations (~50)
├── components/              # Ink UI components (~140)
├── services/                # External service integrations
├── hooks/                   # React hooks (incl. permission checks)
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
├── screens/                 # Full-screen UIs (Doctor, REPL, Resume)
│
├── bridge/                  # IDE integration (VS Code, JetBrains)
├── coordinator/             # Multi-agent orchestration
├── plugins/                 # Plugin system
├── skills/                  # Skill system
├── server/                  # Server mode
├── remote/                  # Remote sessions
├── memdir/                  # Persistent memory directory
├── tasks/                   # Task management
├── state/                   # State management
│
├── voice/                   # Voice input
├── vim/                     # Vim mode
├── keybindings/             # Keybinding configuration
├── schemas/                 # Config schemas (Zod)
├── migrations/              # Config migrations
├── entrypoints/             # Initialization logic
├── query/                   # Query pipeline
├── ink/                     # Ink renderer wrapper
├── buddy/                   # Companion sprite (Easter egg 🐣)
├── native-ts/               # Native TypeScript utils
├── outputStyles/            # Output styling
└── upstreamproxy/           # Proxy configuration
```

---

## Architecture

### 1. Tool System

> `src/tools/` — Every tool Claude can invoke is a self-contained module with its own input schema, permission model, and execution logic.

| Tool                                     | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| **File I/O**                             |                                           |
| `FileReadTool`                           | Read files (images, PDFs, notebooks)      |
| `FileWriteTool`                          | Create / overwrite files                  |
| `FileEditTool`                           | Partial modification (string replacement) |
| `NotebookEditTool`                       | Jupyter notebook editing                  |
| **Search**                               |                                           |
| `GlobTool`                               | File pattern matching                     |
| `GrepTool`                               | ripgrep-based content search              |
| `WebSearchTool`                          | Web search                                |
| `WebFetchTool`                           | Fetch URL content                         |
| **Execution**                            |                                           |
| `BashTool`                               | Shell command execution                   |
| `SkillTool`                              | Skill execution                           |
| `MCPTool`                                | MCP server tool invocation                |
| `LSPTool`                                | Language Server Protocol integration      |
| **Agents & Teams**                       |                                           |
| `AgentTool`                              | Sub-agent spawning                        |
| `SendMessageTool`                        | Inter-agent messaging                     |
| `TeamCreateTool` / `TeamDeleteTool`      | Team management                           |
| `TaskCreateTool` / `TaskUpdateTool`      | Task management                           |
| **Mode & State**                         |                                           |
| `EnterPlanModeTool` / `ExitPlanModeTool` | Plan mode toggle                          |
| `EnterWorktreeTool` / `ExitWorktreeTool` | Git worktree isolation                    |
| `ToolSearchTool`                         | Deferred tool discovery                   |
| `SleepTool`                              | Proactive mode wait                       |
| `CronCreateTool`                         | Scheduled triggers                        |
| `RemoteTriggerTool`                      | Remote trigger                            |
| `SyntheticOutputTool`                    | Structured output generation              |

### 2. Command System

> `src/commands/` — User-facing slash commands invoked with `/` in the REPL.

| Command              | Description             |     | Command   | Description       |
| -------------------- | ----------------------- | --- | --------- | ----------------- |
| `/commit`            | Git commit              |     | `/memory` | Persistent memory |
| `/review`            | Code review             |     | `/skills` | Skill management  |
| `/compact`           | Context compression     |     | `/tasks`  | Task management   |
| `/mcp`               | MCP server management   |     | `/vim`    | Vim mode toggle   |
| `/config`            | Settings                |     | `/diff`   | View changes      |
| `/doctor`            | Environment diagnostics |     | `/cost`   | Check usage cost  |
| `/login` / `/logout` | Auth                    |     | `/theme`  | Change theme      |
| `/context`           | Context visualization   |     | `/share`  | Share session     |
| `/pr_comments`       | PR comments             |     | `/resume` | Restore session   |
| `/desktop`           | Desktop handoff         |     | `/mobile` | Mobile handoff    |

### 3. Service Layer

> `src/services/` — External integrations and core infrastructure.

| Service                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `api/`                   | Anthropic API client, file API, bootstrap      |
| `mcp/`                   | Model Context Protocol connection & management |
| `oauth/`                 | OAuth 2.0 authentication                       |
| `lsp/`                   | Language Server Protocol manager               |
| `analytics/`             | GrowthBook feature flags & analytics           |
| `plugins/`               | Plugin loader                                  |
| `compact/`               | Conversation context compression               |
| `extractMemories/`       | Automatic memory extraction                    |
| `teamMemorySync/`        | Team memory synchronization                    |
| `tokenEstimation.ts`     | Token count estimation                         |
| `policyLimits/`          | Organization policy limits                     |
| `remoteManagedSettings/` | Remote managed settings                        |

### 4. Bridge System

> `src/bridge/` — Bidirectional communication layer connecting IDE extensions (VS Code, JetBrains) with the CLI.

Key files: `bridgeMain.ts` (main loop) · `bridgeMessaging.ts` (protocol) · `bridgePermissionCallbacks.ts` (permission callbacks) · `replBridge.ts` (REPL session) · `jwtUtils.ts` (JWT auth) · `sessionRunner.ts` (session execution)

### 5. Permission System

> `src/hooks/toolPermission/` — Checks permissions on every tool invocation.

Prompts the user for approval/denial or auto-resolves based on the configured permission mode: `default`, `plan`, `bypassPermissions`, `auto`, etc.

### 6. Feature Flags

Dead code elimination at build time via Bun's `bun:bundle`:

```typescript
import { feature } from "bun:bundle";

const voiceCommand = feature("VOICE_MODE")
  ? require("./commands/voice/index.js").default
  : null;
```

Notable flags: `PROACTIVE` · `KAIROS` · `BRIDGE_MODE` · `DAEMON` · `VOICE_MODE` · `AGENT_TRIGGERS` · `MONITOR_TOOL`

---

## Key Files

| File             | Lines | Purpose                                                                                |
| ---------------- | ----: | -------------------------------------------------------------------------------------- |
| `QueryEngine.ts` |  ~46K | Core LLM API engine — streaming, tool loops, thinking mode, retries, token counting    |
| `Tool.ts`        |  ~29K | Base types/interfaces for all tools — input schemas, permissions, progress state       |
| `commands.ts`    |  ~25K | Command registration & execution with conditional per-environment imports              |
| `main.tsx`       |     — | CLI parser + React/Ink renderer; parallelizes MDM, keychain, and GrowthBook on startup |

---

## Tech Stack

| Category          | Technology                                                              |
| ----------------- | ----------------------------------------------------------------------- |
| Runtime           | [Bun](https://bun.sh)                                                   |
| Language          | TypeScript (strict)                                                     |
| Terminal UI       | [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) |
| CLI Parsing       | [Commander.js](https://github.com/tj/commander.js) (extra-typings)      |
| Schema Validation | [Zod v4](https://zod.dev)                                               |
| Code Search       | [ripgrep](https://github.com/BurntSushi/ripgrep) (via GrepTool)         |
| Protocols         | [MCP SDK](https://modelcontextprotocol.io) · LSP                        |
| API               | [Anthropic SDK](https://docs.anthropic.com)                             |
| Telemetry         | OpenTelemetry + gRPC                                                    |
| Feature Flags     | GrowthBook                                                              |
| Auth              | OAuth 2.0 · JWT · macOS Keychain                                        |

---

## Design Patterns

<details>
<summary><strong>Parallel Prefetch</strong> — Startup optimization</summary>

MDM settings, keychain reads, and API preconnect fire in parallel as side-effects before heavy module evaluation:

```typescript
// main.tsx
startMdmRawRead();
startKeychainPrefetch();
```

</details>

<details>
<summary><strong>Lazy Loading</strong> — Deferred heavy modules</summary>

OpenTelemetry (~400KB) and gRPC (~700KB) are loaded via dynamic `import()` only when needed.

</details>

<details>
<summary><strong>Agent Swarms</strong> — Multi-agent orchestration</summary>

Sub-agents spawn via `AgentTool`, with `coordinator/` handling orchestration. `TeamCreateTool` enables team-level parallel work.

</details>

<details>
<summary><strong>Skill System</strong> — Reusable workflows</summary>

Defined in `skills/` and executed through `SkillTool`. Users can add custom skills.

</details>

<details>
<summary><strong>Plugin Architecture</strong> — Extensibility</summary>

Built-in and third-party plugins loaded through the `plugins/` subsystem.

</details>

---

## GitPretty Setup

<details>
<summary>Show per-file emoji commit messages in GitHub's file UI</summary>

```bash
# Apply emoji commits
bash ./gitpretty-apply.sh .

# Optional: install hooks for future commits
bash ./gitpretty-apply.sh . --hooks

# Push as usual
git push origin main
```

</details>

---

## Disclaimer

This repository archives a source code reportedly exposed via Anthropic's npm distribution on **2026-03-31**. The original Claude Code source remains the property of [Anthropic](https://www.anthropic.com), this is not an official release, and no rights to Anthropic's original code are granted by this repository. If you choose to use or redistribute any of the archived material, you are responsible for assessing the legal implications yourself.
