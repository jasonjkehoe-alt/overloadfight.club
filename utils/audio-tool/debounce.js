export function debounce (cb, options = {}) {
  let timeoutHandle

  const delay = typeof options === 'number'
    ? options
    : options.delay
  const {
    triggerCallLimit = Infinity
  } = options

  const debounced = function (...args) {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle)
      timeoutHandle = undefined
    }
    debounced.callCount = (debounced.callCount || 0) + 1
    if (debounced.callCount > triggerCallLimit) {
      debounced.dispatch(...args)
    } else {
      const handle = setTimeout(() => {
        if (timeoutHandle === handle) {
          timeoutHandle = undefined
          debounced.dispatch(...args)
        }
      }, delay)
      timeoutHandle = handle
    }
  }

  debounced.dispatch = function (...args) {
    debounced.callCount = 0
    return cb.apply(this, args)
  }

  return debounced
}
