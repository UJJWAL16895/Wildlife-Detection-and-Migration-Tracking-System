// api.js — Wildlife Vision API Integration
// ─────────────────────────────────────────────────────────────────────────────
// Handles file selection, API call to /analyze-image, sessionStorage writes,
// and redirect to the /result page (Next.js wildtrack-result app).
// Adds: pulse animation on button, premium glass toast, explicit file guard.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "https://bhavyakapoor20-wildlife-api.hf.space";

// ── Drop zone + upload flow ───────────────────────────────────────────────────
function initUpload() {
    const dropZone    = document.getElementById('drop-zone');
    const fileInput   = document.getElementById('file-input');
    const preview     = document.getElementById('image-preview');
    const previewImg  = document.getElementById('preview-img');
    const removeBtn   = document.getElementById('remove-preview');
    const identifyBtn = document.getElementById('identify-btn');
    let selectedFile  = null;

    if (!dropZone) return;

    // Drag-and-drop
    dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', ()  => { dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    });

    // Click-to-browse
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

    // Remove preview
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            selectedFile = null;
            preview.classList.remove('active');
            dropZone.style.display = '';
            fileInput.value = '';
            identifyBtn.disabled = true;
        });
    }

    // Identify button click
    identifyBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            showWildtrackToast('Please upload an image first.', 'warn');
            return;
        }
        await runDetectionAndRedirect(selectedFile);
    });
}

// ── Core detection flow ───────────────────────────────────────────────────────
async function runDetectionAndRedirect(imageFile) {
    const identifyBtn  = document.getElementById('identify-btn');
    const originalHTML = identifyBtn ? identifyBtn.innerHTML : '';

    try {
        // 1. Loading state: disable + pulse animation
        if (identifyBtn) {
            identifyBtn.disabled  = true;
            identifyBtn.innerHTML = 'Analyzing&hellip;';
            identifyBtn.style.opacity   = '0.8';
            identifyBtn.style.animation = 'wt-btn-pulse 1.2s ease-in-out infinite';
        }
        _wtInjectStyles();

        // 2. Convert file to base64 (Promise-wrapped FileReader)
        const imageBase64 = await fileToBase64(imageFile);

        // 3. POST to API
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            // Try to read any error JSON the API sent back
            let errBody = null;
            try { errBody = await response.json(); } catch (_) {}
            console.warn('[WildTrack] /analyze-image returned', response.status, errBody);

            // Store a structured error result so the result page can show something useful
            sessionStorage.setItem('wildtrack_result', JSON.stringify({
                error: true,
                status: response.status,
                detail: errBody,
                detections: []
            }));
        } else {
            const data = await response.json();
            console.log('[WildTrack] API response:', data);
            sessionStorage.setItem('wildtrack_result', JSON.stringify(data));
        }

        // 4. Store image (base64 already resolved above, both writes complete before redirect)
        sessionStorage.setItem('wildtrack_image',    imageBase64);
        sessionStorage.setItem('wildtrack_filename', imageFile.name);

        // 5. Navigate
        window.location.href = 'result/index.html';

    } catch (error) {
        console.error('[WildTrack] Detection failed:', error);

        // Store the error so the result page can show a diagnostic instead of empty state
        try {
            sessionStorage.setItem('wildtrack_result', JSON.stringify({
                error: true,
                message: error.message || 'Unknown error',
                detections: []
            }));
            // Still store the image if we have it (base64 may have resolved before the error)
        } catch (_) {}

        if (identifyBtn) {
            identifyBtn.disabled  = false;
            identifyBtn.innerHTML = originalHTML;
            identifyBtn.style.opacity   = '1';
            identifyBtn.style.animation = '';
        }

        showWildtrackToast('Detection failed — redirecting with error details.', 'error');

        // Always redirect so user sees result page context, not a blank alert
        setTimeout(function() { window.location.href = '/result'; }, 1500);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wraps FileReader in a Promise so the redirect only fires after base64 is ready. */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** Injects animation keyframes into <head> once. */
function _wtInjectStyles() {
    if (document.getElementById('wt-api-styles')) return;
    const s = document.createElement('style');
    s.id = 'wt-api-styles';
    s.textContent = [
        '@keyframes wt-btn-pulse{0%,100%{box-shadow:0 0 0 0 rgba(245,166,35,.45)}50%{box-shadow:0 0 0 10px rgba(245,166,35,0)}}',
        '@keyframes wt-toast-in{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}',
        '@keyframes wt-toast-out{from{opacity:1;transform:translateX(-50%) translateY(0)}to{opacity:0;transform:translateX(-50%) translateY(14px)}}',
    ].join('');
    document.head.appendChild(s);
}

/**
 * Shows a self-dismissing glass-morphism toast.
 * @param {string} message  - Text to display.
 * @param {'error'|'warn'|'info'} type - Visual variant.
 */
function showWildtrackToast(message, type) {
    _wtInjectStyles();

    var cfg = {
        error: { bg: 'rgba(20,4,4,0.92)',   border: 'rgba(239,68,68,0.55)',  icon: '\u26A0' },
        warn:  { bg: 'rgba(20,12,2,0.92)',  border: 'rgba(245,166,35,0.55)', icon: '\u26A1' },
        info:  { bg: 'rgba(4,14,26,0.92)',  border: 'rgba(0,229,204,0.45)',  icon: '\u2139' },
    };
    var c = cfg[type] || cfg.error;

    var toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    Object.assign(toast.style, {
        position:            'fixed',
        bottom:              '32px',
        left:                '50%',
        transform:           'translateX(-50%)',
        zIndex:              '99999',
        display:             'flex',
        alignItems:          'center',
        gap:                 '10px',
        padding:             '13px 22px',
        borderRadius:        '12px',
        border:              '1px solid ' + c.border,
        background:          c.bg,
        backdropFilter:      'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        color:               '#F0EDE8',
        fontFamily:          'Inter, system-ui, sans-serif',
        fontSize:            '14px',
        fontWeight:          '500',
        letterSpacing:       '0.01em',
        boxShadow:           '0 8px 32px rgba(0,0,0,.55)',
        animation:           'wt-toast-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        whiteSpace:          'nowrap',
        maxWidth:            'calc(100vw - 48px)',
        pointerEvents:       'none',
    });
    toast.innerHTML = '<span style="font-size:16px;flex-shrink:0">' + c.icon + '</span> ' + message;
    document.body.appendChild(toast);

    setTimeout(function () {
        toast.style.animation = 'wt-toast-out 0.35s cubic-bezier(0.16,1,0.3,1) forwards';
        toast.addEventListener('animationend', function () { toast.remove(); }, { once: true });
    }, 4000);
}
