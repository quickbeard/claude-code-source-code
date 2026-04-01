// Polyfill for React experimental APIs not in stable release
import React from 'react'

// useEffectEvent polyfill - approximates the behavior using useCallback + useRef
// The real useEffectEvent doesn't need deps and always has access to latest values
if (!(React as any).useEffectEvent) {
  ;(React as any).useEffectEvent = function useEffectEvent<T extends (...args: any[]) => any>(
    callback: T
  ): T {
    const callbackRef = React.useRef(callback)

    // Update ref on every render to always have latest callback
    React.useLayoutEffect(() => {
      callbackRef.current = callback
    })

    // Return stable function that calls the latest callback
    return React.useCallback(
      ((...args: any[]) => callbackRef.current(...args)) as T,
      []
    )
  }
}

export {}
