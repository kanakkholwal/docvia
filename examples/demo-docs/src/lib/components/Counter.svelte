
<script>
    export let initial = 0;
    let count = initial;
</script>

<div class="counter">
    <button on:click={() => count--}>-</button>
    <span>{count}</span>
    <button on:click={() => count++}>+</button>
</div>

<style>
    .counter {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 1rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.5rem;
    }
    button {
        background: #38bdf8;
        color: white;
        border: none;
        width: 2rem;
        height: 2rem;
        border-radius: 0.25rem;
        cursor: pointer;
    }
</style>
