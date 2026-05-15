// api.js — Wildlife Vision API Integration
const API_BASE = "https://bhavyakapoor20-wildlife-api.hf.space";

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

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            selectedFile = null;
            preview.classList.remove('active');
            dropZone.style.display = '';
            fileInput.value = '';
            identifyBtn.disabled = true;
        });
    }

    identifyBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        await runDetectionAndRedirect(selectedFile);
    });
}

async function runDetectionAndRedirect(imageFile) {
    const identifyBtn = document.getElementById('identify-btn');
    const originalText = identifyBtn ? identifyBtn.textContent : '';

    try {
        // Show loading state on button
        if (identifyBtn) {
            identifyBtn.disabled = true;
            identifyBtn.textContent = 'Analyzing...';
            identifyBtn.style.opacity = '0.7';
        }

        // Read image as base64 for passing to result page
        const imageBase64 = await fileToBase64(imageFile);

        // Call the API
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            // Fallback to /predict endpoint
            const fallbackResponse = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                body: formData,
            });
            if (!fallbackResponse.ok) throw new Error(`API error: ${fallbackResponse.status}`);
            const fallbackData = await fallbackResponse.json();
            sessionStorage.setItem('wildtrack_result', JSON.stringify(fallbackData));
        } else {
            const data = await response.json();
            sessionStorage.setItem('wildtrack_result', JSON.stringify(data));
        }

        // Store original image
        sessionStorage.setItem('wildtrack_image', imageBase64);
        sessionStorage.setItem('wildtrack_filename', imageFile.name);

        // Redirect to result page
        window.location.href = '/result';

    } catch (error) {
        console.error('Detection failed:', error);
        if (identifyBtn) {
            identifyBtn.disabled = false;
            identifyBtn.textContent = originalText;
            identifyBtn.style.opacity = '1';
        }
        alert('Detection failed. Please try another image or check your connection.');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
