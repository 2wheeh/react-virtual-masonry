// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/_slots'; render: 'static' }
  | { path: '/demo'; render: 'static' }
  | { path: '/docs/api/masonry'; render: 'static' }
  | { path: '/docs/api/use-masonry'; render: 'static' }
  | { path: '/docs/getting-started'; render: 'static' }
  | { path: '/'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
