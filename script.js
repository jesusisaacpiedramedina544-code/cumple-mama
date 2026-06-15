import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const heartCanvas = document.querySelector("#heartCanvas");
const effectsCanvas = document.querySelector("#effectsCanvas");
const startUi = document.querySelector("#startUi");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x130008, 0.05);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.65, 19);

const renderer = new THREE.WebGLRenderer({
  canvas: heartCanvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const heartGroup = new THREE.Group();
scene.add(heartGroup);

const particleCount = 3300;
const positions = new Float32Array(particleCount * 3);
const basePositions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);
const randoms = new Float32Array(particleCount);
const randoms2 = new Float32Array(particleCount);
const scales = new Float32Array(particleCount);

const colorChoices = [
  "#ffffff",
  "#ffd1e5",
  "#ff9ccf",
  "#ff5cab",
  "#ff1b83",
  "#d90062",
  "#a7ffb1"
];

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);

  return {
    x: x * 0.43,
    y: y * 0.43 - 1.08
  };
}

for (let i = 0; i < particleCount; i++) {
  const t = Math.random() * Math.PI * 2;
  const p = heartPoint(t);
  const i3 = i * 3;
  const spread = Math.random() < 0.76 ? 0.16 : 0.62;

  const x = p.x + (Math.random() - 0.5) * spread;
  const y = p.y + (Math.random() - 0.5) * spread;
  const z = (Math.random() - 0.5) * 2.0 + Math.sin(t) * 0.28;

  positions[i3] = x;
  positions[i3 + 1] = y;
  positions[i3 + 2] = z;

  basePositions[i3] = x;
  basePositions[i3 + 1] = y;
  basePositions[i3 + 2] = z;

  randoms[i] = Math.random();
  randoms2[i] = Math.random();
  scales[i] = Math.random() * 0.35 + 0.1;

  const color = new THREE.Color(
    colorChoices[Math.floor(Math.random() * colorChoices.length)]
  );

  colors[i3] = color.r;
  colors[i3 + 1] = color.g;
  colors[i3 + 2] = color.b;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const particleMaterial = new THREE.PointsMaterial({
  size: isSmallScreen() ? 0.105 : 0.083,
  vertexColors: true,
  transparent: true,
  opacity: 0.96,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particleHeart = new THREE.Points(particleGeometry, particleMaterial);
heartGroup.add(particleHeart);

const heartShape = new THREE.Shape();
heartShape.moveTo(0, 0.8);
heartShape.bezierCurveTo(0, 1.45, -1.4, 1.68, -1.62, 0.46);
heartShape.bezierCurveTo(-1.84, -0.76, -0.52, -1.42, 0, -1.94);
heartShape.bezierCurveTo(0.52, -1.42, 1.84, -0.76, 1.62, 0.46);
heartShape.bezierCurveTo(1.4, 1.68, 0, 1.45, 0, 0.8);

const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
  depth: 0.72,
  bevelEnabled: true,
  bevelSize: 0.26,
  bevelThickness: 0.3,
  bevelSegments: 3
});
heartGeometry.center();

const heartMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff5bac,
  roughness: 0.14,
  metalness: 0.04,
  transmission: 0.22,
  thickness: 1.1,
  transparent: true,
  opacity: 0.86,
  clearcoat: 1,
  clearcoatRoughness: 0.08
});

const centerHeart = new THREE.Mesh(heartGeometry, heartMaterial);
centerHeart.scale.set(1.24, 1.24, 1.24);
centerHeart.position.set(0, -0.88, 1.15);
heartGroup.add(centerHeart);

const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff4fa1,
  transparent: true,
  opacity: 0.18,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const centerGlow = new THREE.Mesh(heartGeometry.clone(), glowMaterial);
centerGlow.scale.set(1.78, 1.78, 1.78);
centerGlow.position.copy(centerHeart.position);
heartGroup.add(centerGlow);

const starCount = 760;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;

  starPositions[i3] = (Math.random() - 0.5) * 36;
  starPositions[i3 + 1] = (Math.random() - 0.5) * 24;
  starPositions[i3 + 2] = -8 - Math.random() * 12;

  const color = new THREE.Color(
    colorChoices[Math.floor(Math.random() * colorChoices.length)]
  );

  starColors[i3] = color.r;
  starColors[i3 + 1] = color.g;
  starColors[i3 + 2] = color.b;
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsMaterial({
  size: isSmallScreen() ? 0.058 : 0.045,
  vertexColors: true,
  transparent: true,
  opacity: 0.78,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

scene.add(new THREE.AmbientLight(0xffffff, 0.68));

const pinkLight = new THREE.PointLight(0xff4c9d, 42, 35);
pinkLight.position.set(0, 2, 8);
scene.add(pinkLight);

const whiteLight = new THREE.PointLight(0xffffff, 14, 25);
whiteLight.position.set(-3, 4, 7);
scene.add(whiteLight);

let userRotationY = 0;
let targetRotationY = 0;
let cumulativeRotation = 0;
let lastPointerX = 0;
let isDragging = false;
let surpriseShown = false;

const turnsNeeded = Math.PI * 2 * 3;

heartCanvas.addEventListener("pointerdown", (event) => {
  if (surpriseShown) return;
  isDragging = true;
  lastPointerX = event.clientX;
  heartCanvas.setPointerCapture(event.pointerId);
});

heartCanvas.addEventListener("pointermove", (event) => {
  if (!isDragging || surpriseShown) return;

  const dx = event.clientX - lastPointerX;
  lastPointerX = event.clientX;

  const deltaRotation = dx * 0.018;
  targetRotationY += deltaRotation;
  cumulativeRotation += Math.abs(deltaRotation);

  if (cumulativeRotation >= turnsNeeded) {
    showSurprise();
  }
});

heartCanvas.addEventListener("pointerup", endDrag);
heartCanvas.addEventListener("pointercancel", endDrag);

function endDrag() {
  isDragging = false;
}

function showSurprise() {
  if (surpriseShown) return;
  surpriseShown = true;
  document.body.classList.add("surprise-open");
  startUi.setAttribute("aria-hidden", "true");
  startEffects();
}

const fx = effectsCanvas.getContext("2d");
let effectsRunning = false;
let confetti = [];
let fireworks = [];
let nextFireworkTime = 0;

function startEffects() {
  effectsRunning = true;
  confetti = createConfetti(190);
  fireworks = [];
  nextFireworkTime = 0;
}

function createConfetti(amount) {
  const pieces = [];
  const palette = ["#ffffff", "#ffd166", "#ff5cab", "#ff2e93", "#98ff98", "#7dd3fc", "#c084fc"];

  for (let i = 0; i < amount; i++) {
    pieces.push({
      x: Math.random() * effectsCanvas.width,
      y: -Math.random() * effectsCanvas.height,
      w: 5 + Math.random() * 8,
      h: 8 + Math.random() * 12,
      vx: -1.2 + Math.random() * 2.4,
      vy: 1.2 + Math.random() * 2.6,
      rotation: Math.random() * Math.PI * 2,
      spin: -0.12 + Math.random() * 0.24,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }

  return pieces;
}

function addFirework(x, y) {
  const palette = ["#ffffff", "#ffd166", "#ff5cab", "#ff2e93", "#98ff98", "#7dd3fc", "#c084fc"];
  const color = palette[Math.floor(Math.random() * palette.length)];
  const particles = [];
  const amount = 38 + Math.floor(Math.random() * 22);

  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 4.1;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.018,
      size: 1.5 + Math.random() * 2.7,
      color
    });
  }

  fireworks.push(particles);
}

function drawEffects(time) {
  fx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);

  if (!effectsRunning) return;

  for (const piece of confetti) {
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.rotation += piece.spin;

    if (piece.y > effectsCanvas.height + 30) {
      piece.y = -30 - Math.random() * effectsCanvas.height * 0.4;
      piece.x = Math.random() * effectsCanvas.width;
    }

    fx.save();
    fx.translate(piece.x, piece.y);
    fx.rotate(piece.rotation);
    fx.fillStyle = piece.color;
    fx.globalAlpha = 0.88;
    fx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    fx.restore();
  }

  if (time > nextFireworkTime) {
    const x = effectsCanvas.width * (0.18 + Math.random() * 0.64);
    const y = effectsCanvas.height * (0.18 + Math.random() * 0.46);
    addFirework(x, y);
    nextFireworkTime = time + 520 + Math.random() * 800;
  }

  fireworks = fireworks.filter((burst) => {
    let alive = false;

    for (const p of burst) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.025;
      p.life -= p.decay;

      if (p.life > 0) {
        alive = true;
        fx.beginPath();
        fx.fillStyle = p.color;
        fx.globalAlpha = Math.max(p.life, 0);
        fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fx.fill();
      }
    }

    fx.globalAlpha = 1;
    return alive;
  });
}

const clock = new THREE.Clock();

function animate(time = 0) {
  const elapsed = clock.getElapsedTime();
  const pos = particleGeometry.attributes.position.array;

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const baseX = basePositions[i3];
    const baseY = basePositions[i3 + 1];
    const baseZ = basePositions[i3 + 2];

    const pulse = Math.sin(elapsed * 2.2 + randoms[i] * 8.0) * 0.18;
    const wave = Math.sin(elapsed * 1.4 + randoms2[i] * 10.0) * scales[i];

    pos[i3] = baseX + Math.sin(elapsed + randoms[i] * 12) * 0.11 + wave * 0.18;
    pos[i3 + 1] = baseY + Math.cos(elapsed * 1.2 + randoms[i] * 6) * 0.11 + pulse;
    pos[i3 + 2] = baseZ + Math.sin(elapsed * 1.8 + randoms2[i] * 7) * 0.35;
  }

  particleGeometry.attributes.position.needsUpdate = true;

  userRotationY += (targetRotationY - userRotationY) * 0.12;

  const idleRotation = surpriseShown ? elapsed * 0.2 : Math.sin(elapsed * 0.35) * 0.22;
  heartGroup.rotation.y = userRotationY + idleRotation;
  heartGroup.rotation.z = Math.sin(elapsed * 0.2) * 0.055;

  centerHeart.rotation.y = elapsed * 0.62;
  centerHeart.rotation.x = Math.sin(elapsed * 0.8) * 0.18;
  centerHeart.position.y = -0.88 + Math.sin(elapsed * 1.5) * 0.15;

  centerGlow.rotation.copy(centerHeart.rotation);
  centerGlow.position.copy(centerHeart.position);
  centerGlow.scale.setScalar(1.77 + Math.sin(elapsed * 2.2) * 0.09);

  stars.rotation.y = elapsed * 0.025;
  stars.rotation.z = elapsed * 0.012;

  pinkLight.intensity = 40 + Math.sin(elapsed * 2) * 4;

  renderer.render(scene, camera);
  drawEffects(time);

  requestAnimationFrame(animate);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  effectsCanvas.width = Math.floor(width * Math.min(window.devicePixelRatio, 2));
  effectsCanvas.height = Math.floor(height * Math.min(window.devicePixelRatio, 2));
  effectsCanvas.style.width = `${width}px`;
  effectsCanvas.style.height = `${height}px`;
  fx.setTransform(
    Math.min(window.devicePixelRatio, 2),
    0,
    0,
    Math.min(window.devicePixelRatio, 2),
    0,
    0
  );

  particleMaterial.size = isSmallScreen() ? 0.105 : 0.083;
  starMaterial.size = isSmallScreen() ? 0.058 : 0.045;
}

function isSmallScreen() {
  return window.innerWidth <= 600;
}

window.addEventListener("resize", resize);
resize();
animate();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // La app sigue funcionando aunque el service worker no se registre.
    });
  });
}
