# ADD A VIDEO — agent runbook

Step-by-step instructions for adding one new video to this portfolio site
(EDIT BAY). Written to be handed to an AI coding agent (Claude Sonnet/Opus or
similar). Follow it exactly — the site is fully data-driven, so **adding a
video is a media-prep + data-entry task. No component code changes. Ever.**

If something seems to require touching `src/components/`, `src/lib/`, or
`src/hooks/`, stop and ask the owner — the answer is almost certainly in
`../video-editor-portfolio-roadmap.md` (the governing design doc; code changes
must be logged in its DEVIATION LOG).

---

## 0. Context you need (30 seconds)

- App root: `video-portfolio/` (Vite + React, plain JS). Dev server: `npm run dev`.
- All content lives in `src/data/projects.js` (the ONLY file you'll edit).
- All media lives in `public/assets/`, organized by category folder.
- Asset paths in data are **relative, no leading slash** (`assets/videos/...`,
  never `/assets/videos/...`) — components prefix them via an `asset()` helper
  for GitHub Pages safety.
- Categories ("tracks") that have zero videos intentionally render a red
  "MEDIA OFFLINE — lost media" slate row. Adding the first video to an empty
  track replaces the slate automatically. REELS, GAME EDITS, and PRACTICE are
  currently the empty ones.
- A missing/broken file renders a MEDIA OFFLINE slate instead of the clip —
  so a typo'd path fails *visibly*. Use that as your error signal in dev.

Current categories (`tracks` in `projects.js`) and their asset subfolder ids:

| trackId | Label | Asset subfolder |
|---|---|---|
| `short-film` | SHORT FILM | `short-film/` |
| `ad` | AD | `ad/` |
| `reels` | REELS | `reels/` |
| `amv` | AMV | `amv/` |
| `game-edits` | GAME EDITS | `game-edits/` |
| `practice` | PRACTICE | `practice/` |
| `infographic` | INFOGRAPHIC | `infographic/` |

---

## 1. Prepare the media (3 files per video, 1 optional)

Budgets (hard rules — GitHub blocks files >100MB):

| Asset | Target | Hard ceiling |
|---|---|---|
| Video (web encode) | ≤ 50 MB | **95 MB** |
| Poster JPG | ≤ 200 KB | — |
| Filmstrip JPG | ≤ 300 KB | — |
| Whole `public/assets/` | — | ~800 MB (currently ~480 MB) |

Codec rules: **H.264 in .mp4 with `-movflags +faststart`, max 1080p.**
HEVC/H.265 is forbidden (doesn't play in all browsers). `+faststart` is
non-negotiable — it's what makes seeking instant on the web. Keep the
original master OUT of the repo (owner archives them in
`../_source-media/`).

Commands (PowerShell, ffmpeg required — `winget install ffmpeg` if missing).
Replace `<cat>` with the asset subfolder id and `<slug>` with a short
kebab-case name, e.g. `gameedits-valorant-montage`:

```powershell
# 1) Web encode (start at CRF 22; if the result is over budget, see below)
ffmpeg -i MASTER.mov -c:v libx264 -crf 22 -preset slow -vf "scale=1920:-2" `
  -movflags +faststart -c:a aac -b:a 160k <cat>-<slug>.mp4

# 2) Poster frame — pick a strong, representative timestamp
ffmpeg -ss 00:00:03 -i <cat>-<slug>.mp4 -frames:v 1 -q:v 3 thumb-<cat>-<slug>.jpg

# 3) 12-frame filmstrip sprite (evenly spaced across the runtime)
$dur = ffprobe -v error -show_entries format=duration -of csv=p=0 <cat>-<slug>.mp4
ffmpeg -i <cat>-<slug>.mp4 -vf "fps=12/$dur,scale=320:-2,tile=12x1" `
  -frames:v 1 -q:v 4 strip-<cat>-<slug>.jpg

# 4) Get the runtime for the data entry (M:SS)
ffprobe -v error -show_entries format=duration -of csv=p=0 <cat>-<slug>.mp4
```

**If the encode misses the 95MB ceiling** (long videos): switch to two-pass
with an explicit bitrate. Compute kbps as
`(85 MB × 8192) / duration_seconds − audio_kbps`, then:

```powershell
ffmpeg -y -i MASTER.mov -c:v libx264 -b:v <X>k -pass 1 -preset slow -vf "scale=1920:-2" -an -f null NUL
ffmpeg -i MASTER.mov -c:v libx264 -b:v <X>k -pass 2 -preset slow -vf "scale=1920:-2" `
  -movflags +faststart -c:a aac -b:a 128k <cat>-<slug>.mp4
```

If that forces video below ~900 kbps, encode at 720p instead
(`scale=1280:-2`) — starved 1080p looks worse than clean 720p, and the site's
player never displays wider than ~1100px. (Precedent: `Adonis Goes Virtual`,
16.5 min → 720p two-pass.)

**Optional — raw/graded compare:** if an ungraded export of the SAME timeline
exists (identical duration and fps, exported from the same in/out points),
web-encode it the same way as `raw-<cat>-<slug>.mp4`. This unlocks the site's
RAW ⇄ GRADE wipe feature for that project.

---

## 2. Drop the files in place

```
public/assets/videos/<cat>/<cat>-<slug>.mp4
public/assets/thumbs/<cat>/thumb-<cat>-<slug>.jpg
public/assets/strips/<cat>/strip-<cat>-<slug>.jpg
public/assets/raw/<cat>/raw-<cat>-<slug>.mp4     ← only if doing wipe-compare
```

If the destination folder contains a `DROP_MEDIA_HERE.txt`, delete it — it's a
placeholder that keeps empty dirs in git.

---

## 3. Add the data entry — `src/data/projects.js`

Append one object to the `projects` array, under the matching
`// ---- V# · CATEGORY ----` comment block (keep array order = display order
within a track). Copy an existing entry as the template. Field rules:

```js
{
  id: '<cat-without-dashes>-<slug>',  // unique across ALL projects; becomes the
                                      // #clip=<id> deep link. Convention examples:
                                      // 'shortfilm-kodak', 'ad-sting', 'amv-jet-set'
  trackId: '<cat>',                   // EXACTLY one of the trackIds in the table above
  title: 'Human Title',               // human-readable, shown in the player
  filename: 'TITLE_v03_FINAL.mp4',    // display gag shown on the bin strip — written
                                      // like a real editor's messy version-suffixed
                                      // filename (v07_FINAL_final2 etc.). NOT a path.
  video:  'assets/videos/<cat>/<cat>-<slug>.mp4',      // no leading slash!
  poster: 'assets/thumbs/<cat>/thumb-<cat>-<slug>.jpg',
  strip:  'assets/strips/<cat>/strip-<cat>-<slug>.jpg',
  stripFrames: 12,                    // frames baked into the sprite (12 per step 1)
  raw: null,                          // or 'assets/raw/<cat>/raw-<cat>-<slug>.mp4'
  runtime: 'M:SS',                    // from ffprobe, rounded to the second
  role: 'edit',                       // what the owner actually did: 'edit',
                                      // 'edit + grade', … APPEND ' · spec' if the
                                      // video uses a real brand/IP without a
                                      // commission (see honesty rules below)
  cuts: 61,                           // OPTIONAL — omit the line entirely if unknown
  year: 2026,                         // ask the owner; don't guess
  tools: ['DaVinci Resolve'],         // owner is Resolve-only; never list other NLEs
  description: 'One–two sentences.',  // OPTIONAL but wanted — see honesty rules
},
```

### Honesty rules (non-negotiable)

- **Never invent facts.** Plot, client names, awards, view counts — if the
  owner didn't state it, it doesn't go in. If you lack info for
  `description`, write only verifiable provenance ("School short film
  project — edited end to end.") and ask the owner for a one-line brief.
- **Spec labeling:** the owner has no client commissions yet (as of
  2026-06-11). Anything referencing a real brand (like the Sting ad) must
  carry `role: '... · spec'` and a description clarifying it's spec/school
  work, not commissioned. Ask the owner if a new video was commissioned
  before assuming otherwise.
- **Copy style:** terse, lowercase/caps machine voice for metadata, sentence
  case for descriptions, no marketing fluff, no exclamation marks.

---

## 4. Verify (all must pass)

Run `npm run dev` in `video-portfolio/` and check in the browser:

- [ ] The new clip appears under the right track in the WORK bin, with the
      poster (then filmstrip) visible — **no red MEDIA OFFLINE slate** on it.
      A slate = a wrong path in the data entry; the slate prints the path it
      tried (`relink: public/assets/...`).
- [ ] Hovering the strip scrubs through the filmstrip frames (drag on touch).
- [ ] Clicking opens the program monitor; the video **plays and seeks
      instantly** to any point. Slow first seek = `+faststart` missing →
      re-encode (re-encoding the encode is fine: `ffmpeg -i in.mp4 -c copy
      -movflags +faststart out.mp4`).
- [ ] The metadata line shows runtime / role / year correctly; description
      shows in the monitor footer.
- [ ] Deep link works: open `http://localhost:5173/#clip=<id>` → monitor
      opens on load.
- [ ] If `raw` was set: the RAW ⇄ GRADE toggle appears in the monitor header
      and both sides stay in sync while playing.
- [ ] `npm run lint` → clean. `npm run build` → zero warnings.
- [ ] Size check: the new .mp4 is < 95 MB and
      `public/assets/` total is still < ~800 MB:
      ```powershell
      "{0:N1} MB" -f ((Get-ChildItem -Recurse -File public\assets | Measure-Object Length -Sum).Sum / 1MB)
      ```

Then commit (repo root is `video-portfolio/`):

```powershell
git add public/assets src/data/projects.js
git commit -m "content: add <title> (<cat>)"
```

---

## 5. Adding a whole NEW CATEGORY (only if asked)

Adding a category is also data-only, plus one CSS token:

1. `src/styles/tokens.css` → add a clip color token following the existing
   pastel set: `--clip-<id>: #<hex>;`
2. `src/data/projects.js` → add one `tracks` entry in the desired browse
   position. Track numbers (`V1…`) are display labels — renumber the
   `trackNo` strings so they stay sequential top-to-bottom; ids and folders
   never change.
3. Create the four asset folders:
   `public/assets/{videos,thumbs,strips,raw}/<id>/`
4. The new track renders immediately (with a lost-media slate until its first
   video). Then follow steps 1–4 above per video.
5. Log the addition in `../video-editor-portfolio-roadmap.md` → DEVIATION LOG
   (dated entry, owner-requested), matching the existing entry style.

---

## Known traps (read before debugging)

- **Leading slash in a data path** → works in dev, 404s on GitHub Pages.
  Always `assets/...`, never `/assets/...`.
- **HEVC source re-muxed instead of re-encoded** → plays on the dev machine,
  black screen in some browsers. Always `-c:v libx264`.
- **`filename` vs real file** — `filename` is a display string (the messy
  version gag); the actual file on disk follows the strict
  `<cat>-<slug>.mp4` pattern. Don't conflate them.
- **Duplicate `id`** → breaks the `#clip=` deep link; ids must be unique
  across the entire `projects` array.
- **Don't "fix" the empty REELS / GAME EDITS / PRACTICE slates** — they're an
  intentional design feature (owner decision, 2026-06-11).
- **Don't add dependencies** for any of this. ffmpeg is a system tool, not an
  npm package.
