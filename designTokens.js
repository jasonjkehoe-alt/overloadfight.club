// The site's design tokens. tailwind.config.js turns them into classes
// (bg-brand, bg-surface-card, border-line, rounded-card, text-2xs, ...);
// chart code that needs a colour string imports them from here.
export const colors = {
  brand: { DEFAULT: '#ff6600', hover: '#ff8533' },
  // darkest to lightest: the page behind everything, cards and panels, controls and insets on a card
  surface: { page: '#0a0a0a', card: '#111111', raised: '#1a1a1a' },
  line: '#1f2937',
};

// Tailwind's scale plus one step below xs for labels and table captions.
export const fontSize = {
  '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
};

export const borderRadius = {
  control: '0.25rem', // buttons, inputs, badges, tabs
  card: '0.5rem', // cards, panels, dialogs
};

// Recharts' tooltip box (contentStyle)
export const chartTooltip = {
  backgroundColor: colors.surface.raised,
  border: `1px solid ${colors.line}`,
  borderRadius: borderRadius.control,
};

// Chart colours. Not Tailwind classes: Recharts and canvas code take strings.
// The series hues are the dataviz reference palette's dark steps, in its order,
// and pass its validator against surface.card (#111111): lightness band, chroma
// floor, 3:1 contrast, worst adjacent CVD ΔE 8.4 and normal-vision ΔE 19.3 for
// the seven weapon families; BLUE and ORANGE are its first two slots (ΔE 26.8).
// Chrome and ink are its dark chart greys.
export const chart = {
  grid: '#2c2c2a', // gridlines
  axis: '#383835', // baselines and axis lines
  label: '#898781', // tick labels and other muted text
  text: '#c3c2b7', // secondary text in tooltips
  ink: '#ffffff', // values in tooltips, markers
  team: { BLUE: '#3987e5', ORANGE: '#d95926' },
  // FFA charts: the winner, and everyone else as one side
  ffa: { winner: '#d95926', field: '#3987e5' },
  // keyed by gameParse.js WEAPON_FAMILIES ids, in that order, plus 'other'
  weapon: {
    laser: '#3987e5',
    thunderbolt: '#d95926',
    flak: '#199e70',
    driller: '#c98500',
    missile: '#d55181',
    mine: '#008300',
    heavy: '#9085e9',
    other: '#898781',
  },
};

// Text in a Recharts tooltip, with chartTooltip as its box
export const chartTooltipText = { itemStyle: { color: chart.ink }, labelStyle: { color: chart.text } };
