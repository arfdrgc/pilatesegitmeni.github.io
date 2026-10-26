// Draws the dot figure (./model.ts) on a 2D canvas, for the development
// homepage intro (../home-intro/dotScene.ts) and the dev-only review page
// (src/prototypes/dot-figure/DotFigure.astro). The posed dots are 3D points; a
// stage turns them about the vertical axis by its viewing angle (yaw), projects
// them straight onto the screen (orthographic, so the figure keeps its size
// at every angle) and paints them as flat circles from the farthest to the
// nearest. Far dots are drawn a little smaller and closer to the ground's
// colour, so the body's depth reads as it turns.
import { HEIGHT, LEVELS, TONES, type Dots } from './model';
import type { Palette } from './palettes';

/** Pixels per model unit at which the radius controls are given (a stage about 560 px tall). */
export const REF_SCALE = 2.9;
const DEPTH_BINS = 5;
/** How much of the way to the ground's colour the farthest dots go, and how much they shrink. */
const DEPTH_FADE = 0.38;
const DEPTH_SHRINK = 0.18;
/** Smaller stages keep their dots relatively larger: radius ∝ scale^0.65 instead of scale. */
const SIZE_EXPONENT = 0.65;
const MIN_RADIUS_PX = 0.6;

export interface Look {
  /** Smallest and largest dot radius, CSS pixels at REF_SCALE. */
  rMin: number;
  rMax: number;
  /** Colour the spine's dots with the palette's accent. */
  spine: boolean;
  /** Depth cue: far dots smaller and paler. */
  depth: boolean;
  /** The settled pose's lines, 0 (hidden) … 1. */
  lineAlpha: number;
}

/**
 * Where the figure stands, as fractions of the canvas's width: its scale (per
 * model unit), the x of its vertical axis and the floor's y. Without one, the
 * figure fills 88% of the stage's height, centred, on a floor 4% above the
 * bottom edge.
 */
export interface Placement {
  scale: number;
  x: number;
  floor: number;
}

type Rgb = [number, number, number];
const rgbOf = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t) as Rgb;
const smooth = (t: number) => t * t * (3 - 2 * t);
const css = ([r, g, b]: Rgb) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

/** WCAG contrast ratio of two hex colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = rgbOf(hex).map((c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Steps between a spine dot's body tone (0) and the palette's accent (ACCENT_STEPS − 1). */
const ACCENT_STEPS = 4;

/** Every fill a palette needs, precomputed: TONES × DEPTH_BINS body fills, ACCENT_STEPS × TONES × DEPTH_BINS spine fills, the line colour. */
export interface Colours {
  tones: string[];
  accent: string[];
  line: string;
}

export function colours(palette: Palette, ground: string): Colours {
  const stops = palette.stops.map(rgbOf);
  const bg = rgbOf(ground);
  const toneAt = (t: number) => {
    const x = t * (stops.length - 1);
    const k = Math.min(Math.floor(x), stops.length - 2);
    return mix(stops[k], stops[k + 1], x - k);
  };
  const tones: string[] = [];
  for (let t = 0; t < TONES; t++)
    for (let d = 0; d < DEPTH_BINS; d++) tones.push(css(mix(toneAt((t + 0.5) / TONES), bg, (d / (DEPTH_BINS - 1)) * DEPTH_FADE)));
  const accent = rgbOf(palette.accent);
  const spine: string[] = [];
  for (let a = 0; a < ACCENT_STEPS; a++)
    for (let t = 0; t < TONES; t++)
      for (let d = 0; d < DEPTH_BINS; d++) {
        const base = mix(toneAt((t + 0.5) / TONES), accent, a / (ACCENT_STEPS - 1));
        spine.push(css(mix(base, bg, (d / (DEPTH_BINS - 1)) * DEPTH_FADE)));
      }
  return { tones, accent: spine, line: palette.line };
}

export class Stage {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private order = new Uint32Array(0);
  private key = new Float32Array(0);
  private sx = new Float32Array(0);
  private sy = new Float32Array(0);
  visible = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /** Matches the backing store to the canvas's CSS size; true if it changed. */
  resize() {
    const box = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (box.width === this.width && box.height === this.height && dpr === this.dpr) return false;
    this.width = box.width;
    this.height = box.height;
    this.dpr = dpr;
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(box.height * dpr);
    return true;
  }

  draw(dots: Dots, pos: Float64Array, yaw: number, look: Look, fill: Colours, placement?: Placement) {
    const { ctx, width: w, height: h } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!w || !h) return;
    const n = dots.count;
    if (this.order.length !== n) {
      this.order = new Uint32Array(n);
      this.key = new Float32Array(n);
      this.sx = new Float32Array(n);
      this.sy = new Float32Array(n);
    }
    // By default the body's height fills 88% of the stage, standing on a floor 4% above its bottom edge.
    const scale = placement ? placement.scale * w : Math.min(h / (HEIGHT * 1.14), w / 120);
    const floor = placement ? placement.floor * w : h * 0.96;
    const cx = placement ? placement.x * w : w / 2;
    const c = Math.cos((yaw * Math.PI) / 180);
    const s = Math.sin((yaw * Math.PI) / 180);
    const { order, key, sx, sy } = this;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3];
      const z = pos[i * 3 + 2];
      sx[i] = cx + (x * c + z * s) * scale;
      sy[i] = floor - pos[i * 3 + 1] * scale;
      key[i] = -x * s + z * c; // towards the viewer
      order[i] = i;
    }
    order.sort((a, b) => key[a] - key[b]);

    const size = Math.pow(scale / REF_SCALE, SIZE_EXPONENT);
    // The spine is near the surface seen from the back and in profile, but
    // deep inside the body seen from the front: its accent fades out there.
    const reach = Math.max(Math.abs(s), -c, 0);
    const accentStep = look.spine ? Math.round(smooth(reach) * (ACCENT_STEPS - 1)) : 0;
    if (look.lineAlpha > 0) {
      const { lines } = dots;
      ctx.globalAlpha = look.lineAlpha * 0.45;
      ctx.strokeStyle = fill.line;
      ctx.lineWidth = Math.max(0.4, 0.5 * size);
      ctx.beginPath();
      for (let k = 0; k < lines.length; k += 2) {
        ctx.moveTo(sx[lines[k]], sy[lines[k]]);
        ctx.lineTo(sx[lines[k + 1]], sy[lines[k + 1]]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const step = (look.rMax - look.rMin) / (LEVELS - 1);
    let last = '';
    for (let k = 0; k < n; k++) {
      const i = order[k];
      // 0 nearest … 1 farthest, over about the body's depth either side of its axis.
      const far = look.depth ? Math.min(1, Math.max(0, 0.5 - key[i] / 50)) : 0;
      const bin = Math.round(far * (DEPTH_BINS - 1));
      const tone = dots.tone[i] * DEPTH_BINS + bin;
      const style = accentStep && dots.spine[i] ? fill.accent[accentStep * TONES * DEPTH_BINS + tone] : fill.tones[tone];
      if (style !== last) {
        ctx.fillStyle = style;
        last = style;
      }
      const r = Math.max(MIN_RADIUS_PX, (look.rMin + step * dots.level[i]) * size * (1 - DEPTH_SHRINK * far));
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
