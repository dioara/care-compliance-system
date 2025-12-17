#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.join(__dirname, 'client/src/pages');

// Responsive design fixes to apply
const fixes = [
  // Fix: Replace fixed width classes with responsive equivalents
  {
    pattern: /className="([^"]*)\bw-\[(\d+)px\]([^"]*)"/g,
    replace: (match, before, width, after) => {
      const widthNum = parseInt(width);
      if (widthNum > 768) {
        return `className="${before}w-full lg:w-[${width}px]${after}"`;
      }
      return match;
    }
  },
  
  // Fix: Add responsive breakpoints to grid layouts
  {
    pattern: /className="([^"]*)\bgrid grid-cols-(\d+)([^"]*)"/g,
    replace: (match, before, cols, after) => {
      const colsNum = parseInt(cols);
      if (colsNum === 2) {
        return `className="${before}grid grid-cols-1 md:grid-cols-2${after}"`;
      } else if (colsNum === 3) {
        return `className="${before}grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3${after}"`;
      } else if (colsNum === 4) {
        return `className="${before}grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4${after}"`;
      }
      return match;
    }
  },
  
  // Fix: Add responsive text sizing
  {
    pattern: /className="([^"]*)\btext-(\d+xl)([^"]*)"/g,
    replace: (match, before, size, after) => {
      const sizeMap = {
        '3xl': 'text-xl sm:text-2xl lg:text-3xl',
        '4xl': 'text-2xl sm:text-3xl lg:text-4xl',
        '5xl': 'text-3xl sm:text-4xl lg:text-5xl',
        '6xl': 'text-4xl sm:text-5xl lg:text-6xl'
      };
      if (sizeMap[size]) {
        return `className="${before}${sizeMap[size]}${after}"`;
      }
      return match;
    }
  },
  
  // Fix: Add responsive spacing
  {
    pattern: /className="([^"]*)\bspace-y-8([^"]*)"/g,
    replace: 'className="$1space-y-4 md:space-y-6 lg:space-y-8$2"'
  },
  
  // Fix: Add responsive gaps
  {
    pattern: /className="([^"]*)\bgap-8([^"]*)"/g,
    replace: 'className="$1gap-4 md:gap-6 lg:gap-8$2"'
  },
  
  // Fix: Add responsive padding
  {
    pattern: /className="([^"]*)\bp-8([^"]*)"/g,
    replace: 'className="$1p-4 md:p-6 lg:p-8$2"'
  },
  
  // Fix: Ensure tables are wrapped in responsive containers
  {
    pattern: /<table/g,
    replace: '<div className="overflow-x-auto"><table'
  },
  {
    pattern: /<\/table>/g,
    replace: '</table></div>'
  },
  
  // Fix: Add min-w-0 to flex children to prevent overflow
  {
    pattern: /className="([^"]*)\bflex([^"]*)"/g,
    replace: (match, before, after) => {
      if (!after.includes('min-w-0')) {
        return `className="${before}flex${after}"`;
      }
      return match;
    }
  }
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    
    for (const fix of fixes) {
      const originalContent = content;
      if (typeof fix.replace === 'function') {
        content = content.replace(fix.pattern, fix.replace);
      } else {
        content = content.replace(fix.pattern, fix.replace);
      }
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing responsive design issues...\n');
  
  const files = await fs.readdir(pagesDir);
  const tsxFiles = files.filter(f => f.endsWith('.tsx'));
  
  let fixedCount = 0;
  for (const file of tsxFiles) {
    const filePath = path.join(pagesDir, file);
    const wasFixed = await fixFile(filePath);
    if (wasFixed) fixedCount++;
  }
  
  console.log(`\n✅ Complete! Fixed ${fixedCount} of ${tsxFiles.length} files.`);
}

main().catch(console.error);
