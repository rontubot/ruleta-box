// Admin Console Controller
const socket = io();

// UI Elements
const matchModeSelect = document.getElementById('matchModeSelect');
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

// Save match configuration
saveConfigBtn.addEventListener('click', () => {
  const mode = matchModeSelect.value;
  const redFighter = redFighterInput.value.trim() || 'Esquina Roja';
  const blueFighter = blueFighterInput.value.trim() || 'Esquina Azul';

  socket.emit('update_config', { mode, redFighter, blueFighter });
});

matchModeSelect.addEventListener('change', () => {
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
    adminSpinCountdown.textContent = '15s';
  }

  // Bonus buttons text with active rule points
  const activePts = state.currentRule ? state.currentRule.pts : 10;
  redBonusBtn.textContent = `⭐ + Bono Ruleta (+${activePts})`;
  blueBonusBtn.textContent = `⭐ + Bono Ruleta (+${activePts})`;
  bothBonusBtn.textContent = `🤝 Ambos Cumplieron el Reto (+${activePts} a Cada Uno)`;

  // Rule preview
  if (state.currentRule) {
    adminRuleTitle.textContent = `${state.currentRule.icon || '🥊'} ${state.currentRule.name}`;
    adminRuleBadge.textContent = state.currentRule.pts > 0 ? `+${state.currentRule.pts} PTS` : 'RELEVO';
    adminRuleDesc.textContent = state.currentRule.description;
  } else if (state.phase === 'rest') {
    adminRuleTitle.textContent = '⏳ Minuto de Descanso';
    adminRuleBadge.textContent = 'PAUSA';
    adminRuleDesc.textContent = 'Descanso obligatorio entre asaltos. Al llegar a 10s suena "Segundos Afuera".';
  } else if (state.phase === 'finished') {
    adminRuleTitle.textContent = '🏆 Combate Finalizado';
    adminRuleBadge.textContent = 'FIN';
    adminRuleDesc.textContent = 'Define el ganador en el panel de veredicto y haz clic en "Proclamar Ganador al Stream".';
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
