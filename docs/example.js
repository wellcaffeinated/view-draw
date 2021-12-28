const { createView, createCanvas } = window.ViewDraw
const { animationFrames, smoothen, Subject } = window.InTween

const view = createView('polar', (draw, t) => {
  draw.color('tomato')
  draw.dot([0, 0])
  draw.circle([0.5, t / 5000 % 1], 0.1, false, 1)
})

const parent = document.getElementById('content')
const { canvas } = createCanvas({ parent })

animationFrames().subscribe(t => {
  view.draw(canvas, t)
})

const cameraPos = new Subject()

cameraPos.pipe(smoothen({ easing: 'quadOut' })).subscribe(state => {
  view.camera(state.center)
})

canvas.addEventListener('click', e => {
  const pt = view.getMousePos(e, canvas)
  cameraPos.next({ center: pt })
})
