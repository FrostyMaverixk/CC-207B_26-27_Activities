import { useEffect, useRef } from 'react';
import { SECTIONS } from '../../data/sections';
import { site } from '../../data/siteConfig';
import { progressToTC } from '../../lib/timecode';
import { flash } from '../../lib/cut';
import {
  getScrollProgress,
  subscribeScrollProgress,
  scrollableHeight,
} from '../../hooks/useScrollProgress';
import { useSectionRanges } from '../../hooks/useSectionRanges';
import TimelineClip from './TimelineClip';
import Playhead from './Playhead';
import styles from './TimelineNav.module.css';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * The fixed bottom timeline (§3A) — ruler + live timecode readout, V1/A1
 * track lanes with the sections as clips, a red marker flag, and the
 * draggable playhead. Lives OUTSIDE #grade-root (Global Rule 7).
 *
 * Interactions:
 *   • click a clip            → jump-cut to that section (+ flash frame)
 *   • tap/click empty ruler   → jump-cut to that scroll ratio
 *   • pointer-drag anywhere   → live scrub (pointer capture, ≥4px threshold)
 *   • keyboard (nav focused)  → ←/→ nudge 2%, Home/End jump (role="slider")
 *
 * Per-frame updates (timecode text, aria-valuenow/valuetext) are direct DOM
 * writes from the scroll-engine subscription — no React state per frame. The
 * playhead tracks `--scroll-progress` in pure CSS.
 */
export default function TimelineNav() {
  const { boundaries, activeIndex } = useSectionRanges(SECTIONS);
  const navRef = useRef(null);
  const readoutRef = useRef(null);
  const pillTcRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, clip: null });

  // Live readout + slider aria values, straight to the DOM on each frame.
  useEffect(() => {
    const update = (p) => {
      const tc = progressToTC(p, boundaries, SECTIONS, site.fps);
      if (readoutRef.current) readoutRef.current.textContent = tc;
      if (pillTcRef.current) pillTcRef.current.textContent = tc;
      const nav = navRef.current;
      if (nav) {
        let idx = 0;
        boundaries.forEach((b, i) => {
          if (p >= b) idx = i;
        });
        nav.setAttribute('aria-valuenow', String(Math.round(p * 100)));
        nav.setAttribute('aria-valuetext', `${SECTIONS[idx].label} — ${tc}`);
      }
    };
    update(getScrollProgress());
    return subscribeScrollProgress(update);
  }, [boundaries]);

  const scrollToRatio = (ratio) => {
    window.scrollTo({
      top: clamp01(ratio) * scrollableHeight(),
      behavior: 'auto',
    });
  };

  const ratioFromX = (clientX) => {
    const rect = navRef.current.getBoundingClientRect();
    return clamp01((clientX - rect.left) / rect.width);
  };

  const jumpToSection = (i) => {
    scrollToRatio(boundaries[i] ?? 0);
    flash();
  };

  // Nav-wide pointer capture: a still pointer is a click (clip jump or ruler
  // jump), a moved one is a live scrub. Clips are presentational divs — all
  // pointer routing happens here; keyboard access is the slider pattern.
  const onPointerDown = (e) => {
    // Resolve the clip NOW: once the nav captures the pointer, later events
    // retarget to the nav itself and closest() would never find it.
    const clip = e.target.closest?.('[data-clip]') ?? null;
    navRef.current.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, moved: false, startX: e.clientX, clip };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    if (!drag.moved && Math.abs(e.clientX - drag.startX) < 4) return;
    drag.moved = true;
    scrollToRatio(ratioFromX(e.clientX));
  };

  const onPointerUp = (e) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    dragRef.current = { active: false, moved: false, startX: 0, clip: null };
    if (drag.moved) return; // scrub already positioned the page
    if (drag.clip) {
      jumpToSection(Number(drag.clip.dataset.clip));
    } else {
      scrollToRatio(ratioFromX(e.clientX));
      flash();
    }
  };

  const onKeyDown = (e) => {
    const p = getScrollProgress();
    const nudge = (ratio) => {
      e.preventDefault();
      scrollToRatio(ratio);
    };
    if (e.key === 'ArrowLeft') nudge(p - 0.02);
    else if (e.key === 'ArrowRight') nudge(p + 0.02);
    else if (e.key === 'Home') nudge(0);
    else if (e.key === 'End') nudge(1);
  };

  const spanOf = (i) => (boundaries[i + 1] ?? 1) - (boundaries[i] ?? 0);
  const laneSections = (lane) =>
    SECTIONS.map((s, i) => ({ s, i })).filter(({ s }) => s.track === lane);
  const active = SECTIONS[activeIndex];

  // The landmark and the widget are separate elements (Phase 6 a11y): <nav>
  // keeps its implicit navigation-landmark role, and the slider role lives on
  // a full-size inner div — role="slider" isn't allowed on <nav> itself, and
  // overriding it would also pull the timeline out of the landmark tree.
  return (
    <nav className={styles.nav} aria-label="Timeline">
      <div
        ref={navRef}
        className={styles.slider}
        role="slider"
        tabIndex={0}
        aria-label="Timeline position"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* mobile-only floating readout */}
        <div className={styles.pill} aria-hidden="true">
          <span>{active.label}</span>
          <span ref={pillTcRef} className={styles.pillTc} />
        </div>

        <div className={styles.ruler}>
          {/* discoverability hint (owner request) — SR users get the same
              affordance from the slider role + aria-valuetext */}
          <span className={styles.rulerHint} aria-hidden="true">
            timeline — drag to scrub · click a clip to jump
          </span>
          <span ref={readoutRef} className={styles.readout} />
        </div>

        <div className={styles.lanes}>
          <div className={styles.lane}>
            <span className={styles.laneLabel} aria-hidden="true">
              V1
            </span>
            {laneSections('V1').map(({ s, i }) => (
              <TimelineClip
                key={s.id}
                section={s}
                index={i}
                left={boundaries[i] ?? 0}
                width={spanOf(i)}
                active={i === activeIndex}
              />
            ))}
          </div>
          <div className={styles.lane}>
            <span className={styles.laneLabel} aria-hidden="true">
              A1
            </span>
            {laneSections('A1').map(({ s, i }) => (
              <TimelineClip
                key={s.id}
                section={s}
                index={i}
                left={boundaries[i] ?? 0}
                width={spanOf(i)}
                active={i === activeIndex}
              />
            ))}
          </div>
          {/* markers float above both lanes at their boundary point */}
          <div className={styles.markers}>
            {SECTIONS.map((s, i) =>
              s.kind === 'marker' ? (
                <TimelineClip
                  key={s.id}
                  section={s}
                  index={i}
                  left={boundaries[i] ?? 0}
                  width={0}
                  active={i === activeIndex}
                />
              ) : null,
            )}
          </div>
        </div>

        <Playhead />
      </div>
    </nav>
  );
}
