import fs from 'fs';
import path from 'path';

// Read the font file
const fontPath = path.join(process.cwd(), 'public/fonts/AdorNoirit.woff2');
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

// Read current index.css
const cssPath = path.join(process.cwd(), 'src/index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Construct the new font-face with embedded base64 data URI
const newFontFace = `@font-face {
  font-family: 'Ador Noirit';
  src: url('data:font/truetype;charset=utf-8;base64,${base64Font}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;

// Find the first @font-face block and replace it
const fontFaceRegex = /@font-face\s*\{[\s\S]*?\}/;
cssContent = cssContent.replace(fontFaceRegex, newFontFace);

// Ensure global enforcement is perfectly set
const globalReset = `html, body, *, :root {
  font-family: 'Ador Noirit', sans-serif !important;
}`;

// Replace the html, body block in index.css
const globalResetRegex = /html,\s*body,\s*\*\s*,\s*:root\s*\{[\s\S]*?\}/;
if (globalResetRegex.test(cssContent)) {
  cssContent = cssContent.replace(globalResetRegex, globalReset);
} else {
  // If not found, insert right after the @font-face block
  cssContent = cssContent.replace(newFontFace, `${newFontFace}\n\n${globalReset}`);
}

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Font successfully embedded in src/index.css with Base64!');
