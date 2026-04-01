// Stub for @anthropic-ai/sandbox-runtime
// This package is internal to Anthropic and not publicly available

import { z } from 'zod/v4'

// Type exports
export interface FsReadRestrictionConfig {
  allow?: string[]
  deny?: string[]
}

export interface FsWriteRestrictionConfig {
  allow?: string[]
  deny?: string[]
}

export interface IgnoreViolationsConfig {
  fs_read?: boolean
  fs_write?: boolean
  network?: boolean
}

export interface NetworkHostPattern {
  host: string
  ports?: number[]
}

export interface NetworkRestrictionConfig {
  allow?: NetworkHostPattern[]
  deny?: NetworkHostPattern[]
}

export type SandboxAskCallback = (
  question: string,
  options?: { timeout?: number }
) => Promise<boolean>

export interface SandboxDependencyCheck {
  name: string
  check: () => Promise<boolean>
  install?: () => Promise<void>
}

export interface SandboxRuntimeConfig {
  fs_read?: FsReadRestrictionConfig
  fs_write?: FsWriteRestrictionConfig
  network?: NetworkRestrictionConfig
  ignore_violations?: IgnoreViolationsConfig
}

export interface SandboxViolationEvent {
  type: 'fs_read' | 'fs_write' | 'network'
  path?: string
  host?: string
  port?: number
  timestamp: number
}

// Schema export
export const SandboxRuntimeConfigSchema = z.object({
  fs_read: z.object({
    allow: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional(),
  }).optional(),
  fs_write: z.object({
    allow: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional(),
  }).optional(),
  network: z.object({
    allow: z.array(z.object({
      host: z.string(),
      ports: z.array(z.number()).optional(),
    })).optional(),
    deny: z.array(z.object({
      host: z.string(),
      ports: z.array(z.number()).optional(),
    })).optional(),
  }).optional(),
  ignore_violations: z.object({
    fs_read: z.boolean().optional(),
    fs_write: z.boolean().optional(),
    network: z.boolean().optional(),
  }).optional(),
})

// Class exports (stubs)
export class SandboxManager {
  constructor(_config?: SandboxRuntimeConfig) {}

  async start(): Promise<void> {
    // Stub - sandbox not available in external builds
  }

  async stop(): Promise<void> {
    // Stub
  }

  isRunning(): boolean {
    return false
  }

  getConfig(): SandboxRuntimeConfig | undefined {
    return undefined
  }

  setConfig(_config: SandboxRuntimeConfig): void {
    // Stub
  }
}

export class SandboxViolationStore {
  private violations: SandboxViolationEvent[] = []

  add(event: SandboxViolationEvent): void {
    this.violations.push(event)
  }

  getAll(): SandboxViolationEvent[] {
    return [...this.violations]
  }

  clear(): void {
    this.violations = []
  }
}
