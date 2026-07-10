// NOTE: no JS constant may be shared from here into a `css()` call — Panda's
// static extractor does not resolve cross-file imported constants (it silently
// drops the rule). Shared *style* values go through panda.config.ts tokens
// instead (e.g. the `fonts.mono` stack); this file only holds values consumed
// via dynamic inline `style` or plain arithmetic.

// Lane accent colors (theme-invariant brand constants; mirror panda tokens).
export const LANE_COLORS = ['#5B8DEF', '#3DA35D', '#B983FF'];

// Shared stage/minimap pixel height. The minimap window/blocks scale off this
// numeric factor; the matching CSS box heights stay literal '544px' inside
// `css()` calls (Panda extracts literals only) so this must agree with them.
export const MINIMAP_H = 544;
