// modal.js — Encyclopedia Modal
let currentModalIndex = 0;

function initModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    const prevBtn = document.getElementById('modal-prev');
    const nextBtn = document.getElementById('modal-next');

    if (!overlay) return;

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    prevBtn.addEventListener('click', () => navigateModal(-1));
    nextBtn.addEventListener('click', () => navigateModal(1));

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') navigateModal(-1);
        if (e.key === 'ArrowRight') navigateModal(1);
    });
}

function openModal(index) {
    if (!window.speciesData) return;
    currentModalIndex = index;
    const overlay = document.getElementById('modal-overlay');
    renderModal(index);
    overlay.classList.add('active');
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo('.modal-content', { scale: 0.92, y: 30 }, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    gsap.to(overlay, {
        opacity: 0, duration: 0.25,
        onComplete: () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

function navigateModal(dir) {
    if (!window.speciesData) return;
    const total = window.speciesData.species.length;
    currentModalIndex = (currentModalIndex + dir + total) % total;
    renderModal(currentModalIndex);
}

const cardImages = [
    'assets/images/cards/asian-elephant.png',
    'assets/images/cards/common-myna.png',
    'assets/images/cards/donkey.png',
    'assets/images/cards/horse.png',
    'assets/images/cards/house-crow.png',
    'assets/images/cards/indian-grey-hornbill.png',
    'assets/images/cards/bengal-tiger.png',
    'assets/images/cards/plains-zebra.png'
];

function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s.includes('endangered')) return 'endangered';
    if (s.includes('vulnerable')) return 'vulnerable';
    if (s.includes('near')) return 'near-threatened';
    if (s.includes('least')) return 'least-concern';
    return 'domesticated';
}

function renderModal(index) {
    const sp = window.speciesData.species[index];
    const container = document.querySelector('.modal-body');
    if (!container) return;

    const factsHtml = sp.fun_facts.map(f => `<li>${f}</li>`).join('');
    const regions = sp.habitat.regions ? sp.habitat.regions.join(', ') : '';
    const countries = sp.habitat.countries ? sp.habitat.countries.join(', ') : '';

    container.innerHTML = `
        <div class="modal-grid">
            <div>
                <img class="modal-image" src="${cardImages[index]}" alt="${sp.common_name}" loading="lazy">
            </div>
            <div class="modal-info">
                <h2>${sp.common_name}</h2>
                <div class="scientific">${sp.scientific_name}</div>
                <div class="detail-row"><strong>Status:</strong> <span class="status-dot ${getStatusClass(sp.conservation_status)}"></span>${sp.conservation_status}</div>
                <div class="detail-row"><strong>Habitat:</strong> ${sp.habitat.primary}</div>
                <div class="detail-row"><strong>Range:</strong> ${regions}</div>
                <div class="detail-row"><strong>Countries:</strong> ${countries}</div>
                <div class="detail-row"><strong>Diet:</strong> ${sp.diet}</div>
                <div class="detail-row"><strong>Description:</strong> ${sp.physical_description}</div>
            </div>
        </div>
        <div class="modal-facts">
            <h3>Fun Facts</h3>
            <ul>${factsHtml}</ul>
        </div>
    `;
}
