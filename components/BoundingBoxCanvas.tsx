"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { UploadedImage, Detection } from "@/types/detection";

interface BoundingBoxCanvasProps {
    image: UploadedImage;
    detections: Detection[];
    isScanning: boolean;
}

export default function BoundingBoxCanvas({ image, detections, isScanning }: BoundingBoxCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = image.previewUrl;
        img.onload = () => {
            setImageElement(img);
        };
    }, [image.previewUrl]);

    useEffect(() => {
        if (!imageElement || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            
            // Match container dimensions while preserving aspect ratio
            const containerRatio = container.clientWidth / container.clientHeight;
            const imageRatio = imageElement.width / imageElement.height;
            
            let drawWidth = container.clientWidth;
            let drawHeight = container.clientHeight;
            let offsetX = 0;
            let offsetY = 0;
            
            if (containerRatio > imageRatio) {
                // Container is wider than image
                drawWidth = container.clientHeight * imageRatio;
                offsetX = (container.clientWidth - drawWidth) / 2;
            } else {
                // Container is taller than image
                drawHeight = container.clientWidth / imageRatio;
                offsetY = (container.clientHeight - drawHeight) / 2;
            }

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            // Draw image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imageElement, offsetX, offsetY, drawWidth, drawHeight);

            // Draw detections if not scanning
            if (!isScanning) {
                detections.forEach((det, i) => {
                    const [xmin, ymin, xmax, ymax] = det.bbox;
                    
                    // The bbox values are typically normalized (0 to 1) or absolute pixel values
                    // Let's assume normalized for this implementation, if they are absolute we need to scale
                    const isNormalized = xmax <= 1 && ymax <= 1;
                    
                    const boxX = isNormalized ? xmin * drawWidth + offsetX : (xmin / imageElement.width) * drawWidth + offsetX;
                    const boxY = isNormalized ? ymin * drawHeight + offsetY : (ymin / imageElement.height) * drawHeight + offsetY;
                    const boxW = isNormalized ? (xmax - xmin) * drawWidth : ((xmax - xmin) / imageElement.width) * drawWidth;
                    const boxH = isNormalized ? (ymax - ymin) * drawHeight : ((ymax - ymin) / imageElement.height) * drawHeight;

                    // Draw glowing box
                    ctx.strokeStyle = "#D4A843"; // Amber
                    ctx.lineWidth = 2;
                    ctx.shadowColor = "#D4A843";
                    ctx.shadowBlur = 10;
                    ctx.strokeRect(boxX, boxY, boxW, boxH);

                    // Draw label
                    ctx.fillStyle = "rgba(20, 31, 49, 0.8)";
                    ctx.shadowBlur = 0;
                    const labelText = `${det.class} ${(det.confidence * 100).toFixed(1)}%`;
                    ctx.font = "12px monospace";
                    const textWidth = ctx.measureText(labelText).width;
                    
                    ctx.fillRect(boxX, boxY - 20, textWidth + 10, 20);
                    ctx.fillStyle = "#D4A843";
                    ctx.fillText(labelText, boxX + 5, boxY - 6);
                });
            }
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [imageElement, detections, isScanning]);

    // Scanning animation effect
    useEffect(() => {
        if (!isScanning || !containerRef.current) return;
        
        const scanner = document.createElement('div');
        scanner.className = 'scanner-line';
        scanner.style.position = 'absolute';
        scanner.style.top = '0';
        scanner.style.left = '0';
        scanner.style.width = '100%';
        scanner.style.height = '2px';
        scanner.style.backgroundColor = '#7dd3fc';
        scanner.style.boxShadow = '0 0 10px #7dd3fc, 0 0 20px #7dd3fc';
        scanner.style.zIndex = '10';
        
        containerRef.current.appendChild(scanner);
        
        const anim = gsap.to(scanner, {
            y: containerRef.current.clientHeight,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        
        return () => {
            anim.kill();
            scanner.remove();
        };
    }, [isScanning]);

    return (
        <div ref={containerRef} className="relative w-full h-[60vh] md:h-[80vh] bg-black/50 overflow-hidden rounded-lg">
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-contain" />
            <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg pointer-events-none" />
        </div>
    );
}
