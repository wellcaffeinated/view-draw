/**
 * view-draw 1.0.0
 * @license MIT
 * Copyright 2021-present Jasper Palfree
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ViewDraw = {}));
})(this, (function (exports) { 'use strict';

  var lerp = function lerp(from, to, t) {
    return from * (1 - t) + to * t;
  };
  var invLerp = function invLerp(from, to, x) {
    var diff = to - from;
    return diff ? (x - from) / diff : 1;
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

  function createView(projDef, viewbox, factory) {
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
      scale: 1
    };
    var draw = {
      proj: proj
    };

    draw.init = function (canvas) {
      if (canvas !== draw.canvas) {
        draw.canvas = canvas;
        draw.ctx = canvas.getContext('2d');
      }

      draw.width = canvas.width;
      draw.height = canvas.height;
      draw.bounds = canvas.getBoundingClientRect();
      var px = draw.width / draw.bounds.width;
      var ex = 0.5 * view.scale * draw.width / px;
      var ey = 0.5 * view.scale * draw.height / px;
      var m = Math.max(ex, ey);
      var c = proj.to(view.center);
      draw.cameraBounds = [-c[0] * m + ex, (1 - c[0]) * m + ex, -c[1] * m + ey, (1 - c[1]) * m + ey];
      draw.ctx.setTransform(px, 0, 0, px, 0, 0);
      return draw;
    };

    draw.clear = function () {
      draw.ctx.clearRect(0, 0, draw.width, draw.height);
    };

    draw.color = function (color) {
      if (draw.ctx.fillStyle !== color) {
        draw.ctx.fillStyle = color;
      }

      if (draw.ctx.strokeStyle !== color) {
        draw.ctx.strokeStyle = color;
      }

      return draw;
    };

    draw.dot = function (pt) {
      var ctx = draw.ctx;

      var _proj$toCamera = proj.toCamera(draw.cameraBounds, pt),
          x = _proj$toCamera[0],
          y = _proj$toCamera[1];

      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fill();
    };

    draw.circle = function (pt, r, fill, stroke) {
      if (fill === void 0) {
        fill = true;
      }

      if (stroke === void 0) {
        stroke = 0;
      }

      var ctx = draw.ctx;

      var _proj$toCamera2 = proj.toCamera(draw.cameraBounds, pt),
          x = _proj$toCamera2[0],
          y = _proj$toCamera2[1];

      r = proj.toCameraSize(draw.cameraBounds, r);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);

      if (fill) {
        ctx.fill();
      }

      if (stroke) {
        if (ctx.lineWidth !== stroke) {
          ctx.lineWidth = stroke;
        }

        ctx.stroke();
      }

      return draw;
    };

    view.getMousePos = function (e, canvas) {
      draw.init(canvas);
      var pt = [e.pageX - draw.bounds.left, e.pageY - draw.bounds.top];
      return proj.fromCamera(draw.cameraBounds, pt);
    };

    view.camera = function (center, zoom) {
      if (zoom === void 0) {
        zoom = 1;
      }

      view.center = center;
      view.scale = 1 / zoom;
      return view;
    };

    view.draw = function (canvas) {
      draw.init(canvas);
      draw.clear();

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      factory.apply(void 0, [draw].concat(args));
      return view;
    };

    view.drawOver = function (canvas) {
      draw.init(canvas);

      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      factory.apply(void 0, [draw].concat(args));
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
        aspectRatio = _ref$aspectRatio === void 0 ? 16 / 9 : _ref$aspectRatio,
        _ref$parent = _ref.parent,
        parent = _ref$parent === void 0 ? document.body : _ref$parent,
        _ref$background = _ref.background,
        background = _ref$background === void 0 ? 'hsl(0, 0%, 10%)' : _ref$background,
        _ref$onResize = _ref.onResize,
        onResize = _ref$onResize === void 0 ? function () {} : _ref$onResize;

    var wrap = document.createElement('div');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var resize = {
      w: !width,
      h: !height
    };
    var dimensions = {};
    wrap.style.overflow = 'hidden';
    canvas.style.background = background;
    canvas.style.transform = "scale(" + 1 / pixelRatio + ")";
    canvas.style.transformOrigin = 'top left';

    var _onResize = function _onResize() {
      if (resize.w) {
        width = parent.offsetWidth;
      }

      if (resize.h) {
        height = width / aspectRatio;
      }

      dimensions.width = width;
      dimensions.height = height;
      canvas.width = pixelRatio * width;
      canvas.height = pixelRatio * height; // ctx.scale(pixelRatio, pixelRatio)

      wrap.style.width = width + 'px';
      wrap.style.height = height + 'px';
      onResize(dimensions);
    };

    wrap.appendChild(canvas);
    parent.appendChild(wrap);

    if (autoResize) {
      window.addEventListener('resize', _onResize);
    }

    _onResize();

    var destroy = function destroy() {
      if (autoResize) {
        window.removeEventListener('resize', _onResize);
      }

      canvas.parentNode.removeChild(canvas);
    };

    return {
      canvas: canvas,
      ctx: ctx,
      destroy: destroy,
      dimensions: dimensions
    };
  }

  exports.createCanvas = createCanvas;
  exports.createView = createView;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy1kcmF3LmpzIiwic291cmNlcyI6W10sInNvdXJjZXNDb250ZW50IjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiJ9
