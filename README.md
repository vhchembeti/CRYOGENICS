# Cryogenic Quantum Lab ⚛️❄️

A gamified quiz web application for studying **Cryogenic Electronics and Quantum Computing**, featuring **13 interactive mission modules** (10 questions each, 130 questions in total), arcade-style visual and synthesized audio feedback, dynamic 30-second countdown timers, streak multipliers, rank leveling, and the **Quantum Armory** badge achievement system.

---

## ⚡ Live Access & Running

The application is already running locally on:
👉 **[http://localhost:3000](http://localhost:3000)**

### Offline / Direct Access:
You can also open [`quiz-app/index.html`](file:///c:/Users/DYNABOOK%20X40-K/Documents/climet/quiz-app/index.html) directly in any browser (Chrome, Edge, Firefox, Safari) with **zero server or backend dependencies required**.

---

## 🔬 13 Mission Modules (130 Questions Total)

All questions, options, verified answer keys, and detailed scientific explanations are embedded directly:

1. **MOD-01: Week 1: Quantum Foundations** (Planck hypothesis, photoelectric effect, de Broglie, Heisenberg uncertainty, Schrödinger equation)
2. **MOD-02: Week 2: Cryogenic CMOS & Body Effect** (Reduced thermal noise, mobility boost, threshold shifts, body effect, DIBL, velocity saturation)
3. **MOD-03: Week 3: Freeze-Out & Scattering** (Cryostat radiation shielding, incomplete dopant ionization, Fermi levels, Boltzmann approximation)
4. **MOD-04: Week 4: Varshni Model & Bandgap** (Bandgap temperature dependence, impurity scattering, depletion charge scaling)
5. **MOD-05: Week 5: Poole-Frenkel & Subthreshold** (Field-assisted ionization, subthreshold swing steepening, ON-current boost, dwell time)
6. **MOD-06: Week 6: Scattering & Ballistic Transport** (Ionized impurity vs surface roughness, Matthiessen's rule, backscattering model, FinFETs)
7. **MOD-07: Week 7: C-V Characteristics & Noise** (MOS C-V profiling, fixed oxide charge, interface trap dispersion, 1/f flicker noise)
8. **MOD-08: Week 8: Cryo-LNAs & ADCs** (Low-noise amplifiers, ENOB, SNDR, cryo-multiplexers, circulators, cooling power limits)
9. **MOD-09: Week 9: Quantum Fundamentals & Entanglement** (Superposition, Hadamard & CNOT gates, Bell pairs, teleportation, no-cloning theorem, QKD)
10. **MOD-10: Week 10: Bloch Sphere & Multiplexing** (State vector geometry, microwave pulses, Single Electron Transistors (SET), FDMA/TDMA/SDMA)
11. **MOD-11: Week 11: Quantum Metrology & Readout** (Quantum sensing precision, SPAD Geiger mode, spin-to-charge conversion, QPC readout)
12. **MOD-12: Week 12: Advanced Transport & S-Parameters** (FDSOI subthreshold saturation, Smith charts, NEGF quantum transport, f_MAX, ZTC bias point)
13. **MOD-13: Week 13: Comprehensive Practice Assessment** (Capstone synthesis across all cryogenic and quantum domains)

---

## 🎮 Gamification & Audio Features

- **Cyberpunk Quantum Aesthetic**: Deep space dark mode (`#060913`) with glowing cyan/purple borders, glassmorphic HUD cards, and an interactive background canvas with drifting quantum filaments.
- **Web Audio API Synthesizer**: Zero audio file dependencies! Synthesizes futuristic quantum chimes, error buzzes, ascending streak flourishes, and fanfare natively in your browser. (Includes an Audio Mute/Unmute toggle).
- **30-Second Countdown Timer**: Animated progress bar that transitions from glowing cyan (>12s) to amber (6-12s) to pulsing laser rose (<5s).
- **Visual & Physical FX**:
  - ✨ Screen shake on incorrect input or timeout.
  - 💥 Cyber particle spark bursts on correct solutions.
- **Dynamic Streak Multipliers**:
  - `1.0x` (Base) → `1.5x` (2+ streak) → `2.0x` (3+ streak) → `3.0x Quantum Surge` (5+ streak).
- **Player XP & Rank Levels**:
  - Level 1: Quantum Initiate
  - Level 2: Thermal Noise Suppressor
  - Level 3: Cryo-CMOS Specialist
  - Level 4: Freeze-Out Investigator
  - Level 5: Superposition Engineer
  - Level 6: Entanglement Navigator
  - Level 7: Qubit Architect
  - Level 8: Absolute Zero Vanguard
- **Quantum Trophy Room (7 Unlockable Badges)**:
  - ❄️ *Absolute Zero* (Score 10/10 on any module)
  - ⚡ *Quantum Surge* (Hit a 5x streak)
  - ⏱️ *Planck Speed* (Correct answer in under 5 seconds)
  - 🧪 *Cryo Researcher* (Complete 5 distinct modules)
  - 🛡️ *Noise Suppressor* (Score 8+ on Week 8 Cryo-LNAs)
  - ⚛️ *Bell State Master* (Score 10/10 on Week 9 Entanglement)
  - 🌌 *Universal Architect* (Master all 13 modules)
- **Local Storage Persistence**: All XP, streaks, high scores, stars, and unlocked badges persist in your browser across sessions.
