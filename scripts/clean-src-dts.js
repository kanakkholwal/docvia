#!/usr/bin/env node
/**
 * Clean up auto-generated .d.ts files from src directories
 * 
 * This script removes .d.ts files that tsup's dts builder may have created
 * as intermediate files in the src/ directories. These should only exist in dist/.
 * 
 * We only delete .d.ts files that match known entry points, to avoid deleting
 * hand-written type declaration files like types.d.ts or module-augmentation files.
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

// Map of package directories to their entry points
// We only delete .d.ts files that correspond to entry points
const entryPointsByPackage = {
  'packages/ir': ['index', 'transform'],
  'packages/renderer-core': ['index'],
  'packages/compiler': ['index'],
  'packages/cli': ['index'],
  'packages/core': ['index'],
  'packages/plugins': ['index'],
  'packages/schema': ['index'],
  'packages/search': ['index'],
  'packages/source': ['index', 'internal', 'runtime', 'node'],
  'packages/vite-plugin': ['index'],
};

async function safeUnlink(filePath) {
  if (fs.promises.unlink) {
    await fs.promises.unlink(filePath);
  } else {
    throw new Error('fs.promises.unlink not available');
  }
}

let removed = 0;

async function cleanPackageSrc(packageRelPath, entryPoints) {
  const srcDir = path.join(repoRoot, packageRelPath, 'src');
  
  // Check if src directory exists
  try {
    await fs.promises.access(srcDir);
  } catch {
    return;
  }

  for (const entryPoint of entryPoints) {
    const dtsFile = path.join(srcDir, `${entryPoint}.d.ts`);
    
    try {
      await fs.promises.access(dtsFile);
      // File exists, delete it
      if (dryRun) {
        console.log('[dry-run] would remove:', dtsFile);
      } else {
        await safeUnlink(dtsFile);
        console.log('✓ removed:', dtsFile);
        removed++;
      }
    } catch {
      // File doesn't exist, skip
    }
  }
}

console.log('🧹 Cleaning auto-generated .d.ts files from src/ directories...');
if (dryRun) {
  console.log('(dry-run mode - no files will be deleted)\n');
}

// Clean each package
for (const [packagePath, entryPoints] of Object.entries(entryPointsByPackage)) {
  await cleanPackageSrc(packagePath, entryPoints);
}

console.log(`✓ Done! (${removed} files removed)`);

