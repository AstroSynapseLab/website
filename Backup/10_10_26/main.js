(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setScrolled() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  }

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }

  setScrolled();
  window.addEventListener("scroll", setScrolled, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });
  }

  document.querySelectorAll("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-form-status]");
      var submit = form.querySelector("[type='submit']");
      var data = new FormData(form);

      if (status) {
        status.hidden = false;
        status.textContent = "Sending…";
        status.className = "form-status";
      }
      if (submit) submit.disabled = true;

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          form.reset();
          if (status) {
            status.textContent = "Message sent. We will be in touch.";
            status.className = "form-status is-success";
          }
        })
        .catch(function () {
          if (status) {
            status.textContent = "Something went wrong. Email us at info@astrosynapse.ai.";
            status.className = "form-status is-error";
          }
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  });

  if (reduceMotion) return;

  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
    window.setTimeout(function () {
      reveals.forEach(function (el) {
        el.classList.add("is-in");
      });
    }, 1800);
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  var cursor = document.querySelector("[data-cursor]");
  var pointerFine = window.matchMedia("(pointer: fine)").matches;
  var stage = document.querySelector(".hero__stage");
  if (cursor && pointerFine) {
    var ring = document.createElement("div");
    ring.className = "cursor cursor--ring";
    ring.setAttribute("aria-hidden", "true");
    cursor.insertAdjacentElement("afterend", ring);

    var cx = -100;
    var cy = -100;
    var rx = -100;
    var ry = -100;
    var tx = -100;
    var ty = -100;

    window.addEventListener(
      "pointermove",
      function (event) {
        tx = event.clientX;
        ty = event.clientY;
        if (stage) {
          var mx = (event.clientX / window.innerWidth - 0.62) * 36;
          var my = (event.clientY / window.innerHeight - 0.28) * 24;
          stage.style.setProperty("--mx", 8 + mx / 12 + "%");
          stage.style.setProperty("--my", my + "px");
        }
      },
      { passive: true }
    );

    document.querySelectorAll("a, button, input, textarea").forEach(function (el) {
      el.addEventListener("pointerenter", function () {
        cursor.classList.add("is-hot");
        ring.classList.add("is-hot");
      });
      el.addEventListener("pointerleave", function () {
        cursor.classList.remove("is-hot");
        ring.classList.remove("is-hot");
      });
    });

    function loopCursor() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      rx += (tx - rx) * 0.09;
      ry += (ty - ry) * 0.09;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(loopCursor);
    }
    loopCursor();
  }

  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("pointermove", function (event) {
      var rect = btn.getBoundingClientRect();
      var x = event.clientX - rect.left - rect.width / 2;
      var y = event.clientY - rect.top - rect.height / 2;
      btn.style.transform = "translate(" + (x * 0.22).toFixed(2) + "px," + (y * 0.28).toFixed(2) + "px)";
    });
    btn.addEventListener("pointerleave", function () {
      btn.style.transform = "";
    });
  });

  var canvas = document.querySelector("[data-orbs]");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dots = [];
    var mouse = { x: 0.62, y: 0.28 };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }

    function spawn() {
      dots = [];
      var count = window.innerWidth < 800 ? 18 : 36;
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random(),
          y: Math.random(),
          r: 0.6 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.00025,
          vy: (Math.random() - 0.5) * 0.00025,
          hue: Math.random() > 0.5 ? "124,244,224" : "139,108,255",
        });
      }
    }

    window.addEventListener(
      "pointermove",
      function (event) {
        mouse.x = event.clientX / window.innerWidth;
        mouse.y = event.clientY / window.innerHeight;
      },
      { passive: true }
    );

    function tick() {
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx + (mouse.x - 0.5) * 0.00008;
        d.y += d.vy + (mouse.y - 0.5) * 0.00008;
        if (d.x < 0 || d.x > 1) d.vx *= -1;
        if (d.y < 0 || d.y > 1) d.vy *= -1;
        d.x = Math.min(1, Math.max(0, d.x));
        d.y = Math.min(1, Math.max(0, d.y));

        ctx.beginPath();
        ctx.fillStyle = "rgba(" + d.hue + ",0.55)";
        ctx.shadowColor = "rgba(" + d.hue + ",0.8)";
        ctx.shadowBlur = 12 * dpr;
        ctx.arc(d.x * w, d.y * h, d.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(244,239,230,0.06)";
      ctx.lineWidth = dpr;
      for (var a = 0; a < dots.length; a++) {
        for (var b = a + 1; b < dots.length; b++) {
          var dx = dots[a].x - dots[b].x;
          var dy = dots[a].y - dots[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.16) {
            ctx.globalAlpha = 1 - dist / 0.16;
            ctx.beginPath();
            ctx.moveTo(dots[a].x * w, dots[a].y * h);
            ctx.lineTo(dots[b].x * w, dots[b].y * h);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    spawn();
    window.addEventListener("resize", function () {
      resize();
      spawn();
    });
    tick();
  }

  document.querySelectorAll("[data-tilt]").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 9).toFixed(2) + "deg)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
  });
})();
