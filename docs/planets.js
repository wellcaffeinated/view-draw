(() => {

  const { createView, createCanvas, createViewport } = window.ViewDraw
  const { animationFrames, Tween } = window.InTween

  const planets = [
    {
      name: 'Sun'
      , size: 1391400
      , r: 0
      , color: '#f57927'
    }
    , {
      name: 'Mercury'
      , size: 4879
      , r: 57900000
      , color: '#837d7d'
    }
    , {
      name: 'Venus'
      , size: 12104
      , r: 108200000
      , color: '#efeceb'
    }
    , {
      name: 'Earth'
      , size: 12756
      , r: 149600000
      , color: '#1c59a8'
    }
    , {
      name: 'Mars'
      , size: 6792
      , r: 227900000
      , color: '#fd865e'
    }
    , {
      name: 'Jupiter'
      , size: 142984
      , r: 778600000
      , color: '#ad8e7b'
    }
    , {
      name: 'Saturn'
      , size: 120536
      , r: 1433500000
      , color: '#e0bd81'
    }
    , {
      name: 'Uranus'
      , size: 51118
      , r: 2872500000
      , color: '#8ea1ad'
    }
    , {
      name: 'Neptune'
      , size: 49528
      , r: 4495100000
      , color: '#5e73a3'
    }
  ]

  const view = createView((draw, state) => {
    // draw.color('tomato')
    // draw.dot([0, 0])

    for (const i in state.planets){
      const p = state.planets[i]
      draw.color(planets[i].color)
      draw.circle([p.r, 0], p.size / 2)
      draw.dot([p.r, 0], 2)
    }

    // draw.color('steelblue')
    // draw.dot(view.center)
  })

  const parent = document.getElementById('content')
  const { canvas } = createCanvas({ el: parent, background: '#111', aspectRatio: 16 / 9 })

  const layout = Tween.create({
    planets
    , zoomAdjust: -9.2
  }, { easing: 'quartInOut' })
    .by('4s', '2s', {
      planets: planets.reduce((layout, p) => {
        const prev = layout[layout.length - 1]
        let r = 0
        if (prev) {
          r = prev.r + prev.size / 2 + Math.max(p.size, 0.25e6)
        }
        layout.push({
          ...p
          , r
        })
        return layout
      }, [])
    }, 'quartInOut')
    .by('4s', '2s', { zoomAdjust: -5.956 }, 'quadInOut')
    .by('10s', '2s', { planets }, 'quintOut')
    .by('8s', '2s', { zoomAdjust: -9.2 }, 'quintIn')
    .loop()

  const viewport = createViewport(canvas).setCenter([500, 0])
  animationFrames().pipe(layout).subscribe(state => {
    const cam = viewport.update()
    const z = Math.pow(10, -state.zoomAdjust)
    view.setViewbox([0, z, 0, z])
    view.camera(view.toViewCoords(cam.center, canvas, true), cam.zoom)
    view.draw(canvas, state)
  })

})()
