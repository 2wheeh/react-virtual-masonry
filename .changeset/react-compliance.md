---
'react-virtual-masonry': patch
---

React ecosystem compliance: emit compiler-runtime imports that work on React 18 (`react-compiler-runtime` polyfill instead of React 19-only `react/compiler-runtime`), add a `'use client'` directive for React Server Components consumers, and stop reading refs during render in `useMasonry` (react-hooks v7 `refs` rule / concurrent-rendering safety).
