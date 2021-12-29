export function createCanvas({
  autoResize = true,
  pixelRatio = window.devicePixelRatio || 1,
  width = 0,
  height = 0,
  aspectRatio = null,
  el = document.body,
  background = 'hsl(0, 0%, 10%)',
  onResize = () => {}
} = {}) {

  const canvas = el.tagName === 'CANVAS' ? el : document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const resize = { w: !width, h: !height }
  const dimensions = {}

  canvas.style.display = 'flex'
  canvas.style.background = background
  canvas.style.transform = `scale(${1 / pixelRatio})`
  canvas.style.transformOrigin = 'top left'

  if (el.tagName !== 'CANVAS') {
    el.appendChild(canvas)
  }

  const _onResize = () => {
    const parent = canvas.parentNode
    if (!parent){ return }

    if (resize.w) {
      width = parent.clientWidth
    }

    if (resize.h) {
      if (aspectRatio){
        height = width / aspectRatio
      } else {
        height = parent.clientHeight
      }
    }

    dimensions.width = width
    dimensions.height = height

    canvas.style.marginBottom = ((1 - pixelRatio) * height) + 'px'

    canvas.width = pixelRatio * width
    canvas.height = pixelRatio * height
    ctx.scale(pixelRatio, pixelRatio)
    onResize(dimensions)
  }

  if (autoResize) {
    window.addEventListener('resize', _onResize)
  }

  _onResize()

  const destroy = () => {
    if (autoResize) {
      window.removeEventListener('resize', _onResize)
    }
    if (canvas.parentNode){
      canvas.parentNode.removeChild(canvas)
    }
  }

  return {
    canvas
    , ctx
    , destroy
    , dimensions
    , refresh: _onResize
  }
}

export const createDragger = (startPos = [0, 0], opts = {}) => {
  const options = Object.assign(
    {
      friction: 0.02
      , threshold: 1e-3
    },
    opts
  )
  let r0 = false
  const pos = startPos
  let oldPos
  let dx, dy
  let ds
  let time = 0
  let lastDragTime
  let lastPos = []
  const now = window.performance.now.bind(window.performance)

  function start(r) {
    r0 = r
    oldPos = pos.slice(0)
  }

  function drag(r, zoom = 1) {
    if (!r0) {
      return
    }
    lastPos = pos.slice(0)
    pos[0] = oldPos[0] + (r[0] - r0[0]) / zoom
    pos[1] = oldPos[1] + (r[1] - r0[1]) / zoom
    lastDragTime = now()
  }

  function stop(r, zoom) {
    if (!r0) {
      return
    }
    dx = lastPos[0]
    dy = lastPos[1]
    const dt = Math.max(20, now() - lastDragTime)
    drag(r, zoom)
    dx = (4 * (pos[0] - dx)) / dt
    dy = (4 * (pos[1] - dy)) / dt
    ds = Math.sqrt(dx * dx + dy * dy)
    r0 = false
  }

  function momentum(t) {
    if (!dx && !dy) {
      return
    }
    const dt = t - time
    pos[0] += dx * dt
    pos[1] += dy * dt
    if (dx) {
      dx -= options.friction * dx
    }
    if (dy) {
      dy -= options.friction * dy
    }
    if (
      (dx * dx + dy * dy) / (ds * ds) <
      options.threshold * options.threshold
    ) {
      dx = dy = 0
    }
  }

  function update() {
    const t = now()
    if (!r0) {
      momentum(t)
    }
    time = t
    return pos
  }

  return {
    start
    , drag
    , stop
    , update
  }
}

export function createViewport(el, options = {}) {
  const state = {
    center: [0, 0]
    , zoom: 1
  }

  function calcZoom(state, scroll, speed = 1) {
    return state.zoom * Math.pow(2, scroll * speed)
  }

  const getMousePos = (e) => {
    const offset = el.getBoundingClientRect()
    // reversed because we want to move viewport opposite of drag
    return [
      -(e.pageX - offset.left)
      , -(e.pageY - offset.top)
    ]
  }

  const dragger = createDragger(state.center, options)
  const onWheel = (e) => {
    e.preventDefault()
    state.zoom = calcZoom(state, -e.deltaY, 0.001)
  }

  const onMouseDown = (e) => {
    dragger.start(getMousePos(e))
  }

  const onMouseMove = (e) => {
    dragger.drag(getMousePos(e), state.zoom)
  }

  const onMouseUp = (e) => {
    dragger.stop(getMousePos(e), state.zoom)
  }

  el.addEventListener('wheel', onWheel)
  el.addEventListener('mousedown', onMouseDown)
  el.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  return {
    state
    , update() {
      state.center = dragger.update()
      return state
    }
    , cleanup() {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }
}
