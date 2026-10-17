// Stream Overlay Controller
const socket = io();

// DOM elements
const redScoreEl = document.getElementById('redScore');
const blueScoreEl = document.getElementById('blueScore');
const redHitsEl = document.getElementById('redHits');
const blueHitsEl = document.getElementById('blueHits');
const redBonusEl = document.getElementById('redBonus');
const blueBonusEl = document.getElementById('blueBonus');
const redFighterNameEl = document.getElementById('redFighterName');
const blueFighterNameEl = document.getElementById('blueFighterName');
const timerDigitsEl = document.getElementById('timerDigits');
const roundPillEl = document.getElementById('roundPill');
const roundProgressFillEl = document.getElementById('roundProgressFill');
const spinCountdownEl = document.getElementById('spinCountdown');
const activeRuleCardEl = document.getElementById('activeRuleCard');
const ruleCategoryEl = document.getElementById('ruleCategory');
const rulePointsBadgeEl = document.getElementById('rulePointsBadge');
const ruleTitleEl = document.getElementById('ruleTitle');
const ruleIconEl = document.getElementById('ruleIcon');
const ruleNameEl = document.getElementById('ruleName');
const ruleDescEl = document.getElementById('ruleDesc');
const ruleTimerFillEl = document.getElementById('ruleTimerFill');
const centerBannerAlertEl = document.getElementById('centerBannerAlert');
const bannerTitleEl = document.getElementById('bannerTitle');
const bannerDescEl = document.getElementById('bannerDesc');
const winnerModalEl = document.getElementById('winnerModal');
const winnerHeroNameEl = document.getElementById('winnerHeroName');
const winnerMethodBadgeEl = document.getElementById('winnerMethodBadge');
const winnerContentBoxEl = document.getElementById('winnerContentBox');
const recapRedNameEl = document.getElementById('recapRedName');
const recapBlueNameEl = document.getElementById('recapBlueName');
const recapRedPtsEl = document.getElementById('recapRedPts');
const recapBluePtsEl = document.getElementById('recapBluePts');
const recapRedBreakdownEl = document.getElementById('recapRedBreakdown');
const recapBlueBreakdownEl = document.getElementById('recapBlueBreakdown');
const audioToggleBtn = document.getElementById('audioToggle');
const audioIcon = document.getElementById('audioIcon');
const audioText = document.getElementById('audioText');

// Audio unlock
let audioEnabled = false;
function enableAudio() {
  audioEnabled = true;
  sounds.init();
  audioIcon.textContent = '🔊';
  audioText.textContent = 'Audio Activo';
  audioToggleBtn.style.opacity = '0.5';
}

audioToggleBtn.addEventListener('click', () => {
  sounds.init();
  if (sounds.ctx && sounds.ctx.state === 'suspended') {
    sounds.ctx.resume();
  }
  sounds.muted = !sounds.muted;
  if (sounds.muted) {
    audioIcon.textContent = '🔇';
    audioText.textContent = 'Mute';
  } else {
    enableAudio();
  }
});

// Auto enable audio on first click anywhere
window.addEventListener('click', () => {
  if (!audioEnabled) enableAudio();
}, { once: true });

// Canvas Roulette Wheel
const canvas = document.getElementById('rouletteWheel');
const ctx = canvas.getContext('2d');
let currentAngle = 0;
let isSpinning = false;
let currentRules = getRulesForMode('1v1');

function drawWheel(angle = 0) {
  const numSlices = currentRules.length;
  if (numSlices === 0) return;

  const sliceAngle = (2 * Math.PI) / numSlices;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSlices; i++) {
    const startA = angle + i * sliceAngle;
    const endA = startA + sliceAngle;
    const rule = currentRules[i];

    // Slice background
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startA, endA);
    ctx.closePath();
    ctx.fillStyle = rule.color || '#333';
    ctx.fill();

    // Slice border
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.stroke();

    // Slice text & icon
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startA + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;

    // Truncate name if too long for slice
    let displayName = rule.name;
    if (displayName.length > 13) displayName = displayName.substring(0, 11) + '..';

    ctx.fillText(`${rule.icon ? rule.icon.split(' ')[0] : '🥊'} ${displayName}`, radius - 20, 8);
    ctx.restore();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffd32a';
  ctx.stroke();
}

// Initial draw
drawWheel(currentAngle);

// Spin Animation Function
function animateSpin(targetRule, duration = 3500) {
  if (isSpinning) return;
  isSpinning = true;
  activeRuleCardEl.classList.add('spinning');

  const numSlices = currentRules.length;
  const sliceAngle = (2 * Math.PI) / numSlices;
  const targetIndex = currentRules.findIndex(r => r.id === targetRule.id);
  const safeTargetIndex = targetIndex >= 0 ? targetIndex : 0;

  // The pointer is at the TOP (angle = 3 * Math.PI / 2 or -Math.PI / 2)
  // We want the center of safeTargetIndex slice to align with top (-PI/2)
  // angle + safeTargetIndex * sliceAngle + sliceAngle/2 = 3 * PI / 2 (mod 2PI)
  const pointerAngle = (3 * Math.PI) / 2;
  const targetSliceMid = safeTargetIndex * sliceAngle + sliceAngle / 2;
  
  // Calculate final angle with at least 5-7 full spins
  const extraSpins = 6 * 2 * Math.PI;
  const normalizedCurrent = currentAngle % (2 * Math.PI);
  let finalAngle = pointerAngle - targetSliceMid;
  while (finalAngle < normalizedCurrent + extraSpins) {
    finalAngle += 2 * Math.PI;
  }

  const startAngle = currentAngle;
  const totalChange = finalAngle - startAngle;
  const startTime = performance.now();
  let lastTickAngle = startAngle;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    currentAngle = startAngle + totalChange * easeOut;

    // Sound tick on passing each slice
    if (Math.abs(currentAngle - lastTickAngle) >= sliceAngle * 0.8) {
      sounds.playTick();
      lastTickAngle = currentAngle;
    }

    drawWheel(currentAngle);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      currentAngle = finalAngle;
      drawWheel(currentAngle);
      isSpinning = false;
      activeRuleCardEl.classList.remove('spinning');
      sounds.playRuleSelected();
    }
  }

  requestAnimationFrame(step);
}

// Format seconds into MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Confetti Particle System
let confettiParticles = [];
let confettiAnimationId = null;

function startConfetti() {
  const cCanvas = document.getElementById('confettiCanvas');
  const cCtx = cCanvas.getContext('2d');
  cCanvas.width = window.innerWidth;
  cCanvas.height = window.innerHeight;

  confettiParticles = [];
  const colors = ['#ff1e56', '#00d2d3', '#ffd32a', '#2ed573', '#ffffff', '#ff9f43'];

  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * cCanvas.width,
      y: Math.random() * cCanvas.height - cCanvas.height,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8
    });
  }

  function renderConfetti() {
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    confettiParticles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;

      if (p.y > cCanvas.height) {
        p.y = -20;
        p.x = Math.random() * cCanvas.width;
      }

      cCtx.save();
      cCtx.translate(p.x, p.y);
      cCtx.rotate((p.rotation * Math.PI) / 180);
      cCtx.fillStyle = p.color;
      cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      cCtx.restore();
    });

    confettiAnimationId = requestAnimationFrame(renderConfetti);
  }

  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  renderConfetti();
}

function stopConfetti() {
  if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
  const cCanvas = document.getElementById('confettiCanvas');
  if (cCanvas) {
    const cCtx = cCanvas.getContext('2d');
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  }
}

// Banner alert display with timeout
let bannerTimeout = null;
function showBannerAlert(title, message, type = 'warning', durationMs = 5000) {
  bannerTitleEl.textContent = title;
  bannerDescEl.textContent = message;
  centerBannerAlertEl.className = `center-banner-alert ${type}`;
  centerBannerAlertEl.style.display = 'block';

  if (bannerTimeout) clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(() => {
    centerBannerAlertEl.style.display = 'none';
  }, durationMs);
}

// Update UI from server state
function updateOverlay(state) {
  // Mode & rules update if changed
  currentRules = getRulesForMode(state.mode);
  if (!isSpinning) {
    drawWheel(currentAngle);
  }

  // Fighters & Scores
  redFighterNameEl.textContent = state.redFighter || 'Esquina Roja';
  blueFighterNameEl.textContent = state.blueFighter || 'Esquina Azul';
  redScoreEl.textContent = state.scores.red.total;
  blueScoreEl.textContent = state.scores.blue.total;
  redHitsEl.textContent = state.scores.red.hits;
  blueHitsEl.textContent = state.scores.blue.hits;
  redBonusEl.textContent = state.scores.red.bonus;
  blueBonusEl.textContent = state.scores.blue.bonus;

  // Center Timer & Round
  roundPillEl.className = 'round-pill';
  timerDigitsEl.classList.remove('urgent');

  if (state.phase === 'fighting' || state.phase === 'paused') {
    roundPillEl.textContent = `ROUND ${state.currentRound} / ${state.maxRounds} ${state.phase === 'paused' ? '(PAUSA)' : ''}`;
    timerDigitsEl.textContent = formatTime(state.roundTimeLeft);
    const progress = (state.roundTimeLeft / state.roundDuration) * 100;
    roundProgressFillEl.style.width = `${progress}%`;
    if (state.roundTimeLeft <= 10 && state.roundTimeLeft > 0) {
      timerDigitsEl.classList.add('urgent');
    }
  } else if (state.phase === 'rest') {
    roundPillEl.classList.add('rest-mode');
    roundPillEl.textContent = `DESCANSO • R${state.currentRound}`;
    timerDigitsEl.textContent = formatTime(state.restTimeLeft);
    const progress = (state.restTimeLeft / state.restDuration) * 100;
    roundProgressFillEl.style.width = `${progress}%`;
    if (state.restTimeLeft <= 10) {
      timerDigitsEl.classList.add('urgent');
    }
  } else if (state.phase === 'protection') {
    roundPillEl.classList.add('protection-mode');
    roundPillEl.textContent = `CUENTA DE PROTECCIÓN`;
    timerDigitsEl.textContent = `00:0${state.protectionCount}`;
    roundProgressFillEl.style.width = `${(state.protectionCount / 8) * 100}%`;
  } else if (state.phase === 'finished') {
    roundPillEl.textContent = `COMBATE FINALIZADO`;
    timerDigitsEl.textContent = `00:00`;
    roundProgressFillEl.style.width = `0%`;
  } else {
    // idle
    roundPillEl.textContent = `LISTOS PARA EL ROUND 1`;
    timerDigitsEl.textContent = `01:30`;
    roundProgressFillEl.style.width = `100%`;
  }

  // Spin Countdown
  if (state.phase === 'fighting') {
    spinCountdownEl.textContent = `${state.rouletteTimeLeft}s`;
    const rProgress = (state.rouletteTimeLeft / state.rouletteInterval) * 100;
    ruleTimerFillEl.style.width = `${rProgress}%`;
  } else {
    spinCountdownEl.textContent = `--`;
    ruleTimerFillEl.style.width = `0%`;
  }

  // Active Rule Card
  if (state.currentRule) {
    activeRuleCardEl.classList.remove('hidden');
    ruleCategoryEl.textContent = `• ${state.currentRule.category || 'COMBATE'}`;
    rulePointsBadgeEl.textContent = state.currentRule.pts > 0 ? `+${state.currentRule.pts} PTS` : 'RELEVO';
    rulePointsBadgeEl.className = `rule-points-badge ${state.currentRule.pts === 0 ? 'zero' : ''}`;
    ruleIconEl.textContent = state.currentRule.icon || '🥊';
    ruleNameEl.textContent = state.currentRule.name;
    ruleDescEl.textContent = state.currentRule.description;
  } else if (state.phase === 'rest') {
    ruleCategoryEl.textContent = '• PAUSA REGLAMENTARIA';
    rulePointsBadgeEl.textContent = 'PAUSA';
    ruleIconEl.textContent = '⏳';
    ruleNameEl.textContent = 'Minuto de Descanso';
    ruleDescEl.textContent = 'Hidratación y táctica en esquinas. Los peleadores deben atender a sus entrenadores.';
    ruleTimerFillEl.style.width = '0%';
  } else if (state.phase === 'finished') {
    ruleCategoryEl.textContent = '• FIN DE LA PELEA';
    rulePointsBadgeEl.textContent = 'FINAL';
    ruleIconEl.textContent = '🏆';
    ruleNameEl.textContent = 'Esperando Decisión';
    ruleDescEl.textContent = 'Los 3 rounds reglamentarios han finalizado. Las tarjetas de puntuación se están evaluando.';
    ruleTimerFillEl.style.width = '0%';
  }

  // Winner Celebration Screen
  if (state.winnerDeclaration) {
    const win = state.winnerDeclaration;
    winnerHeroNameEl.textContent = win.winnerName;
    winnerMethodBadgeEl.textContent = win.method.toUpperCase();

    recapRedNameEl.textContent = state.redFighter;
    recapBlueNameEl.textContent = state.blueFighter;
    recapRedPtsEl.textContent = win.redScore;
    recapBluePtsEl.textContent = win.blueScore;
    recapRedBreakdownEl.textContent = `${win.redHits} Golpes / ${win.redBonus} Bonos`;
    recapBlueBreakdownEl.textContent = `${win.blueHits} Golpes / ${win.blueBonus} Bonos`;

    winnerContentBoxEl.className = `winner-content-box ${win.winner === 'red' ? 'red-win' : win.winner === 'blue' ? 'blue-win' : ''}`;
    winnerModalEl.style.display = 'flex';
    startConfetti();
  } else {
    winnerModalEl.style.display = 'none';
    stopConfetti();
  }
}

// Socket Events
socket.on('state_update', (state) => {
  updateOverlay(state);
});

socket.on('spin_started', (data) => {
  animateSpin(data.rule, data.duration);
});

socket.on('banner_alert', (data) => {
  showBannerAlert(data.title, data.message, data.type, 5000);
});

socket.on('sound_trigger', (type) => {
  if (type === 'bell') sounds.playBell();
  else if (type === 'triple_bell') sounds.playTripleBell();
  else if (type === 'tick') sounds.playTick();
  else if (type === 'warning') sounds.playWarning();
  else if (type === 'point') sounds.playPoint();
  else if (type === 'rule_selected') sounds.playRuleSelected();
  else if (type === 'victory') sounds.playVictory();
});
