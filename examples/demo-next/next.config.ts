import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
    webpack(config, { webpack }) {
        // webpack 5 treats `docvia:source` as a URI scheme and processes it
        // before resolve.alias gets a chance to match. NormalModuleReplacementPlugin
        // intercepts requests at the module-factory level, before URI parsing.
        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(
                /^docvia:source(\/.*)?$/,
                (resource: { request: string }) => {
                    if (resource.request === 'docvia:source') {
                        resource.request = path.resolve('.docvia/source.ts');
                    } else if (resource.request === 'docvia:source/registry') {
                        resource.request = path.resolve('.docvia/registry.ts');
                    }
                }
            )
        );
        return config;
    },
};

export default nextConfig;
