const fs = require('fs');

// Read the result page
let content = fs.readFileSync('app/result/page.tsx', 'utf8');

// The simplest fix: create a typed interface to cast speciesInfo
// We will add a SpeciesData interface and cast speciesInfo to it

const speciesInterface = `
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
`;

// Add interface after imports
content = content.replace(
    "gsap.registerPlugin(ScrollTrigger);",
    `gsap.registerPlugin(ScrollTrigger);
${speciesInterface}`
);

// Fix the useState type
content = content.replace(
    'useState<Record<string, unknown> | null>(null)',
    'useState<SpeciesData | null>(null)'
);

// Fix the find cast
content = content.replace(
    "const match = data.species?.find((s: Record<string, unknown>) => \n                    typeof s.common_name === 'string' && s.common_name.toLowerCase() === detectedClass.toLowerCase()",
    "const match = data.species?.find((s: SpeciesData) => \n                    s.common_name.toLowerCase() === detectedClass.toLowerCase()"
);

fs.writeFileSync('app/result/page.tsx', content);
console.log('Fixed result page types');
