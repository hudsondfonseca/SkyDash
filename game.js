/**
 * game.js
 * Mecânica principal, loop de jogo, controles, colisões e controle de interface.
 * Adaptado para o estilo 2D Arcade Jetpack Joyride.
 */

// --- CONFIGURAÇÃO E ELEMENTOS DO DOM ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Elementos HUD
const hud = document.getElementById('hud');
const hpBar = document.getElementById('hp-bar');
const shieldBar = document.getElementById('shield-bar');
const scoreVal = document.getElementById('score-val');
const highscoreVal = document.getElementById('highscore-val');
const comboDisplay = document.getElementById('combo-display');
const comboValue = document.getElementById('combo-value');
const powerupIndicatorContainer = document.getElementById('powerup-indicator-container');
const weaponNameVal = document.getElementById('weapon-name-val');

// Elemento da Barra de Vida do Boss
const bossHealthContainer = document.getElementById('boss-health-container');
const bossHpBar = document.getElementById('boss-hp-bar');

// Elementos de Telas Overlay
const startScreen = document.getElementById('start-screen');
const settingsScreen = document.getElementById('settings-screen');
const controlsScreen = document.getElementById('controls-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');

// Botões e Inputs
const btnStart = document.getElementById('btn-start');
const btnSettingsOpen = document.getElementById('btn-settings-open');
const btnSettingsClose = document.getElementById('btn-settings-close');
const btnResume = document.getElementById('btn-resume');
const btnRestartPause = document.getElementById('btn-restart-pause');
const btnQuit = document.getElementById('btn-quit');
const btnRestart = document.getElementById('btn-restart');
const btnMenuGo = document.getElementById('btn-menu-go');

const settingAutofire = document.getElementById('setting-autofire');
const settingSound = document.getElementById('setting-sound');
const settingDifficulty = document.getElementById('setting-difficulty');
const menuHighscore = document.getElementById('menu-highscore');

// Estatísticas Finais
const finalScore = document.getElementById('final-score');
const finalKills = document.getElementById('final-kills');
const finalAsteroids = document.getElementById('final-asteroids');
const finalTime = document.getElementById('final-time');

// --- RESOLUÇÃO FIXA DE COORDENADAS ---
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
// Canvas em resolução nativa para preservar bordas nítidas em pixel art.
ctx.imageSmoothingEnabled = false;
const simulationClock = new FixedStepClock();
let animationFrameId = null;

function scheduleGameLoop() {
    if (animationFrameId !== null) return;
    animationFrameId = requestAnimationFrame(timestamp => {
        animationFrameId = null;
        gameLoop(timestamp);
    });
}
const backgroundConfig = JSON.parse(JSON.stringify(DEFAULT_SPACE_BACKGROUND));
try {
    const savedBackground = JSON.parse(localStorage.getItem('sky_dash_background') || '{}');
    for (const key of Object.keys(backgroundConfig.layers)) {
        backgroundConfig.layers[key] = {
            ...backgroundConfig.layers[key],
            ...(savedBackground.layers?.[key] || {})
        };
    }
} catch (_) {}
const spaceBackground = new PixelSpaceBackground(backgroundConfig);
window.spaceBackground = spaceBackground; // Console/config hook for scene composition.

// The JSON file is the editable baseline; saved player preferences take precedence.
fetch('assets/background/config.json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(fileConfig => {
        let savedConfig = {};
        try {
            savedConfig = JSON.parse(localStorage.getItem('sky_dash_background') || '{}');
        } catch (_) {}
        const config = {
            ...DEFAULT_SPACE_BACKGROUND,
            ...fileConfig,
            layers: { ...DEFAULT_SPACE_BACKGROUND.layers, ...(fileConfig.layers || {}) }
        };
        for (const key of Object.keys(DEFAULT_SPACE_BACKGROUND.layers)) {
            config.layers[key] = {
                ...DEFAULT_SPACE_BACKGROUND.layers[key],
                ...(fileConfig.layers?.[key] || {}),
                ...(savedConfig.layers?.[key] || {})
            };
        }
        const configuredBackground = new PixelSpaceBackground(config);
        spaceBackground.config = configuredBackground.config;
        spaceBackground.farStars = configuredBackground.farStars;
        spaceBackground.nearStars = configuredBackground.nearStars;
        spaceBackground.rocks = configuredBackground.rocks;
        spaceBackground.dust = configuredBackground.dust;
        spaceBackground.nebulaCanvas = configuredBackground.nebulaCanvas;
    })
    .catch(error => console.warn('Usando configuração padrão do cenário:', error));

// --- ESTADO DO JOGO ---
let gameState = 'start'; 
let score = 0;
let highscore = 0;
let combo = 0;
let comboTimer = 0;
const COMBO_MAX_TIME = 180; 

// Estatísticas da rodada
let stats = {
    kills: 0,
    asteroids: 0,
    startTime: 0,
    flightTime: 0
};

// Configurações Padrão
let settings = {
    autofire: true,
    sound: true,
    difficulty: 'normal'
};

// Vetores de Entidades
let player;
let lasers = [];
let asteroids = [];
let enemies = [];
let powerups = [];
let particles = [];
let floatingTexts = []; 
let creditsArray = [];

// Upgrades da Frota (Shop State)
let upgrades = {
    hp: 0,
    shield: 0,
    firerate: 0,
    regen: 0
};
let credits = 0;

function loadUpgrades() {
    try {
        const readInt = (key, max) => {
            const value = Number.parseInt(localStorage.getItem(key), 10);
            return Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : 0;
        };
        upgrades.hp = readInt('sky_dash_upg_hp', 5);
        upgrades.shield = readInt('sky_dash_upg_shield', 5);
        upgrades.firerate = readInt('sky_dash_upg_firerate', 5);
        upgrades.regen = readInt('sky_dash_upg_regen', 5);
        credits = readInt('sky_dash_credits', Number.MAX_SAFE_INTEGER);
    } catch (e) {
        console.error("Erro ao carregar upgrades", e);
    }
}

function saveUpgrades() {
    try {
        localStorage.setItem('sky_dash_upg_hp', upgrades.hp);
        localStorage.setItem('sky_dash_upg_shield', upgrades.shield);
        localStorage.setItem('sky_dash_upg_firerate', upgrades.firerate);
        localStorage.setItem('sky_dash_upg_regen', upgrades.regen);
        localStorage.setItem('sky_dash_credits', credits);
    } catch (e) {
        console.error("Erro ao salvar upgrades", e);
    }
}
loadUpgrades();

// Efeitos Especiais de Flash na Tela
let damageFlash = 0;
let bossDefeatFlash = 0;

// Chefe (Boss) e Sub-Chefe (SubBoss)
let boss = null;
let bossActive = false;
let subBoss = null;
let subBossActive = false;
let nextBossScore = 10000; 
let nextSubBossScore = 5000; 
let bossCount = 0;
let subBossCount = 0;
let difficultyMultiplier = 1.0; 

// Sistema de Hordas
let hordeActive = false;
let nextHordeScore = 2500;
let hordeSpawnQueue = [];

// Timers de Geração (Frames)
let spawnTimers = {
    asteroid: 0,
    enemy: 0,
    powerupPassive: 0
};

// Efeito de Tremor de Tela
let screenShake = {
    duration: 0,
    intensity: 0
};

function drawBackground() {
    spaceBackground.draw(ctx, GAME_WIDTH, GAME_HEIGHT);
}

// --- CONFIGURAÇÃO DE DIFICULDADE ---
function getDifficultySettings() {
    const diff = settings.difficulty;
    if (diff === 'easy') {
        return {
            asteroidInterval: 180, 
            enemyInterval: 260,
            playerHP: 120,
            playerShield: 0 
        };
    } else if (diff === 'hard') {
        return {
            asteroidInterval: 100, 
            enemyInterval: 130,
            playerHP: 100,
            playerShield: 0 
        };
    } else { // Normal
        return {
            asteroidInterval: 140, 
            enemyInterval: 190,
            playerHP: 100,
            playerShield: 0 
        };
    }
}

// --- SORTEIO DE POWER-UPS / LOOT DE ARMAS ---
function pickPowerupType() {
    const buffTypes = ['heal', 'shield', 'doubleshot', 'hyperdrive'];
    const weaponTypes = ['weapon_vulcan', 'weapon_cannon', 'weapon_spread', 'weapon_sniper'];
    
    if (Math.random() < 0.3) {
        return weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    }
    return buffTypes[Math.floor(Math.random() * buffTypes.length)];
}

// --- GERADORES DE ENTIDADES (TIMERS) ---
function handleSpawning() {
    if (bossActive || boss || subBossActive || subBoss || hordeActive || hordeSpawnQueue.length > 0) return; 

    const rules = getDifficultySettings();
    const asteroidLimit = Math.max(50, Math.floor(rules.asteroidInterval / difficultyMultiplier)); 
    const enemyLimit = Math.max(50, Math.floor(rules.enemyInterval / difficultyMultiplier));

    // 1. Asteroides
    spawnTimers.asteroid++;
    if (spawnTimers.asteroid >= asteroidLimit) {
        spawnTimers.asteroid = 0;
        const randomY = Math.random() * (GAME_HEIGHT - 60) + 30;
        asteroids.push(new Asteroid(GAME_WIDTH + 50, randomY, 'large'));
    }
    
    // 2. Naves Inimigas
    spawnTimers.enemy++;
    if (spawnTimers.enemy >= enemyLimit) {
        spawnTimers.enemy = 0;
        const randomY = Math.random() * (GAME_HEIGHT - 100) + 50;
        
        const rand = Math.random();
        let type = 'scout';
        if (rand < 0.15) type = 'bomber';
        else if (rand < 0.30) type = 'kamikaze';
        else if (rand < 0.45) type = 'defender';
        else if (rand < 0.60) type = 'sniper';
        else if (rand < 0.75) type = 'drone';
        
        enemies.push(new Enemy(GAME_WIDTH + 50, randomY, type));
    }
    
    // 3. Power-up Passivo
    spawnTimers.powerupPassive++;
    if (spawnTimers.powerupPassive >= 1000) { 
        spawnTimers.powerupPassive = 0;
        if (Math.random() < 0.15 && powerups.length < 1) {
            const randType = pickPowerupType();
            const randomY = Math.random() * (GAME_HEIGHT - 120) + 60;
            powerups.push(new PowerUp(GAME_WIDTH + 30, randomY, randType));
        }
    }
}

// --- ACIONAR TREMOR DE TELA ---
function triggerScreenShake(duration, intensity) {
    screenShake.duration = duration;
    screenShake.intensity = intensity;
}


// --- ATUALIZAÇÕES DO COMBO ---
function addCombo() {
    combo++;
    comboTimer = COMBO_MAX_TIME;
    
    if (combo >= 3) {
        comboDisplay.classList.remove('hidden');
        comboValue.innerText = `x${combo}`;
        
        comboDisplay.style.animation = 'none';
        void comboDisplay.offsetWidth; 
        comboDisplay.style.animation = 'combo-pulse 0.3s ease-out';
        
        if (combo % 3 === 0) {
            floatingTexts.push(new FloatingText(player.x, player.y - 25, `COMBO x${combo}!`, '#22c55e', 16));
        }
    }
}

function updateCombo() {
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            comboDisplay.classList.add('hidden');
        }
    }
}

// --- DETECÇÃO DE COLISÕES ---
function handleCollisions() {
    // 1. Projéteis do Jogador vs Asteroides
    lasers.forEach(laser => {
        if (!laser.isPlayerLaser || laser.toRemove) return;
        
        asteroids.forEach(asteroid => {
            if (asteroid.toRemove) return;
            
            const dist = Math.hypot(laser.x - asteroid.x, laser.y - asteroid.y);
            if (dist < asteroid.radius + laser.width / 2) {
                laser.toRemove = true;
                
                const isDestroyed = asteroid.takeDamage(laser.damage);
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(laser.x, laser.y, '#f97316', 0.5));
                }
                
                if (isDestroyed) {
                    asteroid.toRemove = true;
                    sounds.playExplosion();
                    triggerScreenShake(8, 3);
                    stats.asteroids++;
                    
                    const finalPoints = asteroid.points * Math.max(1, Math.floor(combo / 3));
                    score += finalPoints;
                    addCombo();
                    
                    floatingTexts.push(new FloatingText(asteroid.x, asteroid.y, `+${finalPoints}`, '#f59e0b', 14));
                    
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(asteroid.x, asteroid.y, '#78716c', 1.5));
                    }
                    
                    if (asteroid.size === 'large') {
                        asteroids.push(new Asteroid(asteroid.x, asteroid.y - 10, 'medium'));
                        asteroids.push(new Asteroid(asteroid.x, asteroid.y + 10, 'medium'));
                    } else if (asteroid.size === 'medium') {
                        asteroids.push(new Asteroid(asteroid.x, asteroid.y - 8, 'small'));
                        asteroids.push(new Asteroid(asteroid.x, asteroid.y + 8, 'small'));
                    }

                    // Gera moedas de crédito para a loja
                    const coinCount = asteroid.size === 'large' ? 3 : (asteroid.size === 'medium' ? 2 : 1);
                    for (let k = 0; k < coinCount; k++) {
                        creditsArray.push(new Credit(asteroid.x + (Math.random() * 20 - 10), asteroid.y + (Math.random() * 20 - 10)));
                    }
                }
                
                if (Math.random() < 0.05) {
                    const randType = pickPowerupType();
                    powerups.push(new PowerUp(asteroid.x, asteroid.y, randType));
                }
            }
        });
    });

    // 2. Projéteis do Jogador vs Inimigos
    lasers.forEach(laser => {
        if (!laser.isPlayerLaser || laser.toRemove) return;
        
        enemies.forEach(enemy => {
            if (enemy.toRemove) return;
            
            if (Math.abs(laser.x - enemy.x) < enemy.width/2 + laser.width/2 &&
                Math.abs(laser.y - enemy.y) < enemy.height/2) {
                
                laser.toRemove = true;
                const isDestroyed = enemy.takeDamage(laser.damage);
                
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(laser.x, laser.y, enemy.color, 0.5));
                }
                
                if (isDestroyed) {
                    enemy.toRemove = true;
                    sounds.playExplosion();
                    triggerScreenShake(12, 5);
                    stats.kills++;
                    
                    const finalPoints = enemy.points * Math.max(1, Math.floor(combo / 3));
                    score += finalPoints;
                    addCombo();
                    
                    floatingTexts.push(new FloatingText(enemy.x, enemy.y, `+${finalPoints}`, enemy.color, 14));
                    
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(enemy.x, enemy.y, enemy.color, 1.8));
                    }
                    
                    const robustTypes = ['bomber', 'defender', 'sniper'];
                    const dropChance = robustTypes.includes(enemy.type) ? 0.20 : 0.08;
                    if (Math.random() < dropChance) {
                        const randType = pickPowerupType();
                        powerups.push(new PowerUp(enemy.x, enemy.y, randType));
                    }

                    // Gera moedas de crédito para a loja
                    const coinCount = robustTypes.includes(enemy.type) ? 3 : (enemy.type === 'kamikaze' ? 2 : 1);
                    for (let k = 0; k < coinCount; k++) {
                        creditsArray.push(new Credit(enemy.x + (Math.random() * 16 - 8), enemy.y + (Math.random() * 16 - 8)));
                    }
                }
            }
        });
    });

    // 3. Projéteis do Jogador vs Chefe (Boss)
    if (bossActive && boss) {
        lasers.forEach(laser => {
            if (!boss) return; 
            if (!laser.isPlayerLaser || laser.toRemove) return;

            if (Math.abs(laser.x - boss.x) < boss.width / 2 + laser.width / 2 &&
                Math.abs(laser.y - boss.y) < boss.height / 2) {
                
                laser.toRemove = true;
                const isDestroyed = boss.takeDamage(laser.damage);
                
                bossHpBar.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;

                for (let i = 0; i < 4; i++) {
                    particles.push(new Particle(laser.x, laser.y, boss.color, 0.6));
                }

                if (isDestroyed) {
                    boss.toRemove = true;
                    sounds.playExplosion();
                    triggerScreenShake(50, 16);
                    stats.kills++; 

                    for (let i = 0; i < 50; i++) {
                        particles.push(new Particle(boss.x, boss.y, boss.color, 2.5));
                        particles.push(new Particle(boss.x, boss.y, '#f59e0b', 1.8));
                    }

                    const finalPoints = 2000 * Math.max(1, Math.floor(combo / 3));
                    score += finalPoints;
                    addCombo();
                    
                    floatingTexts.push(new FloatingText(boss.x, boss.y, `+${finalPoints}`, boss.color, 24));
                    floatingTexts.push(new FloatingText(boss.x, boss.y - 30, "BOSS DESTRUÍDO!", '#22c55e', 28));

                    bossDefeatFlash = 15;

                    for (let j = 0; j < 3; j++) {
                        const randType = pickPowerupType();
                        powerups.push(new PowerUp(boss.x + (j - 1) * 30, boss.y + (Math.random() * 20 - 10), randType));
                    }

                    // Gera moedas de crédito abundantes do Chefe
                    for (let k = 0; k < 15; k++) {
                        creditsArray.push(new Credit(boss.x + (Math.random() * 60 - 30), boss.y + (Math.random() * 60 - 30)));
                    }

                    difficultyMultiplier += 0.25;

                    nextBossScore = score + 15000;
                    nextSubBossScore = score + 7500;
                    
                    bossActive = false;
                    boss = null;
                    bossHealthContainer.classList.add('hidden');
                }
            }
        });

        if (boss) {
            const playerRadius = player.width * 0.6;
            const distToBoss = Math.hypot(player.x - boss.x, player.y - boss.y);
            if (distToBoss < playerRadius + (boss.width / 2.5)) {
                const damaged = player.takeDamage(35, particles, floatingTexts); 
                if (damaged) {
                    triggerScreenShake(25, 12);
                    damageFlash = 8; 
                    for (let i = 0; i < 15; i++) {
                        particles.push(new Particle(player.x, player.y, '#ef4444', 1.2));
                    }
                }
            }
        }
    }

    // 3b. Projéteis do Jogador vs Sub-Chefe (SubBoss)
    if (subBossActive && subBoss) {
        lasers.forEach(laser => {
            if (!subBoss) return;
            if (!laser.isPlayerLaser || laser.toRemove) return;

            if (Math.abs(laser.x - subBoss.x) < subBoss.width / 2 + laser.width / 2 &&
                Math.abs(laser.y - subBoss.y) < subBoss.height / 2) {
                
                laser.toRemove = true;
                const isDestroyed = subBoss.takeDamage(laser.damage);
                
                for (let i = 0; i < 3; i++) {
                    particles.push(new Particle(laser.x, laser.y, subBoss.color, 0.6));
                }

                if (isDestroyed) {
                    subBoss.toRemove = true;
                    sounds.playExplosion();
                    triggerScreenShake(30, 10);
                    stats.kills++;

                    const finalPoints = 800 * Math.max(1, Math.floor(combo / 3));
                    score += finalPoints;
                    addCombo();
                    
                    floatingTexts.push(new FloatingText(subBoss.x, subBoss.y, `+${finalPoints}`, subBoss.color, 20));
                    floatingTexts.push(new FloatingText(subBoss.x, subBoss.y - 25, "SUBCHEFE DESTRUÍDO!", '#22c55e', 22));

                    for (let i = 0; i < 30; i++) {
                        particles.push(new Particle(subBoss.x, subBoss.y, subBoss.color, 2.0));
                        particles.push(new Particle(subBoss.x, subBoss.y, '#f59e0b', 1.4));
                    }

                    const types = ['heal', 'shield', 'doubleshot', 'hyperdrive'];
                    for (let j = 0; j < 2; j++) {
                        const randType = types[Math.floor(Math.random() * types.length)];
                        powerups.push(new PowerUp(subBoss.x + (j - 0.5) * 30, subBoss.y, randType));
                    }

                    // Gera moedas de crédito do Mini-Chefe
                    for (let k = 0; k < 6; k++) {
                        creditsArray.push(new Credit(subBoss.x + (Math.random() * 40 - 20), subBoss.y + (Math.random() * 40 - 20)));
                    }

                    subBossActive = false;
                    subBoss = null;
                    nextSubBossScore = 99999999; 
                    nextHordeScore = score + 3750; 
                }
            }
        });

        if (subBoss) {
            const playerRadius = player.width * 0.6;
            const distToSubBoss = Math.hypot(player.x - subBoss.x, player.y - subBoss.y);
            if (distToSubBoss < playerRadius + (subBoss.width / 2.5)) {
                const damaged = player.takeDamage(25, particles, floatingTexts); 
                if (damaged) {
                    triggerScreenShake(20, 10);
                    damageFlash = 7;
                    for (let i = 0; i < 12; i++) {
                        particles.push(new Particle(player.x, player.y, '#06b6d4', 1.2));
                    }
                }
            }
        }
    }

    // 4. Projéteis dos Inimigos vs Jogador
    lasers.forEach(laser => {
        if (laser.isPlayerLaser || laser.toRemove) return;
        
        const playerRadius = player.width * 0.6;
        const dist = Math.hypot(laser.x - player.x, laser.y - player.y);
        
        if (dist < playerRadius) {
            laser.toRemove = true;
            
            const damaged = player.takeDamage(laser.damage, particles, floatingTexts);
            if (damaged) {
                triggerScreenShake(15, 6);
                damageFlash = 6; 
                const sparkColor = player.shield > 0 ? '#0284c7' : '#ef4444';
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(player.x, player.y, sparkColor, 1));
                }
            }
        }
    });

    // 5. Jogador vs Asteroides
    asteroids.forEach(asteroid => {
        if (asteroid.toRemove) return;
        
        const dist = Math.hypot(player.x - asteroid.x, player.y - asteroid.y);
        const collisionDist = (player.width / 2) + asteroid.radius - 4;
        
        if (dist < collisionDist) {
            asteroid.toRemove = true;
            sounds.playExplosion();
            
            let dmg = 25;
            if (asteroid.size === 'medium') dmg = 15;
            if (asteroid.size === 'small') dmg = 8;
            
            const damaged = player.takeDamage(dmg, particles, floatingTexts);
            if (damaged) {
                triggerScreenShake(20, 8);
                damageFlash = 7;
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(player.x, player.y, '#f59e0b', 1.3));
                }
            }
        }
    });

    // 6. Jogador vs Inimigos
    enemies.forEach(enemy => {
        if (enemy.toRemove) return;
        
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        const collisionDist = (player.width / 2) + (enemy.width / 2) - 4;
        
        if (dist < collisionDist) {
            enemy.toRemove = true;
            sounds.playExplosion();
            
            const damaged = player.takeDamage(30, particles, floatingTexts);
            if (damaged) {
                triggerScreenShake(25, 10);
                damageFlash = 8;
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(enemy.x, enemy.y, enemy.color, 1.5));
                }
            }
        }
    });

    // 7. Coleta de Power-ups pelo Jogador
    powerups.forEach(pw => {
        if (pw.toRemove) return;
        
        const dist = Math.hypot(player.x - pw.x, player.y - pw.y);
        if (dist < (player.width / 2) + pw.radius) {
            pw.toRemove = true;
            sounds.playPowerUp();
            
            let text = "";
            switch (pw.type) {
                case 'heal':
                    player.hp = Math.min(player.maxHp, player.hp + 35);
                    text = "INTEGRIDADE +35%";
                    break;
                case 'shield':
                    player.shield = player.maxShield;
                    player.shieldDuration = 480; 
                    player.shieldTemporary = true;
                    player.shieldExpired = false;
                    text = "ESCUDO RECARREGADO!";
                    break;
                case 'doubleshot':
                    player.powerups.doubleShot = 600; 
                    text = "TIRO DUPLO!";
                    break;
                case 'hyperdrive':
                    player.powerups.hyperdrive = 300; 
                    text = "HYPERDRIVE ATIVO!";
                    break;
                case 'weapon_vulcan':
                    player.weapon = 'vulcan';
                    text = "VULCAN RÁPIDO EQUIPADO!";
                    break;
                case 'weapon_cannon':
                    player.weapon = 'cannon';
                    text = "CANHÃO PESADO EQUIPADO!";
                    break;
                case 'weapon_spread':
                    player.weapon = 'spread';
                    text = "ESPALHADOR TRIPLO EQUIPADO!";
                    break;
                case 'weapon_sniper':
                    player.weapon = 'sniper';
                    text = "TRILHO PERFURANTE EQUIPADO!";
                    break;
            }
            
            floatingTexts.push(new FloatingText(player.x, player.y - 30, text, pw.color, pw.isWeapon ? 18 : 16));
            
            const burstCount = pw.isWeapon ? 24 : 10;
            for (let i = 0; i < burstCount; i++) {
                particles.push(new Particle(pw.x, pw.y, pw.color, pw.isWeapon ? 1.3 : 0.8));
            }
            
            if (pw.isWeapon) {
                triggerScreenShake(10, 3);
                sounds.playShieldDown();
            }
        }
    });
}

// --- ATUALIZAÇÕES DO HUD ---
function updateHUD() {
    hpBar.style.width = `${Math.max(0, player.hp)}%`;
    const shieldTimePct = player.shieldDuration > 0 ? (player.shieldDuration / 480) * 100 : 0;
    shieldBar.style.width = `${Math.max(0, Math.min(player.shield, shieldTimePct))}%`;
    
    scoreVal.innerText = String(score).padStart(6, '0');
    highscoreVal.innerText = String(highscore).padStart(6, '0');
    
    if (weaponNameVal) {
        const weapon = WEAPON_STATS[player.weapon] || WEAPON_STATS.blaster;
        weaponNameVal.innerText = weapon.name;
        weaponNameVal.style.color = weapon.color;
    }
    
    const powerupLabels = { doubleShot: 'Tiro Duplo', hyperdrive: 'Hyperdrive' };
    for (const [key, label] of Object.entries(powerupLabels)) {
        let badge = powerupIndicatorContainer.querySelector(`[data-powerup="${key}"]`);
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'powerup-badge';
            badge.dataset.powerup = key;
            badge.style.setProperty('--border-color', key === 'doubleShot' ? '#a855f7' : '#f59e0b');
            badge.style.setProperty('--fill-color', key === 'doubleShot' ? '#a855f7' : '#f59e0b');
            const title = document.createElement('span');
            title.className = 'powerup-badge-label';
            title.textContent = label;
            const bar = document.createElement('div');
            bar.className = 'powerup-badge-bar';
            const fill = document.createElement('div');
            fill.className = 'powerup-badge-fill';
            bar.appendChild(fill);
            badge.append(title, bar);
            powerupIndicatorContainer.appendChild(badge);
        }
        const timeRemaining = player.powerups[key] || 0;
        badge.hidden = timeRemaining <= 0;
        const fill = badge.querySelector('.powerup-badge-fill');
        if (fill) fill.style.width = `${Math.max(0, Math.min(100, (timeRemaining / (key === 'hyperdrive' ? 300 : 600)) * 100))}%`;
    }
}

// --- LOOP PRINCIPAL DO JOGO ---
function gameLoop(timestamp) {
    if (gameState !== 'playing') return;
    const { steps } = simulationClock.advance(timestamp);
    for (let i = 0; i < steps && gameState === 'playing'; i++) updateGame();
    renderGame();
    if (gameState === 'playing') scheduleGameLoop();
}

function updateGame() {
    if (gameState !== 'playing') return;
    spaceBackground.update(1);
    player.update(GAME_WIDTH, GAME_HEIGHT, keys, settings, particles, floatingTexts);
    if (player.hp <= 0) triggerGameOver();
    if (screenShake.duration > 0) screenShake.duration--;

    // 3. Atualizações de Estado das Entidades

    if (settings.autofire) {
        player.shoot(lasers);
    } else if (keys[keyBindings.fire] || keys['ShiftLeft'] || keys['ShiftRight'] || mouseClicked) {
        player.shoot(lasers);
        mouseClicked = false; 
    }
    
    if (score >= nextHordeScore && !hordeActive && !bossActive && !boss && !subBossActive && !subBoss) {
        hordeActive = true;
        triggerHordeEvent();
        nextHordeScore = score + 5000; 
    }
    if (score >= nextSubBossScore && !subBossActive && !subBoss && !bossActive && !boss && !hordeActive) {
        subBossActive = true;
        const subBossTypes = ['scythe', 'deflector', 'interceptor'];
        const currentType = subBossTypes[subBossCount % subBossTypes.length];
        subBoss = new SubBoss(GAME_WIDTH + 60, GAME_HEIGHT / 2, currentType);
        subBossCount++;
        sounds.playShieldDown();
        floatingTexts.push(new FloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, `ALERTA: SUBCHEFE ${currentType.toUpperCase()} DETECTADO!`, '#06b6d4', 20));
        triggerScreenShake(20, 6);
    }
    if (score >= nextBossScore && !bossActive && !boss && !subBossActive && !subBoss && !hordeActive) {
        bossActive = true;
        const bossTypes = ['dreadnought', 'carrier', 'destroyer'];
        const currentType = bossTypes[bossCount % bossTypes.length];
        boss = new Boss(GAME_WIDTH + 80, GAME_HEIGHT / 2, currentType);
        bossCount++;
        bossHealthContainer.classList.remove('hidden');
        bossHpBar.style.width = '100%';
        const bossTitleEl = document.querySelector('.boss-title');
        if (bossTitleEl) bossTitleEl.innerText = `${currentType.toUpperCase()} ROBÔ ALERTA`;
        sounds.playShieldDown();
        setTimeout(() => sounds.playShieldDown(), 350);
        triggerScreenShake(30, 8);
    }
    if (hordeSpawnQueue.length > 0) {
        hordeSpawnQueue = hordeSpawnQueue.filter(item => {
            item.delay--;
            if (item.delay <= 0) { enemies.push(new Enemy(item.x, item.y, item.enemyType)); return false; }
            return true;
        });
    }
    if (hordeActive && hordeSpawnQueue.length === 0 && enemies.length === 0) {
        hordeActive = false;
        floatingTexts.push(new FloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'HORDA ELIMINADA!', '#22c55e', 18));
    }
    handleSpawning();
    handleCollisions();
    updateCombo();
    lasers = lasers.filter(laser => { laser.update(GAME_WIDTH, GAME_HEIGHT); return !laser.toRemove; });
    if (bossActive && boss) boss.update(GAME_HEIGHT, lasers);
    if (subBossActive && subBoss) subBoss.update(GAME_HEIGHT, lasers);
    asteroids = asteroids.filter(asteroid => { asteroid.update(GAME_WIDTH); return !asteroid.toRemove; });
    enemies = enemies.filter(enemy => { enemy.update(GAME_HEIGHT, lasers); return !enemy.toRemove; });
    powerups = powerups.filter(pw => { pw.update(); return !pw.toRemove; });
    creditsArray = creditsArray.filter(c => {
        c.update(player);
        const dist = Math.hypot(player.x - c.x, player.y - c.y);
        if (dist < (player.width / 2) + c.radius && player.hp > 0) {
            credits++;
            saveUpgrades();
            sounds.playPowerUp();
            floatingTexts.push(new FloatingText(c.x, c.y, '+1 CR', '#facc15', 14));
            for (let i = 0; i < 5; i++) particles.push(new Particle(c.x, c.y, '#facc15', 0.5));
            c.toRemove = true;
        }
        return !c.toRemove;
    });
    particles = particles.filter(part => part.update());
    if (particles.length > 500) particles = particles.slice(-500);
    floatingTexts = floatingTexts.filter(ft => ft.update());
    if (damageFlash > 0) damageFlash--;
    if (bossDefeatFlash > 0) bossDefeatFlash--;
    updateHUD();
}

function renderGame() {
    // 1. Limpa o Canvas com Cor de Fundo Arcade Solida
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Controla o tremor de tela
    ctx.save();
    if (screenShake.duration > 0) {
        const dx = (Math.random() * 2 - 1) * screenShake.intensity;
        const dy = (Math.random() * 2 - 1) * screenShake.intensity;
        ctx.translate(dx, dy);
    }
    
    // 4. Renderização Geral
    drawBackground();
    // Estrelas e partículas já fazem parte do cenário em camadas; as antigas streaks
    // foram removidas para manter o fundo calmo e legível durante o combate.
    
    powerups.forEach(pw => pw.draw(ctx));
    creditsArray.forEach(c => c.draw(ctx));
    lasers.forEach(l => l.draw(ctx));
    asteroids.forEach(a => a.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    
    if (bossActive && boss) {
        boss.draw(ctx);
    }

    if (subBossActive && subBoss) {
        subBoss.draw(ctx);
    }
    
    player.draw(ctx);
    
    floatingTexts.forEach(ft => ft.draw(ctx));

    // Efeitos de Flash de Tela Estilo Cartoon
    if (damageFlash > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(.22, damageFlash * .025)})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    if (bossDefeatFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(bossDefeatFlash / 15) * 0.5})`; 
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    
    ctx.restore(); 
    
}

// --- GERENCIAMENTO DE ESTADOS DO JOGO ---

function startGame() {
    sounds.init();
    simulationClock.reset();
    
    gameState = 'playing';
    score = 0;
    combo = 0;
    comboTimer = 0;
    
    stats.kills = 0;
    stats.asteroids = 0;
    stats.startTime = Date.now();
    
    boss = null;
    bossActive = false;
    subBoss = null;
    subBossActive = false;
    nextBossScore = 10000;
    nextSubBossScore = 5000;
    bossCount = 0;
    subBossCount = 0;
    difficultyMultiplier = 1.0;
    
    hordeActive = false;
    nextHordeScore = 2500;
    hordeSpawnQueue = [];
    
    lasers = [];
    asteroids = [];
    enemies = [];
    powerups = [];
    particles = [];
    floatingTexts = [];
    damageFlash = 0;
    bossDefeatFlash = 0;
    
    spawnTimers.asteroid = 0;
    spawnTimers.enemy = 0;
    spawnTimers.powerupPassive = 0;

    loadUpgrades();
    creditsArray = [];

    const rules = getDifficultySettings();
    player = new Player(150, GAME_HEIGHT / 2);
    // Aplica upgrades de HP máximo
    player.maxHp = rules.playerHP + (upgrades.hp * 10);
    player.hp = player.maxHp;
    
    // Aplica upgrades de Escudo máximo e inicial
    player.maxShield = 100;
    player.shield = upgrades.shield * 20;
    player.shieldTemporary = false;
    player.shieldExpired = false;
    if (player.shield > 0) {
        player.shieldDuration = 999999; // Escudo inicial permanente até sofrer impacto
    } else {
        player.shieldDuration = 0;
    }
    
    player.weapon = 'blaster'; 
    
    highscore = loadHighscore();
    
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.add('hidden'));
    bossHealthContainer.classList.add('hidden');
    hud.classList.remove('hidden');
    
    scheduleGameLoop();
}

function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    pauseScreen.classList.add('active');
    pauseScreen.classList.remove('hidden');
}

function resumeGame() {
    if (gameState !== 'paused') return;
    gameState = 'playing';
    pauseScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');
    
    simulationClock.reset();
    scheduleGameLoop();
}

function triggerGameOver() {
    gameState = 'gameover';
    sounds.playExplosion();
    
    triggerScreenShake(40, 15);
    
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(player.x, player.y, '#0284c7', 2));
        particles.push(new Particle(player.x, player.y, '#ef4444', 1.5));
    }
    
    stats.flightTime = Math.floor((Date.now() - stats.startTime) / 1000);
    
    if (score > highscore) {
        highscore = score;
        saveHighscore(highscore);
    }
    
    finalScore.innerText = score;
    finalKills.innerText = stats.kills;
    finalAsteroids.innerText = stats.asteroids;
    finalTime.innerText = `${stats.flightTime}s`;
    
    hud.classList.add('hidden');
    bossHealthContainer.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
}

function loadHighscore() {
    try {
        const saved = localStorage.getItem('sky_dash_highscore') || localStorage.getItem('neon_nebula_highscore');
        const value = Number.parseInt(saved, 10);
        return Number.isFinite(value) ? Math.max(0, value) : 0;
    } catch (_) {
        return 0;
    }
}

function saveHighscore(value) {
    try { localStorage.setItem('sky_dash_highscore', String(Math.max(0, Math.floor(value)))); } catch (_) {}
}

function triggerHordeEvent() {
    const formations = ['V-shape', 'Line', 'Swarm'];
    const randFormation = formations[Math.floor(Math.random() * formations.length)];
    
    sounds.playShieldDown(); 
    triggerScreenShake(25, 6);
    
    let labelText = "";
    if (randFormation === 'V-shape') {
        labelText = "HORDA: FORMAÇÃO EM V (DRONES)!";
        const startY = Math.random() * 140 + 200;
        hordeSpawnQueue.push({ enemyType: 'drone', x: GAME_WIDTH + 50, y: startY, delay: 1 });
        hordeSpawnQueue.push({ enemyType: 'drone', x: GAME_WIDTH + 90, y: startY - 40, delay: 10 });
        hordeSpawnQueue.push({ enemyType: 'drone', x: GAME_WIDTH + 90, y: startY + 40, delay: 10 });
        hordeSpawnQueue.push({ enemyType: 'drone', x: GAME_WIDTH + 130, y: startY - 80, delay: 20 });
        hordeSpawnQueue.push({ enemyType: 'drone', x: GAME_WIDTH + 130, y: startY + 80, delay: 20 });
    } else if (randFormation === 'Line') {
        labelText = "HORDA: BLOQUEIO VERTICAL (DEFENDERS)!";
        hordeSpawnQueue.push({ enemyType: 'defender', x: GAME_WIDTH + 50, y: GAME_HEIGHT * 0.2, delay: 1 });
        hordeSpawnQueue.push({ enemyType: 'defender', x: GAME_WIDTH + 50, y: GAME_HEIGHT * 0.4, delay: 5 });
        hordeSpawnQueue.push({ enemyType: 'defender', x: GAME_WIDTH + 50, y: GAME_HEIGHT * 0.6, delay: 10 });
        hordeSpawnQueue.push({ enemyType: 'defender', x: GAME_WIDTH + 50, y: GAME_HEIGHT * 0.8, delay: 15 });
    } else { 
        labelText = "HORDA: ENXAME DE KAMIKAZES!";
        for (let i = 0; i < 6; i++) {
            const randY = Math.random() * (GAME_HEIGHT - 120) + 60;
            hordeSpawnQueue.push({ enemyType: 'kamikaze', x: GAME_WIDTH + 50, y: randY, delay: i * 15 + 1 });
        }
    }
    
    floatingTexts.push(new FloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, labelText, '#ef4444', 20));
}
