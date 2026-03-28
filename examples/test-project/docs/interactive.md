---
title: Interactive Components
description: Testing partial hydration with directives.
---

# Interactive Page

This component will only hydrate when it becomes visible in the viewport.

::content-counter{hydrate="client:visible" count=10}

Another one that loads immediately:

::content-counter{hydrate="client:load" count=5}
