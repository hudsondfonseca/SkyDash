// Keep the active overlay modal to keyboard and assistive technology users.
const gameCanvasForA11y = document.getElementById('game-canvas');
let activeDialogForA11y = null;

function syncGameDialogAccessibility() {
    const dialogs = [...document.querySelectorAll('.overlay-screen')];
    const active = dialogs.find(dialog => dialog.classList.contains('active') && !dialog.classList.contains('hidden')) || null;
    for (const dialog of dialogs) dialog.setAttribute('aria-hidden', String(dialog !== active));
    gameCanvasForA11y.inert = Boolean(active);
    if (active && active !== activeDialogForA11y) {
        const firstControl = active.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])');
        (firstControl || active).focus({ preventScroll: true });
    } else if (!active && activeDialogForA11y) {
        gameCanvasForA11y.focus({ preventScroll: true });
    }
    activeDialogForA11y = active;
}

document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !activeDialogForA11y) return;
    const controls = [...activeDialogForA11y.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        .filter(control => control.getClientRects().length > 0);
    if (!controls.length) {
        event.preventDefault();
        activeDialogForA11y.focus();
        return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !activeDialogForA11y.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !activeDialogForA11y.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
    }
});

new MutationObserver(syncGameDialogAccessibility).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
});
syncGameDialogAccessibility();
