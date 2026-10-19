// Astro Synapse site behaviour.
// Each feature initialises only when its markup is present on the page.

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = Boolean(navigator.connection?.saveData);

const lockScroll = (locked) => document.body.classList.toggle("is-scroll-locked", locked);

/* ---------------------------------------------------------
   Header: solid background once the page is scrolled
   --------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", scrollY > 24);
  addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------------------------------------------------------
   Full-screen menu
   --------------------------------------------------------- */
function initMenu() {
  const toggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("site-menu");
  if (!toggle || !menu) return;
  const label = toggle.querySelector("[data-menu-label]");

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close" : "Menu";
    lockScroll(open);
  };
  const isOpen = () => menu.classList.contains("is-open");

  toggle.addEventListener("click", () => setOpen(!isOpen()));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
}

/* ---------------------------------------------------------
   Footer clock (Dublin time)
   --------------------------------------------------------- */
function initClock() {
  const clocks = document.querySelectorAll("[data-clock]");
  if (!clocks.length) return;
  const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" });
  const tick = () => clocks.forEach((el) => (el.textContent = `IE → ${format.format(new Date())}`));
  tick();
  setInterval(tick, 30_000);
}

/* ---------------------------------------------------------
   Reveal-on-scroll
   --------------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   Background videos: play only while near the viewport.
   Below-the-fold videos have preload="none" and a lazy poster, so nothing is
   downloaded until they are about to be seen. Reduced motion
   and data-saver users only get the poster image.
   --------------------------------------------------------- */
function initBackgroundVideos() {
  const videos = document.querySelectorAll("video[data-bg-video]");

  // Lazy posters: load the poster image well before the section is reached.
  const posterObserver = new IntersectionObserver(
    (entries) => {
      for (const { target: video, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        video.poster = video.dataset.poster;
        posterObserver.unobserve(video);
      }
    },
    { rootMargin: "600px 0px" },
  );
  videos.forEach((v) => v.dataset.poster && posterObserver.observe(v));

  if (prefersReducedMotion || saveData) {
    videos.forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
    });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target: video, isIntersecting } of entries) {
        if (isIntersecting) video.play().catch(() => {});
        else video.pause();
      }
    },
    { rootMargin: "200px 0px" },
  );
  videos.forEach((v) => observer.observe(v));
}

/* ---------------------------------------------------------
   Hero parallax (fine pointers only)
   --------------------------------------------------------- */
function initParallax() {
  const video = document.querySelector("[data-parallax] video");
  if (!video || prefersReducedMotion || !matchMedia("(pointer: fine)").matches) return;
  let frame = 0;
  addEventListener(
    "pointermove",
    (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / innerWidth - 0.5) * -14;
        const y = (e.clientY / innerHeight - 0.5) * -10;
        video.style.transform = `scale(1.08) translate(${x}px, ${y}px)`;
      });
    },
    { passive: true },
  );
}

/* ---------------------------------------------------------
   Expanding product panel (FLIP animation from the card)
   --------------------------------------------------------- */
const OPEN_MS = 720;
const CLOSE_MS = 520;
const EASE = "cubic-bezier(.22,1,.36,1)";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function renderTiles(product) {
  const tiles = product.tiles.map((tile, i) => {
    const delay = `${(0.28 + i * 0.11).toFixed(2)}s`;
    const bars = tile.bars
      ? `<div class="xp__bars">${Array.from(
          { length: tile.bars[1] },
          (_, k) => `<i class="xp__bar${k < tile.bars[0] ? " is-on" : ""}" style="--k:${k}"></i>`,
        ).join("")}</div>`
      : "";
    return `<div class="xp__tile wipe" style="--d:${delay}">
      <span class="xp__tile-label">${escapeHtml(tile.label)}</span>
      <div><div class="xp__tile-value${tile.accent ? " xp__tile-value--accent" : ""}">${escapeHtml(tile.value)}</div><div class="xp__tile-sub">${escapeHtml(tile.sub)}</div></div>
      ${bars}
    </div>`;
  });
  const tags = product.tags.map((t) => `<li class="pill">${escapeHtml(t)}</li>`).join("");
  tiles.push(`<div class="xp__tile xp__tile--wide wipe" style="--d:.72s"><span class="xp__tile-label">Capabilities</span><ul class="pills">${tags}</ul></div>`);
  return tiles.join("");
}

function initProductPanel() {
  const dialog = document.getElementById("product-panel");
  const dataScript = document.getElementById("product-data");
  if (!dialog || !dataScript) return;

  const products = JSON.parse(dataScript.textContent);
  const panel = dialog.querySelector(".xp__panel");
  const closeButton = dialog.querySelector(".xp__close");
  const field = (name) => dialog.querySelector(`[data-xp="${name}"]`);
  let sourceEl = null;
  let isOpen = false;

  const fill = (p) => {
    field("idx").textContent = p.idx;
    field("badge").textContent = p.badge;
    field("badge").className = `badge ${p.badgeClass}`;
    field("title").textContent = p.title;
    field("desc").textContent = p.desc;
    const link = field("link");
    link.textContent = p.linkLabel;
    link.href = p.link;
    if (p.external) {
      link.target = "_blank";
      link.rel = "noopener";
    } else {
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }
    field("page").href = p.page;
    field("tiles").innerHTML = renderTiles(p);
  };

  const targetRect = () => {
    const vw = innerWidth;
    const vh = innerHeight;
    const margin = vw < 700 ? 12 : Math.max(24, vw * 0.04);
    const width = Math.min(vw - margin * 2, 1180);
    const height = Math.min(vh - margin * 2, vw < 900 ? vh - margin * 2 : 720);
    return { left: (vw - width) / 2, top: (vh - height) / 2, width, height };
  };

  const open = (trigger) => {
    const product = products[trigger.dataset.product || trigger.dataset.openProduct];
    if (!product) return;
    sourceEl = trigger;
    fill(product);
    dialog.hidden = false;
    dialog.classList.add("is-on");
    lockScroll(true);

    // FLIP: size the panel at its final dimensions, then scale it from the card's rect.
    const from = trigger.getBoundingClientRect();
    const to = targetRect();
    panel.style.width = `${to.width}px`;
    panel.style.height = `${to.height}px`;
    panel.style.transition = "none";
    panel.style.transform = `translate(${from.left}px, ${from.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    trigger.style.opacity = "0";

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        panel.style.transition = `transform ${OPEN_MS}ms ${EASE}`;
        panel.style.transform = `translate(${to.left}px, ${to.top}px) scale(1, 1)`;
        dialog.classList.add("is-in");
        isOpen = true;
        setTimeout(() => closeButton.focus(), OPEN_MS);
      }),
    );
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    const trigger = sourceEl;
    const to = trigger?.getBoundingClientRect();
    dialog.classList.remove("is-in");
    if (to) {
      panel.style.transition = `transform ${CLOSE_MS}ms ${EASE}`;
      panel.style.transform = `translate(${to.left}px, ${to.top}px) scale(${to.width / panel.offsetWidth}, ${to.height / panel.offsetHeight})`;
    }
    setTimeout(() => {
      dialog.classList.remove("is-on");
      dialog.hidden = true;
      lockScroll(false);
      if (trigger) {
        trigger.style.opacity = "";
        trigger.focus();
      }
    }, CLOSE_MS);
  };

  // Cards: the inner "Try it" link goes straight to the product; the rest of the card opens the panel.
  document.querySelectorAll(".glow-card[data-product]").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const ext = e.target.closest("[data-ext]")?.dataset.ext;
      if (!ext) return open(card);
      if (/^https?:/.test(ext)) window.open(ext, "_blank", "noopener");
      else location.href = ext;
    });
  });
  document.querySelectorAll("[data-open-product]").forEach((btn) => btn.addEventListener("click", () => open(btn)));
  dialog.querySelectorAll("[data-xp-close]").forEach((el) => el.addEventListener("click", close));

  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") return close();
    // Keep keyboard focus inside the dialog while it is open.
    if (e.key === "Tab") {
      const focusable = [...dialog.querySelectorAll("a[href], button:not([disabled])")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  addEventListener("resize", () => {
    if (!isOpen) return;
    const to = targetRect();
    panel.style.transition = "none";
    panel.style.width = `${to.width}px`;
    panel.style.height = `${to.height}px`;
    panel.style.transform = `translate(${to.left}px, ${to.top}px)`;
  });
}

/* ---------------------------------------------------------
   Contact form (Formspree, submitted without a page reload)
   The form is novalidate, so validation happens here. Each field's rules
   come from its own attributes: required, type="email" and minlength.
   --------------------------------------------------------- */
// Stricter than the browser's check: the domain needs a dot and a TLD of 2+ characters.
const EMAIL_RE = /^[^\s@]+@(?:[^\s@.]+\.)+[^\s@.]{2,}$/;

function fieldError(field) {
  const value = field.value.trim();
  if (!value) return field.required ? field.dataset.requiredMsg || "This field is required." : "";
  if (field.type === "email" && !EMAIL_RE.test(value)) return "Enter a valid email address, like name@company.com.";
  if (field.minLength > 0 && value.length < field.minLength) {
    return `Please write at least ${field.minLength} characters (${value.length} so far).`;
  }
  return "";
}

function initForms() {
  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("[type='submit']");
    const fields = [...form.querySelectorAll(".form__field :is(input, textarea)")];
    const setStatus = (text, state) => {
      if (!status) return;
      status.hidden = false;
      status.textContent = text;
      status.className = `form__status${state ? ` is-${state}` : ""}`;
    };

    // One error line under each field, linked to it for screen readers while it shows.
    const errors = new Map(
      fields.map((field) => {
        const error = document.createElement("p");
        error.className = "form__error";
        error.id = `${field.id}-error`;
        error.hidden = true;
        field.after(error);
        return [field, error];
      })
    );
    const showError = (field, message) => {
      const error = errors.get(field);
      error.textContent = message;
      error.hidden = !message;
      if (message) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", error.id);
      } else {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }
    };
    const validate = (field) => {
      const message = fieldError(field);
      showError(field, message);
      return !message;
    };

    fields.forEach((field) => {
      // Check a field once the visitor leaves it with something typed in, then
      // re-check on every keystroke while its error shows so it clears as soon as it is fixed.
      field.addEventListener("blur", () => field.value.trim() && validate(field));
      field.addEventListener("input", () => field.hasAttribute("aria-invalid") && validate(field));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = fields.filter((field) => !validate(field));
      if (invalid.length) {
        if (status) status.hidden = true;
        invalid[0].focus();
        return;
      }
      setStatus("Sending…");
      if (submit) submit.disabled = true;
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        form.reset();
        fields.forEach((field) => showError(field, ""));
        setStatus("Message sent. We will be in touch.", "success");
      } catch {
        setStatus("Something went wrong. Email us at info@astrosynapse.ai.", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });
}

initHeader();
initMenu();
initClock();
initReveal();
initBackgroundVideos();
initParallax();
initProductPanel();
initForms();
