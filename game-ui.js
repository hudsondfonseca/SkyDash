// Menu, settings, controls and shop UI. Depends on game state initialized in game.js.

function loadMenu() {
    gameState = 'start';
    
    highscore = loadHighscore();
    menuHighscore.innerText = highscore;
    
    document.querySelectorAll('.overlay-screen').forEach(s => s.classList.add('hidden'));
    hud.classList.add('hidden');
    bossHealthContainer.classList.add('hidden');
    
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
}

// --- GERENCIAMENTO DE CONFIGURAÇÕES ---

function openSettings() {
    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    
    settingAutofire.checked = settings.autofire;
    settingSound.checked = settings.sound;
    settingDifficulty.value = settings.difficulty;
    
    settingsScreen.classList.remove('hidden');
    settingsScreen.classList.add('active');
}

function saveSettings() {
    settings.autofire = settingAutofire.checked;
    settings.sound = settingSound.checked;
    settings.difficulty = settingDifficulty.value;
    
    sounds.enabled = settings.sound;
    
    settingsScreen.classList.add('hidden');
    settingsScreen.classList.remove('active');
    
    loadMenu();
}

function openControls() {
    startScreen.classList.add('hidden'); startScreen.classList.remove('active');
    controlsScreen.classList.remove('hidden'); controlsScreen.classList.add('active');
    document.querySelectorAll('.key-bind').forEach(button => button.textContent = (keyBindings[button.dataset.action] || '').replace(/^Key/, '').replace(/^Arrow/, ''));
}

// --- ASSOCIAÇÃO DE EVENTOS DE BOTÕES ---
btnStart.addEventListener('click', startGame);
btnSettingsOpen.addEventListener('click', openSettings);
btnSettingsClose.addEventListener('click', saveSettings);
document.getElementById('btn-controls-open').addEventListener('click', openControls);
document.getElementById('btn-controls-back').addEventListener('click', () => { controlsScreen.classList.add('hidden'); controlsScreen.classList.remove('active'); loadMenu(); });
document.querySelectorAll('.key-bind').forEach(button => button.addEventListener('click', () => {
    if (listeningForBinding) listeningForBinding.classList.remove('listening');
    listeningForBinding = button; button.textContent = '...'; button.classList.add('listening');
}));
document.getElementById('btn-controls-reset').addEventListener('click', () => {
    Object.assign(keyBindings, defaultKeyBindings);
    saveKeyBindings();
    openControls();
});

btnResume.addEventListener('click', resumeGame);
btnRestartPause.addEventListener('click', () => {
    pauseScreen.classList.add('hidden');
    startGame();
});
btnQuit.addEventListener('click', () => {
    pauseScreen.classList.add('hidden');
    loadMenu();
});

btnRestart.addEventListener('click', startGame);
btnMenuGo.addEventListener('click', loadMenu);


// --- SISTEMA DE COMPRAS E UPGRADES DA LOJA ---
const shopScreen = document.getElementById('shop-screen');
const btnShopOpen = document.getElementById('btn-shop-open');
const btnShopClose = document.getElementById('btn-shop-close');

function updateShopUI() {
    const hpCost = upgrades.hp >= 5 ? 0 : (15 + upgrades.hp * 10);
    const shieldCost = upgrades.shield >= 5 ? 0 : (15 + upgrades.shield * 10);
    const firerateCost = upgrades.firerate >= 5 ? 0 : (20 + upgrades.firerate * 15);
    const regenCost = upgrades.regen >= 5 ? 0 : (25 + upgrades.regen * 20);

    document.getElementById('shop-credits-val').innerText = credits;

    // HP Button
    const btnHp = document.getElementById('btn-buy-hp');
    const priceHp = document.getElementById('price-hp');
    if (upgrades.hp >= 5) {
        priceHp.innerText = 'MAX';
        btnHp.disabled = true;
    } else {
        priceHp.innerText = hpCost;
        btnHp.disabled = credits < hpCost;
    }

    // Shield Button
    const btnShield = document.getElementById('btn-buy-shield');
    const priceShield = document.getElementById('price-shield');
    if (upgrades.shield >= 5) {
        priceShield.innerText = 'MAX';
        btnShield.disabled = true;
    } else {
        priceShield.innerText = shieldCost;
        btnShield.disabled = credits < shieldCost;
    }

    // Firerate Button
    const btnFirerate = document.getElementById('btn-buy-firerate');
    const priceFirerate = document.getElementById('price-firerate');
    if (upgrades.firerate >= 5) {
        priceFirerate.innerText = 'MAX';
        btnFirerate.disabled = true;
    } else {
        priceFirerate.innerText = firerateCost;
        btnFirerate.disabled = credits < firerateCost;
    }

    // Regen Button
    const btnRegen = document.getElementById('btn-buy-regen');
    const priceRegen = document.getElementById('price-regen');
    if (upgrades.regen >= 5) {
        priceRegen.innerText = 'MAX';
        btnRegen.disabled = true;
    } else {
        priceRegen.innerText = regenCost;
        btnRegen.disabled = credits < regenCost;
    }

    // Preenche as caixas de nível na tela da loja
    drawLevelBoxes('upg-hp-levels', upgrades.hp);
    drawLevelBoxes('upg-shield-levels', upgrades.shield);
    drawLevelBoxes('upg-firerate-levels', upgrades.firerate);
    drawLevelBoxes('upg-regen-levels', upgrades.regen);
}

function drawLevelBoxes(containerId, level) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const boxes = container.querySelectorAll('.level-box');
    boxes.forEach((box, i) => {
        if (i < level) {
            box.classList.add('filled');
        } else {
            box.classList.remove('filled');
        }
    });
}

function buyUpgrade(type) {
    if (type === 'hp') {
        const cost = 15 + upgrades.hp * 10;
        if (credits >= cost && upgrades.hp < 5) {
            credits -= cost;
            upgrades.hp++;
            saveUpgrades();
            sounds.playPowerUp();
        }
    } else if (type === 'shield') {
        const cost = 15 + upgrades.shield * 10;
        if (credits >= cost && upgrades.shield < 5) {
            credits -= cost;
            upgrades.shield++;
            saveUpgrades();
            sounds.playPowerUp();
        }
    } else if (type === 'firerate') {
        const cost = 20 + upgrades.firerate * 15;
        if (credits >= cost && upgrades.firerate < 5) {
            credits -= cost;
            upgrades.firerate++;
            saveUpgrades();
            sounds.playPowerUp();
        }
    } else if (type === 'regen') {
        const cost = 25 + upgrades.regen * 20;
        if (credits >= cost && upgrades.regen < 5) {
            credits -= cost;
            upgrades.regen++;
            saveUpgrades();
            sounds.playPowerUp();
        }
    }
    updateShopUI();
}

// Vincular clique dos botões para abrir/fechar loja
btnShopOpen.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    shopScreen.classList.remove('hidden');
    shopScreen.classList.add('active');
    updateShopUI();
});

btnShopClose.addEventListener('click', () => {
    shopScreen.classList.add('hidden');
    shopScreen.classList.remove('active');
    loadMenu();
});

// Vincular clique dos botões de compra
document.getElementById('btn-buy-hp').addEventListener('click', () => buyUpgrade('hp'));
document.getElementById('btn-buy-shield').addEventListener('click', () => buyUpgrade('shield'));
document.getElementById('btn-buy-firerate').addEventListener('click', () => buyUpgrade('firerate'));
document.getElementById('btn-buy-regen').addEventListener('click', () => buyUpgrade('regen'));

loadMenu();
