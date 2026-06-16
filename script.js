const artCanvas = document.getElementById("heartCanvas");
const fxCanvas = document.getElementById("effectsCanvas");
const intro = document.getElementById("intro");

const art = artCanvas.getContext("2d", { alpha: true });
const fx = fxCanvas.getContext("2d", { alpha: true });

let width = 0;
let height = 0;
let dpr = 1;
let centerX = 0;
let centerY = 0;
let heartScale = 1;

let points = [];
let sparks = [];
let ribbons = [];
let stars = [];

let pointerDown = false;
let lastX = 0;
let rotationTarget = 0;
let rotation = 0;
let totalRotation = 0;
let surprise = false;

const REQUIRED_TURNS = Math.PI * 2 * 3;

const colors = {
  red: "rgba(255, 18, 72, 1)",
  redSoft: "rgba(255, 52, 103, 1)",
  pink: "rgba(255, 88, 153, 1)",
  white: "rgba(255, 245, 250, 1)"
};

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  centerX = width / 2;
  centerY = height * 0.48;
  heartScale = Math.min(width, height) * (width < 560 ? 0.035 : 0.041);

  for (const canvas of [artCanvas, fxCanvas]) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  art.setTransform(dpr, 0, 0, dpr, 0, 0);
  fx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildHeart();
  buildStars();
}

function heartFormula(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);

  return { x, y: -y };
}

function buildHeart() {
  points = [];

  const total = width < 560 ? 950 : 1450;

  for (let i = 0; i < total; i++) {
    const t = (i / total) * Math.PI * 2;
    const p = heartFormula(t);

    const jitter = Math.random() * 0.85;
    const z = (Math.random() - 0.5) * 13 + Math.sin(t * 3) * 2.4;

    points.push({
      x: p.x + (Math.random() - 0.5) * jitter,
      y: p.y + (Math.random() - 0.5) * jitter,
      z,
      t,
      phase: Math.random() * Math.PI * 2,
      size: 0.9 + Math.random() * 1.8,
      alpha: 0.3 + Math.random() * 0.7
    });
  }

  sparks = [];
  const sparkCount = width < 560 ? 135 : 210;
  for (let i = 0; i < sparkCount; i++) {
    sparks.push(makeSpark(true));
  }

  ribbons = [];
  const ribbonCount = width < 560 ? 45 : 72;
  for (let i = 0; i < ribbonCount; i++) {
    ribbons.push(makeRibbon());
  }
}

function buildStars() {
  stars = [];
  const count = width < 560 ? 80 : 130;

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.35,
      alpha: Math.random() * 0.5 + 0.08,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function makeSpark(randomPosition = false) {
  const p = points[Math.floor(Math.random() * points.length)];
  const startFromCenter = !randomPosition || Math.random() < 0.45;

  return {
    base: p,
    progress: startFromCenter ? Math.random() * 0.2 : Math.random(),
    speed: 0.003 + Math.random() * 0.008,
    orbit: Math.random() * Math.PI * 2,
    orbitSpeed: 0.015 + Math.random() * 0.026,
    size: 1.1 + Math.random() * 2.8,
    life: Math.random() * 0.8 + 0.2,
    color: Math.random() < 0.82 ? colors.redSoft : colors.white
  };
}

function makeRibbon() {
  return {
    start: Math.random() * Math.PI * 2,
    length: 0.55 + Math.random() * 1.2,
    speed: 0.004 + Math.random() * 0.012,
    phase: Math.random() * Math.PI * 2,
    width: 0.6 + Math.random() * 1.4,
    alpha: 0.15 + Math.random() * 0.34
  };
}

function project(x, y, z, rot) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;

  const perspective = 1 / (1 + rz * 0.018);
  const px = centerX + rx * heartScale * perspective;
  const py = centerY + y * heartScale * perspective;

  return { x: px, y: py, scale: perspective, z: rz };
}

function drawBackground(time) {
  const gradient = art.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.62);
  gradient.addColorStop(0, "rgba(55, 0, 18, 0.52)");
  gradient.addColorStop(0.34, "rgba(11, 0, 9, 0.96)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

  art.fillStyle = gradient;
  art.fillRect(0, 0, width, height);

  for (const s of stars) {
    const blink = Math.sin(time * 0.0017 + s.phase) * 0.22 + 0.78;
    art.beginPath();
    art.fillStyle = `rgba(255, 110, 156, ${s.alpha * blink})`;
    art.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    art.fill();
  }

  // Resplandor central, como el inicio explosivo del video.
  const core = art.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.24);
  core.addColorStop(0, "rgba(255, 0, 63, 0.48)");
  core.addColorStop(0.2, "rgba(255, 37, 95, 0.18)");
  core.addColorStop(1, "rgba(255, 0, 55, 0)");
  art.fillStyle = core;
  art.fillRect(0, 0, width, height);
}

function drawRays(time) {
  art.save();
  art.globalCompositeOperation = "lighter";

  const rayCount = width < 560 ? 50 : 70;

  for (let i = 0; i < rayCount; i++) {
    const a = (i / rayCount) * Math.PI * 2 + Math.sin(time * 0.00045 + i) * 0.25;
    const len = Math.min(width, height) * (0.15 + Math.random() * 0.003) + Math.sin(time * 0.001 + i) * Math.min(width, height) * 0.09;

    const sx = centerX + Math.cos(a) * 8;
    const sy = centerY + Math.sin(a) * 8;
    const ex = centerX + Math.cos(a) * len * 1.8;
    const ey = centerY + Math.sin(a) * len * 1.8;

    const grad = art.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, "rgba(255, 40, 86, 0.32)");
    grad.addColorStop(1, "rgba(255, 0, 51, 0)");

    art.strokeStyle = grad;
    art.lineWidth = 0.7;
    art.beginPath();
    art.moveTo(sx, sy);
    art.lineTo(ex, ey);
    art.stroke();
  }

  art.restore();
}

function drawHeartCloud(time) {
  art.save();
  art.globalCompositeOperation = "lighter";

  // Sombra/brillo exterior de la silueta
  art.shadowColor = "rgba(255, 0, 62, 0.96)";
  art.shadowBlur = 22;

  for (const p of points) {
    const pulse = Math.sin(time * 0.0032 + p.phase) * 0.55 + 0.55;
    const wobble = Math.sin(time * 0.0018 + p.phase) * 0.35;

    const pr = project(
      p.x + Math.sin(p.phase + time * 0.001) * 0.22,
      p.y + wobble * 0.08,
      p.z + Math.cos(p.phase + time * 0.0017) * 0.7,
      rotation
    );

    const edgeGlow = 0.45 + pulse * 0.55;
    const r = p.size * pr.scale * (0.7 + pulse * 0.5);

    art.beginPath();
    art.fillStyle = `rgba(255, ${Math.floor(18 + pulse * 95)}, ${Math.floor(70 + pulse * 70)}, ${p.alpha * edgeGlow * 0.44})`;
    art.arc(pr.x, pr.y, r, 0, Math.PI * 2);
    art.fill();
  }

  art.restore();
}

function drawRibbonLines(time) {
  art.save();
  art.globalCompositeOperation = "lighter";
  art.shadowColor = "rgba(255, 10, 60, 1)";
  art.shadowBlur = 16;

  for (const ribbon of ribbons) {
    ribbon.start += ribbon.speed;
    const steps = 24;
    art.beginPath();

    for (let i = 0; i < steps; i++) {
      const k = i / (steps - 1);
      const t = ribbon.start + k * ribbon.length;
      const p = heartFormula(t);

      const swirl = Math.sin(t * 5 + time * 0.002 + ribbon.phase) * 2.2;
      const z = Math.cos(t * 3 + ribbon.phase) * 9 + swirl;

      const pr = project(p.x, p.y, z, rotation);
      if (i === 0) art.moveTo(pr.x, pr.y);
      else art.lineTo(pr.x, pr.y);
    }

    art.strokeStyle = `rgba(255, 24, 72, ${ribbon.alpha})`;
    art.lineWidth = ribbon.width;
    art.stroke();
  }

  art.restore();
}

function drawFlyingSparks(time) {
  art.save();
  art.globalCompositeOperation = "lighter";
  art.shadowColor = "rgba(255, 38, 83, 0.95)";
  art.shadowBlur = 18;

  for (let i = 0; i < sparks.length; i++) {
    const s = sparks[i];
    s.progress += s.speed;
    s.orbit += s.orbitSpeed;

    if (s.progress >= 1) {
      sparks[i] = makeSpark(false);
      continue;
    }

    const p = s.base;
    const eased = 1 - Math.pow(1 - s.progress, 3);

    const target = project(
      p.x,
      p.y,
      p.z + Math.sin(s.orbit) * 3.3,
      rotation
    );

    const startX = centerX + Math.cos(s.orbit) * 18;
    const startY = centerY + Math.sin(s.orbit * 0.7) * 18;

    const x = startX + (target.x - startX) * eased;
    const y = startY + (target.y - startY) * eased;

    art.beginPath();
    art.fillStyle = s.color.replace("1)", `${0.85 * (1 - Math.abs(s.progress - 0.7) * 0.6)})`);
    art.arc(x, y, s.size * target.scale, 0, Math.PI * 2);
    art.fill();

    const tx = x - Math.cos(s.orbit) * 24;
    const ty = y - Math.sin(s.orbit) * 24;
    const grad = art.createLinearGradient(tx, ty, x, y);
    grad.addColorStop(0, "rgba(255, 0, 50, 0)");
    grad.addColorStop(1, "rgba(255, 45, 90, 0.55)");
    art.strokeStyle = grad;
    art.lineWidth = Math.max(0.7, s.size * 0.45);
    art.beginPath();
    art.moveTo(tx, ty);
    art.lineTo(x, y);
    art.stroke();
  }

  art.restore();
}

function drawCoreHeart(time) {
  art.save();
  art.globalCompositeOperation = "lighter";

  const pulse = 1 + Math.sin(time * 0.004) * 0.05;
  const smallScale = heartScale * 0.34 * pulse;

  art.translate(centerX, centerY + heartScale * 2.0);
  art.rotate(Math.sin(time * 0.0012) * 0.05);

  const grad = art.createRadialGradient(0, 0, 0, 0, 0, heartScale * 4.7);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.78)");
  grad.addColorStop(0.16, "rgba(255, 120, 160, 0.6)");
  grad.addColorStop(0.48, "rgba(255, 0, 62, 0.35)");
  grad.addColorStop(1, "rgba(255, 0, 62, 0)");

  art.fillStyle = grad;
  art.fillRect(-heartScale * 6, -heartScale * 6, heartScale * 12, heartScale * 12);

  art.beginPath();
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const p = heartFormula(t);
    const x = p.x * smallScale;
    const y = p.y * smallScale;
    if (i === 0) art.moveTo(x, y);
    else art.lineTo(x, y);
  }

  art.closePath();
  art.fillStyle = "rgba(255, 34, 91, 0.42)";
  art.shadowColor = "rgba(255, 45, 90, 1)";
  art.shadowBlur = 28;
  art.fill();

  art.restore();
}

function animate(time = 0) {
  rotation += (rotationTarget - rotation) * 0.13;

  drawBackground(time);
  drawRays(time);
  drawRibbonLines(time);
  drawHeartCloud(time);
  drawFlyingSparks(time);
  drawCoreHeart(time);
  drawEffects(time);

  requestAnimationFrame(animate);
}

artCanvas.addEventListener("pointerdown", (event) => {
  if (surprise) return;
  pointerDown = true;
  lastX = event.clientX;
  artCanvas.setPointerCapture(event.pointerId);
});

artCanvas.addEventListener("pointermove", (event) => {
  if (!pointerDown || surprise) return;

  const dx = event.clientX - lastX;
  lastX = event.clientX;

  const delta = dx * 0.019;
  rotationTarget += delta;
  totalRotation += Math.abs(delta);

  if (totalRotation >= REQUIRED_TURNS) {
    openSurprise();
  }
});

artCanvas.addEventListener("pointerup", () => pointerDown = false);
artCanvas.addEventListener("pointercancel", () => pointerDown = false);

function openSurprise() {
  if (surprise) return;
  surprise = true;
  document.body.classList.add("surprise");
  intro.setAttribute("aria-hidden", "true");
  startParty();
}

// Efectos de confeti y fuegos artificiales
let party = false;
let confetti = [];
let fireworks = [];
let nextFirework = 0;

function startParty() {
  party = true;
  confetti = [];
  fireworks = [];

  const amount = width < 560 ? 150 : 230;
  const palette = ["#ffffff", "#ffd166", "#ff5cab", "#ff1f78", "#7dd3fc", "#a7ff83", "#c084fc"];

  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: Math.random() * width,
      y: -Math.random() * height,
      w: 5 + Math.random() * 8,
      h: 8 + Math.random() * 14,
      vx: -1.4 + Math.random() * 2.8,
      vy: 1.4 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2,
      spin: -0.16 + Math.random() * 0.32,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      addFirework(width * (0.18 + Math.random() * 0.64), height * (0.16 + Math.random() * 0.42));
    }, i * 260);
  }
}

function addFirework(x, y) {
  const palette = ["#ffffff", "#ffd166", "#ff5cab", "#ff1f78", "#7dd3fc", "#a7ff83", "#c084fc"];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const parts = [];
  const amount = width < 560 ? 42 : 62;

  for (let i = 0; i < amount; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1.4 + Math.random() * 4.5;

    parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      decay: 0.012 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 2.8,
      color
    });
  }

  fireworks.push(parts);
}

function drawEffects(time) {
  fx.clearRect(0, 0, width, height);

  if (!party) return;

  fx.save();
  fx.globalCompositeOperation = "source-over";

  for (const c of confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.spin;

    if (c.y > height + 35) {
      c.y = -35 - Math.random() * height * 0.3;
      c.x = Math.random() * width;
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
    addFirework(width * (0.18 + Math.random() * 0.64), height * (0.16 + Math.random() * 0.46));
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
animate();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
