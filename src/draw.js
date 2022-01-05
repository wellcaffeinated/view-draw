import * as geometry from './geometry.js'

const UNIT_BOUNDS = [0, 1, 0, 1]

export class Draw {
  static create(proj, options = {}){
    return new Draw(proj, options)
  }

  constructor(proj, options){
    this.proj = proj
    this.options = options
  }

  init(canvas, view) {
    if (canvas !== this.canvas) {
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
    }
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

  save() {
    this.ctx.save()
    return this
  }

  restore() {
    this.ctx.restore()
    return this
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    return this
  }

  color(color) {
    if (this.ctx.fillStyle !== color) {
      this.ctx.fillStyle = color
    }
    if (this.ctx.strokeStyle !== color) {
      this.ctx.strokeStyle = color
    }
    return this
  }

  style(propOrObj, v) {
    if (v !== undefined) {
      this.ctx[propOrObj] = v
      return this
    }
    for (const k in propOrObj) {
      const v = propOrObj[k]
      if (this.ctx[k] !== v) {
        this.ctx[k] = v
      }
    }
    return this
  }

  translate(pt) {
    const ctx = this.ctx
    const [x, y] = this.proj.toCamera(this.worldScale, pt)
    ctx.translate(x, y)
    return this
  }

  rotate(angle){
    const o = this.proj.toCamera(this.cameraBounds, [0, 0])
    this.ctx.translate(o[0], o[1])
    this.ctx.rotate(angle)
    this.ctx.translate(-o[0], -o[1])
    return this
  }

  dot(pt, size = 1) {
    const ctx = this.ctx
    const [x, y] = this.proj.toCamera(this.cameraBounds, pt)
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

  circle(pt, r, fill = true, stroke = 0) {
    const ctx = this.ctx
    const [x, y] = this.proj.toCamera(this.cameraBounds, pt)
    r = this.proj.toCameraSize(this.cameraBounds, r)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.paint(fill, stroke)
    return this
  }

  path(points, closed = false, fill, stroke){
    if (!points.length){ return this }
    const ctx = this.ctx
    ctx.beginPath()
    let pt = this.proj.toCamera(this.cameraBounds, points[0])
    ctx.moveTo(pt[0], pt[1])
    for (let i = 1, l = points.length; i < l; i++) {
      pt = this.proj.toCamera(this.cameraBounds, points[i])
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
    this.path(points, true, fill, stroke)
    this.restore()
    return this
  }
}
