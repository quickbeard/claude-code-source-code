// Stub for color-diff-napi native module
// This module is not available in external builds

export function diff(_c1: unknown, _c2: unknown): { r: number; g: number; b: number } {
  return { r: 0, g: 0, b: 0 }
}

// Stub classes for syntax highlighting
export class ColorDiff {
  constructor(_options?: unknown) {}
  diff(_oldText: string, _newText: string): unknown[] {
    return []
  }
}

export class ColorFile {
  constructor(_options?: unknown) {}
  highlight(_text: string, _language?: string): string {
    return _text
  }
}

export interface SyntaxTheme {
  name: string
  colors: Record<string, string>
}

export function getSyntaxTheme(_name?: string): SyntaxTheme {
  return {
    name: 'default',
    colors: {},
  }
}

export default { diff, ColorDiff, ColorFile, getSyntaxTheme }
