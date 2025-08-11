// Landing Page JavaScript (aligned with current DOM)
document.addEventListener("DOMContentLoaded", function () {
  wirePanelNav();
  wireCta();
  setupStatAnimations();
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
  // Support formats like 192k, 34, 99.9%
  const isPercent = raw.includes("%");
  const isK = raw.toLowerCase().includes("k");
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
    if (!isPercent) val = Math.round(isK ? val : Math.round(val));

    numEl.textContent = isPercent
      ? val.toFixed(1) + "%"
      : isK
      ? val + "k"
      : String(val);
    if (t < 1) requestAnimationFrame(tick);
    else numEl.textContent = raw; // snap to original exact formatting
  }
  requestAnimationFrame(tick);
}
