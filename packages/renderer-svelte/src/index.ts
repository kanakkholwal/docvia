import type { ComponentType } from 'svelte';
import Renderer from './Renderer.svelte';

export * from './adapter';

export { Renderer };
export default Renderer as unknown as ComponentType;
