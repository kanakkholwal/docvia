#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// clean-builds.js
// Deletes all "dist", "build", "node_modules", and cache directories under the monorepo root.
// Usage: node scripts/clean-builds.js [--dry-run] [--verbose] [--all]
// Options:
//   --dry-run, -n    Show what would be deleted without actually deleting
//   --verbose, -v    Show detailed output including skipped directories
//   --all            Delete node_modules (default: only dist, build, and caches)


const repoRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
const deleteAll = process.argv.includes('--all');

const SKIP_DIRS = new Set(['.git', '.idea', '.vscode', 'node_modules']);
const DIRS_TO_DELETE = new Set([
	'dist',
	'build',
	'out',
	'.next',
	'coverage',
	'.cache',
	'.turbo',
	'.astro',
	'.svelte-kit',
	'_build',
	'__sveltekit__'
]);

// Add node_modules if --all flag is used
if (deleteAll) {
	DIRS_TO_DELETE.add('node_modules');
}

let found = 0;
let removed = 0;
let skipped = 0;
const removedPaths = [];

async function safeRmDir(target) {
    // Use fs.rm when available (Node 14.14+), otherwise fallback to fs.rmdir
    if (fs.promises.rm) {
        await fs.promises.rm(target, { recursive: true, force: true });
    } else {
        // rmdir with recursive is deprecated but kept for older Node versions
        await fs.promises.rmdir(target, { recursive: true });
    }
}

async function handleDirectoryEntry(ent, dir) {
    const name = ent.name;
    const full = path.join(dir, name);

    if (DIRS_TO_DELETE.has(name)) {
        found++;
        if (dryRun) {
            console.log('[dry-run] would remove:', full);
            return;
        }
        try {
            await safeRmDir(full);
            removed++;
            removedPaths.push(full);
            console.log('✓ removed:', full);
        } catch (err) {
            console.error('✗ failed to remove', full, '-', err.message);
        }
        // Do not descend into a deleted directory
        return;
    }

    if (SKIP_DIRS.has(name)) {
        if (verbose) console.log('  skip:', full);
        skipped++;
        return;
    }

    // Recurse
    await walk(full);
}

async function walk(dir) {
    let entries;
    try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (verbose) console.error('skip', dir, err.message);
        return;
    }

    for (const ent of entries) {
        if (ent.isDirectory()) {
            await handleDirectoryEntry(ent, dir);
        }
    }
}

(async () => {
    console.log('\n📦 Dockit Monorepo Cleaner');
    console.log('─'.repeat(50));
    console.log('Scanning from:', repoRoot);
    
    if (dryRun) {
        console.log('Mode: DRY RUN (no changes will be made)\n');
    } else {
        console.log('Mode: LIVE (will delete directories)\n');
    }

    if (deleteAll) {
        console.log('Target directories: dist, build, cache, .turbo, .svelte-kit, node_modules\n');
    } else {
        console.log('Target directories: dist, build, cache, .turbo, .svelte-kit');
        console.log('(Use --all flag to also delete node_modules)\n');
    }

    try {
        await walk(repoRoot);
        console.log('─'.repeat(50));
        console.log(`Found:   ${found} director${found === 1 ? 'y' : 'ies'} to delete`);
        if (!dryRun) {
            console.log(`Removed: ${removed} director${removed === 1 ? 'y' : 'ies'}`);
        }
        console.log(`Skipped: ${skipped} director${skipped === 1 ? 'y' : 'ies'}`);
        
        if (removedPaths.length && verbose) {
            console.log('\n📁 Removed paths:');
            for (const p of removedPaths) console.log('  -', p);
        }
        console.log('');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ error:', err);
        process.exit(2);
    }
})();