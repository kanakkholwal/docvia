export type HydrationManifest = any;

export interface docviaPage<TFrontmatter = any> {
    slug: string;
    slugs: string[];
    url: string;
    data: TFrontmatter;
    content: any;
    manifest: HydrationManifest;
    headings?: Array<{ depth: number; text: string; id: string }>;
}

export interface docviaCollection<TFrontmatter = any, TRouteKey extends string = string> {
    getPage(slugs: string[]): Promise<docviaPage<TFrontmatter> | null>;
    getAllPages(): TRouteKey[];
    getTree(): any; // from nav.json
    getPagesByTag(tag: string): TRouteKey[];
    getRelated(slug: TRouteKey): TRouteKey[];
}

export interface docviaSource {
    collections: Record<string, docviaCollection<any, any>>;
}
