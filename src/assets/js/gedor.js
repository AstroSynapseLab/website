// Gedor page (research/gedor): hero gateway field, model console, catalog tabs,
// retrieval figure. Page-only bundle, see `scripts` in the page front matter.
// Each feature initialises only when its markup is present. Without JS the page
// shows static fallbacks (see the Gedor block in styles.css).

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Run `cb(isVisible)` whenever `el` enters or leaves the viewport. */
function watchVisibility(el, cb, rootMargin = "0px") {
  new IntersectionObserver(([entry]) => cb(entry.isIntersecting), { rootMargin }).observe(el);
}

/** Restart a CSS animation class on an element. */
function replay(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/* ---------------------------------------------------------
   Tabs (ARIA tablist): [data-gedor-tab] buttons with aria-controls
   pointing at their panels. Arrow keys, Home and End move between tabs.
   --------------------------------------------------------- */
function initTabs(root, onSelect) {
  const tabs = [...root.querySelectorAll("[data-gedor-tab]")];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  let current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"));

  const select = (index, { focus = false, user = false } = {}) => {
    const changed = index !== current;
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
    onSelect?.(index, { changed, user });
  };

  const keys = { ArrowRight: 1, ArrowLeft: -1 };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, { user: true }));
    tab.addEventListener("keydown", (e) => {
      const n = tabs.length;
      let next = null;
      if (e.key in keys) next = (i + keys[e.key] + n) % n;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = n - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, { focus: true, user: true });
    });
  });
  panels.forEach((panel) => (panel.tabIndex = 0));
  select(current);

  return {
    select,
    panels,
    get current() {
      return current;
    },
    get count() {
      return tabs.length;
    },
  };
}

/* ---------------------------------------------------------
   Hero: gateway field. Request lines from many apps converge on one
   endpoint, then fan out to three model classes; responses travel back.
   --------------------------------------------------------- */
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[(Math.random() * list.length) | 0];

function bezierPoint(p, t) {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
}

function strokeBezier(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  ctx.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
  ctx.stroke();
}

/** A short fading trail ending at `t` along a bezier path. `reverse` draws the trail ahead of t. */
function drawComet(ctx, path, t, length, rgb, alpha, reverse = false) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const [x1, y1] = bezierPoint(path, clamp(reverse ? t + length : t - length));
  const [x2, y2] = bezierPoint(path, clamp(t));
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, `rgba(${rgb},0)`);
  gradient.addColorStop(1, `rgba(${rgb},${alpha})`);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = `rgba(${rgb},${alpha})`;
  ctx.beginPath();
  ctx.arc(x2, y2, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function gatewayScene(w, h, colors, font) {
  // Narrow screens: the hero copy fills the width, so the endpoint moves to the
  // upper right edge and the whole field is drawn fainter behind the text.
  const small = w < 600;
  const gx = small ? w * 0.86 : w * 0.66;
  const gy = small ? h * 0.3 : h * 0.4;
  const span = small ? h * 0.1 : h * 0.16;
  const laneCount = small ? 14 : 30;

  const inLanes = Array.from({ length: laneCount }, (_, i) => {
    const y0 = h * (0.04 + (0.92 * (i + Math.random() * 0.6)) / laneCount);
    const ey = gy + (i / (laneCount - 1) - 0.5) * span * 0.5;
    return [[-20, y0], [w * 0.22, y0], [gx - w * 0.2, ey + (y0 - ey) * 0.1], [gx, ey]];
  });
  const groups = [
    { name: "General", y: h * 0.18 },
    { name: "Coding", y: h * 0.42 },
    { name: "Embedding", y: h * 0.66 },
  ];
  const outLanes = [];
  groups.forEach((group, gi) => {
    const perGroup = small ? 3 : 5;
    for (let k = 0; k < perGroup; k++) {
      const ey = group.y + (k - (perGroup - 1) / 2) * h * 0.022;
      const sy = gy + (gi - 1) * span * 0.25;
      outLanes.push([[gx, sy], [gx + (w - gx) * 0.35, sy], [w - (w - gx) * 0.35, ey], [w + 20, ey]]);
    }
  });

  let packets = [];
  let pulses = [];
  let spawnClock = 0;
  const spawn = () => packets.push({ lane: pick(inLanes), out: pick(outLanes), t: 0, phase: 0, speed: rand(0.28, 0.42) });
  for (let i = 0; i < 20; i++) {
    spawn();
    packets[i].t = Math.random();
  }

  return {
    update(dt) {
      spawnClock += dt;
      const interval = small ? 0.22 : 0.12;
      while (spawnClock > interval) {
        spawnClock -= interval;
        spawn();
      }
      // phase 0: app → gateway · 1: gateway → model · 2: model → gateway (response) · 3: gateway → app
      for (const p of packets) {
        p.t += dt * p.speed;
        if (p.t < 1) continue;
        p.t = 0;
        if (p.phase === 0) pulses.push({ y: p.lane[3][1], a: 1 });
        if (p.phase === 2) pulses.push({ y: p.lane[3][1], a: 0.7, response: true });
        if (p.phase === 3) p.done = true;
        p.phase++;
      }
      packets = packets.filter((p) => !p.done);
      pulses.forEach((q) => (q.a -= dt * 1.6));
      pulses = pulses.filter((q) => q.a > 0);
    },
    draw(ctx) {
      const { cyan, violet, cream, muted } = colors;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = small ? 0.55 : 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${cream},.045)`;
      inLanes.forEach((lane) => strokeBezier(ctx, lane));
      ctx.strokeStyle = `rgba(${cyan},.06)`;
      outLanes.forEach((lane) => strokeBezier(ctx, lane));

      // the endpoint: one glowing slit
      const glow = ctx.createLinearGradient(gx, gy - span, gx, gy + span);
      glow.addColorStop(0, `rgba(${cyan},0)`);
      glow.addColorStop(0.5, `rgba(${cyan},.9)`);
      glow.addColorStop(1, `rgba(${cyan},0)`);
      ctx.fillStyle = `rgba(${cyan},.06)`;
      ctx.fillRect(gx - 18, gy - span, 36, span * 2);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy - span);
      ctx.lineTo(gx, gy + span);
      ctx.stroke();
      ctx.lineWidth = 1;
      for (const q of pulses) {
        ctx.strokeStyle = `rgba(${q.response ? violet : cyan},${q.a * 0.6})`;
        ctx.beginPath();
        ctx.arc(gx, q.y, (1 - q.a) * 26 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const p of packets) {
        if (p.phase === 0) drawComet(ctx, p.lane, p.t, 0.06, cyan, 0.9);
        else if (p.phase === 1) drawComet(ctx, p.out, p.t, 0.08, cyan, 0.75);
        else if (p.phase === 2) drawComet(ctx, p.out, 1 - p.t, 0.08, violet, 0.7, true);
        else drawComet(ctx, p.lane, 1 - p.t, 0.06, violet, 0.55, true);
      }

      if (!small) {
        ctx.font = `10px ${font}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${cyan},.8)`;
        ctx.fillText("GATEWAY · /V1", gx, gy - span - 14);
        ctx.textAlign = "right";
        ctx.fillStyle = `rgba(${muted},.85)`;
        groups.forEach((group) => ctx.fillText(`${group.name.toUpperCase()} · 10`, w - 24, group.y - 16));
      }
    },
  };
}

function initSky() {
  const el = document.querySelector("[data-gedor-sky]");
  const canvas = el?.querySelector("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const style = getComputedStyle(el);
  const token = (name) => style.getPropertyValue(`--gedor-sky-${name}`).trim();
  const colors = { cyan: token("cyan"), violet: token("violet"), cream: token("cream"), muted: token("muted") };
  const font = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";

  let scene = null;
  let size = { w: 0, h: 0 };
  let visible = false;
  let frame = 0;
  let last = 0;

  const drawStill = () => {
    for (let i = 0; i < 240; i++) scene.update(1 / 60);
    scene.draw(ctx);
  };
  const resize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    // Mobile browser bars change the height slightly while scrolling: keep the scene then.
    if (scene && w === size.w && Math.abs(h - size.h) < 80) return;
    size = { w, h };
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = gatewayScene(w, h, colors, font);
    if (prefersReducedMotion) drawStill();
    else scene.draw(ctx);
  };
  const loop = (time) => {
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    scene.update(dt);
    scene.draw(ctx);
    frame = requestAnimationFrame(loop);
  };
  const sync = () => {
    const run = visible && !document.hidden && !prefersReducedMotion;
    if (run && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  resize();
  new ResizeObserver(resize).observe(el);
  watchVisibility(el, (isVisible) => {
    visible = isVisible;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
}

/* ---------------------------------------------------------
   Model console: the tabs swap the model; the reply streams in.
   Cycles through the tabs on its own until the visitor picks one.
   --------------------------------------------------------- */
function initConsole() {
  const root = document.querySelector("[data-gedor-console]");
  if (!root) return;
  const replies = [...root.querySelectorAll("[data-gedor-resp]")];
  const texts = replies.map((el) => el.textContent);
  let timer = 0;
  let visible = false;
  let started = false;
  let userPicked = false;
  let advanceWhenVisible = false;
  let tabs = null;

  const finish = (i) => {
    replies[i].textContent = texts[i];
    replies[i].classList.remove("is-streaming");
  };
  const scheduleNext = () => {
    if (userPicked || prefersReducedMotion) return;
    timer = setTimeout(() => {
      if (visible && !document.hidden) tabs.select((tabs.current + 1) % tabs.count);
      else advanceWhenVisible = true;
    }, 4500);
  };
  const play = (i) => {
    clearTimeout(timer);
    replay(tabs.panels[i].querySelector(".gedor-console__hl"), "is-flash");
    if (prefersReducedMotion) return finish(i);
    const reply = replies[i];
    const pieces = texts[i].match(/\s+|\S{1,4}/g) || [texts[i]];
    let k = 0;
    reply.textContent = "";
    reply.classList.add("is-streaming");
    const step = () => {
      if (k >= pieces.length) {
        reply.classList.remove("is-streaming");
        return scheduleNext();
      }
      reply.textContent += pieces[k++];
      timer = setTimeout(step, 26 + Math.random() * 40);
    };
    timer = setTimeout(step, 420);
  };

  let previous = 0;
  tabs = initTabs(root, (i, { user }) => {
    if (user) userPicked = true;
    if (!started) return;
    clearTimeout(timer);
    finish(previous);
    previous = i;
    play(i);
  });

  watchVisibility(root, (isVisible) => {
    visible = isVisible;
    if (!visible) return;
    if (!started) {
      started = true;
      play(tabs.current);
    } else if (advanceWhenVisible) {
      advanceWhenVisible = false;
      tabs.select((tabs.current + 1) % tabs.count);
    }
  });
}

/* ---------------------------------------------------------
   Catalog tabs
   --------------------------------------------------------- */
function initCatalog() {
  const root = document.querySelector("[data-gedor-catalog]");
  if (!root) return;
  const tabs = initTabs(root, (i, { changed }) => {
    if (changed && !prefersReducedMotion) replay(tabs.panels[i], "is-entering");
  });
}

/* ---------------------------------------------------------
   Retrieval figure: upload → embed → query → answer, on a loop while visible.
   The markup carries the final state, which also stays for reduced motion.
   --------------------------------------------------------- */
function initRag() {
  const root = document.querySelector("[data-gedor-rag]");
  if (!root || prefersReducedMotion) return;
  const STATES = ["is-chunked", "is-embedded", "is-queried", "is-answered"];
  const TIMES = [700, 1900, 3300, 4500];
  const LOOP_MS = 10000;
  let timers = [];

  const show = (n) => STATES.forEach((cls, i) => root.classList.toggle(cls, i < n));
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const run = () => {
    stop();
    show(0);
    timers = TIMES.map((t, i) => setTimeout(() => show(i + 1), t));
    timers.push(setTimeout(run, LOOP_MS));
  };

  watchVisibility(root, (isVisible) => {
    if (isVisible) run();
    else {
      stop();
      show(STATES.length);
    }
  });
}

initSky();
initConsole();
initCatalog();
initRag();
