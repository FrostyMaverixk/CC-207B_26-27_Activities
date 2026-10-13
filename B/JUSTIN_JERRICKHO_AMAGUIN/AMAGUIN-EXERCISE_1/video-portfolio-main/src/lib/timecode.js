/**
 * Timecode math for the NLE chrome. fps is the *math* frame rate (site.fps,
 * default 24); the display label (e.g. '23.976') is cosmetic and lives in
 * siteConfig.
 *
 * Unit sanity (keep these passing):
 *   secondsToTC(3661.5, 24) === '01:01:01:12'
 *   tcToSeconds('01:00:00:00', 24) === 3600
 *   secondsToTC(tcToSeconds('01:02:03:12', 24), 24) === '01:02:03:12'
 */

/**
 * @param {number} sec  seconds (may be fractional)
 * @param {number} [fps=24]
 * @returns {string} 'HH:MM:SS:FF'
 */
export function secondsToTC(sec, fps = 24) {
  const safe = Number.isFinite(sec) && sec > 0 ? sec : 0;
  const totalFrames = Math.round(safe * fps);
  const f = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  return [h, m, s, f].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * @param {string} tc  'HH:MM:SS:FF'
 * @param {number} [fps=24]
 * @returns {number} seconds (fractional)
 */
export function tcToSeconds(tc, fps = 24) {
  const [h = 0, m = 0, s = 0, f = 0] = String(tc).split(':').map(Number);
  return h * 3600 + m * 60 + s + f / fps;
}

/**
 * Piecewise-linear map of scroll progress → timecode (see §2 of the roadmap).
 * Each clip span [boundary[i], boundary[i+1] ?? 1] maps to
 * [tc[i], tc[i+1] ?? tc[i] + 60s], interpolated linearly within the span.
 *
 * @param {number} progress      0..1 scroll progress
 * @param {number[]} boundaries  clip left edges in 0..1, index-aligned to sections
 * @param {{tc: string}[]} sections  the SECTIONS array
 * @param {number} [fps=24]
 * @returns {string} 'HH:MM:SS:FF'
 */
export function progressToTC(progress, boundaries, sections, fps = 24) {
  if (!boundaries?.length || !sections?.length) return secondsToTC(0, fps);
  const p = Math.min(1, Math.max(0, progress));

  // span index = last i where boundaries[i] <= p
  let i = 0;
  for (let j = 0; j < boundaries.length; j += 1) {
    if (p >= boundaries[j]) i = j;
    else break;
  }

  const spanStart = boundaries[i];
  const spanEnd = boundaries[i + 1] ?? 1;
  const startSec = tcToSeconds(sections[i].tc, fps);
  const endSec =
    i + 1 < sections.length
      ? tcToSeconds(sections[i + 1].tc, fps)
      : startSec + 60;

  const span = spanEnd - spanStart;
  const t = span > 0 ? (p - spanStart) / span : 0;
  return secondsToTC(startSec + t * (endSec - startSec), fps);
}
