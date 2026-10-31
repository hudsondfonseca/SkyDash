/* Loads transparent, individually-authored pixel sprites. Falls back to each
   entity's legacy Canvas drawing until its image has loaded. */
const SHIP_SPRITES = {};
const SHIP_SPRITE_PATHS = {
    scout:'enemies/scout', bomber:'enemies/bomber', kamikaze:'enemies/kamikaze',
    defender:'enemies/defender', sniper:'enemies/sniper', drone:'enemies/drone',
    deflector:'subbosses/deflector', interceptor:'subbosses/interceptor', scythe:'subbosses/scythe',
    dreadnought:'bosses/dreadnought', carrier:'bosses/carrier', destroyer:'bosses/destroyer'
};
for (const [key, path] of Object.entries(SHIP_SPRITE_PATHS)) {
    const image = new Image();
    image.src = `assets/sprites/${path}.svg`;
    SHIP_SPRITES[key] = image;
}
function drawShipSprite(ctx, key, x, y, width, height, options = {}) {
    const image = SHIP_SPRITES[key];
    if (!image || !image.complete || !image.naturalWidth) return false;
    const t = performance.now() / 1000;
    const pixel = Math.max(2, Math.round(Math.min(width, height) / 12));
    const flame = 5 + Math.floor((Math.sin(t * 18) + 1) * 3);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Pixel exhaust is animated independently of gameplay and hitboxes.
    ctx.fillStyle = '#ff542f'; ctx.fillRect(Math.round(x + width * .37), Math.round(y - pixel), flame + pixel, pixel * 2);
    ctx.fillStyle = '#ffca62'; ctx.fillRect(Math.round(x + width * .39), Math.round(y - pixel / 2), flame, pixel);
    ctx.fillStyle = '#fff0a3'; ctx.fillRect(Math.round(x + width * .39), Math.round(y - pixel / 2), Math.max(pixel, flame - pixel), pixel);
    // The asset points right; enemies face the player on the left.
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
    if (options.shield > 0) {
        ctx.save(); ctx.strokeStyle = options.shieldColor || '#40cfff'; ctx.globalAlpha = .55 + Math.sin(t * 8) * .12;
        ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, width * .62, height * .68, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    return true;
}
