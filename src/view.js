import * as Projections from './projections.js'
import { Draw } from './draw.js'

export function createView(projDef, viewbox, factory, options = {
  scaleMode: 'fit' // or fill
}){
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
  const draw = Draw.create(proj, options)

  view.toViewCoords = (pos, canvas, fromWorld = false) => {
    draw.init(canvas, view)
    return proj.fromCamera(fromWorld ? draw.worldUnit : draw.cameraBounds, pos)
  }

  view.getMousePos = (e, canvas, fromWorld = false) => {
    draw.init(canvas, view)
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
    draw.init(canvas, view)
    draw.clear()
    factory(draw, ...args)
    draw.end()
    return view
  }

  view.drawOver = (canvas, ...args) => {
    draw.init(canvas, view)
    factory(draw, ...args)
    draw.end()
    return view
  }

  view.setViewbox = (viewbox) => {
    proj.viewbox = viewbox
    return view
  }

  return view
}
