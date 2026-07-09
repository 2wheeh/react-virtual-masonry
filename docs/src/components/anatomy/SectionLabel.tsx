import { type ReactNode } from 'react';
import { css } from '../../../styled-system/css';

// Monospace stack for the instrument-panel numerals / code chips. Declared
// file-local (not imported) so Panda statically extracts the font-family rule.
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export function SectionLabel({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <span
      className={css({
        fontFamily: MONO,
        fontSize: '11px',
        letterSpacing: '.09em',
        textTransform: 'uppercase',
        color: 't3',
      })}
      style={width ? { width, flexShrink: 0 } : undefined}
    >
      {children}
    </span>
  );
}
