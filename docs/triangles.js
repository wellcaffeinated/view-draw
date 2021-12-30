(() => {

  const { createView, createCanvas, createViewport } = window.ViewDraw
  const { animationFrames } = window.InTween

  const view = createView((draw, state) => {
    draw.color('tomato')
    draw.dot([0, 0])

    draw.triangle(2, 2, 3, [2, 0], Math.PI * ((state / 100) | 0), true, 1)

    draw.color('steelblue')
    draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#dfcfc3', aspectRatio: 16 / 9 })

  const viewport = createViewport(canvas)
  // viewport.state.zoom = 0.4
  // view.camera([0, 0], 1)
  animationFrames().subscribe(state => {
    const cam = viewport.update()
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state)
  })

})()
