(() => {

  const { createView, createCanvas, createViewport, geometry } = window.ViewDraw
  const { animationFrames, Tween, smoothen, pipe, map, Subject, spreadCombineLatest } = window.InTween
  const colors = window.chroma.brewer.OrRd.map(c => {
    return window.chroma(c).alpha(0.5).css()
  })
  const view = createView('polar', [0, 0.5, 0, 0.5], (draw, paths) => {
    // draw.color('tomato')
    // draw.dot([0, 0])

    draw.color('tomato')
    for (const i in paths){
      const path = paths[i]
      const grad = draw.ctx.createLinearGradient(0, 0, draw.canvas.width, draw.canvas.height);
      grad.addColorStop(0, colors[i] || 'black');
      grad.addColorStop(1, colors[i + 1] || 'black');
      draw.style({ fillStyle: grad, strokeStyle: 'black' })
      draw.path(path, true, true, 2)
    }

    // draw.color('steelblue')
    // draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#111', aspectRatio: 16 / 9 })

  const makePath = (n) => Array.from({ length: n | 0 }, () => {
    return [Math.random() - 0.5, Math.random() - 0.5]
  })

  const paths = new Subject()
  const next = () => {
    paths.next({ paths: Array.from({ length: colors.length }, () => makePath(10)) })
    setTimeout(next, 2000)
  }
  next()
  const viewport = createViewport(canvas)
  paths.pipe(
    smoothen({ easing: 'quadInOut', duration: '2s' })
  ).subscribe(state => {
    const cam = viewport.update()
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state.paths)
  })

})()
