export function createCanvas({
  autoResize = true,
  pixelRatio = window.devicePixelRatio || 1,
  width = 0,
  height = 0,
  aspectRatio = 16 / 9,
  parent = document.body,
  background = 'hsl(0, 0%, 10%)',
  onResize = () => {}
} = {}) {
  const wrap = document.createElement('div')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const resize = { w: !width, h: !height }
  const dimensions = {}

  wrap.style.overflow = 'hidden'

  canvas.style.background = background
  canvas.style.transform = `scale(${1 / pixelRatio})`
  canvas.style.transformOrigin = 'top left'

  const _onResize = () => {
    if (resize.w) {
      width = parent.offsetWidth
    }

    if (resize.h) {
      height = width / aspectRatio
    }

    dimensions.width = width
    dimensions.height = height

    canvas.width = pixelRatio * width
    canvas.height = pixelRatio * height
    // ctx.scale(pixelRatio, pixelRatio)
    wrap.style.width = width + 'px'
    wrap.style.height = height + 'px'
    onResize(dimensions)
  }

  wrap.appendChild(canvas)
  parent.appendChild(wrap)

  if (autoResize) {
    window.addEventListener('resize', _onResize)
  }

  _onResize()

  const destroy = () => {
    if (autoResize) {
      window.removeEventListener('resize', _onResize)
    }
    canvas.parentNode.removeChild(canvas)
  }

  return {
    canvas
    , ctx
    , destroy
    , dimensions
  }
}
