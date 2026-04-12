<script lang="ts">
interface Props {
	initial?: number;
}

const { initial = 0 }: Props = $props();
// svelte-ignore state_referenced_locally
let count = $state(initial);
</script>

<div class="counter-card">
  <div class="counter-value">{count}</div>
  <p class="counter-label">Count</p>

  <div class="counter-controls">
    <button
      class="btn"
      onclick={() => count--}
      aria-label="Decrease count"
    >
      −
    </button>
    <button
      class="btn"
      onclick={() => (count = initial)}
      aria-label="Reset count"
    >
      Reset
    </button>
    <button
      class="btn btn-primary"
      onclick={() => count++}
      aria-label="Increase count"
    >
      +
    </button>
  </div>
</div>
