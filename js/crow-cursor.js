// ═══════════════════════════════════════════════════════════════════════
// crow-cursor.js — Itachi Uchiha Crow Genjutsu Cursor Effect
// Pure SVG silhouettes + Canvas particle system | 60fps | Drop-in module
// ═══════════════════════════════════════════════════════════════════════

(function CrowGenjutsu() {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────
  const CFG = {
    intensity:        'medium',   // 'low' | 'medium' | 'high'
    crowColor:        '#0a0a0a',
    eyeColor:         '#FF1A1A',
    maxCrows:         22,
    maxFeathers:      180,
    maxSmoke:         50,
    enableOnMobile:   false,
    idleTimeout:      5000,       // ms before ambient crows appear
    idleSpawnInterval:3200,       // ms between ambient crow spawns
  };

  const INTENSITY_MAP = {
    low:    { spawnMin:1, spawnMax:1, burstMin:5,  burstMax:8,  throttle:90  },
    medium: { spawnMin:1, spawnMax:2, burstMin:8,  burstMax:12, throttle:65  },
    high:   { spawnMin:2, spawnMax:3, burstMin:10, burstMax:14, throttle:45  },
  };
  const INT = INTENSITY_MAP[CFG.intensity];

  // ── ACCESSIBILITY & DEVICE GUARD ────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch && !CFG.enableOnMobile) return;

  // ── CANVAS SETUP ───────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:'fixed', top:'0', left:'0', width:'100vw', height:'100vh',
    zIndex:'99999', pointerEvents:'none', display:'block',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width  = window.innerWidth  * DPR;
    canvas.height = window.innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── PREMIUM SVG CROW SILHOUETTES ────────────────────────────────────
  // Three wing poses for a fluid flap cycle. Each is a 80x52 viewBox.
  // Paths are hand-crafted for clear crow silhouette at small sizes.
  const EYE  = CFG.eyeColor;
  const BODY = CFG.crowColor;

  const CROW_SVGS = [
    // POSE 0 — Wings Down (gliding)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 52">
      <!-- Body -->
      <ellipse cx="40" cy="30" rx="12" ry="7" fill="${BODY}"/>
      <!-- Head -->
      <ellipse cx="30" cy="24" rx="7" ry="6" fill="${BODY}"/>
      <!-- Beak -->
      <polygon points="23,24 18,22 23,26" fill="${BODY}"/>
      <!-- Tail -->
      <polygon points="52,30 60,27 60,33" fill="${BODY}"/>
      <!-- Left Wing — swept downward -->
      <path d="M36,28 C28,32 16,38 4,42 C10,36 18,30 36,26 Z" fill="${BODY}"/>
      <!-- Right Wing — swept downward -->
      <path d="M44,28 C52,32 64,38 76,42 C70,36 62,30 44,26 Z" fill="${BODY}"/>
      <!-- Eye glow -->
      <circle cx="28" cy="23" r="2.2" fill="${EYE}"/>
      <circle cx="28" cy="23" r="1" fill="#fff" opacity="0.6"/>
    </svg>`,

    // POSE 1 — Wings Up (upstroke)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 52">
      <!-- Body -->
      <ellipse cx="40" cy="32" rx="12" ry="7" fill="${BODY}"/>
      <!-- Head -->
      <ellipse cx="30" cy="26" rx="7" ry="6" fill="${BODY}"/>
      <!-- Beak -->
      <polygon points="23,26 18,24 23,28" fill="${BODY}"/>
      <!-- Tail -->
      <polygon points="52,32 60,29 60,35" fill="${BODY}"/>
      <!-- Left Wing — raised upward -->
      <path d="M36,28 C30,20 18,10 4,6 C10,14 20,22 36,30 Z" fill="${BODY}"/>
      <!-- Right Wing — raised upward -->
      <path d="M44,28 C50,20 62,10 76,6 C70,14 60,22 44,30 Z" fill="${BODY}"/>
      <!-- Eye glow -->
      <circle cx="28" cy="25" r="2.2" fill="${EYE}"/>
      <circle cx="28" cy="25" r="1" fill="#fff" opacity="0.6"/>
    </svg>`,

    // POSE 2 — Wings Wide (fully extended, mid-flap)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 52">
      <!-- Body -->
      <ellipse cx="40" cy="30" rx="11" ry="6.5" fill="${BODY}"/>
      <!-- Head -->
      <ellipse cx="30" cy="25" rx="7" ry="6" fill="${BODY}"/>
      <!-- Beak -->
      <polygon points="23,25 17,23 23,27" fill="${BODY}"/>
      <!-- Tail — forked -->
      <path d="M52,30 L62,25 L58,31 L62,36 Z" fill="${BODY}"/>
      <!-- Left Wing — horizontal, wide -->
      <path d="M36,27 C26,24 14,20 2,18 C10,22 22,26 36,29 Z" fill="${BODY}"/>
      <!-- Right Wing — horizontal, wide -->
      <path d="M44,27 C54,24 66,20 78,18 C70,22 58,26 44,29 Z" fill="${BODY}"/>
      <!-- Primary feathers left -->
      <path d="M20,21 C16,19 10,20 4,18" stroke="${BODY}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Primary feathers right -->
      <path d="M60,21 C64,19 70,20 76,18" stroke="${BODY}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Eye glow -->
      <circle cx="28" cy="24" r="2.2" fill="${EYE}"/>
      <circle cx="28" cy="24" r="1" fill="#fff" opacity="0.6"/>
    </svg>`,
  ];

  // ── OFFSCREEN BITMAP CACHE ─────────────────────────────────────────
  // Bake each SVG pose into an OffscreenCanvas at normal & large size.
  // The eye-glow filter is applied here so canvas.drawImage() is fast.
  const BITMAPS_SMALL = [];  // 80×52 display pixels
  const BITMAPS_LARGE = [];  // 160×104 display pixels
  let BITMAPS_READY = false;

  function bake(svgStr, w, h, glowPx) {
    return new Promise(resolve => {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        const oc  = document.createElement('canvas');
        oc.width  = w; oc.height = h;
        const ox  = oc.getContext('2d');
        ox.filter = `drop-shadow(0 0 ${glowPx}px ${CFG.eyeColor}) `
                  + `drop-shadow(0 0 ${glowPx * 2}px ${CFG.eyeColor}88)`;
        ox.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(oc);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  Promise.all(
    CROW_SVGS.flatMap((svg, i) => [
      bake(svg, 80, 52,  4).then(b => BITMAPS_SMALL[i] = b),
      bake(svg, 160, 104, 7).then(b => BITMAPS_LARGE[i] = b),
    ])
  ).then(() => { BITMAPS_READY = true; });

  // ── UTILITY ────────────────────────────────────────────────────────
  const PI2  = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const rInt = (a, b) => Math.floor(rand(a, b + 0.99));

  // ── OBJECT POOLS ───────────────────────────────────────────────────
  function makeCrow() {
    return { active:false, x:0, y:0, vx:0, vy:0, angle:0, rot:0,
             size:1, opacity:0, life:0, maxLife:0,
             pose:0, flapT:0, flapRate:5, burst:false,
             wobblePhase:0, wobbleAmp:0,
             tx:[0,0,0], ty:[0,0,0], to:[0,0,0], tHead:0 };
  }
  function makeFeather() {
    return { active:false, x:0, y:0, vx:0, vy:0,
             rot:0, rotSpd:0, opacity:0, life:0, maxLife:0, sz:5 };
  }
  function makeSmoke() {
    return { active:false, x:0, y:0, r:0, maxR:0, opacity:0, life:0, maxLife:0 };
  }

  const crowPool    = Array.from({length:60}, makeCrow);
  const featherPool = Array.from({length:CFG.maxFeathers}, makeFeather);
  const smokePool   = Array.from({length:CFG.maxSmoke}, makeSmoke);
  const activeCrows = [], activeFeathers = [], activeSmoke = [];
  const shockwaves  = [];
  let   flashAlpha  = 0;

  function getCrow()    { return crowPool.find(c => !c.active)    || (crowPool.length < 90    ? (crowPool.push(makeCrow()),    crowPool[crowPool.length-1])    : null); }
  function getFeather() { return featherPool.find(f => !f.active) || null; }
  function getSmoke()   { return smokePool.find(s => !s.active)   || null; }

  // ── SPAWN FUNCTIONS ────────────────────────────────────────────────
  function spawnCrow(x, y, burst) {
    if (activeCrows.length >= CFG.maxCrows) return;
    const c = getCrow(); if (!c) return;
    const angle = rand(0, PI2);
    const spd   = burst ? rand(7, 13) : rand(2.5, 5.5);
    c.active = true; c.x = x + rand(-18,18); c.y = y + rand(-18,18);
    c.vx = Math.cos(angle) * spd; c.vy = Math.sin(angle) * spd;
    c.angle = angle; c.rot = angle;
    c.size = burst ? rand(1.7, 2.2) : rand(0.55, 0.8);
    c.opacity = 0; c.life = 0;
    c.maxLife  = burst ? rInt(130, 190) : rInt(75, 110);
    c.pose = rInt(0, 2); c.flapT = 0;
    c.flapRate = burst ? rInt(7, 10) : rInt(4, 6);
    c.burst = burst;
    c.wobblePhase = rand(0, PI2);
    c.wobbleAmp   = rand(0.3, 0.9);
    c.tx.fill(c.x); c.ty.fill(c.y); c.to.fill(0); c.tHead = 0;
    activeCrows.push(c);
  }

  function spawnFeathers(x, y, count) {
    for (let i = 0; i < count; i++) {
      const f = getFeather(); if (!f) break;
      f.active = true; f.x = x+rand(-10,10); f.y = y+rand(-10,10);
      f.vx = rand(-2,2); f.vy = rand(-2,0.5);
      f.rot = rand(0,PI2); f.rotSpd = rand(-0.1,0.1);
      f.opacity = 0.9; f.life = 0;
      f.maxLife = rInt(50, 80); f.sz = rand(3,7);
      activeFeathers.push(f);
    }
  }

  function spawnSmoke(x, y) {
    const s = getSmoke(); if (!s) return;
    s.active = true; s.x = x; s.y = y;
    s.r = 2; s.maxR = rand(24, 42);
    s.opacity = 0.18; s.life = 0; s.maxLife = 38;
    activeSmoke.push(s);
  }

  function spawnShockwave(x, y) {
    shockwaves.push({ x, y, r:4, maxR:160, opacity:0.4, life:0, maxLife:40 });
    // brief screen flash
    flashAlpha = 0.06;
  }

  // ── UPDATE ─────────────────────────────────────────────────────────
  function updateCrows() {
    for (let i = activeCrows.length - 1; i >= 0; i--) {
      const c = activeCrows[i];
      c.life++;

      // Fade in
      if (c.life <= 7) c.opacity = (c.life / 7) * 0.88;

      // Fade out
      const fadeStart = c.maxLife - 26;
      if (c.life > fadeStart) {
        const t = (c.life - fadeStart) / 26;
        c.opacity = 0.88 * (1 - t);
        c.size += 0.004; // subtle death bloom
      }

      // Wobble flight path (sin wave perpendicular to travel)
      const wobble = Math.sin(c.life * 0.13 + c.wobblePhase) * c.wobbleAmp;
      c.x += c.vx + (-Math.sin(c.angle)) * wobble;
      c.y += c.vy + ( Math.cos(c.angle)) * wobble;

      // Smoothly rotate to face direction of travel
      c.rot += (c.angle - c.rot) * 0.1;

      // Wing flap cycle
      if (++c.flapT >= c.flapRate) { c.flapT = 0; c.pose = (c.pose + 1) % 3; }

      // Trail ghost positions (ring buffer)
      const ti = c.tHead % 3;
      c.tx[ti] = c.x; c.ty[ti] = c.y; c.to[ti] = c.opacity * 0.25;
      c.tHead++;

      // Death
      if (c.life >= c.maxLife) {
        c.active = false;
        activeCrows.splice(i, 1);
        spawnFeathers(c.x, c.y, c.burst ? rInt(8,12) : rInt(4,6));
        spawnSmoke(c.x, c.y);
      }
    }
  }

  function updateFeathers() {
    for (let i = activeFeathers.length - 1; i >= 0; i--) {
      const f = activeFeathers[i];
      f.life++; f.x += f.vx; f.y += f.vy;
      f.vy += 0.045;  // gentle gravity
      f.rot += f.rotSpd;
      f.opacity = 0.9 * (1 - f.life / f.maxLife);
      if (f.life >= f.maxLife) { f.active = false; activeFeathers.splice(i,1); }
    }
  }

  function updateSmoke() {
    for (let i = activeSmoke.length - 1; i >= 0; i--) {
      const s = activeSmoke[i];
      s.life++;
      const t = s.life / s.maxLife;
      s.r = 2 + (s.maxR - 2) * t;
      s.opacity = 0.18 * (1 - t);
      if (s.life >= s.maxLife) { s.active = false; activeSmoke.splice(i,1); }
    }
  }

  function updateShockwaves() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.life++;
      const t = sw.life / sw.maxLife;
      sw.r = 4 + (sw.maxR - 4) * t;
      sw.opacity = 0.4 * (1 - t) * (1 - t);
      if (sw.life >= sw.maxLife) shockwaves.splice(i,1);
    }
    if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.004);
  }

  // ── RENDER ─────────────────────────────────────────────────────────
  function render() {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    // Screen flash on burst
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,220,200,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Smoke puffs
    for (const s of activeSmoke) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(15,10,20,${s.opacity * 1.2})`);
      g.addColorStop(1, 'rgba(15,10,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, PI2); ctx.fill();
    }

    // Shockwave rings
    for (const sw of shockwaves) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,60,60,${sw.opacity})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = CFG.eyeColor;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, PI2); ctx.stroke();
      ctx.restore();
    }

    // Feathers
    for (const f of activeFeathers) {
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.translate(f.x, f.y); ctx.rotate(f.rotation || f.rot);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(0, 0, f.sz * 0.28, f.sz, 0, 0, PI2);
      ctx.fill();
      ctx.restore();
    }

    // Crows
    if (!BITMAPS_READY) return;

    for (const c of activeCrows) {
      const bmaps = c.burst ? BITMAPS_LARGE : BITMAPS_SMALL;
      const bmp   = bmaps[c.pose];
      if (!bmp) continue;
      const dw = bmp.width  * c.size * 0.5;
      const dh = bmp.height * c.size * 0.5;

      // Draw 3 trail ghost echoes (fading)
      for (let t = 0; t < 3; t++) {
        const age = (c.tHead - t) % 3;
        if (c.to[age] <= 0) continue;
        ctx.save();
        ctx.globalAlpha = c.to[age] * (0.3 - t * 0.08);
        ctx.translate(c.tx[age], c.ty[age]);
        ctx.rotate(c.rot);
        ctx.drawImage(bmp, -dw/2, -dh/2, dw, dh);
        ctx.restore();
      }

      // Main crow
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.drawImage(bmp, -dw/2, -dh/2, dw, dh);
      ctx.restore();
    }
  }

  // ── MAIN RAF LOOP ──────────────────────────────────────────────────
  let running = true;
  function tick() {
    if (!running) return;
    updateCrows(); updateFeathers(); updateSmoke(); updateShockwaves();
    render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── MOUSE MOVE → SPAWN CROWS ───────────────────────────────────────
  let lastSpawnT = 0, mouseX = 0, mouseY = 0, lastMoveT = Date.now();

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    lastMoveT = Date.now();
    const now = performance.now();
    if (now - lastSpawnT < INT.throttle) return;
    lastSpawnT = now;
    const n = rInt(INT.spawnMin, INT.spawnMax);
    for (let i = 0; i < n; i++) spawnCrow(mouseX, mouseY, false);
  }, { passive: true });

  // ── TRIPLE-CLICK BURST ─────────────────────────────────────────────
  const clicks = [];
  window.addEventListener('click', e => {
    const now = Date.now();
    clicks.push(now);
    while (clicks.length && clicks[0] < now - 1000) clicks.shift();
    if (clicks.length >= 3) {
      clicks.length = 0;
      const n = rInt(INT.burstMin, INT.burstMax);
      for (let i = 0; i < n; i++) spawnCrow(e.clientX, e.clientY, true);
      spawnShockwave(e.clientX, e.clientY);
    }
  });

  // ── IDLE AMBIENT CROWS ─────────────────────────────────────────────
  let idleTmr = null;
  setInterval(() => {
    const idle = Date.now() - lastMoveT > CFG.idleTimeout;
    if (idle && !idleTmr) {
      idleTmr = setInterval(() => {
        const x = rand(80, window.innerWidth - 80);
        const y = rand(80, window.innerHeight - 80);
        spawnCrow(x, y, false);
      }, CFG.idleSpawnInterval);
    } else if (!idle && idleTmr) {
      clearInterval(idleTmr); idleTmr = null;
    }
  }, 800);

  // ── CLEANUP API ────────────────────────────────────────────────────
  window.__itachiCrowDestroy = () => {
    running = false;
    if (idleTmr) clearInterval(idleTmr);
    canvas.remove();
  };

})();
