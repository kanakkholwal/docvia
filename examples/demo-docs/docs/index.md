---
title: Welcome to Dockit
description: Production-grade documentation framework with partial hydration
---

Build beautiful, performant documentation sites with interactive components. Experience the power of partial hydration—load components only when they're needed.

## Key Features

- **Partial Hydration** - Components load on demand, not on page load
- **Framework Agnostic** - Works with any JavaScript framework
- **Production Ready** - Built by companies demanding reliability
- **Lighthouse Friendly** - Optimized for performance metrics

## Interactive Demo

Try the counter below—it loads instantly with full interactivity:

::counter{initial=10 hydrate="client:load"}

## Visibility Hydration

Scroll down to see components load only when visible on screen. This pattern saves bandwidth and improves initial page load time.

## Visibility-Hydrated Component

This counter loads only when visible:

::counter{initial=100 hydrate="client:visible"}

## Getting Started

Explore the components documentation to learn how to build interactive documentation sites with Dockit.
