import { ref, watch } from 'vue'

export function localStorageRef (value, key, validator) {
  if (!('localStorage' in globalThis)) {
    return ref(value)
  }
  let baseValue = value
  let storedValue = localStorage.getItem(key)
  if (storedValue !== null && typeof validator === 'function') {
    storedValue = validator(storedValue)
  }
  if (storedValue !== null) {
    baseValue = storedValue
  }
  const result = ref(baseValue)
  watch(() => result.value, () => {
    localStorage.setItem(key, result.value)
  })
  return result
}
