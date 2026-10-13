import { useReducer, useRef, useState } from 'react';
import { tracks, projects } from '../../data/projects';
import { site } from '../../data/siteConfig';
import TrackGroup from './TrackGroup';
import ProgramMonitor from './ProgramMonitor';
import styles from './WorkBin.module.css';

/**
 * The project bin (§3B) — tracks with NLE solo/mute, filmstrip rows, and the
 * program monitor.
 *
 * Solo/mute semantics (implemented exactly per spec):
 *   const anySolo = trackState.some((t) => t.solo);
 *   const visible = (t) => (anySolo ? t.solo : !t.muted);
 *
 * The monitor deep-links via `#clip=<id>` (history.replaceState — no nav
 * entry); on load with that hash the monitor opens after mount. Focus returns
 * to the originating strip on close.
 */

/** @param {{id:string,solo:boolean,muted:boolean}[]} state */
function reducer(state, action) {
  switch (action.type) {
    case 'toggleSolo':
      return state.map((t) =>
        t.id === action.id ? { ...t, solo: !t.solo } : t,
      );
    case 'toggleMute':
      return state.map((t) =>
        t.id === action.id ? { ...t, muted: !t.muted } : t,
      );
    default:
      return state;
  }
}

const initialTrackState = tracks.map((t) => ({
  id: t.id,
  solo: false,
  muted: false,
}));

export default function WorkBin() {
  const [trackState, dispatch] = useReducer(reducer, initialTrackState);
  // `#clip=<id>` deep link: arriving with that hash opens the monitor on mount.
  const [openProject, setOpenProject] = useState(() => {
    const match = window.location.hash.match(/^#clip=(.+)$/);
    if (!match) return null;
    return projects.find((p) => p.id === decodeURIComponent(match[1])) ?? null;
  });
  const originRef = useRef(null);

  const anySolo = trackState.some((t) => t.solo);
  const isVisible = (t) => (anySolo ? t.solo : !t.muted);

  const open = (project, origin) => {
    originRef.current = origin ?? document.activeElement;
    setOpenProject(project);
    history.replaceState(null, '', `#clip=${project.id}`);
  };

  const close = () => {
    setOpenProject(null);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    originRef.current?.focus?.();
    originRef.current = null;
  };

  const visibleTracks = tracks.filter((track) =>
    isVisible(trackState.find((t) => t.id === track.id)),
  ).length;

  return (
    <div>
      <div className={styles.panelHeader}>
        <span>PROJECT BIN — {projects.length} ITEMS</span>
        <span className={styles.panelCount}>
          {visibleTracks}/{tracks.length} TRACKS
        </span>
      </div>
      <p className={styles.hint}>
        <span className={styles.hintDesktop}>
          hover a filmstrip to scrub · click to play
        </span>
        <span className={styles.hintMobile}>
          drag a filmstrip to scrub · tap to play
        </span>
        {' · 👁 solo / M mute filter the categories'}
      </p>
      {tracks.map((track) => {
        const state = trackState.find((t) => t.id === track.id);
        return (
          <TrackGroup
            key={track.id}
            track={track}
            projects={projects.filter((p) => p.trackId === track.id)}
            state={state}
            visible={isVisible(state)}
            dispatch={dispatch}
            onOpen={open}
          />
        );
      })}

      {site.driveUrl ? (
        <a
          className={styles.driveRow}
          href={site.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.driveLabel}>MASTERS · GOOGLE DRIVE</span>
          <span className={styles.driveDesc}>
            Prefer higher quality or a plain folder view? Every video also
            lives in a Drive folder.
          </span>
          <span className={styles.driveCta}>OPEN DRIVE ↗</span>
        </a>
      ) : (
        <div className={`${styles.driveRow} ${styles.driveOffline}`}>
          <span className={styles.driveLabel}>MASTERS · GOOGLE DRIVE</span>
          <span className={styles.driveDesc}>
            Full-quality masters land here soon.
          </span>
          <span className={styles.driveCta}>
            relink: driveUrl in siteConfig.js
          </span>
        </div>
      )}

      {openProject && (
        <ProgramMonitor project={openProject} onClose={close} />
      )}
    </div>
  );
}
