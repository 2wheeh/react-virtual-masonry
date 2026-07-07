import { defineConfig } from 'vocs/config';

import pkg from 'react-virtual-masonry/package.json' with { type: 'json' };

export default defineConfig({
  title: 'React Virtual Masonry',
  description: 'Modern Masonry Layout with ease, powered by @tanstack/virtual',
  iconUrl: '/favicon.svg',
  renderStrategy: 'full-static',
  twoslash: {
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
        { text: 'Demo', link: '/demo' },
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
      link: 'https://github.com/2wheeh/react-virtual-masonry',
    },
  ],
  topNav: [
    {
      text: 'Docs',
      link: '/docs/getting-started',
      match: (path) => Boolean(path?.startsWith('/docs')),
    },
    { text: 'Demo', link: '/demo', match: (path) => Boolean(path?.startsWith('/demo')) },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/2wheeh/react-virtual-masonry/blob/main/package/CHANGELOG.md',
        },
      ],
    },
  ],
});
