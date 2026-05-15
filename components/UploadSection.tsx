import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDetectionStore } from '@/store/detectionStore';

export default function UploadSection() {
    const router = useRouter();
    const { setImage, setResults, setIsLoading, setError, isLoading, error } = useDetectionStore();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) return;
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setImage({ file: selectedFile, previewUrl: url });
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) handleFile(droppedFile);
    };

    const handleIdentify = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const API_BASE = "https://bhavyakapoor20-wildlife-api.hf.space";
            const response = await fetch(`${API_BASE}/predict`, {
                method: "POST",
                body: formData,
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            
            // Map the API response format to our ApiResponse type
            const detections = [{
                class: data.species || data.class || data.prediction || 'Unknown',
                confidence: data.confidence || data.score || data.probability || 0,
                bbox: [0, 0, 0, 0] as [number, number, number, number] // Bbox might not be returned by this API
            }];
            
            setResults({
                detections,
                image_size: [800, 600] // Dummy size as the old API doesn't return it
            });

            // Navigate to results page
            router.push('/result');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Detection failed. Please try another image.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="upload-panel glass" id="react-upload-panel">
            <div className="upload-panel-title">
                <span className="icon">&#x1F50D;</span> Detect a Species
            </div>

            {!previewUrl ? (
                <div 
                    className="drop-zone" 
                    onDragOver={(e) => e.preventDefault()} 
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ cursor: 'pointer' }}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
                        style={{ display: 'none' }} 
                        accept="image/jpeg,image/png,image/webp" 
                    />
                    <div className="drop-zone-text">
                        Drop an image or <strong>click to upload</strong>
                    </div>
                    <div className="drop-zone-formats">Accepts: JPG, PNG, WEBP</div>
                </div>
            ) : (
                <div className="image-preview active">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" />
                    <div className="remove-btn" onClick={() => {
                        setPreviewUrl(null);
                        setFile(null);
                        setImage(null);
                    }}>&times;</div>
                </div>
            )}

            <button 
                className="identify-btn" 
                disabled={!file || isLoading} 
                onClick={handleIdentify}
            >
                {isLoading ? "Scanning..." : "Identify Animal \u2192"}
            </button>

            {isLoading && (
                <div className="loading-spinner active">
                    <div className="spinner"></div>
                    <p>Scanning wildlife...</p>
                </div>
            )}

            {error && (
                <div className="result-error active" style={{ display: 'block', marginTop: '20px' }}>
                    {error}
                </div>
            )}
        </div>
    );
}
