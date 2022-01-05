(() => {

  const { createView, createCanvas, createViewport, geometry } = window.ViewDraw
  const { animationFrames, Tween, smoothen, pipe, map, Subject, spreadCombineLatest } = window.InTween

  const view = createView((draw, butterflies) => {
    // draw.color('tomato')
    // draw.dot([0, 0])

    draw.color('tomato')
    for (const state of butterflies){
      draw.save()
      draw.translate(state.pos)
      draw.path(state.points)
      draw.restore()
    }

    // draw.color('steelblue')
    // draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#87ceeb', aspectRatio: 16 / 9 })

  function makeButterfly(){
    const triangle = geometry.triangleFromSides(0.05, 0.05, 0.05)
    const flap = Tween.create({
      points: triangle
    }, { easing: 'quadIn' })
      .in('0.15s', {
        points: triangle.map(p => ([p[0], -p[1]]))
      }, 'quadOut')
      .in('0.3s', {
        points: triangle
      }, 'quadOut').loop()

    const move = new Subject()
    let pos = [Math.random() - 0.5, Math.random() - 0.5]

    const dt = Math.random() * 1000 + 1000
    setInterval(() => {
      move.next({ pos: [Math.random() - 0.5, Math.random() - 0.5] })
    }, dt)

    move.pipe(
      smoothen({ easing: 'quadInOut', duration: dt }, null, { pos })
    ).subscribe(state => {
      pos = state.pos
    })

    const shift = 1000 * Math.random()

    return pipe(
      map(t => t + shift)
      , flap
      , map(state => ({
        ...state
        , pos
      }))
    )
  }

  const viewport = createViewport(canvas)
  // viewport.state.zoom = 0.4
  // view.camera([0, 0], 1)
  const butterfly = Array.from({ length: 20 }, makeButterfly)
  animationFrames().pipe(spreadCombineLatest(...butterfly)).subscribe(state => {
    const cam = viewport.update()
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state)
  })

})()
