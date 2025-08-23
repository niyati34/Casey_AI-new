// Landing Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  wirePanelNav();
  wireCta();
  setupStatAnimations();
  setupStickyTopbar();
});

function wirePanelNav() {
  document.querySelectorAll(".panel-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href") || "";
      if (href.startsWith("#")) {
        e.preventDefault();
        const id = href.substring(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function wireCta() {
  const cta = document.querySelector(".cta-pill");
  if (!cta) return;
  cta.addEventListener("click", function (e) {
    // brief click animation then navigate
    e.preventDefault();
    this.style.transform = "scale(0.97)";
    setTimeout(() => {
      this.style.transform = "scale(1)";
      window.location.href = "/pipeline";
    }, 120);
  });
}

function setupStatAnimations() {
  const blocks = document.querySelectorAll(".stat-block");
  if (!blocks.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStatBlock(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  blocks.forEach((b) => io.observe(b));
}

function animateStatBlock(block) {
  const numEl = block.querySelector(".stat-num");
  if (!numEl || numEl.dataset.animated) return;
  const raw = (numEl.textContent || "").trim();
  // Support formats like 500k+, 12+, 99.9%
  const isPercent = raw.includes("%");
  const isK = raw.toLowerCase().includes("k");
  const isPlus = raw.includes("+");
  const clean = raw.replace(/[^0-9.]/g, "");
  const target = parseFloat(clean || "0");
  if (!isFinite(target)) return;

  const duration = 1200;
  const start = performance.now();
  numEl.dataset.animated = "1";

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    let val = target * eased;

    let displayVal;
    if (isPercent) {
      displayVal = val.toFixed(1) + "%";
    } else {
      val = Math.round(val);
      displayVal = isK ? val + "k" : String(val);
      if (isPlus) displayVal += "+";
    }

    numEl.textContent = displayVal;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      numEl.textContent = raw; // snap to original exact formatting
    }
  }
  requestAnimationFrame(tick);
}

function setupStickyTopbar() {
  const topbar = document.querySelector(".panel-topbar");
  if (!topbar) return;

  const update = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const threshold = 100; // Show sticky navbar after scrolling 100px

    if (scrollY > threshold) {
      topbar.classList.add("is-sticky");
    } else {
      topbar.classList.remove("is-sticky");
    }
  };

  // Respond to scroll and resize
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  // In case we land on a deep link
  window.addEventListener("hashchange", () => setTimeout(update, 0));

  // Initial state
  update();
}
