/* ═══════════════════════════════════════════════════════════
   ASTRA — main.js
   Three.js Scene + GSAP ScrollTrigger Orchestration
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────
   0. WAIT FOR DOM + LIBS
──────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);
  initNav();
  initTelemetryCounter();
  initCoords();
  const scene = initThreeScene();
  initHeroAnimations();
  initScrollTriggers(scene);
  initScrollReveal();
  initLaunchButton();
  initPipelineInteractivity();
});

/* ──────────────────────────────────────────────────────────
   1. CUSTOM CURSOR (Removed)
──────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────
   2. NAV REVEAL
──────────────────────────────────────────────────────────── */
function initNav() {
  const nav = document.getElementById('nav');
  setTimeout(() => nav.classList.add('visible'), 800);
}

/* ──────────────────────────────────────────────────────────
   3. TELEMETRY COUNTER
──────────────────────────────────────────────────────────── */
function initTelemetryCounter() {
  const el = document.getElementById('telem-targets');
  const target = 12400;
  let current = 0;

  const tick = () => {
    current += Math.ceil((target - current) / 14);
    if (current >= target) {
      el.textContent = target.toLocaleString();
      return;
    }
    el.textContent = current.toLocaleString();
    requestAnimationFrame(tick);
  };

  setTimeout(tick, 2200);
}

/* ──────────────────────────────────────────────────────────
   4. LIVE COORDS TICKER
──────────────────────────────────────────────────────────── */
function initCoords() {
  const raEl  = document.getElementById('nav-ra');
  const decEl = document.getElementById('nav-dec');
  let t = 0;

  setInterval(() => {
    t += 0.003;
    const ra_h  = Math.floor(((t * 4) % 24));
    const ra_m  = Math.floor((t * 60) % 60);
    const ra_s  = Math.floor((t * 3600) % 60);
    const dec_d = Math.floor(Math.abs(Math.sin(t * 0.2) * 45));
    const dec_m = Math.floor((t * 120) % 60);
    raEl.textContent  = `AR ${String(ra_h).padStart(2,'0')}h ${String(ra_m).padStart(2,'0')}m ${String(ra_s).padStart(2,'0')}s`;
    decEl.textContent = `DEC +${String(dec_d).padStart(2,'0')}° ${String(dec_m).padStart(2,'0')}′`;
  }, 80);
}

/* ──────────────────────────────────────────────────────────
   5. THREE.JS SCENE
──────────────────────────────────────────────────────────── */
function initThreeScene() {
  const canvas   = document.getElementById('astra-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x040b14, 0.035);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 5);

  /* ── State exposed to scroll triggers ── */
  const state = {
    scrollProgress:   0,
    wireframeBlend:   0,
    cameraZ:          5,
    cameraY:          0,
    planetRotationY:  0,
  };

  /* ── Starfield ── */
  const stars = createStarfield();
  scene.add(stars);

  /* ── Distant nebula plane ── */
  const nebula = createNebula();
  scene.add(nebula);

  /* ── Planet ── */
  const { planetMesh, wireMesh, planetGroup } = createPlanet();
  scene.add(planetGroup);

  /* ── Orbital ring ── */
  const ring = createOrbitalRing();
  scene.add(ring);

  /* ── Light rig ── */
  const ambientLight = new THREE.AmbientLight(0x304c7a, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
  sunLight.position.set(8, 4, 6);
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x304c7a, 1.0);
  rimLight.position.set(-6, -2, -4);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xe06236, 0.8, 20);
  fillLight.position.set(-4, 2, 3);
  scene.add(fillLight);

  /* ── Resize handler ── */
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  /* ── Render loop ── */
  const clock = new THREE.Clock();
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    /* Slow planet rotation */
    planetGroup.rotation.y += 0.0012;
    ring.rotation.z         += 0.0004;
    nebula.rotation.z       += 0.00008;

    /* Subtle mouse parallax */
    planetGroup.position.x += (mouseX * 0.25 - planetGroup.position.x) * 0.03;
    planetGroup.position.y += (-mouseY * 0.15 - planetGroup.position.y) * 0.03;

    /* Stars hyper-advance on scroll */
    stars.rotation.z += 0.0001 + state.scrollProgress * 0.0004;
    stars.rotation.y += 0.00005;

    /* Wireframe blend */
    if (wireMesh.material.opacity !== state.wireframeBlend) {
      wireMesh.material.opacity += (state.wireframeBlend - wireMesh.material.opacity) * 0.05;
    }

    /* Camera lerp */
    camera.position.z += (state.cameraZ - camera.position.z) * 0.04;
    camera.position.y += (state.cameraY - camera.position.y) * 0.04;

    /* Subtle planet pulse */
    planetMesh.material.emissiveIntensity = 0.08 + Math.sin(elapsed * 0.7) * 0.03;

    renderer.render(scene, camera);
  }

  animate();

  return { camera, state, scene, planetMesh, wireMesh };
}

/* ── Starfield ── */
function createStarfield() {
  const count   = 8000;
  const geo     = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const colors    = new Float32Array(count * 3);

  const palette = [
    new THREE.Color(0xf4f5f7),
    new THREE.Color(0xd7a64b),
    new THREE.Color(0x7ec8e3),
    new THREE.Color(0xffd0b0),
  ];

  for (let i = 0; i < count; i++) {
    const r = 400 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 0.6 + Math.random() * 2.2;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

/* ── Nebula background plane ── */
function createNebula() {
  const geo = new THREE.PlaneGeometry(500, 500);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x304c7a,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -120;
  return mesh;
}

/* ── Planet ── */
function createPlanet() {
  const geo = new THREE.SphereGeometry(1.6, 96, 96);

  /* Solid planet material */
  const mat = new THREE.MeshStandardMaterial({
    color:            new THREE.Color(0x1a3055),
    roughness:        0.78,
    metalness:        0.12,
    emissive:         new THREE.Color(0x304c7a),
    emissiveIntensity: 0.08,
  });

  /* Procedurally displace with vertex shader trick — use displacement map via data texture */
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = (i % size) / size;
    const y = Math.floor(i / size) / size;
    const n = (
      fbm(x * 5, y * 5, 3) * 180 +
      fbm(x * 12 + 1.3, y * 12 + 0.7, 2) * 60 +
      Math.random() * 15
    );
    data[i * 4]     = n | 0;
    data[i * 4 + 1] = (n * 0.6 + fbm(x * 8, y * 8, 2) * 40) | 0;
    data[i * 4 + 2] = (n * 0.3) | 0;
    data[i * 4 + 3] = 255;
  }

  const dispTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  dispTex.needsUpdate = true;

  mat.displacementMap   = dispTex;
  mat.displacementScale = 0.18;
  mat.bumpMap           = dispTex;
  mat.bumpScale         = 0.5;

  /* Color variation via rough texture */
  const roughData = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = (i % size) / size;
    const y = Math.floor(i / size) / size;
    const v = (fbm(x * 6, y * 6, 4) * 220 + 35) | 0;
    roughData[i * 4]     = v;
    roughData[i * 4 + 1] = v;
    roughData[i * 4 + 2] = v;
    roughData[i * 4 + 3] = 255;
  }
  const roughTex = new THREE.DataTexture(roughData, size, size, THREE.RGBAFormat);
  roughTex.needsUpdate = true;
  mat.roughnessMap = roughTex;

  const planetMesh = new THREE.Mesh(geo, mat);

  /* Atmosphere glow shell */
  const atmoGeo = new THREE.SphereGeometry(1.72, 64, 64);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x304c7a,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);

  /* Wireframe overlay */
  const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.62, 32, 32));
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xd7a64b,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const wireMesh = new THREE.LineSegments(wireGeo, wireMat);

  /* Cloud layer */
  const cloudGeo = new THREE.SphereGeometry(1.66, 64, 64);
  const cloudData = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const x = (i % size) / size;
    const y = Math.floor(i / size) / size;
    const v = fbm(x * 4 + 2, y * 4 - 1, 5);
    const a = v > 0.52 ? ((v - 0.52) * 3 * 255) | 0 : 0;
    cloudData[i * 4]     = 220;
    cloudData[i * 4 + 1] = 230;
    cloudData[i * 4 + 2] = 255;
    cloudData[i * 4 + 3] = Math.min(a, 160);
  }
  const cloudTex = new THREE.DataTexture(cloudData, size, size, THREE.RGBAFormat);
  cloudTex.needsUpdate = true;
  const cloudMat = new THREE.MeshStandardMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.65,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);

  const planetGroup = new THREE.Group();
  planetGroup.add(planetMesh, cloudMesh, atmoMesh, wireMesh);
  planetGroup.position.set(1.4, -0.3, 0);

  return { planetMesh, wireMesh, planetGroup };
}

/* ── Orbital ring ── */
function createOrbitalRing() {
  const geo = new THREE.TorusGeometry(2.5, 0.006, 8, 180);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xd7a64b,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = Math.PI * 0.38;
  return ring;
}

/* ── FBM noise helper (JS, for texture gen) ── */
function fbm(x, y, octaves) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val  += smoothNoise(x * freq, y * freq) * amp;
    amp  *= 0.5;
    freq *= 2.0;
  }
  return val;
}

function smoothNoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  const a = hash(xi,   yi),   b = hash(xi+1, yi);
  const c = hash(xi,   yi+1), d = hash(xi+1, yi+1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/* ──────────────────────────────────────────────────────────
   6. HERO INTRO ANIMATIONS
──────────────────────────────────────────────────────────── */
function initHeroAnimations() {
  const tl = gsap.timeline({ delay: 0.3 });

  tl.to('.hero-label',    { opacity: 1, duration: 1,   ease: 'power2.out' }, 0.2)
    .to('.hero-title',    { opacity: 1, duration: 1.2, ease: 'power3.out' }, 0.5)
    .to('.hero-subtitle', { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.85)
    .to('.hero-desc',     { opacity: 1, duration: 0.9, ease: 'power2.out' }, 1.05)
    .to('.hero-cta',      { opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.3)
    .to('.hero-telemetry',{ opacity: 1, duration: 0.8, ease: 'power2.out' }, 1.55);
}

/* ──────────────────────────────────────────────────────────
   7. SCROLL TRIGGERS
──────────────────────────────────────────────────────────── */
function initScrollTriggers({ state, wireMesh }) {

  /* ── Global scroll progress ── */
  ScrollTrigger.create({
    trigger: '#scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: self => {
      state.scrollProgress = self.progress;
    }
  });

  /* ── Section 01 → 02: move camera left + slight pull back ── */
  ScrollTrigger.create({
    trigger: '#section-dsl',
    start: 'top 80%',
    end: 'top 20%',
    scrub: 1.5,
    onUpdate: self => {
      state.cameraZ = 5 + self.progress * 1.5;
      state.cameraY = self.progress * -0.4;
    }
  });

  /* ── Section 02 → 03: wireframe reveal + zoom in ── */
  ScrollTrigger.create({
    trigger: '#section-analysis',
    start: 'top 80%',
    end: 'top 10%',
    scrub: 2,
    onUpdate: self => {
      /* Blend to wireframe */
      state.wireframeBlend = self.progress;
      wireMesh.material.opacity = self.progress * 0.85;

      /* Zoom into planet */
      state.cameraZ = 6.5 - self.progress * 3.8;
      state.cameraY = -0.4 + self.progress * 0.2;
    }
  });

  /* ── Section 03 → 04: pull back slightly + shift up + reveal shader solid terrain ── */
  ScrollTrigger.create({
    trigger: '#section-godot',
    start: 'top 80%',
    end: 'top 20%',
    scrub: 1.5,
    onUpdate: self => {
      state.cameraZ = 2.7 + self.progress * 1.3; // slightly pull back to 4.0
      state.cameraY = -0.2 + self.progress * 0.6; // tilt up to +0.4
      state.wireframeBlend = 1.0 - self.progress * 0.7; // fade out wireframe to reveal custom shader textures
      wireMesh.material.opacity = (1.0 - self.progress * 0.7) * 0.85;
    }
  });

  /* ── Section 04 → 05: zoom back out fully for contact/footer ── */
  ScrollTrigger.create({
    trigger: '#section-contact',
    start: 'top 90%',
    end: 'bottom bottom',
    scrub: 1.5,
    onUpdate: self => {
      state.cameraZ = 4.0 + self.progress * 1.7; // zoom out to 5.7
      state.cameraY = 0.4 - self.progress * 0.4; // center back to 0
      state.wireframeBlend = 0.3 * (1.0 - self.progress); // fade wireframe completely
      wireMesh.material.opacity = 0.3 * (1.0 - self.progress) * 0.85;
    }
  });
}

/* ──────────────────────────────────────────────────────────
   8. INTERSECTION-BASED SCROLL REVEAL
──────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-scroll-reveal]').forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────────────────────
   9. LAUNCH BUTTON INTERACTION (placeholder)
──────────────────────────────────────────────────────────── */
function initLaunchButton() {
  const btn = document.getElementById('btn-launch');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const textEl = btn.querySelector('.btn-launch-text');
    const icon   = btn.querySelector('.btn-launch-icon');

    /* Sequence animation */
    const tl = gsap.timeline();
    tl.to(textEl, { opacity: 0, x: -10, duration: 0.2, ease: 'power2.in' })
      .set(textEl, { textContent: 'UPLINK ESTABLISHED ✓' })
      .to(textEl, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' })
      .to(icon,   { rotation: 180, scale: 1.3, color: '#3ef07a', duration: 0.5, ease: 'back.out(2)' }, '<0.1')
      .to(btn,    { borderColor: '#3ef07a', duration: 0.4 }, '<')
      .to(btn,    { color: '#3ef07a', duration: 0.4 }, '<');
  });

  /* Ripple on hover */
  btn.addEventListener('mouseenter', () => {
    gsap.to(btn.querySelector('.btn-launch-glow'), {
      opacity: 1, scale: 1.1, duration: 0.4, ease: 'power2.out'
    });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn.querySelector('.btn-launch-glow'), {
      opacity: 0, scale: 1, duration: 0.4, ease: 'power2.in'
    });
  });
}

/* ──────────────────────────────────────────────────────────
   10. INTERACTIVE PIPELINE
──────────────────────────────────────────────────────────── */
function initPipelineInteractivity() {
  const steps = document.querySelectorAll('.pipe-step');
  const card  = document.getElementById('pipeline-detail-card');
  const title = document.getElementById('pipeline-detail-title');
  const badge = document.getElementById('pipeline-detail-badge');
  const desc  = document.getElementById('pipeline-detail-desc');
  const bullets = document.getElementById('pipeline-detail-bullets');
  const code  = document.getElementById('pipeline-detail-code');

  if (!steps.length || !card) return;

  const data = {
    LEX: {
      title: "ANALIZADOR LÉXICO (LEXER)",
      badge: "FASE 1 / LÉXICO",
      desc: "Escanea secuencialmente el código ASTRA y segmenta los caracteres en componentes léxicos básicos denominados 'Tokens'.",
      bullets: [
        "Reconoce palabras clave (simulacion, planeta, atmosfera, agua, si, mientras, etc.), identificadores de usuario, números, operadores y literales.",
        "Soporta e identifica unidades físicas opcionales (km, kg, atm, ppm, °C) acopladas a valores numéricos.",
        "Verifica el alfabeto y detecta errores léxicos al instante, como identificadores mal construidos (ej. '5000colonos') o caracteres prohibidos (@, $, #)."
      ],
      code: `[LEXER OUTPUT STREAM]
 Token 01: PALABRA_RESERVADA("inicio")       [L1, C1]
 Token 02: PALABRA_RESERVADA("simulacion")   [L2, C5]
 Token 03: SIMBOLO("{")                      [L2, C16]
 Token 04: PALABRA_RESERVADA("planeta")      [L3, C9]
 Token 05: SIMBOLO("{")                      [L3, C17]
 Token 06: IDENTIFICADOR("masa")             [L4, C13]
 Token 07: OPERADOR("=")                     [L4, C18]
 Token 08: NUMERO("5.97e24")                 [L4, C20]
 Token 09: UNIDAD("kg")                      [L4, C28]
 Token 10: SIMBOLO(";")                      [L4, C30]`
    },
    PARSE: {
      title: "ANALIZADOR SINTÁCTICO (PARSER)",
      badge: "FASE 2 / SINTAXIS",
      desc: "Agrupa el flujo de Tokens generado por el Lexer y verifica que cumpla estrictamente con la gramática formal LL(1) del lenguaje ASTRA.",
      bullets: [
        "Comprueba la correcta anidación de bloques ('planeta', 'atmosfera', 'agua') y la delimitación formal del programa ('inicio' y 'fin').",
        "Valida el orden de sentencias de control (si/sino, mientras), asignaciones válidas finalizadas en punto y coma, y el correcto balanceo de paréntesis y llaves.",
        "Implementa un recuperador activo de errores (error recovery) para continuar analizando y descubrir múltiples errores sintácticos por compilación."
      ],
      code: `[PARSER GRAMMAR PRODUCTION RULES]
 programa          ::= "inicio" bloqueSimulacion "fin"
 bloqueSimulacion  ::= "simulacion" "{" { sentencia } "}"
 sentencia         ::= bloquePlaneta | bloqueAtmosfera | bloqueAgua
                     | bloqueVida | asignacion | if | while | funcion
 bloquePlaneta     ::= "planeta" "{" { asignacion } "}"
 asignacion        ::= identificador "=" valor ";"`
    },
    AST: {
      title: "ABSTRACT SYNTAX TREE (AST)",
      badge: "FASE 3 / ÁRBOL DE SINTAXIS",
      desc: "Construye una estructura jerárquica en forma de árbol que representa la semántica lógica pura del código compilado, desprovista de puntuaciones sintácticas.",
      bullets: [
        "Transforma las secuencias de texto lineales en nodos lógicos anidados representando construcciones semánticas del programa.",
        "Sirve como representación intermedia limpia y optimizada sobre la cual operan las lógicas de chequeo de tipos y la posterior simulación.",
        "Los nodos principales incluyen: NodoPrograma, NodoBloqueSimulacion, NodoIf, NodoAsignacion, NodoExprBinaria, entre otros."
      ],
      code: `📖 ÁRBOL SINTÁCTICO (texto):
 PROGRAMA
  └─ SIMULACIÓN { ... }
      ├─ PLANETA
      │   ├─ masa = 5.97e24 kg
      │   └─ radio = 6371 km
      ├─ ATMÓSFERA
      │   ├─ presion = 1.0 atm
      │   └─ co2 = 400 ppm
      └─ AGUA
          └─ estado_liquido = verdadero`
    },
    SEM: {
      title: "VALIDACIÓN SEMÁNTICA (SEMANTIC ANALYZER)",
      badge: "FASE 4 / SEMÁNTICA",
      desc: "Fase crítica de coherencia astrobiológica y de tipos lógicos. Recorre el AST validando la semántica formal del programa.",
      bullets: [
        "Implementa una pila de ámbitos para la Tabla de Símbolos, garantizando que no existan variables sin declarar.",
        "Realiza comprobaciones de tipo en asignaciones y operaciones lógicas, comprueba la compatibilidad física de las unidades (evitando sumar °C con kg) y certifica que los bloques y variables obligatorios existan.",
        "Genera advertencias y errores altamente explicativos marcados con códigos 'SEM-xxx' con fila y columna exactas."
      ],
      code: `[SEMANTIC SCOPE CHECK]
 Scope: Global -> OK
 Scope: Simulacion -> OK
 Scope: Planeta -> masa (NUM), radio (NUM) -> OK
 Scope: Atmosfera -> presion (NUM), co2 (NUM) -> OK
 Scope: Agua -> estado_liquido (BOOL) -> OK
 Type Verification: Compatible operations ✓
 Physical Units: km + km = OK ✓
 Semantic Errors: 0 detected.`
    },
    SIM: {
      title: "MOTOR DE EJECUCIÓN (SIMULATOR)",
      badge: "FASE 5 / SIMULACIÓN",
      desc: "Intérprete nativo de simulación que recorre el AST validado y procesa las operaciones físicas en tiempo de ejecución.",
      bullets: [
        "Procesa las lógicas imperativas de control (si, mientras, llamadas a funciones) y evalúa expresiones matemáticas y aritméticas de forma determinista.",
        "Mapea las variables físicas a una estructura DTO unificada, serializándola a un JSON temporal.",
        "Controla la simulación 3D en tiempo real comunicándose de forma bidireccional con el visualizador de Godot 4."
      ],
      code: `[SIMULATOR ENGINE ACTIVE]
 Executing Loop: 'mientras' (co2 > 0)
 Variable update: co2 = 399 ppm -> 398 ppm -> 397 ppm...
 Event: 'si' condition triggered (gravedad > 8)
 Log: "Gravedad óptima para terraformación."
 Rendering dynamic parameters: Radius scaled, water level updated.`
    },
    REPORTE: {
      title: "GENERADOR DE REPORTES Y TELEMETRÍA",
      badge: "FASE 6 / INFORME",
      desc: "Fase final de salida estructurada que reúne los resultados de las instrucciones de simulación y genera el informe de habitabilidad.",
      bullets: [
        "Recopila las salidas textuales generadas por los comandos de simulación 'mostrar()' y 'reporte()'.",
        "Calcula el Índice de Similitud Terrestre (ESI) y genera firmas de espectros ópticos y biofirmas planetarias.",
        "Escribe un informe astrobiológico completo listo para validar la viabilidad del planeta terraformado."
      ],
      code: `==========================================
          INFORME DE SIMULACIÓN ASTRA
==========================================
* Planeta: Habitable (Estable)
* Índice de Similitud Terrestre (ESI): 0.89
* Temperatura Superficial Promedio: 15.0 °C
* Estado de la Biomasa: Favorable
* Espectro de Biofirma: Translucido Celeste
==========================================
STATUS: COMPILACIÓN Y SIMULACIÓN EXITOSA ✓`
    }
  };

  steps.forEach(step => {
    step.addEventListener('click', () => {
      const type = step.getAttribute('data-step');
      if (!type || !data[type]) return;

      // Update active classes
      steps.forEach(s => {
        s.classList.remove('pipe-step--active');
        s.classList.remove('pipe-step--pass');
      });
      step.classList.add('pipe-step--active');

      // Animate transition using GSAP
      gsap.to(card, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        onComplete: () => {
          // Update details
          title.textContent = data[type].title;
          badge.textContent = data[type].badge;
          desc.textContent = data[type].desc;

          // Bullets
          bullets.innerHTML = '';
          data[type].bullets.forEach(bulletText => {
            const li = document.createElement('li');
            li.textContent = bulletText;
            bullets.appendChild(li);
          });

          // Code
          code.querySelector('code').textContent = data[type].code;

          // Animate back in
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'power2.out'
          });
        }
      });
    });
  });
}