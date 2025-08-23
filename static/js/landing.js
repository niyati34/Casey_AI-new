// Landing Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  wirePanelNav();
  wireCta();
  setupStatAnimations();
  setupStickyTopbar();
  setupContactForm();
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

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const messagesDiv = document.getElementById('formMessages');
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    submitBtn.disabled = true;
    messagesDiv.innerHTML = '';
    
    try {
      // Wait for Firebase to be ready
      if (!window.firebaseDB) {
        throw new Error('Firebase not initialized. Please refresh the page and try again.');
      }
      
      // Get form data
      const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        message: document.getElementById('message').value.trim(),
        timestamp: window.firebaseServerTimestamp(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      };
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Please fill in all required fields.');
      }
      
      // Add to Firestore
      const docRef = await window.firebaseAddDoc(
        window.firebaseCollection(window.firebaseDB, 'contacts'), 
        formData
      );
      
      // Success
      showMessage('success', 'Thank you! Your message has been sent successfully. We\'ll get back to you within 24 hours.');
      form.reset();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      showMessage('error', error.message || 'There was an error sending your message. Please try again or contact us directly.');
    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}

function showMessage(type, message) {
  const messagesDiv = document.getElementById('formMessages');
  const messageEl = document.createElement('div');
  messageEl.className = `form-message ${type}`;
  messageEl.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  messagesDiv.innerHTML = '';
  messagesDiv.appendChild(messageEl);
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.style.opacity = '0';
        setTimeout(() => messageEl.remove(), 300);
      }
    }, 5000);
  }
}
