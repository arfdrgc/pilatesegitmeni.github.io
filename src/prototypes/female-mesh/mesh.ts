// Dev-only: the continuous triangle mesh of the female mesh-deformation
// prototype (./FemaleMesh.astro). One mesh covers the whole side figure (head,
// torso, legs; the near arm is a separate piece): a regular grid laid over the
// texture's alpha, keeping every cell that touches the artwork. Neighbouring
// cells share their vertices, so the surface can stretch and fold but never
// split.

export interface Mesh {
  /** Rest positions, texture pixels, [x0, y0, x1, y1, …]. */
  rest: Float32Array;
  uv: Float32Array;
  indices: Uint16Array;
  /** Unique edges, for the wireframe. */
  edges: Uint16Array;
  spacing: number;
}

export function buildMesh(alpha: Uint8ClampedArray, width: number, height: number, spacing: number): Mesh {
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);
  const covered = (cx: number, cy: number) => {
    // the cell plus one pixel around it, so anti-aliased edges stay on the mesh
    const x0 = Math.max(0, cx * spacing - 1);
    const y0 = Math.max(0, cy * spacing - 1);
    const x1 = Math.min(width, (cx + 1) * spacing + 1);
    const y1 = Math.min(height, (cy + 1) * spacing + 1);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (alpha[y * width + x] > 0) return true;
    return false;
  };
  const index = new Map<number, number>();
  const rest: number[] = [];
  const vertex = (gx: number, gy: number) => {
    const key = gy * (cols + 1) + gx;
    let i = index.get(key);
    if (i === undefined) {
      i = rest.length / 2;
      index.set(key, i);
      rest.push(gx * spacing, gy * spacing);
    }
    return i;
  };
  const tris: number[] = [];
  const edgeSet = new Set<number>();
  const edge = (a: number, b: number) => edgeSet.add(a < b ? a * 65536 + b : b * 65536 + a);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (!covered(cx, cy)) continue;
      const a = vertex(cx, cy);
      const b = vertex(cx + 1, cy);
      const c = vertex(cx + 1, cy + 1);
      const d = vertex(cx, cy + 1);
      // alternate the diagonal so the grid has no directional bias when it shears
      if ((cx + cy) % 2) tris.push(a, b, c, a, c, d);
      else tris.push(a, b, d, b, c, d);
      edge(a, b);
      edge(b, c);
      edge(c, d);
      edge(d, a);
      if ((cx + cy) % 2) edge(a, c);
      else edge(b, d);
    }
  }
  if (rest.length / 2 > 65535) throw new Error('Mesh too dense for 16-bit indices');
  const uv = new Float32Array(rest.length);
  for (let i = 0; i < rest.length; i += 2) {
    uv[i] = rest[i] / width;
    uv[i + 1] = rest[i + 1] / height;
  }
  const edges = new Uint16Array(edgeSet.size * 2);
  let k = 0;
  for (const e of edgeSet) {
    edges[k++] = Math.floor(e / 65536);
    edges[k++] = e % 65536;
  }
  return { rest: new Float32Array(rest), uv, indices: new Uint16Array(tris), edges, spacing };
}

/** Signed areas of the deformed triangles against their rest areas: the stretch range and how many folded over. */
export function triangleStats(mesh: Mesh, pos: Float32Array) {
  let min = Infinity;
  let max = 0;
  let folded = 0;
  const t = mesh.indices;
  const area = (p: Float32Array, a: number, b: number, c: number) =>
    (p[2 * b] - p[2 * a]) * (p[2 * c + 1] - p[2 * a + 1]) - (p[2 * c] - p[2 * a]) * (p[2 * b + 1] - p[2 * a + 1]);
  for (let i = 0; i < t.length; i += 3) {
    const r = area(pos, t[i], t[i + 1], t[i + 2]) / area(mesh.rest, t[i], t[i + 1], t[i + 2]);
    if (r <= 0) folded++;
    min = Math.min(min, r);
    max = Math.max(max, r);
  }
  return { min, max, folded, triangles: t.length / 3 };
}
