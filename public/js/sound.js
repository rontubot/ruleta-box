// Sound Manager for "La Velada del Caos"
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bellBuffer = null;
    this.bellAudio = new Audio('/sounds/campana.mp3');
    this.tablillasBuffer = null;
    this.tablillasAudio = new Audio('/sounds/tablillas.mp3');
    this.loadBellAudio();
    this.loadTablillasAudio();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.loadBellAudio();
      this.loadTablillasAudio();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  loadBellAudio() {
    if (this.bellBuffer || !window.fetch) return;
    fetch('/sounds/campana.mp3')
      .then(res => res.arrayBuffer())
      .then(data => {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
        }
        return this.ctx.decodeAudioData(data);
      })
      .then(buffer => {
        this.bellBuffer = buffer;
      })
      .catch(err => {
        console.warn('Fallback a HTMLAudio para campana:', err);
      });
  }

  loadTablillasAudio() {
    if (this.tablillasBuffer || !window.fetch) return;
    fetch('/sounds/tablillas.mp3')
      .then(res => res.arrayBuffer())
      .then(data => {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
        }
        return this.ctx.decodeAudioData(data);
      })
      .then(buffer => {
        this.tablillasBuffer = buffer;
      })
      .catch(err => {
        console.warn('Fallback a HTMLAudio para tablillas:', err);
      });
  }

  playBell() {
    if (this.muted) return;
    this.init();

    // Prioridad 1: Web Audio Buffer (cero latencia, alta fidelidad)
    if (this.ctx && this.bellBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.bellBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.95, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {
        console.warn('Fallo buffer audio, usando HTMLAudio:', e);
      }
    }

    // Prioridad 2: Elemento de audio HTML5
    try {
      const audioClone = this.bellAudio.cloneNode();
      audioClone.volume = 0.95;
      audioClone.play().catch(() => {});
    } catch (e) {
      this.playSynthBell();
    }
  }

  playTripleBell() {
    this.playBell();
    setTimeout(() => this.playBell(), 450);
    setTimeout(() => this.playBell(), 900);
  }

  playSynthBell() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [840, 1260, 1680, 2100, 2940];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      const decay = idx === 0 ? 1.8 : 0.8 / (idx + 1);
      const amp = 0.25 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + decay);
    });
  }

  playTick() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(900 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playRuleSelected() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
    
    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const startTime = now + idx * 0.06;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.55);
    });
  }

  playTablillas() {
    if (this.muted) return;
    this.init();

    // Prioridad 1: Web Audio Buffer (cero latencia, fidelidad de audio total)
    if (this.ctx && this.tablillasBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.tablillasBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {
        console.warn('Fallo buffer tablillas, usando HTMLAudio:', e);
      }
    }

    // Prioridad 2: Elemento de audio HTML5
    try {
      const audioClone = this.tablillasAudio.cloneNode();
      audioClone.volume = 1.0;
      audioClone.play().catch(() => {});
    } catch (e) {
      this.playSynthWoodBlock();
    }
  }

  playWarning() {
    // Las tablillas reemplazan el sonido de aviso de los últimos 10 segundos
    this.playTablillas();
  }

  playSynthWoodBlock() {
    if (this.muted || !this.ctx) return;
    [0, 0.28, 0.56].forEach(offset => {
      const now = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    });
  }

  playPoint() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    // Fanfare chords
    const notes = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.3, d: 0.15 },
      { f: 1046.5, t: 0.45, d: 0.6 },
      { f: 880.0,  t: 1.1, d: 0.2 },
      { f: 1046.5, t: 1.35, d: 0.8 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + n.t;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.f, st);
      
      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.0001, st + n.d);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(st);
      osc.stop(st + n.d);
    });
  }
}

const sounds = new SoundManager();
