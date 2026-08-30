const fs = require('fs');

const oldApp = fs.readFileSync('old_App.tsx', 'utf-8');
const newApp = fs.readFileSync('src/App.tsx', 'utf-8');

// Extract all lines that contain "import " or "import(" and "./pages/"
const importLines = oldApp.split('\n').filter(line => line.includes('import ') || line.includes('import('));
const pageImportLines = importLines.filter(line => line.includes('./pages/') && !newApp.includes(line.trim()));

// Extract all <Route lines
const routeLines = oldApp.split('\n').filter(line => line.includes('<Route '));
// Exclude routes already in newApp
const missingRouteLines = routeLines.filter(line => !newApp.includes(line.trim()));

// Also extract any specific nested routes like <Route path="/knowledge" element={<Navigate ... />} />
// Just grab all missing Route lines.

console.log(`Found ${pageImportLines.length} missing page imports`);
console.log(`Found ${missingRouteLines.length} missing routes`);

// Find the place to insert imports in newApp (after the last lazy import)
let appLines = newApp.split('\n');
const lastLazyIndex = appLines.findIndex((line, idx) => line.includes('const TemplatesPage = lazy') || (line.includes('const ShadowMemoryPage = lazy')));

if (lastLazyIndex !== -1) {
    appLines.splice(lastLazyIndex + 1, 0, ...pageImportLines);
} else {
    console.log("Could not find place to insert lazy imports");
}

// Find the place to insert routes (before the last <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />)
const notFoundRouteIndex = appLines.findIndex(line => line.includes('path="*"'));
if (notFoundRouteIndex !== -1) {
    appLines.splice(notFoundRouteIndex, 0, ...missingRouteLines);
} else {
    console.log("Could not find place to insert routes");
}

fs.writeFileSync('src/App.tsx', appLines.join('\n'));
console.log("Updated src/App.tsx");
