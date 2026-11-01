// Keyboard and pointer input state. Loaded before game.js so its bindings are shared.
const defaultKeyBindings = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', fire: 'KeyF' };
const keyBindings = { ...defaultKeyBindings };
function isBindableCode(code) {
    return typeof code === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right))$/.test(code);
}
function applySavedKeyBindings(saved) {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    const used = new Set();
    for (const action of Object.keys(defaultKeyBindings)) {
        let code = isBindableCode(saved[action]) && !used.has(saved[action])
            ? saved[action]
            : defaultKeyBindings[action];
        if (used.has(code)) code = Object.values(defaultKeyBindings).find(candidate => !used.has(candidate));
        keyBindings[action] = code;
        used.add(code);
    }
}
function saveKeyBindings() {
    try { localStorage.setItem('sky_dash_controls', JSON.stringify(keyBindings)); } catch (_) {}
}
try { applySavedKeyBindings(JSON.parse(localStorage.getItem('sky_dash_controls') || '{}')); } catch (_) {}

const keys = {};
let mouseClicked = false;
let listeningForBinding = null;
const inputCanvas = document.getElementById('game-canvas');

window.addEventListener('keydown', (e) => {
    if (listeningForBinding) {
        e.preventDefault();
        const action = listeningForBinding.dataset.action;
        const duplicate = Object.entries(keyBindings).some(([boundAction, code]) => boundAction !== action && code === e.code);
        if (isBindableCode(e.code) && !duplicate) {
            keyBindings[action] = e.code;
            saveKeyBindings();
        }
        listeningForBinding.textContent = (keyBindings[action] || '').replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '');
        listeningForBinding.classList.remove('listening');
        listeningForBinding = null;
        return;
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyF'].includes(e.code) || e.key === ' ') e.preventDefault();
    keys[e.code] = true;
    if ([keyBindings.up, keyBindings.down].includes(e.code) && player) player.usingKeyboard = true;
    if (controlsScreen.classList.contains('active')) return;
    if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'playing') pauseGame();
    else if ((e.code === 'KeyP' || e.code === 'Escape') && gameState === 'paused') resumeGame();
});

window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => {
    for (const code of Object.keys(keys)) keys[code] = false;
    mouseClicked = false;
});

inputCanvas.addEventListener('pointermove', e => {
    if (gameState === 'playing' && player) {
        const rect = inputCanvas.getBoundingClientRect();
        player.targetY = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        player.usingKeyboard = false;
    }
});

inputCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    inputCanvas.setPointerCapture(e.pointerId);
    if (gameState === 'playing' && player) {
        const rect = inputCanvas.getBoundingClientRect();
        player.targetY = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        player.usingKeyboard = false;
        mouseClicked = true;
    }
});

function releasePointerInput() {
    // Pointer capture keeps the game responsive when a touch ends outside the canvas.
}
inputCanvas.addEventListener('pointerup', releasePointerInput);
inputCanvas.addEventListener('pointercancel', releasePointerInput);
