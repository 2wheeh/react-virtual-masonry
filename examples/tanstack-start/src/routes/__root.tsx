/// <reference types="vite/client" />
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start | react-virtual-masonry SSR example' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          padding: 0,
        }}
      >
        <nav
          style={{
            display: 'flex',
            gap: 16,
            padding: 16,
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 10,
          }}
        >
          <Link
            to="/"
            activeProps={{ style: { fontWeight: 700 } }}
            style={{ textDecoration: 'none', color: '#222' }}
          >
            client-only
          </Link>
          <Link
            to="/ssr"
            activeProps={{ style: { fontWeight: 700 } }}
            style={{ textDecoration: 'none', color: '#222' }}
          >
            ssr
          </Link>
          <Link
            to="/ssr-debug"
            activeProps={{ style: { fontWeight: 700 } }}
            style={{ textDecoration: 'none', color: '#222' }}
          >
            ssr-debug
          </Link>
        </nav>
        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
        <Scripts />
      </body>
    </html>
  );
}
