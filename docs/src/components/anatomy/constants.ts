// NOTE: the monospace stack (MONO) is intentionally NOT shared from here.
// Panda's static extractor does not resolve a cross-file imported constant used
// inside `css()` (it silently drops the `font-family` rule), so each component
// declares its own file-local `const MONO` — the extractor resolves same-file
// constants and emits the identical atomic class.

// Lane accent colors (theme-invariant brand constants; mirror panda tokens).
export const LANE_COLORS = ['#5B8DEF', '#3DA35D', '#B983FF'];

// Shared stage/minimap pixel height. The minimap window/blocks scale off this
// numeric factor; the matching CSS box heights stay literal '544px' inside
// `css()` calls (Panda extracts literals only) so this must agree with them.
export const MINIMAP_H = 544;
