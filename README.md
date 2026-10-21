# Astro Synapse website

Static site built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

## Development

```sh
npm install
npm run dev     # http://localhost:8080, live reload
npm run build   # production build into _site/ (minified HTML, CSS, JS)
```

Requires Node 20+ (see `.nvmrc`).

## Deployment

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the site and publishes `_site/` to GitHub Pages. The deploy path (`/astro-web/` on github.io, `/` on a custom domain) and the public URL are read from the Pages settings automatically.

One-time setup: in **Settings, Pages**, set **Build and deployment, Source** to **GitHub Actions**.

## Structure

```
src/
  *.html, research/*.html   pages: front matter + page content only
  _includes/layouts/        base.njk: <head>, SEO tags, header, menu, footer
  _includes/partials/       shared blocks (product cards, quick-view panel)
  _includes/macros.njk      bgVideo() background video helper
  _data/site.js             company details, navigation, social links, OG images
  _data/products.js         product data for cards + quick-view panel
  _data/redirects.js        redirects from old *.html URLs
  assets/css/styles.css     all styles (bundled with fonts.css by Lightning CSS)
  assets/js/main.js         site-wide behaviour (bundled by esbuild, loaded on every page)
  assets/js/scout-stages.js RoboZET 3D model (three.js); page-only bundle, see `scripts` below
  assets/js/asai.js         Asai hero drift field, stipple face canvas, monologue, journey stepper; page-only bundle
  assets/fonts|images|video static files, copied as-is
lib/schema.js               JSON-LD structured data
eleventy.config.js          build configuration
```

### Adding a page

Create `src/my-page.html`:

```html
---
layout: base.njk
title: My page · Astro Synapse
description: One sentence for search results and link previews.
code: ST/08
crumb: My page
---
<section class="section">Page content</section>
```

It is published at `/my-page/` and added to `sitemap.xml` automatically.

A page that needs its own JavaScript (large or page-specific code that should not go into `main.js`) lists extra bundles in front matter: `scripts: ["/assets/js/scout-stages.js"]`. Each bundle is an entry in `JS_ENTRIES` in `eleventy.config.js`.

### Conventions

- **Links:** write root-relative URLs (`/contact/`, `/assets/images/logo-icon.svg`). The build prefixes them with the deploy path.
- **CSS:** BEM (`.block__element--modifier`), state classes `.is-*`, no inline styles (custom properties such as `style="--d:.2s"` for animation timing are fine).
- **JS hooks:** `id` or `data-*` attributes, never styling classes.
