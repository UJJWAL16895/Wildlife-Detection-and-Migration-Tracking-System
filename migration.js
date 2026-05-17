// migration.js — WildTrack Migration Explorer (Leaflet Version)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SEASONS = {
  0:'Winter',1:'Winter',2:'Spring',3:'Spring',4:'Spring',5:'Summer',
  6:'Summer',7:'Summer',8:'Autumn',9:'Autumn',10:'Autumn',11:'Winter'
};
const SEASON_EMOJI = {Winter:'❄️',Spring:'🌸',Summer:'☀️',Autumn:'🍂'};
const SEASON_COLORS = {Winter:'#60a5fa',Spring:'#4ade80',Summer:'#fbbf24',Autumn:'#f97316'};

const MODELS = {
  'tigers': { icon:'🐯', model: 'https://sketchfab.com/models/0db8f285e8514c65a12036fcc8d91d07/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' },
  'elephants': { icon:'🐘', model: 'https://sketchfab.com/models/a8e7e10f005f4baab0a2f5079d759fcd/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' },
  'myna': { icon:'🐦', model: 'https://sketchfab.com/models/62d83ecec89a448693525603a5b9af1d/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' },
  'house-crow': { icon:'🐦‍⬛', model: 'https://sketchfab.com/models/2c8a3414c5a849818dcf8534130ca0df/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' },
  'indian-grey-hornbill': { icon:'🦜', model: 'https://sketchfab.com/models/4e3419341a0949bb8a30ec53d690eba5/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' },
  'zebra': { icon:'🦓', model: 'https://sketchfab.com/models/ca72c919f935418484b4f275c149981c/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&transparent=1' }
};

// ── MAP INIT ─────────────────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: false }).setView([22.0, 80.0], 5);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
}).addTo(map);

let currentData = null;
let currentMonthIdx = 0;
let animalMarker = null;
let routeLine = null;
let breedingMarker = null;

let playInterval = null;
let isPlaying = false;
let playSpeed = 1;
const speeds = [1,2,4];

// ── LOAD FROM SESSION ────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const raw = sessionStorage.getItem('wildtrack_result');
  if(raw){
    try{
      const data = JSON.parse(raw);
      const det = (data.detections||[])[0];
      if(det && det.migration_data){
        loadSpeciesData(det);
      } else {
        alert("No migration data found in detection results.");
      }
    }catch(e){
      console.error(e);
      alert("Error parsing detection results.");
    }
  } else {
    alert("No detection data found. Please run a detection first.");
  }
});

function loadSpeciesData(det){
  currentData = det;
  const mig = det.migration_data;
  const info = det.species_info || {};
  let spKey = det.species.toLowerCase();
  
  if(spKey.includes('elephant')) spKey = 'elephants';
  if(spKey.includes('tiger')) spKey = 'tigers';

  const modelInfo = MODELS[spKey] || MODELS['tigers'];
  const color = det.color_hex || '#F5A623';

  // Update UI
  document.getElementById('species-title').textContent = info.common_name || spKey;
  document.getElementById('mig-type').textContent = mig.migration_type || 'Unknown';
  document.getElementById('mig-dist').textContent = mig.avg_distance_km ? `~${mig.avg_distance_km} km` : 'Unknown';
  
  if(mig.key_habitats){
    const habChips = document.getElementById('hab-chips');
    if(habChips) habChips.innerHTML = mig.key_habitats.map(h=>`<span class="hab-chip">${h}</span>`).join('');
  }

  // Draw Route
  if(routeLine) map.removeLayer(routeLine);
  if(mig.migration_route && mig.migration_route.length > 0){
    const latlngs = mig.migration_route.map(r => [r.lat, r.lng]);
    L.polyline(latlngs, { color: color, weight: 12, opacity: 0.15 }).addTo(map);
    routeLine = L.polyline(latlngs, { color: color, weight: 2.5, dashArray: '4, 4', opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [50,50] });
  }

  // Draw Breeding Ground
  if(breedingMarker) map.removeLayer(breedingMarker);
  if(mig.breeding_grounds){
    const bg = mig.breeding_grounds;
    const iconHtml = `<div class="animal-marker" style="border-color:#60a5fa;box-shadow:0 0 15px #60a5fa88;width:32px;height:32px;font-size:16px;">💙</div>`;
    const bIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [32,32], iconAnchor: [16,16] });
    breedingMarker = L.marker([bg.lat, bg.lng], { icon: bIcon }).addTo(map);
    breedingMarker.bindPopup(`<div class="popup-title">🏠 Breeding Ground</div><div class="popup-sub">${bg.location}</div>`);
  }

  // Create Animal Marker with 3D Iframe
  if(animalMarker) map.removeLayer(animalMarker);
  
  // Big iframe for the model!
  const iframeHtml = `
    <div style="position:relative; width:150px; height:150px; margin-left:-75px; margin-top:-120px; pointer-events:none;">
      <iframe src="${modelInfo.model}" 
        style="width:100%; height:100%; border:none;" 
        allow="autoplay; fullscreen; xr-spatial-tracking" 
        execution-while-out-of-viewport execution-while-not-rendered>
      </iframe>
      <div style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:16px; height:16px; background:${color}; border-radius:50%; box-shadow:0 0 15px ${color}; pointer-events:auto; cursor:pointer;" title="Click for details"></div>
    </div>
  `;
  const aIcon = L.divIcon({ html: iframeHtml, className: '', iconSize: [0,0] });
  
  // Default position before month update
  animalMarker = L.marker([0,0], { icon: aIcon, zIndexOffset: 1000 }).addTo(map);

  // Start animation at Jan
  currentMonthIdx = 0;
  document.getElementById('month-slider').value = 0;
  updateSeasonalPosition(MONTHS[currentMonthIdx]);
}

function updateSeasonalPosition(month){
  if(!currentData || !currentData.migration_data || !animalMarker) return;
  
  let spKey = currentData.species.toLowerCase();
  if(spKey.includes('elephant')) spKey = 'elephants';
  if(spKey.includes('tiger')) spKey = 'tigers';

  const mig = currentData.migration_data;
  const name = currentData.species_info?.common_name || spKey;
  
  let pos = null;
  if(mig.seasonal_positions && mig.seasonal_positions[month]){
     pos = mig.seasonal_positions[month];
  } else if (Array.isArray(mig.seasonal_positions)) {
     pos = mig.seasonal_positions.find(p => p.month === month);
  }
  
  if (!pos && mig.migration_route) {
     pos = mig.migration_route.find(p => p.month === month);
  }

  if(!pos) return;

  // Move marker smoothly without reloading iframe
  animalMarker.setLatLng([pos.lat, pos.lng]);

  const season = SEASONS[MONTHS.indexOf(month)];
  const sColor = SEASON_COLORS[season];

  const popupHtml = `<div class="popup-title">${name}</div>
                     <div class="popup-sub">${pos.location}</div>
                     <div class="popup-sub" style="margin-top:6px;color:${sColor}">${season} — ${FULL_MONTHS[MONTHS.indexOf(month)]}</div>`;
  animalMarker.bindPopup(popupHtml, { offset: [0, -110] });

  // Update UI
  const locText = document.getElementById('loc-text');
  const locMonth = document.getElementById('loc-month');
  if(locText) locText.textContent = pos.location;
  if(locMonth) locMonth.textContent = FULL_MONTHS[MONTHS.indexOf(month)];

  const monthDisplay = document.getElementById('month-display');
  const overlayMonth = document.getElementById('overlay-month');
  const seasonName = document.getElementById('season-name');
  const seasonEmoji = document.getElementById('season-emoji');
  
  if(monthDisplay) monthDisplay.textContent = month;
  if(overlayMonth) overlayMonth.textContent = FULL_MONTHS[MONTHS.indexOf(month)];
  if(seasonName) seasonName.textContent = season;
  if(seasonEmoji) seasonEmoji.textContent = SEASON_EMOJI[season];

  const badge = document.getElementById('season-badge');
  if(badge){
    badge.textContent = season;
    badge.style.color = sColor;
    badge.style.borderColor = sColor;
    badge.style.background = sColor+'18';
  }

  // Smooth pan map
  map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.8 });
}

function onSliderChange(val){
  currentMonthIdx = parseInt(val);
  updateSeasonalPosition(MONTHS[currentMonthIdx]);
}

function togglePlay(){
  isPlaying = !isPlaying;
  const btn = document.getElementById('play-btn');
  if(isPlaying){
    btn.textContent = '⏸ Pause';
    btn.classList.add('active');
    playInterval = setInterval(()=>{
      currentMonthIdx = (currentMonthIdx + 1) % 12;
      document.getElementById('month-slider').value = currentMonthIdx;
      updateSeasonalPosition(MONTHS[currentMonthIdx]);
    }, 1200 / playSpeed);
  } else {
    clearInterval(playInterval);
    btn.textContent = '▶ Animate';
    btn.classList.remove('active');
  }
}

function cycleSpeed(){
  const i = speeds.indexOf(playSpeed);
  playSpeed = speeds[(i+1) % speeds.length];
  document.getElementById('speed-btn').textContent = playSpeed+'×';
  if(isPlaying){ clearInterval(playInterval); togglePlay(); togglePlay(); }
}
