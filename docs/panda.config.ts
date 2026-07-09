import { defineConfig } from '@pandacss/dev';

// Panda runs alongside Vocs (Vite + Tailwind v4). Tailwind v4 already ships a
// reset, so `preflight` is off to avoid a double reset. Vocs toggles the theme
// via `data-vocs-theme` on <html>; the `dark` condition below mirrors that so
// every semantic token flips automatically. Base = light because Vocs' first
// client render is light and `_dark` layers on top when the attribute is set.
export default defineConfig({
  preflight: false,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx}'],
  outdir: 'styled-system',
  conditions: {
    extend: {
      dark: '[data-vocs-theme=dark] &',
      xray: '[data-xray=true] &',
    },
  },
  theme: {
    extend: {
      keyframes: {
        // Pulsing loading dots + skeleton shimmer. Consumers gate these on
        // `prefers-reduced-motion` at the call site (animation set to none).
        rvmdot: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
        rvmsk: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      tokens: {
        colors: {
          // Theme-invariant brand constant. (Lane accent colors live only where
          // they're consumed — the `LANE_COLORS` array in DemoPlayground — since
          // they're applied via dynamic inline `style`, not Panda class props.)
          coral: { value: '#F47067' },
        },
      },
      semanticTokens: {
        colors: {
          page: { value: { base: '#ffffff', _dark: '#121113' } },
          surf: { value: { base: '#f9f9f9', _dark: '#0e0d0f' } },
          card: { value: { base: '#ffffff', _dark: '#17161a' } },
          panel: { value: { base: '#f9f9f9', _dark: '#141316' } },
          border: { value: { base: '#ececec', _dark: '#2b292d' } },
          border2: { value: { base: '#d4d4d4', _dark: '#3c393f' } },
          heading: { value: { base: '#202020', _dark: '#ffffff' } },
          text: { value: { base: '#4c4c4c', _dark: '#cfccd6' } },
          t2: { value: { base: '#646464', _dark: '#b5b2bc' } },
          t3: { value: { base: '#838383', _dark: '#8f8c96' } },
          t4: { value: { base: '#bbbbbb', _dark: '#625f69' } },
          barName: { value: { base: '#d0d0d0', _dark: '#3a373f' } },
          barHandle: { value: { base: '#e4e4e4', _dark: '#282630' } },
          barLine: { value: { base: '#ececec', _dark: '#232127' } },
          avatar: { value: { base: '#e2e2e2', _dark: '#2b292d' } },
          stripe2: { value: { base: '#f7f7f7', _dark: '#232127' } },
          track: { value: { base: '#ececec', _dark: '#232127' } },
          markText: { value: { base: '#ffffff', _dark: '#121113' } },
          sidebarActive: { value: { base: '#f0f0f0', _dark: '#232225' } },
          skbg: { value: { base: '#ececec', _dark: '#26242a' } },
        },
      },
    },
  },
});
