(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var PALETTE = ["--art-1", "--art-2", "--art-3", "--art-4", "--art-5"];
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var scenes = [];
  var rafId = 0;
  var lastPaint = 0;

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function between(random, min, max) {
    return min + random() * (max - min);
  }

  function paletteOf(canvas) {
    var styles = getComputedStyle(canvas);
    var colors = [];
    for (var i = 0; i < PALETTE.length; i += 1) {
      var color = styles.getPropertyValue(PALETTE[i]).trim();
      if (color) colors.push(color);
    }
    return colors.length ? colors : [styles.color];
  }

  function pick(random, colors) {
    return colors[Math.floor(random() * colors.length)];
  }

  // Every phase is wrapped, so no value drifts with elapsed time; only the
  // drawing moves, and the backing store is resized only when the frame's
  // CSS box changes. A resize can never feed back into layout.
  function fit(scene) {
    var rect = scene.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w === scene.w && h === scene.h && dpr === scene.dpr) return false;
    scene.w = w;
    scene.h = h;
    scene.dpr = dpr;
    scene.canvas.width = Math.round(w * dpr);
    scene.canvas.height = Math.round(h * dpr);
    scene.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.art = scene.build(w, h, scene.colors);
    scene.static();
    return true;
  }

  function paint(scene, time) {
    if (!scene.art) return;
    scene.ctx.clearRect(0, 0, scene.w, scene.h);
    scene.art(scene.ctx, time);
  }

  function schedule() {
    if (rafId || motionQuery.matches) return;
    var running = false;
    for (var i = 0; i < scenes.length; i += 1) {
      if (scenes[i].visible) {
        running = true;
        break;
      }
    }
    if (running) rafId = requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    rafId = 0;
    if (timestamp - lastPaint >= 1000 / 30) {
      lastPaint = timestamp;
      for (var i = 0; i < scenes.length; i += 1) {
        var scene = scenes[i];
        if (scene.visible) paint(scene, scene.elapsed + (timestamp - scene.origin) / 1000);
      }
    }
    schedule();
  }

  function show(scene) {
    if (scene.visible) return;
    scene.visible = true;
    scene.origin = performance.now();
    schedule();
  }

  function hide(scene) {
    if (!scene.visible) return;
    scene.visible = false;
    scene.elapsed = (scene.elapsed + (performance.now() - scene.origin) / 1000) % 3600;
  }

  function register(canvas, build) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    var scene = {
      canvas: canvas,
      ctx: ctx,
      build: build,
      colors: paletteOf(canvas),
      art: null,
      w: 0,
      h: 0,
      dpr: 0,
      visible: false,
      elapsed: 0,
      origin: 0,
      static: function () {
        paint(scene, scene.elapsed);
      }
    };
    scenes.push(scene);
    fit(scene);
    new ResizeObserver(function () {
      fit(scene);
      schedule();
    }).observe(canvas);
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) show(scene);
      else hide(scene);
    }).observe(canvas);
    return scene;
  }

  /* Hero: triangles gathered into a brain silhouette */

  var BRAIN_PARTS = [
    [-0.28, -0.24, 0.38, 0.45],
    [0.28, -0.24, 0.38, 0.45],
    [-0.3, 0.15, 0.36, 0.38],
    [0.3, 0.15, 0.36, 0.38],
    [-0.12, -0.48, 0.3, 0.25],
    [0.12, -0.48, 0.3, 0.25],
    [0.18, 0.48, 0.28, 0.2],
    [0.02, 0.66, 0.1, 0.23]
  ];

  function insideBrain(x, y) {
    if (Math.abs(x) < 0.025 && y < 0.42) return false;
    for (var i = 0; i < BRAIN_PARTS.length; i += 1) {
      var part = BRAIN_PARTS[i];
      var nx = (x - part[0]) / part[2];
      var ny = (y - part[1]) / part[3];
      if (nx * nx + ny * ny <= 1) return true;
    }
    return false;
  }

  function buildBrain(width, height, colors) {
    var random = mulberry32(0x5eed);
    var scale = 0.56 * Math.min(width, height);
    var count = Math.max(900, Math.min(2200, Math.floor((width * height) / 180)));
    var ambient = Math.floor(count * 0.16);
    var particles = [];
    var i;
    var x;
    var y;

    for (i = 0; i < count; i += 1) {
      do {
        x = between(random, -0.85, 0.85);
        y = between(random, -0.85, 0.95);
      } while (!insideBrain(x, y));
      particles.push({
        x: width / 2 + x * scale,
        y: height * 0.45 + y * scale,
        phase: between(random, 0, TAU),
        speed: between(random, 0.15, 0.45),
        amplitude: between(random, 1.5, 4),
        radius: between(random, 1.2, 2.6),
        rotation: between(random, 0, TAU),
        spin: between(random, -0.2, 0.2),
        color: pick(random, colors),
        alpha: between(random, 0.4, 0.9)
      });
    }

    for (i = 0; i < ambient; i += 1) {
      particles.push({
        x: between(random, 0, width),
        y: between(random, 0, height),
        phase: between(random, 0, TAU),
        speed: between(random, 0.15, 0.45),
        amplitude: between(random, 4, 12),
        radius: between(random, 1, 2),
        rotation: between(random, 0, TAU),
        spin: between(random, -0.2, 0.2),
        color: pick(random, colors),
        alpha: between(random, 0.15, 0.38)
      });
    }

    return function (ctx, time) {
      ctx.lineWidth = 1;
      ctx.lineJoin = "miter";
      for (var index = 0; index < particles.length; index += 1) {
        var particle = particles[index];
        var swing = (particle.phase + TAU * particle.speed * time) % TAU;
        var turn = (particle.rotation + particle.spin * time) % TAU;
        var px = particle.x + particle.amplitude * Math.sin(swing);
        var py = particle.y + 0.65 * particle.amplitude * Math.cos(swing);
        ctx.globalAlpha = particle.alpha;
        ctx.strokeStyle = particle.color;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(turn) * particle.radius, py + Math.sin(turn) * particle.radius);
        ctx.lineTo(
          px + Math.cos(turn + TAU / 3) * particle.radius,
          py + Math.sin(turn + TAU / 3) * particle.radius
        );
        ctx.lineTo(
          px + Math.cos(turn + (2 * TAU) / 3) * particle.radius,
          py + Math.sin(turn + (2 * TAU) / 3) * particle.radius
        );
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
  }

  /* Section fields: one drawn line pattern per section, all bounded in time */

  function resetPen(ctx) {
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = 1;
  }

  function dashLength(dash) {
    return dash.length ? dash[0] + dash[1] : 0;
  }

  function buildFlow(width, height, colors) {
    var random = mulberry32(1);
    var spacing = 9;
    var lines = [];
    for (var index = -1; index < Math.ceil(height / spacing) + 2; index += 1) {
      lines.push({
        y: (index + 0.5) * spacing,
        wavelength: between(random, 160, 420),
        amplitude: between(random, 2, 9),
        phase: between(random, 0, TAU),
        speed: between(random, 0.08, 0.28),
        tilt: between(random, -0.05, 0.05),
        color: pick(random, colors),
        alpha: between(random, 0.3, 0.7),
        dash: random() < 0.4 ? [between(random, 6, 30), between(random, 4, 20)] : []
      });
    }
    return function (ctx, time) {
      ctx.lineWidth = 1;
      for (var i = 0; i < lines.length; i += 1) {
        var line = lines[i];
        var drift = (line.phase + time * line.speed) % TAU;
        ctx.globalAlpha = line.alpha;
        ctx.strokeStyle = line.color;
        ctx.setLineDash(line.dash);
        ctx.beginPath();
        for (var x = 0; x <= width; x += 3) {
          var y =
            line.y +
            line.tilt * (x - width / 2) +
            line.amplitude * Math.sin((x / line.wavelength) * TAU + drift) +
            0.35 * line.amplitude * Math.sin((x / (line.wavelength * 0.37)) * TAU + line.phase * 1.7 - drift);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      resetPen(ctx);
    };
  }

  function buildRings(width, height, colors) {
    var random = mulberry32(2);
    var spacing = between(random, 12, 18);
    var maxRadius = Math.hypot(width, height) / 2 + spacing;
    var rings = [];
    for (var radius = spacing; radius < maxRadius; radius += spacing) {
      rings.push({
        radius: radius,
        wobble: between(random, 0.02, 0.09),
        harmonics: Math.round(between(random, 2, 6)),
        phase: between(random, 0, TAU),
        speed: between(random, -0.12, 0.12),
        color: pick(random, colors),
        alpha: between(random, 0.22, 0.55),
        dash: random() < 0.3 ? [between(random, 5, 24), between(random, 4, 16)] : []
      });
    }
    return function (ctx, time) {
      ctx.lineWidth = 1;
      var cx = width / 2;
      var cy = height / 2;
      for (var i = 0; i < rings.length; i += 1) {
        var ring = rings[i];
        var drift = (ring.phase + time * ring.speed) % TAU;
        ctx.globalAlpha = ring.alpha;
        ctx.strokeStyle = ring.color;
        ctx.setLineDash(ring.dash);
        ctx.beginPath();
        for (var step = 0; step <= 160; step += 1) {
          var angle = (step / 160) * TAU;
          var r = ring.radius * (1 + ring.wobble * Math.sin(angle * ring.harmonics + drift) + 0.4 * ring.wobble * Math.sin(angle * 3 - drift));
          var x = cx + Math.cos(angle) * r;
          var y = cy + Math.sin(angle) * r;
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      resetPen(ctx);
    };
  }

  function buildRays(width, height, colors) {
    var random = mulberry32(3);
    var count = Math.max(40, Math.round(width / 10));
    var spread = Math.PI * 0.94;
    var rays = [];
    for (var index = 0; index < count; index += 1) {
      rays.push({
        angle: -Math.PI / 2 + spread * (index / (count - 1) - 0.5),
        length: Math.hypot(width, height) * between(random, 0.6, 1),
        bend: between(random, -22, 22),
        phase: between(random, 0, TAU),
        sway: between(random, 0.004, 0.015),
        speed: between(random, 0.2, 0.7),
        drift: between(random, 20, 70),
        color: pick(random, colors),
        alpha: between(random, 0.25, 0.6),
        dash: random() < 0.5 ? [between(random, 8, 30), between(random, 6, 22)] : []
      });
    }
    return function (ctx, time) {
      ctx.lineWidth = 1;
      var cx = width / 2;
      var cy = height * 1.05;
      for (var i = 0; i < rays.length; i += 1) {
        var ray = rays[i];
        var angle = ray.angle + ray.sway * Math.sin((ray.phase + time * ray.speed) % TAU);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        ctx.globalAlpha = ray.alpha;
        ctx.strokeStyle = ray.color;
        ctx.setLineDash(ray.dash);
        ctx.lineDashOffset = dashLength(ray.dash) ? -((time * ray.drift) % dashLength(ray.dash)) : 0;
        ctx.beginPath();
        for (var step = 0; step <= 24; step += 1) {
          var distance = (step / 24) * ray.length;
          var bend = ray.bend * Math.sin((ray.phase + time * 0.4) % TAU + (distance / ray.length) * TAU);
          var x = cx + cos * distance - sin * bend;
          var y = cy + sin * distance + cos * bend;
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      resetPen(ctx);
    };
  }

  function buildRain(width, height, colors) {
    var random = mulberry32(4);
    var spacing = between(random, 8, 13);
    var drops = [];
    for (var x = spacing / 2; x < width; x += spacing) {
      drops.push({
        x: x + between(random, -2, 2),
        sway: between(random, 0.5, 3),
        phase: between(random, 0, TAU),
        speed: between(random, 20, 90),
        offset: between(random, 0, 400),
        dash: [between(random, 8, 48), between(random, 6, 36)],
        color: pick(random, colors),
        alpha: between(random, 0.25, 0.6)
      });
    }
    return function (ctx, time) {
      ctx.lineWidth = 1;
      for (var i = 0; i < drops.length; i += 1) {
        var drop = drops[i];
        var x = drop.x + drop.sway * Math.sin((drop.phase + time * 0.5) % TAU);
        var pattern = dashLength(drop.dash);
        ctx.globalAlpha = drop.alpha;
        ctx.strokeStyle = drop.color;
        ctx.setLineDash(drop.dash);
        ctx.lineDashOffset = -((time * drop.speed + drop.offset) % pattern);
        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.lineTo(x, height + 20);
        ctx.stroke();
      }
      resetPen(ctx);
    };
  }

  function buildMesh(width, height, colors) {
    var random = mulberry32(5);
    var rows = Math.max(6, Math.round(height / 26));
    var columns = Math.max(8, Math.round(width / 46));
    var horizontals = [];
    var verticals = [];
    var index;
    for (index = 0; index < rows; index += 1) {
      horizontals.push({
        offset: ((index + 0.5) / rows) * height,
        wavelength: between(random, 120, 320),
        amplitude: between(random, 3, 12),
        phase: between(random, 0, TAU),
        speed: between(random, 0.08, 0.25),
        color: pick(random, colors),
        alpha: between(random, 0.25, 0.6)
      });
    }
    for (index = 0; index < columns; index += 1) {
      verticals.push({
        offset: ((index + 0.5) / columns) * width,
        wavelength: between(random, 100, 260),
        amplitude: between(random, 3, 12),
        phase: between(random, 0, TAU),
        speed: between(random, 0.08, 0.25),
        color: pick(random, colors),
        alpha: between(random, 0.25, 0.6)
      });
    }
    return function (ctx, time) {
      ctx.lineWidth = 1;
      var i;
      ctx.setLineDash([]);
      for (i = 0; i < horizontals.length; i += 1) {
        var line = horizontals[i];
        var drift = (line.phase + time * line.speed) % TAU;
        ctx.globalAlpha = line.alpha;
        ctx.strokeStyle = line.color;
        ctx.beginPath();
        for (var x = 0; x <= width; x += 4) {
          var y =
            line.offset +
            line.amplitude * Math.sin((x / line.wavelength) * TAU + drift) +
            0.3 * line.amplitude * Math.sin((x / (line.wavelength * 0.45)) * TAU - drift);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (i = 0; i < verticals.length; i += 1) {
        var column = verticals[i];
        var driftY = (column.phase - time * column.speed) % TAU;
        ctx.globalAlpha = column.alpha;
        ctx.strokeStyle = column.color;
        ctx.beginPath();
        for (var y2 = 0; y2 <= height; y2 += 4) {
          var x2 =
            column.offset +
            column.amplitude * Math.sin((y2 / column.wavelength) * TAU + driftY) +
            0.3 * column.amplitude * Math.sin((y2 / (column.wavelength * 0.45)) * TAU + driftY);
          if (y2 === 0) ctx.moveTo(x2, y2);
          else ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }
      resetPen(ctx);
    };
  }

  var variants = {
    flow: buildFlow,
    rings: buildRings,
    rays: buildRays,
    rain: buildRain,
    mesh: buildMesh
  };

  var heroCanvas = document.getElementById("hero-constellation");
  if (heroCanvas) register(heroCanvas, buildBrain);

  var lineCanvases = document.querySelectorAll(".section-art");
  for (var index = 0; index < lineCanvases.length; index += 1) {
    var canvas = lineCanvases[index];
    var variant = variants[canvas.dataset.variant] || buildFlow;
    register(canvas, variant);
  }

  function onMotionChange() {
    for (var i = 0; i < scenes.length; i += 1) {
      scenes[i].static();
    }
    if (motionQuery.matches) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    } else {
      schedule();
    }
  }

  if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
  else motionQuery.addListener(onMotionChange);
})();
