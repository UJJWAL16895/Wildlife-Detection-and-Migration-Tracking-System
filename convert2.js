const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Replace <!-- comment --> with {/* comment */}
content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

fs.writeFileSync('app/page.tsx', content);
console.log("Fixed comments in app/page.tsx");
