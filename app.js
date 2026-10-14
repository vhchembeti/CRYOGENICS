// Cryogenic Quantum Lab - Core Gamification & Quiz Arena Logic

(function() {
  'use strict';

  // ==================== AUDIO SYNTHESIZER (Web Audio API) ====================
  class QuantumAudio {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('cryo_sound_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.15, gain = 0.1) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio policy or unsupported
      }
    }

    correctSound() {
      if (this.isMuted) return;
      this.init();
      // Cyber double chime (E5 -> B5)
      this.playTone(659.25, 'sine', 0.12, 0.12);
      setTimeout(() => this.playTone(987.77, 'triangle', 0.25, 0.15), 90);
    }

    incorrectSound() {
      if (this.isMuted) return;
      this.init();
      // Low damped square buzz
      this.playTone(140, 'sawtooth', 0.22, 0.15);
      setTimeout(() => this.playTone(95, 'sawtooth', 0.3, 0.12), 120);
    }

    streakSound(streak) {
      if (this.isMuted) return;
      this.init();
      // Ascending arpeggio
      const base = 440;
      [0, 4, 7, 12].forEach((interval, i) => {
        setTimeout(() => {
          this.playTone(base * Math.pow(2, (interval + (streak * 2)) / 12), 'sine', 0.18, 0.1);
        }, i * 65);
      });
    }

    clickSound() {
      if (this.isMuted) return;
      this.playTone(800, 'sine', 0.04, 0.04);
    }

    tickSound() {
      if (this.isMuted) return;
      this.playTone(1200, 'sine', 0.03, 0.03);
    }

    fanfareSound() {
      if (this.isMuted) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.12), idx * 110);
      });
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('cryo_sound_muted', this.isMuted);
      return this.isMuted;
    }
  }

  const audio = new QuantumAudio();

  // ==================== BADGE DEFINITIONS ====================
  const BADGES = [
    {
      id: 'absolute_zero',
      title: 'Absolute Zero',
      icon: '❄️',
      description: 'Achieve a perfect 10/10 score on any mission module.',
      check: (stats) => Object.values(stats.modules || {}).some(m => m.bestScore === 10)
    },
    {
      id: 'quantum_surge',
      title: 'Quantum Surge',
      icon: '⚡',
      description: 'Build a streak of 5 consecutive correct answers.',
      check: (stats) => (stats.maxStreak || 0) >= 5
    },
    {
      id: 'planck_speed',
      title: 'Planck Speed',
      icon: '⏱️',
      description: 'Answer a question correctly in under 5 seconds.',
      check: (stats) => stats.fastestAnswer && stats.fastestAnswer <= 5
    },
    {
      id: 'cryo_researcher',
      title: 'Cryo Researcher',
      icon: '🧪',
      description: 'Complete at least 5 different mission modules.',
      check: (stats) => Object.values(stats.modules || {}).filter(m => m.attempts > 0).length >= 5
    },
    {
      id: 'noise_shield',
      title: 'Noise Suppressor',
      icon: '🛡️',
      description: 'Score 8+ on Week 8 (Cryo-LNAs & ADCs).',
      check: (stats) => (stats.modules?.[8]?.bestScore || 0) >= 8
    },
    {
      id: 'bell_state',
      title: 'Bell State Master',
      icon: '⚛️',
      description: 'Score a perfect 10/10 on Week 9 (Quantum & Entanglement).',
      check: (stats) => (stats.modules?.[9]?.bestScore || 0) === 10
    },
    {
      id: 'quantum_architect',
      title: 'Universal Architect',
      icon: '🌌',
      description: 'Complete all 13 Cryogenic Quantum mission modules.',
      check: (stats) => Object.values(stats.modules || {}).filter(m => m.attempts > 0).length >= 13
    }
  ];

  // XP & Level thresholds
  const LEVELS = [
    { lvl: 1, title: 'Quantum Initiate', minXp: 0, maxXp: 600 },
    { lvl: 2, title: 'Thermal Noise Suppressor', minXp: 600, maxXp: 1500 },
    { lvl: 3, title: 'Cryo-CMOS Specialist', minXp: 1500, maxXp: 3000 },
    { lvl: 4, title: 'Freeze-Out Investigator', minXp: 3000, maxXp: 5200 },
    { lvl: 5, title: 'Superposition Engineer', minXp: 5200, maxXp: 8500 },
    { lvl: 6, title: 'Entanglement Navigator', minXp: 8500, maxXp: 13000 },
    { lvl: 7, title: 'Qubit Architect', minXp: 13000, maxXp: 20000 },
    { lvl: 8, title: 'Absolute Zero Vanguard', minXp: 20000, maxXp: 999999 }
  ];

  // ==================== STATE ====================
  let modules = [];
  let userStats = {
    totalXp: 0,
    currentStreak: 0,
    maxStreak: 0,
    fastestAnswer: 999,
    modules: {}, // { [id]: { bestScore, attempts, lastScore, stars } }
    unlockedBadges: [] // array of badge ids
  };

  // Active quiz session state
  let currentModule = null;
  let currentQuestionIndex = 0;
  let userAnswers = []; // array of { selected: number|null, isCorrect: boolean, timeSpent: number }
  let currentStreak = 0;
  let sessionXp = 0;
  let questionStartTime = 0;
  let questionTimerInterval = null;
  const QUESTION_TIME_LIMIT = 30; // seconds
  let remainingSeconds = QUESTION_TIME_LIMIT;
  let resultsFilter = 'all';

  // DOM Elements
  const viewDashboard = document.getElementById('view-dashboard');
  const viewQuiz = document.getElementById('view-quiz');
  const viewResults = document.getElementById('view-results');
  const modalBadges = document.getElementById('modal-badges');

  // Dashboard HUD elements
  const playerRankTitle = document.getElementById('player-rank-title');
  const playerLevelBadge = document.getElementById('player-level-badge');
  const playerXpBar = document.getElementById('player-xp-bar');
  const playerXpText = document.getElementById('player-xp-text');
  const hudTotalXp = document.getElementById('hud-total-xp');
  const hudStreak = document.getElementById('hud-streak');
  const hudBadgesCount = document.getElementById('hud-badges-count');
  const modulesGrid = document.getElementById('modules-grid');
  const categoryFilters = document.getElementById('category-filters');
  const moduleSearchInput = document.getElementById('module-search-input');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const btnOpenBadges = document.getElementById('btn-open-badges');
  const btnCloseBadges = document.getElementById('btn-close-badges');
  const badgesListContainer = document.getElementById('badges-list-container');

  // Quiz Arena Elements
  const quizArenaContainer = document.getElementById('quiz-arena-container');
  const arenaModuleCode = document.getElementById('arena-module-code');
  const arenaModuleTitle = document.getElementById('arena-module-title');
  const arenaTempRegime = document.getElementById('arena-temp-regime');
  const arenaStreakBadge = document.getElementById('arena-streak-badge');
  const arenaSessionXp = document.getElementById('arena-session-xp');
  const arenaTimerProgress = document.getElementById('arena-timer-progress');
  const arenaTimerSeconds = document.getElementById('arena-timer-seconds');
  const arenaQuestionCounter = document.getElementById('arena-question-counter');
  const arenaQuestionPrompt = document.getElementById('arena-question-prompt');
  const arenaOptionsGrid = document.getElementById('arena-options-grid');
  const arenaExplanationBox = document.getElementById('arena-explanation-box');
  const arenaExplanationText = document.getElementById('arena-explanation-text');
  const btnArenaNext = document.getElementById('btn-arena-next');
  const btnArenaNextText = document.getElementById('btn-arena-next-text');
  const btnAbortMission = document.getElementById('btn-abort-mission');
  const particleCanvas = document.getElementById('particle-canvas');

  // Results Screen Elements
  const resultsRankPill = document.getElementById('results-rank-pill');
  const resultsModuleTitle = document.getElementById('results-module-title');
  const resultsScoreDisplay = document.getElementById('results-score-display');
  const resultsScorePct = document.getElementById('results-score-pct');
  const resultsXpEarned = document.getElementById('results-xp-earned');
  const resultsAccuracyPill = document.getElementById('results-accuracy-pill');
  const resultsStreakPill = document.getElementById('results-streak-pill');
  const resultsNewBadgeNotice = document.getElementById('results-new-badge-notice');
  const newBadgeName = document.getElementById('new-badge-name');
  const reviewQuestionsList = document.getElementById('review-questions-list');
  const btnReplayMission = document.getElementById('btn-replay-mission');
  const btnReturnControl = document.getElementById('btn-return-control');
  const filterMistakesBtn = document.getElementById('filter-mistakes-btn');
  const filterAllReviewBtn = document.getElementById('filter-all-review-btn');

  // Active Category Filter
  let activeCategory = 'all';

  // ==================== INITIALIZATION ====================
  function init() {
    loadUserStats();
    modules = window.QUANTUM_MODULES || window.DEFAULT_ASSESSMENTS || [];
    updateSoundIcon();
    renderDashboard();
    setupCanvas();
    setupEventListeners();
  }

  // Load from localStorage
  function loadUserStats() {
    const saved = localStorage.getItem('cryo_quantum_stats');
    if (saved) {
      try {
        userStats = Object.assign(userStats, JSON.parse(saved));
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    }
  }

  function saveUserStats() {
    localStorage.setItem('cryo_quantum_stats', JSON.stringify(userStats));
    updateDashboardHUD();
    checkAllBadges();
  }

  function getCurrentLevel(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  function updateDashboardHUD() {
    const lvl = getCurrentLevel(userStats.totalXp);
    const nextLvl = LEVELS.find(l => l.lvl === lvl.lvl + 1);

    if (playerRankTitle) playerRankTitle.textContent = lvl.title;
    if (playerLevelBadge) playerLevelBadge.textContent = `LVL ${lvl.lvl}`;
    if (hudTotalXp) hudTotalXp.textContent = `${userStats.totalXp.toLocaleString()} XP`;
    if (hudStreak) hudStreak.textContent = `🔥 ${userStats.currentStreak || 0}`;
    if (hudBadgesCount) hudBadgesCount.textContent = `🏆 ${userStats.unlockedBadges.length} / ${BADGES.length}`;

    // XP Progress bar
    if (playerXpBar && playerXpText) {
      if (nextLvl) {
        const span = nextLvl.minXp - lvl.minXp;
        const currentInLevel = userStats.totalXp - lvl.minXp;
        const pct = Math.min(100, Math.max(0, Math.round((currentInLevel / span) * 100)));
        playerXpBar.style.width = `${pct}%`;
        playerXpText.textContent = `${userStats.totalXp} / ${nextLvl.minXp} XP (${pct}%)`;
      } else {
        playerXpBar.style.width = '100%';
        playerXpText.textContent = `MAX RANK ACHIEVED (${userStats.totalXp} XP)`;
      }
    }
  }

  function updateSoundIcon() {
    if (audio.isMuted) {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      btnSoundToggle.title = "Audio Muted (Click to Unmute)";
    } else {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      btnSoundToggle.title = "Quantum Audio Enabled (Click to Mute)";
    }
  }

  // ==================== DASHBOARD RENDERING ====================
  function renderDashboard() {
    updateDashboardHUD();
    renderCategoryFilters();

    const query = (moduleSearchInput?.value || '').toLowerCase().trim();
    const filtered = modules.filter(m => {
      const matchCat = activeCategory === 'all' || m.category === activeCategory;
      const matchSearch = !query || 
        m.title.toLowerCase().includes(query) || 
        m.description.toLowerCase().includes(query) || 
        m.code.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });

    modulesGrid.innerHTML = '';

    if (filtered.length === 0) {
      modulesGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <p class="text-lg font-bold text-cyan-300">No Mission Modules Located</p>
          <p class="text-sm text-slate-400 mt-1">Adjust search filter parameters to explore the quantum lab.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(mod => {
      const stat = userStats.modules[mod.id];
      const hasCompleted = stat && stat.attempts > 0;
      const bestScore = stat ? stat.bestScore : 0;
      const stars = stat ? stat.stars || 0 : 0;

      let starDisplay = '';
      if (hasCompleted) {
        starDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      }

      const card = document.createElement('div');
      card.className = "group relative rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/60 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)] hover:-translate-y-1";

      card.innerHTML = `
        <div>
          <!-- Top Row: Code & Temp Tag -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="font-mono text-xs font-bold tracking-wider px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              ${mod.code}
            </span>
            <span class="text-[11px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-md">
              ${mod.tempRegime || 'Cryo Range'}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
            ${escapeHtml(mod.title)}
          </h3>

          <!-- Description -->
          <p class="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed">
            ${escapeHtml(mod.description)}
          </p>

          <!-- High Score & Stars -->
          ${hasCompleted ? `
            <div class="mt-4 flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span class="text-slate-300">High Score: <strong class="text-cyan-300">${bestScore}/10</strong></span>
              <span class="text-amber-400 tracking-wider">${starDisplay}</span>
            </div>
          ` : `
            <div class="mt-4 text-xs py-2 px-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-400 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-500"></span>
              Mission Uninitiated (10 Qs)
            </div>
          `}
        </div>

        <!-- Initiate Mission Button -->
        <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-mono flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            +1000 XP Max
          </span>
          <button 
            data-id="${mod.id}"
            class="btn-initiate-mission px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer flex items-center gap-1.5">
            <span>${hasCompleted ? 'Re-Enter' : 'Initiate'}</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      `;

      modulesGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-initiate-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        audio.clickSound();
        startMission(id);
      });
    });
  }

  function renderCategoryFilters() {
    const cats = ['all'];
    modules.forEach(m => {
      if (m.category && !cats.includes(m.category)) cats.push(m.category);
    });

    categoryFilters.innerHTML = '';
    cats.forEach(c => {
      const btn = document.createElement('button');
      const isSelected = activeCategory === c;
      btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
        isSelected
          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
          : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
      }`;
      btn.textContent = c === 'all' ? 'All Missions (13)' : c;
      btn.addEventListener('click', () => {
        audio.clickSound();
        activeCategory = c;
        renderDashboard();
      });
      categoryFilters.appendChild(btn);
    });
  }

  // ==================== QUIZ ARENA (MISSION EXECUTION) ====================
  function startMission(moduleId) {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;

    currentModule = mod;
    currentQuestionIndex = 0;
    userAnswers = [];
    currentStreak = 0;
    sessionXp = 0;

    arenaModuleCode.textContent = currentModule.code;
    arenaModuleTitle.textContent = currentModule.title;
    arenaTempRegime.textContent = currentModule.tempRegime || '15mK Dilution';

    showView('quiz');
    loadQuestion();
  }

  function loadQuestion() {
    clearInterval(questionTimerInterval);
    const q = currentModule.questions[currentQuestionIndex];
    const totalQ = currentModule.questions.length;

    // Reset UI state
    arenaQuestionCounter.textContent = `QUESTION ${currentQuestionIndex + 1} OF ${totalQ}`;
    arenaQuestionPrompt.textContent = q.question;
    arenaExplanationBox.classList.add('hidden');
    btnArenaNext.classList.add('hidden');

    // Update streak HUD
    updateStreakDisplay();
    arenaSessionXp.textContent = `+${sessionXp} XP`;

    // Render Options A, B, C, D
    const optionLetters = ['A', 'B', 'C', 'D'];
    arenaOptionsGrid.innerHTML = '';

    q.options.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = "arena-option-btn w-full text-left p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-400/60 transition-all duration-150 flex items-start gap-3 cursor-pointer group";

      btn.innerHTML = `
        <span class="w-8 h-8 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 group-hover:border-cyan-400 group-hover:text-cyan-300 flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 transition-colors">
          ${optionLetters[optIdx]}
        </span>
        <span class="flex-1 text-sm sm:text-base font-medium text-slate-200 pt-1 leading-snug">
          ${escapeHtml(optText)}
        </span>
      `;

      btn.addEventListener('click', () => {
        handleOptionChosen(optIdx);
      });

      arenaOptionsGrid.appendChild(btn);
    });

    // Start 30s Countdown Timer
    startQuestionTimer();
  }

  function startQuestionTimer() {
    remainingSeconds = QUESTION_TIME_LIMIT;
    questionStartTime = Date.now();
    updateTimerUI();

    questionTimerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 5 && remainingSeconds > 0) {
        audio.tickSound();
      }
      updateTimerUI();

      if (remainingSeconds <= 0) {
        clearInterval(questionTimerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function updateTimerUI() {
    arenaTimerSeconds.textContent = `${remainingSeconds}s`;
    const pct = (remainingSeconds / QUESTION_TIME_LIMIT) * 100;
    arenaTimerProgress.style.width = `${pct}%`;

    if (remainingSeconds > 12) {
      arenaTimerProgress.className = "h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300";
      arenaTimerSeconds.className = "font-mono font-bold text-cyan-300 text-sm";
    } else if (remainingSeconds > 5) {
      arenaTimerProgress.className = "h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300";
      arenaTimerSeconds.className = "font-mono font-bold text-amber-300 text-sm";
    } else {
      arenaTimerProgress.className = "h-full bg-gradient-to-r from-rose-600 to-pink-500 animate-pulse transition-all duration-300";
      arenaTimerSeconds.className = "font-mono font-bold text-rose-400 text-sm animate-pulse";
    }
  }

  function updateStreakDisplay() {
    if (currentStreak > 1) {
      const mult = currentStreak >= 5 ? 3.0 : currentStreak >= 3 ? 2.0 : 1.5;
      arenaStreakBadge.textContent = `🔥 ${currentStreak}x STREAK (${mult}x XP)`;
      arenaStreakBadge.className = "px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-bounce";
    } else {
      arenaStreakBadge.textContent = "1.0x MULTIPLIER";
      arenaStreakBadge.className = "px-3 py-1 rounded-xl text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60";
    }
  }

  function handleOptionChosen(selectedIdx) {
    clearInterval(questionTimerInterval);
    const q = currentModule.questions[currentQuestionIndex];
    const isCorrect = selectedIdx === q.correctIndex;
    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTime) / 1000));

    userAnswers.push({
      selected: selectedIdx,
      isCorrect,
      timeSpent
    });

    // Check fast answer achievement
    if (isCorrect && timeSpent < userStats.fastestAnswer) {
      userStats.fastestAnswer = timeSpent;
    }

    // Disable all options and style them
    const buttons = arenaOptionsGrid.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.add('cursor-default');

      if (idx === q.correctIndex) {
        btn.classList.remove('bg-slate-800/60', 'border-slate-700/60');
        btn.classList.add('bg-emerald-950/80', 'border-emerald-400', 'shadow-[0_0_20px_rgba(16,185,129,0.35)]');
        btn.querySelector('span:first-child').className = "w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-sm flex items-center justify-center flex-shrink-0";
      } else if (idx === selectedIdx && !isCorrect) {
        btn.classList.remove('bg-slate-800/60', 'border-slate-700/60');
        btn.classList.add('bg-rose-950/80', 'border-rose-500', 'shadow-[0_0_20px_rgba(244,63,94,0.35)]');
        btn.querySelector('span:first-child').className = "w-8 h-8 rounded-xl bg-rose-500 text-white font-mono font-bold text-sm flex items-center justify-center flex-shrink-0";
      }
    });

    if (isCorrect) {
      currentStreak++;
      if (currentStreak > userStats.maxStreak) userStats.maxStreak = currentStreak;

      // Multipliers:
      const mult = currentStreak >= 5 ? 3.0 : currentStreak >= 3 ? 2.0 : currentStreak >= 2 ? 1.5 : 1.0;
      const speedBonus = Math.max(0, (QUESTION_TIME_LIMIT - timeSpent) * 2);
      const earned = Math.round(100 * mult + speedBonus);
      sessionXp += earned;

      audio.correctSound();
      if (currentStreak >= 3) {
        audio.streakSound(currentStreak);
      }

      // Spark particles
      triggerSparks();
    } else {
      currentStreak = 0;
      audio.incorrectSound();
      triggerScreenShake();
    }

    updateStreakDisplay();
    arenaSessionXp.textContent = `+${sessionXp} XP`;

    // Reveal Explanation
    arenaExplanationText.textContent = q.explanation;
    arenaExplanationBox.classList.remove('hidden');

    // Next Button
    const isLast = currentQuestionIndex === currentModule.questions.length - 1;
    btnArenaNextText.textContent = isLast ? "Complete Mission & Debrief" : "Next Question";
    btnArenaNext.classList.remove('hidden');
  }

  function handleTimeout() {
    const q = currentModule.questions[currentQuestionIndex];
    userAnswers.push({
      selected: null,
      isCorrect: false,
      timeSpent: QUESTION_TIME_LIMIT
    });

    currentStreak = 0;
    updateStreakDisplay();
    audio.incorrectSound();
    triggerScreenShake();

    const buttons = arenaOptionsGrid.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.classList.add('bg-emerald-950/80', 'border-emerald-400');
      }
    });

    arenaExplanationText.textContent = `⏱️ Time Expired! ${q.explanation}`;
    arenaExplanationBox.classList.remove('hidden');

    const isLast = currentQuestionIndex === currentModule.questions.length - 1;
    btnArenaNextText.textContent = isLast ? "Complete Mission & Debrief" : "Next Question";
    btnArenaNext.classList.remove('hidden');
  }

  function handleNextQuestion() {
    audio.clickSound();
    if (currentQuestionIndex < currentModule.questions.length - 1) {
      currentQuestionIndex++;
      loadQuestion();
    } else {
      finishMission();
    }
  }

  // ==================== RESULTS SCREEN (MISSION DEBRIEF) ====================
  function finishMission() {
    clearInterval(questionTimerInterval);
    audio.fanfareSound();

    const totalQ = currentModule.questions.length;
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQ) * 100);

    // Calculate stars
    let stars = 0;
    if (percentage === 100) stars = 3;
    else if (percentage >= 80) stars = 2;
    else if (percentage >= 60) stars = 1;

    // Update user stats
    userStats.totalXp += sessionXp;
    userStats.currentStreak = currentStreak;

    const modId = currentModule.id;
    const existing = userStats.modules[modId] || { bestScore: 0, attempts: 0, stars: 0 };
    userStats.modules[modId] = {
      bestScore: Math.max(existing.bestScore, correctCount),
      lastScore: correctCount,
      attempts: existing.attempts + 1,
      stars: Math.max(existing.stars, stars)
    };

    // Check newly unlocked badges
    const newBadges = checkAllBadges();
    saveUserStats();

    // Render results view
    renderResultsView(correctCount, totalQ, percentage, sessionXp, newBadges);
    showView('results');
  }

  function renderResultsView(score, total, percentage, earnedXp, newBadges) {
    resultsModuleTitle.textContent = currentModule.title;
    resultsScoreDisplay.textContent = `${score} / ${total}`;
    resultsScorePct.textContent = `${percentage}% Accuracy`;
    resultsXpEarned.textContent = `+${earnedXp} XP Awarded`;

    resultsAccuracyPill.textContent = `${score} Correct • ${total - score} Incorrect`;
    resultsStreakPill.textContent = `Best Streak: ${userStats.maxStreak}x`;

    // Dynamic Rank Title
    if (percentage === 100) {
      resultsRankPill.textContent = "🏆 QUANTUM ARCHITECT (100% PERFECT RESONANCE)";
      resultsRankPill.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
    } else if (percentage >= 80) {
      resultsRankPill.textContent = "⚛️ CRYO MASTER (ADVANCED COHERENCE)";
      resultsRankPill.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]";
    } else if (percentage >= 60) {
      resultsRankPill.textContent = "❄️ CRYO SPECIALIST (QUALIFIED FOR RUNTIME)";
      resultsRankPill.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]";
    } else {
      resultsRankPill.textContent = "⚠️ THERMAL NOISE DETECTED (RE-CALIBRATE)";
      resultsRankPill.className = "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
    }

    // New Badge announcement
    if (newBadges.length > 0) {
      resultsNewBadgeNotice.classList.remove('hidden');
      newBadgeName.textContent = newBadges.map(b => `${b.icon} ${b.title}`).join(', ');
    } else {
      resultsNewBadgeNotice.classList.add('hidden');
    }

    resultsFilter = 'all';
    renderReviewQuestions();
  }

  function renderReviewQuestions() {
    reviewQuestionsList.innerHTML = '';
    const questions = currentModule.questions;
    const optionLetters = ['A', 'B', 'C', 'D'];

    questions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      const isCorrect = ans ? ans.isCorrect : false;

      if (resultsFilter === 'mistakes' && isCorrect) return;

      const card = document.createElement('div');
      card.className = `p-6 rounded-2xl border backdrop-blur-md transition-all ${
        isCorrect
          ? 'bg-slate-900/60 border-emerald-500/30'
          : 'bg-slate-900/60 border-rose-500/30'
      }`;

      let optionsMarkup = '';
      q.options.forEach((opt, oIdx) => {
        const isUserChoice = ans && ans.selected === oIdx;
        const isTargetCorrect = oIdx === q.correctIndex;

        let style = 'bg-slate-800/40 border-slate-700/40 text-slate-400';
        let badgeStyle = 'bg-slate-800 text-slate-400';
        let tag = '';

        if (isTargetCorrect) {
          style = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold';
          badgeStyle = 'bg-emerald-500 text-slate-950';
          tag = '<span class="text-xs font-bold text-emerald-400 ml-auto">✓ Verified Solution</span>';
        } else if (isUserChoice && !isTargetCorrect) {
          style = 'bg-rose-950/60 border-rose-500/60 text-rose-200 font-semibold';
          badgeStyle = 'bg-rose-500 text-white';
          tag = '<span class="text-xs font-bold text-rose-400 ml-auto">✗ Your Input</span>';
        }

        optionsMarkup += `
          <div class="p-3 rounded-xl border flex items-center gap-3 text-sm ${style}">
            <span class="w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 ${badgeStyle}">
              ${optionLetters[oIdx]}
            </span>
            <span>${escapeHtml(opt)}</span>
            ${tag}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md ${
              isCorrect
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
            }">
              Question ${idx + 1}
            </span>
            <span class="text-xs font-semibold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}">
              ${isCorrect ? '✓ Correct' : ans && ans.selected === null ? '⏱️ Timed Out' : '✗ Incorrect'}
            </span>
          </div>
          <span class="text-xs font-mono text-slate-500">
            ${ans ? `${ans.timeSpent}s response` : ''}
          </span>
        </div>

        <h4 class="text-base font-semibold text-white mb-4 leading-relaxed">
          ${escapeHtml(q.question)}
        </h4>

        <div class="space-y-2 mb-4">
          ${optionsMarkup}
        </div>

        <div class="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs sm:text-sm text-cyan-200/90 leading-relaxed">
          <strong class="text-cyan-300 block mb-1 uppercase tracking-wider font-mono text-xs">Scientific Context & Explanation:</strong>
          ${escapeHtml(q.explanation)}
        </div>
      `;

      reviewQuestionsList.appendChild(card);
    });

    if (reviewQuestionsList.children.length === 0) {
      reviewQuestionsList.innerHTML = `
        <div class="py-12 text-center text-slate-400">
          <p class="text-base font-bold text-emerald-400">Zero Mistakes on this Run! 🌟</p>
          <p class="text-xs text-slate-400 mt-1">Every quantum question was answered with 100% precision.</p>
        </div>
      `;
    }
  }

  // ==================== BADGE ACHIEVEMENTS ====================
  function checkAllBadges() {
    const newlyUnlocked = [];
    BADGES.forEach(badge => {
      if (!userStats.unlockedBadges.includes(badge.id)) {
        if (badge.check(userStats)) {
          userStats.unlockedBadges.push(badge.id);
          newlyUnlocked.push(badge);
        }
      }
    });
    return newlyUnlocked;
  }

  function openBadgesModal() {
    audio.clickSound();
    badgesListContainer.innerHTML = '';
    BADGES.forEach(b => {
      const isUnlocked = userStats.unlockedBadges.includes(b.id);
      const card = document.createElement('div');
      card.className = `p-4 rounded-2xl border flex items-center gap-4 transition-all ${
        isUnlocked
          ? 'bg-slate-800/80 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          : 'bg-slate-900/40 border-slate-800 opacity-50'
      }`;

      card.innerHTML = `
        <div class="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
          ${b.icon}
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-sm ${isUnlocked ? 'text-cyan-300' : 'text-slate-400'}">
              ${b.title}
            </h4>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded ${
              isUnlocked ? 'bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-500'
            }">
              ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">${b.description}</p>
        </div>
      `;

      badgesListContainer.appendChild(card);
    });

    modalBadges.classList.remove('hidden');
  }

  function closeBadgesModal() {
    audio.clickSound();
    modalBadges.classList.add('hidden');
  }

  // ==================== FX: PARTICLES & SCREEN SHAKE ====================
  function triggerScreenShake() {
    quizArenaContainer.classList.add('animate-shake');
    setTimeout(() => {
      quizArenaContainer.classList.remove('animate-shake');
    }, 450);
  }

  let particles = [];
  function setupCanvas() {
    if (!particleCanvas) return;
    const ctx = particleCanvas.getContext('2d');
    function resize() {
      particleCanvas.width = window.innerWidth;
      particleCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Idle ambient quantum particles
    const ambientCount = 35;
    const ambientParticles = [];
    for (let i = 0; i < ambientCount; i++) {
      ambientParticles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(6,182,212,' : 'rgba(168,85,247,'
      });
    }

    function loop() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

      // Render ambient nodes & filaments
      ctx.lineWidth = 0.5;
      for (let i = 0; i < ambientParticles.length; i++) {
        const p = ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = particleCanvas.width;
        if (p.x > particleCanvas.width) p.x = 0;
        if (p.y < 0) p.y = particleCanvas.height;
        if (p.y > particleCanvas.height) p.y = 0;

        ctx.fillStyle = p.color + '0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < ambientParticles.length; j++) {
          const p2 = ambientParticles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(6,182,212,${0.15 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Render burst particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.size *= 0.98;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestAnimationFrame(loop);
    }
    loop();
  }

  function triggerSparks() {
    if (!particleCanvas) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        r: 6,
        g: 245,
        b: 255,
        alpha: 1.0
      });
    }
  }

  // ==================== NAVIGATION & VIEW TOGGLING ====================
  function showView(viewName) {
    viewDashboard.classList.add('hidden');
    viewQuiz.classList.add('hidden');
    viewResults.classList.add('hidden');

    if (viewName === 'dashboard') {
      viewDashboard.classList.remove('hidden');
      renderDashboard();
    } else if (viewName === 'quiz') {
      viewQuiz.classList.remove('hidden');
    } else if (viewName === 'results') {
      viewResults.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== EVENT LISTENERS ====================
  function setupEventListeners() {
    // Sound Toggle
    btnSoundToggle.addEventListener('click', () => {
      audio.toggleMute();
      updateSoundIcon();
      if (!audio.isMuted) audio.clickSound();
    });

    // Badges Modal
    btnOpenBadges.addEventListener('click', openBadgesModal);
    btnCloseBadges.addEventListener('click', closeBadgesModal);

    // Search filter
    if (moduleSearchInput) {
      moduleSearchInput.addEventListener('input', () => {
        renderDashboard();
      });
    }

    // Quiz Navigation
    btnArenaNext.addEventListener('click', handleNextQuestion);
    btnAbortMission.addEventListener('click', () => {
      audio.clickSound();
      if (confirm('Abort quantum mission and return to Mission Control? Progress for this run will be discarded.')) {
        clearInterval(questionTimerInterval);
        showView('dashboard');
      }
    });

    // Results Actions
    btnReplayMission.addEventListener('click', () => {
      audio.clickSound();
      startMission(currentModule.id);
    });

    btnReturnControl.addEventListener('click', () => {
      audio.clickSound();
      showView('dashboard');
    });

    filterMistakesBtn.addEventListener('click', () => {
      audio.clickSound();
      resultsFilter = 'mistakes';
      filterMistakesBtn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
      filterAllReviewBtn.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white";
      renderReviewQuestions();
    });

    filterAllReviewBtn.addEventListener('click', () => {
      audio.clickSound();
      resultsFilter = 'all';
      filterAllReviewBtn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
      filterMistakesBtn.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 hover:text-white";
      renderReviewQuestions();
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      if (!viewQuiz.classList.contains('hidden')) {
        const k = e.key.toUpperCase();
        if (k === 'A' || k === '1') selectOptionByKey(0);
        else if (k === 'B' || k === '2') selectOptionByKey(1);
        else if (k === 'C' || k === '3') selectOptionByKey(2);
        else if (k === 'D' || k === '4') selectOptionByKey(3);
        else if (e.key === 'Enter' || e.key === 'ArrowRight') {
          if (!btnArenaNext.classList.contains('hidden')) {
            handleNextQuestion();
          }
        }
      }
    });
  }

  function selectOptionByKey(idx) {
    const btns = arenaOptionsGrid.querySelectorAll('button');
    if (btns && btns[idx] && !btns[idx].disabled) {
      handleOptionChosen(idx);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
