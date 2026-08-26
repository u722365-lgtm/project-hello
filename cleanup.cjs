const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx,d.ts}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Pattern 1: || import.meta.env.VITE_API_KEY
  content = content.replace(/ \|\| import\.meta\.env\.VITE_API_KEY/g, '');
  // Pattern 2: ?? import.meta.env.VITE_API_KEY
  content = content.replace(/ \?\? import\.meta\.env\.VITE_API_KEY/g, '');
  // Pattern 3: = import.meta.env.VITE_API_KEY ?? \"\"
  content = content.replace(/= import\.meta\.env\.VITE_API_KEY \?\? \"\"/g, '= \"\"');
  // Pattern 4: = import.meta.env.VITE_API_KEY;
  content = content.replace(/= import\.meta\.env\.VITE_API_KEY;/g, '= \"\";');
  // Pattern 5: apikey: import.meta.env.VITE_API_KEY
  content = content.replace(/apikey: import\.meta\.env\.VITE_API_KEY/g, 'apikey: \"\"');
  // Pattern 6: ${import.meta.env.VITE_API_KEY}
  content = content.replace(/\$\{import\.meta\.env\.VITE_API_KEY\}/g, '');
  // Pattern 7: readonly VITE_API_KEY: string;
  content = content.replace(/readonly VITE_API_KEY: string;/g, '');
  // Pattern 8: VITE_API_KEY: 'test-key',
  content = content.replace(/VITE_API_KEY: 'test-key',/g, '');
  // Pattern 9: // Or for Vite: import.meta.env.VITE_API_KEY
  content = content.replace(/\/\/ Or for Vite: import\.meta\.env\.VITE_API_KEY/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
