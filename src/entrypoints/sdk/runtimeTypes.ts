// Stub file for missing runtime types
// These types are used by the SDK but the implementation is not available in this build

import type { z } from 'zod/v4'
import type { SDKMessage, SDKResultMessage, SDKUserMessage } from './coreTypes.js'

// Zod utility types
export type AnyZodRawShape = z.ZodRawShape
export type InferShape<T extends AnyZodRawShape> = z.infer<z.ZodObject<T>>

// Session types
export interface SDKSessionOptions {
  model?: string
  systemPrompt?: string
  maxTurns?: number
  maxThinkingTokens?: number
  permissionMode?: string
  cwd?: string
  [key: string]: unknown
}

export interface SDKSession {
  id: string
  send(message: string | SDKUserMessage): Promise<SDKResultMessage>
  abort(): void
  close(): Promise<void>
  messages(): AsyncIterable<SDKMessage>
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | unknown[]
  uuid?: string
  parentUuid?: string
  timestamp?: number
}

// Query types
export interface Options extends SDKSessionOptions {}
export interface InternalOptions extends Options {
  _internal?: boolean
}

export interface Query {
  [Symbol.asyncIterator](): AsyncIterator<SDKMessage>
  abort(): void
  result: Promise<SDKResultMessage>
}

export interface InternalQuery extends Query {}

// Session management types
export interface ListSessionsOptions {
  dir?: string
  limit?: number
  offset?: number
}

export interface GetSessionInfoOptions {
  dir?: string
}

export interface GetSessionMessagesOptions {
  dir?: string
  limit?: number
  offset?: number
  includeSystemMessages?: boolean
}

export interface SessionMutationOptions {
  dir?: string
}

export interface ForkSessionOptions extends SessionMutationOptions {
  upToMessageId?: string
  title?: string
}

export interface ForkSessionResult {
  sessionId: string
}

// MCP types
export interface McpSdkServerConfigWithInstance {
  type: 'sdk'
  name: string
  instance: unknown
}

export interface SdkMcpToolDefinition<Schema extends AnyZodRawShape = AnyZodRawShape> {
  name: string
  description: string
  inputSchema: Schema
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<unknown>
}

// Effort level type
export type EffortLevel = 'low' | 'medium' | 'high'
