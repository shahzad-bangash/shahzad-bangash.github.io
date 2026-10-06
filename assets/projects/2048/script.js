/**
 * ==========================================================================
 * 2048 ARCADE ENGINE - SHAHZAD BANGASH PORTFOLIO
 * Complete game logic, move history undo, audio feedback, mobile gestures,
 * and unified theme integration.
 * ==========================================================================
 */

(function () {
  'use strict';

  class Game2048 {
    constructor() {
      this.size = 4;
      this.board = new Array(16).fill(0);
      this.score = 0;
      this.bestScore = 0;
      this.moves = 0;
      this.history = null; // Single-move undo snapshot
      this.hasWon = false;
      this.keepPlaying = false;
      this.isGameOver = false;
      this.soundEnabled = true;

      // DOM Elements
      this.boardWrapper = document.querySelector('.board-wrapper');
      this.cells = Array.from(document.querySelectorAll('.board-cell'));
      this.scoreVal = document.getElementById('scoreVal');
      this.bestScoreVal = document.getElementById('bestScoreVal');
      this.movesVal = document.getElementById('movesVal');
      this.btnUndo = document.getElementById('btnUndo');
      this.btnNewGame = document.getElementById('btnNewGame');
      this.soundToggleBtn = document.getElementById('soundToggleBtn');
      this.soundIcon = document.getElementById('soundIcon');

      // Modal Elements
      this.gridOverlay = document.getElementById('gridOverlay');
      this.overlayBadge = document.getElementById('overlayBadge');
      this.overlayBadgeIcon = document.getElementById('overlayBadgeIcon');
      this.overlayTitle = document.getElementById('overlayTitle');
      this.overlayMsg = document.getElementById('overlayMsg');
      this.modalFinalScore = document.getElementById('modalFinalScore');
      this.modalBestScore = document.getElementById('modalBestScore');
      this.btnKeepGoing = document.getElementById('btnKeepGoing');
      this.btnOverlayRestart = document.getElementById('btnOverlayRestart');

      // Audio Elements
      this.slideAudio = document.getElementById('slide-sound');
      this.mergeAudio = document.getElementById('merge-sound');
      this.gameOverAudio = document.getElementById('game-over-sound');

      this.initSoundSetting();
      this.initStorage();
      this.initEvents();
      this.loadOrNewGame();
    }

    // --- SOUND ENGINE (Audio Tag + Web Audio API Synthesizer Fallback) ---
    initSoundSetting() {
      try {
        const saved = localStorage.getItem('shahzad_2048_sound');
        if (saved !== null) {
          this.soundEnabled = saved === 'true';
        }
      } catch (e) {}
      this.updateSoundIcon();
    }

    updateSoundIcon() {
      if (this.soundIcon && this.soundToggleBtn) {
        if (this.soundEnabled) {
          this.soundIcon.className = 'bx bx-volume-full';
          this.soundToggleBtn.classList.remove('muted');
          this.soundToggleBtn.title = 'Sound: ON';
        } else {
          this.soundIcon.className = 'bx bx-volume-mute';
          this.soundToggleBtn.classList.add('muted');
          this.soundToggleBtn.title = 'Sound: OFF';
        }
      }
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      try {
        localStorage.setItem('shahzad_2048_sound', String(this.soundEnabled));
      } catch (e) {}
      this.updateSoundIcon();
    }

    playSound(audioElement, synthFreq = 440, synthType = 'sine', duration = 0.08) {
      if (!this.soundEnabled) return;

      if (audioElement && typeof audioElement.play === 'function') {
        try {
          audioElement.currentTime = 0;
          const p = audioElement.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => this.playSynthTone(synthFreq, synthType, duration));
          }
          return;
        } catch (_) {}
      }

      this.playSynthTone(synthFreq, synthType, duration);
    }

    playSynthTone(freq, type = 'sine', duration = 0.08) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this.synthCtx) this.synthCtx = new AudioCtx();
        if (this.synthCtx.state === 'suspended') this.synthCtx.resume();

        const osc = this.synthCtx.createOscillator();
        const gain = this.synthCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.synthCtx.currentTime);

        gain.gain.setValueAtTime(0.08, this.synthCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.synthCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.synthCtx.destination);

        osc.start();
        osc.stop(this.synthCtx.currentTime + duration);
      } catch (_) {}
    }

    playSlide() {
      this.playSound(this.slideAudio, 380, 'triangle', 0.06);
    }

    playMerge() {
      this.playSound(this.mergeAudio, 660, 'sine', 0.12);
    }

    playGameOver() {
      this.playSound(this.gameOverAudio, 220, 'sawtooth', 0.35);
    }

    playVictory() {
      if (!this.soundEnabled) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playSynthTone(freq, 'sine', 0.15), idx * 80);
      });
    }

    // --- STORAGE & PERSISTENCE ---
    initStorage() {
      try {
        const best = localStorage.getItem('2048_best_score');
        if (best) this.bestScore = parseInt(best, 10) || 0;
        if (this.bestScoreVal) this.bestScoreVal.textContent = this.bestScore.toLocaleString();
      } catch (e) {}
    }

    saveState() {
      try {
        localStorage.setItem('2048_best_score', String(this.bestScore));
        localStorage.setItem(
          '2048_saved_state',
          JSON.stringify({
            board: this.board,
            score: this.score,
            moves: this.moves,
            hasWon: this.hasWon,
            keepPlaying: this.keepPlaying
          })
        );
      } catch (e) {}
    }

    loadOrNewGame() {
      try {
        const saved = localStorage.getItem('2048_saved_state');
        if (saved) {
          const data = JSON.parse(saved);
          if (Array.isArray(data.board) && data.board.length === 16) {
            this.board = data.board;
            this.score = data.score || 0;
            this.moves = data.moves || 0;
            this.hasWon = !!data.hasWon;
            this.keepPlaying = !!data.keepPlaying;
            this.render(null, []);
            return;
          }
        }
      } catch (e) {}
      this.startNewGame();
    }

    startNewGame() {
      this.board = new Array(16).fill(0);
      this.score = 0;
      this.moves = 0;
      this.history = null;
      this.hasWon = false;
      this.keepPlaying = false;
      this.isGameOver = false;

      this.hideOverlay();
      if (this.btnUndo) this.btnUndo.disabled = true;

      // Spawn 2 initial tiles
      this.spawnRandomTile();
      this.spawnRandomTile();

      this.render(null, []);
      this.saveState();
    }

    spawnRandomTile() {
      const emptyIndices = [];
      for (let i = 0; i < 16; i++) {
        if (this.board[i] === 0) emptyIndices.push(i);
      }
      if (emptyIndices.length === 0) return null;

      const randIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      // 90% chance of 2, 10% chance of 4
      const val = Math.random() < 0.9 ? 2 : 4;
      this.board[randIndex] = val;
      return randIndex;
    }

    // --- DETERMINISTIC MERGE & SLIDE MATH ---
    slideLine(line) {
      let scoreGain = 0;
      const filtered = line.filter((v) => v !== 0);
      const mergedLine = [];
      const mergedIndices = [];

      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedVal = filtered[i] * 2;
          mergedLine.push(mergedVal);
          mergedIndices.push(mergedLine.length - 1);
          scoreGain += mergedVal;
          i++; // Skip merged sibling
        } else {
          mergedLine.push(filtered[i]);
        }
      }

      while (mergedLine.length < 4) {
        mergedLine.push(0);
      }

      return { line: mergedLine, scoreGain, mergedIndices };
    }

    move(direction) {
      if (this.isGameOver) return false;

      const prevBoard = [...this.board];
      const prevScore = this.score;
      const prevMoves = this.moves;
      let totalGain = 0;
      let moved = false;
      const boardMergedIndices = [];

      const getIdx = (r, c) => r * 4 + c;

      if (direction === 'left' || direction === 'right') {
        for (let r = 0; r < 4; r++) {
          let row = [
            this.board[getIdx(r, 0)],
            this.board[getIdx(r, 1)],
            this.board[getIdx(r, 2)],
            this.board[getIdx(r, 3)]
          ];

          if (direction === 'right') row.reverse();
          const { line, scoreGain, mergedIndices } = this.slideLine(row);
          if (direction === 'right') {
              line.reverse();
              // adjust indices for reversed line
              mergedIndices.forEach(idx => boardMergedIndices.push(getIdx(r, 3 - idx)));
          } else {
              mergedIndices.forEach(idx => boardMergedIndices.push(getIdx(r, idx)));
          }

          totalGain += scoreGain;

          for (let c = 0; c < 4; c++) {
            const idx = getIdx(r, c);
            if (this.board[idx] !== line[c]) moved = true;
            this.board[idx] = line[c];
          }
        }
      } else if (direction === 'up' || direction === 'down') {
        for (let c = 0; c < 4; c++) {
          let col = [
            this.board[getIdx(0, c)],
            this.board[getIdx(1, c)],
            this.board[getIdx(2, c)],
            this.board[getIdx(3, c)]
          ];

          if (direction === 'down') col.reverse();
          const { line, scoreGain, mergedIndices } = this.slideLine(col);
          if (direction === 'down') {
              line.reverse();
              mergedIndices.forEach(idx => boardMergedIndices.push(getIdx(3 - idx, c)));
          } else {
              mergedIndices.forEach(idx => boardMergedIndices.push(getIdx(idx, c)));
          }

          totalGain += scoreGain;

          for (let r = 0; r < 4; r++) {
            const idx = getIdx(r, c);
            if (this.board[idx] !== line[r]) moved = true;
            this.board[idx] = line[r];
          }
        }
      }

      if (moved) {
        // Record undo history
        this.history = { board: prevBoard, score: prevScore, moves: prevMoves };
        if (this.btnUndo) this.btnUndo.disabled = false;

        this.moves++;
        this.score += totalGain;
        if (this.score > this.bestScore) {
          this.bestScore = this.score;
        }

        const anyMerged = boardMergedIndices.length > 0;
        // Sound trigger
        if (anyMerged) {
          this.playMerge();
        } else {
          this.playSlide();
        }

        // Spawn new tile & render
        const newIdx = this.spawnRandomTile();
        this.render(newIdx, boardMergedIndices);
        this.saveState();

        // Check Victory (2048 reached for the first time)
        if (!this.hasWon && !this.keepPlaying) {
          if (this.board.some((v) => v >= 2048)) {
            this.hasWon = true;
            this.playVictory();
            this.showWinOverlay();
            return true;
          }
        }

        // Check Game Over
        if (this.checkGameOver()) {
          this.isGameOver = true;
          this.playGameOver();
          this.showGameOverOverlay();
        }

        return true;
      }

      return false;
    }

    undo() {
      if (!this.history) return;
      this.board = [...this.history.board];
      this.score = this.history.score;
      this.moves = this.history.moves;
      this.history = null;
      if (this.btnUndo) this.btnUndo.disabled = true;

      this.isGameOver = false;
      this.hideOverlay();
      this.playSlide();
      this.render(null, []);
      this.saveState();
    }

    checkGameOver() {
      // 1. Any empty slot?
      if (this.board.some((v) => v === 0)) return false;

      // 2. Horizontal adjacent matches?
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.board[r * 4 + c] === this.board[r * 4 + c + 1]) return false;
        }
      }

      // 3. Vertical adjacent matches?
      for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 3; r++) {
          if (this.board[r * 4 + c] === this.board[(r + 1) * 4 + c]) return false;
        }
      }

      return true;
    }

    // --- DOM RENDERING ---
    render(newTileIdx = null, mergedIndices = []) {
      if (this.scoreVal) this.scoreVal.textContent = this.score.toLocaleString();
      if (this.bestScoreVal) this.bestScoreVal.textContent = this.bestScore.toLocaleString();
      if (this.movesVal) this.movesVal.textContent = this.moves.toLocaleString();

      this.cells.forEach((cell, idx) => {
        const val = this.board[idx];
        cell.className = 'board-cell'; // reset classes

        if (val > 0) {
          cell.textContent = String(val);
          const tileClass = val <= 2048 ? `tile-${val}` : 'tile-super';
          cell.classList.add(tileClass);

          if (idx === newTileIdx) {
            cell.classList.add('tile-new');
          } else if (mergedIndices.includes(idx)) {
            cell.classList.add('tile-merged');
          }
        } else {
          cell.textContent = '';
        }
      });
    }

    // --- OVERLAY NOTIFICATIONS ---
    showWinOverlay() {
      if (!this.gridOverlay) return;
      this.overlayBadge.className = 'overlay-badge win';
      this.overlayBadgeIcon.className = 'bx bxs-trophy';
      this.overlayTitle.textContent = 'You Reached 2048!';
      this.overlayMsg.textContent = 'Sensational! You conquered the board. Keep playing for 4096+ or start fresh.';
      this.modalFinalScore.textContent = this.score.toLocaleString();
      this.modalBestScore.textContent = this.bestScore.toLocaleString();

      this.btnKeepGoing.classList.remove('hidden');
      this.gridOverlay.classList.remove('hidden');
    }

    showGameOverOverlay() {
      if (!this.gridOverlay) return;
      this.overlayBadge.className = 'overlay-badge over';
      this.overlayBadgeIcon.className = 'bx bx-x-circle';
      this.overlayTitle.textContent = 'Game Over!';
      this.overlayMsg.textContent = 'No available moves remaining on the board.';
      this.modalFinalScore.textContent = this.score.toLocaleString();
      this.modalBestScore.textContent = this.bestScore.toLocaleString();

      this.btnKeepGoing.classList.add('hidden');
      this.gridOverlay.classList.remove('hidden');
    }

    hideOverlay() {
      if (this.gridOverlay) this.gridOverlay.classList.add('hidden');
    }

    // --- CONTROLS & EVENT INGESTION ---
    initEvents() {
      // Sound Toggle
      if (this.soundToggleBtn) {
        this.soundToggleBtn.addEventListener('click', () => this.toggleSound());
      }

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            e.preventDefault();
            this.move('up');
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            e.preventDefault();
            this.move('down');
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            e.preventDefault();
            this.move('left');
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            e.preventDefault();
            this.move('right');
            break;
          case 'u':
          case 'U':
          case 'z':
          case 'Z':
            e.preventDefault();
            this.undo();
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            this.startNewGame();
            break;
        }
      });

      // UI Action Buttons
      if (this.btnNewGame) this.btnNewGame.addEventListener('click', () => this.startNewGame());
      const headerRestartBtn = document.getElementById('headerRestartBtn');
      if (headerRestartBtn) headerRestartBtn.addEventListener('click', () => this.startNewGame());
      if (this.btnUndo) this.btnUndo.addEventListener('click', () => this.undo());
      if (this.btnOverlayRestart) this.btnOverlayRestart.addEventListener('click', () => this.startNewGame());
      if (this.btnKeepGoing) {
        this.btnKeepGoing.addEventListener('click', () => {
          this.keepPlaying = true;
          this.hideOverlay();
          this.saveState();
        });
      }

      // Mobile Touch D-Pad buttons
      const dpadButtons = document.querySelectorAll('.dpad-btn');
      dpadButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const dir = btn.getAttribute('data-dir');
          if (dir) this.move(dir);
        });
      });

      // Touch & Swipe Gestures on the Board
      let touchStartX = 0;
      let touchStartY = 0;

      if (this.boardWrapper) {
        this.boardWrapper.addEventListener(
          'touchstart',
          (e) => {
            if (e.touches.length === 1) {
              touchStartX = e.touches[0].clientX;
              touchStartY = e.touches[0].clientY;
            }
          },
          { passive: true }
        );

        this.boardWrapper.addEventListener(
          'touchend',
          (e) => {
            if (e.changedTouches.length === 1) {
              const touchEndX = e.changedTouches[0].clientX;
              const touchEndY = e.changedTouches[0].clientY;

              const dx = touchEndX - touchStartX;
              const dy = touchEndY - touchStartY;
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);

              // Minimum swipe threshold
              if (Math.max(absDx, absDy) > 28) {
                if (absDx > absDy) {
                  // Horizontal swipe
                  if (dx > 0) this.move('right');
                  else this.move('left');
                } else {
                  // Vertical swipe
                  if (dy > 0) this.move('down');
                  else this.move('up');
                }
              }
            }
          },
          { passive: true }
        );
      }
    }
  }

  // Initialize once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.game2048 = new Game2048();
  });
})();
