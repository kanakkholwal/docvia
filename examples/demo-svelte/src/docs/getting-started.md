---
title: Getting Started
description: Learn how to set up docvia
tags: [guide, tutorial]
order: 1
---

# Getting Started

Get docvia up and running in minutes.

## Installation

Install docvia in your project using your preferred package manager:

```bash
npm install -D @docvia/cli @docvia/compiler @docvia/source
```

Or with pnpm:

```bash
pnpm add -D @docvia/cli @docvia/compiler @docvia/source
```

## Project Structure

After initialization, your project will have:

| Directory | Purpose |
|-----------|---------|
| `docs/` | Markdown source files for documentation |
| `docvia.config.ts` | docvia configuration file |
| `.docvia/` | Compiled output (auto-generated) |

## Configuration

Create a `docvia.config.ts` file in your project root:

```typescript
import { defineConfig } from '@docvia/cli';

export default defineConfig({
  // Directory containing your markdown files
  dir: 'docs',
  
  // Title for your documentation site
  title: 'My Documentation',
  
  // Custom plugins
  plugins: [
    // Add custom plugins here
  ],
});
```

## Writing Documentation

Create markdown files in the `docs/` directory:

```markdown
---
title: My First Page
description: A brief description
tags: [example, tutorial]
order: 1
---

# My First Page

Start writing your content here.

## Sections

Use markdown headings to organize your content.

### Code Examples

Use fenced code blocks for syntax highlighting:

\`\`\`javascript
console.log('Hello, docvia!');
\`\`\`
```

## Development

Start the development server with hot reload:

```bash
docvia dev
```

Your documentation will be available at `http://localhost:5173`.

## Building for Production

Compile your documentation for production:

```bash
docvia build
```

This generates optimized output in the `.docvia/` directory.

## Deployment

Deploy your compiled documentation to any static host:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Any static file server

Just deploy the contents of your build output directory.

## Front Matter Options

Every markdown file supports these frontmatter fields:

```yaml
---
# Page title (required)
title: Page Title

# Page description (optional)
description: A brief description

# Tags for organization (optional)
tags: [example, guide]

# Sort order in navigation (optional)
order: 1
---
```

## Markdown Features

### Lists

- Feature one
- Feature two
  - Sub-feature
  - Another sub-feature
- Feature three

### Code Blocks

```typescript
interface User {
  id: string;
  name: string;
}

const user: User = {
  id: '1',
  name: 'John',
};
```

### Blockquotes

> This is a blockquote. It's useful for highlighting important information.

### Links

[Visit GitHub](https://github.com) to contribute!

## Next Steps

- Explore [Components](./components) for advanced features
- Check [Configuration](./configuration) for custom settings
- Join our [Community](https://github.com/kanakkholwal/docvia)

## Getting Help

Need help? Check out:

- The [documentation](/)
- [GitHub Issues](https://github.com/kanakkholwal/docvia/issues)
- GitHub Discussions
