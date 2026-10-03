export function easeInSine (t) {
  return Math.sin(t * Math.PI / 2)
}

export function easeOutCirc (t) {
  return Math.sqrt(1 - (t - 1) ** 2)
}

export function easeOutExpo (t) {
  return t === 1
    ? 1
    : 1 - 2 ** (t * -10)
}

export function easeLinear (t) {
  return t
}
