import type { ComponentRegistry, HydrationEntry, HydrationManifest } from './types';

const hydrated = new Set<string>();

export async function hydrate(manifest: HydrationManifest, registry: ComponentRegistry) {
    if (typeof window === 'undefined') return;

    for (const entry of manifest) {
        if (hydrated.has(entry.id)) continue;

        const el = document.querySelector(`[data-hid="${entry.id}"]`);
        if (!el) continue;

        switch (entry.hydrate) {
            case 'client:load':
                await doHydrate(el, entry, registry);
                break;
            case 'client:idle':
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(() => doHydrate(el, entry, registry));
                } else {
                    setTimeout(() => doHydrate(el, entry, registry), 200);
                }
                break;
            case 'client:visible':
                observeIntersection(el, () => doHydrate(el, entry, registry));
                break;
        }
    }
}

async function doHydrate(el: Element, entry: HydrationEntry, registry: ComponentRegistry) {
    if (hydrated.has(entry.id)) return;

    const resolved = registry.resolve(entry.name);
    if (!resolved) {
        console.error(`[docvia] Failed to resolve component for hydration: ${entry.name}`);
        return;
    }

    try {
        // @ts-ignore - framework component instantiation (e.g. Svelte)
        new (resolved.component as any)({
            target: el,
            props: entry.props,
            hydrate: true
        });
        hydrated.add(entry.id);
    } catch (err) {
        console.error(`[docvia] Hydration failed for ${entry.id}:`, err);
    }
}

function observeIntersection(el: Element, cb: () => void) {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
            cb();
            observer.disconnect();
        }
    });
    observer.observe(el);
}
