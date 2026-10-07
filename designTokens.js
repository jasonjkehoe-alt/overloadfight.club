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
