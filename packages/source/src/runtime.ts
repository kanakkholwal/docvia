export type HydrationManifest = any;

export interface DockitPage<TFrontmatter = any> {
    slug: string;
    slugs: string[];
    url: string;
    data: TFrontmatter;
    content: any;
    manifest: HydrationManifest;
}

export interface DockitCollection<TFrontmatter = any, TRouteKey extends string = string> {
    getPage(slugs: string[]): Promise<DockitPage<TFrontmatter> | null>;
    getAllPages(): TRouteKey[];
    getTree(): any; // from nav.json
    getPagesByTag(tag: string): TRouteKey[];
    getRelated(slug: TRouteKey): TRouteKey[];
}

export interface DockitSource {
    collections: Record<string, DockitCollection<any, any>>;
}
