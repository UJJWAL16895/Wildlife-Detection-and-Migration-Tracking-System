// bat-cursor.js — Itachi-style Bat Cursor | Pure canvas, glowing red eyes
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  // ── CANVAS ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    zIndex: '99999', pointerEvents: 'none',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    canvas.width  = window.innerWidth  * DPR;
    canvas.height = window.innerHeight * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── PRE-BAKE BAT FRAMES ─────────────────────────────────────────────
  // Draw a bat silhouette onto an offscreen canvas.
  // s = base unit. pose 0=wings open, 1=wings half-closed, 2=wings closed
  // The bat is centered at (pad, pad).
  function bakeBat(s, pose) {
    const pad = s * 12;
    const oc  = document.createElement('canvas');
    oc.width  = pad * 2;
    oc.height = pad * 2;
    const c   = oc.getContext('2d');
    c.translate(pad, pad);
    c.fillStyle = '#0a0805';

    // Wing membrane shape changes per pose
    // tipY: how high/low the wing tips go  (negative = up)
    // midY: control point height for the membrane arch
    const poses = [
      { tipY: s * 0.5,  midY: -s * 4.5, memY: s * 3 },   // wings open flat
      { tipY: -s * 3,   midY: -s * 6,   memY: s * 1.5 },  // wings raised
      { tipY: -s * 5.5, midY: -s * 7.5, memY: -s * 1 },   // wings fully up
    ];
    const p = poses[pose];

    // LEFT WING — classic bat membrane shape
    c.beginPath();
    c.moveTo(-s * 0.5, 0);                             // wing root (body center)
    // Outer leading edge sweeps to tip
    c.bezierCurveTo(-s * 2, p.midY * 0.5, -s * 5, p.tipY - s, -s * 9, p.tipY);
    // Wing tip curves back inward
    c.bezierCurveTo(-s * 7, p.tipY + s * 1.5, -s * 5, p.memY, -s * 3, p.memY + s);
    // Inner membrane returns to body
    c.bezierCurveTo(-s * 2, p.memY + s * 0.5, -s * 1, s * 1, -s * 0.5, s * 0.5);
    c.closePath();
    c.fill();

    // RIGHT WING — mirror of left
    c.save();
    c.scale(-1, 1);
    c.beginPath();
    c.moveTo(-s * 0.5, 0);
    c.bezierCurveTo(-s * 2, p.midY * 0.5, -s * 5, p.tipY - s, -s * 9, p.tipY);
    c.bezierCurveTo(-s * 7, p.tipY + s * 1.5, -s * 5, p.memY, -s * 3, p.memY + s);
    c.bezierCurveTo(-s * 2, p.memY + s * 0.5, -s * 1, s * 1, -s * 0.5, s * 0.5);
    c.closePath();
    c.fill();
    c.restore();

    // Wing finger bones (thin lines for detail)
    c.strokeStyle = '#1a1410';
    c.lineWidth = s * 0.3;
    c.globalAlpha = 0.6;
    [[-3.5, 0.6], [-5.5, 0.75], [-7.5, 0.88]].forEach(([mx, t]) => {
      const bx = -s * 0.5, by = 0;
      const tx = -s * 9, ty = p.tipY;
      c.beginPath();
      c.moveTo(bx, by);
      c.lineTo(bx + (tx - bx) * t + s * mx * (1 - t), by + (ty - by) * t);
      c.stroke();
      // mirror
      c.beginPath();
      c.moveTo(-bx, by);
      c.lineTo(-bx + (-tx + bx) * t - s * mx * (1 - t), by + (ty - by) * t);
      c.stroke();
    });
    c.globalAlpha = 1;

    // Body — small oval
    c.fillStyle = '#0a0805';
    c.beginPath();
    c.ellipse(0, s * 0.5, s * 1.2, s * 1.8, 0, 0, Math.PI * 2);
    c.fill();

    // Head — round, slightly larger than body top
    c.beginPath();
    c.ellipse(0, -s * 1.2, s * 1.4, s * 1.3, 0, 0, Math.PI * 2);
    c.fill();

    // Ears — two pointed triangles
    c.beginPath();
    c.moveTo(-s * 0.8, -s * 2.2);
    c.lineTo(-s * 1.8, -s * 4.2);
    c.lineTo(-s * 0.2, -s * 3.0);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(s * 0.8, -s * 2.2);
    c.lineTo(s * 1.8, -s * 4.2);
    c.lineTo(s * 0.2, -s * 3.0);
    c.closePath();
    c.fill();

    // Store eye position relative to pad (eyes on head)
    oc._ex = pad;              // centered x
    oc._ey = pad - s * 1.2;   // head center y
    oc._pad = pad;
    return oc;
  }

  const SM = [bakeBat(3, 0), bakeBat(3, 1), bakeBat(3, 2)];   // normal (small)
  const LG = [bakeBat(5, 0), bakeBat(5, 1), bakeBat(5, 2)];   // burst (larger)

  // ── POOLS ────────────────────────────────────────────────────────────
  const PI2  = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const rInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  const mkBat = () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0,
    angle: 0, opacity: 0, life: 0, maxLife: 0,
    pose: 0, flapT: 0, flapRate: 3,
    burst: false, wobOff: 0, dirFlip: 0,
    tx: [0,0,0], ty: [0,0,0], to: [0,0,0], tIdx: 0,
  });
  const mkFt = () => ({
    active: false, x: 0, y: 0, vx: 0, vy: 0,
    rot: 0, rotS: 0, opacity: 0, life: 0, maxLife: 0, sz: 3,
  });
  const mkSmk = () => ({
    active: false, x: 0, y: 0, r: 0, maxR: 0, opacity: 0, life: 0, maxLife: 0,
  });

  const batPool = Array.from({ length: 60 }, mkBat);
  const ftPool  = Array.from({ length: 200 }, mkFt);
  const smkPool = Array.from({ length: 50 }, mkSmk);
  const bats    = [], feathers = [], smokes = [], shocks = [];
  let flashA = 0;
  const getFree = pool => pool.find(o => !o.active) || null;

  // ── SPAWN ────────────────────────────────────────────────────────────
  function spawnBat(x, y, burst) {
    if (bats.length >= 28) return;
    const b = getFree(batPool); if (!b) return;
    const angle = rand(0, PI2);
    const spd   = burst ? rand(3.5, 6.5) : rand(1.2, 2.8);
    b.active = true;
    b.x = x + rand(-10, 10); b.y = y + rand(-10, 10);
    b.vx = Math.cos(angle) * spd; b.vy = Math.sin(angle) * spd;
    b.angle = angle; b.opacity = 0; b.life = 0;
    b.maxLife  = burst ? rInt(70, 100) : rInt(38, 60);
    b.pose = 0; b.flapT = 0;
    b.flapRate = burst ? rInt(5, 8) : rInt(2, 4);  // fast erratic flap
    b.burst = burst; b.wobOff = rand(0, PI2);
    b.dirFlip = rInt(15, 30); // frames between random direction nudges
    b.tx.fill(b.x); b.ty.fill(b.y); b.to.fill(0); b.tIdx = 0;
    bats.push(b);
  }

  function spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      const f = getFree(ftPool); if (!f) break;
      f.active = true; f.x = x + rand(-6, 6); f.y = y + rand(-6, 6);
      f.vx = rand(-1.5, 1.5); f.vy = rand(-1.8, 0.4);
      f.rot = rand(0, PI2); f.rotS = rand(-0.15, 0.15);
      f.opacity = 0.8; f.life = 0;
      f.maxLife = rInt(30, 55); f.sz = rand(2, 4);
      feathers.push(f);
    }
  }

  function spawnSmoke(x, y) {
    const s = getFree(smkPool); if (!s) return;
    s.active = true; s.x = x; s.y = y;
    s.r = 1; s.maxR = rand(14, 28);
    s.opacity = 0.15; s.life = 0; s.maxLife = 24;
    smokes.push(s);
  }

  function spawnShock(x, y) {
    shocks.push({ x, y, r: 4, maxR: 120, opacity: 0.45, life: 0, maxLife: 32 });
    flashA = 0.06;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────
  function update() {
    for (let i = bats.length - 1; i >= 0; i--) {
      const b = bats[i]; b.life++;

      // Fade in/out
      if (b.life <= 4) b.opacity = (b.life / 4) * 0.9;
      const fs = b.maxLife - 18;
      if (b.life > fs) b.opacity = 0.9 * (1 - (b.life - fs) / 18);

      // Bat-like erratic movement: random direction nudges + strong wobble
      if (b.life % b.dirFlip === 0) {
        b.angle += rand(-0.8, 0.8); // sudden direction change
      }
      b.vx *= 0.96; b.vy *= 0.96;
      b.angle += rand(-0.03, 0.03); // constant micro-drift
      // Bats zigzag: alternating perpendicular wobble
      const zigzag = Math.sin(b.life * 0.35 + b.wobOff) * 1.8;
      b.x += b.vx + (-Math.sin(b.angle)) * zigzag;
      b.y += b.vy + ( Math.cos(b.angle)) * zigzag;

      // Fast flap cycle (bats flap ~10-15x/sec)
      if (++b.flapT >= b.flapRate) { b.flapT = 0; b.pose = (b.pose + 1) % 3; }

      // Trail
      const ti = b.tIdx % 3;
      b.tx[ti] = b.x; b.ty[ti] = b.y; b.to[ti] = b.opacity; b.tIdx++;

      if (b.life >= b.maxLife) {
        b.active = false; bats.splice(i, 1);
        spawnDust(b.x, b.y, b.burst ? rInt(6, 9) : rInt(2, 4));
        spawnSmoke(b.x, b.y);
      }
    }

    for (let i = feathers.length - 1; i >= 0; i--) {
      const f = feathers[i]; f.life++;
      f.x += f.vx; f.y += f.vy; f.vy += 0.06;
      f.rot += f.rotS;
      f.opacity = 0.8 * (1 - f.life / f.maxLife);
      if (f.life >= f.maxLife) { f.active = false; feathers.splice(i, 1); }
    }

    for (let i = smokes.length - 1; i >= 0; i--) {
      const s = smokes[i]; s.life++;
      const t = s.life / s.maxLife;
      s.r = 1 + (s.maxR - 1) * t; s.opacity = 0.15 * (1 - t);
      if (s.life >= s.maxLife) { s.active = false; smokes.splice(i, 1); }
    }

    for (let i = shocks.length - 1; i >= 0; i--) {
      const sw = shocks[i]; sw.life++;
      const t = sw.life / sw.maxLife;
      sw.r = 4 + (sw.maxR - 4) * t;
      sw.opacity = 0.45 * (1 - t) * (1 - t);
      if (sw.life >= sw.maxLife) shocks.splice(i, 1);
    }
    if (flashA > 0) flashA -= 0.005;
  }

  // ── RENDER ────────────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (flashA > 0) {
      ctx.fillStyle = `rgba(180,0,0,${flashA * 0.4})`;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    // Smoke wisps
    for (const s of smokes) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(5,3,8,${s.opacity * 2})`);
      g.addColorStop(1, 'rgba(5,3,8,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, PI2); ctx.fill();
    }

    // Shockwaves
    for (const sw of shocks) {
      ctx.save();
      ctx.strokeStyle = `rgba(200,0,0,${sw.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, PI2); ctx.stroke();
      ctx.restore();
    }

    // Dust particles
    for (const f of feathers) {
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.fillStyle = '#1a0f05';
      ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, f.sz * 0.3, f.sz, 0, 0, PI2);
      ctx.fill();
      ctx.restore();
    }

    // Bats
    for (const b of bats) {
      const set = b.burst ? LG : SM;
      const bmp = set[b.pose];
      const sc  = b.burst ? 0.7 : 0.45; // keep bats SMALL
      const dw  = bmp.width  * sc;
      const dh  = bmp.height * sc;
      const pad = bmp._pad   * sc;

      // Ghost trail echoes
      for (let t = 0; t < 3; t++) {
        const idx = (b.tIdx - 1 - t + 3) % 3;
        const a   = b.to[idx] * (0.15 - t * 0.04);
        if (a < 0.02) continue;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(b.tx[idx], b.ty[idx]);
        ctx.rotate(b.angle);
        ctx.drawImage(bmp, -pad, -pad, dw, dh);
        ctx.restore();
      }

      // Main bat
      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.drawImage(bmp, -pad, -pad, dw, dh);
      ctx.restore();

      // Glowing red eyes (two dots on head)
      const er = (b.burst ? 3.2 : 2.0) * sc;
      // Eye offset from bat center (head is above center in bat bitmap)
      const eyOffY = (bmp._ey - bmp._pad) * sc;
      const cosA = Math.cos(b.angle), sinA = Math.sin(b.angle);
      const eyWorldX = b.x - eyOffY * sinA;
      const eyWorldY = b.y + eyOffY * cosA;
      const eySpacing = er * 1.5;

      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur  = b.burst ? 16 : 9;
      ctx.fillStyle   = '#FF1200';
      // Left eye
      ctx.beginPath();
      ctx.arc(eyWorldX - eySpacing * cosA + eySpacing * sinA * 0.5,
              eyWorldY - eySpacing * sinA - eySpacing * cosA * 0.5, er, 0, PI2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.arc(eyWorldX + eySpacing * cosA - eySpacing * sinA * 0.5,
              eyWorldY + eySpacing * sinA + eySpacing * cosA * 0.5, er, 0, PI2);
      ctx.fill();
      // Bright specular
      ctx.shadowBlur = 0; ctx.fillStyle = '#FFCCCC';
      ctx.beginPath();
      ctx.arc(eyWorldX - eySpacing * cosA + eySpacing * sinA * 0.5,
              eyWorldY - eySpacing * sinA - eySpacing * cosA * 0.5, er * 0.35, 0, PI2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyWorldX + eySpacing * cosA - eySpacing * sinA * 0.5,
              eyWorldY + eySpacing * sinA + eySpacing * cosA * 0.5, er * 0.35, 0, PI2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── LOOP ─────────────────────────────────────────────────────────────
  let running = true;
  (function tick() {
    if (!running) return;
    update(); render();
    requestAnimationFrame(tick);
  })();

  // ── EVENTS ───────────────────────────────────────────────────────────
  let lastT = 0, lastMv = Date.now();
  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    lastMv = Date.now();
    const now = performance.now();
    if (now - lastT < 40) return;
    lastT = now;
    const n = 2 + Math.floor(Math.random() * 2); // 2–3 per move
    for (let i = 0; i < n; i++) spawnBat(e.clientX, e.clientY, false);
  }, { passive: true });

  const clicks = [];
  window.addEventListener('click', e => {
    const now = Date.now();
    clicks.push(now);
    while (clicks.length && clicks[0] < now - 1000) clicks.shift();
    if (clicks.length >= 3) {
      clicks.length = 0;
      const n = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) spawnBat(e.clientX, e.clientY, true);
      spawnShock(e.clientX, e.clientY);
    }
  });

  // ── CURSOR-IDLE: constant bat swarm AT the cursor when mouse is still ──
  // After 800ms of no movement → spawn bats at cursor every 220ms
  // Feels like a swirling colony nesting at your pointer
  let cursorIdleTmr  = null;
  let cursorIdleStart = null;

  function startCursorIdle() {
    if (cursorIdleTmr) return;
    cursorIdleStart = Date.now();
    cursorIdleTmr = setInterval(() => {
      // Spawn 1-2 bats at cursor, intensity ramps up over the first 2 seconds
      const secs = (Date.now() - cursorIdleStart) / 1000;
      const count = secs > 2 ? 2 : 1;
      for (let i = 0; i < count; i++) spawnBat(mouseX, mouseY, false);
    }, 220);
  }

  function stopCursorIdle() {
    if (!cursorIdleTmr) return;
    clearInterval(cursorIdleTmr);
    cursorIdleTmr = null;
    cursorIdleStart = null;
  }

  // Check every 100ms if cursor has been idle for 800ms
  setInterval(() => {
    const idleMs = Date.now() - lastMv;
    if (idleMs > 800) {
      startCursorIdle();
    } else {
      stopCursorIdle();
    }
  }, 100);

  // ── AMBIENT: random screen bats when no mouse activity for 8s ─────────
  let ambientTmr = null;
  setInterval(() => {
    const idle = Date.now() - lastMv > 8000;
    if (idle && !ambientTmr) {
      ambientTmr = setInterval(() => spawnBat(
        rand(80, window.innerWidth - 80), rand(80, window.innerHeight - 80), false
      ), 3500);
    } else if (!idle && ambientTmr) { clearInterval(ambientTmr); ambientTmr = null; }
  }, 1000);

  window.__batDestroy = () => {
    running = false;
    stopCursorIdle();
    if (ambientTmr) clearInterval(ambientTmr);
    canvas.remove();
  };
})();
