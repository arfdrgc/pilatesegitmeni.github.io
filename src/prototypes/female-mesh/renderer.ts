// Dev-only: WebGL drawing for the female mesh-deformation prototype
// (./FemaleMesh.astro). Draws textured triangles whose positions the page
// skins on the CPU every frame, optionally tinted per vertex (weights,
// regions); the wireframe and the skeleton go on a 2D canvas above it.

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_uv;
attribute vec4 a_color;
uniform vec4 u_view; // world → clip: x * u_view.x + u_view.z, y * u_view.y + u_view.w
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  v_uv = a_uv;
  v_color = a_color;
  gl_Position = vec4(a_pos.x * u_view.x + u_view.z, a_pos.y * u_view.y + u_view.w, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D u_tex;
uniform float u_tint; // 0 texture, 1 vertex colour masked by the texture's alpha
uniform float u_alpha;
varying vec2 v_uv;
varying vec4 v_color;
void main() {
  vec4 t = texture2D(u_tex, v_uv); // premultiplied
  vec4 c = vec4(v_color.rgb, 1.0) * v_color.a * t.a;
  gl_FragColor = mix(t, c, u_tint) * u_alpha;
}`;

export interface Layer {
  texture: WebGLTexture;
  pos: WebGLBuffer;
  uv: WebGLBuffer;
  color: WebGLBuffer;
  index: WebGLBuffer;
  count: number;
}

export interface View {
  /** World rectangle shown: x, y, width, height (texture pixels). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: true });
  if (!gl) throw new Error('WebGL is not available');
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'program');
  gl.useProgram(program);
  const loc = {
    pos: gl.getAttribLocation(program, 'a_pos'),
    uv: gl.getAttribLocation(program, 'a_uv'),
    color: gl.getAttribLocation(program, 'a_color'),
    view: gl.getUniformLocation(program, 'u_view'),
    tint: gl.getUniformLocation(program, 'u_tint'),
    alpha: gl.getUniformLocation(program, 'u_alpha'),
  };
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  function texture(image: HTMLImageElement) {
    const t = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return t;
  }

  function layer(image: HTMLImageElement, uv: Float32Array, indices: Uint16Array): Layer {
    const buffer = (target: number, data: ArrayBufferView, usage: number) => {
      const b = gl!.createBuffer()!;
      gl!.bindBuffer(target, b);
      gl!.bufferData(target, data, usage);
      return b;
    };
    return {
      texture: texture(image),
      pos: buffer(gl!.ARRAY_BUFFER, new Float32Array(uv.length), gl!.DYNAMIC_DRAW),
      uv: buffer(gl!.ARRAY_BUFFER, uv, gl!.STATIC_DRAW),
      color: buffer(gl!.ARRAY_BUFFER, new Float32Array((uv.length / 2) * 4), gl!.DYNAMIC_DRAW),
      index: buffer(gl!.ELEMENT_ARRAY_BUFFER, indices, gl!.STATIC_DRAW),
      count: indices.length,
    };
  }

  function setPositions(l: Layer, pos: Float32Array) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, l.pos);
    gl!.bufferData(gl!.ARRAY_BUFFER, pos, gl!.DYNAMIC_DRAW);
  }

  function setColors(l: Layer, colors: Float32Array) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, l.color);
    gl!.bufferData(gl!.ARRAY_BUFFER, colors, gl!.DYNAMIC_DRAW);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);
  }

  function begin(view: View) {
    resize();
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform4f(loc.view, 2 / view.w, -2 / view.h, -1 - (2 * view.x) / view.w, 1 + (2 * view.y) / view.h);
  }

  function draw(l: Layer, tint = 0, alpha = 1) {
    const attrib = (b: WebGLBuffer, at: number, size: number) => {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, b);
      gl!.enableVertexAttribArray(at);
      gl!.vertexAttribPointer(at, size, gl!.FLOAT, false, 0, 0);
    };
    attrib(l.pos, loc.pos, 2);
    attrib(l.uv, loc.uv, 2);
    attrib(l.color, loc.color, 4);
    gl!.bindTexture(gl!.TEXTURE_2D, l.texture);
    gl!.uniform1f(loc.tint, tint);
    gl!.uniform1f(loc.alpha, alpha);
    gl!.bindBuffer(gl!.ELEMENT_ARRAY_BUFFER, l.index);
    gl!.drawElements(gl!.TRIANGLES, l.count, gl!.UNSIGNED_SHORT, 0);
  }

  return { layer, setPositions, setColors, begin, draw };
}

/** Distinct hues for the bones (overlay only, not site colours). */
export function boneColour(i: number, n: number): [number, number, number] {
  const h = (i / n) * 300; // red → magenta, skipping the wrap back to red
  const f = (k: number) => {
    const a = (k + h / 60) % 6;
    return 1 - Math.max(0, Math.min(1, Math.min(a, 4 - a)));
  };
  return [0.15 + 0.8 * f(5), 0.15 + 0.8 * f(3), 0.15 + 0.8 * f(1)];
}
