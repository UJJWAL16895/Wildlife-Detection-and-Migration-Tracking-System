// main.js — Init & Custom Cursor
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Load species data
window.speciesData = null;
fetch('./data/species_encyclopedia.json')
    .then(r => r.json())
    .then(data => { window.speciesData = data; })
    .catch(e => console.error('Failed to load species data:', e));

// Stat counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseFloat(counter.dataset.target);
        const suffix = counter.dataset.suffix || '';
        const isFloat = String(target).includes('.');
        const duration = 2;
        const obj = { val: 0 };
        gsap.to(obj, {
            val: target,
            duration: duration,
            ease: 'power2.out',
            onUpdate: () => {
                counter.textContent = (isFloat ? obj.val.toFixed(1) : Math.floor(obj.val).toLocaleString()) + suffix;
            }
        });
    });
}

// Hero entrance animations
function initHeroAnimations() {
    const tl = gsap.timeline({ delay: 0.5 });
    tl.to('.hero-tagline', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    tl.to('.hero-title', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.4');
    tl.to('.hero-quote', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4');
    tl.to('.hero-stats', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', onStart: animateCounters }, '-=0.3');
    tl.to('.scroll-indicator', { opacity: 1, duration: 0.6 }, '-=0.2');

    // Upload panel scroll trigger
    ScrollTrigger.create({
        trigger: '#upload-section',
        start: 'top 80%',
        onEnter: () => {
            gsap.to('.upload-panel', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
        }
    });
}

// Custom cursor
function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch

    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(212,168,67,0.6)" stroke-width="1.5"/><line x1="12" y1="4" x2="12" y2="20" stroke="rgba(212,168,67,0.4)" stroke-width="0.5"/><line x1="4" y1="12" x2="20" y2="12" stroke="rgba(212,168,67,0.4)" stroke-width="0.5"/></svg>`;
    Object.assign(cursor.style, {
        position: 'fixed', top: 0, left: 0, width: '24px', height: '24px',
        pointerEvents: 'none', zIndex: '9999', transform: 'translate(-50%,-50%)',
        transition: 'none', mixBlendMode: 'difference'
    });
    document.body.appendChild(cursor);
    document.body.style.cursor = 'none';

    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    function lerp() {
        cx += (mx - cx) * 0.12;
        cy += (my - cy) * 0.12;
        cursor.style.transform = `translate(${cx - 12}px, ${cy - 12}px)`;
        requestAnimationFrame(lerp);
    }
    lerp();

    // Scale on hover interactive elements
    document.querySelectorAll('a, button, .animal-card, .drop-zone').forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.style.transform += ' scale(1.5)'; el.style.cursor = 'none'; });
        el.addEventListener('mouseleave', () => { el.style.cursor = ''; });
    });
}

// Pause GSAP when tab hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        gsap.globalTimeline.pause();
    } else {
        gsap.globalTimeline.resume();
    }
});

// CTA scroll back
function initCTA() {
    const ctaBtn = document.getElementById('cta-scroll-back');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            gsap.to(window, { duration: 2, scrollTo: '#upload-section', ease: 'power2.inOut' });
        });
    }
}

// Generate constellation background stars
function initConstellations() {
    const bg = document.querySelector('.constellation-bg');
    if (!bg) return;
    for (let i = 0; i < 80; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;opacity:${0.2+Math.random()*0.6};width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;animation-delay:${Math.random()*3}s`;
        bg.appendChild(star);
    }
}

// Constellation visibility linked to scroll
function initConstellationScroll() {
    const bg = document.querySelector('.constellation-bg');
    if (!bg) return;
    ScrollTrigger.create({
        trigger: '#act-three',
        start: 'top 80%',
        end: 'bottom bottom',
        onEnter: () => gsap.to(bg, { opacity: 0.6, duration: 1 }),
        onLeaveBack: () => gsap.to(bg, { opacity: 0, duration: 0.5 }),
    });
}

// Reset scroll on refresh
window.onbeforeunload = () => { window.scrollTo(0, 0); };

// Smooth Scrolling with Lenis
function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

// Init everything
window.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initParallax();
    initHeroAnimations();
    buildCards();
    initCardAnimations();
    initModal();
    initUpload();
    initTimeline();
    initConstellations();
    initConstellationScroll();
    initCTA();

    // Delay cursor to let page settle
    setTimeout(initCursor, 1000);

    // Debounce resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
    });
});
