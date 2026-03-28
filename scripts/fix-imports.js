#!/usr/bin/env node
/**
 * Fix ESM imports by adding .js extensions to relative imports
 * This is needed for Node.js ESM compatibility
 * Usage: node fix-imports.js <directory>
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = process.argv[2] || 'dist';

if (!fs.existsSync(distDir)) {
    console.error(`Directory not found: ${distDir}`);
    process.exit(1);
}

function fixImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix relative imports: './module' -> './module.js'
    // But don't match './module.js' or './module.d.ts' or imports with query strings
    content = content.replace(
        /from\s+['"](\.[^'"]*?)(['"])/g,
        (match, importPath, quote) => {
            // Skip if already has extension or is a special import
            if (
                importPath.endsWith('.js') ||
                importPath.endsWith('.json') ||
                importPath.includes('?') ||
                importPath.endsWith('/')
            ) {
                return match;
            }
            return `from '${importPath}.js'${quote.replace("'", '')}`;
        }
    );

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed: ${filePath}`);
    }
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            fixImportsInFile(fullPath);
        }
    }
}

processDirectory(distDir);
console.log('Import fixing complete!');
