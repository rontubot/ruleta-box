const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getRulesForMode, RULES_1V1, RULES_TAG_TEAM_EXTRA } = require('./public/js/rules.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// State Management
function createInitialState() {
  return {
    mode: '1v1', // '1v1' | 'tag_team'
    redFighter: 'Esquina Roja',
    blueFighter: 'Esquina Azul',
    phase: 'idle', // 'idle' | 'fighting' | 'paused' | 'rest' | 'protection' | 'finished'
    currentRound: 1,
    maxRounds: 3,
    roundDuration: 90,
    roundTimeLeft: 90,
    restDuration: 60,
    restTimeLeft: 60,
    rouletteInterval: 30,
    rouletteTimeLeft: 30,
    currentRule: null,
    rouletteSpinning: false,
    protectionCount: 0,
    protectionRunning: false,
    recoveryTimeLeft: 0,
    recoveryRunning: false,
    scores: {
      red: { total: 0, hits: 0, bonus: 0, fouls: 0 },
      blue: { total: 0, hits: 0, bonus: 0, fouls: 0 }
    },
    winnerDeclaration: null,
    bannerAlert: null,
    history: []
  };
}

let state = createInitialState();
let timerInterval = null;

function logEvent(text) {
  const time = new Date().toLocaleTimeString();
  state.history.unshift({ time, text });
  if (state.history.length > 50) state.history.pop();
}

function broadcastState() {
  io.emit('state_update', state);
}

function selectRandomRule() {
  const rules = getRulesForMode(state.mode);
  if (!rules || rules.length === 0) return null;
  // Try not to repeat the exact same rule if possible
  const filtered = rules.filter(r => !state.currentRule || r.id !== state.currentRule.id);
  const pool = filtered.length > 0 ? filtered : rules;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
}

function executeRouletteSpin(forcedRule = null) {
  const chosenRule = forcedRule || selectRandomRule();
  if (!chosenRule) return;

  state.rouletteSpinning = true;
  io.emit('spin_started', { rule: chosenRule, duration: 4000 });
  logEvent(`🎰 Giro de ruleta iniciado: ${chosenRule.name}`);

  setTimeout(() => {
    state.currentRule = chosenRule;
    state.rouletteSpinning = false;
    io.emit('spin_completed', { rule: chosenRule });
    broadcastState();
  }, 4000);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (state.phase === 'fighting') {
      if (state.roundTimeLeft > 0) {
        state.roundTimeLeft -= 1;
        state.rouletteTimeLeft -= 1;

        // Check roulette spin trigger
        if (state.roundTimeLeft > 5 && state.rouletteTimeLeft <= 0) {
          state.rouletteTimeLeft = state.rouletteInterval;
          executeRouletteSpin();
        }

        // Round ends
        if (state.roundTimeLeft <= 0) {
          handleRoundEnd();
        }
      }
      broadcastState();
    } else if (state.phase === 'rest') {
      if (state.restTimeLeft > 0) {
        state.restTimeLeft -= 1;

        if (state.restTimeLeft === 10) {
          state.bannerAlert = {
            title: '¡SEGUNDOS AFUERA!',
            message: 'Asistentes abandonar el ring. Protectores bucales listos.',
            type: 'warning'
          };
          io.emit('sound_trigger', 'warning');
          io.emit('banner_alert', state.bannerAlert);
          logEvent('⚠️ ¡Segundos Afuera! 10s para reanudar el combate.');
        }

        if (state.restTimeLeft <= 0) {
          handleRestEnd();
        }
      }
      broadcastState();
    } else if (state.phase === 'protection' && state.protectionRunning) {
      if (state.protectionCount > 0) {
        state.protectionCount -= 1;
        io.emit('sound_trigger', 'tick');
        if (state.protectionCount === 0) {
          state.protectionRunning = false;
          state.phase = 'paused';
          logEvent('⏱️ Cuenta de protección de 8 segundos completada.');
        }
      }
      broadcastState();
    } else if (state.recoveryRunning) {
      if (state.recoveryTimeLeft > 0) {
        state.recoveryTimeLeft -= 1;
        if (state.recoveryTimeLeft <= 0) {
          state.recoveryRunning = false;
          logEvent('⏱️ Tiempo de recuperación de 1 minuto completado.');
        }
      }
      broadcastState();
    }
  }, 1000);
}

function handleRoundEnd() {
  io.emit('sound_trigger', 'bell');
  logEvent(`🔔 Fin del Round ${state.currentRound}`);

  if (state.currentRound < state.maxRounds) {
    state.phase = 'rest';
    state.restTimeLeft = state.restDuration;
    state.currentRule = null;
    state.bannerAlert = {
      title: `DESCANSO - ROUND ${state.currentRound} TERMINADO`,
      message: '1 minuto de pausa obligatoria en esquinas.',
      type: 'info'
    };
    io.emit('banner_alert', state.bannerAlert);
  } else {
    state.phase = 'finished';
    state.currentRule = null;
    io.emit('sound_trigger', 'triple_bell');
    state.bannerAlert = {
      title: 'COMBATE FINALIZADO',
      message: 'Esperando deliberación y veredicto de los jueces.',
      type: 'info'
    };
    io.emit('banner_alert', state.bannerAlert);
    logEvent('🏆 3 Rounds concluidos. Decisión de los jueces pendiente.');
  }
}

function handleRestEnd() {
  state.currentRound += 1;
  state.phase = 'fighting';
  state.roundTimeLeft = state.roundDuration;
  state.rouletteTimeLeft = state.rouletteInterval;
  state.bannerAlert = null;

  io.emit('sound_trigger', 'bell');
  logEvent(`🥊 Inicio del Round ${state.currentRound}`);

  if (state.mode === 'tag_team') {
    state.bannerAlert = {
      title: '¡CAMBIO OBLIGATORIO POR CAMPANA!',
      message: 'Nuevo round: Los peleadores deben rotar con su compañero de esquina.',
      type: 'tag_change'
    };
    io.emit('banner_alert', state.bannerAlert);
    logEvent('🔄 Tag Team: ¡Relevo por campana obligatorio!');
  }

  // Initial spin for the new round
  executeRouletteSpin();
}

// Socket Connection
io.on('connection', (socket) => {
  socket.emit('state_update', state);

  socket.on('update_config', (data) => {
    if (data.mode) state.mode = data.mode;
    if (data.redFighter !== undefined) state.redFighter = data.redFighter;
    if (data.blueFighter !== undefined) state.blueFighter = data.blueFighter;
    logEvent(`⚙️ Configuración actualizada: Modo ${state.mode}, ${state.redFighter} vs ${state.blueFighter}`);
    broadcastState();
  });

  socket.on('start_combat', () => {
    if (state.phase === 'idle' || state.phase === 'finished') {
      state.phase = 'fighting';
      state.currentRound = 1;
      state.roundTimeLeft = state.roundDuration;
      state.rouletteTimeLeft = state.rouletteInterval;
      state.winnerDeclaration = null;
      state.bannerAlert = null;
      io.emit('sound_trigger', 'bell');
      logEvent('🔥 Combate iniciado - Round 1');
      executeRouletteSpin();
    } else if (state.phase === 'paused') {
      state.phase = 'fighting';
      logEvent('▶️ Combate reanudado ("¡BOX!")');
    }
    broadcastState();
  });

  socket.on('pause_combat', () => {
    if (state.phase === 'fighting') {
      state.phase = 'paused';
      io.emit('sound_trigger', 'warning');
      logEvent('⏸️ Combate pausado por el moderador ("¡STOP!")');
      broadcastState();
    }
  });

  socket.on('resume_combat', () => {
    if (state.phase === 'paused' || state.phase === 'protection') {
      state.phase = 'fighting';
      state.protectionRunning = false;
      state.protectionCount = 0;
      io.emit('sound_trigger', 'bell');
      logEvent('▶️ Combate reanudado ("¡BOX!")');
      broadcastState();
    }
  });

  socket.on('restart_round', () => {
    state.roundTimeLeft = state.roundDuration;
    state.rouletteTimeLeft = state.rouletteInterval;
    state.phase = 'paused';
    state.currentRule = null;
    logEvent(`🔄 Round ${state.currentRound} reiniciado a 1:30`);
    broadcastState();
  });

  socket.on('set_round', (roundNum) => {
    const r = parseInt(roundNum, 10);
    if (r >= 1 && r <= state.maxRounds) {
      state.currentRound = r;
      state.roundTimeLeft = state.roundDuration;
      state.rouletteTimeLeft = state.rouletteInterval;
      state.phase = 'paused';
      state.currentRule = null;
      logEvent(`🔢 Salto manual a Round ${state.currentRound}`);
      broadcastState();
    }
  });

  socket.on('trigger_spin', (specificRuleId = null) => {
    let rule = null;
    if (specificRuleId) {
      const all = getRulesForMode(state.mode);
      rule = all.find(r => r.id === specificRuleId);
    }
    state.rouletteTimeLeft = state.rouletteInterval;
    executeRouletteSpin(rule);
  });

  socket.on('award_points', ({ side, type, delta }) => {
    if (!state.scores[side]) return;
    const s = state.scores[side];
    delta = Number(delta) || 0;

    if (type === 'hit') {
      s.hits = Math.max(0, s.hits + delta);
      s.total = Math.max(0, s.total + delta);
      io.emit('sound_trigger', 'point');
      logEvent(`🥊 Golpe limpio (+${delta}) para ${side === 'red' ? state.redFighter : state.blueFighter}`);
    } else if (type === 'bonus') {
      s.bonus = Math.max(0, s.bonus + delta);
      s.total = Math.max(0, s.total + delta);
      io.emit('sound_trigger', 'rule_selected');
      logEvent(`⭐ Bono de ruleta (+${delta}) otorgado a ${side === 'red' ? state.redFighter : state.blueFighter}`);
    } else if (type === 'foul') {
      s.fouls += 1;
      // Sancion reglamentaria: +5 al oponente
      const rival = side === 'red' ? 'blue' : 'red';
      state.scores[rival].total += 5;
      logEvent(`🚫 Falta de ${side === 'red' ? state.redFighter : state.blueFighter}: +5 pts al oponente`);
    } else if (type === 'adjust') {
      s.total = Math.max(0, s.total + delta);
      logEvent(`✏️ Ajuste manual (${delta >= 0 ? '+' + delta : delta}) para ${side === 'red' ? state.redFighter : state.blueFighter}`);
    }
    broadcastState();
  });

  socket.on('award_rule_bonus', ({ side }) => {
    const pts = state.currentRule ? state.currentRule.pts : 10;
    if (pts <= 0) return;

    if (side === 'both') {
      state.scores.red.bonus += pts;
      state.scores.red.total += pts;
      state.scores.blue.bonus += pts;
      state.scores.blue.total += pts;
      io.emit('sound_trigger', 'rule_selected');
      logEvent(`⭐ Reto cumplido por AMBOS: +${pts} pts para Rojo y Azul`);
    } else if (state.scores[side]) {
      state.scores[side].bonus += pts;
      state.scores[side].total += pts;
      io.emit('sound_trigger', 'rule_selected');
      logEvent(`⭐ Reto cumplido (+${pts} pts) para ${side === 'red' ? state.redFighter : state.blueFighter}`);
    }
    broadcastState();
  });

  socket.on('start_protection_count', () => {
    state.phase = 'protection';
    state.protectionCount = 8;
    state.protectionRunning = true;
    io.emit('sound_trigger', 'warning');
    logEvent('🛡️ Cuenta de protección (Standing 8-Count) iniciada por el árbitro.');
    broadcastState();
  });

  socket.on('stop_protection_count', () => {
    state.protectionRunning = false;
    state.protectionCount = 0;
    state.phase = 'paused';
    logEvent('🛡️ Cuenta de protección detenida.');
    broadcastState();
  });

  socket.on('start_recovery_time', () => {
    state.phase = 'paused';
    state.recoveryTimeLeft = 60;
    state.recoveryRunning = true;
    io.emit('sound_trigger', 'warning');
    logEvent('🩹 Pausa por golpe bajo / falta accidental: 1 min de recuperación.');
    broadcastState();
  });

  socket.on('proclaim_winner', (data) => {
    const { winner, method, notes } = data;
    const winnerName = winner === 'red' ? state.redFighter : winner === 'blue' ? state.blueFighter : 'EMPATE TÉCNICO';

    state.phase = 'finished';
    state.winnerDeclaration = {
      winner,
      winnerName,
      method: method || 'Decisión de los Jueces',
      redScore: state.scores.red.total,
      blueScore: state.scores.blue.total,
      redHits: state.scores.red.hits,
      blueHits: state.scores.blue.hits,
      redBonus: state.scores.red.bonus,
      blueBonus: state.scores.blue.bonus,
      notes: notes || ''
    };

    io.emit('sound_trigger', 'victory');
    io.emit('winner_proclaimed', state.winnerDeclaration);
    logEvent(`🏆 GANADOR PROCLAMADO: ${winnerName} por ${state.winnerDeclaration.method}`);
    broadcastState();
  });

  socket.on('clear_winner', () => {
    state.winnerDeclaration = null;
    broadcastState();
  });

  socket.on('reset_all', () => {
    const prevMode = state.mode;
    const prevRed = state.redFighter;
    const prevBlue = state.blueFighter;
    state = createInitialState();
    state.mode = prevMode;
    state.redFighter = prevRed;
    state.blueFighter = prevBlue;
    logEvent('🔄 Combate reiniciado por completo.');
    broadcastState();
  });
});

startTimer();

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🥊 LA VELADA DEL CAOS - Servidor en Ejecución`);
  console.log(`📡 Vista Stream Overlay:  http://localhost:${PORT}/overlay`);
  console.log(`🎛️  Panel de Moderador:    http://localhost:${PORT}/admin`);
  console.log(`===============================================`);
});
