import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { site } from './data/siteConfig';
import { SECTIONS } from './data/sections';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useGradeRamp } from './hooks/useGradeRamp';
import { useJKLShuttle } from './hooks/useJKLShuttle';
import BootLoader from './components/boot/BootLoader';
import SectionFrame from './components/layout/SectionFrame';
import Hero from './components/hero/Hero';
import WorkBin from './components/work/WorkBin';
import About from './components/about/About';
import ExportDialog from './components/contact/ExportDialog';
import TimelineNav from './components/timeline/TimelineNav';
import GrainOverlay from './components/fx/GrainOverlay';
import CutFlash from './components/fx/CutFlash';
import ShuttleBadge from './components/fx/ShuttleBadge';
import MediaOffline from './components/notfound/MediaOffline';

/** Maps each section id to the component that fills its SectionFrame body. */
const SECTION_VIEW = {
  hero: Hero,
  work: WorkBin,
  about: About,
  contact: ExportDialog,
};

/**
 * The single scroll experience at `/`. Layout enforces Global Rule 7 from day
 * one: the scroll-grade `filter` lives on `#grade-root`, so anything that must
 * stay `position: fixed` (timeline nav, grain, cut-flash, and later the modal
 * portal) renders as a SIBLING of it, never a descendant.
 */
function Bay() {
  const { hash } = useLocation();

  // Install the scroll engine (writes --scroll-progress; see the hook), the
  // grade-in ramp (filter on #grade-root over the first ~viewport), and the
  // J-K-L page shuttle (Phase 6 — the footer hint is its only documentation).
  useScrollProgress();
  useGradeRamp();
  const shuttleVelocity = useJKLShuttle();

  // Hash deep-links: on mount / hash change, jump straight to the section (a
  // cut — never smooth). Wait one frame so layout is settled before scrolling.
  useEffect(() => {
    const id = hash.replace(/^#/, '');
    if (!id || !SECTIONS.some((s) => s.id === id)) return undefined;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(raf);
  }, [hash]);

  return (
    <>
      <div id="grade-root">
        <main style={{ paddingBottom: 'var(--space-8)' }}>
          {SECTIONS.map((section) => {
            const View = SECTION_VIEW[section.id];
            return (
              <SectionFrame key={section.id} section={section}>
                {View ? <View /> : null}
              </SectionFrame>
            );
          })}
        </main>
      </div>

      {/* Siblings of #grade-root — outside the grade `filter` (Global Rule 7). */}
      <TimelineNav />
      <ShuttleBadge velocity={shuttleVelocity} />
      <GrainOverlay />
      <CutFlash />
      <BootLoader />
    </>
  );
}

export default function App() {
  // GoatCounter pageview analytics (owner request, 2026-06-11) — cookie-free,
  // so no consent banner. Loads only in production and only once the owner
  // has set `site.goatCounter`; until then this is a no-op.
  useEffect(() => {
    if (import.meta.env.DEV || !site.goatCounter) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${site.goatCounter}.goatcounter.com/count`;
    document.head.appendChild(s);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bay />} />
        <Route path="*" element={<MediaOffline />} />
      </Routes>
    </BrowserRouter>
  );
}
