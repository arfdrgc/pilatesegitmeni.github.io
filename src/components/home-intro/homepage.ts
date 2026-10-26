// The homepage intro on / and /en/ (plan step 10): the live frame of
// ./HomeIntro.astro with the dot figure (`homepage`, in ../ComingSoon.astro),
// played by ./dotScene.ts exactly as on the development preview, with the
// page's states and its two controls (handoff note, 2026-10-23, "coming-soon
// text, Replay and stop control"):
// - States, on <html> as data-intro, set before the first paint by
//   BaseLayout's `ritual` script: `starting` on the first visit in this tab
//   (played from its first frame), `rest` once it has played in this tab
//   (the menu, still), none with reduced motion or no scripting (the menu,
//   still, no controls). Then `playing` while it moves, and `rest` again once
//   it has ended or been stopped. HomeIntro.astro shows the still menu for
//   every state but `starting` and `playing` before this script runs.
// - The stop control: everything stops at once and the still menu shows;
//   focus moves to the ring's first link (Replay if the ring has none). The
//   same when reduced motion is switched on while it moves, keeping focus
//   where it was unless it was on the stop control.
// - Replay, under the motto in the coming-soon line's place (owner,
//   2026-10-26): a short fade, then the whole intro from its first frame;
//   focus on the stop control, the one control shown while it plays. Never
//   with reduced motion (HomeIntro.astro hides it).
import { createDotScene } from './dotScene';
import type { Scene } from './scene';

/** Replay's fade out of the menu, before the first frame (the welcome ritual's). */
const FADE = 200;

export function startHomepageIntro(root: HTMLElement) {
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let scene: Scene;
  try {
    scene = createDotScene(root);
  } catch {
    // No scene: the still menu (without the figure) instead of a first frame that never moves.
    if (html.dataset.intro === 'starting') html.dataset.intro = 'rest';
    return;
  }

  const stop = root.querySelector<HTMLButtonElement>('[data-intro-stop]')!;
  const replay = root.querySelector<HTMLButtonElement>('[data-intro-replay]')!;
  const firstLink = root.querySelector<HTMLAnchorElement>('.intro__menu a');
  let replaying = false;

  /** The end of the scene, still: the front view, the menu, the slogan and Replay. */
  const settle = () => {
    scene.pause();
    scene.seek(scene.duration);
  };

  scene.onUpdate = (time) => {
    if (html.dataset.intro !== 'playing') return;
    // The stop control goes as Replay comes in: focus on it, now hidden,
    // moves on.
    if (document.activeElement === stop && stop.style.visibility === 'hidden') (replaying || !firstLink ? replay : firstLink).focus();
    if (time >= scene.duration) html.dataset.intro = 'rest';
  };

  const stopMotion = (moveFocus: boolean) => {
    if (html.dataset.intro !== 'playing') return;
    const focused = document.activeElement === stop;
    html.dataset.intro = 'rest';
    settle();
    if (moveFocus || focused) (firstLink ?? replay).focus();
  };

  stop.addEventListener('click', () => stopMotion(true));
  reduced.addEventListener('change', () => {
    if (reduced.matches) stopMotion(false);
  });

  replay.addEventListener('click', () => {
    if (reduced.matches || html.dataset.intro === 'playing' || 'fading' in root.dataset) return;
    replaying = true;
    root.dataset.fading = '';
    setTimeout(() => {
      delete root.dataset.fading;
      if (reduced.matches) return;
      html.dataset.intro = 'playing';
      scene.replay();
      stop.focus();
    }, FADE);
  });

  if (html.dataset.intro === 'starting' && !reduced.matches) {
    html.dataset.intro = 'playing';
    scene.play();
  } else {
    if (html.dataset.intro === 'starting') html.dataset.intro = 'rest';
    settle();
  }
}
