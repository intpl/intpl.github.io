(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const COLORS = ["#ff2200", "#ffb829", "#15846e", "#ff4fa3", "#4d8dff", "#b36bff"];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  drawSectionLines();

  const canvas = document.getElementById("hero-constellation");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const SEED = 0x5eed;
  const BRAIN_PARTS = [
    [-0.28, -0.24, 0.38, 0.45],
    [0.28, -0.24, 0.38, 0.45],
    [-0.30, 0.15, 0.36, 0.38],
    [0.30, 0.15, 0.36, 0.38],
    [-0.12, -0.48, 0.30, 0.25],
    [0.12, -0.48, 0.30, 0.25],
    [0.18, 0.48, 0.28, 0.20],
    [0.02, 0.66, 0.10, 0.23]
  ];

  let width = 0;
  let height = 0;
  let particles = [];
  let frameId = 0;
  let origin = 0;
  let lastFrame = 0;
  let visible = true;
  let reducedMotion = motionQuery.matches;

  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function insideBrain(x, y) {
    if (Math.abs(x) < 0.025 && y < 0.42) {
      return false;
    }

    for (const part of BRAIN_PARTS) {
      const nx = (x - part[0]) / part[2];
      const ny = (y - part[1]) / part[3];
      if (nx * nx + ny * ny <= 1) {
        return true;
      }
    }

    return false;
  }

  function randomBetween(random, min, max) {
    return min + random() * (max - min);
  }

  function buildParticles() {
    const random = mulberry32(SEED);
    const scale = 0.56 * Math.min(width, height);
    const mainCount = Math.max(900, Math.min(2200, Math.floor((width * height) / 160)));
    const ambientCount = Math.floor(mainCount * 0.2);
    const nextParticles = [];

    for (let index = 0; index < mainCount; index += 1) {
      let x;
      let y;
      do {
        x = randomBetween(random, -0.85, 0.85);
        y = randomBetween(random, -0.85, 0.95);
      } while (!insideBrain(x, y));

      nextParticles.push({
        x: width / 2 + x * scale,
        y: height * 0.45 + y * scale,
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 0.15, 0.45),
        amplitude: randomBetween(random, 1.5, 4),
        radius: randomBetween(random, 1.2, 2.6),
        rotation: randomBetween(random, 0, TAU),
        spin: randomBetween(random, -0.2, 0.2),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.45, 0.95)
      });
    }

    for (let index = 0; index < ambientCount; index += 1) {
      nextParticles.push({
        x: randomBetween(random, 0, width),
        y: randomBetween(random, 0, height),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 0.15, 0.45),
        amplitude: randomBetween(random, 4, 12),
        radius: randomBetween(random, 1, 2),
        rotation: randomBetween(random, 0, TAU),
        spin: randomBetween(random, -0.2, 0.2),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.12, 0.35)
      });
    }

    particles = nextParticles;
  }

  function draw(time) {
    if (!particles.length) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.lineJoin = "miter";

    for (const particle of particles) {
      const rotation = particle.rotation + particle.spin * time;
      const x = particle.x + particle.amplitude * Math.sin(TAU * particle.speed * time + particle.phase);
      const y = particle.y + 0.65 * particle.amplitude * Math.cos(TAU * particle.speed * time + particle.phase);

      ctx.globalAlpha = particle.alpha;
      ctx.strokeStyle = particle.color;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(rotation) * particle.radius, y + Math.sin(rotation) * particle.radius);
      ctx.lineTo(
        x + Math.cos(rotation + TAU / 3) * particle.radius,
        y + Math.sin(rotation + TAU / 3) * particle.radius
      );
      ctx.lineTo(
        x + Math.cos(rotation + (2 * TAU) / 3) * particle.radius,
        y + Math.sin(rotation + (2 * TAU) / 3) * particle.radius
      );
      ctx.closePath();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  function stop() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    lastFrame = 0;
  }

  function start() {
    if (reducedMotion) {
      stop();
      draw(0);
      return;
    }

    if (!visible || !width || !height || frameId) {
      return;
    }

    origin = performance.now();
    lastFrame = 0;
    frameId = requestAnimationFrame(animate);
  }

  function animate(timestamp) {
    frameId = requestAnimationFrame(animate);

    if (!lastFrame) {
      lastFrame = timestamp;
    }

    const elapsed = timestamp - lastFrame;
    if (elapsed < 1000 / 30) {
      return;
    }

    lastFrame = timestamp - (elapsed % (1000 / 30));
    draw((timestamp - origin) / 1000);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    buildParticles();
    stop();

    if (reducedMotion) {
      draw(0);
    } else if (visible) {
      start();
    }
  }

  function handleMotionChange() {
    reducedMotion = motionQuery.matches;
    stop();

    if (reducedMotion) {
      draw(0);
    } else if (visible) {
      start();
    }
  }

  new ResizeObserver(resize).observe(canvas);

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;

    if (visible) {
      start();
    } else {
      stop();
    }
  }).observe(canvas);

  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", handleMotionChange);
  } else {
    motionQuery.addListener(handleMotionChange);
  }

  resize();

  function drawSectionLines() {
    const variants = {
      flow: { build: buildFlow, draw: drawFlow },
      rings: { build: buildRings, draw: drawRings },
      rays: { build: buildRays, draw: drawRays },
      rain: { build: buildRain, draw: drawRain },
      mesh: { build: buildMesh, draw: drawMesh }
    };

    for (const lineCanvas of document.querySelectorAll(".section-lines")) {
      const lineCtx = lineCanvas.getContext("2d");
      if (!lineCtx) {
        continue;
      }

      const seed = Number(lineCanvas.dataset.seed) || 1;
      const variant = variants[lineCanvas.dataset.variant] || variants.flow;
      let art = null;
      let frameId = 0;
      let origin = 0;
      let lastFrame = 0;
      let visible = true;
      let width = 0;
      let height = 0;

      function draw(time) {
        variant.draw(lineCtx, art, width, height, time);
      }

      function stop() {
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
        lastFrame = 0;
      }

      function animate(timestamp) {
        frameId = requestAnimationFrame(animate);

        if (!lastFrame) {
          lastFrame = timestamp;
        }

        const elapsed = timestamp - lastFrame;
        if (elapsed < 1000 / 30) {
          return;
        }

        lastFrame = timestamp - (elapsed % (1000 / 30));
        draw((timestamp - origin) / 1000);
      }

      function start() {
        if (motionQuery.matches) {
          stop();
          draw(0);
          return;
        }

        if (!visible || !width || !height || frameId) {
          return;
        }

        origin = performance.now();
        lastFrame = 0;
        draw(0);
        frameId = requestAnimationFrame(animate);
      }

      function resize() {
        const rect = lineCanvas.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        lineCanvas.width = Math.round(width * ratio);
        lineCanvas.height = Math.round(height * ratio);
        lineCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

        art = variant.build(width, height, mulberry32(seed * 0x9e3779b1));
        stop();
        start();
      }

      new ResizeObserver(resize).observe(lineCanvas);

      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;

        if (visible) {
          start();
        } else {
          stop();
        }
      }).observe(lineCanvas);

      if (motionQuery.addEventListener) {
        motionQuery.addEventListener("change", start);
      } else {
        motionQuery.addListener(start);
      }

      resize();
    }
  }

  // Fixed pixel units keep each pattern the same scale in both axes whatever the box.
  function buildFlow(width, height, random) {
    const spacing = 9;
    const lines = [];

    for (let index = -1; index < Math.ceil(height / spacing) + 2; index += 1) {
      lines.push({
        y: (index + 0.5) * spacing,
        wavelength: randomBetween(random, 160, 420),
        amplitude: randomBetween(random, 2, 9),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 0.08, 0.28),
        tilt: randomBetween(random, -0.05, 0.05),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.3, 0.8),
        dash: random() < 0.4 ? [randomBetween(random, 6, 30), randomBetween(random, 4, 20)] : []
      });
    }

    return lines;
  }

  function drawFlow(ctx, lines, width, height, time) {
    ctx.lineWidth = 1;

    for (const line of lines) {
      ctx.globalAlpha = line.alpha;
      ctx.strokeStyle = line.color;
      ctx.setLineDash(line.dash);
      ctx.beginPath();

      for (let x = 0; x <= width; x += 3) {
        const y =
          line.y +
          line.tilt * (x - width / 2) +
          line.amplitude * Math.sin((x / line.wavelength) * TAU + line.phase + time * line.speed) +
          0.35 *
            line.amplitude *
            Math.sin((x / (line.wavelength * 0.37)) * TAU + line.phase * 1.7 - time * line.speed);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    resetPen(ctx);
  }

  function buildRings(width, height, random) {
    const spacing = randomBetween(random, 12, 18);
    const maxRadius = Math.hypot(width, height) / 2 + spacing;
    const rings = [];

    for (let radius = spacing; radius < maxRadius; radius += spacing) {
      rings.push({
        radius,
        wobble: randomBetween(random, 0.02, 0.09),
        harmonics: Math.round(randomBetween(random, 2, 6)),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, -0.12, 0.12),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.22, 0.6),
        dash: random() < 0.3 ? [randomBetween(random, 5, 24), randomBetween(random, 4, 16)] : []
      });
    }

    return rings;
  }

  function drawRings(ctx, rings, width, height, time) {
    const cx = width / 2;
    const cy = height / 2;
    ctx.lineWidth = 1;

    for (const ring of rings) {
      ctx.globalAlpha = ring.alpha;
      ctx.strokeStyle = ring.color;
      ctx.setLineDash(ring.dash);
      ctx.beginPath();

      for (let step = 0; step <= 160; step += 1) {
        const angle = (step / 160) * TAU;
        const radius =
          ring.radius *
          (1 +
            ring.wobble * Math.sin(angle * ring.harmonics + ring.phase + time * ring.speed) +
            0.4 * ring.wobble * Math.sin(angle * 3 - time * ring.speed));
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    resetPen(ctx);
  }

  function buildRays(width, height, random) {
    const count = Math.max(40, Math.round(width / 8));
    const spread = Math.PI * 0.94;
    const rays = [];

    for (let index = 0; index < count; index += 1) {
      rays.push({
        angle: -Math.PI / 2 + spread * (index / (count - 1) - 0.5),
        length: Math.hypot(width, height) * randomBetween(random, 0.6, 1),
        bend: randomBetween(random, -22, 22),
        phase: randomBetween(random, 0, TAU),
        sway: randomBetween(random, 0.004, 0.015),
        speed: randomBetween(random, 0.2, 0.7),
        drift: randomBetween(random, 20, 70),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.18, 0.55),
        dash: random() < 0.5 ? [randomBetween(random, 8, 30), randomBetween(random, 6, 22)] : []
      });
    }

    return rays;
  }

  function drawRays(ctx, rays, width, height, time) {
    const cx = width / 2;
    const cy = height * 1.05;
    ctx.lineWidth = 1;

    for (const ray of rays) {
      const angle = ray.angle + ray.sway * Math.sin(time * ray.speed + ray.phase);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.globalAlpha = ray.alpha;
      ctx.strokeStyle = ray.color;
      ctx.setLineDash(ray.dash);
      ctx.lineDashOffset = -time * ray.drift;
      ctx.beginPath();

      for (let step = 0; step <= 24; step += 1) {
        const distance = (step / 24) * ray.length;
        const bend = ray.bend * Math.sin((distance / ray.length) * TAU + ray.phase + time * 0.4);
        const x = cx + cos * distance - sin * bend;
        const y = cy + sin * distance + cos * bend;
        if (step === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    resetPen(ctx);
  }

  function buildRain(width, height, random) {
    const spacing = randomBetween(random, 8, 13);
    const drops = [];

    for (let x = spacing / 2; x < width; x += spacing) {
      drops.push({
        x: x + randomBetween(random, -2, 2),
        sway: randomBetween(random, 0.5, 3),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 20, 90),
        offset: randomBetween(random, 0, 400),
        dash: [randomBetween(random, 8, 48), randomBetween(random, 6, 36)],
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.2, 0.6)
      });
    }

    return drops;
  }

  function drawRain(ctx, drops, width, height, time) {
    ctx.lineWidth = 1;

    for (const drop of drops) {
      const x = drop.x + drop.sway * Math.sin(time * 0.5 + drop.phase);
      ctx.globalAlpha = drop.alpha;
      ctx.strokeStyle = drop.color;
      ctx.setLineDash(drop.dash);
      ctx.lineDashOffset = -(time * drop.speed + drop.offset);
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x, height + 20);
      ctx.stroke();
    }

    resetPen(ctx);
  }

  function buildMesh(width, height, random) {
    const rows = Math.max(6, Math.round(height / 26));
    const columns = Math.max(8, Math.round(width / 46));
    const horizontals = [];
    const verticals = [];

    for (let index = 0; index < rows; index += 1) {
      horizontals.push({
        offset: ((index + 0.5) / rows) * height,
        wavelength: randomBetween(random, 120, 320),
        amplitude: randomBetween(random, 3, 12),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 0.08, 0.25),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.2, 0.55)
      });
    }

    for (let index = 0; index < columns; index += 1) {
      verticals.push({
        offset: ((index + 0.5) / columns) * width,
        wavelength: randomBetween(random, 100, 260),
        amplitude: randomBetween(random, 3, 12),
        phase: randomBetween(random, 0, TAU),
        speed: randomBetween(random, 0.08, 0.25),
        color: COLORS[Math.floor(random() * COLORS.length)],
        alpha: randomBetween(random, 0.2, 0.55)
      });
    }

    return { horizontals, verticals };
  }

  function drawMesh(ctx, art, width, height, time) {
    ctx.lineWidth = 1;

    for (const line of art.horizontals) {
      ctx.globalAlpha = line.alpha;
      ctx.strokeStyle = line.color;
      ctx.setLineDash([]);
      ctx.beginPath();

      for (let x = 0; x <= width; x += 4) {
        const y =
          line.offset +
          line.amplitude * Math.sin((x / line.wavelength) * TAU + line.phase + time * line.speed) +
          0.3 *
            line.amplitude *
            Math.sin((x / (line.wavelength * 0.45)) * TAU - time * line.speed * 0.7);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    for (const line of art.verticals) {
      ctx.globalAlpha = line.alpha;
      ctx.strokeStyle = line.color;
      ctx.setLineDash([]);
      ctx.beginPath();

      for (let y = 0; y <= height; y += 4) {
        const x =
          line.offset +
          line.amplitude * Math.sin((y / line.wavelength) * TAU + line.phase - time * line.speed) +
          0.3 *
            line.amplitude *
            Math.sin((y / (line.wavelength * 0.45)) * TAU + time * line.speed * 0.7);
        if (y === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    resetPen(ctx);
  }

  function resetPen(ctx) {
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = 1;
  }
})();
