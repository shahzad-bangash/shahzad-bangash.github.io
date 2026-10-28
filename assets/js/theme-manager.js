/**
 * ==========================================================================
 * SHAHZAD BANGASH PORTFOLIO & ARCADE - THEME MANAGER
 * Unified Theme Engine for Portfolio, Bubble Pop Arcade, and Tic Tac Toe.
 *
 * Real-Time Cross-Page & Cross-Tab Synchronization:
 * - BroadcastChannel API for immediate (<5ms) inter-tab state broadcast
 * - Persistent localStorage prioritization
 * - Live dynamic link rewriting for games/portfolio
 * - Visibility & focus listeners for background-tab sync
 *
 * Direct Click Theme Toggle (Cycles 5 clean themes):
 * 1. Dark Blue (Default)
 * 2. Light Blue (Light Mode)
 * 3. Green
 * 4. Purple
 * 5. Red
 * ==========================================================================
 */

(function (window, document) {
  "use strict";

  const STORAGE_KEY = "shahzad_portfolio_theme";
  const DEFAULT_THEME = "dark-blue";
  const CHANNEL_NAME = "shahzad_portfolio_theme_channel";

  const THEME_ALIASES = {
    "dark-blue": "dark-blue",
    "cyber-dark": "dark-blue",
    "cyber-void": "dark-blue",
    "light-blue": "light-blue",
    "clean-light": "light-blue",
    "green": "green",
    "emerald-green": "green",
    "emerald-matrix": "green",
    "purple": "purple",
    "neon-purple": "purple",
    "neon-sakura": "purple",
    "red": "red",
    "arctic-blue": "red",
    "arctic-frost": "red",
    "amber": "dark-blue",
    "solar-amber": "dark-blue",
    "solar-flare": "dark-blue"
  };

  const THEMES = [
    {
      id: "dark-blue",
      name: "Dark Blue",
      isDefault: true,
      dots: ["#0f172a", "#3b82f6", "#2563eb"],
      particleColors: ["59, 130, 246", "37, 99, 235"],
      bubbleHues: [
        { bg: "#2563eb", glow: "transparent" },
        { bg: "#3b82f6", glow: "transparent" },
        { bg: "#0284c7", glow: "transparent" },
        { bg: "#1d4ed8", glow: "transparent" }
      ]
    },
    {
      id: "light-blue",
      name: "Light Blue",
      isDefault: false,
      dots: ["#f8fafc", "#2563eb", "#1d4ed8"],
      particleColors: ["37, 99, 235", "59, 130, 246"],
      bubbleHues: [
        { bg: "#2563eb", glow: "transparent" },
        { bg: "#0284c7", glow: "transparent" },
        { bg: "#059669", glow: "transparent" },
        { bg: "#d97706", glow: "transparent" }
      ]
    },
    {
      id: "green",
      name: "Green",
      isDefault: false,
      dots: ["#0d1a14", "#10b981", "#059669"],
      particleColors: ["16, 185, 129", "5, 150, 105"],
      bubbleHues: [
        { bg: "#10b981", glow: "transparent" },
        { bg: "#059669", glow: "transparent" },
        { bg: "#047857", glow: "transparent" },
        { bg: "#065f46", glow: "transparent" }
      ]
    },
    {
      id: "purple",
      name: "Purple",
      isDefault: false,
      dots: ["#171120", "#a855f7", "#9333ea"],
      particleColors: ["168, 85, 247", "147, 51, 234"],
      bubbleHues: [
        { bg: "#a855f7", glow: "transparent" },
        { bg: "#9333ea", glow: "transparent" },
        { bg: "#7e22ce", glow: "transparent" },
        { bg: "#6b21a8", glow: "transparent" }
      ]
    },
    {
      id: "red",
      name: "Red",
      isDefault: false,
      dots: ["#1a1012", "#ef4444", "#dc2626"],
      particleColors: ["239, 68, 68", "220, 38, 38"],
      bubbleHues: [
        { bg: "#ef4444", glow: "transparent" },
        { bg: "#dc2626", glow: "transparent" },
        { bg: "#b91c1c", glow: "transparent" },
        { bg: "#991b1b", glow: "transparent" }
      ]
    }
  ];

  let currentThemeId = DEFAULT_THEME;
  let broadcastChannel = null;

  // Initialize BroadcastChannel for cross-tab theme communication
  try {
    if (typeof window.BroadcastChannel === "function") {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = function (event) {
        if (event && event.data && event.data.themeId) {
          const incomingTheme = normalizeThemeId(event.data.themeId);
          if (incomingTheme && incomingTheme !== currentThemeId) {
            applyTheme(incomingTheme, false, false);
          }
        }
      };
    }
  } catch (e) {
    console.warn("BroadcastChannel initialization warning:", e);
  }

  function normalizeThemeId(id) {
    if (!id) return DEFAULT_THEME;
    if (THEME_ALIASES[id]) return THEME_ALIASES[id];
    return id;
  }

  function getSavedTheme() {
    try {
      // 1. Check URL query parameter first (if explicitly specified in URL or link)
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = normalizeThemeId(urlParams.get("theme"));
      if (urlTheme && THEMES.some(t => t.id === urlTheme)) {
        try {
          localStorage.setItem(STORAGE_KEY, urlTheme);
        } catch (_) {}
        return urlTheme;
      }

      // 2. Check persistent localStorage (user's active selection across entire site)
      const saved = normalizeThemeId(localStorage.getItem(STORAGE_KEY));
      if (saved && THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn("Theme storage access error:", e);
    }
    return DEFAULT_THEME;
  }

  function getThemeConfig(themeId) {
    const norm = normalizeThemeId(themeId);
    return THEMES.find(t => t.id === norm) || THEMES[0];
  }

  /**
   * Dynamically rewrites all internal navigation links on the page so that
   * clicking any project link, back link, or game button opens the destination
   * in the exact active theme.
   */
  function updateInternalLinks(themeId) {
    try {
      const links = document.querySelectorAll(
        'a[href*="bubble_game"], a[href*="tictactoe"], a[href*="2048"], a[href*="index.html"]'
      );
      links.forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#")) return;
        const [base, hash] = href.split("#");
        const [cleanBase] = base.split("?");
        const hashPart = hash ? `#${hash}` : "";
        link.setAttribute("href", `${cleanBase}?theme=${themeId}${hashPart}`);
      });
    } catch (e) {}
  }

  function applyTheme(themeId, shouldBroadcast = true) {
    const config = getThemeConfig(themeId);
    currentThemeId = config.id;

    // Apply attribute to html root
    document.documentElement.setAttribute("data-theme", currentThemeId);

    // Save preference to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, currentThemeId);
    } catch (e) {}

    // Update current page URL query param quietly (without page reload)
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("theme") || window.location.pathname.includes("projects/")) {
        url.searchParams.set("theme", currentThemeId);
        window.history.replaceState({ theme: currentThemeId }, "", url.toString());
      }
    } catch (e) {}

    // Synchronize all on-page internal links (projects, back links, games)
    updateInternalLinks(currentThemeId);

    // Update all theme switcher buttons in DOM
    updateAllUI();

    // Broadcast change across tabs and windows
    if (shouldBroadcast && broadcastChannel) {
      try {
        broadcastChannel.postMessage({ themeId: currentThemeId });
      } catch (e) {}
    }

    // Dispatch global event for canvas, games, and components
    window.dispatchEvent(
      new CustomEvent("portfolio:themechange", {
        detail: {
          themeId: currentThemeId,
          theme: config
        }
      })
    );
  }

  /**
   * Cycles directly to the next theme in the sequence:
   * Dark Blue -> Light Blue -> Green -> Purple -> Red -> Dark Blue
   */
  function cycleToNextTheme() {
    const currentIndex = THEMES.findIndex(t => t.id === currentThemeId);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    applyTheme(nextTheme.id, true);
  }

  function updateAllUI() {
    const config = getThemeConfig(currentThemeId);

    document.querySelectorAll(".theme-trigger-btn").forEach(btn => {
      // Update label text
      const label = btn.querySelector(".theme-label-text");
      if (label) {
        label.textContent = config.name;
      }

      // Update swatch dots
      const swatch = btn.querySelector(".theme-mini-swatch");
      if (swatch) {
        swatch.innerHTML = config.dots
          .map(c => `<span class="theme-dot" style="background:${c}"></span>`)
          .join("");
      }

      // Update button tooltip and accessible label
      btn.setAttribute("title", `Theme: ${config.name} (Click to switch)`);
      btn.setAttribute("aria-label", `Switch Theme (Current: ${config.name})`);
    });
  }

  /**
   * Sets up direct click-to-toggle behavior on theme switcher wrappers
   */
  function setupThemeSwitcher(wrapper) {
    if (!wrapper || wrapper.__themeInitialized) return;
    wrapper.__themeInitialized = true;

    // Remove any leftover popovers completely
    const existingPopover = wrapper.querySelector(".theme-popover");
    if (existingPopover) {
      existingPopover.remove();
    }

    const trigger = wrapper.querySelector(".theme-trigger-btn");
    if (!trigger) return;

    // Remove old dropdown attributes
    trigger.removeAttribute("aria-haspopup");
    trigger.removeAttribute("aria-expanded");
    trigger.setAttribute("title", "Click to switch theme");

    // Remove old caret if present
    const caret = trigger.querySelector(".theme-caret");
    if (caret) {
      caret.remove();
    }

    // Remove cycle icon if present (button is now icon-only)
    const existingCycleIcon = trigger.querySelector(".theme-cycle-icon");
    if (existingCycleIcon) {
      existingCycleIcon.remove();
    }

    // Remove swatch and label if present (button is now icon-only)
    const existingSwatch = trigger.querySelector(".theme-mini-swatch");
    if (existingSwatch) existingSwatch.remove();
    const existingLabel = trigger.querySelector(".theme-label-text");
    if (existingLabel) existingLabel.remove();

    // Direct click handler: cycle to next theme
    trigger.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      // Immediately release focus so no browser outline/border persists
      trigger.blur();

      // Micro-animation click feedback
      trigger.classList.add("theme-switching");
      setTimeout(() => trigger.classList.remove("theme-switching"), 350);

      cycleToNextTheme();
    });
  }

  /**
   * Sync active theme with localStorage
   */
  function syncFromStorage() {
    try {
      const saved = normalizeThemeId(localStorage.getItem(STORAGE_KEY));
      if (saved && saved !== currentThemeId && THEMES.some(t => t.id === saved)) {
        applyTheme(saved, false);
      }
    } catch (e) {}
  }

  // Cross-tab storage synchronization fallback
  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY && e.newValue) {
      const normalized = normalizeThemeId(e.newValue);
      if (normalized && normalized !== currentThemeId) {
        applyTheme(normalized, false);
      }
    }
  });

  // Re-sync immediately when tab gains focus or becomes visible
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncFromStorage();
    }
  });
  window.addEventListener("focus", syncFromStorage);
  window.addEventListener("pageshow", syncFromStorage);

  // Initialization
  function init() {
    const saved = getSavedTheme();
    applyTheme(saved, false);

    // Setup all theme switcher wrappers in DOM
    document.querySelectorAll(".theme-switcher-wrapper").forEach(setupThemeSwitcher);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public API
  window.PortfolioTheme = {
    themes: THEMES,
    defaultTheme: DEFAULT_THEME,
    getCurrentTheme: () => currentThemeId,
    getCurrentThemeConfig: () => getThemeConfig(currentThemeId),
    setTheme: (id) => applyTheme(id, true),
    cycleTheme: () => cycleToNextTheme(),
    setupSwitcher: setupThemeSwitcher
  };

})(window, document);
