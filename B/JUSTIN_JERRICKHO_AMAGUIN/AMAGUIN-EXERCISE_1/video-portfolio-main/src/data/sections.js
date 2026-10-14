/**
 * Section registry — the single ordered array that drives BOTH the scrolling
 * page and the timeline nav (see §2 of the roadmap). Adding a section later is
 * a one-line change here: the page maps over it, and the timeline reads the
 * same array for its clip geometry, live timecode, and J-K-L shuttle.
 *
 * @typedef {Object} Section
 * @property {string} id     DOM id + hash deep-link target (`/#work`)
 * @property {string} label  uppercase machine label shown on the clip + header
 * @property {string} tc     master timecode where this clip starts ('HH:MM:SS:FF')
 * @property {string} track  timeline lane: 'V1' (video) or 'A1' (audio)
 * @property {'clip'|'audio'|'marker'} kind  how the timeline renders it
 */

/** @type {Section[]} */
export const SECTIONS = [
  { id: 'hero', label: 'OPEN', tc: '01:00:00:00', track: 'V1', kind: 'clip' },
  { id: 'work', label: 'WORK', tc: '01:01:00:00', track: 'V1', kind: 'clip' },
  { id: 'about', label: 'ABOUT', tc: '01:02:00:00', track: 'A1', kind: 'audio' },
  { id: 'contact', label: 'EXPORT', tc: '01:03:00:00', track: 'M', kind: 'marker' },
];
