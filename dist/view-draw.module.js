/**
 * view-draw 0.0.2
 * @license MIT
 * Copyright 2021-present Jasper Palfree
 */
var lerp = function lerp(from, to, t) {
  return from * (1 - t) + to * t;
};
var invLerp = function invLerp(from, to, x) {
  var diff = to - from;
  return diff ? (x - from) / diff : 1;
};
var angle = function angle(_ref3, _ref4) {
  var x1 = _ref3[0],
      y1 = _ref3[1];
  var x2 = _ref4[0],
      y2 = _ref4[1];
  x2 -= x1;
  y2 -= y1;
  return Math.atan2(y2, x2);
};

var rescale = function rescale(coords, viewbox) {
  return [lerp(viewbox[0], viewbox[1], coords[0]), lerp(viewbox[2], viewbox[3], coords[1])];
};

var normalize = function normalize(coords, viewbox) {
  return [invLerp(viewbox[0], viewbox[1], coords[0]), invLerp(viewbox[2], viewbox[3], coords[1])];
};

var makeProjection = function makeProjection(_ref, viewbox) {
  var name = _ref.name,
      to = _ref.to,
      from = _ref.from;

  if (viewbox === void 0) {
    viewbox = [0, 1, 0, 1];
  }

  var proj = {
    name: name,
    to: to,
    from: from,
    viewbox: viewbox
  };

  proj.toCameraSize = function (camera, len) {
    var l = camera[1] - camera[0];
    return l * len / (proj.viewbox[1] - proj.viewbox[0]);
  };

  proj.fromCameraSize = function (camera, len) {
    var l = camera[1] - camera[0];
    return (proj.viewbox[1] - proj.viewbox[0]) * len / l;
  };

  proj.toCamera = function (camera, coords) {
    return rescale(to(normalize(coords, proj.viewbox)), camera);
  };

  proj.fromCamera = function (camera, coords) {
    return rescale(from(normalize(coords, camera)), proj.viewbox);
  };

  return proj;
};
var Pi2 = Math.PI * 2;
var cartesian = {
  to: function to(coords) {
    return coords;
  },
  from: function from(coords) {
    return coords;
  }
};
var polar = {
  to: function to(_ref2) {
    var r = _ref2[0],
        theta = _ref2[1];
    theta *= Pi2;
    var x = r * Math.cos(theta);
    var y = r * Math.sin(theta);
    return [x, y];
  },
  from: function from(_ref3) {
    var x = _ref3[0],
        y = _ref3[1];
    var r = Math.sqrt(x * x + y * y);
    var theta = Math.atan2(y, x);
    return [r, theta / Pi2];
  }
};

var Projections = /*#__PURE__*/Object.freeze({
  __proto__: null,
  makeProjection: makeProjection,
  cartesian: cartesian,
  polar: polar
});

function centroid(points) {
  var x = 0;
  var y = 0;
  var l = points.length;

  for (var i = 0; i < l; i++) {
    var pt = points[i];
    x += pt[0];
    y += pt[1];
  }

  return [x / l, y / l];
}
function triangleFromSides(a, b, c, relCentroid) {
  if (relCentroid === void 0) {
    relCentroid = true;
  }

  var biggest = Math.max(a, b, c);

  if (biggest === a) {
    var _ref = [c, a];
    a = _ref[0];
    c = _ref[1];
  } else if (biggest === b) {
    var _ref2 = [c, b];
    b = _ref2[0];
    c = _ref2[1];
  }

  var projA = a === 0 ? 0 : (a * a - b * b + c * c) / (2 * c);
  var h = Math.sqrt(a * a - projA * projA);
  var points = [[0, 0], [projA, h], [c, 0]];

  if (relCentroid) {
    var _centroid = centroid(points),
        cx = _centroid[0],
        cy = _centroid[1];

    for (var i = 0, l = points.length; i < l; i++) {
      points[i][0] -= cx;
      points[i][1] -= cy;
    }
  }

  return points;
}

var geometry = /*#__PURE__*/Object.freeze({
  __proto__: null,
  centroid: centroid,
  triangleFromSides: triangleFromSides
});

var UNIT_BOUNDS = [0, 1, 0, 1];
var Draw = /*#__PURE__*/function () {
  Draw.create = function create(proj, options) {
    if (options === void 0) {
      options = {};
    }

    return new Draw(proj, options);
  };

  function Draw(proj, options) {
    this.proj = proj;
    this.projCanonical = makeProjection(cartesian);
    this.options = options;
    this.saveStateCount = 0;
    this._internalState = [];
  }

  var _proto = Draw.prototype;

  _proto.init = function init(canvas, view) {
    if (canvas !== this.canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    this._useCanonical = false;
    this.width = canvas.width;
    this.height = canvas.height;
    this.bounds = canvas.getBoundingClientRect();
    var px = this.width / this.bounds.width;
    var ex = 0.5 * this.width / px;
    var ey = 0.5 * this.height / px;
    var m = this.options.scaleMode === 'fit' ? Math.min(ex, ey) : Math.max(ex, ey);
    var s = m * view.scale;
    var c = this.proj.toCamera(UNIT_BOUNDS, view.center);
    this.cameraBounds = [-c[0] * s + ex, (1 - c[0]) * s + ex, -c[1] * s + ey, (1 - c[1]) * s + ey];
    this.worldUnit = [0, m, 0, m];
    this.worldScale = [0, s, 0, s];
    this.ctx.setTransform(px, 0, 0, px, 0, 0);
    return this;
  };

  _proto.canonical = function canonical(toggle) {
    if (toggle === void 0) {
      toggle = true;
    }

    this._useCanonical = toggle;
    return this;
  };

  _proto.toCamera = function toCamera(pt) {
    if (this._useCanonical) {
      return this.projCanonical.toCamera(this.cameraBounds, pt);
    } else {
      return this.proj.toCamera(this.cameraBounds, pt);
    }
  };

  _proto.toCameraSize = function toCameraSize(pt) {
    if (this._useCanonical) {
      return this.projCanonical.toCameraSize(this.cameraBounds, pt);
    } else {
      return this.proj.toCameraSize(this.cameraBounds, pt);
    }
  };

  _proto.save = function save() {
    this.saveStateCount++;

    this._internalState.push({
      _useCanonical: this._useCanonical
    });

    this.ctx.save();
    return this;
  };

  _proto.restore = function restore() {
    this.ctx.restore();

    var state = this._internalState.pop();

    Object.assign(this, state);
    this.saveStateCount = Math.max(this.saveStateCount - 1, 0);
    return this;
  } // used internally
  ;

  _proto.end = function end() {
    if (this.saveStateCount) {
      window.console.warn('Warning: Forgot to call restore() after save().');
    }
  };

  _proto.clear = function clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    return this;
  };

  _proto.color = function color(_color) {
    if (!_color) {
      return this;
    }

    if (this.ctx.fillStyle !== _color) {
      this.ctx.fillStyle = _color;
    }

    if (this.ctx.strokeStyle !== _color) {
      this.ctx.strokeStyle = _color;
    }

    return this;
  };

  _proto.style = function style(propOrObj, v) {
    if (v !== undefined && v) {
      this.ctx[propOrObj] = v;
      return this;
    }

    for (var k in propOrObj) {
      var _v = propOrObj[k];

      if (this.ctx[k] !== _v && _v) {
        this.ctx[k] = _v;
      }
    }

    return this;
  };

  _proto.translate = function translate(pt) {
    var ctx = this.ctx;

    var _ref = this._useCanonical ? this.projCanonical.toCamera(this.worldScale, pt) : this.proj.toCamera(this.worldScale, pt),
        x = _ref[0],
        y = _ref[1];

    ctx.translate(x, y);
    return this;
  };

  _proto.rotate = function rotate(angle) {
    var o = this.toCamera([0, 0]);
    this.ctx.translate(o[0], o[1]);
    this.ctx.rotate(angle);
    this.ctx.translate(-o[0], -o[1]);
    return this;
  };

  _proto.dot = function dot(pt, size) {
    if (size === void 0) {
      size = 1;
    }

    var ctx = this.ctx;

    var _this$toCamera = this.toCamera(pt),
        x = _this$toCamera[0],
        y = _this$toCamera[1];

    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
    return this;
  };

  _proto.paint = function paint(fill, stroke) {
    if (fill === void 0) {
      fill = true;
    }

    if (stroke === void 0) {
      stroke = 0;
    }

    var ctx = this.ctx;

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      this.style('lineWidth', stroke);
      ctx.stroke();
    }

    return this;
  };

  _proto.text = function text(_text, pos, _temp) {
    var _ref2 = _temp === void 0 ? {} : _temp,
        _ref2$font = _ref2.font,
        font = _ref2$font === void 0 ? '12px monospace' : _ref2$font,
        _ref2$textAlign = _ref2.textAlign,
        textAlign = _ref2$textAlign === void 0 ? 'center' : _ref2$textAlign;

    var _this$toCamera2 = this.toCamera(pos),
        x = _this$toCamera2[0],
        y = _this$toCamera2[1];

    this.style('font', font).style('textAlign', textAlign);
    this.ctx.fillText(_text, x, y);
    return this;
  };

  _proto.arrow = function arrow(start, end, _temp2) {
    var _ref3 = _temp2 === void 0 ? {} : _temp2,
        _ref3$stroke = _ref3.stroke,
        stroke = _ref3$stroke === void 0 ? 1 : _ref3$stroke,
        _ref3$scaleHead = _ref3.scaleHead,
        scaleHead = _ref3$scaleHead === void 0 ? false : _ref3$scaleHead,
        _ref3$headSize = _ref3.headSize,
        headSize = _ref3$headSize === void 0 ? 6 : _ref3$headSize,
        headColor = _ref3.headColor;

    this.path([start, end], false, false, stroke); // head

    var w = this.proj.fromCameraSize(scaleHead ? this.worldUnit : this.cameraBounds, headSize);
    this.save();
    this.translate(end);
    this.color(headColor);
    var r1 = this.toCamera(start);
    var r2 = this.toCamera(end); // const l = distance(r1, r2)

    var ang = angle(r1, r2);
    this.rotate(ang);
    this.canonical(true);
    this.path([[0, 0], [-w, w], [-w, -w]], true, true);
    this.restore();
    return this;
  };

  _proto.circle = function circle(pt, r, fill, stroke) {
    if (fill === void 0) {
      fill = true;
    }

    if (stroke === void 0) {
      stroke = 0;
    }

    var ctx = this.ctx;

    var _this$toCamera3 = this.toCamera(pt),
        x = _this$toCamera3[0],
        y = _this$toCamera3[1];

    r = this.toCameraSize(r);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    this.paint(fill, stroke);
    return this;
  };

  _proto.path = function path(points, closed, fill, stroke) {
    if (closed === void 0) {
      closed = false;
    }

    if (!points.length) {
      return this;
    }

    var ctx = this.ctx;
    ctx.beginPath();
    var pt = this.toCamera(points[0]);
    ctx.moveTo(pt[0], pt[1]);

    for (var i = 1, l = points.length; i < l; i++) {
      pt = this.toCamera(points[i]);
      ctx.lineTo(pt[0], pt[1]);
    }

    if (closed) {
      ctx.closePath();
    }

    this.paint(fill, stroke);
    return this;
  };

  _proto.triangle = function triangle(a, b, c, _temp3, angle, fill, stroke) {
    var _ref4 = _temp3 === void 0 ? [0, 0] : _temp3,
        x0 = _ref4[0],
        y0 = _ref4[1];

    if (angle === void 0) {
      angle = 0;
    }

    var points = triangleFromSides(a, b, c);
    this.save();
    this.translate([x0, y0]);
    this.rotate(angle);
    this.canonical(true);
    this.path(points, true, fill, stroke);
    this.restore();
    return this;
  };

  return Draw;
}();

function createView(projDef, viewbox, factory, options) {
  if (options === void 0) {
    options = {
      scaleMode: 'fit' // or fill

    };
  }

  if (typeof projDef === 'string') {
    projDef = Projections[projDef];
  } else if (projDef !== 'object') {
    factory = viewbox;
    viewbox = projDef;
    projDef = cartesian;
  }

  if (!Array.isArray(viewbox)) {
    factory = viewbox;
    viewbox = undefined;
  }

  var proj = makeProjection(projDef, viewbox);
  var view = {
    center: [0, 0],
    scale: 1,
    proj: proj
  };
  var draw = Draw.create(proj, options);

  view.toViewCoords = function (pos, canvas, fromWorld) {
    if (fromWorld === void 0) {
      fromWorld = false;
    }

    draw.init(canvas, view);
    return proj.fromCamera(fromWorld ? draw.worldUnit : draw.cameraBounds, pos);
  };

  view.getMousePos = function (e, canvas, fromWorld) {
    if (fromWorld === void 0) {
      fromWorld = false;
    }

    draw.init(canvas, view);
    var pt = [e.pageX - draw.bounds.left, e.pageY - draw.bounds.top];
    return view.toViewCoords(pt, canvas, fromWorld);
  };

  view.camera = function (center, scale) {
    if (scale === void 0) {
      scale = 1;
    }

    view.center = center;
    view.scale = scale;
    return view;
  };

  view.draw = function (canvas) {
    draw.init(canvas, view);
    draw.clear();

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    factory.apply(void 0, [draw].concat(args));
    draw.end();
    return view;
  };

  view.drawOver = function (canvas) {
    draw.init(canvas, view);

    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    factory.apply(void 0, [draw].concat(args));
    draw.end();
    return view;
  };

  view.setViewbox = function (viewbox) {
    proj.viewbox = viewbox;
    return view;
  };

  return view;
}

function createCanvas(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$autoResize = _ref.autoResize,
      autoResize = _ref$autoResize === void 0 ? true : _ref$autoResize,
      _ref$pixelRatio = _ref.pixelRatio,
      pixelRatio = _ref$pixelRatio === void 0 ? window.devicePixelRatio || 1 : _ref$pixelRatio,
      _ref$width = _ref.width,
      width = _ref$width === void 0 ? 0 : _ref$width,
      _ref$height = _ref.height,
      height = _ref$height === void 0 ? 0 : _ref$height,
      _ref$aspectRatio = _ref.aspectRatio,
      aspectRatio = _ref$aspectRatio === void 0 ? null : _ref$aspectRatio,
      _ref$el = _ref.el,
      el = _ref$el === void 0 ? document.body : _ref$el,
      _ref$background = _ref.background,
      background = _ref$background === void 0 ? 'hsl(0, 0%, 10%)' : _ref$background,
      _ref$onResize = _ref.onResize,
      onResize = _ref$onResize === void 0 ? function () {} : _ref$onResize;

  var canvas = el.tagName === 'CANVAS' ? el : document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var resize = {
    w: !width,
    h: !height
  };
  var dimensions = {};
  canvas.style.display = 'flex';
  canvas.style.background = background;
  canvas.style.transform = "scale(" + 1 / pixelRatio + ")";
  canvas.style.transformOrigin = 'top left';

  if (el.tagName !== 'CANVAS') {
    el.appendChild(canvas);
  }

  var _onResize = function _onResize() {
    var parent = canvas.parentNode;

    if (!parent) {
      return;
    }

    if (resize.w) {
      width = parent.clientWidth;
    }

    if (resize.h) {
      if (aspectRatio) {
        height = width / aspectRatio;
      } else {
        height = parent.clientHeight;
      }
    }

    dimensions.width = width;
    dimensions.height = height;
    canvas.style.marginBottom = (1 - pixelRatio) * height + 'px';
    canvas.width = pixelRatio * width;
    canvas.height = pixelRatio * height;
    ctx.scale(pixelRatio, pixelRatio);
    onResize(dimensions);
  };

  if (autoResize) {
    window.addEventListener('resize', _onResize);
  }

  _onResize();

  var destroy = function destroy() {
    if (autoResize) {
      window.removeEventListener('resize', _onResize);
    }

    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };

  return {
    canvas: canvas,
    ctx: ctx,
    destroy: destroy,
    dimensions: dimensions,
    refresh: _onResize
  };
}
var createDragger = function createDragger(startPos, opts) {
  if (startPos === void 0) {
    startPos = [0, 0];
  }

  if (opts === void 0) {
    opts = {};
  }

  var options = Object.assign({
    friction: 0.02,
    threshold: 1e-3,
    minFlick: 0.1,
    maxFlick: 8
  }, opts);
  var r0 = false;
  var pos = startPos;
  var oldPos;
  var dx, dy;
  var ds;
  var time = 0;
  var lastDragTime;
  var lastPos = [];
  var dt = 0;
  var now = window.performance.now.bind(window.performance);

  function start(r) {
    r0 = r;
    oldPos = pos.slice(0);
  }

  function drag(r, zoom) {
    if (zoom === void 0) {
      zoom = 1;
    }

    if (!r0) {
      return;
    }

    lastPos = pos.slice(0);
    pos[0] = oldPos[0] + (r[0] - r0[0]) / zoom;
    pos[1] = oldPos[1] + (r[1] - r0[1]) / zoom;
    var t = now();
    dt = Math.max(20, t - lastDragTime);
    lastDragTime = t;
  }

  function stop(r, zoom) {
    if (zoom === void 0) {
      zoom = 1;
    }

    if (!r0) {
      return;
    }

    r0 = false;

    if (now() - lastDragTime > 50) {
      dx = dy = 0;
      return;
    }

    dx = pos[0] - lastPos[0];
    dy = pos[1] - lastPos[1];
    ds = Math.sqrt(dx * dx + dy * dy);

    if (ds < options.minFlick / zoom) {
      ds = 0;
      dx = 0;
      dy = 0;
    } else if (ds > options.maxFlick / zoom) {
      var max = options.maxFlick / zoom / ds;
      dx *= max;
      dy *= max;
      ds = options.maxFlick;
    }

    dx *= 4 / dt;
    dy *= 4 / dt;
    ds *= 4 / dt;
  }

  function momentum(t) {
    if (!dx && !dy) {
      return;
    }

    var dt = t - time;
    pos[0] += dx * dt;
    pos[1] += dy * dt;

    if (dx) {
      dx -= options.friction * dx;
    }

    if (dy) {
      dy -= options.friction * dy;
    }

    if ((dx * dx + dy * dy) / (ds * ds) < options.threshold * options.threshold) {
      dx = dy = 0;
    }
  }

  function update() {
    var t = now();

    if (!r0) {
      momentum(t);
    }

    time = t;
    return pos;
  }

  return {
    start: start,
    drag: drag,
    stop: stop,
    set: function set(_ref2) {
      var x = _ref2[0],
          y = _ref2[1];
      pos[0] = x;
      pos[1] = y;
    },
    update: update
  };
};
function createViewport(el, options) {
  if (options === void 0) {
    options = {};
  }

  var state = {
    center: [0, 0],
    zoom: 1
  };
  var pointers = new Map();

  function dist(_ref3, _ref4) {
    var x1 = _ref3[0],
        y1 = _ref3[1];
    var x2 = _ref4[0],
        y2 = _ref4[1];
    y2 -= y1;
    x2 -= x1;
    return Math.sqrt(x2 * x2 + y2 * y2);
  }

  function calcZoom(state, scroll, speed) {
    if (speed === void 0) {
      speed = 1;
    }

    return state.zoom * Math.pow(2, scroll * speed);
  }

  var getPointerPos = function getPointerPos(e) {
    var offset = el.getBoundingClientRect(); // reversed because we want to move viewport opposite of drag

    return [-(e.pageX - offset.left), -(e.pageY - offset.top)];
  };

  var pinchStart = 0;
  var zoomStart = 1;
  var doPinch = false;

  var pinchZoom = function pinchZoom(e) {
    if (pointers.size !== 2) {
      return;
    }

    var ps = Array.from(pointers.values(), function (e) {
      return getPointerPos(e);
    });
    var d = dist(ps[0], ps[1]);

    if (pinchStart) {
      state.zoom = zoomStart * d / pinchStart;
    } else {
      pinchStart = d;
      zoomStart = state.zoom;
    }
  };

  var dragger = createDragger(state.center, options);

  var onWheel = function onWheel(e) {
    e.preventDefault();
    state.zoom = calcZoom(state, -e.deltaY, 0.001);
  };

  var onPointerDown = function onPointerDown(e) {
    pointers.set(e.pointerId, e);
    dragger.start(getPointerPos(e));

    if (pointers.size === 2) {
      doPinch = true;
      dragger.stop(getPointerPos(e), state.zoom);
    }
  };

  var onPointerMove = function onPointerMove(e) {
    pointers.set(e.pointerId, e);

    if (doPinch) {
      pinchZoom();
    } else {
      dragger.drag(getPointerPos(e), state.zoom);
    }
  };

  var onPointerUp = function onPointerUp(e) {
    pointers.delete(e.pointerId);
    pinchStart = 0;

    if (!doPinch) {
      dragger.stop(getPointerPos(e), state.zoom);
    }

    if (pointers.size === 0) {
      doPinch = false;
    }
  };

  var prevStyle = el.style.touchAction;
  el.style.touchAction = 'none';
  el.addEventListener('wheel', onWheel);
  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  return {
    state: state,
    setCenter: function setCenter(pos) {
      dragger.set(pos);
      return this;
    },
    update: function update() {
      state.center = dragger.update();
      return state;
    },
    destroy: function destroy() {
      el.style.touchAction = prevStyle;
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
  };
}

export { createCanvas, createDragger, createView, createViewport, geometry };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy1kcmF3Lm1vZHVsZS5qcyIsInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIifQ==
