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

let rotation = 0;
let rotationTarget = 0;
let totalRotation = 0;
let dragging = false;
let lastX = 0;
let surpriseOpen = false;

const THREE_TURNS = Math.PI * 2 * 3;

const QUALITY = {
  dprCap: 1.25,
  heartPoints: 180,
  trails: 34,
  dots: 85,
  rays: 42,
  stars: 70,
  confetti: 95,
  fireworksParticles: 36
};

let heartPath = [];
let trails = [];
let dots = [];
let rays = [];
let stars = [];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, QUALITY.dprCap);
  w = window.innerWidth;
  h = window.innerHeight;
  cx = w / 2;
  cy = h * 0.44;
  scale = Math.min(w, h) * (w < 560 ? 0.031 : 0.036);

  for (const canvas of [heartCanvas, effectsCanvas]) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildScene();
}

function heartFormula(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}

function buildScene() {
  heartPath = [];
  trails = [];
  dots = [];
  rays = [];
  stars = [];

  for (let i = 0; i < QUALITY.heartPoints; i++) {
    const t = (i / QUALITY.heartPoints) * Math.PI * 2;
    const p = heartFormula(t);
    heartPath.push({ t, x: p.x, y: p.y });
  }

  for (let i = 0; i < QUALITY.trails; i++) {
    trails.push({
      t: Math.random() * Math.PI * 2,
      speed: (0.004 + Math.random() * 0.009) * (Math.random() < 0.5 ? -1 : 1),
      len: 0.35 + Math.random() * 0.95,
      z: 2 + Math.random() * 9,
      width: 0.7 + Math.random() * 1.35,
      alpha: 0.22 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < QUALITY.dots; i++) {
    dots.push({
      t: Math.random() * Math.PI * 2,
      speed: (0.003 + Math.random() * 0.009) * (Math.random() < 0.5 ? -1 : 1),
      size: 0.9 + Math.random() * 2.1,
      alpha: 0.25 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      z: 2 + Math.random() * 10
    });
  }

  for (let i = 0; i < QUALITY.rays; i++) {
    rays.push({
      angle: Math.random() * Math.PI * 2,
      length: Math.min(w, h) * (0.2 + Math.random() * 0.55),
      speed: 0.00012 + Math.random() * 0.00024,
      alpha: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < QUALITY.stars; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.45 + Math.random() * 1.2,
      alpha: 0.08 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function project(x, y, z, rot) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;
  const p = 1 / (1 + rz * 0.022);

  return {
    x: cx + rx * scale * p,
    y: cy + y * scale * p,
    p
  };
}

function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawFrame(time = 0) {
  const elapsed = time - startTime;
  const reveal = Math.min(1, elapsed / 2200);
  const smoothReveal = 1 - Math.pow(1 - reveal, 3);

  rotation += (rotationTarget - rotation) * 0.14;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0, 0, 0, 0.23)";
  ctx.fillRect(0, 0, w, h);

  drawBackground(time);
  drawRays(time, smoothReveal);
  drawHeartBase(time, smoothReveal);
  drawTrails(time, smoothReveal);
  drawCenterHeart(time, smoothReveal);
  drawDots(time, smoothReveal);
  drawCore(time, smoothReveal);
  drawPartyEffects(time);

  requestAnimationFrame(drawFrame);
}

function drawBackground(time) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45);
  g.addColorStop(0, "rgba(255, 0, 55, 0.23)");
  g.addColorStop(0.34, "rgba(70, 0, 16, 0.08)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    const blink = 0.65 + Math.sin(time * 0.002 + s.phase) * 0.35;
    ctx.beginPath();
    ctx.fillStyle = rgba(255, 45, 85, s.alpha * blink);
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRays(time, reveal) {
  const initialFade = Math.max(0.15, 1 - (time - startTime) / 3600);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const r of rays) {
    const a = r.angle + time * r.speed;
    const len = r.length * (0.3 + reveal * 0.8);
    const sx = cx + Math.cos(a) * 5;
    const sy = cy + Math.sin(a) * 5;
    const ex = cx + Math.cos(a) * len;
    const ey = cy + Math.sin(a) * len;

    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, rgba(255, 45, 82, r.alpha * initialFade));
    grad.addColorStop(1, "rgba(255, 0, 45, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHeartBase(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let layer = 0; layer < 3; layer++) {
    const mult = 0.93 + layer * 0.035 + Math.sin(time * 0.001 + layer) * 0.006;

    ctx.beginPath();

    for (let i = 0; i <= heartPath.length; i++) {
      const p = heartPath[i % heartPath.length];
      const z = Math.sin(p.t * 2 + time * 0.0007 + layer) * (4 + layer * 2);
      const pr = project(p.x * mult, p.y * mult, z, rotation);

      const x = cx + (pr.x - cx) * reveal;
      const y = cy + (pr.y - cy) * reveal;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.strokeStyle = rgba(255, 0, 48, 0.12 + layer * 0.055);
    ctx.lineWidth = 9 - layer * 2.5;
    ctx.stroke();

    ctx.strokeStyle = rgba(255, 36, 78, 0.26 + layer * 0.08);
    ctx.lineWidth = 1.3 + layer * 0.35;
    ctx.stroke();
  }

  ctx.restore();
}

function drawTrails(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const tr of trails) {
    tr.t += tr.speed;

    const steps = 12;
    ctx.beginPath();

    for (let i = 0; i < steps; i++) {
      const k = i / (steps - 1);
      const t = tr.t + k * tr.len;
      const hp = heartFormula(t);
      const wobble = Math.sin(t * 6 + time * 0.002 + tr.phase) * 0.16;
      const z = Math.sin(t * 3 + tr.phase) * tr.z;
      const pr = project(hp.x + wobble, hp.y, z, rotation);

      const x = cx + (pr.x - cx) * reveal;
      const y = cy + (pr.y - cy) * reveal;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = rgba(255, 0, 45, tr.alpha * 0.22);
    ctx.lineWidth = tr.width * 5;
    ctx.stroke();

    ctx.strokeStyle = rgba(255, 36, 78, tr.alpha);
    ctx.lineWidth = tr.width;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCenterHeart(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const pulse = 0.96 + Math.sin(time * 0.0045) * 0.05;
  const heartSize = scale * 0.28 * pulse;
  const yOffset = scale * 0.35;
  const rot = Math.sin(time * 0.0012) * 0.06 + rotation * 0.12;

  ctx.translate(cx, cy + yOffset);
  ctx.rotate(rot);

  // Glow exterior
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const p = heartFormula(t);
    const x = p.x * heartSize * 1.18;
    const y = p.y * heartSize * 1.18;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(255, 0, 50, 0.22 * reveal);
  ctx.fill();

  // Corazón principal
  const g = ctx.createRadialGradient(0, -heartSize * 0.3, 0, 0, 0, heartSize * 10);
  g.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  g.addColorStop(0.18, "rgba(255, 126, 158, 0.85)");
  g.addColorStop(0.5, "rgba(255, 35, 85, 0.72)");
  g.addColorStop(1, "rgba(210, 0, 52, 0.68)");

  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const p = heartFormula(t);
    const x = p.x * heartSize;
    const y = p.y * heartSize;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();

  // Borde luminoso
  ctx.strokeStyle = rgba(255, 235, 242, 0.75 * reveal);
  ctx.lineWidth = Math.max(1.5, heartSize * 0.18);
  ctx.stroke();

  // Brillo interno
  ctx.beginPath();
  ctx.ellipse(-heartSize * 1.2, -heartSize * 1.45, heartSize * 1.1, heartSize * 0.55, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fill();

  ctx.restore();
}

function drawDots(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const d of dots) {
    d.t += d.speed;

    const hp = heartFormula(d.t);
    const z = Math.sin(d.t * 3 + d.phase) * d.z;
    const pr = project(hp.x, hp.y, z, rotation);
    const pulse = 0.55 + Math.sin(time * 0.005 + d.phase) * 0.25 + 0.2;

    const x = cx + (pr.x - cx) * reveal;
    const y = cy + (pr.y - cy) * reveal;
    const r = d.size * pr.p * pulse;

    ctx.beginPath();
    ctx.fillStyle = rgba(255, 34, 78, d.alpha * reveal);
    ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = d.alpha > 0.78
      ? rgba(255, 245, 248, d.alpha * reveal)
      : rgba(255, 48, 88, d.alpha * reveal);
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCore(time, reveal) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const pulse = 0.85 + Math.sin(time * 0.005) * 0.15;
  const radius = Math.min(w, h) * 0.08 * pulse * (0.7 + reveal * 0.3);

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.6);
  g.addColorStop(0, "rgba(255, 255, 255, 0.75)");
  g.addColorStop(0.13, "rgba(255, 64, 100, 0.58)");
  g.addColorStop(0.45, "rgba(255, 0, 50, 0.25)");
  g.addColorStop(1, "rgba(255, 0, 50, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.6, 0, Math.PI * 2);
  ctx.fill();

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

  const delta = dx * 0.02;
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

let party = false;
let confetti = [];
let fireworks = [];
let nextFirework = 0;

function startParty() {
  party = true;
  confetti = [];
  fireworks = [];

  const palette = ["#ffffff", "#ffd166", "#ff336d", "#ff0f52", "#7dd3fc", "#a7ff83", "#c084fc"];

  for (let i = 0; i < QUALITY.confetti; i++) {
    confetti.push({
      x: Math.random() * w,
      y: -Math.random() * h,
      ww: 5 + Math.random() * 8,
      hh: 8 + Math.random() * 13,
      vx: -1.2 + Math.random() * 2.4,
      vy: 1.4 + Math.random() * 2.7,
      rot: Math.random() * Math.PI * 2,
      spin: -0.14 + Math.random() * 0.28,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      addFirework(w * (0.18 + Math.random() * 0.64), h * (0.16 + Math.random() * 0.42));
    }, i * 280);
  }
}

function addFirework(x, y) {
  const palette = ["#ffffff", "#ffd166", "#ff336d", "#ff0f52", "#7dd3fc", "#a7ff83", "#c084fc"];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const parts = [];

  for (let i = 0; i < QUALITY.fireworksParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 4.1;

    parts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.014 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2.7,
      color
    });
  }

  fireworks.push(parts);
}

function drawPartyEffects(time) {
  fx.clearRect(0, 0, w, h);
  if (!party) return;

  for (const c of confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.spin;

    if (c.y > h + 35) {
      c.y = -35 - Math.random() * h * 0.25;
      c.x = Math.random() * w;
    }

    fx.save();
    fx.translate(c.x, c.y);
    fx.rotate(c.rot);
    fx.globalAlpha = 0.86;
    fx.fillStyle = c.color;
    fx.fillRect(-c.ww / 2, -c.hh / 2, c.ww, c.hh);
    fx.restore();
  }

  fx.globalCompositeOperation = "lighter";

  if (time > nextFirework) {
    addFirework(w * (0.18 + Math.random() * 0.64), h * (0.16 + Math.random() * 0.46));
    nextFirework = time + 850 + Math.random() * 950;
  }

  fireworks = fireworks.filter((burst) => {
    let alive = false;

    for (const p of burst) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.026;
      p.life -= p.decay;

      if (p.life > 0) {
        alive = true;
        fx.beginPath();
        fx.globalAlpha = Math.max(p.life, 0);
        fx.fillStyle = p.color;
        fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fx.fill();
      }
    }

    fx.globalAlpha = 1;
    return alive;
  });

  fx.globalCompositeOperation = "source-over";
}

window.addEventListener("resize", resize);
resize();

ctx.fillStyle = "#000";
ctx.fillRect(0, 0, w, h);
requestAnimationFrame(drawFrame);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
