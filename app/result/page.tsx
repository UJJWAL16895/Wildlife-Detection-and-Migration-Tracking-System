"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDetectionStore } from '@/store/detectionStore';
import Link from 'next/link';
import BoundingBoxCanvas from '@/components/BoundingBoxCanvas';
import SilhouetteCarousel from '@/components/SilhouetteCarousel';
import AmberButton from '@/components/AmberButton';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SpeciesData {
    common_name: string;
    scientific_name: string;
    physical_description?: string;
    diet?: string;
    fun_facts?: string[];
    conservation_status?: string;
    metadata?: {
        image_url?: string;
        population_estimate?: {
            global_total?: number;
        };
    };
    silhouette_url?: string;
}


export default function ResultPage() {
    const router = useRouter();
    const { image, results } = useDetectionStore();
    const [speciesInfo, setSpeciesInfo] = useState<SpeciesData | null>(null);

    // Redirect to home if no image/results are available
    useEffect(() => {
        if (!image || !results) {
            router.push('/');
        }
    }, [image, results, router]);

    useEffect(() => {
        if (!results) return;
        
        const detectedClass = results.detections[0]?.class;
        if (!detectedClass) return;

        // Fetch encyclopedia data
        fetch('/data/species_encyclopedia.json')
            .then(res => res.json())
            .then(data => {
                const match = data.species?.find((s: SpeciesData) => 
                    s.common_name.toLowerCase() === detectedClass.toLowerCase()
                );
                if (match) setSpeciesInfo(match);
            })
            .catch(console.error);
    }, [results]);

    useEffect(() => {
        if (!image || !results) return;
        
        // GSAP Scroll Animations
        const ctx = gsap.context(() => {
            // Act 1 to Act 2 transition (Reveal -> Profile)
            gsap.fromTo('.profile-section',
                { opacity: 0, y: 100 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.profile-section',
                        start: 'top 80%',
                    }
                }
            );
        });

        return () => ctx.revert();
    }, [image, results]);

    if (!image || !results) {
        return <div className="min-h-screen bg-[#0d1420] text-white flex items-center justify-center">Loading...</div>;
    }

    const primaryDetection = results.detections[0];

    return (
        <main className="min-h-screen bg-[#0d1420] text-[#ecf2ff] selection:bg-[#7dd3fc] selection:text-[#0d1420]">
            {/* Header / Navigation */}
            <header className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    <Link href="/" className="text-[#7dd3fc] hover:text-white transition-colors flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
                        <span>←</span> Back to Scanner
                    </Link>
                </div>
                <div className="logo-badge" style={{ position: 'relative', top: '0', right: '0' }}>
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                        <path d="M16 2L2 9L16 16L30 9L16 2Z" stroke="#7DD3FC" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M2 23L16 30L30 23" stroke="#7DD3FC" strokeWidth="2" strokeLinejoin="round"/>
                        <path d="M2 16L16 23L30 16" stroke="#7DD3FC" strokeWidth="2" strokeLinejoin="round"/>
                    </svg>
                </div>
            </header>

            {/* ACT I: The Reveal */}
            <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left: Text & Confidence */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-[#d4a843] font-mono tracking-widest text-sm uppercase">
                            <span className="w-8 h-[1px] bg-[#d4a843]"></span>
                            Match Confirmed
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-light tracking-tighter leading-none">
                            {primaryDetection?.class || 'Unknown Species'}
                        </h1>
                        
                        {speciesInfo && (
                            <h2 className="text-xl md:text-2xl text-white/50 italic font-serif">
                                {speciesInfo.scientific_name}
                            </h2>
                        )}

                        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                            <div className="flex justify-between items-end mb-4 font-mono text-sm">
                                <span className="text-white/50">Confidence Score</span>
                                <span className="text-[#7dd3fc] text-2xl">
                                    {(primaryDetection?.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#38bdf8] to-[#7dd3fc]" 
                                    style={{ width: `${primaryDetection?.confidence * 100}%` }}
                                />
                            </div>
                        </div>

                        {speciesInfo && (
                            <p className="mt-6 text-lg text-white/70 leading-relaxed">
                                {speciesInfo.physical_description}
                            </p>
                        )}
                    </div>

                    {/* Right: Bounding Box Canvas */}
                    <div className="lg:col-span-7 w-full">
                        <BoundingBoxCanvas 
                            image={image} 
                            detections={results.detections} 
                            isScanning={false} 
                        />
                    </div>
                </div>
            </section>

            {/* Silhouette Divider */}
            <div className="w-full border-y border-white/5 bg-black/20 backdrop-blur-md">
                <SilhouetteCarousel activeSpeciesName={primaryDetection?.class} />
            </div>

            {/* ACT II: The Profile */}
            {speciesInfo && (
                <section className="profile-section relative min-h-screen py-24 px-6 md:px-12 lg:px-24 bg-[#141f31]">
                    <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16">
                        
                        {/* Profile Image & Status */}
                        <div className="flex flex-col gap-8">
                            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={speciesInfo.metadata?.image_url || image.previewUrl} 
                                    alt={speciesInfo.common_name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-white/50 mb-1 font-mono">Status</div>
                                        <div className="text-xl text-[#d4a843]">{speciesInfo.conservation_status}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs uppercase tracking-widest text-white/50 mb-1 font-mono">Pop. Estimate</div>
                                        <div className="text-xl text-white">
                                            {speciesInfo.metadata?.population_estimate?.global_total?.toLocaleString() || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details & Facts */}
                        <div className="flex flex-col justify-center gap-12">
                            <div>
                                <h3 className="text-sm font-mono text-[#7dd3fc] uppercase tracking-widest mb-4 flex items-center gap-4">
                                    <span className="w-8 h-[1px] bg-[#7dd3fc]/30"></span>
                                    Diet & Ecology
                                </h3>
                                <p className="text-xl text-white/80 leading-relaxed font-light">
                                    {speciesInfo.diet}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-mono text-[#7dd3fc] uppercase tracking-widest mb-6 flex items-center gap-4">
                                    <span className="w-8 h-[1px] bg-[#7dd3fc]/30"></span>
                                    Field Notes
                                </h3>
                                <ul className="flex flex-col gap-6">
                                    {speciesInfo.fun_facts?.slice(0, 3).map((fact: string, idx: number) => (
                                        <li key={idx} className="flex gap-4 items-start">
                                            <span className="text-[#d4a843] font-mono mt-1">0{idx + 1}</span>
                                            <span className="text-white/70 leading-relaxed">{fact}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-8">
                                <AmberButton onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                                    View Migration Data
                                </AmberButton>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ACT III: The Map (Placeholder for now) */}
            <section className="relative min-h-[50vh] flex flex-col items-center justify-center py-24 bg-black">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-light mb-4">Migration Patterns</h2>
                    <p className="text-white/50 font-mono text-sm uppercase tracking-widest">Geographic Data Visualization</p>
                </div>
                
                <div className="w-full max-w-5xl h-[400px] border border-white/10 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <p className="text-white/30 font-mono">[ Mapbox Integration Pending ]</p>
                </div>
            </section>
        </main>
    );
}
