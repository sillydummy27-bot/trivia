const PRESETS = Object.freeze({ pink: '#F43D9E', red: '#EF4554', blue: '#3189F5' });
const DEFAULTS = Object.freeze({
  '--paper': '#fff8ee', '--yellow': '#ffd300', '--theme-accent': '#e85375',
  '--theme-on-accent': '#10162f', '--theme-surface': '#ffffff', '--theme-soft': '#f2b5d4',
  '--theme-strong': '#10162f', '--muted': '#626579'
});
const THEME_KEYS = Object.keys(DEFAULTS);

function rgb(hex) {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
}

function hex(channels) {
  return `#${channels.map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mix(first, second, amount) {
  return hex(rgb(first).map((value, index) => value * (1 - amount) + rgb(second)[index] * amount));
}

function luminance(color) {
  const values = rgb(color).map(value => {
    const normalized = value / 255;
    return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}

function contrast(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + .05) / (dark + .05);
}

export function themeColor(choice) {
  if (PRESETS[choice]) return PRESETS[choice];
  return /^#[0-9a-f]{6}$/i.test(choice) ? choice.toUpperCase() : null;
}

export function applyTheme(choice) {
  const color = themeColor(choice);
  if (!color) return null;
  const root = document.documentElement;
  const onAccent = contrast(color, '#000000') >= contrast(color, '#ffffff') ? '#000000' : '#ffffff';
  let paperWhite = .45;
  while (contrast(mix(color, '#ffffff', paperWhite), '#10162f') < 7 && paperWhite < .8) paperWhite += .02;
  const paper = mix(color, '#ffffff', paperWhite);
  let strong = color;
  let darken = 0;
  while (contrast(strong, paper) < 4.5 && darken < 1) {
    darken = Math.min(1, darken + .05);
    strong = mix(color, '#10162f', darken);
  }
  root.style.setProperty('--paper', paper);
  root.style.setProperty('--yellow', mix(color, '#ffffff', .48));
  root.style.setProperty('--theme-accent', color);
  root.style.setProperty('--theme-on-accent', onAccent);
  root.style.setProperty('--theme-surface', mix(color, '#ffffff', .91));
  root.style.setProperty('--theme-soft', mix(color, '#ffffff', .62));
  root.style.setProperty('--theme-strong', strong);
  root.style.setProperty('--muted', '#30384a');
  root.classList.add('has-theme');
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', paper);
  return color;
}

export function resetTheme() {
  THEME_KEYS.forEach(key => document.documentElement.style.removeProperty(key));
  document.documentElement.classList.remove('has-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', DEFAULTS['--paper']);
}

// A shader draws the color wave while the DOM's grayscale filter fades out.
// The latter also provides a useful transition when WebGL is unavailable.
export function revealTheme(color) {
  const shell = document.querySelector('.site-shell');
  if (!shell) return () => {};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0 : 750;
  shell.classList.remove('theme-reveal');
  shell.style.setProperty('--reveal-duration', `${duration}ms`);
  if (!duration) return () => {};

  // Restart the CSS transition even when the player changes their selection.
  shell.style.filter = 'grayscale(1)';
  void shell.offsetWidth;
  const frame = requestAnimationFrame(() => {
    shell.classList.add('theme-reveal');
    shell.style.filter = 'grayscale(0)';
  });

  const canvas = document.createElement('canvas');
  canvas.className = 'theme-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  let gl;
  let animation = 0;
  let program;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL unavailable');
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}');
    const fragment = compile(gl.FRAGMENT_SHADER, 'precision mediump float; varying vec2 uv; uniform float progress; uniform vec3 tint; void main(){float edge=progress*1.7-0.35;float wave=sin(uv.y*22.0+progress*12.0)*0.025;float band=1.0-smoothstep(0.0,0.22,abs(uv.x+uv.y*0.18-edge+wave));float fade=(1.0-progress)*0.24;gl_FragColor=vec4(tint,(band*0.24+fade*0.18)*(1.0-progress));}');
    program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(gl.getUniformLocation(program, 'tint'), rgb(color).map(value => value / 255));
    const progressLocation = gl.getUniformLocation(program, 'progress');
    const render = start => {
      const tick = now => {
        const progress = Math.min(1, (now - start) / duration);
        const ratio = Math.min(devicePixelRatio || 1, 2);
        const width = Math.round(innerWidth * ratio);
        const height = Math.round(innerHeight * ratio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width; canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(progressLocation, progress);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (progress < 1) animation = requestAnimationFrame(tick);
        else canvas.remove();
      };
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(render);
  } catch {
    canvas.remove();
  }
  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(animation);
    canvas.remove();
    shell.classList.remove('theme-reveal');
    shell.style.filter = '';
  };
}
