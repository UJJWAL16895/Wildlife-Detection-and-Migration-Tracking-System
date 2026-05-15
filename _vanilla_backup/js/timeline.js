// timeline.js — Act III Night Phase Story
function initTimeline() {
    const chapters = gsap.utils.toArray('.chapter');
    const railFill = document.querySelector('.timeline-rail-fill');

    // Toggle active class on act-three to show/hide timeline rail
    ScrollTrigger.create({
        trigger: '#act-three',
        start: 'top 80%',
        end: 'bottom top',
        toggleClass: 'active'
    });

    // Animate each chapter on scroll
    chapters.forEach((chapter, i) => {
        gsap.fromTo(chapter,
            { opacity: 0, x: i % 2 === 0 ? 60 : -60, y: 40 },
            {
                opacity: 1, x: 0, y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: chapter,
                    start: 'top 80%',
                    end: 'top 40%',
                    scrub: 1
                }
            }
        );
    });

    // Pipeline nodes glow
    const nodes = gsap.utils.toArray('.pipeline-node');
    nodes.forEach((node, i) => {
        ScrollTrigger.create({
            trigger: node,
            start: 'top 70%',
            onEnter: () => {
                gsap.to(node, { delay: i * 0.15, onStart: () => node.classList.add('active') });
            }
        });
    });

    // Timeline rail fill
    if (railFill) {
        gsap.to(railFill, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: '#act-three',
                start: 'top 50%',
                end: 'bottom bottom',
                scrub: 1
            }
        });
    }
}
