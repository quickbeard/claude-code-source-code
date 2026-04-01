// scripts/build-bundle.ts
// Usage: bun scripts/build-bundle.ts [--watch] [--minify] [--no-sourcemap]
//
// Production build: bun scripts/build-bundle.ts --minify
// Dev build:        bun scripts/build-bundle.ts
// Watch mode:       bun scripts/build-bundle.ts --watch

import * as esbuild from 'esbuild'
import { resolve, dirname } from 'path'
import { chmodSync, readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

// Bun: import.meta.dir — Node 21+: import.meta.dirname — fallback
const __dir: string =
  (import.meta as any).dir ??
  (import.meta as any).dirname ??
  dirname(fileURLToPath(import.meta.url))

const ROOT = resolve(__dir, '..')
const watch = process.argv.includes('--watch')
const minify = process.argv.includes('--minify')
const noSourcemap = process.argv.includes('--no-sourcemap')

// Read version from package.json for MACRO injection
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
const version = pkg.version || '0.0.0-dev'

// ── Plugin: resolve bare 'src/' imports (tsconfig baseUrl: ".") ──
// The codebase uses `import ... from 'src/foo/bar.js'` which relies on
// TypeScript's baseUrl resolution. This plugin maps those to real TS files.
const srcResolverPlugin: esbuild.Plugin = {
  name: 'src-resolver',
  setup(build) {
    build.onResolve({ filter: /^src\// }, (args) => {
      const basePath = resolve(ROOT, args.path)

      // Already exists as-is
      if (existsSync(basePath)) {
        return { path: basePath }
      }

      // Strip .js/.jsx and try TypeScript extensions
      const withoutExt = basePath.replace(/\.(js|jsx)$/, '')
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const candidate = withoutExt + ext
        if (existsSync(candidate)) {
          return { path: candidate }
        }
      }

      // Try as directory with index file
      const dirPath = basePath.replace(/\.(js|jsx)$/, '')
      for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
        const candidate = resolve(dirPath, 'index' + ext)
        if (existsSync(candidate)) {
          return { path: candidate }
        }
      }

      // Let esbuild handle it (will error if truly missing)
      return undefined
    })
  },
}

// ── Plugin: stub @ant/* internal packages ──
// These packages are Anthropic-internal and not available externally.
const antPackagesPlugin: esbuild.Plugin = {
  name: 'ant-packages-stub',
  setup(build) {
    // Match all @ant/* imports
    build.onResolve({ filter: /^@ant\// }, (args) => {
      return { path: args.path, namespace: 'ant-stub' }
    })

    // Return empty stub module for all @ant/* imports
    build.onLoad({ filter: /.*/, namespace: 'ant-stub' }, (args) => {
      return {
        contents: `
          // Stub for internal package: ${args.path}
          // This package is not available in external builds
          export default undefined;

          // claude-for-chrome-mcp exports
          export const BROWSER_TOOLS = [];
          export const createClaudeForChromeMcpServer = () => { throw new Error('Not available') };

          // computer-use-mcp exports
          export const buildComputerUseTools = () => [];
          export const bindSessionContext = () => ({});
          export const createComputerUseMcpServer = () => { throw new Error('Not available') };
          export const DEFAULT_GRANT_FLAGS = {};
          export const getSentinelCategory = () => null;
          export const API_RESIZE_PARAMS = {};
          export const targetImageSize = () => ({ width: 0, height: 0 });

          // computer-use-swift exports
          export const ComputerUseAPI = undefined;

          // computer-use-input exports
          export const click = () => {};
          export const doubleClick = () => {};
          export const rightClick = () => {};
          export const moveTo = () => {};
          export const key = () => {};
          export const keys = () => {};
          export const type = () => {};
          export const getFrontmostApp = () => null;
        `,
        loader: 'js',
      }
    })
  },
}

// ── Plugin: stub missing internal files ──
// Some files are gated behind feature flags and don't exist in this build.
// This plugin creates empty stub modules for missing imports.
const missingFilesPlugin: esbuild.Plugin = {
  name: 'missing-files',
  setup(build) {
    const missingFiles = new Set<string>()

    // Helper to check if a path exists with any extension
    const fileExists = (basePath: string): boolean => {
      const withoutExt = basePath.replace(/\.(js|jsx|ts|tsx)$/, '')
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '']

      for (const ext of extensions) {
        if (existsSync(withoutExt + ext)) return true
        // Check for index files
        const indexPath = resolve(withoutExt, 'index')
        for (const idxExt of ['.ts', '.tsx', '.js']) {
          if (existsSync(indexPath + idxExt)) return true
        }
      }
      return false
    }

    // Handle relative imports (../ or ./)
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.importer) return undefined
      // Don't process imports from stub namespace
      if (args.namespace === 'stub') return undefined

      const importerDir = dirname(args.importer)
      const targetPath = resolve(importerDir, args.path)

      if (fileExists(targetPath)) {
        return undefined // File exists, let esbuild handle it
      }

      // File doesn't exist - use stub namespace
      missingFiles.add(args.path)
      return { path: args.path, namespace: 'stub' }
    })

    // Handle bare 'src/' imports that don't exist
    build.onResolve({ filter: /^src\// }, (args) => {
      const basePath = resolve(ROOT, args.path)

      if (fileExists(basePath)) {
        return undefined
      }

      // Use stub namespace
      const stubPath = `stub:${args.path}`
      missingFiles.add(args.path)
      return { path: stubPath, namespace: 'stub' }
    })

    // Load stub modules with empty exports
    build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
      // Return an empty module that exports nothing
      // This allows named imports to fail gracefully
      return {
        contents: `
          // Stub module for missing file: ${args.path}
          export default undefined;
        `,
        loader: 'js',
      }
    })

    // Log missing files at end of build
    build.onEnd(() => {
      if (missingFiles.size > 0) {
        console.log(`\n  [missing-files] Stubbed ${missingFiles.size} missing imports`)
      }
    })
  },
}

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [resolve(ROOT, 'src/entrypoints/cli.tsx')],
  bundle: true,
  platform: 'node',
  target: ['node20', 'es2022'],
  format: 'esm',
  outdir: resolve(ROOT, 'dist'),
  outExtension: { '.js': '.mjs' },

  // Single-file output — no code splitting for CLI tools
  splitting: false,

  plugins: [antPackagesPlugin, missingFilesPlugin, srcResolverPlugin],

  // Use tsconfig for baseUrl / paths resolution (complements plugin above)
  tsconfig: resolve(ROOT, 'tsconfig.json'),

  // Alias bun:bundle to our runtime shim and stub unavailable packages
  alias: {
    'bun:bundle': resolve(ROOT, 'src/shims/bun-bundle.ts'),
    '@anthropic-ai/sandbox-runtime': resolve(ROOT, 'src/stubs/sandbox-runtime/index.ts'),
    'color-diff-napi': resolve(ROOT, 'src/stubs/color-diff-napi.ts'),
    'modifiers-napi': resolve(ROOT, 'src/stubs/modifiers-napi.ts'),
    'audio-capture-napi': resolve(ROOT, 'src/stubs/audio-capture-napi.ts'),
  },

  // Don't bundle node built-ins or problematic native packages
  external: [
    // Node built-ins (with and without node: prefix)
    'fs', 'path', 'os', 'crypto', 'child_process', 'http', 'https',
    'net', 'tls', 'url', 'util', 'stream', 'events', 'buffer',
    'querystring', 'readline', 'zlib', 'assert', 'tty', 'worker_threads',
    'perf_hooks', 'async_hooks', 'dns', 'dgram', 'cluster',
    'string_decoder', 'module', 'vm', 'constants', 'domain',
    'console', 'process', 'v8', 'inspector',
    'node:*',
    // Native addons that can't be bundled
    'fsevents',
    'sharp',
    'image-processor-napi',
    'node-pty',
    // SDK packages (contain CommonJS that doesn't bundle well)
    '@anthropic-ai/sdk',
    '@anthropic-ai/sdk/*',
    // Anthropic-internal packages (not published externally)
    '@anthropic-ai/claude-agent-sdk',
    '@anthropic-ai/bedrock-sdk',
    '@anthropic-ai/vertex-sdk',
    '@anthropic-ai/foundry-sdk',
    '@anthropic-ai/mcpb',
    // Note: @ant/* packages are handled by antPackagesPlugin
    // Optional cloud provider SDKs (loaded dynamically)
    '@azure/identity',
    'google-auth-library',
    // Optional OpenTelemetry exporters (loaded dynamically)
    '@opentelemetry/exporter-logs-otlp-grpc',
    '@opentelemetry/exporter-logs-otlp-http',
    '@opentelemetry/exporter-logs-otlp-proto',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-http',
    '@opentelemetry/exporter-metrics-otlp-proto',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@opentelemetry/exporter-prometheus',
    // Note: fflate and asciichart are now bundled
  ],

  jsx: 'automatic',

  // Source maps for production debugging (external .map files)
  sourcemap: noSourcemap ? false : 'external',

  // Minification for production
  minify,

  // Tree shaking (on by default, explicit for clarity)
  treeShaking: true,

  // Define replacements — inline constants at build time
  // MACRO.* — originally inlined by Bun's bundler at compile time
  // process.env.USER_TYPE — eliminates 'ant' (Anthropic-internal) code branches
  define: {
    'MACRO.VERSION': JSON.stringify(version),
    'MACRO.PACKAGE_URL': JSON.stringify('@anthropic-ai/claude-code'),
    'MACRO.ISSUES_EXPLAINER': JSON.stringify(
      'report issues at https://github.com/anthropics/claude-code/issues'
    ),
    'process.env.USER_TYPE': '"external"',
    'process.env.NODE_ENV': minify ? '"production"' : '"development"',
  },

  // Banner: shebang + require shim + React polyfills
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __createRequire } from 'module';
const require = __createRequire(import.meta.url);

// Polyfill React experimental APIs (useEffectEvent) before any React code loads
import * as __React from 'react';
if (!__React.useEffectEvent) {
  const __useEffectEventPolyfill = function(callback) {
    const callbackRef = __React.useRef(callback);
    __React.useLayoutEffect(() => { callbackRef.current = callback; });
    return __React.useCallback((...args) => callbackRef.current(...args), []);
  };
  __React.useEffectEvent = __useEffectEventPolyfill;
  // Also patch the default export if it exists
  if (__React.default && !__React.default.useEffectEvent) {
    __React.default.useEffectEvent = __useEffectEventPolyfill;
  }
}
`,
  },

  // Handle the .js → .ts resolution that the codebase uses
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

  // Load markdown and text files as text
  loader: {
    '.md': 'text',
    '.txt': 'text',
  },

  logLevel: 'info',

  // Metafile for bundle analysis
  metafile: true,
}

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions)
    await ctx.watch()
    console.log('Watching for changes...')
  } else {
    const startTime = Date.now()
    const result = await esbuild.build(buildOptions)

    if (result.errors.length > 0) {
      console.error('Build failed')
      process.exit(1)
    }

    // Make the output executable
    const outPath = resolve(ROOT, 'dist/cli.mjs')
    try {
      chmodSync(outPath, 0o755)
    } catch {
      // chmod may fail on some platforms, non-fatal
    }

    // Patch React's useEffectEvent to use a polyfill (not available in stable React 19)
    const bundleContent = readFileSync(outPath, 'utf-8')
    const patchedContent = bundleContent.replace(
      /exports2\.useEffectEvent = function\(callback\) \{\s*return resolveDispatcher\(\)\.useEffectEvent\(callback\);\s*\};/g,
      `exports2.useEffectEvent = function(callback) {
        // Polyfill: useEffectEvent using useRef + useCallback
        var callbackRef = exports2.useRef(callback);
        exports2.useLayoutEffect(function() { callbackRef.current = callback; });
        return exports2.useCallback(function() {
          var args = arguments;
          return callbackRef.current.apply(null, args);
        }, []);
      };`
    )
    if (patchedContent !== bundleContent) {
      const { writeFileSync: writeFileSyncPatch } = await import('fs')
      writeFileSyncPatch(outPath, patchedContent)
      console.log('  Patched React useEffectEvent polyfill')
    }

    const elapsed = Date.now() - startTime

    // Print bundle size info
    if (result.metafile) {
      const text = await esbuild.analyzeMetafile(result.metafile, { verbose: false })
      const outFiles = Object.entries(result.metafile.outputs)
      for (const [file, info] of outFiles) {
        if (file.endsWith('.mjs')) {
          const sizeMB = ((info as { bytes: number }).bytes / 1024 / 1024).toFixed(2)
          console.log(`\n  ${file}: ${sizeMB} MB`)
        }
      }
      console.log(`\nBuild complete in ${elapsed}ms → dist/`)

      // Write metafile for further analysis
      const { writeFileSync } = await import('fs')
      writeFileSync(
        resolve(ROOT, 'dist/meta.json'),
        JSON.stringify(result.metafile),
      )
      console.log('  Metafile written to dist/meta.json')
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
