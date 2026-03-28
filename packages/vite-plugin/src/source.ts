import fs from 'node:fs';
import path from 'node:path';

export function dockitSourcePlugin() {
  return {
    name: 'dockit:source',
    config(config: any) {
      const root = config.root || process.cwd();
      config.server = config.server || {};
      config.server.fs = config.server.fs || {};
      config.server.fs.allow = config.server.fs.allow || [];
      config.server.fs.allow.push(path.resolve(root, '.dockit'));
      return config;
    },

    resolveId(id: string) {
      if (id === 'dockit:source' || id.startsWith('dockit:source/')) {
        return `\0${id}`;
      }
      return null;
    },

    load(id: string) {
      if (!id.startsWith('\0dockit:source')) return;

      const root = process.cwd();
      const collectionsDir = path.join(root, '.dockit/collections');

      if (!fs.existsSync(collectionsDir)) {
        return `
          import { createSource } from '@dockit/source/internal';
          export const dockitSource = createSource({});
        `;
      }

      const names = fs.readdirSync(collectionsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      // Single collection import: dockit:source/docs
      const parts = id.split('/');
      const single = parts.length > 1 ? parts[1] : null;
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
          import * as routes_${varName} from '/.dockit/collections/${name}/routes';
          import meta_${varName} from '/.dockit/collections/${name}/meta.json';
          import nav_${varName} from '/.dockit/collections/${name}/nav.json';
          import tags_${varName} from '/.dockit/collections/${name}/tags.json';
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
        import { createCollection, createSource } from '@dockit/source/internal';

        ${imports.join('\n')}

        ${inits.join('\n')}

        const collections = {
          ${targets.map((name, i) => `${unescape(name)}: c${i}`).join(',')}
        };

        export const dockitSource = createSource(collections);

        ${targets.map((name) => `export const ${name} = collections['${name}'];`).join('\n')}
      `;
    }
  };
}
