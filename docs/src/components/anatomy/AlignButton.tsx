import { css } from '../../../styled-system/css';

export function AlignButton({
  num,
  sub,
  active,
  onClick,
}: {
  num: string;
  sub: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={css({
        flex: '1',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        alignItems: 'flex-start',
        px: '10px',
        py: '8px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: active ? 'coral' : 'border',
        bg: active ? 'rgba(244,112,103,0.08)' : 'card',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background .15s, border-color .15s',
        _xray: active ? { bg: 'coral', borderColor: 'coral' } : {},
        _focusVisible: { outline: '2px solid', outlineColor: 'coral', outlineOffset: '2px' },
      })}
    >
      <span
        className={css({
          fontFamily: 'mono',
          fontSize: '15px',
          lineHeight: '1',
          fontVariantNumeric: 'tabular-nums',
          color: active ? 'heading' : 't2',
          _xray: active ? { color: 'markText' } : {},
        })}
      >
        {num} →
      </span>
      <span
        className={css({
          fontSize: '9px',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          color: 't3',
          _xray: active ? { color: 'markText' } : {},
        })}
      >
        {sub}
      </span>
    </button>
  );
}
