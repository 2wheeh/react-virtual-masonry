import { defineConfig } from 'vocs';

import pkg from 'react-virtual-masonry/package.json' with { type: 'json' };

export default defineConfig(({ mode }) => ({
  description: 'Modern Masonry Layout with ease, powered by @tanstack/virtual',
  title: 'React Virtual Masonry',
  rootDir: 'contents',
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/2wheeh/react-virtual-masonry',
    },
  ],
  twoslash: {
    compilerOptions: {
      strict: true,
      jsx: 4, // JsxEmit.ReactJSX
      jsxImportSource: 'react',
    },
  },
  topNav: [
    // { text: 'Guide & API', link: '/docs/getting-started', match: '/docs' },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/2wheeh/react-virtual-masonry/blob/main/package/CHANGELOG.md',
        },
        // {
        //   text: 'Contributing',
        //   link: 'https://github.com/2wheeh/react-virtual-masonry/blob/main/.github/CONTRIBUTING.md',
        // },
      ],
    },
  ],
  vite: {
    resolve: {
      ...(mode === 'development' && {
        conditions: ['source', 'module', 'browser', 'default'],
      }),
    },
  },
}));
