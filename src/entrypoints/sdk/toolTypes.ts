// Stub file for tool types
// @internal - These types are for SDK tool definitions

import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'

/**
 * Base tool definition interface
 * @internal
 */
export interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/**
 * Tool execution context
 * @internal
 */
export interface ToolContext {
  sessionId?: string
  cwd?: string
  signal?: AbortSignal
}

/**
 * Tool execution result
 * @internal
 */
export type ToolResult = CallToolResult

/**
 * Tool annotations for MCP tools
 * @internal
 */
export type { ToolAnnotations }
