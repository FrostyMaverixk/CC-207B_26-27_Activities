/**
 * Shared recharts polish.
 *
 * Recharts' default hover state paints the hovered bar with a translucent
 * WHITE overlay ("whitening" it). These helpers replace that with a richer
 * shade of each bar's own hue plus a soft ring, and add subtle cursor guides
 * behind bars / along lines. All colors are static so they work in both the
 * light and dark themes.
 */

const HOVER_SHADES = {
  '#10b981': '#059669', // emerald → emerald-600
  '#f59e0b': '#d97706', // amber → amber-600
  '#f43f5e': '#e11d48', // rose → rose-600
  '#0ea5e9': '#0284c7', // sky → sky-600
  '#4f46e5': '#4338ca', // indigo → indigo-700
}

/**
 * `activeBar` prop for <Bar fill={hex} radius={...}> — the hovered bar keeps
 * its shape (radius), deepens one shade, and gains a soft highlight ring.
 */
export const activeBarFor = (fill, radius = [4, 4, 4, 4]) => ({
  fill: HOVER_SHADES[fill] || fill,
  stroke: 'rgba(148, 163, 184, 0.45)', // slate ring — visible on both themes
  strokeWidth: 1.5,
  radius,
})

/** Soft translucent column behind the hovered bar group. */
export const CURSOR_BAND = { fill: 'rgba(99, 102, 241, 0.08)' }

/** Dotted vertical guide for line / area charts. */
export const CURSOR_LINE = { stroke: 'rgba(100, 116, 139, 0.45)', strokeDasharray: '3 3' }
