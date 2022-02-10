import * as geometry from './geometry.js'
import { angle } from './util.js'
import * as Projections from './projections.js'

const UNIT_BOUNDS = [0, 1, 0, 1]

export class Draw {
  static create(proj, options = {}){
    return new Draw(proj, options)
  }

  constructor(proj, options){
    this.proj = proj
    this.projCanonical = Projections.makeProjection(Projections.cartesian)
    this.options = options
    this.saveStateCount = 0
    this._internalState = []
  }

  init(canvas, view) {
    if (canvas !== this.canvas) {
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
    }
    this._useCanonical = false
    this.width = canvas.width
    this.height = canvas.height
    this.bounds = canvas.getBoundingClientRect()
    const px = this.width / this.bounds.width
    const ex = 0.5 * this.width / px
    const ey = 0.5 * this.height / px
    const m = this.options.scaleMode === 'fit' ? Math.min(ex, ey) : Math.max(ex, ey)
    const s = m * view.scale
    const c = this.proj.toCamera(UNIT_BOUNDS, view.center)
    this.cameraBounds = [
      -c[0] * s + ex
      , (1 - c[0]) * s + ex
      , -c[1] * s + ey
      , (1 - c[1]) * s + ey
    ]
    this.worldUnit = [
      0, m, 0, m
    ]
    this.worldScale = [
      0, s, 0, s
    ]
    this.ctx.setTransform(
      px, 0, 0,
      px, 0, 0
    )
    return this
  }

  canonical(toggle = true){
    this._useCanonical = toggle
    return this
  }

  toCamera(pt){
    if (this._useCanonical){
      return this.projCanonical.toCamera(this.cameraBounds, pt)
    } else {
      return this.proj.toCamera(this.cameraBounds, pt)
    }
  }

  toCameraSize(pt) {
    if (this._useCanonical) {
      return this.projCanonical.toCameraSize(this.cameraBounds, pt)
    } else {
      return this.proj.toCameraSize(this.cameraBounds, pt)
    }
  }

  save() {
    this.saveStateCount++
    this._internalState.push({
      _useCanonical: this._useCanonical
    })
    this.ctx.save()
    return this
  }

  restore() {
    this.ctx.restore()
    const state = this._internalState.pop()
    Object.assign(this, state)
    this.saveStateCount = Math.max(this.saveStateCount - 1, 0)
    return this
  }

  // used internally
  end(){
    if (this.saveStateCount){
      window.console.warn('Warning: Forgot to call restore() after save().')
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    return this
  }

  color(color) {
    if (!color){ return this }
    if (this.ctx.fillStyle !== color) {
      this.ctx.fillStyle = color
    }
    if (this.ctx.strokeStyle !== color) {
      this.ctx.strokeStyle = color
    }
    return this
  }

  style(propOrObj, v) {
    if (v !== undefined && v) {
      this.ctx[propOrObj] = v
      return this
    }
    for (const k in propOrObj) {
      const v = propOrObj[k]
      if (this.ctx[k] !== v && v) {
        this.ctx[k] = v
      }
    }
    return this
  }

  translate(pt) {
    const ctx = this.ctx
    const [x, y] = this._useCanonical ?
      this.projCanonical.toCamera(this.worldScale, pt) :
      this.proj.toCamera(this.worldScale, pt)
    ctx.translate(x, y)
    return this
  }

  rotate(angle){
    const o = this.toCamera([0, 0])
    this.ctx.translate(o[0], o[1])
    this.ctx.rotate(angle)
    this.ctx.translate(-o[0], -o[1])
    return this
  }

  dot(pt, size = 1) {
    const ctx = this.ctx
    const [x, y] = this.toCamera(pt)
    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fill()
    return this
  }

  paint(fill = true, stroke = 0){
    const ctx = this.ctx
    if (fill) {
      ctx.fill()
    }
    if (stroke) {
      this.style('lineWidth', stroke)
      ctx.stroke()
    }
    return this
  }

  text(text, pos, { font = '12px monospace', textAlign = 'center' } = {}) {
    const [x, y] = this.toCamera(pos)
    this.style('font', font).style('textAlign', textAlign)
    this.ctx.fillText(text, x, y)
    return this
  }

  arrow(start, end, { stroke = 1, scaleHead = false, headSize = 6, headColor } = {}){
    this.path(
      [start, end],
      false,
      false,
      stroke
    )
    // head
    const w = this.proj.fromCameraSize(scaleHead ? this.worldUnit : this.cameraBounds, headSize)
    this.save()
    this.translate(end)
    this.color(headColor)
    const r1 = this.toCamera(start)
    const r2 = this.toCamera(end)
    // const l = distance(r1, r2)
    const ang = angle(r1, r2)
    this.rotate(ang)
    this.canonical(true)
    this.path([
      [0, 0]
      , [-w, w]
      , [-w, -w]
    ], true, true)
    this.restore()
    return this
  }

  circle(pt, r, fill = true, stroke = 0) {
    const ctx = this.ctx
    const [x, y] = this.toCamera(pt)
    r = this.toCameraSize(r)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.paint(fill, stroke)
    return this
  }

  path(points, closed = false, fill, stroke){
    if (!points.length){ return this }
    const ctx = this.ctx
    ctx.beginPath()
    let pt = this.toCamera(points[0])
    ctx.moveTo(pt[0], pt[1])
    for (let i = 1, l = points.length; i < l; i++) {
      pt = this.toCamera(points[i])
      ctx.lineTo(pt[0], pt[1])
    }
    if (closed) {
      ctx.closePath()
    }
    this.paint(fill, stroke)
    return this
  }

  triangle(a, b, c, [x0, y0] = [0, 0], angle = 0, fill, stroke){
    const points = geometry.triangleFromSides(a, b, c)

    this.save()
    this.translate([x0, y0])
    this.rotate(angle)
    this.canonical(true)
    this.path(points, true, fill, stroke)
    this.restore()
    return this
  }
}
