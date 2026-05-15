const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Fix loadedCount
content = content.replace(/let loadedCount = 0;/g, 'const loadedCount = 0;');

// Fix quotes
content = content.replace(/"Upload any camera trap image."/g, '&quot;Upload any camera trap image.&quot;');
content = content.replace(/"Identify Animal"/g, '&quot;Identify Animal&quot;');

fs.writeFileSync('app/page.tsx', content);
console.log("Fixed eslint errors");
