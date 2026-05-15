const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Fix dash-cased SVG attributes
content = content.replace(/stroke-width/g, 'strokeWidth');
content = content.replace(/stroke-miterlimit/g, 'strokeMiterlimit');
content = content.replace(/stroke-linejoin/g, 'strokeLinejoin');
content = content.replace(/stroke-linecap/g, 'strokeLinecap');
content = content.replace(/fill-rule/g, 'fillRule');
content = content.replace(/clip-rule/g, 'clipRule');

// Fix missing fragment tags from multi_replace error
// Let's ensure <main> or <> is wrapping if it's broken
// Actually, earlier the error was "Expression expected" on line 33.
// Wait, the multi_replace tool added the UploadSection. Let's make sure the return block is valid.
const returnMatch = content.match(/return \([\s\S]*?\);/);
if (returnMatch) {
  let returnContent = returnMatch[0];
  // Check if it starts with <>
  if (!returnContent.includes('<>')) {
     console.log("Adding fragment");
     content = content.replace(/return \(/, 'return (<>');
     content = content.replace(/\);\s*$/, '</>);');
  }
}

fs.writeFileSync('app/page.tsx', content);
console.log("Fixed SVG attributes in app/page.tsx");
