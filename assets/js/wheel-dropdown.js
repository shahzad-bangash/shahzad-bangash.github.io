class WheelAudio {
  constructor() {
    this._ctx = null;
  }
  _init() {
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this._ctx = new AudioCtx();
    }
    if (this._ctx && this._ctx.state === "suspended") {
      this._ctx.resume();
    }
  }
  tick() {
    try {
      this._init();
      if (!this._ctx || this._ctx.state !== "running") return;
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      const now = this._ctx.currentTime;
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.012);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start(now);
      osc.stop(now + 0.012);
    } catch (_) {}
  }
}
const wheelAudio = new WheelAudio();

class TextMeasurer {
  constructor() {
    this._canvas = null;
    this._ctx = null;
  }
  _init() {
    if (!this._ctx) {
      this._canvas = document.createElement("canvas");
      this._ctx = this._canvas.getContext("2d");
    }
  }
  measure(text, font) {
    try {
      this._init();
      if (!this._ctx) return text.length * 12;
      this._ctx.font = font;
      return Math.ceil(this._ctx.measureText(text).width);
    } catch (_) {
      return text.length * 12;
    }
  }
}
const textMeasurer = new TextMeasurer();

const componentStyle = `
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    vertical-align: middle;
    line-height: 1;
    margin: 0 0.15em;
    width: var(--wheel-width, auto);
    min-width: max-content;
    height: calc(var(--wheel-row-height, 48px) * 3);
    --accent: var(--wheel-accent, var(--accent-cyan, #3b82f6));
    --border: var(--wheel-border, var(--border-accent, var(--accent)));
    --muted: var(--wheel-muted, var(--text-secondary, #94a3b8));
    --bg: var(--wheel-bg, var(--bg-card, #1e293b));
    --bg-hover: var(--wheel-bg-hover, var(--bg-card-hover, #26354d));
    --popover-bg: var(--wheel-popover-bg, var(--bg-surface, var(--bg-card, #1e293b)));
    --popover-border: var(--wheel-popover-border, var(--border-medium, #334155));
    --popover-shadow: var(--wheel-popover-shadow, 0 16px 36px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--popover-border));
    --row-height: var(--wheel-row-height, 48px);
    --radius: var(--wheel-radius, 8px);
    --font: var(--wheel-font, 600 clamp(13.5px, calc(var(--row-height) * 0.38), 16px)/1 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--accent);
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([mode="dropdown"]) {
    height: var(--row-height);
    width: auto;
  }

  :host(:not([mode="dropdown"])) {
    display: inline-flex;
    width: var(--wheel-width, 340px);
    max-width: 100%;
    height: calc(var(--row-height) * 3);
  }

  :host([mode="dropdown"][open]) {
    z-index: 100;
  }

  * {
    box-sizing: border-box;
  }

  .trigger {
    display: none;
  }

  :host([mode="dropdown"]) .trigger {
    display: inline-flex;
    min-width: var(--wheel-width, 220px);
    max-width: 100%;
    width: auto;
    height: 100%;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    padding: 0 16px;
    border: 2px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--accent);
    font: var(--font);
    line-height: 1;
    text-align: center;
    cursor: pointer;
    outline: none;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 12%, transparent);
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease, opacity 140ms ease;
    overflow: hidden;
  }

  :host([mode="dropdown"]) .trigger:hover {
    background: var(--bg-hover);
    border-color: var(--border);
    box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 22%, transparent);
  }

  :host([mode="dropdown"]) .trigger:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
  }

  :host([mode="dropdown"][open]) .trigger {
    opacity: 0;
    pointer-events: none;
  }

  .trigger-value-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    height: 1.3em;
    min-width: 0;
    flex: 1 1 auto;
  }

  .trigger-value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    will-change: transform, opacity;
  }

  .chevron {
    position: static;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-left: 2px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-2px) rotate(45deg);
    transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
    opacity: 0.85;
  }

  :host([open]) .chevron {
    transform: translateY(2px) rotate(225deg);
  }

  .popover {
    position: relative;
    width: 100%;
    height: 100%;
  }

  :host(:not([mode="dropdown"])) .popover {
    background: var(--bg);
    border: 1px solid var(--popover-border);
    border-radius: var(--radius);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.16);
    overflow: hidden;
  }

  :host([mode="dropdown"]) .popover {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) scale(0.96);
    height: calc(var(--row-height) * 3.8);
    min-width: max(var(--wheel-width, 220px), 100%);
    width: max-content;
    max-width: min(340px, 90vw);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    background: var(--popover-bg);
    border-radius: calc(var(--radius) + 4px);
    border: 1px solid var(--popover-border);
    box-shadow: var(--popover-shadow);
    transition: opacity 170ms ease, transform 190ms cubic-bezier(0.16, 1, 0.3, 1), visibility 170ms;
    z-index: 50;
  }

  :host([mode="dropdown"][open]) .popover {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
  }

  .stage {
    position: relative;
    width: 100%;
    height: 100%;
    perspective: 520px;
    perspective-origin: 50% 50%;
    overflow: hidden;
    touch-action: none;
    cursor: grab;
    outline: none;
    border-radius: var(--radius);
    mask-image: linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%);
  }

  .stage:active, .stage.is-dragging {
    cursor: grabbing;
  }

  .selection-box {
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    height: var(--row-height);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 16%, transparent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    transition: border-color 150ms ease, box-shadow 150ms ease;
  }

  .stage:focus-visible ~ .selection-box {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent), 0 0 16px color-mix(in srgb, var(--accent) 16%, transparent);
  }

  .cylinder {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .option {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    margin-top: calc(var(--row-height) * -0.5);
    width: 100%;
    height: var(--row-height);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    border: 0;
    margin-inline: 0;
    background: transparent;
    font: var(--font);
    color: var(--muted);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: pointer;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform-origin: center center;
    box-sizing: border-box;
    transition: color 120ms ease, font-weight 120ms ease;
  }

  .option[aria-selected="true"] {
    color: var(--accent);
    font-weight: 600;
  }

  .option:hover {
    color: var(--accent);
  }

  /* Fade inactive top/bottom options when idle (Hero Homepage Wheel) */
  :host([hide-inactive]:not(.is-scrolling)) .option:not([aria-selected="true"]),
  :host(#hero-skills-wheel:not(.is-scrolling)) .option:not([aria-selected="true"]) {
    opacity: 0 !important;
    pointer-events: none;
    transition: opacity 280ms ease;
  }

  :host([hide-inactive].is-scrolling) .option,
  :host(#hero-skills-wheel.is-scrolling) .option {
    transition: none;
  }

  /* Seamless Dynamic Shrinking/Expanding Style (Matches Hero Subtitle Typing Text) */
  :host([hide-inactive]),
  :host(#hero-skills-wheel),
  :host([dynamic-width]) {
    --wheel-bg: transparent;
    --wheel-border: var(--accent, var(--accent-cyan, #38bdf8));
    width: var(--dynamic-width, auto) !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: var(--row-height) !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
  }

  :host([hide-inactive]:not(.is-scrolling)),
  :host(#hero-skills-wheel:not(.is-scrolling)),
  :host([dynamic-width]:not(.is-scrolling)) {
    transition: width 240ms ease;
  }

  :host([hide-inactive].is-scrolling),
  :host(#hero-skills-wheel.is-scrolling),
  :host([dynamic-width].is-scrolling) {
    transition: none !important;
  }

  :host([hide-inactive]) *,
  :host(#hero-skills-wheel) * {
    box-shadow: none !important;
    text-shadow: none !important;
    filter: none !important;
    outline: none !important;
  }

  :host([hide-inactive]) .popover,
  :host(#hero-skills-wheel) .popover {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    height: 100% !important;
    overflow: hidden !important;
  }

  :host([hide-inactive]) .stage,
  :host(#hero-skills-wheel) .stage {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    outline: none !important;
    height: 100% !important;
    overflow: hidden !important;
    mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%) !important;
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%) !important;
  }

  :host([hide-inactive]) .selection-box,
  :host(#hero-skills-wheel) .selection-box {
    background: transparent !important;
    border: none !important;
    border-bottom: 2px solid var(--accent, var(--accent-cyan, #38bdf8)) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    height: var(--row-height) !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    left: 4px;
    right: 4px;
  }

  :host([hide-inactive]) .stage:focus-visible ~ .selection-box,
  :host(#hero-skills-wheel) .stage:focus-visible ~ .selection-box {
    box-shadow: none !important;
    outline: none !important;
  }

  :host([hide-inactive]) .option,
  :host(#hero-skills-wheel) .option {
    font-family: 'Outfit', 'Poppins', sans-serif !important;
    font-weight: 600;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  :host([hide-inactive]) .option[aria-selected="true"],
  :host(#hero-skills-wheel) .option[aria-selected="true"] {
    color: var(--accent, var(--accent-cyan, #38bdf8)) !important;
    font-weight: 600 !important;
    text-shadow: none !important;
  }

  /* Showcase Skills Wheel (About page): borderless outer, button-like inner selection bar, zero glow */
  :host(#showcase-skills-wheel),
  :host([scale-active]) {
    --wheel-font: 600 clamp(14px, 1.2vw, 16px)/1 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* 1. Remove outer border, background, and inset shadow from the popover container */
  :host(#showcase-skills-wheel) .popover,
  :host([scale-active]) .popover {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  :host(#showcase-skills-wheel) .stage,
  :host([scale-active]) .stage {
    position: relative;
    z-index: 1;
    perspective: 580px;
  }

  /* 2. Style the inner selection bar like other buttons (1px solid border, button surface background, clean shadow, zero glow) */
  :host(#showcase-skills-wheel) .selection-box,
  :host([scale-active]) .selection-box {
    left: 0 !important;
    right: 0 !important;
    height: var(--row-height) !important;
    background: var(--bg-surface, var(--wheel-popover-bg, #1e293b)) !important;
    border: 1px solid var(--border-medium, var(--wheel-popover-border, #334155)) !important;
    border-radius: var(--radius-md, var(--radius, 8px)) !important;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)) !important;
    z-index: 0 !important;
    pointer-events: none;
    transition: border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease;
  }

  :host(#showcase-skills-wheel) .stage:hover ~ .selection-box,
  :host([scale-active]) .stage:hover ~ .selection-box {
    background: var(--bg-card-hover, #26354d) !important;
    border-color: var(--accent) !important;
  }

  :host(#showcase-skills-wheel) .stage:focus-visible ~ .selection-box,
  :host([scale-active]) .stage:focus-visible ~ .selection-box {
    box-shadow: 0 0 0 2px var(--accent) !important;
    outline: none !important;
  }

  /* 3. Remove all glows from text; crisp high-contrast active item and clean muted inactive items */
  :host(#showcase-skills-wheel) .option,
  :host([scale-active]) .option {
    font-weight: 500;
    will-change: transform, opacity;
    letter-spacing: -0.01em;
    text-shadow: none !important;
    transition: color 180ms ease, font-weight 180ms ease;
  }

  :host(#showcase-skills-wheel) .option[aria-selected="true"],
  :host([scale-active]) .option[aria-selected="true"] {
    color: var(--accent) !important;
    font-weight: 700 !important;
    text-shadow: none !important;
  }

  :host(#showcase-skills-wheel) .option:not([aria-selected="true"]),
  :host([scale-active]) .option:not([aria-selected="true"]) {
    color: var(--muted) !important;
    font-weight: 450;
    text-shadow: none !important;
  }

  :host(#showcase-skills-wheel) .option:hover:not([aria-selected="true"]),
  :host([scale-active]) .option:hover:not([aria-selected="true"]) {
    color: var(--accent) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .stage, .option, .popover, .trigger, .trigger-value {
      transition-duration: 0.01ms !important;
    }
  }
`;

class WheelDropdown extends HTMLElement {
  static get observedAttributes() {
    return [
      "options",
      "label",
      "value",
      "color",
      "border-color",
      "text-color",
      "width",
      "row-height",
      "radius",
      "mode",
      "loop",
      "sound",
      "auto-scroll",
      "scroll-interval",
      "scroll-duration",
      "hide-inactive",
      "dynamic-width",
      "scale-active"
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._writingValue = false;
    this._batchUpdate = false;
    this._managedStyles = new Map();
    this._currentPos = 0;
    this._animFrame = null;
    this._isDragging = false;
    this._isScrolling = false;
    this._lastTickIndex = null;
    this._typeaheadBuffer = "";
    this._typeaheadTimer = null;
    this._autoScrollTimer = null;
    this._resumeTimer = null;
    this._isPaused = false;
    this._isUserInteracting = false;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onOutsideClick = this._onOutsideClick.bind(this);
    this._stepMomentum = this._stepMomentum.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
  }

  connectedCallback() {
    this._syncStyleAttributes();
    this._setScrolling(false);
    this._render();
    this._updateDynamicWidth(this.value);
    this.addEventListener("mouseenter", this._onMouseEnter);
    this.addEventListener("mouseleave", this._onMouseLeave);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
    window.addEventListener("resize", this._onWindowResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this._updateDynamicWidth(this.value));
    }
    this._startAutoScroll();
  }

  _setScrolling(isScrolling) {
    this._isScrolling = Boolean(isScrolling);
    if (this._isScrolling) {
      this.classList.add("is-scrolling");
    } else {
      this.classList.remove("is-scrolling");
    }
  }

  disconnectedCallback() {
    this._cancelAnimation();
    this._stopAutoScroll();
    this.removeEventListener("mouseenter", this._onMouseEnter);
    this.removeEventListener("mouseleave", this._onMouseLeave);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    document.removeEventListener("pointerdown", this._onOutsideClick);
    window.removeEventListener("resize", this._onWindowResize);
  }

  _onWindowResize() {
    this._updateDynamicWidth(this.value);
  }

  _getActiveFont() {
    const comp = getComputedStyle(this);
    const customFont = comp.getPropertyValue("--wheel-font").trim();
    if (customFont) return customFont;
    const fontSize = comp.fontSize || "1.25rem";
    const fontFamily = comp.fontFamily || "'Outfit', 'Poppins', sans-serif";
    return `600 ${fontSize} ${fontFamily}`;
  }

  _calcSkillWidth(text) {
    if (!text) return 100;
    const font = this._getActiveFont();
    const rawWidth = textMeasurer.measure(text, font);
    // Add 14px horizontal breathing space for underline bounds
    const desired = Math.max(50, rawWidth + 14);
    const winWidth = typeof window !== "undefined" ? window.innerWidth : 360;
    // Cap so it never forces a wrap on narrow mobile screens
    const maxWidth = Math.max(140, winWidth - 140);
    return Math.min(desired, maxWidth);
  }

  _updateDynamicWidth(skillName) {
    if (!this.hasAttribute("hide-inactive") && this.id !== "hero-skills-wheel" && !this.hasAttribute("dynamic-width")) {
      return;
    }
    const targetText = skillName || this.value;
    if (!targetText) return;
    const width = this._calcSkillWidth(targetText);
    this.style.setProperty("--dynamic-width", `${width}px`);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.isConnected || this._batchUpdate || oldValue === newValue) return;

    if (name === "value") {
      if (this._writingValue) return;
      const opts = this.options;
      const idx = opts.indexOf(newValue);
      if (idx >= 0) this._snapTo(idx, 400, false, true);
      this._setTriggerValue(newValue, true);
      return;
    }

    if (name === "mode") {
      if (newValue !== "dropdown") this._setOpen(false);
      this._render();
      return;
    }

    if (name === "loop" || name === "scale-active") {
      this._render3D();
      return;
    }

    if (name === "auto-scroll" || name === "scroll-interval") {
      this._startAutoScroll();
      return;
    }

    if (["color", "border-color", "text-color", "width", "row-height", "radius"].includes(name)) {
      this._syncStyleAttributes();
      this._render3D();
      return;
    }

    this._render();
  }

  get options() {
    return (this.getAttribute("options") || "")
      .split(/[|,]/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  set options(opts) {
    this.setAttribute("options", Array.isArray(opts) ? opts.join("|") : String(opts));
  }

  get value() {
    return this.getAttribute("value") || this.options[0] || "";
  }

  set value(val) {
    const opts = this.options;
    const strVal = String(val);
    const index = opts.indexOf(strVal);
    if (index >= 0) {
      this._snapTo(index, 400, false, true);
      this._setTriggerValue(strVal, true);
    } else {
      this._choose(strVal);
    }
  }

  get loop() {
    return this.hasAttribute("loop") && this.getAttribute("loop") !== "false";
  }

  set loop(val) {
    this.toggleAttribute("loop", Boolean(val));
    this._render3D();
  }

  get autoScroll() {
    return this.hasAttribute("auto-scroll") && this.getAttribute("auto-scroll") !== "false";
  }

  set autoScroll(val) {
    this.toggleAttribute("auto-scroll", Boolean(val));
    this._startAutoScroll();
  }

  get sound() {
    return this.getAttribute("sound") !== "false";
  }

  set sound(val) {
    if (val) this.removeAttribute("sound");
    else this.setAttribute("sound", "false");
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(val) {
    this._setOpen(Boolean(val));
  }

  get hideInactive() {
    return this.hasAttribute("hide-inactive") && this.getAttribute("hide-inactive") !== "false";
  }

  set hideInactive(val) {
    this.toggleAttribute("hide-inactive", Boolean(val));
  }

  get dynamicWidth() {
    return this.hasAttribute("dynamic-width") && this.getAttribute("dynamic-width") !== "false";
  }

  set dynamicWidth(val) {
    this.toggleAttribute("dynamic-width", Boolean(val));
    this._updateDynamicWidth(this.value);
  }

  get scaleActive() {
    return this.hasAttribute("scale-active") && this.getAttribute("scale-active") !== "false";
  }

  set scaleActive(val) {
    this.toggleAttribute("scale-active", Boolean(val));
    this._render3D();
  }

  _startAutoScroll() {
    this._stopAutoScroll();
    if (!this.autoScroll) return;

    const interval = parseFloat(this.getAttribute("scroll-interval")) || 2600;
    this._autoScrollTimer = setInterval(() => {
      if (this._isPaused || this._isUserInteracting || this.hasAttribute("open") || this._isDragging || document.hidden || (!this.offsetParent && this.getBoundingClientRect().width === 0)) {
        return;
      }
      this._advanceAutoScroll();
    }, interval);
  }

  _stopAutoScroll() {
    if (this._autoScrollTimer) {
      clearInterval(this._autoScrollTimer);
      this._autoScrollTimer = null;
    }
    if (this._resumeTimer) {
      clearTimeout(this._resumeTimer);
      this._resumeTimer = null;
    }
  }

  _pauseAutoScroll() {
    this._isPaused = true;
    if (this._resumeTimer) {
      clearTimeout(this._resumeTimer);
      this._resumeTimer = null;
    }
  }

  _resumeAutoScroll(delay = 2000) {
    if (this._resumeTimer) clearTimeout(this._resumeTimer);
    this._resumeTimer = setTimeout(() => {
      this._isPaused = false;
      this._isUserInteracting = false;
    }, delay);
  }

  _advanceAutoScroll() {
    const options = this.options;
    const count = options.length;
    if (count <= 1) return;

    const duration = parseFloat(this.getAttribute("scroll-duration")) || 650;
    let nextIndex = Math.round(this._currentPos) + 1;
    if (this.loop) {
      nextIndex = ((nextIndex % count) + count) % count;
    } else {
      if (nextIndex >= count) nextIndex = 0;
    }

    this._snapTo(nextIndex, duration, false, true);
  }

  _onMouseEnter() {
    this._pauseAutoScroll();
  }

  _onMouseLeave() {
    if (!this.hasAttribute("open") && !this._isDragging) {
      this._resumeAutoScroll(1800);
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this._pauseAutoScroll();
    } else {
      this._resumeAutoScroll(1000);
    }
  }

  _setTriggerValue(value, smooth = true) {
    const triggerValue = this.shadowRoot?.querySelector(".trigger-value");
    if (!triggerValue) return;

    if (!smooth || triggerValue.textContent === value) {
      triggerValue.textContent = value;
      return;
    }

    triggerValue.style.transition = "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms ease";
    triggerValue.style.transform = "translateY(-10px)";
    triggerValue.style.opacity = "0";

    setTimeout(() => {
      triggerValue.textContent = value;
      triggerValue.style.transition = "none";
      triggerValue.style.transform = "translateY(10px)";
      triggerValue.style.opacity = "0";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          triggerValue.style.transition = "transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease";
          triggerValue.style.transform = "translateY(0)";
          triggerValue.style.opacity = "1";
        });
      });
    }, 200);
  }

  configure({ options, value, label, color, borderColor, textColor, width, rowHeight, radius, mode, loop, sound, autoScroll, scrollInterval, scrollDuration } = {}) {
    this._batchUpdate = true;
    const attrs = {
      options: Array.isArray(options) ? options.join("|") : options,
      value,
      label,
      color,
      "border-color": borderColor,
      "text-color": textColor,
      width,
      "row-height": rowHeight,
      radius,
      mode,
      loop: loop !== undefined ? (loop ? "" : null) : undefined,
      sound: sound !== undefined ? (sound ? "" : "false") : undefined,
      "auto-scroll": autoScroll !== undefined ? (autoScroll ? "" : null) : undefined,
      "scroll-interval": scrollInterval,
      "scroll-duration": scrollDuration,
    };
    for (const [name, val] of Object.entries(attrs)) {
      if (val === null) this.removeAttribute(name);
      else if (val !== undefined) this.setAttribute(name, String(val));
    }
    this._batchUpdate = false;
    this._syncStyleAttributes();
    this._render();
    this._startAutoScroll();
  }

  _syncStyleAttributes() {
    const styles = {
      color: "--wheel-accent",
      "border-color": "--wheel-border",
      "text-color": "--wheel-muted",
      width: "--wheel-width",
      "row-height": "--wheel-row-height",
      radius: "--wheel-radius",
    };
    for (const [attr, prop] of Object.entries(styles)) {
      const val = this.getAttribute(attr);
      if (val === null) {
        const prev = this._managedStyles.get(prop);
        if (prev) {
          if (prev.value) this.style.setProperty(prop, prev.value, prev.priority);
          else this.style.removeProperty(prop);
          this._managedStyles.delete(prop);
        }
      } else {
        const normalized = ["width", "row-height", "radius"].includes(attr) && /^\d+(\.\d+)?$/.test(val.trim())
          ? `${val.trim()}px`
          : val.trim();
        if (!this._managedStyles.has(prop)) {
          this._managedStyles.set(prop, {
            value: this.style.getPropertyValue(prop),
            priority: this.style.getPropertyPriority(prop),
          });
        }
        this.style.setProperty(prop, normalized);
      }
    }
  }

  _rowHeight() {
    return parseFloat(getComputedStyle(this).getPropertyValue("--wheel-row-height")) || 48;
  }

  _escape(val) {
    return String(val).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  _render() {
    const options = this.options;
    if (!options.length) return;
    this._cancelAnimation();

    let selectedIndex = options.indexOf(this.value);
    if (selectedIndex < 0) {
      selectedIndex = 0;
      this._writeValue(options[0]);
    }
    this._currentPos = selectedIndex;
    this._lastTickIndex = selectedIndex;

    const label = this._escape(this.getAttribute("label") || "Choose a skill");
    const isOpen = this.hasAttribute("open");

    this.shadowRoot.innerHTML = `
      <style>${componentStyle}</style>
      <button class="trigger" type="button" aria-haspopup="listbox" aria-expanded="${isOpen}">
        <span class="trigger-value-wrapper">
          <span class="trigger-value">${this._escape(this.value)}</span>
        </span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      <div class="popover">
        <div class="stage" role="listbox" tabindex="0" aria-label="${label}">
          <div class="cylinder">
            ${options.map((opt, i) => `
              <button class="option" type="button" role="option" tabindex="-1"
                aria-selected="${i === selectedIndex}" data-index="${i}" data-value="${this._escape(opt)}">
                ${this._escape(opt)}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="selection-box" aria-hidden="true"></div>
      </div>
    `;

    this._trigger = this.shadowRoot.querySelector(".trigger");
    this._stage = this.shadowRoot.querySelector(".stage");
    this._cylinder = this.shadowRoot.querySelector(".cylinder");
    this._optionElements = Array.from(this.shadowRoot.querySelectorAll(".option"));

    this._trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this._setOpen(!this.hasAttribute("open"));
    });

    this._stage.addEventListener("pointerdown", this._onPointerDown);
    this._stage.addEventListener("pointermove", this._onPointerMove);
    this._stage.addEventListener("pointerup", this._onPointerUp);
    this._stage.addEventListener("pointercancel", this._onPointerCancel);
    this._stage.addEventListener("wheel", this._onWheel, { passive: false });
    this._stage.addEventListener("keydown", this._onKeyDown);
    this._stage.addEventListener("click", (e) => {
      const opt = e.target.closest(".option");
      if (!opt) return;
      const index = Number(opt.dataset.index);
      this._snapTo(index, 240, true);
    });

    this._updateDynamicWidth(this.value);
    this._render3D();
  }

  _render3D() {
    if (!this._cylinder || !this._optionElements) return;
    const options = this.options;
    const count = options.length;
    if (count === 0) return;

    const rowHeight = this._rowHeight();
    const isLoop = this.loop && count > 2;
    const degPerStep = 24;
    const R = rowHeight / Math.tan((degPerStep * Math.PI) / 180);
    const pos = this._currentPos;

    // Trigger audio click on row transition when open or user scrolling
    const roundedIndex = ((Math.round(pos) % count) + count) % count;
    if (this._lastTickIndex !== null && roundedIndex !== this._lastTickIndex) {
      if (this.sound && (this._isDragging || this.hasAttribute("open"))) {
        wheelAudio.tick();
      }
      this._lastTickIndex = roundedIndex;
    }

    for (let i = 0; i < count; i++) {
      const el = this._optionElements[i];
      let delta = i - pos;

      if (isLoop) {
        delta = ((delta % count) + count) % count;
        if (delta > count / 2) delta -= count;
      }

      const absDelta = Math.abs(delta);
      const isHeroWheel = this.hideInactive || this.id === "hero-skills-wheel";
      const isAboutWheel = this.id === "showcase-skills-wheel" ||
                           this.hasAttribute("scale-active") ||
                           Boolean(this.closest && this.closest("#about, .skillset-card, .skillset-wheel-wrapper"));
      const maxDelta = isHeroWheel ? 1.05 : 2.8;

      if (absDelta > maxDelta) {
        el.style.display = "none";
        continue;
      }

      el.style.display = "flex";
      const theta = delta * degPerStep;
      const alpha = (theta * Math.PI) / 180;
      const y = R * Math.sin(alpha);
      let z = R * (Math.cos(alpha) - 1);

      let scale;
      let opacity;

      if (isHeroWheel) {
        scale = Math.max(0.75, 1 - 0.1 * (1 - Math.cos(alpha)));
        if (absDelta < 0.25) {
          opacity = 1 - absDelta * 0.35;
        } else if (absDelta <= 0.48) {
          // Smoothly fade out the non-active option to 0 by delta 0.48
          const fadeProgress = (absDelta - 0.25) / (0.48 - 0.25);
          opacity = Math.max(0, 0.22 * (1 - fadeProgress));
        } else {
          // Strictly 0 opacity beyond halfway so old word never lingers while width shifts
          opacity = 0;
        }
      } else if (isAboutWheel) {
        // Smooth scaling transition for About page wheel:
        // As an option moves into the middle (active) position (absDelta -> 0),
        // it expands to a larger, prominent size (scale ~1.28) and full opacity.
        // As it moves out (absDelta -> 1 and beyond), it smoothly shrinks to a smaller size
        // (scale ~0.78 down to ~0.65) with softer opacity.
        if (absDelta <= 1) {
          const p = 1 - absDelta;
          const t = p * p * (3 - 2 * p); // smooth cubic ease-in-out
          scale = 0.78 + (1.28 - 0.78) * t;
          opacity = 0.36 + (1.0 - 0.36) * t;
          z += 10 * t; // subtle forward 3D step towards user
        } else {
          const p = Math.min(1, (absDelta - 1) / 1.5);
          const t = p * p * (3 - 2 * p);
          scale = 0.78 - (0.78 - 0.65) * t;
          opacity = Math.max(0.08, 0.36 - (0.36 - 0.12) * t);
        }
        el.style.zIndex = String(Math.round((10 - absDelta) * 10));
      } else {
        scale = Math.max(0.75, 1 - 0.1 * (1 - Math.cos(alpha)));
        opacity = Math.max(0.2, Math.pow(Math.max(0, Math.cos(alpha)), 1.3));
      }

      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${(-theta).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(3);

      const isSelected = absDelta < 0.5;
      if (el.getAttribute("aria-selected") !== String(isSelected)) {
        el.setAttribute("aria-selected", String(isSelected));
      }
    }
  }

  _onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    this._pauseAutoScroll();
    this._isUserInteracting = true;
    this._cancelAnimation();
    this._isDragging = true;
    this._setScrolling(true);
    this._stage.classList.add("is-dragging");
    this._pointerId = e.pointerId;
    try {
      this._stage.setPointerCapture(e.pointerId);
    } catch (_) {}

    this._startY = e.clientY;
    this._startPos = this._currentPos;
    this._startTime = performance.now();
    this._lastY = e.clientY;
    this._lastTime = this._startTime;
    this._velocityY = 0;
    this._hasMoved = false;
  }

  _onPointerMove(e) {
    if (!this._isDragging || e.pointerId !== this._pointerId) return;
    const now = performance.now();
    const dyTotal = e.clientY - this._startY;
    if (Math.abs(dyTotal) > 4) {
      this._hasMoved = true;
    }

    const rowHeight = this._rowHeight();
    const count = this.options.length;
    let newPos = this._startPos - dyTotal / rowHeight;

    if (!this.loop) {
      if (newPos < 0) newPos = newPos * 0.3;
      else if (newPos > count - 1) newPos = count - 1 + (newPos - (count - 1)) * 0.3;
    }

    this._currentPos = newPos;

    const dt = now - this._lastTime;
    if (dt > 10) {
      this._velocityY = (e.clientY - this._lastY) / dt;
      this._lastY = e.clientY;
      this._lastTime = now;
    }

    this._render3D();
  }

  _onPointerUp(e) {
    if (!this._isDragging || e.pointerId !== this._pointerId) return;
    this._isDragging = false;
    this._stage.classList.remove("is-dragging");
    try {
      this._stage.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (!this._hasMoved) {
      const opt = e.target.closest(".option");
      if (opt) {
        const index = Number(opt.dataset.index);
        this._snapTo(index, 250, true);
        return;
      }
    }

    this._startMomentum();
  }

  _onPointerCancel(e) {
    if (!this._isDragging || e.pointerId !== this._pointerId) return;
    this._isDragging = false;
    this._stage.classList.remove("is-dragging");
    try {
      this._stage.releasePointerCapture(e.pointerId);
    } catch (_) {}
    this._snapTo(Math.round(this._currentPos));
  }

  _startMomentum() {
    this._setScrolling(true);
    const rowHeight = this._rowHeight();
    let velocityPos = -this._velocityY / rowHeight; // rows per ms

    if (Math.abs(velocityPos) < 0.002) {
      this._snapTo(Math.round(this._currentPos));
      return;
    }

    velocityPos = Math.max(-0.06, Math.min(0.06, velocityPos));
    this._momVelocity = velocityPos;
    this._momLastTime = performance.now();
    this._animFrame = requestAnimationFrame(this._stepMomentum);
  }

  _stepMomentum(now) {
    const dt = Math.min(32, now - this._momLastTime);
    this._momLastTime = now;

    this._currentPos += this._momVelocity * dt;
    this._momVelocity *= Math.pow(0.92, dt / 16);

    const count = this.options.length;
    if (!this.loop) {
      if (this._currentPos < 0) {
        this._currentPos *= 0.85;
        this._momVelocity *= 0.5;
      } else if (this._currentPos > count - 1) {
        this._currentPos = count - 1 + (this._currentPos - (count - 1)) * 0.85;
        this._momVelocity *= 0.5;
      }
    }

    this._render3D();

    if (Math.abs(this._momVelocity) > 0.0006) {
      this._animFrame = requestAnimationFrame(this._stepMomentum);
    } else {
      this._snapTo(Math.round(this._currentPos));
    }
  }

  _onWheel(e) {
    e.preventDefault();
    this._pauseAutoScroll();
    this._cancelAnimation();
    this._setScrolling(true);
    const rowHeight = this._rowHeight();
    const delta = e.deltaY;
    const count = this.options.length;

    let step = delta / (rowHeight * 1.5);
    step = Math.max(-1.5, Math.min(1.5, step));

    let next = this._currentPos + step;
    if (!this.loop) {
      next = Math.max(-0.3, Math.min(count - 0.7, next));
    }
    this._currentPos = next;
    this._render3D();

    clearTimeout(this._wheelSnapTimer);
    this._wheelSnapTimer = setTimeout(() => {
      this._snapTo(Math.round(this._currentPos));
      this._resumeAutoScroll(3000);
    }, 120);
  }

  _snapTo(targetIndex, duration = 260, fromDirectClick = false, isAuto = false) {
    this._cancelAnimation();
    const count = this.options.length;
    if (count === 0) return;

    let target = targetIndex;
    if (this.loop) {
      target = ((target % count) + count) % count;
      let currentMod = ((this._currentPos % count) + count) % count;
      let diff = target - currentMod;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      target = this._currentPos + diff;
    } else {
      target = Math.max(0, Math.min(count - 1, target));
    }

    const start = this._currentPos;
    const distance = target - start;

    const normalizedTarget = ((target % count) + count) % count;
    const nextSkill = this.options[normalizedTarget];

    const isDynamic = this.hasAttribute("hide-inactive") || this.id === "hero-skills-wheel" || this.hasAttribute("dynamic-width");
    const normalizedStart = ((Math.round(start) % count) + count) % count;
    const currentSkill = this.options[normalizedStart];
    const currentDynamicStr = this.style.getPropertyValue("--dynamic-width");
    const currentParsedWidth = parseFloat(currentDynamicStr);
    const startWidth = isDynamic ? (currentParsedWidth > 0 ? currentParsedWidth : this._calcSkillWidth(currentSkill)) : 0;
    const targetWidth = isDynamic ? this._calcSkillWidth(nextSkill) : 0;

    if (isAuto && this.getAttribute("mode") === "dropdown" && !this.hasAttribute("open")) {
      this._setTriggerValue(nextSkill, true);
    }

    if (Math.abs(distance) < 0.005) {
      this._currentPos = target;
      if (isDynamic) this._updateDynamicWidth(nextSkill);
      this._render3D();
      this._settle(fromDirectClick, isAuto);
      return;
    }

    this._setScrolling(true);
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Smooth cubic ease-in-out for silky graceful reel transition
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      this._currentPos = start + distance * eased;

      if (isDynamic && Math.abs(startWidth - targetWidth) > 0.5) {
        let wProgress = 0;
        if (targetWidth < startWidth) {
          // SHRINKING: Hold full startWidth while the old word is visible.
          // Old word rotates out and reaches 0 opacity by delta 0.48.
          // Hold full startWidth until progress = 0.50 so the line NEVER reduces
          // while the previous word is there. Then smoothly shrink down to targetWidth.
          if (progress <= 0.50) {
            wProgress = 0;
          } else {
            const p = (progress - 0.50) / 0.50;
            // Smooth cubic ease-out
            wProgress = 1 - Math.pow(1 - p, 3);
          }
        } else {
          // EXPANDING: Hold startWidth briefly, then smoothly expand so incoming
          // word has full space before completing rotation.
          if (progress <= 0.15) {
            wProgress = 0;
          } else if (progress >= 0.85) {
            wProgress = 1;
          } else {
            const p = (progress - 0.15) / 0.70;
            wProgress = p * p * (3 - 2 * p);
          }
        }
        const currentWidth = startWidth + (targetWidth - startWidth) * wProgress;
        this.style.setProperty("--dynamic-width", `${currentWidth.toFixed(1)}px`);
      }

      this._render3D();

      if (progress < 1) {
        this._animFrame = requestAnimationFrame(tick);
      } else {
        this._currentPos = target;
        if (this.loop) this._currentPos = ((target % count) + count) % count;
        if (isDynamic) this._updateDynamicWidth(nextSkill);
        this._render3D();
        this._animFrame = null;
        this._settle(fromDirectClick, isAuto);
      }
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  _cancelAnimation() {
    if (this._animFrame !== null) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  _settle(fromDirectClick = false, isAuto = false) {
    const options = this.options;
    const count = options.length;
    if (count === 0) return;

    let index = Math.round(this._currentPos);
    index = ((index % count) + count) % count;
    this._currentPos = index;
    this._render3D();
    this._setScrolling(false);

    const selectedValue = options[index];
    this._choose(selectedValue, isAuto);

    if (this.getAttribute("mode") === "dropdown" && this.hasAttribute("open") && !isAuto) {
      const delay = fromDirectClick ? 140 : 250;
      setTimeout(() => {
        if (this.hasAttribute("open")) this._setOpen(false, true);
      }, delay);
    }
  }

  _choose(value, isAuto = false) {
    if (!this.options.includes(value)) return;
    this._updateDynamicWidth(value);
    const changed = this.value !== value;
    this._writeValue(value);

    this._setTriggerValue(value, isAuto);

    if (changed) {
      this.dispatchEvent(new CustomEvent("change", { detail: { value, isAuto }, bubbles: true, composed: true }));
      this.dispatchEvent(new CustomEvent("input", { detail: { value, isAuto }, bubbles: true, composed: true }));
    }
  }

  _writeValue(value) {
    this._writingValue = true;
    this.setAttribute("value", value);
    this._writingValue = false;
  }

  _setOpen(open, restoreFocus = false) {
    if (!this._trigger || (open && this.getAttribute("mode") !== "dropdown")) return;
    this.toggleAttribute("open", open);
    this._trigger.setAttribute("aria-expanded", String(open));

    if (open) {
      this._pauseAutoScroll();
      this._isUserInteracting = true;
      const selectedIndex = Math.max(0, this.options.indexOf(this.value));
      this._currentPos = selectedIndex;
      this._render3D();
      this._stage?.focus({ preventScroll: true });
      setTimeout(() => {
        document.addEventListener("pointerdown", this._onOutsideClick);
      }, 10);
    } else {
      document.removeEventListener("pointerdown", this._onOutsideClick);
      if (restoreFocus) this._trigger.focus({ preventScroll: true });
      this._resumeAutoScroll(2000);
    }
  }

  _onOutsideClick(event) {
    if (!event.composedPath().includes(this)) {
      this._setOpen(false);
    }
  }

  _onKeyDown(e) {
    const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Enter", " ", "Escape"];
    const count = this.options.length;
    if (count === 0) return;

    this._pauseAutoScroll();

    if (e.key === "Escape" && this.hasAttribute("open")) {
      e.preventDefault();
      this._setOpen(false, true);
      return;
    }

    if ((e.key === "Enter" || e.key === " ") && this.getAttribute("mode") === "dropdown") {
      e.preventDefault();
      if (this.hasAttribute("open")) {
        this._settle(true);
      } else {
        this._setOpen(true);
      }
      return;
    }

    if (keys.includes(e.key)) {
      e.preventDefault();
      let currentIndex = Math.round(this._currentPos);
      currentIndex = ((currentIndex % count) + count) % count;

      if (e.key === "ArrowDown") this._snapTo(this.loop ? currentIndex + 1 : Math.min(count - 1, currentIndex + 1));
      else if (e.key === "ArrowUp") this._snapTo(this.loop ? currentIndex - 1 : Math.max(0, currentIndex - 1));
      else if (e.key === "PageDown") this._snapTo(this.loop ? currentIndex + 3 : Math.min(count - 1, currentIndex + 3));
      else if (e.key === "PageUp") this._snapTo(this.loop ? currentIndex - 3 : Math.max(0, currentIndex - 3));
      else if (e.key === "Home") this._snapTo(0);
      else if (e.key === "End") this._snapTo(count - 1);
      return;
    }

    // Typeahead search
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      clearTimeout(this._typeaheadBufferTimer);
      this._typeaheadBuffer += e.key.toLowerCase();
      this._typeaheadBufferTimer = setTimeout(() => {
        this._typeaheadBuffer = "";
      }, 700);

      const match = this.options.findIndex(opt => opt.toLowerCase().startsWith(this._typeaheadBuffer));
      if (match >= 0) {
        this._snapTo(match, 200);
      }
    }
  }
}

if (!customElements.get("wheel-dropdown")) {
  customElements.define("wheel-dropdown", WheelDropdown);
}
