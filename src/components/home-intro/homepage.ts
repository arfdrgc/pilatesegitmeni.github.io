// The homepage intro on / and /en/ (plan step 10): the live frame of
// ./HomeIntro.astro with the dot figure (`homepage`, in ../ComingSoon.astro),
// played by ./dotScene.ts exactly as on the development preview, with the
// page's states and its two controls (handoff note, 2026-10-23, "coming-soon
// text, Replay and stop control"); then the six-item menu's loop
// (../../prototypes/home-intro/loopScene.ts, owner, 2026-10-30), on the same
// canvas, as approved on the dev preview's `#loop` frame:
// - States, on <html> as data-intro, set before the first paint by
//   BaseLayout's `ritual` script: `starting` on the first visit in this tab
//   (played from its first frame), `rest` once it has played in this tab
//   (the menu, still), none with reduced motion or no scripting (the menu,
//   still, no controls). Then `playing` while it moves, `looping` once it has
//   ended (or at once, on a later visit) while the menu's loop plays, and
//   `rest` again once stopped. HomeIntro.astro shows the still menu for
//   every state but `starting` and `playing` before this script runs.
// - The loop: hovering an item (a pointer that hovers) shows its pose
//   through the disc, and leaving gives the loop back. With reduced motion
//   the menu stays still on IDLE and hovering an item shows its pose at once
//   (the loop's paused behaviour).
// - The toggle for the automatic pose cycling (owner, 2026-10-31; was the text
//   stop control), under the ring once the intro has ended, its state in
//   aria-pressed. Turned off, it stops the cycling, not the dots: the loop
//   goes through the disc into IDLE, and IDLE stays, flowing, all six labels shown; hovering an item still shows its
//   pose through the disc, and leaving goes back through it into IDLE. Turned
//   on again, the loop goes on from that IDLE's hold; the intro doesn't play.
//   Focus stays on it. When reduced motion is switched on while it moves,
//   everything stops at once on the still menu instead and the toggle goes,
//   keeping focus where it was unless it was on the toggle (then the ring's
//   first link, or Replay if the ring has none).
// - HomeIntro.astro shows neither of them during the intro. The stop control
//   (owner, 2026-10-31) shows instead, only while it plays: it goes at once to
//   the intro's end and on into the flowing IDLE, as with the cycling turned off.
//   Focus on it moves to the toggle as it goes; focus anywhere else stays.
// - Replay, an icon beside the toggle (owner, 2026-10-31): a short fade, then
//   the whole intro from its first frame, focus moving to the stop control
//   unless it has moved elsewhere meanwhile. Never with reduced motion
//   (HomeIntro.astro hides it).
import { createLoopScene, type LoopScene } from '../../prototypes/home-intro/loopScene';
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
  const halt = root.querySelector<HTMLButtonElement>('[data-intro-halt]')!;
  // Only a real link takes focus (the menu's items without a page yet have no href).
  const firstLink = root.querySelector<HTMLAnchorElement>('.intro__menu a[href]');

  /** The stop control shown or hidden (the scene fades it the same way, inline). */
  const showStop = (shown: boolean) => {
    stop.style.opacity = shown ? '1' : '0';
    stop.style.visibility = shown ? 'visible' : 'hidden';
  };

  /** The toggle's state: the automatic pose cycling on or off. */
  const setCycling = (on: boolean) => stop.setAttribute('aria-pressed', String(on));

  /** The end of the scene, still: the front view, the menu, the slogan and Replay. */
  const settle = () => {
    scene.pause();
    scene.seek(scene.duration);
  };

  // The menu's loop, made once the menu is first shown (it takes a moment, best spent while all is still).
  let loop: LoopScene | null = null;
  let loopFailed = false;
  const menuLoop = () => {
    if (!loop && !loopFailed) {
      try {
        loop = createLoopScene(root);
      } catch {
        loopFailed = true;
      }
    }
    return loop;
  };

  /** The menu still, on IDLE: the loop paused at its start, hovering an item shows its pose at once. */
  const stillMenu = () => {
    const still = menuLoop();
    if (still) {
      still.enabled = true;
      still.pause();
      still.seek(0);
    }
    showStop(false);
  };

  /** The cycling stopped, the dots flowing on: into IDLE through the disc (from the intro's end, IDLE at once). */
  const haltLoop = (fromIntro: boolean) => {
    const halted = menuLoop();
    if (halted) {
      halted.enabled = true;
      if (fromIntro || !halted.playing) halted.seek(0);
      halted.halt();
      halted.play();
      setCycling(false);
    }
    showStop(!!halted);
  };

  /** The menu's loop playing from its start, the stop control kept for it. */
  const startLoop = () => {
    const playing = menuLoop();
    const focused = document.activeElement === halt;
    if (!playing) {
      html.dataset.intro = 'rest';
      showStop(false);
      if (focused) replay.focus();
      return;
    }
    html.dataset.intro = 'looping';
    setCycling(true);
    showStop(true);
    if (focused) stop.focus();
    playing.enabled = true;
    playing.seek(0);
    playing.play();
  };

  scene.onUpdate = (time) => {
    if (html.dataset.intro !== 'playing') return;
    // The toggle stays as Replay comes in: it is for the loop that follows.
    showStop(true);
    if (time >= scene.duration) startLoop();
  };

  const stopMotion = () => {
    const state = html.dataset.intro;
    if (state !== 'playing' && state !== 'looping') return;
    const focused = document.activeElement === stop || document.activeElement === halt;
    html.dataset.intro = 'rest';
    if (state === 'playing') settle();
    if (reduced.matches) stillMenu();
    else haltLoop(state === 'playing');
    // Focus on the toggle, unless it has gone.
    if (focused) (stop.style.visibility === 'hidden' ? (firstLink ?? replay) : stop).focus();
  };

  /** The cycling on again, from the IDLE it stopped on: no intro. */
  const resumeLoop = () => {
    if (html.dataset.intro !== 'rest' || reduced.matches || !loop?.playing) return;
    html.dataset.intro = 'looping';
    setCycling(true);
    loop.resume();
  };

  stop.addEventListener('click', () => (html.dataset.intro === 'rest' ? resumeLoop() : stopMotion()));
  halt.addEventListener('click', stopMotion);
  reduced.addEventListener('change', () => {
    if (reduced.matches) stopMotion();
  });

  replay.addEventListener('click', () => {
    if (reduced.matches || html.dataset.intro === 'playing' || 'fading' in root.dataset) return;
    root.dataset.fading = '';
    setTimeout(() => {
      delete root.dataset.fading;
      if (reduced.matches) return;
      // Replay and the toggle are about to go: focus on them, or on nothing, moves to the stop control.
      const active = document.activeElement;
      const moveFocus = active === replay || active === stop || active === document.body;
      // The intro has the canvas again: the loop back to its start, out of its way.
      if (loop) {
        loop.pause();
        loop.seek(0);
        loop.enabled = false;
      }
      html.dataset.intro = 'playing';
      setCycling(true);
      scene.replay();
      if (moveFocus) halt.focus();
    }, FADE);
  });

  if (html.dataset.intro === 'starting' && !reduced.matches) {
    html.dataset.intro = 'playing';
    scene.play();
  } else {
    if (html.dataset.intro === 'starting') html.dataset.intro = 'rest';
    settle();
    if (html.dataset.intro === 'rest' && !reduced.matches) startLoop();
    else stillMenu();
  }
}
