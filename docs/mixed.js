(() => {

  const { createView, createCanvas, createViewport } = window.ViewDraw
  const { animationFrames } = window.InTween

  const colors = window.chroma.brewer.OrRd.map(c => {
    return window.chroma(c).alpha(0.5).css()
  })

  const view = createView('polar', [0, 1, 0, 360], (draw, state) => {
    draw.color('tomato')
    draw.dot([0, 0])
    draw.arrow([0, 0], [1, 60], { scaleHead: true })
    draw.triangle(0.2, 0.2, 0.2)
    draw.color('steelblue')
    draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#111', aspectRatio: 16 / 9 })

  const viewport = createViewport(canvas)
  viewport.state.zoom = 0.4
  // view.camera([0, 0], 1)
  animationFrames().subscribe(state => {
    const cam = viewport.update()
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state)
  })

})()
