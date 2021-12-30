export function centroid(points){
  let x = 0
  let y = 0
  const l = points.length
  for (let i = 0; i < l; i++) {
    const pt = points[i]
    x += pt[0]
    y += pt[1]
  }
  return [x / l, y / l]
}

export function triangleFromSides(a, b, c){
  const biggest = Math.max(a, b, c)
  if (biggest === a) {
    [a, c] = [c, a]
  } else if (biggest === b) {
    [b, c] = [c, b]
  }
  const projA = a === 0 ? 0 : (a * a - b * b + c * c) / (2 * c)
  const h = Math.sqrt(a * a - projA * projA)
  const points = [
    [0, 0]
    , [projA, h]
    , [c, 0]
  ]

  return points
}
