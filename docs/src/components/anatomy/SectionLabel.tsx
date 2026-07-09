import { type ReactNode } from 'react';
import { css } from '../../../styled-system/css';

export function SectionLabel({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <span
      className={css({
        fontFamily: 'mono',
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
