// migration.js — WildTrack Migration Explorer
// ⚠ Replace YOUR_MAPBOX_TOKEN below with your actual token from https://account.mapbox.com
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const SEASONS = {
  0:'Winter',1:'Winter',2:'Spring',3:'Spring',4:'Spring',5:'Summer',
  6:'Summer',7:'Summer',8:'Autumn',9:'Autumn',10:'Autumn',11:'Winter'
};
const SEASON_EMOJI = {Winter:'❄️',Spring:'🌸',Summer:'☀️',Autumn:'🍂'};
const SEASON_COLORS = {Winter:'#60a5fa',Spring:'#4ade80',Summer:'#fbbf24',Autumn:'#f97316'};

// ── SPECIES DATA ─────────────────────────────────────────────────────────────
const SPECIES = {
  elephant: {
    name:'Asian Elephant', sci:'Elephas maximus',
    icon:'🐘', status:'Endangered', dist:'~300 km',
    type:'Seasonal water migration', color:'#d4a843',
    desc:'Asian elephants migrate seasonally following water and food availability, moving between forest and grassland habitats.',
    model:'https://sketchfab.com/models/a8e7e10f005f4baab0a2f5079d759fcd/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Kaziranga','Corbett','Bandipur','Nagarhole','Periyar'],
    route:[
      {lat:27.5,lng:93.2,month:'Jan',location:'Kaziranga, Assam'},
      {lat:26.8,lng:92.5,month:'Mar',location:'Manas, Assam'},
      {lat:25.9,lng:91.8,month:'May',location:'Garo Hills, Meghalaya'},
      {lat:26.5,lng:92.2,month:'Aug',location:'Chirang, Assam'},
      {lat:27.5,lng:93.2,month:'Dec',location:'Kaziranga, Assam'}
    ],
    seasonal:{
      Jan:{lat:27.5,lng:93.2,location:'Kaziranga, Assam'},
      Feb:{lat:27.2,lng:93.0,location:'Kaziranga, Assam'},
      Mar:{lat:26.8,lng:92.5,location:'Manas, Assam'},
      Apr:{lat:26.5,lng:92.1,location:'Manas Buffer Zone'},
      May:{lat:25.9,lng:91.8,location:'Garo Hills, Meghalaya'},
      Jun:{lat:25.7,lng:91.5,location:'Garo Hills, Meghalaya'},
      Jul:{lat:26.0,lng:91.8,location:'Chirang, BTR'},
      Aug:{lat:26.5,lng:92.2,location:'Chirang, Assam'},
      Sep:{lat:26.8,lng:92.6,location:'Manas, Assam'},
      Oct:{lat:27.0,lng:92.8,location:'Manas NP'},
      Nov:{lat:27.3,lng:93.0,location:'Kaziranga Buffer'},
      Dec:{lat:27.5,lng:93.2,location:'Kaziranga, Assam'}
    },
    breeding:{lat:27.5,lng:93.2,location:'Kaziranga National Park'},
    center:[93.0,27.0], zoom:6
  },
  tiger: {
    name:'Bengal Tiger', sci:'Panthera tigris tigris',
    icon:'🐯', status:'Endangered', dist:'~30 km',
    type:'Territory-based movement', color:'#FF8C00',
    desc:'Tigers patrol large territories, moving seasonally with prey migrations across forest corridors.',
    model:'https://sketchfab.com/models/0db8f285e8514c65a12036fcc8d91d07/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Kanha','Ranthambore','Bandhavgarh','Sundarbans'],
    route:[
      {lat:21.5,lng:80.5,month:'Jan',location:'Kanha, MP'},
      {lat:21.0,lng:79.8,month:'Mar',location:'Pench, MP'},
      {lat:20.0,lng:78.8,month:'May',location:'Tadoba'},
      {lat:21.0,lng:80.0,month:'Aug',location:'Pench, MP'},
      {lat:21.5,lng:80.5,month:'Dec',location:'Kanha, MP'}
    ],
    seasonal:{
      Jan:{lat:21.5,lng:80.5,location:'Kanha, MP'},
      Feb:{lat:21.3,lng:80.2,location:'Kanha, MP'},
      Mar:{lat:21.0,lng:79.8,location:'Pench, MP'},
      Apr:{lat:20.5,lng:79.2,location:'Tadoba, Maharashtra'},
      May:{lat:20.0,lng:78.8,location:'Tadoba, Maharashtra'},
      Jun:{lat:20.3,lng:79.2,location:'Tadoba, Maharashtra'},
      Jul:{lat:20.8,lng:79.8,location:'Pench, MP'},
      Aug:{lat:21.0,lng:80.0,location:'Pench, MP'},
      Sep:{lat:21.2,lng:80.2,location:'Kanha, MP'},
      Oct:{lat:21.5,lng:80.5,location:'Kanha, MP'},
      Nov:{lat:21.8,lng:80.8,location:'Kanha, MP'},
      Dec:{lat:21.5,lng:80.5,location:'Kanha, MP'}
    },
    breeding:{lat:21.5,lng:80.5,location:'Kanha National Park'},
    center:[80.2,21.0], zoom:7
  },
  myna: {
    name:'Common Myna', sci:'Acridotheres tristis',
    icon:'🐦', status:'Least Concern', dist:'~100 km',
    type:'Partial migration', color:'#a78bfa',
    desc:'Common mynas are partially migratory, moving to lower altitudes during cold months and returning in spring.',
    model:'https://sketchfab.com/models/62d83ecec89a448693525603a5b9af1d/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Delhi','Mumbai','Chennai','Kolkata'],
    route:[
      {lat:28.6,lng:77.2,month:'Jan',location:'Delhi NCR'},
      {lat:27.0,lng:77.5,month:'Mar',location:'Agra Region'},
      {lat:25.0,lng:78.0,month:'Jun',location:'Madhya Pradesh'},
      {lat:27.0,lng:77.5,month:'Sep',location:'Agra Region'},
      {lat:28.6,lng:77.2,month:'Dec',location:'Delhi NCR'}
    ],
    seasonal:{
      Jan:{lat:28.6,lng:77.2,location:'Delhi NCR'},
      Feb:{lat:28.2,lng:77.3,location:'Gurugram'},
      Mar:{lat:27.0,lng:77.5,location:'Agra Region'},
      Apr:{lat:26.0,lng:77.8,location:'Morena, MP'},
      May:{lat:25.2,lng:78.0,location:'Madhya Pradesh'},
      Jun:{lat:25.0,lng:78.0,location:'Central MP'},
      Jul:{lat:25.5,lng:77.8,location:'MP Foothills'},
      Aug:{lat:26.5,lng:77.6,location:'Chambal Region'},
      Sep:{lat:27.0,lng:77.5,location:'Agra Region'},
      Oct:{lat:27.8,lng:77.3,location:'Mathura'},
      Nov:{lat:28.2,lng:77.2,location:'Delhi Outskirts'},
      Dec:{lat:28.6,lng:77.2,location:'Delhi NCR'}
    },
    breeding:{lat:28.6,lng:77.2,location:'Delhi NCR'},
    center:[77.5,27.0], zoom:6
  },
  crow: {
    name:'House Crow', sci:'Corvus splendens',
    icon:'🐦‍⬛', status:'Least Concern', dist:'~50 km',
    type:'Resident with local movement', color:'#94a3b8',
    desc:'House crows are largely resident but make local seasonal movements following food resources and human settlements.',
    model:'https://sketchfab.com/models/2c8a3414c5a849818dcf8534130ca0df/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Mumbai','Chennai','Colombo','Dhaka'],
    route:[
      {lat:19.0,lng:72.9,month:'Jan',location:'Mumbai Coast'},
      {lat:18.5,lng:73.2,location:'Pune Outskirts',month:'Apr'},
      {lat:17.5,lng:73.5,location:'Konkan Coast',month:'Jul'},
      {lat:18.5,lng:73.2,location:'Pune',month:'Oct'},
      {lat:19.0,lng:72.9,location:'Mumbai',month:'Dec'}
    ],
    seasonal:{
      Jan:{lat:19.0,lng:72.9,location:'Mumbai Coast'},
      Feb:{lat:19.0,lng:72.9,location:'Mumbai'},
      Mar:{lat:18.8,lng:73.0,location:'Thane'},
      Apr:{lat:18.5,lng:73.2,location:'Pune Outskirts'},
      May:{lat:18.2,lng:73.3,location:'Western Ghats Edge'},
      Jun:{lat:18.0,lng:73.4,location:'Raigad'},
      Jul:{lat:17.5,lng:73.5,location:'Konkan Coast'},
      Aug:{lat:17.8,lng:73.4,location:'Ratnagiri'},
      Sep:{lat:18.2,lng:73.3,location:'Raigad'},
      Oct:{lat:18.5,lng:73.2,location:'Pune'},
      Nov:{lat:18.8,lng:73.0,location:'Thane'},
      Dec:{lat:19.0,lng:72.9,location:'Mumbai Coast'}
    },
    breeding:{lat:19.0,lng:72.9,location:'Mumbai Coastal Region'},
    center:[73.1,18.5], zoom:7
  },
  hornbill: {
    name:'Indian Grey Hornbill', sci:'Ocyceros birostris',
    icon:'🦜', status:'Least Concern', dist:'~200 km',
    type:'Altitudinal migration', color:'#fb923c',
    desc:'Indian Grey Hornbills migrate altitudinally, descending from forests during winter months to agricultural plains.',
    model:'https://sketchfab.com/models/4e3419341a0949bb8a30ec53d690eba5/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Satpura','Vindhya','Aravallis','Deccan Plateau'],
    route:[
      {lat:22.5,lng:78.0,month:'Jan',location:'Satpura, MP'},
      {lat:23.0,lng:77.5,month:'Mar',location:'Vindhya Hills'},
      {lat:24.0,lng:76.5,month:'Jun',location:'Aravallis, Raj'},
      {lat:23.0,lng:77.5,month:'Sep',location:'Vindhya Hills'},
      {lat:22.5,lng:78.0,month:'Dec',location:'Satpura, MP'}
    ],
    seasonal:{
      Jan:{lat:22.5,lng:78.0,location:'Satpura, MP'},
      Feb:{lat:22.8,lng:77.8,location:'Pachmarhi, MP'},
      Mar:{lat:23.0,lng:77.5,location:'Vindhya Hills'},
      Apr:{lat:23.5,lng:77.2,location:'Vindhya Foothills'},
      May:{lat:24.0,lng:76.8,location:'Rajasthan Border'},
      Jun:{lat:24.0,lng:76.5,location:'Aravallis, Rajasthan'},
      Jul:{lat:23.8,lng:76.7,location:'Aravalli Foothills'},
      Aug:{lat:23.5,lng:77.0,location:'MP-Raj Border'},
      Sep:{lat:23.0,lng:77.5,location:'Vindhya Hills'},
      Oct:{lat:22.8,lng:77.7,location:'Satpura Buffer'},
      Nov:{lat:22.6,lng:77.9,location:'Satpura Edge'},
      Dec:{lat:22.5,lng:78.0,location:'Satpura, MP'}
    },
    breeding:{lat:22.5,lng:78.0,location:'Satpura Tiger Reserve'},
    center:[77.5,23.0], zoom:6
  },
  zebra: {
    name:'Plains Zebra', sci:'Equus quagga',
    icon:'🦓', status:'Near Threatened', dist:'~2000 km',
    type:'Long-distance seasonal migration', color:'#e2e8f0',
    desc:'Plains zebras undertake one of Africa\'s great migrations, following seasonal rains across the Serengeti ecosystem.',
    model:'https://sketchfab.com/models/ca72c919f935418484b4f275c149981c/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0',
    habitats:['Serengeti','Masai Mara','Ngorongoro','Amboseli'],
    route:[
      {lat:-2.5,lng:35.0,month:'Jan',location:'Serengeti, Tanzania'},
      {lat:-1.5,lng:35.5,month:'Apr',location:'Central Serengeti'},
      {lat:-1.0,lng:35.0,month:'Jun',location:'Northern Serengeti'},
      {lat:-1.3,lng:35.1,month:'Jul',location:'Masai Mara, Kenya'},
      {lat:-2.0,lng:35.2,month:'Oct',location:'Southern Serengeti'},
      {lat:-2.5,lng:35.0,month:'Dec',location:'Serengeti, Tanzania'}
    ],
    seasonal:{
      Jan:{lat:-2.5,lng:35.0,location:'Serengeti South'},
      Feb:{lat:-2.8,lng:35.2,location:'Ndutu, Serengeti'},
      Mar:{lat:-2.2,lng:35.1,location:'Central Serengeti'},
      Apr:{lat:-1.5,lng:35.5,location:'Central Serengeti'},
      May:{lat:-1.2,lng:35.3,location:'Western Corridor'},
      Jun:{lat:-1.0,lng:35.0,location:'Northern Serengeti'},
      Jul:{lat:-1.3,lng:35.1,location:'Masai Mara, Kenya'},
      Aug:{lat:-1.2,lng:35.0,location:'Masai Mara'},
      Sep:{lat:-1.5,lng:35.2,location:'Loliondo'},
      Oct:{lat:-2.0,lng:35.2,location:'Southern Serengeti'},
      Nov:{lat:-2.3,lng:35.0,location:'Serengeti Plains'},
      Dec:{lat:-2.5,lng:35.0,location:'Serengeti South'}
    },
    breeding:{lat:-2.8,lng:35.2,location:'Ndutu, Serengeti'},
    center:[35.1,-1.8], zoom:7
  }
};

// ── MAP INIT ─────────────────────────────────────────────────────────────────
const map = new mapboxgl.Map({
  container:'map',
  style:'mapbox://styles/mapbox/satellite-streets-v12',
  center:[80.0,22.0], zoom:5,
  projection:'globe',
  antialias:true
});

map.addControl(new mapboxgl.NavigationControl({showCompass:true}), 'bottom-right');

let currentSpecies = 'elephant';
let currentMonthIdx = 0;
let animalMarker = null;
let breedingMarker = null;
let habitatMarkers = [];
let playInterval = null;
let isPlaying = false;
let playSpeed = 1;
const speeds = [1,2,4];

// ── MAP LOAD ─────────────────────────────────────────────────────────────────
map.on('style.load', () => {
  map.setFog({
    color:'rgba(10,20,30,0.8)',
    'high-color':'rgba(10,15,30,0.9)',
    'horizon-blend':0.02,
    'space-color':'#070d12',
    'star-intensity':0.8
  });

  map.addSource('route',{type:'geojson',data:emptyGeoJSON()});
  map.addSource('habitat-zones',{type:'geojson',data:emptyGeoJSON()});
  map.addSource('seasonal-pos',{type:'geojson',data:emptyGeoJSON()});

  // Route line
  map.addLayer({id:'route-glow',type:'line',source:'route',paint:{
    'line-color':'rgba(245,166,35,0.2)','line-width':12,'line-blur':8
  }});
  map.addLayer({id:'route-line',type:'line',source:'route',paint:{
    'line-color':'#F5A623','line-width':2.5,'line-opacity':0.8,
    'line-dasharray':[4,2]
  }});

  // Habitat zones
  map.addLayer({id:'habitat-fill',type:'circle',source:'habitat-zones',paint:{
    'circle-radius':30,'circle-color':'rgba(57,255,20,0.08)',
    'circle-stroke-color':'rgba(57,255,20,0.4)','circle-stroke-width':1
  }});

  // Load initial species
  loadSpecies('elephant');
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
function emptyGeoJSON(){return{type:'FeatureCollection',features:[]};}

function buildRouteGeoJSON(sp){
  const coords = sp.route.map(r=>[r.lng,r.lat]);
  return{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'LineString',coordinates:coords}}]};
}

function buildHabitatGeoJSON(sp){
  const features = sp.route.map(r=>({
    type:'Feature',
    geometry:{type:'Point',coordinates:[r.lng,r.lat]},
    properties:{location:r.location,month:r.month}
  }));
  return{type:'FeatureCollection',features};
}

// ── LOAD SPECIES ─────────────────────────────────────────────────────────────
function loadSpecies(key){
  currentSpecies = key;
  const sp = SPECIES[key];

  // Update route
  map.getSource('route').setData(buildRouteGeoJSON(sp));
  map.getSource('habitat-zones').setData(buildHabitatGeoJSON(sp));

  // Update line color
  map.setPaintProperty('route-line','line-color', sp.color);
  map.setPaintProperty('route-glow','line-color', sp.color.replace(')',',0.2)').replace('rgb','rgba'));

  // Fly to
  map.flyTo({center:sp.center, zoom:sp.zoom, duration:1800, essential:true});

  // Update UI
  document.getElementById('species-title').textContent = sp.name;
  document.getElementById('mig-type').textContent = sp.type;
  document.getElementById('mig-dist').textContent = sp.dist;
  document.getElementById('mig-status').textContent = sp.status;
  document.getElementById('mig-desc').textContent = sp.desc;
  document.getElementById('hab-chips').innerHTML = sp.habitats.map(h=>`<span class="hab-chip">${h}</span>`).join('');

  // 3D Model
  document.getElementById('model-loading').style.display='flex';
  document.getElementById('model-iframe').src = sp.model;
  document.getElementById('model-name').textContent = sp.name;
  document.getElementById('model-sci').textContent = sp.sci;

  // Breeding marker
  clearMarkers();
  addBreedingMarker(sp);
  updateSeasonalPosition(sp, MONTHS[currentMonthIdx]);

  // Active button
  document.querySelectorAll('.sp-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.species === key);
  });
}

// ── MARKERS ──────────────────────────────────────────────────────────────────
function clearMarkers(){
  if(animalMarker){animalMarker.remove();animalMarker=null;}
  if(breedingMarker){breedingMarker.remove();breedingMarker=null;}
  habitatMarkers.forEach(m=>m.remove());
  habitatMarkers=[];
}

function makeEl(icon, color, size=40){
  const el = document.createElement('div');
  el.className = 'animal-marker';
  el.innerHTML = icon;
  el.style.borderColor = color;
  el.style.boxShadow = `0 0 20px ${color}88`;
  el.style.width = el.style.height = size+'px';
  el.style.fontSize = (size*0.55)+'px';
  return el;
}

function addBreedingMarker(sp){
  const el = makeEl('💙', '#60a5fa', 32);
  el.title = 'Breeding Ground: '+sp.breeding.location;
  breedingMarker = new mapboxgl.Marker({element:el})
    .setLngLat([sp.breeding.lng, sp.breeding.lat])
    .setPopup(new mapboxgl.Popup({offset:25}).setHTML(
      `<div class="popup-title">🏠 Breeding Ground</div><div class="popup-sub">${sp.breeding.location}</div>`
    ))
    .addTo(map);
}

function updateSeasonalPosition(sp, month){
  const pos = sp.seasonal[month];
  if(!pos) return;

  const season = SEASONS[MONTHS.indexOf(month)];
  const sColor = SEASON_COLORS[season];

  if(animalMarker) animalMarker.remove();
  const el = makeEl(sp.icon, sp.color, 44);
  el.style.animation = 'float 3s ease-in-out infinite';
  animalMarker = new mapboxgl.Marker({element:el, anchor:'center'})
    .setLngLat([pos.lng, pos.lat])
    .setPopup(new mapboxgl.Popup({offset:30}).setHTML(
      `<div class="popup-title">${sp.icon} ${sp.name}</div>
       <div class="popup-sub">${pos.location}</div>
       <div class="popup-sub" style="margin-top:6px;color:${sColor}">${season} — ${FULL_MONTHS[MONTHS.indexOf(month)]}</div>`
    ))
    .addTo(map);

  // Update UI
  document.getElementById('loc-text').textContent = pos.location;
  document.getElementById('loc-month').textContent = FULL_MONTHS[MONTHS.indexOf(month)];

  // Season UI
  document.getElementById('month-display').textContent = month;
  document.getElementById('overlay-month').textContent = FULL_MONTHS[MONTHS.indexOf(month)];
  document.getElementById('season-name').textContent = season;
  document.getElementById('season-emoji').textContent = SEASON_EMOJI[season];

  const badge = document.getElementById('season-badge');
  badge.textContent = season;
  badge.style.color = sColor;
  badge.style.borderColor = sColor;
  badge.style.background = sColor+'18';

  // Smooth fly to animal (subtle)
  map.easeTo({center:[pos.lng, pos.lat], duration:800});
}

// ── CONTROLS ─────────────────────────────────────────────────────────────────
function selectSpecies(key){
  if(isPlaying) togglePlay();
  loadSpecies(key);
}

function onSliderChange(val){
  currentMonthIdx = parseInt(val);
  const sp = SPECIES[currentSpecies];
  updateSeasonalPosition(sp, MONTHS[currentMonthIdx]);
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
      updateSeasonalPosition(SPECIES[currentSpecies], MONTHS[currentMonthIdx]);
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

// ── API INTEGRATION ───────────────────────────────────────────────────────────
// Check if result data exists in sessionStorage and auto-select species
window.addEventListener('DOMContentLoaded', () => {
  const raw = sessionStorage.getItem('wildtrack_result');
  if(raw){
    try{
      const data = JSON.parse(raw);
      const det = (data.detections||[])[0];
      if(det){
        const sp = det.species?.toLowerCase() || '';
        // Map API species to our keys
        const mapping = {
          'tigers':'tiger','elephants':'elephant','asian elephant':'elephant',
          'myna':'myna','common myna':'myna','house-crow':'crow','house crow':'crow',
          'indian-grey-hornbill':'hornbill','zebra':'zebra','plains zebra':'zebra'
        };
        for(const [k,v] of Object.entries(mapping)){
          if(sp.includes(k.replace('-',' '))||sp.includes(k)){
            // Override migration_route if API provides it
            if(det.migration_data?.migration_route?.length){
              const apiRoute = det.migration_data.migration_route;
              SPECIES[v].route = apiRoute;
              // rebuild seasonal from route
              apiRoute.forEach(r=>{
                if(r.month && SPECIES[v].seasonal[r.month]){
                  SPECIES[v].seasonal[r.month] = {lat:r.lat,lng:r.lng,location:r.location};
                }
              });
            }
            setTimeout(()=>{ selectSpecies(v); }, 800);
            break;
          }
        }
      }
    }catch(e){}
  }
});
