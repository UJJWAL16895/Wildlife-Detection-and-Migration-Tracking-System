gsap.registerPlugin(ScrollTrigger);

const CARD_ORDER = [
    { name: 'Asian Elephant', scientific: 'Elephas maximus', status: 'Endangered', range: 'South & Southeast Asia', img: 'assets/images/cards/asian-elephant.png', statusClass: 'endangered', idx: 0 },
    { name: 'Bengal Tiger', scientific: 'Panthera tigris tigris', status: 'Endangered', range: 'India, Nepal, Bangladesh', img: 'assets/images/cards/bengal-tiger.png', statusClass: 'endangered', idx: 6 },
    { name: 'Plains Zebra', scientific: 'Equus quagga', status: 'Near Threatened', range: 'Eastern & Southern Africa', img: 'assets/images/cards/plains-zebra.png', statusClass: 'near-threatened', idx: 7 },
    { name: 'Common Myna', scientific: 'Acridotheres tristis', status: 'Least Concern', range: 'South Asia, worldwide', img: 'assets/images/cards/common-myna.png', statusClass: 'least-concern', idx: 1 },
    { name: 'House Crow', scientific: 'Corvus splendens', status: 'Least Concern', range: 'South Asia, Africa', img: 'assets/images/cards/house-crow.png', statusClass: 'least-concern', idx: 4 },
    { name: 'Indian Grey Hornbill', scientific: 'Ocyceros birostris', status: 'Least Concern', range: 'South Asia', img: 'assets/images/cards/indian-grey-hornbill.png', statusClass: 'least-concern', idx: 5 },
    { name: 'Donkey', scientific: 'Equus africanus asinus', status: 'Domesticated', range: 'Worldwide', img: 'assets/images/cards/donkey.png', statusClass: 'domesticated', idx: 2 },
    { name: 'Horse', scientific: 'Equus caballus', status: 'Domesticated', range: 'Worldwide', img: 'assets/images/cards/horse.png', statusClass: 'domesticated', idx: 3 },
];

let cards = [];
let totalCards = 0;
let currentIndex = 0;

function buildCards() {
    const viewport = document.querySelector('.cards-viewport');
    if (!viewport) return;

    CARD_ORDER.forEach((animal, i) => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        card.dataset.species = animal.name;
        card.dataset.index = i;
        card.innerHTML = `
            <div class="card-glare"></div>
            <div class="card-image">
                <img src="${animal.img}" alt="${animal.name}" loading="lazy" />
            </div>
            <div class="card-info">
                <h2 class="card-name">${animal.name}</h2>
                <p class="card-latin">${animal.scientific}</p>
                <hr class="card-divider" />
                <p class="card-range">Range: ${animal.range}</p>
                <p class="card-status">
                    <span class="status-dot ${animal.statusClass}"></span> ${animal.status}
                </p>
                <button class="card-btn">VIEW FULL PROFILE &rarr;</button>
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (card.classList.contains('slot-b') && openModal) {
                openModal(animal.idx);
            }
        });
        viewport.appendChild(card);
    });

    // Build progress dots
    const hudDots = document.querySelector('.hud-dots');
    if (hudDots) {
        CARD_ORDER.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'hud-dot';
            hudDots.appendChild(dot);
        });
    }
}

function initCardAnimations() {
    cards = document.querySelectorAll('.animal-card');
    totalCards = cards.length;
    if (totalCards === 0) return;

    // Center all cards initially
    gsap.set(cards, { top: '50%', left: '50%', xPercent: -50, yPercent: -50 });

    const scrollST = ScrollTrigger.create({
        trigger: "#act-two",
        pin: true,
        scrub: 1, // Let Lenis handle the main smoothness, use 1 for slight inertia
        start: "top top",
        end: `+=${totalCards * 200}vh`, // Longer distance for smooth/slow transition
        onUpdate(self) {
            // progress starts at -1.2 so Card 0 spawns from bottom right cleanly
            const progress = self.progress * (totalCards + 1.2) - 1.2;
            
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            
            const diagonalLength = Math.hypot(vw, vh) || 1;
            const dirX = vw / diagonalLength;
            const dirY = vh / diagonalLength;
            
            // Adjust step to bring cards closer together visually
            const step = Math.max(300, Math.min(vw, vh) * 0.45); 
            const edgeRel = (diagonalLength * 0.5) / step;

            let closestIdx = 0;
            let minAbs = Infinity;

            cards.forEach((card, i) => {
                // Modulo allows infinite loop visual when cards wrap around
                let rel = i - progress;
                rel = ((rel + totalCards / 2) % totalCards + totalCards) % totalCards - totalCards / 2;
                
                const absRel = Math.abs(rel);

                if (absRel < minAbs) {
                    minAbs = absRel;
                    closestIdx = i;
                }

                // Smooth pause near the center
                const pauseRadius = 0.5;
                const pauseStrength = 0.65;
                const t = Math.min(1, absRel / pauseRadius);
                const smooth = t * t * (3 - 2 * t);
                const speedFactor = (1 - pauseStrength) + pauseStrength * smooth;
                const relVisual = rel * speedFactor;

                const absVisual = Math.abs(relVisual);
                const edgeNorm = absVisual / Math.max(edgeRel, 0.001);

                const x = relVisual * step * dirX;
                const y = relVisual * step * dirY;

                const linger = Math.max(0, absVisual - 0.15);
                const scale = Math.max(0.1, 1 - Math.pow(linger / (edgeRel * 0.82), 1.4));
                
                // Keep blur low so it looks cleaner when entering/exiting
                const blur = Math.min(8, Math.pow(edgeNorm, 1.2) * 8);
                
                const validEdgeNorm = Math.max(0, edgeNorm / 1.05);
                let opacity = 1 - Math.pow(validEdgeNorm, 2.0);
                opacity = Math.max(0, Math.min(1, isNaN(opacity) ? 0 : opacity));

                // Dynamic glow for the center card
                const glow = Math.max(0, 1 - absRel * 2);
                const boxShadow = `0 0 ${glow * 80}px rgba(212,168,67,${glow * 0.45}), 0 ${glow * 40 + 10}px 80px rgba(0,0,0,0.6)`;

                // Position card
                gsap.set(card, {
                    x: x,
                    y: y,
                    scale: scale,
                    opacity: opacity,
                    filter: `blur(${blur}px)`,
                    boxShadow: boxShadow,
                    zIndex: 200 - Math.floor(absVisual * 10)
                });
                
                card.style.display = opacity > 0.01 ? 'block' : 'none';

                if (absRel < 0.4) {
                    card.classList.add('slot-b');
                    card.style.pointerEvents = 'auto';
                } else {
                    card.classList.remove('slot-b');
                    card.style.pointerEvents = 'none';
                }
            });

            if (currentIndex !== closestIdx) {
                currentIndex = closestIdx;
                updateHUD(currentIndex);
            }
        }
    });

    // Hover Effects
    cards.forEach(card => {
        const img = card.querySelector('.card-image img');
        const info = card.querySelector('.card-info');
        const btn = card.querySelector('.card-btn');
        const glare = card.querySelector('.card-glare');

        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('slot-b')) return; // only active card
            gsap.to(img, { scale: 1.07, duration: 0.5, ease: 'power2.out' });
            gsap.to(info, { y: -6, duration: 0.4, ease: 'power2.out' });
            gsap.to(btn, { letterSpacing: '0.35em', duration: 0.3 });
        });

        card.addEventListener('mousemove', (e) => {
            if (!card.classList.contains('slot-b')) return;
            const r = card.getBoundingClientRect();
            const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
            const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
            gsap.to(card, {
                rotateY: dx * 14,
                rotateX: -dy * 9,
                duration: 0.15,
                ease: 'none',
                transformPerspective: 1200
            });
            glare.style.background = `radial-gradient(circle at ${50 + dx * 40}% ${50 + dy * 40}%, rgba(255,220,100,0.15) 0%, transparent 65%)`;
        });

        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('slot-b')) return;
            gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
            gsap.to(img, { scale: 1, duration: 0.5, ease: 'power2.inOut' });
            gsap.to(info, { y: 0, duration: 0.4, ease: 'power2.inOut' });
            gsap.to(btn, { letterSpacing: '0.25em', duration: 0.3 });
            glare.style.background = 'none';
        });
    });

    // Force an initial update to render positions
    scrollST.update();
}

function updateHUD(index) {
    const label = document.querySelector('.hud-label');
    if (label) {
        label.textContent = `${String(index + 1).padStart(2, '0')} / ${String(totalCards).padStart(2, '0')}`;
    }
    document.querySelectorAll('.hud-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}
