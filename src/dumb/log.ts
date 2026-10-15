// Namespaced debug logging, off by default.
// Enable in the browser console with `localStorage.debug = 'flow:*'` and reload.
import createDebug from 'debug'

export function logger(namespace: string): createDebug.Debugger {
  return createDebug(`flow:${namespace}`)
}
