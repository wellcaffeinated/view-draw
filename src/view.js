import * as Projections from './projections.js'

export function createView(projDef, viewbox, factory){
  if (typeof projDef === 'string'){
    projDef = Projections[projDef]
  } else if (projDef !== 'object'){
    factory = viewbox
    viewbox = projDef
    projDef = Projections.cartesian
  }

  if (!Array.isArray(viewbox)){
    factory = viewbox
    viewbox = undefined
  }

  const proj = Projections.makeProjection(projDef, viewbox)

  const view = { center: [0, 0], scale: 1, proj }

  const draw = { proj }
  draw.init = (canvas) => {
    if (canvas !== draw.canvas) {
      draw.canvas = canvas
      draw.ctx = canvas.getContext('2d')
    }
    draw.width = canvas.width
    draw.height = canvas.height
    draw.bounds = canvas.getBoundingClientRect()
    const px = draw.width / draw.bounds.width
    const ex = 0.5 * draw.width / px
    const ey = 0.5 * draw.height / px
    const m = Math.max(ex, ey)
    const c = proj.to(view.center)
    draw.cameraBounds = [
      -c[0] * m + ex
      , (view.scale - c[0]) * m + ex
      , -c[1] * m + ey
      , (view.scale - c[1]) * m + ey
    ]
    draw.worldScale = [
      0, -m, 0, -m
    ]
    draw.ctx.setTransform(
      px, 0, 0,
      px, 0, 0
    )
    return draw
  }

  draw.clear = () => {
    draw.ctx.clearRect(0, 0, draw.width, draw.height)
  }

  draw.color = (color) => {
    if (draw.ctx.fillStyle !== color){
      draw.ctx.fillStyle = color
    }
    if (draw.ctx.strokeStyle !== color){
      draw.ctx.strokeStyle = color
    }
    return draw
  }

  draw.style = (propOrObj, v) => {
    if (v !== undefined){
      draw.ctx[propOrObj] = v
      return draw
    }
    for (const k in propOrObj){
      const v = propOrObj[k]
      if (draw.ctx[k] !== v) {
        draw.ctx[k] = v
      }
    }
    return draw
  }

  draw.dot = pt => {
    const ctx = draw.ctx
    const [x, y] = proj.toCamera(draw.cameraBounds, pt)
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, 2 * Math.PI)
    ctx.fill()
  }

  draw.circle = (pt, r, fill = true, stroke = 0) => {
    const ctx = draw.ctx
    const [x, y] = proj.toCamera(draw.cameraBounds, pt)
    r = proj.toCameraSize(draw.cameraBounds, r)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    if (fill){
      ctx.fill()
    }
    if (stroke){
      draw.style('lineWidth', stroke)
      ctx.stroke()
    }
    return draw
  }

  view.toViewCoords = (pos, canvas, fromWorld = false) => {
    draw.init(canvas)
    return proj.fromCamera(fromWorld ? draw.worldScale : draw.cameraBounds, pos)
  }

  view.getMousePos = (e, canvas, fromWorld = false) => {
    const pt = [
      (e.pageX - draw.bounds.left)
      , (e.pageY - draw.bounds.top)
    ]
    return view.toViewCoords(pt, canvas, fromWorld)
  }

  view.camera = (center, scale = 1) => {
    view.center = center
    view.scale = scale
    return view
  }

  view.draw = (canvas, ...args) => {
    draw.init(canvas)
    draw.clear()
    factory(draw, ...args)
    return view
  }

  view.drawOver = (canvas, ...args) => {
    draw.init(canvas)
    factory(draw, ...args)
    return view
  }

  return view
}
