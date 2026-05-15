const fs = require('fs');

let html = fs.readFileSync('_vanilla_backup/index.html', 'utf8');

// Extract body content
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
if (!bodyMatch) {
    console.log("No body found");
    process.exit(1);
}

let content = bodyMatch[1];

// Remove script tags at the bottom
content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

// Convert class to className
content = content.replace(/class=/g, 'className=');

// Convert inline styles
content = content.replace(/style="([^"]*)"/g, (match, styleString) => {
    const styleObj = {};
    styleString.split(';').forEach(rule => {
        if (!rule.trim()) return;
        let [key, value] = rule.split(':');
        if (!key || !value) return;
        key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        styleObj[key] = value.trim();
    });
    return `style={${JSON.stringify(styleObj)}}`;
});

// Self-closing tags
const selfClosingTags = ['img', 'input', 'br', 'hr', 'source', 'link', 'meta'];
selfClosingTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b([^>]*?)(?<!/)>`, 'gi');
    content = content.replace(regex, `<${tag}$1 />`);
});

// Fix SVG attributes
const svgAttributes = ['viewBox', 'strokeWidth', 'strokeLinecap', 'strokeDasharray', 'strokeDashoffset', 'fillRule', 'clipRule', 'strokeLinejoin', 'stopColor'];
svgAttributes.forEach(attr => {
    const lowerAttr = attr.toLowerCase();
    const regex = new RegExp(`\\b${lowerAttr}=`, 'g');
    content = content.replace(regex, `${attr}=`);
});

// Fix other specific camelCases
content = content.replace(/xmlns:xlink/g, 'xmlnsXlink');
content = content.replace(/xlink:href/g, 'xlinkHref');
content = content.replace(/patternunits/g, 'patternUnits');
content = content.replace(/gradientunits/g, 'gradientUnits');
content = content.replace(/gradienttransform/g, 'gradientTransform');
content = content.replace(/transformorigin/g, 'transformOrigin');
content = content.replace(/mixblendmode/g, 'mixBlendMode');

const tsxContent = `
"use client";
import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
    useEffect(() => {
        // We will load the scripts dynamically for now
        const scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js",
            "https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js",
            "/js/parallax.js",
            "/js/api.js",
            "/js/cards.js",
            "/js/modal.js",
            "/js/timeline.js",
            "/js/main.js"
        ];
        
        let loadedCount = 0;
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // ensure execution order
            document.body.appendChild(script);
        });

        return () => {
            // cleanup if needed
        };
    }, []);

    return (
        <>
            ${content}
        </>
    );
}
`;

fs.writeFileSync('app/page.tsx', tsxContent);
console.log("Written app/page.tsx");
