import { defineConfig } from 'vocs/config';

import pkg from 'kaskaid/package.json' with { type: 'json' };

export default defineConfig({
  title: 'kaskaid',
  description: 'Virtualized masonry layout for React, powered by @tanstack/virtual',
  iconUrl: '/favicon.svg',
  renderStrategy: 'full-static',
  twoslash: {
    // twoslash fails on Vercel's cold build: its lib map lacks TS 5.9's
    // lib.es2025.iterator.d.ts (pulled by @tanstack/react-query's types) — a
    // @typescript/vfs bug that isn't reproducible locally. Instead of fixing the
    // vfs, cache twoslash results inline (//@twoslash-cache comments, written by
    // a local build and committed) so cold CI builds read the cache and never
    // re-run twoslash — annotations still render. throws:false guards a cache
    // miss (an edited snippet whose cache wasn't regenerated). Regenerate by
    // rebuilding docs after editing any twoslash snippet.
    throws: false,
    inlineCache: true,
    twoslashOptions: {
      compilerOptions: {
        strict: true,
        jsx: 4, // JsxEmit.ReactJSX
        jsxImportSource: 'react',
      },
    },
  },
  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'Getting Started', link: '/docs/getting-started' },
        { text: 'Scrolling in a Container', link: '/docs/scrolling-in-a-container' },
        { text: 'Anatomy', link: '/anatomy' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: '<Masonry />', link: '/docs/api/masonry' },
        { text: 'useMasonry', link: '/docs/api/use-masonry' },
        { text: 'useEndReached', link: '/docs/api/use-end-reached' },
      ],
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/2wheeh/kaskaid',
    },
  ],
  topNav: [
    {
      text: 'Docs',
      link: '/docs/getting-started',
      match: (path) => Boolean(path?.startsWith('/docs')),
    },
    { text: 'Anatomy', link: '/anatomy', match: (path) => Boolean(path?.startsWith('/anatomy')) },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/2wheeh/kaskaid/blob/main/package/CHANGELOG.md',
        },
      ],
    },
  ],
});
