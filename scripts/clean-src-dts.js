#!/usr/bin/env node
/**
 * Clean up auto-generated .d.ts files from src directories
 * 
 * This script removes .d.ts files that tsup's dts builder may have created
 * as intermediate files in the src/ directories. These should only exist in dist/.
 * 
 * We SKIP hand-written type declaration files like types.d.ts that are part of source.
 * 
 * Usage: node scripts/clean-src-dts.js [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');

// Map of package directories to their source files that should NOT be cleaned
// (e.g., hand-written type declaration files)
const preservedFilesByPackage = {
  // 'packages/renderer-core': ['types.d.ts'],
};

async function safeUnlink(filePath) {
  if (fs.promises.unlink) {
    await fs.promises.unlink(filePath);
  } else {
    throw new Error('fs.promises.unlink not available');
  }
}

let removed = 0;

async function cleanPackageSrc(packageRelPath) {
  const srcDir = path.join(repoRoot, packageRelPath, 'src');
  const preserved = new Set(preservedFilesByPackage[packageRelPath] || []);
  
  // Check if src directory exists
  let entries;
  try {
    entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.d.ts')) {
      continue;
    }

    // Skip preserved files
    if (preserved.has(entry.name)) {
      continue;
    }

    const filePath = path.join(srcDir, entry.name);
    
    if (dryRun) {
      console.log('[dry-run] would remove:', filePath);
    } else {
      try {
        await safeUnlink(filePath);
        console.log('✓ removed:', filePath);
        removed++;
      } catch (err) {
        console.error('✗ failed to remove', filePath, '-', err.message);
      }
    }
  }
}

console.log('🧹 Cleaning auto-generated .d.ts files from src/ directories...');
if (dryRun) {
  console.log('(dry-run mode - no files will be deleted)\n');
}

// Clean each package
const allPackages = [
  'packages/cli',
  'packages/compiler',
  'packages/core',
  'packages/ir',
  'packages/plugins',
  'packages/renderer-core',
  'packages/schema',
  'packages/search',
  'packages/source',
  'packages/vite-plugin',
];

for (const packagePath of allPackages) {
  await cleanPackageSrc(packagePath);
}

console.log(`✓ Done! (${removed} files removed)`);

