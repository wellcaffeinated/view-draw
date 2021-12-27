const view = View('polar', [0, 1, 0, 1], (draw, t) => {
  draw.circle([1, t])
}).options({ pixelRatio: 2 })

drawer.draw(canvas, myTime)

