// Shared control types for the Scroll API panel. `VirtualItem` is NOT declared
// here — the library re-exports it, so import it from 'kaskaid'.

/** The four Scroll API buttons. */
export type ScrollBtn = 'start' | 'center' | 'end' | 'offset';

/**
 * The last scroll invocation, tagged by which API ran, so the code chip can
 * render the real call rather than assuming `scrollToIndex`.
 */
export type ScrollCall =
  | { kind: 'index'; index: number; align: 'start' | 'center' | 'end' | 'auto' }
  | { kind: 'offset'; offset: number; align: 'start' };
