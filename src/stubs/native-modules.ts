// Stubs for native modules that don't exist in external builds

// color-diff-napi stub
export const colorDiffNapi = {
  diff: () => ({ r: 0, g: 0, b: 0 }),
}

// modifiers-napi stub
export const modifiersNapi = {
  isModifierPressed: (_m: string) => false,
}

// audio-capture-napi stub
export const audioCaptureNapi = {
  startCapture: () => { throw new Error('Audio capture not available') },
  stopCapture: () => {},
}
