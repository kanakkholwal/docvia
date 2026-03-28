#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');


// clean-builds.js
// Deletes all "dist" directories under the monorepo root (one level up from scripts/).
// Usage: node scripts/clean-builds.js [--dry-run] [--verbose]


const repoRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

const SKIP_DIRS = new Set(['node_modules', '.git', '.idea', '.vscode']);

let found = 0;
let removed = 0;
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

    if (name === 'dist') {
        found++;
        if (dryRun) {
            console.log('[dry-run] would remove:', full);
            return;
        }
        try {
            await safeRmDir(full);
            removed++;
            removedPaths.push(full);
            console.log('removed:', full);
        } catch (err) {
            console.error('failed to remove', full, err.message);
        }
        // Do not descend into a dist directory
        return;
    }

    if (SKIP_DIRS.has(name)) {
        if (verbose) console.log('skipping:', full);
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
    console.log('Scanning for dist directories from:', repoRoot);
    if (dryRun) console.log('DRY RUN - no folders will be deleted');
    try {
        await walk(repoRoot);
        console.log(`Found ${found} dist director${found === 1 ? 'y' : 'ies'}.`);
        if (!dryRun) {
            console.log(`Removed ${removed} dist director${removed === 1 ? 'y' : 'ies'}.`);
            if (removedPaths.length && verbose) {
                console.log('Removed paths:');
                for (const p of removedPaths) console.log(' -', p);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('error:', err);
        process.exit(2);
    }
})();