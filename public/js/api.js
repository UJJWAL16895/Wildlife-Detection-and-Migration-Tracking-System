// api.js — Wildlife Vision API Integration
const API_BASE = "https://bhavyakapoor20-wildlife-api.hf.space";

async function predictSpecies(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
        showLoadingState();
        const response = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        displayResult(data);
    } catch (error) {
        displayError("Detection failed. Please try another image.");
        console.error(error);
    } finally {
        hideLoadingState();
    }
}

function showLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    const btn = document.getElementById('identify-btn');
    if (spinner) spinner.classList.add('active');
    if (btn) btn.disabled = true;
    const result = document.getElementById('result-panel');
    if (result) { result.classList.remove('active'); result.style.display = 'none'; }
}

function hideLoadingState() {
    const spinner = document.querySelector('.loading-spinner');
    const btn = document.getElementById('identify-btn');
    if (spinner) spinner.classList.remove('active');
    if (btn) btn.disabled = false;
}

function displayResult(data) {
    const panel = document.getElementById('result-panel');
    if (!panel) return;

    const species = data.species || data.class || data.prediction || 'Unknown';
    const confidence = data.confidence || data.score || data.probability || 0;
    const confPercent = confidence > 1 ? confidence : Math.round(confidence * 100);

    // Find scientific name from encyclopedia
    let scientificName = '';
    if (window.speciesData) {
        const match = window.speciesData.species.find(s =>
            s.common_name.toLowerCase() === species.toLowerCase()
        );
        if (match) scientificName = match.scientific_name;
    }

    panel.innerHTML = `
        <div class="result-species">${species}</div>
        ${scientificName ? `<div class="result-scientific">${scientificName}</div>` : ''}
        <div class="result-confidence">
            <span class="mono-data" style="color: var(--c-bio)">${confPercent}% confidence</span>
            <div class="confidence-bar">
                <div class="confidence-fill" id="conf-fill"></div>
            </div>
        </div>
    `;
    panel.style.display = 'block';
    panel.classList.add('active');

    // Animate confidence bar
    requestAnimationFrame(() => {
        const fill = document.getElementById('conf-fill');
        if (fill) fill.style.width = confPercent + '%';
    });

    gsap.fromTo(panel, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" });
}

function displayError(msg) {
    const panel = document.getElementById('result-panel');
    if (!panel) return;
    panel.innerHTML = `<div class="result-error">${msg}</div>`;
    panel.style.display = 'block';
    panel.classList.add('active');
    gsap.fromTo(panel, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
}

// Drop zone setup
function initUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeBtn = document.getElementById('remove-preview');
    const identifyBtn = document.getElementById('identify-btn');
    let selectedFile = null;

    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.classList.add('active');
            dropZone.style.display = 'none';
            identifyBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
        selectedFile = null;
        preview.classList.remove('active');
        dropZone.style.display = '';
        fileInput.value = '';
        identifyBtn.disabled = true;
        const result = document.getElementById('result-panel');
        if (result) { result.classList.remove('active'); result.style.display = 'none'; }
    });

    identifyBtn.addEventListener('click', () => {
        if (selectedFile) predictSpecies(selectedFile);
    });
}
