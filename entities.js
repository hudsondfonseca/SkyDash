/**
 * entities.js
 * Classes para os objetos e entidades do jogo Flappy Space Shooter.
 * Estilo Visual: 2D Arcade / Cartoon (Jetpack Joyride Style)
 */

// --- CLASSE PARTÍCULA (FUMAÇA / FAÍSCAS CARTOON) ---
class Particle {
    constructor(x, y, color, sizeMultiplier = 1) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.size = (Math.random() * 3 + 2) * sizeMultiplier;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.025 + 0.02; 
        this.gravity = 0.03; 
    }

    update() {
        this.x += this.vx;
        this.y += this.vy + this.gravity;
        this.alpha -= this.decay;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const x = Math.round(this.x / 3) * 3, y = Math.round(this.y / 3) * 3;
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, Math.max(3, Math.ceil(this.size / 3) * 3), Math.max(3, Math.ceil(this.size / 3) * 3));
        
        ctx.restore();
    }
}

// --- CATÁLOGO DE ARMAS DO JOGADOR (PALETA VIBRANTE DE ARCADE) ---
const WEAPON_STATS = {
    blaster: {
        name: 'Blaster Padrão',
        color: '#0284c7', // Azul Arcade
        damage: 10,
        interval: 13,
        speed: 8,
        width: 14,
        height: 5,
        pattern: 'single'
    },
    vulcan: {
        name: 'Vulcan Rápido',
        color: '#f59e0b', // Amarelo Alerta
        damage: 5,
        interval: 6,
        speed: 9,
        width: 10,
        height: 4,
        pattern: 'single'
    },
    cannon: {
        name: 'Canhão Pesado',
        color: '#ef4444', // Vermelho Intenso
        damage: 34,
        interval: 30,
        speed: 7,
        width: 26,
        height: 9,
        pattern: 'single'
    },
    spread: {
        name: 'Espalhador Triplo',
        color: '#d946ef', // Rosa Magenta
        damage: 8,
        interval: 18,
        speed: 8,
        width: 13,
        height: 5,
        pattern: 'spread'
    },
    sniper: {
        name: 'Trilho Perfurante',
        color: '#10b981', // Verde Esmeralda
        damage: 46,
        interval: 34,
        speed: 17,
        width: 30,
        height: 4,
        pattern: 'single'
    }
};

// --- CLASSE LASER / PROJÉTIL (BALAS DE ARCADE) ---
class Laser {
    constructor(x, y, angle, isPlayerLaser = true, type = 'normal') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.isPlayerLaser = isPlayerLaser;
        this.type = type; 
        
        const weaponStat = isPlayerLaser ? WEAPON_STATS[type] : null;
        
        this.speed = weaponStat ? weaponStat.speed : (isPlayerLaser ? 8 : 6.5);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.width = weaponStat ? weaponStat.width : (isPlayerLaser ? 14 : 12);
        this.height = weaponStat ? weaponStat.height : 5;
        
        this.color = weaponStat ? weaponStat.color : (isPlayerLaser ? '#0284c7' : '#ef4444');
        if (!weaponStat && type === 'heavy') {
            this.color = '#f97316';
            this.width = 24;
            this.height = 8;
        }
        
        this.damage = weaponStat ? weaponStat.damage : (type === 'heavy' ? 30 : 10);
        this.toRemove = false;
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.imageSmoothingEnabled = false;
        ctx.rotate(this.angle);
        // Crisp pixel beam inspired by the supplied energy-shot PSDs.
        ctx.fillStyle = '#10172d'; ctx.fillRect(-this.width / 2 - 2, -this.height / 2 - 2, this.width + 4, this.height + 4);
        ctx.fillStyle = this.color; ctx.fillRect(-this.width / 2, -Math.max(2, Math.floor(this.height / 2)), this.width - 2, Math.max(4, this.height));
        ctx.fillStyle = '#fff0ad'; ctx.fillRect(-this.width / 2 + 2, -1, Math.max(3, this.width - 6), 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(this.width / 2 - 4, -1, 3, 2);
        
        ctx.restore();
    }
}

// --- CLASSE NAVE DO JOGADOR ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 38;
        this.height = 26;
        
        this.vy = 0;
        this.vx = 0; 
        this.targetY = y;
        this.usingKeyboard = false;
        
        this.minX = 50;
        this.maxXRatio = 0.62; 
        
        this.maxHp = 100;
        this.hp = 100;
        this.maxShield = 100;
        this.shield = 0; 
        this.shieldRegenRate = 0;
        this.shieldDuration = 0; 
        this.shieldTemporary = false;
        this.shieldExpired = false;
        
        this.shootCooldown = 0;
        this.shootInterval = 13; 
        
        this.weapon = 'blaster';
        
        this.powerups = {
            doubleShot: 0,
            hyperdrive: 0
        };
        
        this.invulnerabilityFrames = 0;
    }

    takeDamage(amount, particles, floatingTexts) {
        if (this.invulnerabilityFrames > 0) return false;
        
        sounds.playDamage();
        this.invulnerabilityFrames = 45; 
        
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield <= 0) {
                this.shield = 0;
                if (this.shieldTemporary) {
                    this.shieldDuration = 0;
                    this.shieldTemporary = false;
                    this.shieldExpired = true;
                }
                sounds.playShieldDown();
                if (floatingTexts) {
                    floatingTexts.push(new FloatingText(this.x, this.y - 30, "ESCUDO DESTRUÍDO!", '#0284c7', 18));
                }
                if (particles) {
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(this.x, this.y, '#0284c7', 1.5));
                    }
                }
            }
        } else {
            this.hp -= amount;
            if (this.hp < 0) this.hp = 0;
        }
        return true;
    }

    update(canvasWidth, canvasHeight, keys, settings, particles, floatingTexts) {
        const accel = 0.5;
        const maxSpeed = 6;
        const friction = 0.88;
        
        if (keys[keyBindings.up] || (keyBindings.up === 'KeyW' && keys['ArrowUp'])) {
            this.vy -= accel;
            this.usingKeyboard = true;
        } else if (keys[keyBindings.down] || (keyBindings.down === 'KeyS' && keys['ArrowDown'])) {
            this.vy += accel;
            this.usingKeyboard = true;
        } else {
            if (this.usingKeyboard) {
                this.vy *= friction;
                if (Math.abs(this.vy) < 0.05) this.vy = 0;
            }
        }

        if (!this.usingKeyboard && this.targetY !== undefined) {
            const dy = this.targetY - this.y;
            this.vy = dy * 0.12; 
            
            if (this.vy > maxSpeed) this.vy = maxSpeed;
            if (this.vy < -maxSpeed) this.vy = -maxSpeed;
        }

        this.y += this.vy;
        
        const minY = this.height / 2 + 10;
        const maxY = canvasHeight - this.height / 2 - 10;
        if (this.y < minY) {
            this.y = minY;
            this.vy = 0;
        }
        if (this.y > maxY) {
            this.y = maxY;
            this.vy = 0;
        }
        
        const accelX = 0.45;
        const maxSpeedX = 5.5;
        const frictionX = 0.9;
        
        if (keys[keyBindings.right] || (keyBindings.right === 'KeyD' && keys['ArrowRight'])) {
            this.vx += accelX;
        } else if (keys[keyBindings.left] || (keyBindings.left === 'KeyA' && keys['ArrowLeft'])) {
            this.vx -= accelX;
        } else {
            this.vx *= frictionX;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
        }
        
        if (this.vx > maxSpeedX) this.vx = maxSpeedX;
        if (this.vx < -maxSpeedX) this.vx = -maxSpeedX;
        
        this.x += this.vx;
        
        const maxX = canvasWidth * this.maxXRatio;
        if (this.x < this.minX) {
            this.x = this.minX;
            this.vx = 0;
        }
        if (this.x > maxX) {
            this.x = maxX;
            this.vx = 0;
        }
        
        if (this.shield > 0) {
            if (this.shieldTemporary && this.shieldDuration > 0) {
                this.shieldDuration--;
                if (this.shieldDuration <= 0) {
                    this.shield = 0;
                    this.shieldDuration = 0;
                    this.shieldTemporary = false;
                    this.shieldExpired = true;
                    sounds.playShieldDown();
                    if (floatingTexts) {
                        floatingTexts.push(new FloatingText(this.x, this.y - 30, "ESCUDO EXPIRADO!", '#0284c7', 16));
                    }
                    if (particles) {
                        for (let i = 0; i < 15; i++) {
                            particles.push(new Particle(this.x, this.y, '#0284c7', 1.2));
                        }
                    }
                }
            }
        }
        
        // Regeneração passiva de escudo (Exige upgrade de Escudo e de Regeneração)
        if (typeof upgrades !== 'undefined' && upgrades.shield > 0 && upgrades.regen > 0 && this.hp > 0 && !this.shieldTemporary && !this.shieldExpired) {
            const maxUpgShield = upgrades.shield * 20;
            if (this.shield < maxUpgShield) {
                this.shield += 0.015 * upgrades.regen; // regenera por frame
                if (this.shield > maxUpgShield) this.shield = maxUpgShield;
                if (this.shieldDuration <= 0) this.shieldDuration = 999999;
            }
        }
        
        Object.keys(this.powerups).forEach(key => {
            if (this.powerups[key] > 0) {
                this.powerups[key]--;
            }
        });
        
        if (this.invulnerabilityFrames > 0) {
            this.invulnerabilityFrames--;
        }
        
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // Fumaça / Chamas do motor estilo Jetpack Joyride
        const engineIntensity = 0.45 + Math.min(Math.abs(this.vx) * 0.08, 0.35);
        if (Math.random() < engineIntensity && this.hp > 0) {
            const particleColor = this.powerups.hyperdrive > 0 ? '#f59e0b' : '#06b6d4';
            const particleSize = 0.75 + Math.min(Math.abs(this.vx) * 0.08, 0.4);
            particles.push(new Particle(this.x - 18, this.y, particleColor, particleSize));
            // Fumaça cinza de fundo
            if (Math.random() < 0.4) {
                particles.push(new Particle(this.x - 22, this.y, '#6b7280', particleSize * 0.8));
            }
        }
        
        if (this.vx < -1 && this.hp > 0 && Math.random() < 0.5) {
            particles.push(new Particle(this.x + 18, this.y, '#f59e0b', 0.5));
        }
    }

    shoot(lasers) {
        if (this.shootCooldown > 0 || this.hp <= 0) return false;
        
        const weapon = WEAPON_STATS[this.weapon] || WEAPON_STATS.blaster;
        sounds.playLaser(this.weapon);
        
        let rate = weapon.interval;
        let speedMult = 1;
        if (this.powerups.hyperdrive > 0) {
            rate = Math.max(3, Math.floor(weapon.interval / 2.5)); 
            speedMult = 1.5; 
        }
        
        // Aplica upgrade de cadência de disparo (Reduz cooldown em 8% por nível)
        if (typeof upgrades !== 'undefined' && upgrades.firerate > 0) {
            rate = Math.max(2, Math.floor(rate * (1 - upgrades.firerate * 0.08)));
        }
        
        this.shootCooldown = rate;
        
        const laserYOffset = 4;
        const muzzleX = this.x + 15;
        const doubled = this.powerups.doubleShot > 0;
        
        const spawnShot = (offsetY, angle = 0) => {
            const l = new Laser(muzzleX, this.y + offsetY, angle, true, this.weapon);
            l.speed *= speedMult;
            l.vx = Math.cos(angle) * l.speed;
            l.vy = Math.sin(angle) * l.speed;
            lasers.push(l);
        };
        
        if (weapon.pattern === 'spread') {
            spawnShot(0, 0);
            spawnShot(0, -0.22);
            spawnShot(0, 0.22);
            if (doubled) {
                spawnShot(-14, 0);
                spawnShot(14, 0);
            }
        } else if (doubled) {
            spawnShot(-laserYOffset - 6);
            spawnShot(laserYOffset + 6);
        } else {
            spawnShot(0);
        }
        
        return true;
    }

    draw(ctx) {
        if (this.hp <= 0) return;
        
        if (this.invulnerabilityFrames > 0 && Math.floor(this.invulnerabilityFrames / 3) % 2 === 0) {
            return;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const angle = Math.min(Math.max(this.vy * 0.05, -0.4), 0.4);
        ctx.rotate(Math.round(angle * 4) / 4);
        
        // Escudo de Energia Espacial
        if (this.shield > 0) {
            ctx.save();
            ctx.strokeStyle = '#00f0ff';
            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(4, 0, this.width * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        
        // Caça pixel art: silhueta azul, asas em degraus e cockpit âmbar.
        const flame = this.powerups.hyperdrive > 0 ? '#ffe45e' : '#ff9b42';
        ctx.fillStyle = '#ffcf68';
        ctx.fillRect(-29, -3, 5, 6);
        ctx.fillStyle = flame;
        ctx.fillRect(-24, -2, 7, 4);
        ctx.fillStyle = '#182b48';
        ctx.fillRect(-17, -11, 8, 4); ctx.fillRect(-12, -7, 9, 4);
        ctx.fillRect(-17, 7, 8, 4); ctx.fillRect(-12, 3, 9, 4);
        ctx.fillStyle = '#274b68';
        ctx.fillRect(-15, -6, 25, 12); ctx.fillRect(-8, -9, 19, 18);
        ctx.fillStyle = '#55a8a1';
        ctx.fillRect(-8, -5, 20, 10); ctx.fillRect(5, -3, 12, 6);
        ctx.fillStyle = '#f2d58a';
        ctx.fillRect(13, -2, 9, 4); ctx.fillRect(17, -1, 7, 2);
        ctx.fillStyle = '#f7b955';
        ctx.fillRect(0, -4, 8, 4); ctx.fillRect(3, 0, 5, 3);
        ctx.fillStyle = '#d9f1cb';
        ctx.fillRect(-5, -2, 3, 2);
        ctx.fillStyle = '#16283b';
        ctx.fillRect(-13, -10, 10, 3); ctx.fillRect(-13, 7, 10, 3);
        ctx.fillStyle = '#8bd0b2';
        ctx.fillRect(-10, -9, 4, 2); ctx.fillRect(-10, 7, 4, 2);
        
        ctx.restore();
    }
}

// --- CLASSE ASTEROIDE (OBSTÁCULOS DE PEDRA / METAL 2D) ---
class Asteroid {
    constructor(x, y, size = 'large') {
        this.x = x;
        this.y = y;
        this.size = size;
        
        if (size === 'large') {
            this.radius = Math.random() * 8 + 24;
            this.hp = 30;
            this.points = 150;
            this.speedX = -(Math.random() * 1.0 + 1.0);
        } else if (size === 'medium') {
            this.radius = Math.random() * 6 + 14;
            this.hp = 15;
            this.points = 100;
            this.speedX = -(Math.random() * 1.2 + 1.2);
        } else {
            this.radius = Math.random() * 4 + 7;
            this.hp = 5;
            this.points = 50;
            this.speedX = -(Math.random() * 1.5 + 1.5);
        }
        
        this.speedY = Math.random() * 1 - 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() * 0.02 - 0.01);
        
        this.vertices = [];
        const numVertices = Math.floor(Math.random() * 4) + 8;
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const offset = (Math.random() * 0.3 - 0.15) * this.radius;
            this.vertices.push({
                x: Math.cos(angle) * (this.radius + offset),
                y: Math.sin(angle) * (this.radius + offset)
            });
        }
        
        this.color = '#78716c'; // Cinza Rochoso Cartoon
        this.toRemove = false;
    }

    update(canvasWidth) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        if (this.x < -this.radius * 2) {
            this.toRemove = true;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(Math.round(this.rotation * 8) / 8);
        
        const r=Math.ceil(this.radius/4)*4;
        ctx.fillStyle='#202b39'; ctx.fillRect(-r+4,-r+8,r*2-8,r*2-16);
        ctx.fillRect(-r+8,-r+4,r*2-16,r*2-8);
        ctx.fillStyle='#687989'; ctx.fillRect(-r+8,-r+8,r*2-20,r*2-20);
        ctx.fillStyle='#a5b4ad'; ctx.fillRect(-r+12,-r+8,8,6); ctx.fillRect(-r+4,-r+4,8,6);
        ctx.fillStyle='#394a59'; ctx.fillRect(2,-r+14,8,6); ctx.fillRect(-r/2,4,8,6);
        ctx.fillStyle='#df9365'; ctx.fillRect(r/3,-r/2,5,5);
        
        ctx.restore();
    }
}

// --- CLASSE INIMIGO (NAVETA / ROBÔS ARCADE) ---
class Enemy {
    constructor(x, y, type = 'scout') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        if (type === 'bomber') {
            this.width = 40;
            this.height = 36;
            this.hp = 40;
            this.points = 300;
            this.speedX = -2;
            this.speedY = 0.5;
            this.shootInterval = 90;
            this.color = '#dc2626'; // Vermelho Alerta
            this.weaponType = 'heavy';
        } else if (type === 'kamikaze') {
            this.width = 24;
            this.height = 24;
            this.hp = 5; 
            this.points = 200;
            this.speedX = -5.5; 
            this.color = '#f59e0b'; // Amarelo Hazard
            this.weaponType = 'none'; 
            this.lockDistance = 360; 
            this.lockedY = false;
        } else if (type === 'defender') {
            this.width = 30;
            this.height = 24;
            this.hp = 20;
            this.points = 200;
            this.speedX = -2.2;
            this.speedY = 0.8;
            this.shootInterval = 100;
            this.color = '#0284c7'; // Azul Shield
            this.weaponType = 'normal';
            this.hasShield = true;
            this.shieldHp = 20; 
        } else if (type === 'sniper') {
            this.width = 24;
            this.height = 28;
            this.hp = 12;
            this.points = 250;
            this.speedX = -4; 
            this.speedY = 0;
            this.shootInterval = 70;
            this.color = '#10b981'; // Verde Caçador
            this.weaponType = 'heavy';
            this.shotsFired = 0;
            this.state = 'entering'; 
        } else if (type === 'drone') {
            this.width = 16;
            this.height = 12;
            this.hp = 5;
            this.points = 75;
            this.speedX = -5; 
            this.speedY = 0.4;
            this.shootInterval = 140;
            this.color = '#f97316'; // Laranja
            this.weaponType = 'normal';
        } else { // Scout
            this.width = 28;
            this.height = 20;
            this.hp = 10;
            this.points = 150;
            this.speedX = -3.5;
            this.speedY = 1.2;
            this.shootInterval = 110;
            this.color = '#9333ea'; // Roxo Lab
            this.weaponType = 'normal';
        }
        
        this.shootTimer = Math.random() * (this.shootInterval || 100);
        this.toRemove = false;
        
        this.sineAngle = Math.random() * Math.PI * 2;
        this.sineSpeed = (type === 'bomber' || type === 'defender') ? 0.02 : 0.04;
        this.sineAmplitude = (type === 'bomber' || type === 'defender') ? 1.5 : 3.5;
    }

    update(canvasHeight, lasers, player) {
        if (this.type === 'kamikaze') {
            if (this.x > this.lockDistance) {
                const dy = player ? (player.y - this.y) : 0;
                this.y += Math.sign(dy) * 2.8; 
                this.x += this.speedX;
            } else {
                this.x += this.speedX * 1.5;
            }
        } else if (this.type === 'sniper') {
            if (this.state === 'entering') {
                this.x += this.speedX;
                if (this.x <= 840) {
                    this.x = 840;
                    this.state = 'sniping';
                    this.speedX = 0;
                    this.shootTimer = 0;
                }
            } else if (this.state === 'sniping') {
                this.shootTimer++;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;
                    this.shoot(lasers);
                    this.shotsFired++;
                    if (this.shotsFired >= 3) {
                        this.state = 'retreating';
                        this.speedX = 3.5; 
                    }
                }
            } else if (this.state === 'retreating') {
                this.x += this.speedX;
            }
        } else {
            this.x += this.speedX;
            this.sineAngle += this.sineSpeed;
            this.y += Math.sin(this.sineAngle) * this.sineAmplitude;
            
            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.shoot(lasers);
            }
        }
        
        if (this.y < 30) this.y = 30;
        if (this.y > canvasHeight - 30) this.y = canvasHeight - 30;
        
        if (this.x < -50 || this.x > 1100) {
            this.toRemove = true;
        }
    }

    shoot(lasers) {
        if (this.weaponType === 'none') return;
        sounds.playEnemyLaser();
        lasers.push(new Laser(this.x - 10, this.y, Math.PI, false, this.weaponType));
    }

    takeDamage(amount) {
        if (this.hasShield && this.shieldHp > 0) {
            this.shieldHp -= amount;
            if (this.shieldHp <= 0) {
                this.shieldHp = 0;
                sounds.playShieldDown();
            }
            return false; 
        }
        this.hp -= amount;
        return this.hp <= 0;
    }

    draw(ctx) {
        if (drawShipSprite(ctx, this.type, this.x, this.y, this.width, this.height, { shield: this.hasShield ? this.shieldHp : 0 })) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Estilo Cartoon Arcade: Borda preta grossa em todos os inimigos
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.2;
        ctx.fillStyle = this.color;
        
        if (this.type === 'bomber') {
            // Corpo principal em forma de escudo biológico
            ctx.fillStyle = '#be123c'; // Vermelho alien escuro
            ctx.beginPath();
            ctx.moveTo(22, 0);
            ctx.lineTo(10, -18);
            ctx.lineTo(-12, -16);
            ctx.lineTo(-22, -8);
            ctx.lineTo(-22, 8);
            ctx.lineTo(-12, 16);
            ctx.lineTo(10, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Placas de armadura sobrepostas (segmentos)
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(4, -12);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-10, 10);
            ctx.lineTo(4, 12);
            ctx.lineTo(12, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bio-reatores / Pods de mísseis brilhantes
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(-6, -6, 4, 0, Math.PI * 2);
            ctx.arc(-6, 6, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Garras frontais
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(10, -12);
            ctx.lineTo(24, -14);
            ctx.lineTo(18, -4);
            ctx.moveTo(10, 12);
            ctx.lineTo(24, 14);
            ctx.lineTo(18, 4);
            ctx.stroke();
        } else if (this.type === 'kamikaze') {
            // Núcleo orgânico espinhoso
            ctx.fillStyle = '#ea580c'; // Laranja fogo
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(2, -6);
            ctx.lineTo(-4, -11);
            ctx.lineTo(-12, -4);
            ctx.lineTo(-8, 0);
            ctx.lineTo(-12, 4);
            ctx.lineTo(-4, 11);
            ctx.lineTo(2, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Olho central instável
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(2, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Chama ácida/plasma verde-laranja
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.moveTo(-8, -4);
            ctx.lineTo(-20 - Math.random() * 8, 0);
            ctx.lineTo(-8, 4);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'defender') {
            // Corpo de domo hexagonal
            ctx.fillStyle = '#0284c7'; // Azul Shield
            ctx.beginPath();
            ctx.moveTo(16, 0);
            ctx.lineTo(6, -14);
            ctx.lineTo(-14, -10);
            ctx.lineTo(-14, 10);
            ctx.lineTo(6, 14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Núcleo de barreira geradora
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(-2, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Placas defletoras superiores/inferiores
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(-10, -13, 8, 3);
            ctx.strokeRect(-10, -13, 8, 3);
            ctx.fillRect(-10, 10, 8, 3);
            ctx.strokeRect(-10, 10, 8, 3);

            // Escudo ciano semicircular
            if (this.shieldHp > 0) {
                ctx.save();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 3.5;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(4, 0, 22, -Math.PI / 1.8, Math.PI / 1.8, false); 
                ctx.stroke();
                ctx.restore();
            }
        } else if (this.type === 'sniper') {
            // Fuselagem insectoide alongada
            ctx.fillStyle = '#065f46'; // Verde escuro bio
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-4, -12);
            ctx.lineTo(-18, -10);
            ctx.lineTo(-12, 0);
            ctx.lineTo(-18, 10);
            ctx.lineTo(-4, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Asas de libélula alienígena
            ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(-16, -22);
            ctx.lineTo(-12, -22);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-6, 6);
            ctx.lineTo(-16, 22);
            ctx.lineTo(-12, 22);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Canhão longo central elétrico
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(24, 0);
            ctx.stroke();
            
            // Ponta do canhão brilhante (laser carregador)
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(24, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'drone') {
            // Anel externo orbitando
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 11, 7, Math.PI/4, 0, Math.PI * 2);
            ctx.stroke();

            // Esfera central do olho
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Lente brilhante ciano
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(2, 0, 2, 0, Math.PI * 2);
            ctx.fill();
        } else { // Scout (Disco Alienígena)
            // Anel externo do disco
            ctx.fillStyle = '#8b5cf6'; // Roxo alien
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Cúpula central brilhante
            ctx.fillStyle = '#a7f3d0';
            ctx.beginPath();
            ctx.arc(0, -3, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Luzes inferiores giratórias
            ctx.fillStyle = '#fb7185';
            ctx.beginPath();
            ctx.arc(-8, 2, 2, 0, Math.PI * 2);
            ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
            ctx.arc(8, 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// --- CLASSE CHEFE (BOSS ROBÔ ARCADE) ---
class Boss {
    constructor(x, y, type = 'dreadnought') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        this.shootTimer = 0;
        this.patternTimer = 0;
        this.patternIndex = 0; 
        
        this.toRemove = false;
        this.sineAngle = 0;
        
        if (type === 'carrier') {
            this.width = 120;
            this.height = 80;
            this.maxHp = 700;
            this.hp = 700;
            this.color = '#10b981'; 
            this.speedX = -1.0;
        } else if (type === 'destroyer') {
            this.width = 130;
            this.height = 60;
            this.maxHp = 850;
            this.hp = 850;
            this.color = '#ef4444'; 
            this.speedX = -0.8;
        } else { // dreadnought
            this.width = 110;
            this.height = 70;
            this.maxHp = 600;
            this.hp = 600;
            this.color = '#a855f7'; 
            this.speedX = -1.2;
            this.spiralAngle = 0;
        }
    }

    update(canvasHeight, lasers) {
        if (this.x > 750) {
            this.x += this.speedX;
        } else {
            this.sineAngle += 0.025;
            this.y = (canvasHeight / 2) + Math.sin(this.sineAngle) * 130;
        }
        
        this.patternTimer++;
        const limit = this.type === 'carrier' ? 360 : 300;
        if (this.patternTimer >= limit) {
            this.patternTimer = 0;
            this.patternIndex = (this.patternIndex + 1) % 3;
            this.shootTimer = 0; 
        }
        
        this.shootTimer++;
        this.executeAttack(lasers);
    }

    executeAttack(lasers) {
        if (this.x > 750) return; 
        
        if (this.type === 'carrier') {
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 40) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 40, this.y - 20, Math.PI, false));
                        lasers.push(new Laser(this.x - 40, this.y + 20, Math.PI, false));
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 90) {
                        this.shootTimer = 0;
                        sounds.playShieldDown();
                        
                        if (typeof enemies !== 'undefined' && enemies) {
                            const enemyType = Math.random() < 0.4 ? 'kamikaze' : 'scout';
                            const spawnY = this.y + (Math.random() * 80 - 40);
                            enemies.push(new Enemy(this.x - 50, spawnY, enemyType));
                        }
                    }
                    break;
                case 2:
                    if (this.shootTimer >= 60) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 45, this.y, Math.PI, false));
                        lasers.push(new Laser(this.x - 45, this.y, Math.PI - 0.25, false));
                        lasers.push(new Laser(this.x - 45, this.y, Math.PI + 0.25, false));
                    }
                    break;
            }
        } else if (this.type === 'destroyer') {
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 20) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 50, this.y - 8, Math.PI, false, 'heavy'));
                        lasers.push(new Laser(this.x - 50, this.y + 8, Math.PI, false, 'heavy'));
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 80) {
                        this.shootTimer = 0;
                        sounds.playShieldDown();
                        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                            lasers.push(new Laser(this.x - 40, this.y, angle, false));
                        }
                    }
                    break;
                case 2:
                    if (this.shootTimer >= 15) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        const angleOffset = Math.sin(Date.now() * 0.01) * 0.5;
                        lasers.push(new Laser(this.x - 40, this.y, Math.PI + angleOffset, false));
                    }
                    break;
            }
        } else { // dreadnought
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 45) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 50, this.y, Math.PI, false, 'heavy'));
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 65) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 30, this.y - 12, Math.PI, false));
                        lasers.push(new Laser(this.x - 30, this.y - 6, Math.PI - 0.22, false));
                        lasers.push(new Laser(this.x - 30, this.y + 6, Math.PI + 0.22, false));
                        lasers.push(new Laser(this.x - 30, this.y + 12, Math.PI, false));
                    }
                    break;
                case 2:
                    if (this.shootTimer >= 11) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        this.spiralAngle += 0.35;
                        const angleOffset = Math.sin(this.spiralAngle) * 0.75;
                        lasers.push(new Laser(this.x - 25, this.y, Math.PI + angleOffset, false));
                    }
                    break;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    draw(ctx) {
        if (drawShipSprite(ctx, this.type, this.x, this.y, this.width, this.height)) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Estilo Jetpack Boss: Placas robóticas grandes com contornos pretos super definidos
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.fillStyle = this.color;
        
        if (this.type === 'carrier') {
            // Silhueta de colmeia biológica
            ctx.fillStyle = '#064e3b'; // Verde musgo alien
            ctx.beginPath();
            ctx.moveTo(62, -15);
            ctx.lineTo(34, -42);
            ctx.lineTo(-44, -42);
            ctx.lineTo(-62, -20);
            ctx.lineTo(-62, 20);
            ctx.lineTo(-44, 42);
            ctx.lineTo(34, 42);
            ctx.lineTo(62, 15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Células receptoras biológicas brilhantes
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(-22, -22, 10, 0, Math.PI * 2);
            ctx.arc(-22, 22, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Hangares / Portões pretos
            ctx.fillStyle = '#022c22';
            ctx.fillRect(-4, -32, 24, 12);
            ctx.fillRect(-4, 20, 24, 12);
            ctx.strokeRect(-4, -32, 24, 12);
            ctx.strokeRect(-4, 20, 24, 12);
            
            // Grande Olho central do cruzador
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(14, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Pupila vertical brilhante
            ctx.fillStyle = '#a7f3d0';
            ctx.fillRect(12, -8, 4, 16);
        } else if (this.type === 'destroyer') {
            // Corpo em forma de Manta-Ray com pontas afiadas
            ctx.fillStyle = '#7f1d1d'; // Vermelho bio escuro
            ctx.beginPath();
            ctx.moveTo(68, 0);
            ctx.lineTo(12, -28);
            ctx.lineTo(-14, -46); // Asa superior
            ctx.lineTo(-44, -34);
            ctx.lineTo(-65, -15);
            ctx.lineTo(-48, 0);
            ctx.lineTo(-65, 15);
            ctx.lineTo(-44, 34);
            ctx.lineTo(-14, 46); // Asa inferior
            ctx.lineTo(12, 28);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Placas de armadura internas
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(-4, -18);
            ctx.lineTo(-32, -18);
            ctx.lineTo(-24, 0);
            ctx.lineTo(-32, 18);
            ctx.lineTo(-4, 18);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Canhões de asa (Heavy Launchers)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-14, -30);
            ctx.lineTo(16, -30);
            ctx.moveTo(-14, 30);
            ctx.lineTo(16, 30);
            ctx.stroke();
            
            // Núcleo energético principal (Pulsar)
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(-8, 0, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else { // dreadnought (Bio-Cruzador Alienígena)
            // Mandíbulas / Garras frontais gigantes
            ctx.fillStyle = '#581c87'; // Roxo bio escuro
            ctx.beginPath();
            ctx.moveTo(40, -18);
            ctx.lineTo(65, -34);
            ctx.lineTo(50, -10);
            ctx.moveTo(40, 18);
            ctx.lineTo(65, 34);
            ctx.lineTo(50, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Corpo blindado maciço
            ctx.fillStyle = '#701a75';
            ctx.beginPath();
            ctx.moveTo(45, 0);
            ctx.lineTo(25, -32);
            ctx.lineTo(-20, -36);
            ctx.lineTo(-45, -20);
            ctx.lineTo(-58, 0); 
            ctx.lineTo(-45, 20);
            ctx.lineTo(-20, 36);
            ctx.lineTo(25, 32);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Placas de carapaça roxas
            ctx.fillStyle = '#d946ef';
            ctx.beginPath();
            ctx.moveTo(10, -22);
            ctx.lineTo(-25, -24);
            ctx.lineTo(-35, 0);
            ctx.lineTo(-25, 24);
            ctx.lineTo(10, 22);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Reatores de plasma nas laterais
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(-35, -24, 12, 6);
            ctx.fillRect(-35, 18, 12, 6);
            ctx.strokeRect(-35, -24, 12, 6);
            ctx.strokeRect(-35, 18, 12, 6);
            
            // Núcleo central brilhante
            let energyColor = '#d946ef'; 
            if (this.patternIndex === 0) energyColor = '#fbbf24'; 
            if (this.patternIndex === 2) energyColor = '#06b6d4'; 
            
            ctx.fillStyle = energyColor;
            ctx.beginPath();
            ctx.arc(8, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// --- CLASSE SUBCHEFE (SUBBOSS ARCADE) ---
class SubBoss {
    constructor(x, y, type = 'scythe') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.toRemove = false;
        this.sineAngle = 0;
        this.shootTimer = 0;
        this.patternTimer = 0;
        this.patternIndex = 0;
        
        if (type === 'deflector') {
            this.width = 70;
            this.height = 50;
            this.maxHp = 240;
            this.hp = 240;
            this.color = '#f97316'; 
            this.speedX = -1.2;
            this.shieldAngle = 0;
            this.shieldHp = 80; 
        } else if (type === 'interceptor') {
            this.width = 60;
            this.height = 40;
            this.maxHp = 180;
            this.hp = 180;
            this.color = '#7c3aed'; 
            this.speedX = -1.8;
        } else { // scythe
            this.width = 75;
            this.height = 45;
            this.maxHp = 200;
            this.hp = 200;
            this.color = '#06b6d4'; 
            this.speedX = -1.5;
        }
    }

    update(canvasHeight, lasers) {
        if (this.x > 780) {
            this.x += this.speedX;
        } else {
            if (this.type === 'interceptor') {
                this.sineAngle += 0.05;
                this.y = (canvasHeight / 2) + Math.sin(this.sineAngle) * 140;
            } else {
                this.sineAngle += 0.03;
                this.y = (canvasHeight / 2) + Math.sin(this.sineAngle) * 110;
            }
        }
        
        if (this.type === 'deflector') {
            this.shieldAngle += 0.03;
        }
        
        this.patternTimer++;
        const limit = this.type === 'interceptor' ? 180 : 240;
        if (this.patternTimer >= limit) {
            this.patternTimer = 0;
            this.patternIndex = (this.patternIndex + 1) % 2;
            this.shootTimer = 0;
        }
        
        this.shootTimer++;
        this.executeAttack(lasers);
    }

    executeAttack(lasers) {
        if (this.x > 780) return;
        
        if (this.type === 'deflector') {
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 60) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 30, this.y, Math.PI, false, 'heavy'));
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 40) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 20, this.y - 12, Math.PI, false));
                        lasers.push(new Laser(this.x - 20, this.y + 12, Math.PI, false));
                    }
                    break;
            }
        } else if (this.type === 'interceptor') {
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 50) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        let angle = Math.PI;
                        if (typeof player !== 'undefined' && player) {
                            angle = Math.atan2(player.y - this.y, player.x - this.x);
                        }
                        
                        lasers.push(new Laser(this.x - 20, this.y, angle, false));
                        setTimeout(() => {
                            if (gameState === 'playing' && this.hp > 0) {
                                sounds.playEnemyLaser();
                                lasers.push(new Laser(this.x - 20, this.y, angle, false));
                            }
                        }, 120);
                        setTimeout(() => {
                            if (gameState === 'playing' && this.hp > 0) {
                                sounds.playEnemyLaser();
                                lasers.push(new Laser(this.x - 20, this.y, angle, false));
                            }
                        }, 240);
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 35) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 20, this.y, Math.PI - 0.2, false));
                        lasers.push(new Laser(this.x - 20, this.y, Math.PI + 0.2, false));
                    }
                    break;
            }
        } else { // scythe
            switch (this.patternIndex) {
                case 0:
                    if (this.shootTimer >= 50) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 30, this.y - 10, Math.PI, false));
                        lasers.push(new Laser(this.x - 30, this.y + 10, Math.PI, false));
                    }
                    break;
                case 1:
                    if (this.shootTimer >= 75) {
                        this.shootTimer = 0;
                        sounds.playEnemyLaser();
                        lasers.push(new Laser(this.x - 20, this.y, Math.PI, false));
                        lasers.push(new Laser(this.x - 20, this.y, Math.PI - 0.15, false));
                        lasers.push(new Laser(this.x - 20, this.y, Math.PI + 0.15, false));
                    }
                    break;
            }
        }
    }

    takeDamage(amount) {
        if (this.type === 'deflector' && this.shieldHp > 0) {
            this.shieldHp -= amount;
            if (this.shieldHp <= 0) {
                this.shieldHp = 0;
                sounds.playShieldDown();
            }
            return false; 
        }
        this.hp -= amount;
        return this.hp <= 0;
    }

    draw(ctx) {
        if (drawShipSprite(ctx, this.type, this.x, this.y, this.width, this.height, { shield: this.type === 'deflector' ? this.shieldHp : 0, shieldColor: '#32cfff' })) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.fillStyle = this.color;
        
        if (this.type === 'deflector') {
            // Corpo maciço de carapaça pesada
            ctx.fillStyle = '#c2410c'; // Laranja bio escuro
            ctx.beginPath();
            ctx.moveTo(32, 0);
            ctx.lineTo(12, -24);
            ctx.lineTo(-26, -24);
            ctx.lineTo(-34, 0);
            ctx.lineTo(-26, 24);
            ctx.lineTo(12, 24);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Placa protetora ciano
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(8, -14);
            ctx.lineTo(-18, -14);
            ctx.lineTo(-22, 0);
            ctx.lineTo(-18, 14);
            ctx.lineTo(8, 14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Cristais defletores
            ctx.fillStyle = '#ffedd5';
            ctx.beginPath();
            ctx.arc(-6, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
            
            // Anel defletor hexagonal externo
            if (this.shieldHp > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.shieldAngle);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#f97316';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const sx = Math.cos(angle) * 44;
                    const sy = Math.sin(angle) * 44;
                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
            ctx.save();
            ctx.translate(this.x, this.y);
        } else if (this.type === 'interceptor') {
            // Silhueta em asa-delta tripla aerodinâmica
            ctx.fillStyle = '#4f46e5'; // Indigo escuro
            ctx.beginPath();
            ctx.moveTo(32, 0);
            ctx.lineTo(6, -20);
            ctx.lineTo(-26, -16);
            ctx.lineTo(-14, 0);
            ctx.lineTo(-26, 16);
            ctx.lineTo(6, 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Propulsores traseiros de iões
            ctx.fillStyle = '#c7d2fe';
            ctx.beginPath();
            ctx.arc(-18, -6, 3, 0, Math.PI * 2);
            ctx.arc(-18, 6, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Cockpit visor de energia roxa
            ctx.fillStyle = '#818cf8';
            ctx.beginPath();
            ctx.moveTo(4, -5);
            ctx.lineTo(16, 0);
            ctx.lineTo(4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else { // scythe (Reifador Void)
            // Lâmina curvada superior e inferior (Foice)
            ctx.fillStyle = '#0891b2'; // Bio-ciano
            ctx.beginPath();
            ctx.moveTo(38, -6);
            ctx.lineTo(16, -26);
            ctx.lineTo(-24, -28);
            ctx.lineTo(-10, -12);
            ctx.lineTo(-38, 0);
            ctx.lineTo(-10, 12);
            ctx.lineTo(-24, 28);
            ctx.lineTo(16, 26);
            ctx.lineTo(38, 6);
            ctx.lineTo(12, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Carapaça blindada
            ctx.fillStyle = '#0e7490';
            ctx.beginPath();
            ctx.moveTo(14, -14);
            ctx.lineTo(-12, -16);
            ctx.lineTo(-18, 0);
            ctx.lineTo(-12, 16);
            ctx.lineTo(14, 14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Lentes do Void brilhantes
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(6, -4, 3, 0, Math.PI * 2);
            ctx.arc(6, 4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();

        // Barra de Vida do SubBoss Estilo Cartoon Arcade
        const barWidth = 60;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 14;
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = this.color;
        ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// --- CLASSE POWER-UP (CAIXAS / TOKENS CARTOON COLETÁVEIS) ---
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; 
        this.radius = 12;
        
        this.speedX = -1.2;
        this.toRemove = false;
        
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatAmplitude = 0.5;
        this.floatSpeed = 0.05;
        this.rotation = 0;
        this.isWeapon = false; 
        
        switch (type) {
            case 'heal':
                this.color = '#22c55e'; 
                this.label = '+';
                break;
            case 'shield':
                this.color = '#0284c7'; 
                this.label = 'S';
                break;
            case 'doubleshot':
                this.color = '#a855f7'; 
                this.label = '2X';
                break;
            case 'hyperdrive':
                this.color = '#f59e0b'; 
                this.label = 'H';
                break;
            case 'weapon_vulcan':
                this.color = '#eab308';
                this.label = 'V';
                this.isWeapon = true;
                this.radius = 14;
                break;
            case 'weapon_cannon':
                this.color = '#ef4444';
                this.label = 'C';
                this.isWeapon = true;
                this.radius = 14;
                break;
            case 'weapon_spread':
                this.color = '#ec4899';
                this.label = '3X';
                this.isWeapon = true;
                this.radius = 14;
                break;
            case 'weapon_sniper':
                this.color = '#10b981';
                this.label = 'SN';
                this.isWeapon = true;
                this.radius = 14;
                break;
        }
    }

    update() {
        this.x += this.speedX;
        this.floatOffset += this.floatSpeed;
        this.y += Math.sin(this.floatOffset) * this.floatAmplitude;
        
        if (this.isWeapon) {
            this.rotation += 0.035;
        }
        
        if (this.x < -this.radius * 2) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.2;
        ctx.fillStyle = this.color;

        if (this.isWeapon) {
            // Crate / Token de Arma em Hexágono estilo Jetpack
            ctx.save();
            ctx.rotate(this.rotation);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 2;
                const px = Math.cos(a) * this.radius;
                const py = Math.sin(a) * this.radius;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            // Texto do Token com contorno preto
            ctx.font = '900 11px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.label, 0, 0.5);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.label, 0, 0.5);
        } else {
            // Ficha de Power-up redonda cartoon
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.font = '900 12px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.label, 0, 0.5);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.label, 0, 0.5);
        }
        
        ctx.restore();
    }
}

// --- CLASSE TEXTO FLUTUANTE (POP-UPS ESTILO CARTOON ARCADE) ---
class FloatingText {
    constructor(x, y, text, color = '#ffffff', fontSize = 15) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
        
        this.vy = -1.5; 
        this.alpha = 1;
        this.decay = 0.022; 
        this.vx = (Math.random() * 0.8 - 0.4);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        return this.alpha > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        ctx.font = `900 ${this.fontSize}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        
        // Estilo Jetpack: Texto com borda preta grossa em volta
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        
        ctx.restore();
    }
}

// --- CLASSE CRÉDITO (MOEDAS DE OURO JETPACK JOYRIDE) ---
class Credit {
    constructor(x, y, vx = -1.2, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        
        this.radius = 7;
        this.color = '#facc15'; // Ouro Ouro Amarelo
        this.toRemove = false;
        
        this.angle = Math.random() * Math.PI;
        this.rotSpeed = 0.04;
    }

    update(player) {
        this.angle += this.rotSpeed;
        
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 155 && player.hp > 0) {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            const magnetForce = 0.45;
            
            this.vx += Math.cos(angleToPlayer) * magnetForce;
            this.vy += Math.sin(angleToPlayer) * magnetForce;
            
            const speed = Math.hypot(this.vx, this.vy);
            const maxMagnetSpeed = 9;
            if (speed > maxMagnetSpeed) {
                this.vx = (this.vx / speed) * maxMagnetSpeed;
                this.vy = (this.vy / speed) * maxMagnetSpeed;
            }
        } else {
            this.vx = this.vx * 0.95 + (-1.2) * 0.05;
            this.vy = this.vy * 0.95;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -20) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Moeda de Ouro Cartoon com borda definida
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Brilho interno da moeda
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-2, -2, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// --- CLASSE METEORO (BOMBA / ROCHA FLAMEJANTE CARTOON) ---
class Meteor {
    constructor(x, y, speedX = -9) {
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        
        this.radius = Math.random() * 6 + 18; 
        this.color = '#ef4444'; 
        this.toRemove = false;
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.04 - 0.02;
    }

    update() {
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        if (this.x < -this.radius * 2) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Rocha flamejante com borda cartoon
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#451a03';
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Fogo/Lava interior
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.2, -this.radius * 0.2, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
