"use client";
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Species {
    common_name: string;
    scientific_name: string;
    silhouette_url: string;
}

export default function SilhouetteCarousel({ activeSpeciesName }: { activeSpeciesName?: string }) {
    const [speciesData, setSpeciesData] = useState<Species[]>([]);

    useEffect(() => {
        fetch('/data/species_encyclopedia.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.species) setSpeciesData(data.species);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (speciesData.length === 0) return;
        
        // Basic horizontal scroll animation or highlight animation
        const ctx = gsap.context(() => {
            gsap.fromTo('.silhouette-item', 
                { opacity: 0, y: 20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    stagger: 0.1, 
                    duration: 0.8, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: '.silhouette-container',
                        start: 'top 80%'
                    }
                }
            );
        });
        
        return () => ctx.revert();
    }, [speciesData]);

    if (!speciesData.length) return null;

    return (
        <div className="silhouette-container w-full overflow-x-auto py-12 hide-scrollbar">
            <div className="flex gap-12 min-w-max px-12 items-center">
                {speciesData.map((s, i) => {
                    const isActive = activeSpeciesName && s.common_name.toLowerCase() === activeSpeciesName.toLowerCase();
                    return (
                        <div 
                            key={i} 
                            className={`silhouette-item flex flex-col items-center gap-4 transition-all duration-500 ${isActive ? 'scale-110 opacity-100' : 'opacity-40 grayscale blur-[1px]'}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={s.silhouette_url || `/assets/images/silhouettes/${s.common_name.toLowerCase().replace(/ /g, '_')}.svg`} 
                                alt={s.common_name} 
                                className={`h-24 object-contain ${isActive ? 'drop-shadow-[0_0_15px_rgba(212,168,67,0.8)]' : ''}`}
                                onError={(e) => {
                                    // Fallback if silhouette is missing
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="gray"/></svg>';
                                }}
                            />
                            <div className="text-center">
                                <div className={`font-mono text-sm uppercase tracking-widest ${isActive ? 'text-[#d4a843]' : 'text-white/50'}`}>
                                    {s.common_name}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
