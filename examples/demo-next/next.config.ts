import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    webpack(config) {
        // Resolve docvia:source virtual modules to the pre-compiled .docvia/ output.
        // Run `pnpm build:docs` (or `docvia build`) first to generate these files.
        config.resolve.alias = {
            ...config.resolve.alias,
            'docvia:source': path.resolve('.docvia/source.ts'),
            'docvia:source/registry': path.resolve('.docvia/registry.ts'),
        };
        return config;
    },

    // Allow next dev server to serve files from .docvia/
    serverExternalPackages: [],

    // Turbopack configuration (used with `next dev --turbopack`)
    experimental: {
        turbo: {
            resolveAlias: {
                'docvia:source': './.docvia/source.ts',
                'docvia:source/registry': './.docvia/registry.ts',
            },
        },
    },
};

export default nextConfig;
