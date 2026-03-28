<script lang="ts">
  interface Props {
    initial?: number;
  }

  const { initial = 0 }: Props = $props();
  // svelte-ignore state_referenced_locally
  let count = $state(initial);
</script>

<div class="counter-card">
  <div class="counter-display">
    <div class="counter-value">{count}</div>
    <p class="counter-label">Count</p>
  </div>

  <div class="counter-controls">
    <button
      class="btn btn-secondary"
      onclick={() => count--}
      aria-label="Decrease count"
    >
      <span>−</span>
    </button>
    <button
      class="btn btn-secondary"
      onclick={() => (count = initial)}
      aria-label="Reset count"
    >
      <span>Reset</span>
    </button>
    <button
      class="btn btn-primary"
      onclick={() => count++}
      aria-label="Increase count"
    >
      <span>+</span>
    </button>
  </div>
</div>

<style>
  .counter-card {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: calc(var(--radius) * 1.5);
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all var(--transition-base);
  }

  .counter-card:hover {
    border-color: hsl(var(--accent));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .counter-display {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .counter-value {
    font-size: 3rem;
    font-weight: 700;
    color: hsl(var(--accent));
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .counter-label {
    font-size: 0.875rem;
    color: hsl(var(--muted-foreground));
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .counter-controls {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: var(--radius);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    outline: none;
    user-select: none;
  }

  .btn:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }

  .btn-primary {
    background: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }

  .btn-primary:hover {
    background: hsl(var(--accent) / 0.9);
    transform: translateY(-1px);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-secondary {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
  }

  .btn-secondary:hover {
    background: hsl(var(--muted) / 0.8);
    color: hsl(var(--accent));
  }

  .btn-secondary:active {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    .counter-card {
      padding: 1.5rem;
    }

    .counter-value {
      font-size: 2.5rem;
    }

    .counter-controls {
      flex-wrap: wrap;
    }

    .btn {
      flex: 1;
      min-width: 60px;
    }
  }
</style>