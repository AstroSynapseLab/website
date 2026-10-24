// Asai research page: the "data face" canvas, the internal-monologue ticker and the
// setup-journey stepper. Loaded only on /research/asai/ (front matter `scripts`).
// Everything here degrades: no canvas → static image, reduced motion → single frame.

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   Hero: the drift field. The same stipple face as the section below,
   larger and right of the headline. Dots ride a slow flow field and
   leave fading trails; on a ~10 s cycle the face loosens into streams
   and pulls itself back together. Colour follows motion: still dots are
   cream, moving dots cyan, the fastest violet. Reduced motion keeps the
   static poster.
   --------------------------------------------------------- */
function initHeroDrift() {
  const root = document.querySelector("[data-hero-drift]");
  const canvas = root?.querySelector("canvas");
  const src = root?.dataset.src;
  if (!root || !canvas || !src || prefersReducedMotion) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const CREAM = [244, 239, 230];
  const CYAN = [124, 244, 224];
  const VIOLET = [183, 156, 255];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

  // small value-noise field for the drift
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (p, q, t) => p + t * (q - p);
  const grad = (h, x, y) => (h & 1 ? -x : x) + (h & 2 ? -y : y);
  function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = perm[X] + Y;
    const B = perm[X + 1] + Y;
    return lerp(lerp(grad(perm[A], x, y), grad(perm[B], x - 1, y), u), lerp(grad(perm[A + 1], x, y - 1), grad(perm[B + 1], x - 1, y - 1), u), v);
  }

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pts = [];
  let pointer = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let frame = 0;
  let visible = true;

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, width, height);
    // figure: fills the hero height, right of centre on desktop; most of the width, at the top, on phones
    const wide = width > 900;
    const fh = wide ? height * 1.02 : (width * 0.85 * image.naturalHeight) / image.naturalWidth;
    const fw = (image.naturalWidth * fh) / image.naturalHeight;
    const fx = wide ? width * 0.72 - fw / 2 : (width - fw) / 2;
    const fy = wide ? -height * 0.01 : -height * 0.02;
    const cols = 180;
    const rows = Math.round((cols * image.naturalHeight) / image.naturalWidth);
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(image, 0, 0, cols, rows);
    const data = octx.getImageData(0, 0, cols, rows).data;
    pts = [];
    const n = Math.round((width * height) / 190);
    let guard = 0;
    while (pts.length < n && guard++ < n * 40) {
      const c = (Math.random() * cols) | 0;
      const r = (Math.random() * rows) | 0;
      const l = data[(r * cols + c) * 4] / 255;
      if (Math.random() > Math.pow(l, 0.9) * 0.9 + 0.02) continue;
      const x = fx + ((c + Math.random()) / cols) * fw;
      const y = fy + ((r + Math.random()) / rows) * fh;
      pts.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, l, s: Math.random() });
    }
  }

  function draw(t) {
    const time = t / 1000;
    pointer.x += (target.x - pointer.x) * 0.04;
    pointer.y += (target.y - pointer.y) * 0.04;
    // trails: fade the last frame instead of clearing it
    ctx.fillStyle = "rgba(4,5,10,0.22)";
    ctx.fillRect(0, 0, width, height);
    // the field swells and fades on a ~10 s cycle
    const loose = 0.5 + 0.5 * Math.sin(time * 0.6);
    for (const p of pts) {
      const tx = p.hx + pointer.x * (12 + p.s * 18);
      const ty = p.hy + pointer.y * (8 + p.s * 10);
      const a = noise(p.x * 0.004 + time * 0.05, p.y * 0.004) * Math.PI * 2;
      p.vx += (tx - p.x) * 0.05 * (1 - loose * 0.7) + Math.cos(a) * 0.55 * loose;
      p.vy += (ty - p.y) * 0.05 * (1 - loose * 0.7) + Math.sin(a) * 0.55 * loose;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 2.5);
      const col = sp < 0.5 ? mix(CREAM, CYAN, sp * 2) : mix(CYAN, VIOLET, (sp - 0.5) * 2);
      ctx.fillStyle = rgba(col, Math.min(1, 0.25 + p.l * 0.8));
      const r = 0.7 + p.l * 1.2;
      ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r);
    }
  }

  function tick(t) {
    draw(t);
    if (visible) frame = requestAnimationFrame(tick);
  }

  function start() {
    root.classList.add("is-live");
    build();
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (visible) frame = requestAnimationFrame(tick);
      },
      { rootMargin: "100px 0px" },
    ).observe(canvas);
    if (matchMedia("(pointer: fine)").matches) {
      const surface = root.parentElement || root;
      surface.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        target.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      });
      surface.addEventListener("pointerleave", () => {
        target.x = 0;
        target.y = 0;
      });
    }
    let resizeTimer = 0;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });
  }

  if (image.complete && image.naturalWidth) start();
  else image.addEventListener("load", start, { once: true });
}

/* ---------------------------------------------------------
   The data face: a stipple swarm. Thousands of dots whose rest
   positions are sampled from a face's brightness field (data-mind-src),
   so their density draws the face. They jitter, breathe, tilt with the
   pointer, and every nine seconds scatter and settle back.
   --------------------------------------------------------- */
function initDataFace() {
  const root = document.querySelector("[data-mind]");
  const canvas = root?.querySelector("canvas");
  const src = root?.dataset.mindSrc;
  if (!root || !canvas || !src) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const styles = getComputedStyle(root);
  const colorInk = styles.getPropertyValue("--ink").trim() || "#07080f";
  const colorCyan = styles.getPropertyValue("--cyan").trim() || "#7cf4e0";
  const colorCream = styles.getPropertyValue("--cream").trim() || "#f4efe6";
  const colorMuted = styles.getPropertyValue("--muted").trim() || "#8b90a5";

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pts = [];
  let pointer = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let frame = 0;
  let visible = true;

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the figure fills the height; sample the brightness field at a modest grid
    const fh = height * 0.98;
    const fw = image.naturalWidth * (fh / image.naturalHeight);
    const fx = (width - fw) / 2;
    const fy = height * 0.01;
    const cols = 180;
    const rows = Math.round(cols * image.naturalHeight / image.naturalWidth);
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(image, 0, 0, cols, rows);
    const data = octx.getImageData(0, 0, cols, rows).data;
    // rejection sampling: brighter cells get more dots
    pts = [];
    const n = Math.round((width * height) / (width < 600 ? 110 : 130));
    let guard = 0;
    while (pts.length < n && guard++ < n * 40) {
      const c = (Math.random() * cols) | 0;
      const r = (Math.random() * rows) | 0;
      const l = data[(r * cols + c) * 4] / 255;
      if (Math.random() > Math.pow(l, 0.9) * 0.9 + 0.02) continue;
      const x = fx + ((c + Math.random()) / cols) * fw;
      const y = fy + ((r + Math.random()) / rows) * fh;
      pts.push({ hx: x, hy: y, x: x + (Math.random() - 0.5) * width, y: y + (Math.random() - 0.5) * height, vx: 0, vy: 0, l, s: Math.random(), c: Math.random() < 0.18 ? colorCyan : colorCream, dust: false });
    }
    // loose dust around the figure
    for (let i = 0; i < n * 0.12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      pts.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, l: 0.15 + Math.random() * 0.2, s: Math.random(), c: colorMuted, dust: true });
    }
  }

  function draw(t) {
    const time = t / 1000;
    pointer.x += (target.x - pointer.x) * 0.05;
    pointer.y += (target.y - pointer.y) * 0.05;
    ctx.fillStyle = colorInk;
    ctx.fillRect(0, 0, width, height);
    // every ~9 s the swarm scatters for a moment and settles again
    const cyc = (time % 9) / 9;
    const burst = cyc < 0.08 ? 1 - cyc / 0.08 : 0;
    const breathe = 1 + Math.sin(time * 0.6) * 0.012;
    const cx = width / 2;
    const cy = height / 2;
    for (const p of pts) {
      const k = p.dust ? 0.02 : 0.07;
      const tx = (p.hx - cx) * breathe + cx + pointer.x * (10 + p.s * 14);
      const ty = (p.hy - cy) * breathe + cy + pointer.y * (6 + p.s * 8);
      p.vx += (tx - p.x) * k + (Math.random() - 0.5) * 0.9 + (burst ? (p.x - cx) * 0.03 * burst : 0);
      p.vy += (ty - p.y) * k + (Math.random() - 0.5) * 0.9 + (burst ? (p.y - cy) * 0.03 * burst : 0);
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;
      const twinkle = 0.75 + 0.25 * Math.sin(time * (1 + p.s * 2) + p.s * 50);
      ctx.globalAlpha = Math.min(1, (0.25 + p.l * 0.9) * twinkle);
      ctx.fillStyle = p.c;
      const r = p.dust ? 0.7 : 0.6 + p.l * 1.1;
      ctx.fillRect(p.x - r / 2, p.y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
  }

  function drawStill() {
    // reduced motion: dots sit at their rest positions, no loop
    for (const p of pts) {
      p.x = p.hx;
      p.y = p.hy;
    }
    draw(0);
  }

  function tick(t) {
    draw(t);
    if (visible) frame = requestAnimationFrame(tick);
  }

  function start() {
    root.classList.add("is-live");
    build();
    if (prefersReducedMotion) {
      drawStill();
      return;
    }
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (visible) frame = requestAnimationFrame(tick);
      },
      { rootMargin: "100px 0px" },
    ).observe(canvas);
    if (matchMedia("(pointer: fine)").matches) {
      root.addEventListener("pointermove", (e) => {
        const rect = canvas.getBoundingClientRect();
        target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        target.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      });
      root.addEventListener("pointerleave", () => {
        target.x = 0;
        target.y = 0;
      });
    }
    let resizeTimer = 0;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (prefersReducedMotion) drawStill();
      }, 150);
    });
  }

  if (image.complete && image.naturalWidth) start();
  else image.addEventListener("load", start, { once: true });
}

/* ---------------------------------------------------------
   Internal monologue: lines type themselves in, one at a time.
   The text is illustrative and labelled as such on the page.
   --------------------------------------------------------- */
function initMonologue() {
  const list = document.querySelector("[data-monologue]");
  if (!list) return;
  const lines = JSON.parse(list.dataset.monologue || "[]");
  if (!lines.length) return;
  const MAX_VISIBLE = 5;

  if (prefersReducedMotion) {
    lines.slice(0, MAX_VISIBLE).forEach((line) => list.appendChild(makeLine(line, true)));
    return;
  }

  let index = 0;
  let running = false;
  function makeLine([tag, text], full = false) {
    const li = document.createElement("li");
    li.className = `monologue__line monologue__line--${tag}`;
    const label = document.createElement("span");
    label.className = "monologue__tag";
    label.textContent = tag;
    const body = document.createElement("span");
    body.className = "monologue__text";
    body.textContent = full ? text : "";
    li.append(label, body);
    return li;
  }
  function typeNext() {
    if (!running) return;
    const line = lines[index % lines.length];
    index++;
    const li = makeLine(line);
    list.appendChild(li);
    requestAnimationFrame(() => li.classList.add("is-in"));
    while (list.children.length > MAX_VISIBLE) list.firstElementChild.remove();
    const body = li.querySelector(".monologue__text");
    const text = line[1];
    let i = 0;
    const step = () => {
      if (!running) return;
      i += 1 + (Math.random() < 0.3 ? 1 : 0);
      body.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(step, 22 + Math.random() * 40);
      else setTimeout(typeNext, 1400 + Math.random() * 1200);
    };
    step();
  }
  new IntersectionObserver(
    ([entry]) => {
      const was = running;
      running = entry.isIntersecting;
      if (running && !was) typeNext();
    },
    { rootMargin: "100px 0px" },
  ).observe(list);
}

/* ---------------------------------------------------------
   Setup journey: the line draws node to node once in view.
   The reveal observer in main.js adds .is-in; we only react to it.
   --------------------------------------------------------- */
function initJourney() {
  const journey = document.querySelector("[data-journey]");
  if (!journey) return;
  const steps = journey.querySelectorAll(".journey__step");
  const observer = new MutationObserver(() => {
    if (!journey.classList.contains("is-in")) return;
    observer.disconnect();
    steps.forEach((step, i) => setTimeout(() => step.classList.add("is-lit"), prefersReducedMotion ? 0 : 250 + i * 320));
  });
  observer.observe(journey, { attributes: true, attributeFilter: ["class"] });
  if (journey.classList.contains("is-in")) steps.forEach((s) => s.classList.add("is-lit"));
}

initHeroDrift();
initDataFace();
initMonologue();
initJourney();
