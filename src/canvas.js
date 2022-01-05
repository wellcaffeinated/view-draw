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
      , minFlick: 0.1
      , maxFlick: 8
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
  let dt = 0
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
    const t = now()
    dt = Math.max(20, t - lastDragTime)
    lastDragTime = t
  }

  function stop(r, zoom = 1) {
    if (!r0) {
      return
    }
    r0 = false
    if ((now() - lastDragTime) > 50){
      dx = dy = 0
      return
    }
    dx = (pos[0] - lastPos[0])
    dy = (pos[1] - lastPos[1])
    ds = Math.sqrt(dx * dx + dy * dy)
    if (ds < options.minFlick / zoom){
      ds = 0
      dx = 0
      dy = 0
    } else if (ds > options.maxFlick / zoom){
      const max = options.maxFlick / zoom / ds
      dx *= max
      dy *= max
      ds = options.maxFlick
    }
    dx *= 4 / dt
    dy *= 4 / dt
    ds *= 4 / dt
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
    , set: ([x, y]) => {
      pos[0] = x
      pos[1] = y
    }
    , update
  }
}

export function createViewport(el, options = {}) {
  const state = {
    center: [0, 0]
    , zoom: 1
  }
  const pointers = new Map()

  function dist([x1, y1], [x2, y2]){
    y2 -= y1
    x2 -= x1
    return Math.sqrt(x2 * x2 + y2 * y2)
  }

  function calcZoom(state, scroll, speed = 1) {
    return state.zoom * Math.pow(2, scroll * speed)
  }

  const getPointerPos = (e) => {
    const offset = el.getBoundingClientRect()
    // reversed because we want to move viewport opposite of drag
    return [
      -(e.pageX - offset.left)
      , -(e.pageY - offset.top)
    ]
  }

  let pinchStart = 0
  let zoomStart = 1
  let doPinch = false
  const pinchZoom = e => {
    if (pointers.size !== 2) { return }
    const ps = Array.from(pointers.values(), e => getPointerPos(e))
    const d = dist(ps[0], ps[1])
    if (pinchStart){
      state.zoom = zoomStart * d / pinchStart
    } else {
      pinchStart = d
      zoomStart = state.zoom
    }
  }

  const dragger = createDragger(state.center, options)
  const onWheel = (e) => {
    e.preventDefault()
    state.zoom = calcZoom(state, -e.deltaY, 0.001)
  }

  const onPointerDown = (e) => {
    pointers.set(e.pointerId, e)
    dragger.start(getPointerPos(e))
    if (pointers.size === 2) {
      doPinch = true
      dragger.stop(getPointerPos(e), state.zoom)
    }
  }

  const onPointerMove = (e) => {
    pointers.set(e.pointerId, e)
    if (doPinch){
      pinchZoom(e)
    } else {
      dragger.drag(getPointerPos(e), state.zoom)
    }
  }

  const onPointerUp = (e) => {
    pointers.delete(e.pointerId)
    pinchStart = 0
    if (!doPinch){
      dragger.stop(getPointerPos(e), state.zoom)
    }
    if (pointers.size === 0){
      doPinch = false
    }
  }

  const prevStyle = el.style.touchAction
  el.style.touchAction = 'none'
  el.addEventListener('wheel', onWheel)
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)

  return {
    state
    , setCenter(pos){
      dragger.set(pos)
      return this
    }
    , update() {
      state.center = dragger.update()
      return state
    }
    , cleanup() {
      el.style.touchAction = prevStyle
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }
}
