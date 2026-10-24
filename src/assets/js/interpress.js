// Interpress (research/interpress): hero glyph field, document language morph and the ask console.
// Loaded only on that page via the `scripts` front-matter key.
// Markup hooks:
//   [data-morph] root, [data-morph-tab] language buttons, [data-morph-doc] the page,
//   [data-morph-key] text slots, [data-morph-meta] panel values, [data-morph-strings] JSON.
//   [data-ask] root, [data-ask-item] example exchanges, [data-ask-dot] stepper buttons.
//   [data-glyph-field] hero background (canvas inside).
// Without JS the page shows the English document and all three exchanges.
// The document auto-plays through its languages (instant swaps under prefers-reduced-motion);
// under reduced motion the ask console shows all exchanges and does not cycle.

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const MORPH_INTERVAL = 4200;
const MORPH_DURATION = 650;
const ASK_INTERVAL = 8000;
const NOISE = "░▒▓/\\|<>=+*#".split("");

/** Calls `onChange(visible)` whenever `el` enters or leaves the viewport. */
function watchVisibility(el, onChange) {
  const observer = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { threshold: 0.25 });
  observer.observe(el);
}

/** Pauses an auto-advancing widget while it is hovered or has focus. */
function watchAttention(el, onChange) {
  let hover = false;
  let focus = false;
  const update = () => onChange(hover || focus);
  el.addEventListener("pointerenter", () => { hover = true; update(); });
  el.addEventListener("pointerleave", () => { hover = false; update(); });
  el.addEventListener("focusin", () => { focus = true; update(); });
  el.addEventListener("focusout", (e) => { if (!el.contains(e.relatedTarget)) { focus = false; update(); } });
}

/* ---------------------------------------------------------
   Document morph: the same page, switching language
   --------------------------------------------------------- */
function initMorph() {
  const root = document.querySelector("[data-morph]");
  const source = document.querySelector("[data-morph-strings]");
  if (!root || !source) return;

  let strings;
  try {
    strings = JSON.parse(source.textContent);
  } catch {
    return;
  }

  const doc = root.querySelector("[data-morph-doc]");
  const slots = [...doc.querySelectorAll("[data-morph-key]")];
  const tabs = [...root.querySelectorAll("[data-morph-tab]")];
  const meta = [...root.querySelectorAll("[data-morph-meta]")];
  const order = tabs.map((tab) => tab.dataset.morphTab).filter((lang) => strings[lang]);

  let current = order[0];
  let visible = false;
  let keyboardFocus = false;
  let timer = 0;
  let frame = 0;

  const noise = (n) => Array.from({ length: n }, () => NOISE[(Math.random() * NOISE.length) | 0]).join("");

  function render(lang, animate) {
    const entry = strings[lang];
    current = lang;
    doc.lang = lang;
    doc.dir = entry.dir;
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.morphTab === lang)));
    meta.forEach((el) => {
      el.textContent = el.dataset.morphMeta === "dir" ? entry.dirLabel : entry[el.dataset.morphMeta];
    });

    cancelAnimationFrame(frame);
    if (!animate) {
      slots.forEach((el) => { el.textContent = entry.text[el.dataset.morphKey]; });
      root.classList.remove("is-switching");
      return;
    }

    // Reveal the new text left to right (in reading order) over a short noise tail.
    const targets = slots.map((el) => Array.from(entry.text[el.dataset.morphKey] || ""));
    const start = performance.now();
    root.classList.remove("is-switching");
    void root.offsetWidth; // restart the scan line animation
    root.classList.add("is-switching");

    const step = (now) => {
      const t = Math.min(1, (now - start) / MORPH_DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      slots.forEach((el, i) => {
        const chars = targets[i];
        const shown = Math.floor(chars.length * eased);
        el.textContent = chars.slice(0, shown).join("") + noise(Math.min(chars.length - shown, 6));
      });
      if (t < 1) frame = requestAnimationFrame(step);
      else root.classList.remove("is-switching");
    };
    frame = requestAnimationFrame(step);
  }

  // Always auto-plays while on screen (reduced motion: instant swaps, no scramble).
  // A tab click jumps to that language and the cycle carries on from there;
  // it only holds while a tab has keyboard focus.
  function schedule(delay = MORPH_INTERVAL) {
    clearTimeout(timer);
    if (!visible || keyboardFocus) return;
    timer = setTimeout(() => {
      const next = order[(order.indexOf(current) + 1) % order.length];
      render(next, !prefersReducedMotion);
      schedule();
    }, delay);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.dataset.morphTab !== current) render(tab.dataset.morphTab, !prefersReducedMotion);
      schedule(MORPH_INTERVAL * 2);
    });
  });

  root.addEventListener("focusin", (e) => {
    keyboardFocus = e.target.matches(":focus-visible");
    schedule();
  });
  root.addEventListener("focusout", (e) => {
    if (root.contains(e.relatedTarget)) return;
    keyboardFocus = false;
    schedule();
  });

  watchVisibility(root, (isVisible) => { visible = isVisible; schedule(); });

  root.classList.add("is-live");
}

/* ---------------------------------------------------------
   Ask console: one example exchange at a time
   --------------------------------------------------------- */
function initAsk() {
  const root = document.querySelector("[data-ask]");
  // Reduced motion: leave all exchanges visible, no stepper.
  if (!root || prefersReducedMotion) return;

  const items = [...root.querySelectorAll("[data-ask-item]")];
  const dots = [...root.querySelectorAll("[data-ask-dot]")];
  if (items.length < 2) return;

  let index = 0;
  let visible = false;
  let attention = false;
  let userControlled = false;
  let timer = 0;

  function show(i) {
    index = i;
    items.forEach((item, n) => item.classList.toggle("is-active", n === i));
    dots.forEach((dot, n) => dot.setAttribute("aria-pressed", String(n === i)));
  }

  function schedule() {
    clearTimeout(timer);
    if (userControlled || !visible || attention) return;
    timer = setTimeout(() => {
      show((index + 1) % items.length);
      schedule();
    }, ASK_INTERVAL);
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      userControlled = true;
      clearTimeout(timer);
      show(Number(dot.dataset.askDot));
    });
  });

  watchVisibility(root, (isVisible) => { visible = isVisible; schedule(); });
  watchAttention(root, (isFocused) => { attention = isFocused; schedule(); });

  show(0);
  root.classList.add("is-live");
}

/* ---------------------------------------------------------
   Hero glyph field: a starfield where every star is a letter
   from a different script. Now and then one "translates" into
   another script with a cyan flash. Reduced motion: one still frame.
   --------------------------------------------------------- */
const GLYPHS = ["A", "Ж", "Ω", "ع", "ب", "अ", "क", "文", "語", "한", "ß", "ø", "ñ", "Я", "ש", "ก", "ம", "ગ", "ა", "Ա", "λ", "ç", "ي", "ह", "字", "ё", "ğ", "ł"];
const GLYPH_AREA = 5200; // px² of hero per glyph
const GLYPH_SWAP_EVERY = 140; // ms between translations
const GLYPH_FLASH = 1400; // ms a flash takes to fade
const GLYPH_LINK = 120; // px: max distance for a link between bright glyphs

function cssColor(name, fallback) {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function initGlyphField() {
  const root = document.querySelector("[data-glyph-field]");
  const canvas = root?.querySelector("canvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const cyan = cssColor("--cyan", "#7cf4e0");
  const cream = cssColor("--cream", "#f4efe6");
  const voidColor = getComputedStyle(document.documentElement).getPropertyValue("--void").trim() || "#04050a";
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const pick = (list) => list[(Math.random() * list.length) | 0];

  let width = 0;
  let height = 0;
  let points = [];
  let sinceSwap = 0;
  let visible = false;
  let frame = 0;
  let last = 0;

  function seed() {
    const count = Math.round((width * height) / GLYPH_AREA);
    points = Array.from({ length: count }, () => {
      const z = Math.pow(Math.random(), 1.6); // depth: most glyphs small and far
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        glyph: pick(GLYPHS),
        flash: 0,
        vx: -(0.004 + z * 0.018),
        vy: (Math.random() - 0.5) * 0.006,
      };
    });
  }

  function draw(dt) {
    ctx.fillStyle = voidColor;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * 0.72, height * 0.45, 0, width * 0.72, height * 0.45, Math.max(width, height) * 0.6);
    glow.addColorStop(0, rgba(cyan, 0.06));
    glow.addColorStop(1, rgba(cyan, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    sinceSwap += dt;
    if (sinceSwap > GLYPH_SWAP_EVERY) {
      sinceSwap = 0;
      const p = pick(points);
      if (p && p.z > 0.25) {
        p.glyph = pick(GLYPHS);
        p.flash = 1;
      }
    }

    // faint links between the nearer (brighter) glyphs
    const near = points.filter((p) => p.z > 0.55);
    ctx.lineWidth = 1;
    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const d = Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y);
        if (d >= GLYPH_LINK) continue;
        ctx.strokeStyle = rgba(cyan, (1 - d / GLYPH_LINK) * 0.12);
        ctx.beginPath();
        ctx.moveTo(near[i].x, near[i].y);
        ctx.lineTo(near[j].x, near[j].y);
        ctx.stroke();
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of points) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -30) p.x = width + 30;
      if (p.y < -30) p.y = height + 30;
      if (p.y > height + 30) p.y = -30;

      const alpha = 0.07 + p.z * 0.45;
      ctx.font = `${p.z > 0.6 ? 600 : 400} ${9 + p.z * 26}px Inter, "Noto Sans", system-ui, sans-serif`;
      if (p.flash > 0) {
        ctx.shadowColor = rgba(cyan, 0.9);
        ctx.shadowBlur = 18 * p.flash;
        ctx.fillStyle = rgba(cyan, Math.min(1, alpha + p.flash * 0.6));
        p.flash = Math.max(0, p.flash - dt / GLYPH_FLASH);
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = rgba(cream, alpha);
      }
      ctx.fillText(p.glyph, p.x, p.y);
    }
    ctx.shadowBlur = 0;
  }

  function loop(now) {
    const dt = Math.min(50, now - (last || now));
    last = now;
    draw(dt);
    if (visible) frame = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = 0;
    if (visible && !prefersReducedMotion) frame = requestAnimationFrame(loop);
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(0); // still frame (and the only frame under reduced motion)
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(root);

  root.classList.add("is-live");
}

initGlyphField();
initMorph();
initAsk();
