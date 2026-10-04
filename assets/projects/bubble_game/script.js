/**
 * BUBBLE POP ARCADE - MODERN SUITE
 * High-performance reflex game with dynamic particle canvas, Web Audio API
 * synthesizer for distinct sound effects, dynamic multiplier timeout bar,
 * compact non-scrolling UI, and aesthetic matching Shahzad Bangash's portfolio.
 */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     1. State Variables
     -------------------------------------------------------------------------- */
  let ranHit = 0;
  let score = 0;
  let timer = 60;
  let timerInterval = null;
  let isGameActive = false;
  let soundMuted = false;

  let currentStreak = 0;
  let maxStreak = 0;
  let totalHits = 0;
  let correctHits = 0;

  // Multiplier Combo Timeout Bar State
  let comboTimeRemaining = 0;
  let comboInterval = null;

  let highScore = 0;
  try {
    const saved = localStorage.getItem("bubble_game_high_score");
    if (saved) highScore = parseInt(saved, 10) || 0;
  } catch (e) {
    console.warn("Storage unavailable", e);
  }

  // Sound preference
  try {
    const savedSound = localStorage.getItem("bubble_game_sound_muted");
    if (savedSound !== null) soundMuted = savedSound === "true";
  } catch (e) {}

  /* --------------------------------------------------------------------------
     2. DOM Elements
     -------------------------------------------------------------------------- */
  const hitValElem = document.getElementById("hitVal");
  const timerValElem = document.getElementById("timerVal");
  const scoreValElem = document.getElementById("scoreVal");
  const highScoreValElem = document.getElementById("highScoreVal");
  const bubbleGridElem = document.getElementById("bubbleGrid");

  const startScreen = document.getElementById("startScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const startBtn = document.getElementById("startBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");
  const resetScoreBtn = document.getElementById("resetScoreBtn");

  const finalScoreValElem = document.getElementById("finalScoreVal");
  const maxStreakValElem = document.getElementById("maxStreakVal");
  const accuracyValElem = document.getElementById("accuracyVal");
  const newHighScoreBanner = document.getElementById("newHighScoreBanner");

  const multiplierShowcase = document.getElementById("multiplierShowcase");
  const streakIndicator = document.getElementById("streakIndicator");
  const streakCountElem = document.getElementById("streakCount");
  const multiplierStatusElem = document.getElementById("multiplierStatus");
  const multiplierCountdownElem = document.getElementById("multiplierCountdown");
  const comboTimerTrack = document.getElementById("comboTimerTrack");
  const comboTimerFill = document.getElementById("comboTimerFill");

  const soundToggleBtn = document.getElementById("soundToggleBtn");
  const soundIcon = document.getElementById("soundIcon");
  const restartBtn = document.getElementById("restartBtn");

  /* --------------------------------------------------------------------------
     3. Web Audio API Synthesizer (Instant, Responsive Arcade Audio)
     -------------------------------------------------------------------------- */
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay = 0, gainVal = 0.15) {
    if (soundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  // Crisp high-velocity pop effect that pitches up as streak stacks
  function playPopSound(streak = 1) {
    if (soundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const baseFreq = Math.min(880, 480 + (streak * 45));
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.09);

      if (streak >= 3) {
        playTone(baseFreq * 2.5, "triangle", 0.12, 0.03, 0.1);
      }
    } catch (e) {}
  }

  // Low downward thud for wrong hits
  function playWrongSound() {
    if (soundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // Triumphant game-over musical fanfare
  function playGameOverFanfare(isHigh = false) {
    if (soundMuted) return;
    if (isHigh) {
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chord.forEach((note, idx) => {
        playTone(note, "triangle", 0.35, idx * 0.1, 0.22);
      });
    } else {
      const chord = [440, 554.37, 659.25];
      chord.forEach((note, idx) => {
        playTone(note, "sine", 0.3, idx * 0.09, 0.18);
      });
    }
  }

  function updateSoundUI() {
    if (soundMuted) {
      soundToggleBtn.classList.add("muted");
      soundIcon.className = "bx bx-volume-mute";
    } else {
      soundToggleBtn.classList.remove("muted");
      soundIcon.className = "bx bx-volume-full";
    }
  }

  soundToggleBtn.addEventListener("click", () => {
    soundMuted = !soundMuted;
    try {
      localStorage.setItem("bubble_game_sound_muted", soundMuted);
    } catch (e) {}
    updateSoundUI();
  });

  /* --------------------------------------------------------------------------
     4. Modern Curated Color Palettes (Rich HSL Gradients)
     -------------------------------------------------------------------------- */
  const modernBubbleHues = [
    { bg: "linear-gradient(135deg, #06b6d4, #2563eb)", glow: "rgba(6, 182, 212, 0.4)" },
    { bg: "linear-gradient(135deg, #3b82f6, #6366f1)", glow: "rgba(59, 130, 246, 0.4)" },
    { bg: "linear-gradient(135deg, #8b5cf6, #d946ef)", glow: "rgba(139, 92, 246, 0.4)" },
    { bg: "linear-gradient(135deg, #ec4899, #f43f5e)", glow: "rgba(236, 72, 153, 0.4)" },
    { bg: "linear-gradient(135deg, #10b981, #059669)", glow: "rgba(16, 185, 129, 0.4)" },
    { bg: "linear-gradient(135deg, #f59e0b, #ea580c)", glow: "rgba(245, 158, 11, 0.4)" },
    { bg: "linear-gradient(135deg, #14b8a6, #0284c7)", glow: "rgba(20, 184, 166, 0.4)" }
  ];

  let currentPaletteIndex = 0;

  /* --------------------------------------------------------------------------
     5. Game Logic & Generation
     -------------------------------------------------------------------------- */
  function calculateBubbleCount() {
    if (bubbleGridElem && bubbleGridElem.clientWidth > 100 && bubbleGridElem.clientHeight > 100) {
      const bubbleStep = window.innerWidth <= 640 ? 48 : (window.innerWidth <= 980 ? 56 : 62);
      const cols = Math.floor((bubbleGridElem.clientWidth - 20) / bubbleStep);
      const rows = Math.floor((bubbleGridElem.clientHeight - 20) / bubbleStep);
      const total = cols * rows;
      if (total >= 40) {
        return Math.min(220, Math.max(70, total));
      }
    }
    const width = window.innerWidth;
    if (width < 480) return 80;
    if (width < 768) return 108;
    if (width < 1100) return 150;
    return 180;
  }

  function makeBubbles() {
    currentPaletteIndex = (currentPaletteIndex + 1) % modernBubbleHues.length;
    const currentTheme = modernBubbleHues[currentPaletteIndex];

    // Synchronize the hit target bubble with the EXACT same color gradient and glow as playfield bubbles
    if (hitValElem) {
      hitValElem.style.background = currentTheme.bg;
      hitValElem.style.boxShadow = `0 4px 14px rgba(0, 0, 0, 0.4), 0 0 20px ${currentTheme.glow}, inset 0 -3px 6px rgba(0, 0, 0, 0.35), inset 0 3px 6px rgba(255, 255, 255, 0.4)`;
    }

    const count = calculateBubbleCount();
    let fragment = "";
    
    // Ensure target number appears reliably across the grid
    const guaranteedCount = Math.max(4, Math.min(8, Math.floor(count / 24)));
    const guaranteedPositions = new Set();
    while (guaranteedPositions.size < guaranteedCount) {
      guaranteedPositions.add(Math.floor(Math.random() * count));
    }

    for (let i = 0; i < count; i++) {
      let num;
      if (guaranteedPositions.has(i)) {
        num = ranHit;
      } else {
        num = Math.ceil(Math.random() * 10);
      }
      fragment += `<div class="bubble" data-value="${num}" style="background: ${currentTheme.bg}; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35), 0 0 10px ${currentTheme.glow}, inset 0 -3px 6px rgba(0, 0, 0, 0.35), inset 0 3px 6px rgba(255, 255, 255, 0.4);">${num}</div>`;
    }

    bubbleGridElem.innerHTML = fragment;
  }

  function generateNewHit() {
    ranHit = Math.ceil(Math.random() * 10);
    hitValElem.textContent = ranHit;
  }

  function updateScoreDisplay() {
    scoreValElem.textContent = score;
    highScoreValElem.textContent = highScore;
  }

  /* --------------------------------------------------------------------------
     6. Multiplier Combo Timeout Bar Logic (3.0s window with live countdown)
     -------------------------------------------------------------------------- */
  const COMBO_TIMEOUT_MS = 3000;

  function resetMultiplierUI() {
    clearInterval(comboInterval);
    currentStreak = 0;
    if (multiplierShowcase) {
      multiplierShowcase.classList.remove("active", "urgent");
    }
    if (streakCountElem) {
      streakCountElem.textContent = "1x";
    }
    if (multiplierStatusElem) {
      multiplierStatusElem.textContent = "CHAIN COMBO";
    }
    if (multiplierCountdownElem) {
      multiplierCountdownElem.textContent = "3.0s";
    }
    if (comboTimerFill) {
      comboTimerFill.style.width = "0%";
    }
  }

  function startComboTimeout() {
    clearInterval(comboInterval);
    comboTimeRemaining = COMBO_TIMEOUT_MS;

    if (comboTimerFill) {
      comboTimerFill.style.width = "100%";
      comboTimerFill.style.opacity = "1";
    }
    if (multiplierCountdownElem) {
      multiplierCountdownElem.textContent = "3.0s";
    }

    const intervalStep = 30; // ~33fps update for silky smooth drain
    comboInterval = setInterval(() => {
      if (!isGameActive) {
        clearInterval(comboInterval);
        return;
      }

      comboTimeRemaining -= intervalStep;
      const pct = Math.max(0, (comboTimeRemaining / COMBO_TIMEOUT_MS) * 100);
      if (comboTimerFill) {
        comboTimerFill.style.width = `${pct}%`;
      }
      if (multiplierCountdownElem) {
        multiplierCountdownElem.textContent = `${Math.max(0, comboTimeRemaining / 1000).toFixed(1)}s`;
      }

      // Live "Running Out" urgency showcase when less than 1.0s remains
      if (comboTimeRemaining < 1000 && comboTimeRemaining > 0) {
        if (multiplierShowcase) multiplierShowcase.classList.add("urgent");
        if (multiplierStatusElem) multiplierStatusElem.textContent = "⚠️ RUNNING OUT!";
      }

      if (comboTimeRemaining <= 0) {
        clearInterval(comboInterval);
        expireCombo();
      }
    }, intervalStep);
  }

  function expireCombo() {
    clearInterval(comboInterval);
    currentStreak = 0;
    if (multiplierShowcase) {
      multiplierShowcase.classList.remove("active", "urgent");
    }
    if (streakCountElem) streakCountElem.textContent = "1x";
    if (comboTimerFill) comboTimerFill.style.width = "0%";
    if (multiplierCountdownElem) multiplierCountdownElem.textContent = "0.0s";
    if (multiplierStatusElem) {
      multiplierStatusElem.textContent = "COMBO EXPIRED";
      setTimeout(() => {
        if (currentStreak === 0 && multiplierStatusElem) {
          multiplierStatusElem.textContent = "CHAIN COMBO";
        }
      }, 900);
    }
  }

  function triggerStreakIndicator(streak) {
    if (multiplierShowcase) {
      multiplierShowcase.classList.add("active");
      multiplierShowcase.classList.remove("urgent");
    }

    if (streak >= 2) {
      if (streakCountElem) streakCountElem.textContent = `${streak}x`;
      if (multiplierStatusElem) multiplierStatusElem.textContent = `🔥 ${streak}x STREAK ACTIVE!`;
    } else {
      // 1st hit: chain initiated!
      if (streakCountElem) streakCountElem.textContent = "1x";
      if (multiplierStatusElem) multiplierStatusElem.textContent = "COMBO STARTED • POP NEXT!";
    }

    startComboTimeout();
  }

  function onCorrectHit(bubbleEl) {
    totalHits++;
    correctHits++;
    currentStreak++;
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    // Bonus points for streaks
    const streakBonus = currentStreak >= 5 ? 25 : currentStreak >= 3 ? 15 : 10;
    score += streakBonus;

    let isNewHigh = false;
    if (score > highScore) {
      highScore = score;
      isNewHigh = true;
      try {
        localStorage.setItem("bubble_game_high_score", highScore);
      } catch (e) {}
    }

    updateScoreDisplay();
    triggerStreakIndicator(currentStreak);

    // Audio: Distinct pitch-scaled pop synthesizer
    playPopSound(currentStreak);

    // Visual animation on clicked bubble
    bubbleEl.classList.add("popping");

    // Immediate reaction + refresh board smoothly
    setTimeout(() => {
      generateNewHit();
      makeBubbles();
    }, 110);
  }

  function onWrongHit(bubbleEl) {
    totalHits++;
    expireCombo();

    // Minor penalty
    score = Math.max(0, score - 5);
    updateScoreDisplay();

    bubbleEl.classList.add("wrong-hit");
    playWrongSound();

    setTimeout(() => {
      bubbleEl.classList.remove("wrong-hit");
    }, 380);
  }

  // Delegated click handler on the grid
  bubbleGridElem.addEventListener("click", (e) => {
    if (!isGameActive) return;

    const bubbleEl = e.target.closest(".bubble");
    if (!bubbleEl || bubbleEl.classList.contains("popping")) return;

    const val = parseInt(bubbleEl.getAttribute("data-value"), 10);
    if (val === ranHit) {
      onCorrectHit(bubbleEl);
    } else {
      onWrongHit(bubbleEl);
    }
  });

  /* --------------------------------------------------------------------------
     7. Game Timer & Lifecycle
     -------------------------------------------------------------------------- */
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (timer > 0) {
        timer -= 1;
        timerValElem.textContent = timer;

        if (timer <= 10) {
          timerValElem.classList.add("warning");
          if (timer <= 5 && timer > 0) {
            playTone(600, "sine", 0.05, 0, 0.08);
          }
        } else {
          timerValElem.classList.remove("warning");
        }
      } else {
        clearInterval(timerInterval);
        gameOver();
      }
    }, 1000);
  }

  function startGame() {
    getAudioContext();
    isGameActive = true;
    score = 0;
    timer = 60;
    currentStreak = 0;
    maxStreak = 0;
    totalHits = 0;
    correctHits = 0;

    timerValElem.textContent = timer;
    timerValElem.classList.remove("warning");

    updateScoreDisplay();
    generateNewHit();
    makeBubbles();

    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    resetMultiplierUI();

    startTimer();
  }

  function gameOver() {
    isGameActive = false;
    clearInterval(timerInterval);
    resetMultiplierUI();

    finalScoreValElem.textContent = score;
    maxStreakValElem.textContent = `${maxStreak}x`;

    const accuracy = totalHits > 0 ? Math.round((correctHits / totalHits) * 100) : 0;
    accuracyValElem.textContent = `${accuracy}%`;

    const isHigh = score >= highScore && score > 0;
    if (isHigh) {
      newHighScoreBanner.style.display = "block";
    } else {
      newHighScoreBanner.style.display = "none";
    }

    playGameOverFanfare(isHigh);
    gameOverScreen.style.display = "flex";
  }

  function restartGame() {
    clearInterval(timerInterval);
    clearInterval(comboInterval);
    startGame();
  }

  function resetHighScore() {
    highScore = 0;
    try {
      localStorage.removeItem("bubble_game_high_score");
    } catch (e) {}
    updateScoreDisplay();
    newHighScoreBanner.style.display = "none";
  }

  /* --------------------------------------------------------------------------
     8. Dynamic Particle Constellation Background (Exact Portfolio Engine)
     -------------------------------------------------------------------------- */
  function initParticleCanvas() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    const count = width < 768 ? 35 : 65;
    const connectionDist = width < 768 ? 95 : 120;

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.radius = Math.random() * 1.5 + 0.8;
        this.alpha = Math.random() * 0.5 + 0.25;
        this.color = Math.random() > 0.4 ? "56, 189, 248" : "99, 102, 241";
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Connect near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
  }

  /* --------------------------------------------------------------------------
     9. Event Listeners & Initialization
     -------------------------------------------------------------------------- */
  startBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener("click", startGame);
  resetScoreBtn.addEventListener("click", resetHighScore);
  restartBtn.addEventListener("click", restartGame);

  // Resize handler
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (isGameActive) {
        makeBubbles();
      }
    }, 250);
  });

  // Initialize on load
  document.addEventListener("DOMContentLoaded", () => {
    initParticleCanvas();
    updateScoreDisplay();
    updateSoundUI();
  });
})();