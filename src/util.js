export const lerp = function (from, to, t) {
  return from * (1 - t) + to * t
}

export const invLerp = function (from, to, x) {
  const diff = to - from
  return diff ? (x - from) / diff : 1
}

export const clamp = function (min, max, v) {
  return Math.min(Math.max(v, min), max)
}

export const lerpClamped = function (from, to, t) {
  return lerp(from, to, clamp(0, 1, t))
}

export const invLerpClamped = function (from, to, x) {
  return clamp(0, 1, invLerp(from, to, x))
}

export const distance = function ([x1, y1], [x2, y2]){
  x2 -= x1
  y2 -= y1
  return Math.sqrt(y2 * y2 + x2 * x2)
}

export const angle = function([x1, y1], [x2, y2]){
  x2 -= x1
  y2 -= y1
  return Math.atan2(y2, x2)
}
