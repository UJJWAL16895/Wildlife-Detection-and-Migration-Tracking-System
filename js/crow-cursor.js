// crow-cursor.js — Itachi Crow Genjutsu | Fixed: solid black body, red eye glow in canvas
(function CrowGenjutsu() {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

  // ── CANVAS ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position:'fixed', top:'0', left:'0', width:'100vw', height:'100vh',
    zIndex:'99999', pointerEvents:'none',
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
  window.addEventListener('resize', resize, { passive:true });

  // ── SVG CROW — Pure black body only, NO filter baked in ─────────────
  // Eye is drawn separately in canvas so glow stays red on the dot only
  const CROW_SVG = [
    // Pose 0: wings angled downward (glide)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 44">
      <ellipse cx="35" cy="26" rx="11" ry="6" fill="#000"/>
      <ellipse cx="25" cy="21" rx="6.5" ry="5.5" fill="#000"/>
      <polygon points="19,21 13,19.5 19,23" fill="#000"/>
      <path d="M30,25 C22,31 10,37 0,40 C7,33 16,27 30,23Z" fill="#000"/>
      <path d="M40,25 C48,31 60,37 70,40 C63,33 54,27 40,23Z" fill="#000"/>
      <polygon points="46,26 56,23 56,29" fill="#000"/>
    </svg>`,
    // Pose 1: wings raised upward (upstroke)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 44">
      <ellipse cx="35" cy="28" rx="11" ry="6" fill="#000"/>
      <ellipse cx="25" cy="23" rx="6.5" ry="5.5" fill="#000"/>
      <polygon points="19,23 13,21.5 19,25" fill="#000"/>
      <path d="M30,25 C24,17 12,8 0,4 C7,12 17,20 30,27Z" fill="#000"/>
      <path d="M40,25 C46,17 58,8 70,4 C63,12 53,20 40,27Z" fill="#000"/>
      <polygon points="46,28 56,25 56,31" fill="#000"/>
    </svg>`,
    // Pose 2: wings fully extended (mid-flap)
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 44">
      <ellipse cx="35" cy="27" rx="11" ry="6" fill="#000"/>
      <ellipse cx="25" cy="22" rx="6.5" ry="5.5" fill="#000"/>
      <polygon points="19,22 13,20.5 19,24" fill="#000"/>
      <path d="M30,25 C20,23 9,21 0,20 C8,23 19,26 30,27Z" fill="#000"/>
      <path d="M40,25 C50,23 61,21 70,20 C62,23 51,26 40,27Z" fill="#000"/>
      <path d="M8,21 C5,20 2,21 0,20" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M62,21 C65,20 68,21 70,20" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M46,27 L55,24 L53,28 L55,31 Z" fill="#000"/>
    </svg>`,
  ];

  // Eye positions per pose (cx, cy in viewBox coords, normalized to 0-1)
  const EYE_POS = [
    { nx: 23/70, ny: 20/44 },
    { nx: 23/70, ny: 22/44 },
    { nx: 23/70, ny: 21/44 },
  ];

  // Bake each SVG to offscreen canvas — NO filter, pure black
  const BITMAPS = [];
  let READY = false;
  let loadedCount = 0;

  CROW_SVG.forEach((svg, i) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const oc = document.createElement('canvas');
      oc.width = 70; oc.height = 44;
      oc.getContext('2d').drawImage(img, 0, 0, 70, 44);
      BITMAPS[i] = oc;
      URL.revokeObjectURL(url);
      if (++loadedCount === CROW_SVG.length) READY = true;
    };
    img.src = url;
  });

  // ── POOLS ────────────────────────────────────────────────────────────
  const PI2 = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const rInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  function makeCrow() {
    return {
      active:false, x:0, y:0, vx:0, vy:0, angle:0, rot:0,
      size:1, opacity:0, life:0, maxLife:0,
      pose:0, flapT:0, flapRate:5, burst:false,
      wobbleOff:0,
      // trail ring buffer
      tx:[0,0,0], ty:[0,0,0], to:[0,0,0], tIdx:0,
    };
  }
  function makeFeather() {
    return { active:false, x:0, y:0, vx:0, vy:0, rot:0, rotS:0, opacity:0, life:0, maxLife:0, sz:4 };
  }
  function makeSmoke() {
    return { active:false, x:0, y:0, r:0, maxR:0, opacity:0, life:0, maxLife:0 };
  }

  const crowPool    = Array.from({length:60}, makeCrow);
  const featherPool = Array.from({length:200}, makeFeather);
  const smokePool   = Array.from({length:60}, makeSmoke);
  const activeCrows    = [];
  const activeFeathers = [];
  const activeSmoke    = [];
  const shockwaves     = [];
  let flashAlpha = 0;

  const getFrom = pool => pool.find(o => !o.active) || null;

  // ── SPAWN ─────────────────────────────────────────────────────────────
  function spawnCrow(x, y, burst) {
    if (activeCrows.length >= 28) return;
    const c = getFrom(crowPool); if (!c) return;
    const angle = rand(0, PI2);
    // SHORT travel: low speed, short life → short distance
    const spd = burst ? rand(3.5, 6) : rand(1.2, 2.8);
    c.active = true;
    c.x = x + rand(-14, 14); c.y = y + rand(-14, 14);
    c.vx = Math.cos(angle) * spd; c.vy = Math.sin(angle) * spd;
    c.angle = angle; c.rot = angle;
    c.size = burst ? rand(1.4, 1.9) : rand(0.5, 0.75);
    c.opacity = 0; c.life = 0;
    // Shorter maxLife = short distance travelled
    c.maxLife = burst ? rInt(80, 110) : rInt(45, 70);
    c.pose = rInt(0, 2); c.flapT = 0;
    c.flapRate = burst ? rInt(7, 10) : rInt(3, 5);
    c.burst = burst;
    c.wobbleOff = rand(0, PI2);
    c.tx.fill(c.x); c.ty.fill(c.y); c.to.fill(0); c.tIdx = 0;
    activeCrows.push(c);
  }

  function spawnFeathers(x, y, n) {
    for (let i = 0; i < n; i++) {
      const f = getFrom(featherPool); if (!f) break;
      f.active = true; f.x = x+rand(-8,8); f.y = y+rand(-8,8);
      f.vx = rand(-1.8,1.8); f.vy = rand(-1.8,0.5);
      f.rot = rand(0, PI2); f.rotS = rand(-0.1, 0.1);
      f.opacity = 0.85; f.life = 0;
      f.maxLife = rInt(40, 65); f.sz = rand(3, 6);
      activeFeathers.push(f);
    }
  }

  function spawnSmoke(x, y) {
    const s = getFrom(smokePool); if (!s) return;
    s.active = true; s.x = x; s.y = y;
    s.r = 2; s.maxR = rand(20, 36);
    s.opacity = 0.18; s.life = 0; s.maxLife = 30;
    activeSmoke.push(s);
  }

  function spawnShockwave(x, y) {
    shockwaves.push({ x, y, r:4, maxR:140, opacity:0.45, life:0, maxLife:36 });
    flashAlpha = 0.05;
  }

  // ── UPDATE ────────────────────────────────────────────────────────────
  function updateCrows() {
    for (let i = activeCrows.length - 1; i >= 0; i--) {
      const c = activeCrows[i];
      c.life++;

      // Fade in (fast)
      if (c.life <= 5) c.opacity = (c.life / 5) * 0.9;

      // Fade out (last 20 frames)
      const fs = c.maxLife - 20;
      if (c.life > fs) c.opacity = 0.9 * (1 - (c.life - fs) / 20);

      // Organic curved flight: strong sin-wave wobble + velocity slowdown
      c.vx *= 0.985; c.vy *= 0.985; // gradual deceleration
      const wobble = Math.sin(c.life * 0.22 + c.wobbleOff) * 1.2;
      const px = -Math.sin(c.angle), py = Math.cos(c.angle);
      c.x += c.vx + px * wobble;
      c.y += c.vy + py * wobble;

      // Rotation smoothly follows travel direction
      c.rot += (c.angle - c.rot) * 0.12;
      // Gradually curve the angle (makes flight arc rather than straight)
      c.angle += rand(-0.04, 0.04);

      // Wing flap
      if (++c.flapT >= c.flapRate) { c.flapT = 0; c.pose = (c.pose + 1) % 3; }

      // Trail
      const ti = c.tIdx % 3;
      c.tx[ti] = c.x; c.ty[ti] = c.y; c.to[ti] = c.opacity;
      c.tIdx++;

      // Death
      if (c.life >= c.maxLife) {
        c.active = false; activeCrows.splice(i, 1);
        spawnFeathers(c.x, c.y, c.burst ? rInt(7, 11) : rInt(3, 5));
        spawnSmoke(c.x, c.y);
      }
    }
  }

  function updateFeathers() {
    for (let i = activeFeathers.length - 1; i >= 0; i--) {
      const f = activeFeathers[i];
      f.life++; f.x += f.vx; f.y += f.vy;
      f.vy += 0.05; f.rot += f.rotS;
      f.opacity = 0.85 * (1 - f.life / f.maxLife);
      if (f.life >= f.maxLife) { f.active = false; activeFeathers.splice(i, 1); }
    }
  }

  function updateSmoke() {
    for (let i = activeSmoke.length - 1; i >= 0; i--) {
      const s = activeSmoke[i]; s.life++;
      const t = s.life / s.maxLife;
      s.r = 2 + (s.maxR - 2) * t; s.opacity = 0.18 * (1 - t);
      if (s.life >= s.maxLife) { s.active = false; activeSmoke.splice(i, 1); }
    }
  }

  function updateShockwaves() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i]; sw.life++;
      const t = sw.life / sw.maxLife;
      sw.r = 4 + (sw.maxR - 4) * t;
      sw.opacity = 0.45 * (1 - t) * (1 - t);
      if (sw.life >= sw.maxLife) shockwaves.splice(i, 1);
    }
    if (flashAlpha > 0) flashAlpha -= 0.004;
  }

  // ── RENDER ─────────────────────────────────────────────────────────────
  function render() {
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    // Screen flash
    if (flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,210,190,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Smoke
    for (const s of activeSmoke) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(10,8,15,${s.opacity * 1.3})`);
      g.addColorStop(1, 'rgba(10,8,15,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, PI2); ctx.fill();
    }

    // Shockwaves
    for (const sw of shockwaves) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,30,30,${sw.opacity})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, PI2); ctx.stroke();
      ctx.restore();
    }

    // Feathers
    for (const f of activeFeathers) {
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.fillStyle = '#111';
      ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, f.sz * 0.25, f.sz, 0, 0, PI2); ctx.fill();
      ctx.restore();
    }

    // Crows
    if (!READY) return;

    for (const c of activeCrows) {
      const bmp = BITMAPS[c.pose];
      if (!bmp) continue;
      const dw = bmp.width  * c.size;
      const dh = bmp.height * c.size;
      const ep = EYE_POS[c.pose];
      // Eye position in world space (account for rotation)
      const ex_local = ep.nx * dw - dw / 2;
      const ey_local = ep.ny * dh - dh / 2;
      const cosR = Math.cos(c.rot), sinR = Math.sin(c.rot);
      const ex = c.x + ex_local * cosR - ey_local * sinR;
      const ey = c.y + ex_local * sinR + ey_local * cosR;

      // Trail echoes (ghost copies behind crow)
      for (let t = 0; t < 3; t++) {
        const age = (c.tIdx - 1 - t + 3) % 3;
        const toA = c.to[age] * (0.22 - t * 0.07);
        if (toA <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha = toA;
        ctx.translate(c.tx[age], c.ty[age]); ctx.rotate(c.rot);
        ctx.drawImage(bmp, -dw/2, -dh/2, dw, dh);
        ctx.restore();
      }

      // Main crow — solid black, no filter
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.drawImage(bmp, -dw/2, -dh/2, dw, dh);
      ctx.restore();

      // Red glowing eye — drawn separately with shadowBlur only on the dot
      const eyeR = c.burst ? 3.5 * c.size : 2.5 * c.size;
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = c.burst ? 18 : 10;
      ctx.fillStyle = '#FF1A00';
      ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, PI2); ctx.fill();
      // Inner bright dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFAAAA';
      ctx.beginPath(); ctx.arc(ex, ey, eyeR * 0.4, 0, PI2); ctx.fill();
      ctx.restore();
    }
  }

  // ── LOOP ─────────────────────────────────────────────────────────────
  let running = true;
  function tick() {
    if (!running) return;
    updateCrows(); updateFeathers(); updateSmoke(); updateShockwaves();
    render();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ── MOUSE → SPAWN (High intensity: throttle 40ms, 2-3 crows) ─────────
  let lastT = 0, lastMoveT = Date.now();

  window.addEventListener('mousemove', e => {
    lastMoveT = Date.now();
    const now = performance.now();
    if (now - lastT < 40) return; // 40ms throttle = ~25 triggers/sec
    lastT = now;
    const n = Math.floor(2 + Math.random() * 2); // 2-3 per event
    for (let i = 0; i < n; i++) spawnCrow(e.clientX, e.clientY, false);
  }, { passive:true });

  // ── TRIPLE-CLICK BURST ────────────────────────────────────────────────
  const clicks = [];
  window.addEventListener('click', e => {
    const now = Date.now();
    clicks.push(now);
    while (clicks.length && clicks[0] < now - 1000) clicks.shift();
    if (clicks.length >= 3) {
      clicks.length = 0;
      const n = 8 + Math.floor(Math.random() * 6); // 8-13
      for (let i = 0; i < n; i++) spawnCrow(e.clientX, e.clientY, true);
      spawnShockwave(e.clientX, e.clientY);
    }
  });

  // ── IDLE AMBIENT ──────────────────────────────────────────────────────
  let idleTmr = null;
  setInterval(() => {
    const idle = Date.now() - lastMoveT > 5000;
    if (idle && !idleTmr) {
      idleTmr = setInterval(() => {
        spawnCrow(rand(80, window.innerWidth-80), rand(80, window.innerHeight-80), false);
      }, 3000);
    } else if (!idle && idleTmr) { clearInterval(idleTmr); idleTmr = null; }
  }, 800);

  window.__itachiCrowDestroy = () => { running = false; if(idleTmr) clearInterval(idleTmr); canvas.remove(); };
})();
