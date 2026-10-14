import { useEffect, useState } from 'react';

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Boundary math from §2 — clip geometry + active-section highlight.
 *
 * boundary[i] = clamp(sectionEl[i].offsetTop / scrollable, 0, 1)
 * activeIndex = last i where scrollY + innerHeight * 0.35 >= sectionEl[i].top
 *
 * Boundaries recompute on `resize`, on a ResizeObserver watching <main>, and
 * once after `window load` (media/font shifts), debounced 150ms. `activeIndex`
 * updates rAF-throttled on scroll, but only sets React state when the index
 * actually changes (so raw scrolling never re-renders).
 *
 * @param {import('../data/sections').Section[]} sections
 * @returns {{ boundaries: number[], activeIndex: number }}
 */
export function useSectionRanges(sections) {
  const [boundaries, setBoundaries] = useState(() => sections.map(() => 0));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id));
    // Document-relative top (getBoundingClientRect is robust against any
    // positioned ancestor that would skew offsetTop).
    const topOf = (el) =>
      el ? el.getBoundingClientRect().top + window.scrollY : 0;

    const compute = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const next = els.map((el) =>
        scrollable > 0 ? clamp01(topOf(el) / scrollable) : 0,
      );
      setBoundaries((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i])
          ? prev
          : next,
      );
    };

    let timer = 0;
    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(compute, 150);
    };

    compute();
    window.addEventListener('resize', debounced);
    window.addEventListener('load', debounced);
    const ro = new ResizeObserver(debounced);
    const main = document.querySelector('main');
    if (main) ro.observe(main);

    let raf = 0;
    const updateActive = () => {
      raf = 0;
      const probe = window.scrollY + window.innerHeight * 0.35;
      let idx = 0;
      els.forEach((el, i) => {
        if (el && probe >= topOf(el)) idx = i;
      });
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', debounced);
      window.removeEventListener('load', debounced);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [sections]);

  return { boundaries, activeIndex };
}
