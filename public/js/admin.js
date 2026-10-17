// Admin Console Controller
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// UI Elements
const currentServerDomain = document.getElementById('currentServerDomain');
const adminConnBadge = document.getElementById('adminConnBadge');

if (currentServerDomain) {
  currentServerDomain.textContent = window.location.origin;
}

socket.on('connect', () => {
  if (adminConnBadge) {
    adminConnBadge.style.background = 'rgba(46, 213, 115, 0.2)';
    adminConnBadge.style.color = '#2ed573';
    adminConnBadge.textContent = '🟢 SINCRONIZADO';
  }
});

socket.on('disconnect', () => {
  if (adminConnBadge) {
    adminConnBadge.style.background = 'rgba(255, 71, 87, 0.3)';
    adminConnBadge.style.color = '#ff4757';
    adminConnBadge.textContent = '🔴 RECONECTANDO...';
  }
});

socket.on('connect_error', () => {
  if (adminConnBadge) {
    adminConnBadge.style.background = 'rgba(255, 71, 87, 0.3)';
    adminConnBadge.style.color = '#ff4757';
    adminConnBadge.textContent = '⚠️ SIN CONEXIÓN';
  }
});

const matchModeSelect = document.getElementById('matchModeSelect');
const maxRoundsSelect = document.getElementById('maxRoundsSelect');
const redFighterInput = document.getElementById('redFighterInput');
const blueFighterInput = document.getElementById('blueFighterInput');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const adminAudioBtn = document.getElementById('adminAudioBtn');

const adminRoundTag = document.getElementById('adminRoundTag');
const adminPhaseBadge = document.getElementById('adminPhaseBadge');
const adminTimerDigits = document.getElementById('adminTimerDigits');

const startCombatBtn = document.getElementById('startCombatBtn');
const pauseCombatBtn = document.getElementById('pauseCombatBtn');
const resumeCombatBtn = document.getElementById('resumeCombatBtn');
const restartRoundBtn = document.getElementById('restartRoundBtn');

const protectionCountBtn = document.getElementById('protectionCountBtn');
const cancelProtectionBtn = document.getElementById('cancelProtectionBtn');
const recoveryTimeBtn = document.getElementById('recoveryTimeBtn');
const customAlertBtn = document.getElementById('customAlertBtn');

const adminRedName = document.getElementById('adminRedName');
const adminBlueName = document.getElementById('adminBlueName');
const adminRedScore = document.getElementById('adminRedScore');
const adminBlueScore = document.getElementById('adminBlueScore');
const adminRedHits = document.getElementById('adminRedHits');
const adminBlueHits = document.getElementById('adminBlueHits');
const adminRedBonus = document.getElementById('adminRedBonus');
const adminBlueBonus = document.getElementById('adminBlueBonus');
const adminRedFouls = document.getElementById('adminRedFouls');
const adminBlueFouls = document.getElementById('adminBlueFouls');

const redBonusBtn = document.getElementById('redBonusBtn');
const blueBonusBtn = document.getElementById('blueBonusBtn');
const bothBonusBtn = document.getElementById('bothBonusBtn');

const adminRuleTitle = document.getElementById('adminRuleTitle');
const adminRuleBadge = document.getElementById('adminRuleBadge');
const adminRuleDesc = document.getElementById('adminRuleDesc');
const adminSpinCountdown = document.getElementById('adminSpinCountdown');
const adminEventTimeLeft = document.getElementById('adminEventTimeLeft');
const adminEventProgressFill = document.getElementById('adminEventProgressFill');
const forceSpinBtn = document.getElementById('forceSpinBtn');
const forceRuleBtn = document.getElementById('forceRuleBtn');
const specificRuleSelect = document.getElementById('specificRuleSelect');

const pickRedBtn = document.getElementById('pickRedBtn');
const pickBlueBtn = document.getElementById('pickBlueBtn');
const pickDrawBtn = document.getElementById('pickDrawBtn');
const victoryMethodSelect = document.getElementById('victoryMethodSelect');
const verdictNotesInput = document.getElementById('verdictNotesInput');
const proclaimWinnerBtn = document.getElementById('proclaimWinnerBtn');
const hideWinnerBtn = document.getElementById('hideWinnerBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const eventLogList = document.getElementById('eventLogList');

let selectedWinner = null;
let currentServerState = null;

// Populate specific rules dropdown
function updateRuleSelectOptions(mode) {
  const rules = getRulesForMode(mode);
  specificRuleSelect.innerHTML = '';
  rules.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.icon || '🥊'} ${r.name} (${r.pts > 0 ? '+' + r.pts + ' pts' : 'Relevo'})`;
    specificRuleSelect.appendChild(opt);
  });
}

// Audio Test
adminAudioBtn.addEventListener('click', () => {
  sounds.init();
  sounds.playBell();
});

// Copy OBS URL Button
const copyObsLinkBtn = document.getElementById('copyObsLinkBtn');
if (copyObsLinkBtn) {
  copyObsLinkBtn.addEventListener('click', () => {
    const obsUrl = `${window.location.origin}/overlay?obs=1`;
    copyToClipboard(obsUrl, copyObsLinkBtn, '✅ ¡URL OBS Copiada!', '📋 Copiar URL para OBS');
  });
}

// Copy TV URL Button
const copyTvLinkBtn = document.getElementById('copyTvLinkBtn');
if (copyTvLinkBtn) {
  copyTvLinkBtn.addEventListener('click', () => {
    const tvUrl = `${window.location.origin}/tv`;
    copyToClipboard(tvUrl, copyTvLinkBtn, '✅ ¡Link TV Copiado!', '📺 Copiar URL para TV');
  });
}

// Copy Share Admin URL Button
const copyShareAdminBtn = document.getElementById('copyShareAdminBtn');
if (copyShareAdminBtn) {
  copyShareAdminBtn.addEventListener('click', () => {
    const adminUrl = `${window.location.origin}/admin`;
    copyToClipboard(adminUrl, copyShareAdminBtn, '✅ ¡Link Admin Copiado!', '📋 Compartir Enlace Admin');
  });
}

function copyToClipboard(text, btnEl, successText, defaultText) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      btnEl.textContent = successText;
      setTimeout(() => { btnEl.textContent = defaultText; }, 2500);
    }).catch(() => {
      prompt('Copia este enlace para el otro dispositivo:', text);
    });
  } else {
    prompt('Copia este enlace para el otro dispositivo:', text);
  }
}

// Save match configuration
saveConfigBtn.addEventListener('click', () => {
  const mode = matchModeSelect.value;
  const maxRounds = maxRoundsSelect ? Number(maxRoundsSelect.value) : (mode === 'tag_team' ? 5 : 3);
  const redFighter = redFighterInput.value.trim() || 'Esquina Roja';
  const blueFighter = blueFighterInput.value.trim() || 'Esquina Azul';

  socket.emit('update_config', { mode, maxRounds, redFighter, blueFighter });
});

matchModeSelect.addEventListener('change', () => {
  if (matchModeSelect.value === 'tag_team') {
    if (maxRoundsSelect) maxRoundsSelect.value = '5';
  } else {
    if (maxRoundsSelect) maxRoundsSelect.value = '3';
  }
  updateRuleSelectOptions(matchModeSelect.value);
});

// Timer & Combat controls
startCombatBtn.addEventListener('click', () => socket.emit('start_combat'));
pauseCombatBtn.addEventListener('click', () => socket.emit('pause_combat'));
resumeCombatBtn.addEventListener('click', () => socket.emit('resume_combat'));
restartRoundBtn.addEventListener('click', () => {
  if (confirm('¿Reiniciar el round actual a 1:30?')) {
    socket.emit('restart_round');
  }
});

function jumpToRound(roundNum) {
  if (confirm(`¿Cambiar manualmente al Round ${roundNum}?`)) {
    socket.emit('set_round', roundNum);
  }
}

// Referee & Safety Protocols
protectionCountBtn.addEventListener('click', () => {
  socket.emit('start_protection_count');
});

cancelProtectionBtn.addEventListener('click', () => {
  socket.emit('stop_protection_count');
});

recoveryTimeBtn.addEventListener('click', () => {
  socket.emit('start_recovery_time');
});

customAlertBtn.addEventListener('click', () => {
  const text = prompt('Escribe el aviso para mostrar en pantalla:', '¡ÁRBITRO DETIENE EL COMBATE!');
  if (text) {
    socket.emit('banner_alert', {
      title: 'AVISO DEL ÁRBITRO',
      message: text,
      type: 'warning'
    });
  }
});

// Scoring actions
function addHit(side) {
  socket.emit('award_points', { side, type: 'hit', delta: 1 });
}

function awardBonus(side) {
  socket.emit('award_rule_bonus', { side });
}

function adjustPoints(side, delta) {
  socket.emit('award_points', { side, type: 'adjust', delta });
}

function recordFoul(side) {
  const rival = side === 'red' ? 'Azul' : 'Roja';
  if (confirm(`¿Registrar falta para ${side === 'red' ? 'Rojo' : 'Azul'}? Se otorgarán +5 puntos reglamentarios a la esquina ${rival}.`)) {
    socket.emit('award_points', { side, type: 'foul', delta: 0 });
  }
}

// Roulette triggers
forceSpinBtn.addEventListener('click', () => {
  socket.emit('trigger_spin', null);
});

forceRuleBtn.addEventListener('click', () => {
  const ruleId = specificRuleSelect.value;
  socket.emit('trigger_spin', ruleId);
});

// Winner Selection
function selectWinner(winner) {
  selectedWinner = winner;
  pickRedBtn.className = 'pick-winner-btn' + (winner === 'red' ? ' selected-red' : '');
  pickBlueBtn.className = 'pick-winner-btn' + (winner === 'blue' ? ' selected-blue' : '');
  pickDrawBtn.className = 'pick-winner-btn' + (winner === 'draw' ? ' selected-draw' : '');
}

proclaimWinnerBtn.addEventListener('click', () => {
  if (!selectedWinner) {
    alert('Por favor selecciona primero al ganador (Rojo, Azul o Empate).');
    return;
  }
  const method = victoryMethodSelect.value;
  const notes = verdictNotesInput.value.trim();

  socket.emit('proclaim_winner', {
    winner: selectedWinner,
    method,
    notes
  });
});

hideWinnerBtn.addEventListener('click', () => {
  socket.emit('clear_winner');
});

resetAllBtn.addEventListener('click', () => {
  if (confirm('¿ATENCIÓN: Quieres reiniciar todo el combate desde cero (marcadores, rounds y tiempos)?')) {
    socket.emit('reset_all');
  }
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Update Admin UI
socket.on('state_update', (state) => {
  currentServerState = state;

  // Mode and form inputs (only fill if empty or on init)
  if (!redFighterInput.value) redFighterInput.value = state.redFighter;
  if (!blueFighterInput.value) blueFighterInput.value = state.blueFighter;
  if (matchModeSelect.value !== state.mode) {
    matchModeSelect.value = state.mode;
    updateRuleSelectOptions(state.mode);
  }
  if (maxRoundsSelect && state.maxRounds) {
    maxRoundsSelect.value = String(state.maxRounds);
  }

  // Names & Scores
  adminRedName.textContent = state.redFighter;
  adminBlueName.textContent = state.blueFighter;
  adminRedScore.textContent = state.scores.red.total;
  adminBlueScore.textContent = state.scores.blue.total;
  adminRedHits.textContent = state.scores.red.hits;
  adminBlueHits.textContent = state.scores.blue.hits;
  adminRedBonus.textContent = state.scores.red.bonus;
  adminBlueBonus.textContent = state.scores.blue.bonus;
  adminRedFouls.textContent = state.scores.red.fouls;
  adminBlueFouls.textContent = state.scores.blue.fouls;

  // Round status
  adminRoundTag.textContent = `ROUND ${state.currentRound} / ${state.maxRounds}`;
  adminPhaseBadge.className = `status-phase-badge ${state.phase}`;
  
  if (state.phase === 'fighting') {
    adminPhaseBadge.textContent = 'EN COMBATE';
    adminTimerDigits.textContent = formatTime(state.roundTimeLeft);
    adminSpinCountdown.textContent = `${state.rouletteTimeLeft}s`;
  } else if (state.phase === 'paused') {
    adminPhaseBadge.textContent = 'PAUSADO';
    adminTimerDigits.textContent = formatTime(state.roundTimeLeft);
    adminSpinCountdown.textContent = `${state.rouletteTimeLeft}s (Pausa)`;
  } else if (state.phase === 'rest') {
    adminPhaseBadge.textContent = 'DESCANSO';
    adminTimerDigits.textContent = formatTime(state.restTimeLeft);
    adminSpinCountdown.textContent = 'En pausa';
  } else if (state.phase === 'protection') {
    adminPhaseBadge.textContent = '8-COUNT';
    adminTimerDigits.textContent = `00:0${state.protectionCount}`;
    adminSpinCountdown.textContent = 'En pausa';
  } else if (state.phase === 'finished') {
    adminPhaseBadge.textContent = 'FINALIZADO';
    adminTimerDigits.textContent = '00:00';
    adminSpinCountdown.textContent = 'Finalizado';

    // Auto suggest winner if not already chosen
    if (!selectedWinner) {
      if (state.scores.red.total > state.scores.blue.total) {
        selectWinner('red');
      } else if (state.scores.blue.total > state.scores.red.total) {
        selectWinner('blue');
      } else {
        selectWinner('draw');
      }
    }
  } else {
    adminPhaseBadge.textContent = 'INACTIVO';
    adminTimerDigits.textContent = '01:30';
    adminSpinCountdown.textContent = '30s';
  }

  // Bonus buttons text with active rule points
  const activePts = state.currentRule ? state.currentRule.pts : 10;
  const target = state.currentRule ? state.currentRule.targetTeam : null;

  if (target === 'red') {
    redBonusBtn.textContent = `⭐ +${activePts} ROJO (${state.currentRule.name})`;
    redBonusBtn.style.opacity = '1';
    redBonusBtn.style.border = '2px solid #fff';
    blueBonusBtn.textContent = `⭐ + Bono Azul (+${activePts})`;
    blueBonusBtn.style.opacity = '0.5';
    blueBonusBtn.style.border = 'none';
    bothBonusBtn.style.display = 'none';
  } else if (target === 'blue') {
    blueBonusBtn.textContent = `⭐ +${activePts} AZUL (${state.currentRule.name})`;
    blueBonusBtn.style.opacity = '1';
    blueBonusBtn.style.border = '2px solid #fff';
    redBonusBtn.textContent = `⭐ + Bono Rojo (+${activePts})`;
    redBonusBtn.style.opacity = '0.5';
    redBonusBtn.style.border = 'none';
    bothBonusBtn.style.display = 'none';
  } else {
    redBonusBtn.textContent = `⭐ + Bono Ruleta (+${activePts})`;
    redBonusBtn.style.opacity = '1';
    redBonusBtn.style.border = 'none';
    blueBonusBtn.textContent = `⭐ + Bono Ruleta (+${activePts})`;
    blueBonusBtn.style.opacity = '1';
    blueBonusBtn.style.border = 'none';
    bothBonusBtn.style.display = 'block';
    bothBonusBtn.textContent = `🤝 Ambos Cumplieron el Reto (+${activePts} a Cada Uno)`;
  }

  // Rule preview & Persistent Event Timer Bar (Always visible in Admin)
  if (state.currentRule && state.ruleTimeLeft > 0 && (state.phase === 'fighting' || state.phase === 'paused')) {
    adminRuleTitle.textContent = `${state.currentRule.icon || '🥊'} ${state.currentRule.fullName || state.currentRule.name}`;
    adminRuleBadge.textContent = state.currentRule.pts > 0 ? `+${state.currentRule.pts} PTS` : 'RELEVO';
    adminRuleDesc.textContent = state.currentRule.description;

    if (adminEventTimeLeft && adminEventProgressFill) {
      adminEventTimeLeft.textContent = `⏳ ${state.ruleTimeLeft}s restantes`;
      const ruleDuration = state.ruleDuration || 30;
      const pct = (state.ruleTimeLeft / ruleDuration) * 100;
      adminEventProgressFill.style.width = `${pct}%`;
    }
  } else {
    if (adminEventTimeLeft && adminEventProgressFill) {
      adminEventTimeLeft.textContent = state.phase === 'fighting' ? `Próximo giro en ${state.rouletteTimeLeft}s` : 'Sin evento activo';
      adminEventProgressFill.style.width = '0%';
    }

    if (state.phase === 'rest') {
      adminRuleTitle.textContent = '⏳ Minuto de Descanso';
      adminRuleBadge.textContent = 'PAUSA';
      adminRuleDesc.textContent = 'Descanso obligatorio entre asaltos. Al llegar a 10s suena "Segundos Afuera".';
    } else if (state.phase === 'finished') {
      adminRuleTitle.textContent = '🏆 Combate Finalizado';
      adminRuleBadge.textContent = 'FIN';
      adminRuleDesc.textContent = 'Define el ganador en el panel de veredicto y haz clic en "Proclamar Ganador al Stream".';
    } else {
      adminRuleTitle.textContent = '🥊 Esperando inicio / siguiente giro';
      adminRuleBadge.textContent = 'RULETA';
      adminRuleDesc.textContent = 'Cada 30 segundos la ruleta gira automáticamente para cambiar las condiciones reglamentarias del combate.';
    }
  }

  // Event Log
  if (state.history && state.history.length > 0) {
    eventLogList.innerHTML = '';
    state.history.forEach(ev => {
      const li = document.createElement('li');
      li.className = 'event-log-item';
      li.innerHTML = `<span class="event-log-time">${ev.time}</span><span>${ev.text}</span>`;
      eventLogList.appendChild(li);
    });
  }
});

// Initialize options on load
updateRuleSelectOptions('1v1');
