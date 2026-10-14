/**
 * The "flash frame" trigger. Anything that performs a hard jump (timeline clip
 * click, scrub release, hero scroll hint) calls `flash()`; the CutFlash
 * overlay listens for the window-level 'cut' event and renders one ~70ms
 * white frame at 10% opacity (skipped under reduced motion).
 *
 * Lives here (not in CutFlash.jsx) so component files only export components
 * (react-refresh constraint).
 */
export const CUT_EVENT = 'cut';

export const flash = () => window.dispatchEvent(new Event(CUT_EVENT));
