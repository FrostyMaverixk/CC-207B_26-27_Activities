# EDIT BAY — video editing portfolio

Jerrickho's portfolio site, themed as a non-linear editor: the page loads like a render,
grades itself in as you scroll, navigates via a timeline with a draggable playhead, and
presents work as clips in a bin with solo/mute track filtering.

**Live:** https://jerrickho-editing-portfolio.netlify.app

Stack: React 19 + Vite 8, plain JavaScript + JSX, CSS Modules + a global token sheet
(`src/styles/tokens.css`), self-hosted fonts via Fontsource, zero animation libraries.
All content is data-driven from `src/data/` — components never hard-code titles, names,
paths, or links. Missing media renders an intentional red `MEDIA OFFLINE` slate, so the
site never looks broken while content is pending.

## Commands

```bash
npm run dev       # dev server
npm run build     # production build → dist/
npm run preview   # serve the built dist/ locally
npm run lint      # eslint
```

## How to add a project (3 files + 1 data entry)

1. Prepare three files (recipes below) and drop them into the category folders:

| Asset | Folder | Naming pattern | Spec |
|---|---|---|---|
| Video | `public/assets/videos/<cat>/` | `<cat>-<slug>.mp4` (e.g. `gameedits-valorant-montage.mp4`) | H.264 mp4, ≤1080p, **faststart** |
| Poster | `public/assets/thumbs/<cat>/` | `thumb-<cat>-<slug>.jpg` | 1280px wide, q80, ≤200KB |
| Filmstrip | `public/assets/strips/<cat>/` | `strip-<cat>-<slug>.jpg` | 12 frames tiled 1×12, 320px frame width, ≤300KB |
| Raw (optional) | `public/assets/raw/<cat>/` | `raw-<cat>-<slug>.mp4` | same duration/fps as the final — enables the wipe-compare |

2. Add one entry to `src/data/projects.js`:

```js
{
  id: 'gameedits-valorant-montage',
  trackId: 'game-edits',                 // must match a track id in the same file
  title: 'Valorant Montage',
  filename: 'VALORANT_MONTAGE_v03_FINAL.mp4',   // display name in the bin
  video:  'assets/videos/game-edits/gameedits-valorant-montage.mp4',
  poster: 'assets/thumbs/game-edits/thumb-gameedits-valorant-montage.jpg',
  strip:  'assets/strips/game-edits/strip-gameedits-valorant-montage.jpg',
  stripFrames: 12,
  raw: null,                  // set a raw/ path to enable wipe-compare
  runtime: '1:30',
  role: 'edit',
  cuts: 61,                   // optional — omit and it's not shown
  year: 2026,
  tools: ['DaVinci Resolve'],
  description: 'One or two sentences. Optional.',
},
```

That's it — the bin row, filmstrip scrub, monitor playback, and track counts all pick it
up automatically. Asset paths are written **without** a leading slash; they go through
the `asset()` helper at render time.

## How to add a category

1. Add one entry to `tracks` in `src/data/projects.js` (id, `trackNo` label, display
   label, color token).
2. Add the matching `--clip-<id>` color token in `src/styles/tokens.css`.
3. Create the four asset folders: `public/assets/{videos,thumbs,strips,raw}/<id>/`.

Tracks with zero projects stay visible and render a deliberate "lost media" slate row —
that's a design choice, not a bug.

## Media prep recipes (ffmpeg)

Budgets: hero loop ≤15MB · each portfolio video ideally ≤50MB (hard ceiling 95MB) ·
poster ≤200KB · strip ≤300KB. Export 1080p; the monitor never displays larger.
`-movflags +faststart` is non-negotiable — it's what makes web seeking instant.

```bash
# 1) Web-compress a final:
ffmpeg -i FINAL.mov -c:v libx264 -crf 22 -preset slow -vf "scale=1920:-2" \
  -movflags +faststart -c:a aac -b:a 160k shortfilm-driftwood.mp4

# 2) Hero loop — same, plus strip the audio track entirely:
ffmpeg -i REEL.mov -c:v libx264 -crf 23 -preset slow -vf "scale=1920:-2" \
  -movflags +faststart -an reel.mp4

# 3) Poster frame at a chosen timestamp:
ffmpeg -ss 00:00:03 -i shortfilm-driftwood.mp4 -frames:v 1 -q:v 3 thumb-shortfilm-driftwood.jpg

# 4) 12-frame filmstrip sprite (evenly spaced across the runtime):
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 shortfilm-driftwood.mp4)
ffmpeg -i shortfilm-driftwood.mp4 -vf "fps=12/$DUR,scale=320:-2,tile=12x1" \
  -frames:v 1 -q:v 4 strip-shortfilm-driftwood.jpg
```

No ffmpeg? Same results from the NLE: export stills at 12 even markers and tile them
1×12 (320px per frame), and export H.264 "match source" then run it through HandBrake
with **Web Optimized ✓** (that's faststart). Raw/graded wipe pairs must share duration
and fps exactly — export both from the same sequence in/out points.

Full-quality masters live outside this repo in `../_source-media/`; visitors get them
via the bin's `MASTERS · GOOGLE DRIVE` row (`driveUrl` in `src/data/siteConfig.js`).

### Still pending (drop-in, no code changes)

- Hero showreel → `public/assets/hero/reel.mp4` + `reel-poster.jpg` (replaces the NO SIGNAL bars)
- Headshot → `public/assets/about/headshot.jpg` (replaces the NO TALENT MEDIA slate)

## Deploy (Netlify, CLI — there is no Git remote)

```bash
npm run build
netlify deploy --prod
```

The CLI is linked to the `jerrickho-editing-portfolio` site (`netlify status` to check;
`netlify link` to relink). `netlify.toml` sets the publish dir (`dist/`), the SPA
fallback redirect, and security headers.

**Contact form:** runs on Netlify Forms. Detection comes from the **hidden mirror form
in `index.html`** — never remove it, and if a field is added to the React form in
`ExportDialog.jsx`, add it to the mirror too or submissions will drop that field.
Submission emails go to the address in `siteConfig.js`.

**Hosting limits (free tier):** 100 GB bandwidth/month, 100 form submissions/month.
If the reel goes viral, that's a champagne problem — revisit hosting then.

## Where everything lives

```
src/data/        siteConfig.js · projects.js · about.js · sections.js  ← all content
src/styles/      tokens.css (design system) · global.css
src/components/  boot/ fx/ layout/ hero/ timeline/ work/ about/ contact/ notfound/
src/lib/         asset.js (BASE_URL-safe paths) · timecode.js · playback.js
public/assets/   videos/ thumbs/ strips/ raw/ hero/ about/  ← media, by category
```

The full build history, design spec, and decision log live in
`../video-editor-portfolio-roadmap.md` (outside the repo).
