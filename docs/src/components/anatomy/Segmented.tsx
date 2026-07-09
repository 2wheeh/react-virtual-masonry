import { css } from '../../../styled-system/css';

// Monospace stack for the instrument-panel numerals / code chips. Declared
// file-local (not imported) so Panda statically extracts the font-family rule.
const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

export function Segmented({
  value,
  onChange,
}: {
  value: 'auto' | 'manual';
  onChange?: (v: 'auto' | 'manual') => void;
}) {
  const seg = (v: 'auto' | 'manual', label: string) => {
    const active = value === v;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange?.(v)}
        className={css({
          px: '14px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: MONO,
          fontSize: '11px',
          letterSpacing: '.06em',
          border: 'none',
          cursor: 'pointer',
          bg: active ? 'sidebarActive' : 'transparent',
          color: active ? 'heading' : 't3',
          _xray: active ? { color: 'coral' } : {},
          _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '-2px' },
        })}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      className={css({
        display: 'inline-flex',
        border: '1px solid',
        borderColor: 'border',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '30px',
      })}
    >
      {seg('auto', 'AUTO')}
      <div className={css({ width: '1px', bg: 'border' })} />
      {seg('manual', 'MANUAL')}
    </div>
  );
}
