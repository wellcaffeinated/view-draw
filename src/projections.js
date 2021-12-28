import { lerp, invLerp } from './util.js'

const rescale = (coords, viewbox) => {
  return [
    lerp(viewbox[0], viewbox[1], coords[0])
    , lerp(viewbox[2], viewbox[3], coords[1])
  ]
}

const normalize = (coords, viewbox) => {
  return [
    invLerp(viewbox[0], viewbox[1], coords[0])
    , invLerp(viewbox[2], viewbox[3], coords[1])
  ]
}

export const makeProjection = ({ name, to, from }, viewbox = [0, 1, 0, 1]) => {

  const proj = {
    name
    , to
    , from
    , viewbox
  }

  proj.toCameraSize = (camera, len) => {
    const l = camera[1] - camera[0]
    return l * len / (proj.viewbox[1] - proj.viewbox[0])
  }

  proj.fromCameraSize = (camera, len) => {
    const l = camera[1] - camera[0]
    return (proj.viewbox[1] - proj.viewbox[0]) * len / l
  }

  proj.toCamera = (camera, coords) => {
    return rescale(
      to(normalize(coords, proj.viewbox))
      , camera
    )
  }
  proj.fromCamera = (camera, coords) => {
    return rescale(
      from(normalize(coords, camera))
      , proj.viewbox
    )
  }

  return proj
}

const Pi2 = Math.PI * 2

export const cartesian = {
  to: coords => coords
  , from: coords => coords
}

export const polar = {
  to: ([r, theta]) => {
    theta *= Pi2
    const x = r * Math.cos(theta)
    const y = r * Math.sin(theta)
    return [x, y]
  }
  , from: ([x, y]) => {
    const r = Math.sqrt(x * x + y * y)
    const theta = Math.atan2(y, x)
    return [r, theta / Pi2]
  }
}

