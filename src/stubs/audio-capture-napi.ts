// Stub for audio-capture-napi native module
// This module is not available in external builds

export function startCapture(): never {
  throw new Error('Audio capture is not available in this build')
}

export function stopCapture(): void {
  // No-op
}

export default { startCapture, stopCapture }
