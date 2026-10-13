/**
 * Seeded fake-waveform points for the A1 conceit (timeline audio clip, About
 * divider). Same seed → identical polyline on every render/load; alternates
 * above/below the midline like a real audio thumbnail.
 *
 * @param {number} [seed=24]
 * @param {number} [n=48]     segment count
 * @param {number} [minAmp=8] minimum half-amplitude (0–50 viewBox units)
 * @param {number} [maxAmp=46]
 * @returns {string} SVG polyline `points` for a 0 0 100 100 viewBox
 */
export function wavePoints(seed = 24, n = 48, minAmp = 8, maxAmp = 46) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const amp = minAmp + rand() * (maxAmp - minAmp);
    const y = i % 2 === 0 ? 50 - amp : 50 + amp;
    pts.push(`${((i / n) * 100).toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}
