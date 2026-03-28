const hydrated = new Set();
export async function hydrate(manifest, registry) {
    if (typeof window === 'undefined')
        return;
    for (const entry of manifest) {
        if (hydrated.has(entry.id))
            continue;
        const el = document.querySelector(`[data-hid="${entry.id}"]`);
        if (!el)
            continue;
        switch (entry.hydrate) {
            case 'client:load':
                await doHydrate(el, entry, registry);
                break;
            case 'client:idle':
                if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(() => doHydrate(el, entry, registry));
                }
                else {
                    setTimeout(() => doHydrate(el, entry, registry), 200);
                }
                break;
            case 'client:visible':
                observeIntersection(el, () => doHydrate(el, entry, registry));
                break;
        }
    }
}
async function doHydrate(el, entry, registry) {
    if (hydrated.has(entry.id))
        return;
    const resolved = registry.resolve(entry.name);
    if (!resolved) {
        console.error(`[dockit] Failed to resolve component for hydration: ${entry.name}`);
        return;
    }
    try {
        // @ts-ignore - framework component instantiation (e.g. Svelte)
        new resolved.component({
            target: el,
            props: entry.props,
            hydrate: true
        });
        hydrated.add(entry.id);
    }
    catch (err) {
        console.error(`[dockit] Hydration failed for ${entry.id}:`, err);
    }
}
function observeIntersection(el, cb) {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
            cb();
            observer.disconnect();
        }
    });
    observer.observe(el);
}
