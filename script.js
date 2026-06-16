const heartCanvas = document.getElementById("heartCanvas");
const effectsCanvas = document.getElementById("effectsCanvas");
const intro = document.getElementById("intro");

const ctx = heartCanvas.getContext("2d", { alpha: true });
const fx = effectsCanvas.getContext("2d", { alpha: true });

let w = 0;
let h = 0;
let dpr = 1;
let cx = 0;
let cy = 0;
let scale = 1;

let startTime = performance.now();
let firstFrame = true;

let rotation = 0;
let rotationTarget = 0;
let totalRotation = 0;
let dragging = false;
let lastX = 0;
let surpriseOpen = false;

const THREE_TURNS = Math.PI * 2 * 3;

let orbitLines = [];
let glowingDots = [];
let backgroundStars = [];
let burstRays = [];
let dust = [];

const red = {
  deep: "rgba(255, 0, 45, 1)",
  bright: "rgba(255, 28, 75, 1)",
  soft: "rgba(255, 80, 122, 1)",
  white: "rgba(255, 246, 248, 1)"
};

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  cx = w / 2;
  cy = h * 0.46;
  scale = Math.min(w, h) * (w < 560 ? 0.032 : 0.037);

  for (const canvas of [heartCanvas, effectsCanvas]) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildScene();
  firstFrame = true;
}

function buildScene() {
  orbitLines = [];
  glowingDots = [];
  backgroundStars = [];
  burstRays = [];
  dust = [];

  const lineCount = w < 560 ? 78 : 125;
  for (let i = 0; i < lineCount; i++) {
    orbitLines.push({
      start: Math.random() * Math.PI * 2,
      speed: (0.0025 + Math.random() * 0.0065) * (Math.random() < 0.5 ? -1 : 1),
      length: 0.34 + Math.random() * 1.1,
      steps: 16 + Math.floor(Math.random() * 18),
      zAmp: 3 + Math.random() * 11,
      jitter: 0.06 + Math.random() * 0.36,
      alpha: 0.09 + Math.random() * 0.36,
      width: 0.45 + Math.random() * 1.35,
      phase: Math.random() * Math.PI * 2,
      layer: Math.random()
    });
  }

  const dotCount = w < 560 ? 180 : 290;
  for (let i = 0; i < dotCount; i++) {
    glowingDots.push({
      t: Math.random() * Math.PI * 2,
      speed: (0.002 + Math.random() * 0.01) * (Math.random() < 0.5 ? -1 : 1),
      zAmp: 4 + Math.random() * 13,
      phase: Math.random() * Math.PI * 2,
      size: 0.65 + Math.random() * 2.25,
      alpha: 0.2 + Math.random() * 0.78
    });
  }

  const starCount = w < 560 ? 95 : 150;
  for (let i = 0; i < starCount; i++) {
    backgroundStars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.35 + Math.random() * 1.3,
      a: 0.07 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2
    });
  }

  const rayCount = w < 560 ? 75 : 120;
  for (let i = 0; i < rayCount; i++) {
    burstRays.push({
      angle: Math.random() * Math.PI * 2,
      length: Math.min(w, h) * (0.15 + Math.random() * 0.75),
      speed: 0.5 + Math.random() * 2.4,
      width: 0.45 + Math.random() * 1.3,
      alpha: 0.18 + Math.random() * 0.64,
      phase: Math.random() * Math.PI * 2
    });
  }

  const dustCount = w < 560 ? 90 : 145;
  for (let i = 0; i < dustCount; i++) {
    dust.push({
      t: Math.random() * Math.PI * 2,
      radial: 0.08 + Math.random() * 1.25,
      speed: 0.0008 + Math.random() * 0.0025,
      size: 0.45 + Math.random() * 1.55,
      alpha: 0.08 + Math.random() * 0.36,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function project(x, y, z, rot) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;
  const perspective = 1 / (1 + rz * 0.022);

  return {
    x: cx + rx * scale * perspective,
    y: cy + y * scale * perspective,
    z: rz,
    p: perspective
  };
}

function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawScene(time) {
  const elapsed = time - startTime;
  const reveal = easeOutCubic(clamp(elapsed / 3300, 0, 1));
  rotation += (rotationTarget - rotation) * 0.13;

  if (firstFrame) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    firstFrame = false;
  } else {
    // La clave para que se parezca al video: no limpiar totalmente,
    // sino dejar rastro luminoso que se va desvaneciendo.
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.fillRect(0, 0, w, h);
  }

  drawBackgroundGlow(time, reveal);
  drawInitialBurst(time, reveal);
  drawDust(time, reveal);
  drawHeartSilhouette(time, reveal);
  drawOrbitLines(time, reveal);
  drawHotCore(time, reveal);
  drawGlowingDots(time, reveal);
  drawPartyEffects(time);

  requestAnimationFrame(drawScene);
}

function drawBackgroundGlow(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const s of backgroundStars) {
    const blink = 0.5 + Math.sin(time * 0.002 + s.phase) * 0.5;
    ctx.beginPath();
    ctx.fillStyle = rgba(255, 40, 80, s.a * (0.4 + blink * 0.6));
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
  g.addColorStop(0, rgba(255, 0, 48, 0.34 + reveal * 0.08));
  g.addColorStop(0.18, rgba(255, 0, 48, 0.12));
  g.addColorStop(0.55, rgba(90, 0, 18, 0.04));
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

function drawInitialBurst(time, reveal) {
  const elapsed = time - startTime;
  const fade = clamp(1 - elapsed / 3600, 0, 1);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const r of burstRays) {
    const pulse = 0.75 + Math.sin(time * 0.004 + r.phase) * 0.25;
    const currentLength = r.length * (0.25 + reveal * 0.92) * pulse;
    const drift = elapsed * 0.00012 * r.speed;
    const a = r.angle + drift;

    const sx = cx + Math.cos(a) * 4;
    const sy = cy + Math.sin(a) * 4;
    const ex = cx + Math.cos(a) * currentLength;
    const ey = cy + Math.sin(a) * currentLength;

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, rgba(255, 255, 255, 0.25 * fade));
    grad.addColorStop(0.08, rgba(255, 0, 54, r.alpha * fade));
    grad.addColorStop(1, "rgba(255, 0, 44, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = r.width;
    ctx.shadowColor = "rgba(255, 0, 44, 0.95)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDust(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(255, 0, 55, 0.85)";
  ctx.shadowBlur = 10;

  for (const p of dust) {
    p.t += p.speed;
    const hp = heartPoint(p.t);
    const z = Math.sin(p.t * 3 + p.phase) * 7;
    const pr = project(hp.x * p.radial, hp.y * p.radial, z, rotation);
    const mixX = cx + (pr.x - cx) * reveal;
    const mixY = cy + (pr.y - cy) * reveal;
    const breathe = 0.55 + Math.sin(time * 0.003 + p.phase) * 0.45;

    ctx.beginPath();
    ctx.fillStyle = rgba(255, 35, 78, p.alpha * breathe * (0.35 + reveal * 0.65));
    ctx.arc(mixX, mixY, p.size * pr.p, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHeartSilhouette(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Contornos base que dan forma al corazón del video.
  for (let layer = 0; layer < 7; layer++) {
    const phase = layer * 0.85 + time * 0.00055;
    const mult = 0.91 + layer * 0.025 + Math.sin(time * 0.001 + layer) * 0.006;
    const alpha = (0.035 + layer * 0.018) * reveal;
    const lineWidth = 1.2 + layer * 0.35;

    ctx.beginPath();

    const steps = 170;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const hp = heartPoint(t);
      const noise = Math.sin(t * 8 + phase) * 0.18 + Math.sin(t * 3 - phase) * 0.11;
      const z = Math.sin(t * 2 + phase) * (5.5 + layer * 1.2);

      const pr = project(
        hp.x * mult + noise,
        hp.y * mult + Math.cos(t * 5 + phase) * 0.09,
        z,
        rotation
      );

      const x = cx + (pr.x - cx) * reveal;
      const y = cy + (pr.y - cy) * reveal;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.strokeStyle = rgba(255, 16 + layer * 13, 62 + layer * 7, alpha);
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = "rgba(255, 0, 55, 1)";
    ctx.shadowBlur = 18 + layer * 3;
    ctx.stroke();
  }

  ctx.restore();
}

function drawOrbitLines(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const centerFade = 1 - reveal;

  for (const line of orbitLines) {
    line.start += line.speed;

    const steps = line.steps;
    const startT = line.start;
    const alphaPulse = 0.55 + Math.sin(time * 0.003 + line.phase) * 0.45;
    const alpha = line.alpha * (0.25 + reveal * 0.9) * (0.55 + alphaPulse * 0.75);

    // Trazo ancho y difuso
    ctx.beginPath();
    for (let i = 0; i < steps; i++) {
      const k = i / (steps - 1);
      const t = startT + k * line.length;
      const hp = heartPoint(t);

      const wobbleX = Math.sin(t * 9 + time * 0.002 + line.phase) * line.jitter;
      const wobbleY = Math.cos(t * 7 + time * 0.0015 + line.phase) * line.jitter * 0.7;
      const z = Math.sin(t * 3 + line.phase) * line.zAmp + Math.cos(t * 5 - line.phase) * 2.2;

      const pr = project(hp.x + wobbleX, hp.y + wobbleY, z, rotation);

      // En el arranque, las líneas nacen desde el centro como en el video.
      const x = cx + (pr.x - cx) * reveal + Math.cos(line.phase) * centerFade * 10;
      const y = cy + (pr.y - cy) * reveal + Math.sin(line.phase) * centerFade * 10;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = rgba(255, 0, 48, alpha * 0.38);
    ctx.lineWidth = line.width * 4.4;
    ctx.shadowColor = "rgba(255, 0, 52, 0.95)";
    ctx.shadowBlur = 22;
    ctx.stroke();

    // Trazo fino brillante
    ctx.strokeStyle = line.layer > 0.82
      ? rgba(255, 235, 238, alpha * 0.7)
      : rgba(255, 24, 72, alpha);
    ctx.lineWidth = line.width;
    ctx.shadowBlur = 8;
    ctx.stroke();
  }

  ctx.restore();
}

function drawHotCore(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const corePulse = 0.82 + Math.sin(time * 0.005) * 0.18;
  const radius = Math.min(w, h) * (0.035 + reveal * 0.028) * corePulse;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3.8);
  g.addColorStop(0, rgba(255, 255, 255, 0.9));
  g.addColorStop(0.08, rgba(255, 68, 98, 0.72));
  g.addColorStop(0.28, rgba(255, 0, 53, 0.4));
  g.addColorStop(1, "rgba(255, 0, 44, 0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Pequeño corazón central, como núcleo intenso.
  ctx.beginPath();
  const steps = 100;
  const small = scale * 0.24 * (0.7 + reveal * 0.45);
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const hp = heartPoint(t);
    const x = cx + hp.x * small;
    const y = cy + hp.y * small + scale * 0.4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(255, 0, 52, 0.28 + reveal * 0.25);
  ctx.shadowColor = "rgba(255, 0, 52, 1)";
  ctx.shadowBlur = 25;
  ctx.fill();

  ctx.restore();
}

function drawGlowingDots(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(255, 0, 52, 1)";
  ctx.shadowBlur = 16;

  for (const dot of glowingDots) {
    dot.t += dot.speed;
    const hp = heartPoint(dot.t);
    const z = Math.sin(dot.t * 3 + dot.phase) * dot.zAmp;
    const pr = project(
      hp.x + Math.sin(time * 0.002 + dot.phase) * 0.18,
      hp.y + Math.cos(time * 0.002 + dot.phase) * 0.12,
      z,
      rotation
    );

    const x = cx + (pr.x - cx) * reveal;
    const y = cy + (pr.y - cy) * reveal;
    const pulse = 0.45 + Math.sin(time * 0.006 + dot.phase) * 0.25 + 0.3;

    ctx.beginPath();
    ctx.fillStyle = dot.alpha > 0.85
      ? rgba(255, 244, 246, dot.alpha * pulse * reveal)
      : rgba(255, 28, 75, dot.alpha * pulse * reveal);
    ctx.arc(x, y, dot.size * pr.p, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

heartCanvas.addEventListener("pointerdown", (event) => {
  if (surpriseOpen) return;
  dragging = true;
  lastX = event.clientX;
  heartCanvas.setPointerCapture(event.pointerId);
});

heartCanvas.addEventListener("pointermove", (event) => {
  if (!dragging || surpriseOpen) return;

  const dx = event.clientX - lastX;
  lastX = event.clientX;

  const delta = dx * 0.019;
  rotationTarget += delta;
  totalRotation += Math.abs(delta);

  if (totalRotation >= THREE_TURNS) {
    openSurprise();
  }
});

heartCanvas.addEventListener("pointerup", () => dragging = false);
heartCanvas.addEventListener("pointercancel", () => dragging = false);

function openSurprise() {
  if (surpriseOpen) return;
  surpriseOpen = true;
  document.body.classList.add("surprise");
  intro.setAttribute("aria-hidden", "true");
  startParty();
}

// Confeti y fuegos artificiales
let party = false;
let confetti = [];
let fireworks = [];
let nextFirework = 0;

function startParty() {
  party = true;
  confetti = [];
  fireworks = [];

  const palette = ["#ffffff", "#ffd166", "#ff336d", "#ff0f52", "#7dd3fc", "#a7ff83", "#c084fc"];
  const amount = w < 560 ? 165 : 250;

  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: Math.random() * w,
      y: -Math.random() * h,
      w: 5 + Math.random() * 8,
      h: 8 + Math.random() * 14,
      vx: -1.35 + Math.random() * 2.7,
      vy: 1.45 + Math.random() * 3.2,
      rot: Math.random() * Math.PI * 2,
      spin: -0.16 + Math.random() * 0.32,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      addFirework(w * (0.16 + Math.random() * 0.68), h * (0.15 + Math.random() * 0.42));
    }, i * 240);
  }
}

function addFirework(x, y) {
  const palette = ["#ffffff", "#ffd166", "#ff336d", "#ff0f52", "#7dd3fc", "#a7ff83", "#c084fc"];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const parts = [];
  const amount = w < 560 ? 44 : 66;

  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 4.6;

    parts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2.9,
      color
    });
  }

  fireworks.push(parts);
}

function drawPartyEffects(time) {
  fx.clearRect(0, 0, w, h);
  if (!party) return;

  fx.save();

  for (const c of confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.spin;

    if (c.y > h + 35) {
      c.y = -35 - Math.random() * h * 0.3;
      c.x = Math.random() * w;
    }

    fx.save();
    fx.translate(c.x, c.y);
    fx.rotate(c.rot);
    fx.globalAlpha = 0.88;
    fx.fillStyle = c.color;
    fx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    fx.restore();
  }

  fx.globalCompositeOperation = "lighter";

  if (time > nextFirework) {
    addFirework(w * (0.16 + Math.random() * 0.68), h * (0.15 + Math.random() * 0.46));
    nextFirework = time + 620 + Math.random() * 820;
  }

  fireworks = fireworks.filter((burst) => {
    let alive = false;

    for (const p of burst) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.028;
      p.life -= p.decay;

      if (p.life > 0) {
        alive = true;
        fx.beginPath();
        fx.globalAlpha = Math.max(p.life, 0);
        fx.fillStyle = p.color;
        fx.shadowColor = p.color;
        fx.shadowBlur = 12;
        fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fx.fill();
      }
    }

    fx.globalAlpha = 1;
    fx.shadowBlur = 0;
    return alive;
  });

  fx.restore();
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(drawScene);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
