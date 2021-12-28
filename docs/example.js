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

const view = createView('polar', (draw, state) => {
  draw.color('tomato')
  draw.dot([0, 0])
  for (const c of state.circles){
    draw.circle([c.r, c.theta], c.size, false, 1)
  }
  draw.dot(view.center)
})

const parent = document.getElementById('content')
const { canvas } = createCanvas({ parent })
const circles = Array.from(range(10), i => ({
  r: Math.random()
  , theta: Math.random()
  , size: Math.random()
}))
const tween = Tween.create({
  circles
}, { easing: 'quadInOut' }).in('1s', {
  circles: circles.map(c => {
    return { ...c, theta: Math.random() }
  })
}).in('1s', { circles }).loop()

const viewport = createViewport(canvas)
// view.camera([0, 0], 1)
animationFrames().pipe(tween).subscribe(state => {
  const cam = viewport.update()
  view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
  view.draw(canvas, state)
})
