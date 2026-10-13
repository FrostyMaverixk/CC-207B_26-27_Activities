/**
 * Global site identity + delivery config. Owner answers applied 2026-06-11
 * (Phase 5). `name` is the short branding name (page title, hero, footer);
 * the full legal name lives in about.js properties.
 */
export const site = {
  name: 'Jerrickho',
  tagline: 'editor',
  heroFilename: 'JERRICKHO_REEL_v12_FINAL_final2.mp4', // the hero "title"
  email: 'justinamaguin818@gmail.com',
  // Messenger "quick export" CTA in the Export dialog (most FB leads DM rather
  // than fill the form). m.me/<username> opens Messenger directly; use the same
  // handle as the Facebook profile/page below. Empty → the button doesn't render.
  messengerUrl: 'https://m.me/justin.jerrickho',
  formMode: 'netlify', // DECIDED: Netlify Forms. 'mailto' only for a GitHub Pages mirror.
  fps: 24, // math fps; display label below (owner picked plain '24')
  fpsLabel: '24',
  masterStart: '01:00:00:00',
  // Showreel pending — drop public/assets/hero/reel.mp4 + reel-poster.jpg.
  // Until then the hero renders its NO SIGNAL color-bars fallback.
  heroVideo: 'assets/hero/reel.mp4',
  heroPoster: 'assets/hero/reel-poster.jpg',
  // The hero reel as an openable "clip": clicking the hero opens it in the
  // program monitor — larger view + sound (the autoplay loop itself stays
  // muted). Owner can fill role/year/tools later; null/empty rows don't render.
  reel: {
    id: 'showreel',
    filename: 'JERRICKHO_REEL_v12_FINAL_final2.mp4',
    video: 'assets/hero/reel.mp4',
    poster: 'assets/hero/reel-poster.jpg',
    raw: null,
    runtime: '1:06',
    role: null,
    year: null,
    tools: null,
    description:
      'The full showreel — selected work, with sound. Hit ⛶ for fullscreen.',
  },
  // Google Drive folder with the full-quality masters (owner request,
  // 2026-06-11) — easier browsing + better quality than the web encodes.
  // Empty → the bin row renders in its offline/pending state.
  driveUrl: 'https://drive.google.com/drive/folders/1V2_X5NVWCFvYOZWH99MJdUqpU7aBL5fF?usp=sharing',
  // Empty urls don't render (About filters them). Owner decisions 2026-06-11:
  // Facebook is coming (owner owes the URL), YouTube dropped (not planned),
  // Instagram/Vimeo/LinkedIn undecided — left blank.
  links: [
    { label: 'Facebook', url: 'https://www.facebook.com/justin.jerrickho/' },
    { label: 'Instagram', url: '' },
    { label: 'Vimeo', url: '' },
    { label: 'LinkedIn', url: '' },
  ],
  // GoatCounter site code (the `xxxx` in https://xxxx.goatcounter.com) —
  // free, no-cookie analytics. Empty → no script loads. Owner signed up
  // 2026-06-12; dashboard at https://jerrickho.goatcounter.com.
  goatCounter: 'jerrickho',
};
