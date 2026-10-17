const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { getRulesForMode, RULES_1V1, RULES_TAG_TEAM_EXTRA } = require('./public/js/rules.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000
});

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Strict NO-CACHE headers: ensures browsers and proxies NEVER cache HTML, JS or responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Dual-layer state sync endpoint: allows any client to poll current state via HTTP
app.get('/api/state', (req, res) => {
  if (io && io.engine) {
    state.connectedDevices = io.engine.clientsCount || 1;
  }
  res.json(state);
});

// Dual-layer action endpoint: guaranteed HTTP execution for any combat command
app.post('/api/action', (req, res) => {
  const { action, payload, data } = req.body || {};
  const actionData = payload !== undefined ? payload : data;
  if (action && typeof processCombatAction === 'function') {
    processCombatAction(action, actionData);
  }
  res.json({ success: true, state });
});

app.get('/overlay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/tv', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tv.html'));
});

app.get('/timer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tv.html'));
});

// State Management
function createInitialState(mode = '1v1') {
  return {
    mode: mode, // '1v1' | 'tag_team'
    redFighter: 'Esquina Roja',
    blueFighter: 'Esquina Azul',
    connectedDevices: 1,
    phase: 'idle', // 'idle' | 'fighting' | 'paused' | 'rest' | 'protection' | 'finished'
    currentRound: 1,
    maxRounds: mode === 'tag_team' ? 5 : 3,
    roundDuration: 90,
    roundTimeLeft: 90,
    restDuration: 60,
    restTimeLeft: 60,
    rouletteInterval: 30,
    rouletteTimeLeft: 30,
    currentRule: null,
    ruleDuration: 30,
    ruleTimeLeft: 0,
    rouletteSpinning: false,
    protectionCount: 0,
    protectionRunning: false,
    recoveryTimeLeft: 0,
    recoveryRunning: false,
    scores: {
      red: { total: 0, hits: 0, bonus: 0, fouls: 0 },
      blue: { total: 0, hits: 0, bonus: 0, fouls: 0 }
    },
    teamBonusChances: { red: 0, blue: 0 },
    lastTeamTarget: null,
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
  if (io && io.engine) {
    state.connectedDevices = io.engine.clientsCount || 1;
  }
  io.emit('state_update', state);
}

function selectRandomRule() {
  const rules = getRulesForMode(state.mode);
  if (!rules || rules.length === 0) return null;

  // Filtrar para no repetir exactamente la misma regla de forma consecutiva
  let pool = rules.filter(r => !state.currentRule || r.id !== state.currentRule.id);
  if (pool.length === 0) pool = rules;

  if (!state.teamBonusChances) {
    state.teamBonusChances = { red: 0, blue: 0 };
  }
  const redChances = state.teamBonusChances.red || 0;
  const blueChances = state.teamBonusChances.blue || 0;
  const lastTarget = state.lastTeamTarget;

  // Evitar asignar dos retos exclusivos seguidos al mismo equipo
  if (lastTarget) {
    const nonRepeatingPool = pool.filter(r => !r.targetTeam || r.targetTeam !== lastTarget);
    if (nonRepeatingPool.length > 0) {
      pool = nonRepeatingPool;
    }
  }

  // Algoritmo de Equidad Deportiva (Fairness):
  // Si un equipo ha tenido menos oportunidades de reto exclusivo (Sacrificio / Ciego / Cambio),
  // aumentamos fuertemente el peso para que el siguiente reto sea para él y se igualen las oportunidades
  const weightedPool = [];
  for (const r of pool) {
    let weight = 1;
    if (r.targetTeam === 'blue' && redChances > blueChances) {
      weight = 4; // Mayor probabilidad para igualar al Equipo Azul
    } else if (r.targetTeam === 'red' && blueChances > redChances) {
      weight = 4; // Mayor probabilidad para igualar al Equipo Rojo
    }
    for (let i = 0; i < weight; i++) {
      weightedPool.push(r);
    }
  }

  const picked = weightedPool[Math.floor(Math.random() * weightedPool.length)];

  if (picked && picked.targetTeam) {
    state.teamBonusChances[picked.targetTeam] = (state.teamBonusChances[picked.targetTeam] || 0) + 1;
    state.lastTeamTarget = picked.targetTeam;
  }

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
    state.ruleDuration = 30;
    state.ruleTimeLeft = 30;
    state.rouletteSpinning = false;
    io.emit('spin_completed', { rule: chosenRule, duration: 30 });
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

        // Conteo regresivo del evento / regla activa
        if (state.currentRule && state.ruleTimeLeft > 0) {
          state.ruleTimeLeft -= 1;
          if (state.ruleTimeLeft <= 0) {
            logEvent(`⏱️ Fin del evento: ${state.currentRule.name}`);
            state.currentRule = null;
            state.ruleTimeLeft = 0;
          }
        }

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
          state.phase = 'fighting';
          io.emit('sound_trigger', 'bell');
          logEvent('⏱️ Cuenta de protección de 8 segundos completada. ¡Combate reanudado ("¡BOX!")!');
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
    state.ruleTimeLeft = 0;
    state.bannerAlert = {
      title: `DESCANSO - ROUND ${state.currentRound} TERMINADO`,
      message: '1 minuto de pausa obligatoria en esquinas.',
      type: 'info'
    };
    io.emit('banner_alert', state.bannerAlert);
  } else {
    state.phase = 'finished';
    state.currentRule = null;
    state.ruleTimeLeft = 0;
    io.emit('sound_trigger', 'triple_bell');
    state.bannerAlert = {
      title: 'COMBATE FINALIZADO',
      message: 'Esperando deliberación y veredicto de los jueces.',
      type: 'info'
    };
    io.emit('banner_alert', state.bannerAlert);
    logEvent(`🏆 ${state.maxRounds} Rounds concluidos. Decisión de los jueces pendiente.`);
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

  // La ruleta girará automáticamente a los 30 segundos del round
  broadcastState();
}

// Central Action Processor (Handles both WebSockets and HTTP REST API actions)
function processCombatAction(action, data = {}) {
  switch (action) {
    case 'update_config':
      if (data.mode) {
        state.mode = data.mode;
        state.maxRounds = data.maxRounds ? Number(data.maxRounds) : (data.mode === 'tag_team' ? 5 : 3);
      } else if (data.maxRounds) {
        state.maxRounds = Number(data.maxRounds);
      }
      if (data.redFighter !== undefined) state.redFighter = data.redFighter;
      if (data.blueFighter !== undefined) state.blueFighter = data.blueFighter;
      logEvent(`⚙️ Configuración: Modo ${state.mode.toUpperCase()} (${state.maxRounds} Rounds), ${state.redFighter} vs ${state.blueFighter}`);
      break;

    case 'start_combat':
      if (state.phase === 'idle' || state.phase === 'finished') {
        state.phase = 'fighting';
        state.currentRound = 1;
        state.roundTimeLeft = state.roundDuration;
        state.rouletteTimeLeft = state.rouletteInterval;
        state.currentRule = null;
        state.ruleTimeLeft = 0;
        state.winnerDeclaration = null;
        state.bannerAlert = null;
        io.emit('sound_trigger', 'bell');
        logEvent('🔥 Combate iniciado - Round 1 (La ruleta girará al segundo 30)');
      } else if (state.phase === 'paused') {
        state.phase = 'fighting';
        logEvent('▶️ Combate reanudado ("¡BOX!")');
      }
      break;

    case 'pause_combat':
      if (state.phase === 'fighting') {
        state.phase = 'paused';
        io.emit('sound_trigger', 'warning');
        logEvent('⏸️ Combate pausado por el moderador ("¡STOP!")');
      }
      break;

    case 'resume_combat':
      if (state.phase === 'paused' || state.phase === 'protection') {
        state.phase = 'fighting';
        state.protectionRunning = false;
        state.protectionCount = 0;
        io.emit('sound_trigger', 'bell');
        logEvent('▶️ Combate reanudado ("¡BOX!")');
      }
      break;

    case 'restart_round':
      state.roundTimeLeft = state.roundDuration;
      state.rouletteTimeLeft = state.rouletteInterval;
      state.phase = 'paused';
      state.currentRule = null;
      state.ruleTimeLeft = 0;
      logEvent(`🔄 Round ${state.currentRound} reiniciado a 1:30`);
      break;

    case 'set_round':
      const r = parseInt(data.roundNum || data, 10);
      if (r >= 1 && r <= state.maxRounds) {
        state.currentRound = r;
        state.roundTimeLeft = state.roundDuration;
        state.rouletteTimeLeft = state.rouletteInterval;
        state.phase = 'paused';
        state.currentRule = null;
        state.ruleTimeLeft = 0;
        logEvent(`🔢 Salto manual a Round ${state.currentRound}`);
      }
      break;

    case 'trigger_spin':
      let rule = null;
      const ruleId = typeof data === 'string' ? data : (data && data.ruleId);
      if (ruleId) {
        const all = getRulesForMode(state.mode);
        rule = all.find(item => item.id === ruleId);
      }
      state.rouletteTimeLeft = state.rouletteInterval;
      executeRouletteSpin(rule);
      return; // executeRouletteSpin broadcasts on its own

    case 'award_points':
      const side = data.side;
      const type = data.type;
      let delta = Number(data.delta) || 0;
      if (state.scores[side]) {
        const s = state.scores[side];
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
          const rival = side === 'red' ? 'blue' : 'red';
          state.scores[rival].total += 5;
          logEvent(`🚫 Falta de ${side === 'red' ? state.redFighter : state.blueFighter}: +5 pts al oponente`);
        } else if (type === 'adjust') {
          s.total = Math.max(0, s.total + delta);
          logEvent(`✏️ Ajuste manual (${delta >= 0 ? '+' + delta : delta}) para ${side === 'red' ? state.redFighter : state.blueFighter}`);
        }
      }
      break;

    case 'award_rule_bonus':
      const pts = state.currentRule ? state.currentRule.pts : 10;
      if (pts > 0) {
        if (data.side === 'both') {
          state.scores.red.bonus += pts;
          state.scores.red.total += pts;
          state.scores.blue.bonus += pts;
          state.scores.blue.total += pts;
          io.emit('sound_trigger', 'rule_selected');
          logEvent(`⭐ Reto cumplido por AMBOS: +${pts} pts para Rojo y Azul`);
        } else if (state.scores[data.side]) {
          state.scores[data.side].bonus += pts;
          state.scores[data.side].total += pts;
          io.emit('sound_trigger', 'rule_selected');
          logEvent(`⭐ Reto cumplido (+${pts} pts) para ${data.side === 'red' ? state.redFighter : state.blueFighter}`);
        }
      }
      break;

    case 'start_protection_count':
      state.phase = 'protection';
      state.protectionCount = 8;
      state.protectionRunning = true;
      io.emit('sound_trigger', 'warning');
      logEvent('🛡️ Cuenta de protección (Standing 8-Count) iniciada por el árbitro.');
      break;

    case 'stop_protection_count':
      state.protectionRunning = false;
      state.protectionCount = 0;
      state.phase = 'paused';
      logEvent('🛡️ Cuenta de protección detenida.');
      break;

    case 'start_recovery_time':
      state.phase = 'paused';
      state.recoveryTimeLeft = 60;
      state.recoveryRunning = true;
      io.emit('sound_trigger', 'warning');
      logEvent('🩹 Pausa por golpe bajo / falta accidental: 1 min de recuperación.');
      break;

    case 'proclaim_winner':
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
      break;

    case 'clear_winner':
      state.winnerDeclaration = null;
      break;

    case 'reset_all':
      const prevMode = state.mode;
      const prevRed = state.redFighter;
      const prevBlue = state.blueFighter;
      state = createInitialState(prevMode);
      state.redFighter = prevRed;
      state.blueFighter = prevBlue;
      logEvent('🔄 Combate reiniciado por completo.');
      break;

    case 'banner_alert':
      state.bannerAlert = data;
      io.emit('banner_alert', state.bannerAlert);
      break;
  }
  broadcastState();
}

// Unified Socket Connection handling
io.on('connection', (socket) => {
  broadcastState();

  socket.on('update_config', (data) => processCombatAction('update_config', data));
  socket.on('start_combat', () => processCombatAction('start_combat'));
  socket.on('pause_combat', () => processCombatAction('pause_combat'));
  socket.on('resume_combat', () => processCombatAction('resume_combat'));
  socket.on('restart_round', () => processCombatAction('restart_round'));
  socket.on('set_round', (roundNum) => processCombatAction('set_round', { roundNum }));
  socket.on('trigger_spin', (ruleId) => processCombatAction('trigger_spin', { ruleId }));
  socket.on('award_points', (data) => processCombatAction('award_points', data));
  socket.on('award_rule_bonus', (data) => processCombatAction('award_rule_bonus', data));
  socket.on('start_protection_count', () => processCombatAction('start_protection_count'));
  socket.on('stop_protection_count', () => processCombatAction('stop_protection_count'));
  socket.on('start_recovery_time', () => processCombatAction('start_recovery_time'));
  socket.on('proclaim_winner', (data) => processCombatAction('proclaim_winner', data));
  socket.on('clear_winner', () => processCombatAction('clear_winner'));
  socket.on('reset_all', () => processCombatAction('reset_all'));
  socket.on('banner_alert', (data) => processCombatAction('banner_alert', data));

  socket.on('disconnect', () => {
    broadcastState();
  });
});

startTimer();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🥊 LA VELADA DEL CAOS - Servidor en Ejecución (0.0.0.0:${PORT})`);
  console.log(`📡 Vista Stream Overlay:  http://localhost:${PORT}/overlay`);
  console.log(`📺 Pantalla TV (Reloj):   http://localhost:${PORT}/tv`);
  console.log(`🎛️  Panel de Moderador:    http://localhost:${PORT}/admin`);
  console.log(`===============================================`);
});
