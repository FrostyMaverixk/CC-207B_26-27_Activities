/**
 * THE content file. Two scaling rules (keep them true):
 *   • Adding a category   = add one `tracks` entry (+ its asset folders).
 *   • Adding a video      = add one `projects` entry (+ drop 2–3 files).
 * Components never hard-code any of this — they map over these arrays.
 *
 * Phase 5: real media. Runtimes are ffprobe-measured. REELS, GAME EDITS, and
 * PRACTICE currently have zero projects — their tracks render a deliberate
 * lost-media MEDIA OFFLINE slate until the owner drops videos and adds
 * entries here.
 */

/**
 * Track = category. Rendered top-to-bottom in array order (bin browsing order,
 * not NLE vertical order — track numbers are just labels). Each `color` is a
 * token from tokens.css §3.1.
 *
 * @typedef {Object} Track
 * @property {string} id       matches `project.trackId` and the asset subfolder
 * @property {string} trackNo  NLE-style lane label (V1…V7)
 * @property {string} label    uppercase display name
 * @property {string} color    CSS custom-property reference
 */

/** @type {Track[]} */
export const tracks = [
  { id: 'short-film', trackNo: 'V1', label: 'SHORT FILM', color: 'var(--clip-shortfilm)' },
  { id: 'ad', trackNo: 'V2', label: 'AD', color: 'var(--clip-ad)' },
  { id: 'reels', trackNo: 'V3', label: 'REELS', color: 'var(--clip-reels)' },
  { id: 'amv', trackNo: 'V4', label: 'AMV', color: 'var(--clip-amv)' },
  { id: 'game-edits', trackNo: 'V5', label: 'GAME EDITS', color: 'var(--clip-gameedits)' },
  { id: 'practice', trackNo: 'V6', label: 'PRACTICE', color: 'var(--clip-practice)' },
  { id: 'infographic', trackNo: 'V7', label: 'INFOGRAPHIC', color: 'var(--clip-infographic)' },
];

/**
 * @typedef {Object} Project
 * @property {string}  id           unique slug (also the `#clip=<id>` deep link)
 * @property {string}  trackId      foreign key into `tracks`
 * @property {string}  title        human-readable title
 * @property {string}  filename     display name shown on the bin strip
 * @property {string}  video        public path → ProgramMonitor source
 * @property {string}  poster       public path → strip/monitor poster frame
 * @property {string}  strip        public path → 1×N filmstrip sprite sheet
 * @property {number}  stripFrames  frame count baked into the sprite
 * @property {?string} raw          ungraded source path → enables wipe-compare, else null
 * @property {string}  runtime      'M:SS' badge
 * @property {string}  role         credit line ('edit', 'edit + grade', …)
 * @property {number} [cuts]        optional cut count; omit → not shown
 * @property {number}  year
 * @property {string[]} tools
 * @property {string} [description] optional one–two sentence blurb
 */

/** @type {Project[]} */
export const projects = [
  // ---- V1 · SHORT FILM ------------------------------------------------------
  {
    id: 'shortfilm-adonis-goes-virtual',
    trackId: 'short-film',
    title: 'Adonis Goes Virtual',
    filename: 'ADONIS_GOES_VIRTUAL_v05_FINAL.mp4',
    video: 'assets/videos/short-film/shortfilm-adonis-goes-virtual.mp4',
    poster: 'assets/thumbs/short-film/thumb-shortfilm-adonis-goes-virtual.jpg',
    strip: 'assets/strips/short-film/strip-shortfilm-adonis-goes-virtual.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '16:29',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'My first real edit — a narrative short cut end to end, first assembly through final delivery. School production.',
  },
  {
    id: 'shortfilm-kodak',
    trackId: 'short-film',
    title: 'Kodak',
    filename: 'KODAK_v03_picturelock.mp4',
    video: 'assets/videos/short-film/shortfilm-kodak.mp4',
    poster: 'assets/thumbs/short-film/thumb-shortfilm-kodak.jpg',
    strip: 'assets/strips/short-film/strip-shortfilm-kodak.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '10:41',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'Short-film competition "1st Runner Up" — cut to picture lock to test how my editing held up against the field.',
  },

  // ---- V2 · AD --------------------------------------------------------------
  {
    id: 'ad-sting',
    trackId: 'ad',
    title: 'Sting Ad',
    filename: 'STING_AD_v08_delivery.mp4',
    video: 'assets/videos/ad/ad-sting.mp4',
    poster: 'assets/thumbs/ad/thumb-ad-sting.jpg',
    strip: 'assets/strips/ad/strip-ad-sting.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '1:04',
    role: 'edit · spec',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'Spec energy-drink spot — an experiment in pace and punch, and an excuse to have some fun. School project, not commissioned by or affiliated with Sting.',
  },

  // ---- V3 · REELS -----------------------------------------------------------
  {
    id: 'reels-director-picks',
    trackId: 'reels',
    title: '4 Favorite Films: Director',
    filename: '4FAVES_DIRECTOR_v04_FINAL_nga_final.mp4',
    video: 'assets/videos/reels/reels-director-picks.mp4',
    poster: 'assets/thumbs/reels/thumb-reels-director-picks.jpg',
    strip: 'assets/strips/reels/strip-reels-director-picks.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '0:58',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'Asked the director of Madyaas to name his favorite films and cut the whole piece — my first time editing alongside a professional film crew.',
  },
  {
    id: 'reels-crew-picks',
    trackId: 'reels',
    title: 'Crew Picks',
    filename: '4FAVES_CREW_v04_subs_FINAL.mp4',
    video: 'assets/videos/reels/reels-crew-picks.mp4',
    poster: 'assets/thumbs/reels/thumb-reels-crew-picks.jpg',
    strip: 'assets/strips/reels/strip-reels-crew-picks.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '1:20',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'Asked the Madyaas crew for their most-rewatched films, then had some fun with the cut.',
  },

  // ---- V4 · AMV -------------------------------------------------------------
  {
    id: 'amv-jet-set',
    trackId: 'amv',
    title: 'Jet Set',
    filename: 'JET_SET_AMV_v04_FINAL_final.mp4',
    video: 'assets/videos/amv/amv-jet-set.mp4',
    poster: 'assets/thumbs/amv/thumb-amv-jet-set.jpg',
    strip: 'assets/strips/amv/strip-amv-jet-set.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '1:55',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      'Personal project cut frame-tight to the track — action and scene changes timed to the beat.',
  },

  // ---- V7 · INFOGRAPHIC -----------------------------------------------------
  {
    id: 'infographic-philippines',
    trackId: 'infographic',
    title: 'Philippines Infographic',
    filename: 'PHILIPPINES_INFOGRAPHIC_v02_contemp.mp4',
    video: 'assets/videos/infographic/infographic-philippines.mp4',
    poster: 'assets/thumbs/infographic/thumb-infographic-philippines.jpg',
    strip: 'assets/strips/infographic/strip-infographic-philippines.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '2:58',
    role: 'edit',
    year: 2025,
    tools: ['DaVinci Resolve'],
    description:
      'Animated infographic on Philippine culture — visuals and text paced so each fact lands clearly. School project.',
  },
  {
    id: 'infographic-streets-apart',
    trackId: 'infographic',
    title: 'Streets Apart',
    filename: 'STREETS_APART_v06_anim.mp4',
    video: 'assets/videos/infographic/infographic-streets-apart.mp4',
    poster: 'assets/thumbs/infographic/thumb-infographic-streets-apart.jpg',
    strip: 'assets/strips/infographic/strip-infographic-streets-apart.jpg',
    stripFrames: 12,
    raw: null,
    runtime: '4:43',
    role: 'edit',
    year: 2026,
    tools: ['DaVinci Resolve'],
    description:
      '“Two Faces, One City” — a contrastive visual narrative cutting between two sides of the same streets. School project.',
  },
];
