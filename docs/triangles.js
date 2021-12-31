(() => {

  const { createView, createCanvas, createViewport, geometry } = window.ViewDraw
  const { animationFrames, Tween } = window.InTween

  const view = createView((draw, state) => {
    draw.color('tomato')
    draw.dot([0, 0])

    draw.path(state.points)

    draw.color('steelblue')
    draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#dfcfc3', aspectRatio: 16 / 9 })

  const triangle = geometry.triangleFromSides(1, 1, 1)
  const butterfly = Tween.create({
    points: triangle
  }, { easing: 'quadIn' })
    .in('0.15s', {
      points: triangle.map(p => ([p[0], -p[1]]))
    }, 'quadOut')
    .in('0.3s', {
      points: triangle
    }, 'quadOut').loop()

  const viewport = createViewport(canvas)
  // viewport.state.zoom = 0.4
  // view.camera([0, 0], 1)
  animationFrames().pipe(butterfly).subscribe(state => {
    const cam = viewport.update()
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state)
  })

})()
