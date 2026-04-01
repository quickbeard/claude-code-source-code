# Claude Code Local Build - Missing Features

This document lists the features that are missing or disabled in the locally built version compared to the commercial version of Claude Code.

## 1. Internal Tools & Commands

| Feature                                                    | Status   | Reason                             |
| ---------------------------------------------------------- | -------- | ---------------------------------- |
| Daemon mode (`claude daemon`)                              | Disabled | `src/daemon/` directory missing    |
| Background sessions (`claude ps/logs/attach/kill`, `--bg`) | Disabled | `src/cli/bg.js` missing            |
| Proactive features                                         | Disabled | `src/proactive/` directory missing |
| Environment runner (`claude environment-runner`)           | Disabled | `src/environment-runner/` missing  |
| Self-hosted runner                                         | Disabled | `src/self-hosted-runner/` missing  |
| Background jobs/classifier                                 | Disabled | `src/jobs/` directory missing      |
| Workflow scripts                                           | Disabled | `src/tools/WorkflowTool/` stubbed  |
| Assistant mode                                             | Disabled | `src/assistant/` likely missing    |

## 2. Computer Use (macOS)

| Feature                | Status   | Reason                            |
| ---------------------- | -------- | --------------------------------- |
| Screen capture         | Disabled | `@ant/computer-use-mcp` stubbed   |
| Mouse/keyboard control | Disabled | `@ant/computer-use-input` stubbed |
| Swift integration      | Disabled | `@ant/computer-use-swift` stubbed |
| TCC permissions        | Disabled | Native code missing               |

## 3. Browser Integration

| Feature            | Status   | Reason                               |
| ------------------ | -------- | ------------------------------------ |
| Claude in Chrome   | Disabled | `@ant/claude-for-chrome-mcp` stubbed |
| Browser automation | Disabled | MCP server stubbed                   |

## 4. Sandbox/Security

| Feature           | Status   | Reason                                  |
| ----------------- | -------- | --------------------------------------- |
| Sandbox runtime   | Stubbed  | `@anthropic-ai/sandbox-runtime` stubbed |
| Process isolation | Disabled | Native code missing                     |
| Syscall filtering | Disabled | Native code missing                     |

## 5. Native Modules

| Module                 | Status   | Impact                                |
| ---------------------- | -------- | ------------------------------------- |
| `color-diff-napi`      | Stubbed  | Syntax highlighting in diffs degraded |
| `modifiers-napi`       | Stubbed  | Modifier key detection disabled       |
| `audio-capture-napi`   | Stubbed  | Voice mode unavailable                |
| `image-processor-napi` | External | Image processing may fail             |

## 6. Cloud/Enterprise Features

| Feature               | Status            | Reason                                  |
| --------------------- | ----------------- | --------------------------------------- |
| Bridge/Remote Control | Partially working | Code exists but may have issues         |
| Bedrock SDK           | External          | `@anthropic-ai/bedrock-sdk` not bundled |
| Vertex SDK            | External          | `@anthropic-ai/vertex-sdk` not bundled  |
| Foundry SDK           | External          | `@anthropic-ai/foundry-sdk` not bundled |
| Azure identity        | External          | May fail at runtime                     |

## 7. Internal-Only Tools

| Tool                      | Status  |
| ------------------------- | ------- |
| `PushNotificationTool`    | Missing |
| `SubscribePRTool`         | Missing |
| `VerifyPlanExecutionTool` | Missing |
| `OverflowTestTool`        | Missing |
| `CtxInspectTool`          | Missing |
| `SnipTool`                | Missing |

## 8. Skills/Plugins

| Feature             | Status                                      |
| ------------------- | ------------------------------------------- |
| MCP Skills          | Stubbed (`src/skills/mcpSkills.js` missing) |
| Some bundled skills | May have missing content                    |

## 9. Telemetry/Analytics

| Feature                          | Status              |
| -------------------------------- | ------------------- |
| OTLP exporters (gRPC/HTTP/Proto) | External - may fail |
| Prometheus exporter              | External            |
| Full telemetry                   | Partially working   |

---

## What Should Work

- Basic interactive REPL
- File read/write/edit tools
- Bash/shell execution
- Grep/Glob search
- Git operations
- MCP server connections (stdio/SSE/HTTP)
- Basic agent/subagent functionality
- Task management tools
- Web fetch/search (if API available)
- Most UI components

---

## Summary

**~70-80% of core functionality** should work for typical coding tasks. The missing features are primarily:

- Enterprise/cloud integrations
- macOS-specific native features (computer use, voice)
- Internal Anthropic tooling
- Advanced orchestration (daemon, background jobs)
