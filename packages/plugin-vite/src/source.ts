import fs from 'node:fs';
import path from 'node:path';

export function docviaSourcePlugin() {
  return {
    name: 'docvia:source',
    config(config: any) {
      const root = config.root || process.cwd();
      config.server = config.server || {};
      config.server.fs = config.server.fs || {};
      config.server.fs.allow = config.server.fs.allow || [];
      config.server.fs.allow.push(path.resolve(root, '.docvia'));

      // Don't set an alias - we'll handle resolution with resolveId and load hooks instead
      return config;
    },

    resolveId(id: string) {
      if (id === 'docvia:source' || id.startsWith('docvia:source/')) {
        return `\0${id}`;
      }
      return null;
    },

    load(id: string) {
      if (!id.startsWith('\0docvia:source')) return;

      const root = process.cwd();
      const collectionsDir = path.join(root, '.docvia/collections');

      if (!fs.existsSync(collectionsDir)) {
        return `
          import { createSource } from '@docvia/source/internal';
          export const docviaSource = createSource({});
        `;
      }

      const names = fs.readdirSync(collectionsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const parts = id.split('/');
      const single = parts.length > 1 ? parts[1] : null;

      // Special case: registry sub-module
      if (single === 'registry') {
        const registryPath = path.join(root, '.docvia/registry.ts');
        if (fs.existsSync(registryPath)) {
          return fs.readFileSync(registryPath, 'utf-8');
        }
        // Fallback: empty no-op registry if not generated yet
        return `export const registry = { resolve(_name) { return null; } };`;
      }

      const targets = single ? [single].filter((name) => names.includes(name)) : names;

      // biome-ignore lint/suspicious/noShadowRestrictedNames: no other variable name available
      function unescape(value: string) {
        return JSON.stringify(value);
      }

      const imports: string[] = [];
      const inits: string[] = [];

      targets.forEach((name, i) => {
        const varName = `c${i}`;

        imports.push(`
          import * as routes_${varName} from '/.docvia/collections/${name}/routes';
          import meta_${varName} from '/.docvia/collections/${name}/meta.json';
          import nav_${varName} from '/.docvia/collections/${name}/nav.json';
          import tags_${varName} from '/.docvia/collections/${name}/tags.json';
        `);

        inits.push(`
          const ${varName} = createCollection({
            name: ${unescape(name)},
            baseUrl: ${unescape(`/${name}`)},
            routes: routes_${varName}.routes,
            meta: meta_${varName},
            nav: nav_${varName},
            tags: tags_${varName}
          });
        `);
      });

      return `
        import { createCollection, createSource } from '@docvia/source/internal';

        ${imports.join('\n')}

        ${inits.join('\n')}

        const collections = {
          ${targets.map((name, i) => `${unescape(name)}: c${i}`).join(',')}
        };

        export const docviaSource = createSource(collections);

        ${targets.map((name) => `export const ${name} = collections['${name}'];`).join('\n')}
      `;
    }
  };
}
