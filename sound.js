/**
 * SoundManager
 * Sintetizador de efeitos sonoros retro-neon utilizando a Web Audio API do navegador.
 * Evita dependências de arquivos de áudio externos e carrega instantaneamente.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    /**
     * Inicializa o contexto de áudio. Deve ser chamado após uma interação do usuário.
     */
    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        } catch (e) {
            console.warn("Web Audio API não é suportada neste navegador.", e);
        }
    }

    /**
     * Toca o som do disparo de laser da nave do jogador.
     */
    playLaser() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Garante que o contexto não está pausado (política de autoplay do Chrome)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Toca o som do disparo dos inimigos.
     */
    playEnemyLaser() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Toca o som de uma explosão (destruição de asteroide ou nave).
     */
    playExplosion() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.35; // ~350ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Preenche com ruído branco
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(20, now + 0.35);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    /**
     * Toca o som quando o jogador sofre dano.
     */
    playDamage() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.setValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Toca o som quando o jogador coleta um power-up.
     */
    playPowerUp() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        
        const playTone = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Arpejo ascendente de 4 notas
        playTone(392, now, 0.08);        // G4
        playTone(523.25, now + 0.08, 0.08); // C5
        playTone(659.25, now + 0.16, 0.08); // E5
        playTone(783.99, now + 0.24, 0.18); // G5
    }

    /**
     * Som de perda de escudo ou ativação falha de escudos.
     */
    playShieldDown() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// Exporta globalmente para uso nas classes
const sounds = new SoundManager();
