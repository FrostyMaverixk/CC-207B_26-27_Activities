/**
 * BASE_URL-safe public asset path helper.
 *
 * ALWAYS route public/ asset paths through this (Global Rule 5). Writing
 * `/assets/...` directly in JSX breaks GitHub Pages project sites, where the
 * app is served from `/<repo-name>/`. Vite injects that prefix as
 * `import.meta.env.BASE_URL` (e.g. `/` in dev, `/video-portfolio/` on Pages).
 *
 * @param {string} p  asset path, with or without a leading slash
 *                    (e.g. 'assets/hero/reel.mp4')
 * @returns {string}  base-prefixed URL (e.g. '/assets/hero/reel.mp4' in dev)
 *
 * @example
 * asset('assets/x.jpg')   // dev → '/assets/x.jpg'
 * asset('/assets/x.jpg')  // dev → '/assets/x.jpg' (leading slash stripped)
 */
export const asset = (p) =>
  import.meta.env.BASE_URL + String(p).replace(/^\/+/, '');
