// app.js — WildTrack Result Page Engine
gsap.registerPlugin(ScrollTrigger);


// ─── STATUS COLOR MAP ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Least Concern': '#4ade80', 'Near Threatened': '#facc15',
  'Vulnerable': '#fb923c', 'Endangered': '#f87171',
  'Critically Endangered': '#dc2626', 'Extinct in the Wild': '#7c3aed',
};

// ─── SPECIES IMAGE MAP ────────────────────────────────────────────────────────
const SPECIES_IMAGES = {
  'common myna': '../assets/images/cards/common-myna.png',
  'house crow': '../assets/images/cards/house-crow.png',
  'bengal tiger': '../assets/images/cards/bengal-tiger.png',
  'indian grey hornbill': '../assets/images/cards/indian-grey-hornbill.png',
  'asian elephant': '../assets/images/cards/asian-elephant.png',
  'wild donkey': '../assets/images/cards/donkey.png',
  'wild horse': '../assets/images/cards/horse.png',
  'plains zebra': '../assets/images/cards/plains-zebra.png',
};

function getSpeciesImg(name) {
  const key = (name || '').toLowerCase();
  for (const [k, v] of Object.entries(SPECIES_IMAGES)) {
    if (key.includes(k)) return v;
  }
  return 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1200&q=80';
}

// ─── LOAD DATA ────────────────────────────────────────────────────────────────
const raw    = sessionStorage.getItem('wildtrack_result');
const img64  = sessionStorage.getItem('wildtrack_image');

if (!raw) {
  // No data at all — user landed here directly
  document.getElementById('empty-state').classList.add('show');
  document.body.classList.add('ready');
} else {
  const data = JSON.parse(raw);

  // ── Error payload from api.js ──────────────────────────────────────────────
  if (data.error) {
    const emptyEl = document.getElementById('empty-state');
    const detail  = data.detail?.detail?.error || data.message || `HTTP ${data.status}`;
    emptyEl.innerHTML = `
      <div style="border:1px solid rgba(239,68,68,0.4);background:rgba(30,4,4,0.7);border-radius:16px;padding:32px 40px;max-width:480px;margin:0 auto">
        <div style="font-size:2rem;margin-bottom:12px">⚠</div>
        <h2 style="color:#F0EDE8;font-family:'Playfair Display',serif;font-size:1.8rem;margin:0 0 12px">Detection Failed</h2>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 8px;font-size:0.95rem">The API could not process this image:</p>
        <code style="display:block;background:rgba(0,0,0,0.4);border-radius:8px;padding:10px 14px;color:#f87171;font-size:0.85rem;margin-bottom:24px">${detail}</code>
        <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:24px">Try a clearer photo of a supported species: Asian Elephant, Bengal Tiger, Common Myna, House Crow, Indian Grey Hornbill, Plains Zebra, Wild Donkey, or Wild Horse.</p>
        <a class="btn-primary" href="/" style="text-decoration:none;display:inline-block">Try Another Image</a>
      </div>`;
    emptyEl.classList.add('show');
    document.body.classList.add('ready');

  // ── Successful payload with detections ────────────────────────────────────
  } else {
    document.getElementById('result-main').style.display = 'block';

    const detections = data.detections || (data.species ? [data] : []);
    const rootImg = img64; // Use original image, we will draw our own bounding boxes
    let activeIdx = 0;

    buildTabs(detections, rootImg);

    fetch('../data/species_encyclopedia.json')
      .then(r => r.json())
      .then(enc => { renderDetection(detections[0], enc, rootImg); document.body.classList.add('ready'); })
      .catch(() => { renderDetection(detections[0], null, rootImg); document.body.classList.add('ready'); });
  }
}


// ─── TABS ─────────────────────────────────────────────────────────────────────
function buildTabs(detections, rootImg) {
  if (detections.length <= 1) return;
  const container = document.getElementById('animal-tabs');
  container.style.display = 'flex';
  detections.forEach((d, i) => {
    const name = d.species_info?.common_name || d.species || d.class || 'Animal';
    const conf = Math.round((d.confidence || 0) * 100);
    const color = d.color_hex || '#F5A623';
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
    btn.innerHTML = `<span class="tab-dot" style="background:${color}"></span>${name} <span style="color:var(--muted);font-size:11px">${conf}%</span>`;
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetch('../data/species_encyclopedia.json')
        .then(r => r.json())
        .then(enc => renderDetection(detections[i], enc, rootImg))
        .catch(() => renderDetection(detections[i], null, rootImg));
    };
    container.appendChild(btn);
  });
}

// ─── MAIN RENDER ──────────────────────────────────────────────────────────────
function renderDetection(det, enc, imgSrc) {
  const si = det.species_info || {};
  const name = si.common_name || det.species || det.class || 'Unknown Species';
  const sciName = si.scientific_name || det.scientific_name || '';
  const confidence = det.confidence > 1 ? det.confidence : Math.round((det.confidence || 0) * 100);
  const accentColor = det.color_hex || '#F5A623';
  const annotatedImg = imgSrc || '';
  const top3 = det.top3_predictions || det.top_predictions || [];
  const migData = det.migration_data || si.migration_data || {};
  const funFacts = si.fun_facts || [];
  const status = si.conservation_status || det.conservation_status || '';

  // Set accent CSS var
  document.documentElement.style.setProperty('--accent', accentColor);

  // Update conf ring color
  document.querySelector('.conf-ring .fill').style.stroke = accentColor;

  renderReveal(name, sciName, confidence, annotatedImg, accentColor, status, det);
  renderPredictions(top3, accentColor);
  renderProfile(name, sciName, si, enc);
  renderFacts(funFacts, accentColor);
  renderMigration(migData, accentColor);
  setupDownload(det, name);
  initScrollAnimations();
}

// ─── SECTION 1: REVEAL ────────────────────────────────────────────────────────
function renderReveal(name, sciName, confidence, annotatedImg, accent, status, det) {
  // Annotated image (now using raw image + CSS boxes)
  const img = document.getElementById('annotated-img');
  if (annotatedImg) img.src = annotatedImg;
  
  const resultData = JSON.parse(sessionStorage.getItem('wildtrack_result') || '{}');
  const allDetections = resultData.detections || [];
  const imgW = resultData.image_size?.width || 800;
  const imgH = resultData.image_size?.height || 600;
  
  img.onload = () => {
    document.getElementById('img-dims').textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
    
    // Draw custom bounding boxes
    const wrap = document.getElementById('reveal-img-wrap');
    // Clean up old boxes
    wrap.querySelectorAll('.custom-bbox').forEach(el => el.remove());
    
    allDetections.forEach((d, idx) => {
      if(!d.bbox) return;
      const [x1, y1, x2, y2] = d.bbox;
      const box = document.createElement('div');
      box.className = 'custom-bbox';
      box.style.left = (x1 / imgW * 100) + '%';
      box.style.top = (y1 / imgH * 100) + '%';
      box.style.width = ((x2 - x1) / imgW * 100) + '%';
      box.style.height = ((y2 - y1) / imgH * 100) + '%';
      
      const cHex = d.color_hex || '#4ECDC4';
      box.style.borderColor = cHex;
      
      const confStr = Math.round((d.confidence || 0) * 100) + '%';
      const label = document.createElement('div');
      label.className = 'custom-bbox-label';
      label.style.backgroundColor = cHex;
      
      // If the box is too close to the top of the image, put the label inside the box
      const topPct = (y1 / imgH * 100);
      if (topPct < 5) {
        label.style.top = '0';
        label.style.borderRadius = '0 0 4px 0';
      }
      
      label.innerHTML = `<span class="custom-bbox-badge">${idx + 1}</span>${d.species} ${confStr}`;
      
      box.appendChild(label);
      wrap.appendChild(box);
    });
  };

  const count = allDetections.length || 1;
  document.getElementById('detect-count').textContent = `${count} animal${count !== 1 ? 's' : ''} detected`;

  // Species name
  document.getElementById('species-name').textContent = name;
  document.getElementById('sci-name').textContent = sciName;

  // Conservation status badge
  const badgeEl = document.getElementById('status-badges');
  const statusColor = STATUS_COLORS[status] || '#888';
  badgeEl.innerHTML = status
    ? `<div class="status-badge"><span class="status-dot" style="background:${statusColor}"></span>${status}</div>`
    : '';

  // Processed time
  const procTime = det.processing_time_seconds || det.processing_time || '—';
  document.getElementById('proc-stat').textContent = `⚡ Processed in ${procTime}s`;

  // ENTRANCE ANIMATION SEQUENCE
  const tl = gsap.timeline();
  tl.set('#s-reveal', { opacity: 0 });
  tl.to('#s-reveal', { opacity: 1, duration: 0.5 });

  // Image fade
  tl.fromTo('.reveal-img-wrap', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 0.3);

  // Corners
  tl.to('.corner', { opacity: 1, duration: 0.3, stagger: 0.08 }, 0.8);

  // Scan line
  tl.to('#scan-line', { opacity: 1, duration: 0.1 }, 1.0);
  tl.fromTo('#scan-line', { top: '0%' }, { top: '100%', duration: 1.0, ease: 'none' }, 1.0);
  tl.to('#scan-line', { opacity: 0, duration: 0.1 }, 2.0);

  // Right panel
  tl.to('#reveal-info', { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }, 1.2);

  // Species name blur reveal
  tl.to('#species-name', { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, 1.5);

  // Confidence ring
  tl.add(() => animateConfRing(confidence, accent), 2.0);

  // Badges
  tl.fromTo('.status-badge,.proc-stat', { opacity: 0, y: 10 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, 2.8);
}

function animateConfRing(conf, accent) {
  const circumference = 251.2;
  const fill = document.getElementById('conf-ring-fill');
  const numEl = document.getElementById('conf-num');
  const bigEl = document.getElementById('conf-big');

  fill.style.stroke = accent;
  fill.style.strokeDashoffset = circumference;

  const target = circumference * (1 - conf / 100);
  gsap.to(fill, {
    strokeDashoffset: target, duration: 1.5, ease: 'power2.out',
    onUpdate: function() {
      const progress = 1 - (parseFloat(fill.style.strokeDashoffset) / circumference);
      const current = Math.round(progress * 100);
      numEl.textContent = current + '%';
      if (bigEl) bigEl.textContent = current + '%';
    }
  });
}

// ─── SECTION 2: PREDICTIONS ───────────────────────────────────────────────────
function renderPredictions(top3, accent) {
  const container = document.getElementById('pred-cards');
  container.innerHTML = '';
  if (!top3.length) { container.innerHTML = '<p style="color:var(--muted)">No prediction data available.</p>'; return; }

  top3.forEach((pred, i) => {
    const name = pred.species || pred.class || pred.name || 'Unknown';
    const sci = pred.scientific_name || '';
    const conf = pred.confidence > 1 ? pred.confidence : Math.round((pred.confidence || 0) * 100);
    const isWinner = i === 0;
    const div = document.createElement('div');
    div.className = 'pred-card' + (isWinner ? ' winner' : '');
    div.innerHTML = `
      ${isWinner ? '<div class="winner-badge">WINNER</div>' : ''}
      <div class="pred-rank">#${i + 1}</div>
      <div class="pred-info">
        <div class="pred-pct">${conf}%</div>
        <div class="pred-name">${name}</div>
        ${sci ? `<div class="pred-sci">${sci}</div>` : ''}
        <div class="pred-bar-wrap"><div class="pred-bar" data-conf="${conf}" style="${isWinner ? '' : 'background:rgba(255,255,255,0.3)'}"></div></div>
      </div>`;
    container.appendChild(div);
  });

  document.getElementById('proc-footer').textContent = '';

  // Animate on scroll
  ScrollTrigger.create({
    trigger: '#s-predictions', start: 'top 75%',
    onEnter: () => {
      gsap.to('.pred-card', { opacity: 1, x: 0, stagger: 0.15, duration: 0.7, ease: 'power2.out',
        onComplete: () => {
          document.querySelectorAll('.pred-bar').forEach(bar => {
            bar.style.width = bar.dataset.conf + '%';
            if (bar.closest('.winner')) bar.style.background = `linear-gradient(90deg,${accent},#e8831a)`;
          });
        }
      });
    }
  });
}

// ─── SECTION 3: PROFILE ───────────────────────────────────────────────────────
function renderProfile(name, sciName, si, enc) {
  const heroImg = document.getElementById('profile-hero-img');
  heroImg.src = getSpeciesImg(name);
  heroImg.alt = name + ' in natural habitat';

  document.getElementById('profile-big-name').textContent = name;
  document.getElementById('profile-sci').textContent = sciName;

  // Population counter
  const pop = si.population_estimate || si.population || null;
  const popEl = document.getElementById('pop-counter');
  if (pop && typeof pop === 'number') {
    ScrollTrigger.create({
      trigger: '#s-profile', start: 'top 60%',
      onEnter: () => gsap.to({ val: 0 }, {
        val: pop, duration: 2, ease: 'power2.out',
        onUpdate: function() { popEl.textContent = Math.floor(this.targets()[0].val).toLocaleString(); }
      })
    });
  } else {
    popEl.textContent = pop || 'Data unavailable';
  }

  // Facts grid — try enc match first, then si
  let encEntry = null;
  if (enc?.species) {
    encEntry = enc.species.find(s => s.common_name?.toLowerCase() === name.toLowerCase());
  }
  const src = encEntry || si;

  const factsData = [
    { icon: svgTree(), label: 'Habitat', val: src.habitat?.primary || si.habitat || '—' },
    { icon: svgFood(), label: 'Diet', val: src.diet || si.diet || '—' },
    { icon: svgShield(), label: 'Status', val: src.conservation_status || si.conservation_status || '—' },
    { icon: svgUsers(), label: 'Distribution', val: src.habitat?.regions?.[0] || si.distribution || '—' },
  ];

  const grid = document.getElementById('facts-grid');
  grid.innerHTML = factsData.map(f => `
    <div class="fact-card">
      <div class="fact-icon">${f.icon}</div>
      <div class="fact-label">${f.label}</div>
      <div class="fact-val">${f.val}</div>
    </div>`).join('');

  ScrollTrigger.create({
    trigger: '.facts-section', start: 'top 75%',
    onEnter: () => gsap.to('.fact-card', { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' })
  });
}

// ─── SECTION 4: FUN FACTS ─────────────────────────────────────────────────────
function renderFacts(facts, accent) {
  const container = document.getElementById('fact-cards');
  container.innerHTML = '';
  if (!facts.length) { container.innerHTML = '<p style="color:var(--muted)">No fun facts available.</p>'; return; }

  facts.forEach((fact, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const div = document.createElement('div');
    div.className = `fact-story ${side}`;
    div.style.setProperty('--accent', accent);
    div.innerHTML = `
      <div class="fact-num">0${i + 1}</div>
      <div class="fact-divider"></div>
      <div class="fact-text">"${fact}"</div>`;
    container.appendChild(div);

    ScrollTrigger.create({
      trigger: div, start: 'top 80%',
      onEnter: () => gsap.fromTo(div,
        { opacity: 0, x: side === 'left' ? -40 : 40 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
      )
    });
  });
}

// ─── SECTION 5: MIGRATION MAP ─────────────────────────────────────────────────
function renderMigration(migData, accent) {
  document.getElementById('mig-type').textContent = migData.migration_type || '—';
  document.getElementById('mig-dist').textContent = migData.annual_distance_km
    ? `~${migData.annual_distance_km} km` : '—';
  document.getElementById('mig-desc').textContent = migData.description || migData.migration_description || '—';

  const habChips = document.getElementById('hab-chips');
  const habitats = migData.key_habitats || migData.habitats || [];
  habChips.innerHTML = habitats.map(h => `<span class="hab-chip">${h}</span>`).join('');

  // SVG map
  const routes = migData.migration_route || migData.waypoints || [];
  if (!routes.length) return;

  // Project lat/lng to SVG 0-400 space
  const lats = routes.map(r => r.lat || r.latitude || 0);
  const lngs = routes.map(r => r.lng || r.longitude || 0);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const pad = 40;

  function project(lat, lng) {
    const x = maxLng === minLng ? 200 : pad + ((lng - minLng) / (maxLng - minLng)) * (400 - pad * 2);
    const y = maxLat === minLat ? 200 : pad + ((maxLat - lat) / (maxLat - minLat)) * (400 - pad * 2);
    return { x, y };
  }

  const points = routes.map(r => project(r.lat || r.latitude || 0, r.lng || r.longitude || 0));

  // Build smooth path (catmull-rom approximation)
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const path = document.getElementById('migration-path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', accent);
  const pathLen = path.getTotalLength ? path.getTotalLength() : 600;
  path.style.strokeDasharray = pathLen;
  path.style.strokeDashoffset = pathLen;

  // Waypoints
  const wpGroup = document.getElementById('migration-waypoints');
  routes.forEach((r, i) => {
    const { x, y } = points[i];
    const label = r.label || r.location || r.name || '';
    const month = r.month || '';
    wpGroup.innerHTML += `
      <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3">
        <animate attributeName="r" values="8;14;8" dur="${1.5 + i * 0.3}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="${1.5 + i * 0.3}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x}" cy="${y}" r="4" fill="${accent}"/>
      ${label ? `<text x="${x}" y="${y - 18}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="10" font-family="Inter,sans-serif">${label}${month ? ' · ' + month : ''}</text>` : ''}`;
  });

  // Animate path on scroll
  ScrollTrigger.create({
    trigger: '#s-migration', start: 'top 70%',
    onEnter: () => gsap.to(path, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' })
  });
}

// ─── DOWNLOAD REPORT ──────────────────────────────────────────────────────────
function setupDownload(det, name) {
  document.getElementById('download-btn').onclick = () => {
    const blob = new Blob([JSON.stringify(det, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildtrack-${name.replace(/\s+/g, '-').toLowerCase()}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

// ─── SCROLL ANIMATIONS (misc) ─────────────────────────────────────────────────
function initScrollAnimations() {
  ScrollTrigger.create({
    trigger: '#s-cta', start: 'top 80%',
    onEnter: () => gsap.fromTo('#s-cta h2, #s-cta p, .cta-btns',
      { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.8, ease: 'power2.out' }
    )
  });
}

// ─── SVG ICONS (inline lucide) ────────────────────────────────────────────────
function svgTree() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22V13"/><path d="M20 16l-8-4-8 4"/><path d="M4 10l8-4 8 4"/></svg>`;
}
function svgFood() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`;
}
function svgShield() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
}
function svgUsers() {
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg>`;
}
