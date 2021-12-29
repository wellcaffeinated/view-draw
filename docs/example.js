const { createView, createCanvas, createViewport } = window.ViewDraw
const { animationFrames, Tween } = window.InTween

function* range(min, max) {
  if (max === undefined) {
    max = min
    min = 0
  }

  for (let i = min; i < max; i++) {
    yield i
  }
}

const colors = window.chroma.brewer.OrRd.map(c => {
  return window.chroma(c).alpha(0.5).css()
})

const view = createView('polar', (draw, state) => {
  draw.color('tomato')
  draw.dot([0, 0])
  let last = [0, 0]
  draw.save()
  for (const i in state.circles){
    const c = state.circles[i]
    // draw.translate(last)
    last = [c.r, c.theta]
    draw.color(colors[i])
    draw.circle(last, c.size)
    draw.color(colors[4])
    draw.circle(last, c.size, false, c.borderSize)
  }
  draw.restore()
  draw.color('steelblue')
  draw.dot(view.center)
})

const parent = document.getElementById('content')
const { canvas } = createCanvas({ el: parent, background: '#dfcfc3' })
const circles = Array.from(range(10), i => ({
  r: Math.random()
  , theta: 0
  , size: Math.random()
  , borderSize: Math.random() * 8
}))
circles.sort((a, b) => b.size - a.size)
const tween = Tween.create({
  circles
}, { easing: 'quadInOut' }).in('1s', {
  circles: circles.map(c => {
    return { ...c, theta: Math.random() }
  })
}).in('1s', { circles: circles.map(c => ({ ...c })) }).loop()

const viewport = createViewport(canvas)
viewport.state.zoom = 0.4
// view.camera([0, 0], 1)
animationFrames().pipe(tween).subscribe(state => {
  const cam = viewport.update()
  view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
  view.draw(canvas, state)
})

