// Asai research page: the "data face" canvas, the internal-monologue ticker and the
// setup-journey stepper. Loaded only on /research/asai/ (front matter `scripts`).
// Everything here degrades: no canvas → static image, reduced motion → single frame.

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------
   Hero: the face as scanlines. The lines are rendered once to an
   offscreen canvas from the bust's luminance (line thickness follows
   brightness, like a CRT), then animated cheaply every frame: a refresh
   sweep travelling down, a few rows of horizontal jitter, a soft breathe
   and pointer parallax. Reduced motion keeps the static poster.
   --------------------------------------------------------- */
function initHeroLines() {
  const root = document.querySelector("[data-hero-lines]");
  const canvas = root?.querySelector("canvas");
  const src = root?.dataset.src;
  if (!root || !canvas || !src || prefersReducedMotion) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const styles = getComputedStyle(root);
  const colorVoid = styles.getPropertyValue("--void").trim() || "#04050a";
  const colorCyan = styles.getPropertyValue("--cyan").trim() || "#7cf4e0";
  const colorCream = styles.getPropertyValue("--cream").trim() || "#f4efe6";

  const image = new Image();
  image.decoding = "async";
  image.src = src;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lines = null; // offscreen render of the scanlines
  let box = { x: 0, y: 0, w: 0, h: 0 }; // where the figure sits
  let pointer = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let frame = 0;
  let visible = true;
  let jitter = []; // [{y, h, dx}]
  let lastJitter = 0;

  function renderLines() {
    const pitch = width > 900 ? 6 : 5;
    const col = 2;
    const wide = width > 900;
    // figure: fit the hero height on desktop, right of centre; on phones most of the width, at the top
    const w = wide ? image.naturalWidth * (height / image.naturalHeight) : width * 0.78;
    const h = image.naturalHeight * (w / image.naturalWidth);
    const x0 = wide ? width * 0.72 - w / 2 : (width - w) / 2;
    const y0 = wide ? 0 : -height * 0.02;
    box = { x: x0, y: y0, w, h };
    const cols = Math.ceil(w / col);
    const rows = Math.ceil(h / pitch);
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(image, 0, 0, cols, rows);
    const data = octx.getImageData(0, 0, cols, rows).data;
    lines = document.createElement("canvas");
    lines.width = Math.ceil(width * dpr);
    lines.height = Math.ceil(height * dpr);
    const lctx = lines.getContext("2d");
    lctx.scale(dpr, dpr);
    for (let r = 0; r < rows; r++) {
      const y = y0 + r * pitch + pitch / 2;
      for (let c = 0; c < cols; c++) {
        const l = Math.pow(data[(r * cols + c) * 4] / 255, 0.9);
        if (l < 0.05) continue;
        const th = Math.max(0.6, l * (pitch - 1.5));
        lctx.globalAlpha = Math.min(1, 0.15 + l * 1.2);
        lctx.fillStyle = l > 0.7 ? colorCream : colorCyan;
        lctx.fillRect(x0 + c * col, y - th / 2, col, th);
      }
    }
    lctx.globalAlpha = 1;
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderLines();
  }

  function draw(t) {
    const time = t / 1000;
    ctx.fillStyle = colorVoid;
    ctx.fillRect(0, 0, width, height);
    if (!lines) return;
    pointer.x += (target.x - pointer.x) * 0.04;
    pointer.y += (target.y - pointer.y) * 0.04;
    const dx = pointer.x * 10;
    const dy = pointer.y * 6 + Math.sin(time * 0.5) * 2;
    const breathe = 0.86 + 0.08 * Math.sin(time * 0.9);

    // the figure, with parallax and a slow breathe in brightness
    ctx.globalAlpha = breathe;
    ctx.drawImage(lines, 0, 0, lines.width, lines.height, dx, dy, width, height);

    // horizontal jitter: a few rows slip sideways for a moment, like a loose signal
    if (time - lastJitter > 0.35) {
      lastJitter = time;
      jitter = [];
      if (Math.random() < 0.55) {
        const n = 1 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) {
          jitter.push({ y: box.y + Math.random() * box.h, h: 3 + Math.random() * 14, dx: (Math.random() - 0.5) * 26 });
        }
      }
    }
    for (const j of jitter) {
      const sy = j.y * dpr;
      const sh = j.h * dpr;
      ctx.fillStyle = colorVoid;
      ctx.fillRect(0, j.y + dy, width, j.h);
      ctx.drawImage(lines, 0, sy, lines.width, sh, dx + j.dx, j.y + dy, width, j.h);
    }

    // refresh sweep: a soft band travelling down the figure, brightening the lines it crosses
    const period = 7;
    const p = (time % period) / period;
    const bandY = box.y - 80 + p * (box.h + 160);
    const bandH = 110;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    g.addColorStop(0, "rgba(124,244,224,0)");
    g.addColorStop(0.5, "rgba(124,244,224,0.9)");
    g.addColorStop(1, "rgba(124,244,224,0)");
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.rect(0, bandY, width, bandH);
    ctx.clip();
    ctx.drawImage(lines, 0, 0, lines.width, lines.height, dx, dy, width, height);
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = g;
    ctx.fillRect(0, bandY, width, bandH);
    ctx.restore();

    // a faint raster over everything, so the whole hero reads as a screen
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = colorVoid;
    for (let y = ((time * 18) % 4) - 4; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    ctx.globalAlpha = 1;
  }

  function tick(t) {
    draw(t);
    if (visible) frame = requestAnimationFrame(tick);
  }

  function start() {
    root.classList.add("is-live");
    layout();
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
      resizeTimer = setTimeout(layout, 150);
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

initHeroLines();
initDataFace();
initMonologue();
initJourney();
