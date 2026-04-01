// Global type augmentations for Ink components
// This file provides JSX intrinsic element types for custom Ink elements

import type { DOMElement } from './dom.js'
import type { Styles } from './styles.js'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': Styles & { ref?: React.Ref<DOMElement> }
      'ink-text': { style?: Styles }
      'ink-root': Record<string, unknown>
      'ink-virtual-text': Record<string, unknown>
    }
  }
}

export {}
