const { View } = window.ViewDraw

const view = View('polar', (draw, t) => {
  draw.color('tomato')
  draw.dot([0, 0])
  draw.circle([0.5, t / 5000 % 1], 0.1, false, 1)
})
// .options({ pixelRatio: 2 })

const canvas = document.createElement('canvas')
canvas.style.background = '#222'
canvas.width = 2000
canvas.height = 1000
canvas.style.transformOrigin = 'top left'
canvas.style.transform = 'scale(0.5)'
document.body.appendChild(canvas)

// view.camera(center, zoom)
// view.drawOver(canvas)
const loop = () => {
  const t = window.performance.now()
  // view.camera([0.5, t / 5000 % 1])
  view.draw(canvas, t)
  window.requestAnimationFrame(loop)
}

loop()

canvas.addEventListener('click', e => {
  const pt = view.getMousePos(e, canvas)
  view.camera(pt)
})
