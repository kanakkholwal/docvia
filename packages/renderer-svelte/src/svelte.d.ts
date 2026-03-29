declare module '*.svelte' {
    import type { Component } from 'svelte';
    const component: Component<any, any>;
    export default component;
}