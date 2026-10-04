/**
 * SHAHZAD BANGASH PORTFOLIO - MAIN SCRIPT
 * Interactive particle constellation canvas, responsive navigation,
 * project category filtering, email copying, and page transitions.
 */

(function () {
  "use strict";

  /* ==========================================================================
     1. State & Environment Variables
     ========================================================================== */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeSectionHash = window.location.hash || "#header";

  /* ==========================================================================
     2. Interactive Background Particle Constellation Engine
     ========================================================================== */
  function initParticleCanvas() {
    if (prefersReducedMotion) return;

    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    const particleCount = width < 768 ? 45 : 90;
    const connectionDistance = width < 768 ? 95 : 130;
    const mouseRadius = 140;

    const mouse = {
      x: null,
      y: null,
      active: false
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.75;
        this.vy = (Math.random() - 0.5) * 0.75;
        this.radius = Math.random() * 1.8 + 0.8;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.baseColor = Math.random() > 0.4 ? "56, 189, 248" : "99, 102, 241"; // Cyan or Indigo
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries smoothly
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;

        // Interactive mouse repulsion/reaction
        if (mouse.active && mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius && dist > 0) {
            const force = (1 - dist / mouseRadius) * 1.2;
            const angle = Math.atan2(dy, dx);
            this.x -= Math.cos(angle) * force;
            this.y -= Math.sin(angle) * force;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.baseColor}, ${this.alpha})`;
        ctx.fill();
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Connect to mouse pointer
        if (mouse.active && mouse.x !== null && mouse.y !== null) {
          const mdx = particles[i].x - mouse.x;
          const mdy = particles[i].y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < mouseRadius) {
            const mOpacity = (1 - mdist / mouseRadius) * 0.35;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${mOpacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    }

    let animationFrameId;
    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connectParticles();

      animationFrameId = requestAnimationFrame(animate);
    }

    // Event Listeners
    window.addEventListener("resize", function () {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    });

    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });

    window.addEventListener("mouseleave", function () {
      mouse.active = false;
      mouse.x = null;
      mouse.y = null;
    });

    // Touch events for mobile screens
    window.addEventListener("touchmove", function (e) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    }, { passive: true });

    window.addEventListener("touchend", function () {
      mouse.active = false;
    });

    // Pause when tab hidden to save resources
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animate();
      }
    });

    init();
    animate();
  }

  /* ==========================================================================
     3. Page & Section Routing
     ========================================================================== */
  function navigateToSection(hash) {
    if (!["#header", "#projects", "#about"].includes(hash)) {
      hash = "#header";
    }

    closeMobileNav();

    const header = document.getElementById("header");
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-menu a, .mobile-nav a");

    // Toggle header style: sticky top bar if not on hero header
    if (hash === "#header") {
      header.classList.remove("header-top");
      header.classList.add("header-initial");
      document.body.classList.add("home-active");
    } else {
      header.classList.remove("header-initial");
      header.classList.add("header-top");
      document.body.classList.remove("home-active");
    }

    // Hide all sections
    sections.forEach((sec) => {
      sec.classList.remove("section-show");
      sec.setAttribute("aria-hidden", "true");
    });

    // Show target section if not header
    if (hash !== "#header") {
      const targetSec = document.querySelector(hash);
      if (targetSec) {
        targetSec.classList.add("section-show");
        targetSec.setAttribute("aria-hidden", "false");
      }
    }

    // Update active nav links
    navLinks.forEach((link) => {
      const parentLi = link.closest("li");
      const isMatch = link.getAttribute("href") === hash;

      if (link.classList.contains("mobile-link")) {
        link.classList.toggle("active", isMatch);
      } else if (parentLi) {
        parentLi.classList.toggle("active", isMatch);
      }
    });

    activeSectionHash = hash;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ==========================================================================
     4. Mobile Navigation Handling
     ========================================================================== */
  const mobileNavBtn = document.getElementById("mobileNavBtn");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const mobileNavDrawer = document.getElementById("mobileNavDrawer");

  function openMobileNav() {
    document.body.classList.add("mobile-nav-active");
    if (mobileNavBtn) mobileNavBtn.setAttribute("aria-expanded", "true");
  }

  function closeMobileNav() {
    document.body.classList.remove("mobile-nav-active");
    if (mobileNavBtn) mobileNavBtn.setAttribute("aria-expanded", "false");
  }

  function toggleMobileNav() {
    if (document.body.classList.contains("mobile-nav-active")) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  }

  if (mobileNavBtn) {
    mobileNavBtn.addEventListener("click", toggleMobileNav);
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener("click", closeMobileNav);
  }

  // Close with Esc key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("mobile-nav-active")) {
      closeMobileNav();
    }
  });

  /* ==========================================================================
     5. Link Click Handlers
     ========================================================================== */
  document.addEventListener("click", function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const hash = anchor.getAttribute("href");
    if (["#header", "#projects", "#about"].includes(hash)) {
      e.preventDefault();
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      } else {
        navigateToSection(hash);
      }
    }
  });

  window.addEventListener("hashchange", function () {
    navigateToSection(window.location.hash || "#header");
  });

  /* ==========================================================================
     6. Projects Filtering System
     ========================================================================== */
  function initProjectFilters() {
    const filterButtons = document.querySelectorAll("#projects-filters li");
    const projectItems = document.querySelectorAll(".project-item");

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterButtons.forEach((b) => b.classList.remove("filter-active"));
        this.classList.add("filter-active");

        const filterValue = this.getAttribute("data-filter");

        projectItems.forEach((item) => {
          if (filterValue === "*" || item.matches(filterValue)) {
            item.classList.remove("filter-hidden");
            item.style.opacity = "0";
            item.style.transform = "scale(0.96) translateY(10px)";
            setTimeout(() => {
              item.style.transition = "opacity 0.35s ease, transform 0.35s ease";
              item.style.opacity = "1";
              item.style.transform = "scale(1) translateY(0)";
            }, 30);
          } else {
            item.classList.add("filter-hidden");
          }
        });
      });
    });
  }

  /* ==========================================================================
     7. Copy Email to Clipboard Feature
     ========================================================================== */
  function initCopyEmail() {
    const copyBtn = document.getElementById("copyEmailBtn");
    const copyText = document.getElementById("copyText");
    const copyIcon = document.getElementById("copyIcon");
    const emailToCopy = "shahzadbangash.office@gmail.com";

    if (!copyBtn) return;

    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(emailToCopy)
          .then(() => showCopiedFeedback())
          .catch(() => fallbackCopy(emailToCopy));
      } else {
        fallbackCopy(emailToCopy);
      }
    });

    function showCopiedFeedback() {
      copyBtn.classList.add("copied");
      if (copyText) copyText.textContent = "Email Copied!";
      if (copyIcon) {
        copyIcon.className = "bx bx-check";
      }

      setTimeout(() => {
        copyBtn.classList.remove("copied");
        if (copyText) copyText.textContent = "Copy Email";
        if (copyIcon) {
          copyIcon.className = "bx bx-copy";
        }
      }, 2500);
    }

    function fallbackCopy(text) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showCopiedFeedback();
      } catch (err) {
        console.error("Copy failed", err);
      }
      document.body.removeChild(textarea);
    }
  }

  /* ==========================================================================
     8. Initialize All Components on DOM Ready
     ========================================================================== */
  document.addEventListener("DOMContentLoaded", function () {
    initParticleCanvas();
    initProjectFilters();
    initCopyEmail();
    navigateToSection(window.location.hash || "#header");
  });

})();
