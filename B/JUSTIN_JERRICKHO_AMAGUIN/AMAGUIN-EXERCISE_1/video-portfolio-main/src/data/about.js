/**
 * About-section content (see §5.3). Owner answers applied 2026-06-11 (Phase 5).
 * Bio is a short draft written from the owner's own facts — owner to review.
 * Headshot pending — drop public/assets/about/headshot.jpg (the NO TALENT
 * MEDIA fallback renders until then), then update the two headshot fields.
 */
/**
 * ── EDIT HERE to flip your availability ───────────────────────────────
 * The ONE place to set whether you're open to work. This single flag
 * drives BOTH the About STATUS row and the hero badge:
 *   available: true  → teal  "● <labelAvailable>"
 *   available: false → amber "● <labelBooked>"
 * Reword the labels however you like — the dot color follows the
 * boolean, not the text, so any wording still highlights correctly.
 */
const availability = { // cd video-portfolio, npm run build, then npx netlify deploy --prod --dir=dist
  available: true,
  labelAvailable: 'AVAILABLE FOR WORK',
  labelBooked: 'BOOKED — BACK SOON',
};

export const about = {
  /** Live availability — edit the `availability` block just above. */
  availability,

  headshot: 'assets/about/headshot.jpg',
  headshotLabel: 'TALENT_HEADSHOT_v01.jpg',

  /** Rendered as a clip-properties table. STATUS is derived from `availability`. */
  properties: {
    NAME: 'Justin Jerrickho Amaguin',
    ROLE: 'Editor · student + freelance',
    'BASED IN': 'Iloilo, Philippines',
    STATUS: availability.available
      ? availability.labelAvailable
      : availability.labelBooked,
    EMAIL: 'justinamaguin818@gmail.com',
  },

  bio: [
    'I’m Jerrickho, a video editor based in Iloilo, Philippines — a college student taking on freelance work. I’ve been cutting for about two years: short films, ads, AMVs, and motion infographics, all edited in DaVinci Resolve.',
    'Editing is the core of what I do — assembly, pacing, and the cut itself — and I can color grade in Resolve when a project calls for it. Everything in this bin is school or personal work, edited end to end by me; I’m open to client projects that need the same care.',
  ],

  /** Rendered as audio-meter style level bars (0–1). Owner's honest levels. */
  software: [
    { name: 'DaVinci Resolve', level: 0.8, note: 'edit + color' },
    { name: 'Fusion', level: 0.4, note: 'motion' },
    { name: 'Fairlight', level: 0.5, note: 'audio' },
  ],

  /**
   * Rendered as "EXPORT PRESETS". Ordered by the work the owner wants to
   * attract (owner Q&A 2026-06-11: narrative → short-form → ads; turnaround
   * discussed per brief, so no dates quoted). Music-driven edit dropped as a
   * *service* — AMVs/game edits stay in the bin as portfolio categories.
   */
  services: [
    {
      name: 'Narrative edit',
      desc: 'Short films and spec work — assembly to picture lock, graded on request.',
      spec: 'delivery: 16:9 · 1080p',
    },
    {
      name: 'Short-form edit',
      desc: 'Reels / Shorts / TikTok cutdowns from your raw footage.',
      spec: 'delivery: 9:16 · 1080p',
    },
    {
      name: 'Ad / promo edit',
      desc: 'Product spots, promos, and event recaps — cut to the brief.',
      spec: 'delivery: 16:9 or 9:16 · 1080p',
    },
    {
      name: 'Motion / infographic',
      desc: 'Animated explainers and title work in Fusion.',
      spec: 'delivery: per brief',
    },
  ],

  resume: null, // 'assets/about/resume.pdf' → shows a download row
};
