const { createView, createCanvas, createDragger } = window.ViewDraw
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

const cam = {
  center: [0, 0]
  , zoom: 1
}

function calcZoom(cam, scroll, speed = 1) {
  return cam.zoom * Math.pow(2, scroll * speed)
}

const dragger = createDragger(cam.center)
const onWheel = (e) => {
  e.preventDefault()
  cam.zoom = calcZoom(cam, -e.deltaY, 0.001)
}

const onMouseDown = (e) => {
  dragger.start([e.pageX, e.pageY])
}

const onMouseMove = (e) => {
  dragger.drag([e.pageX, e.pageY])
}

const onMouseUp = (e) => {
  dragger.stop([e.pageX, e.pageY])
}

canvas.addEventListener('wheel', onWheel)
canvas.addEventListener('mousedown', onMouseDown)
canvas.addEventListener('mousemove', onMouseMove)
window.addEventListener('mouseup', onMouseUp)

// view.camera([0, 0], 1)
animationFrames().pipe(tween).subscribe(state => {
  const center = view.toViewCoords(dragger.update(), canvas, true)
  view.camera(center, cam.zoom)
  view.draw(canvas, state)
})