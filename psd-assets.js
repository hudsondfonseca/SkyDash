/* Exported user PSD art pack; all files are transparent PNG copies. */
const PSD_ASSET_PATHS = {
    orangeBlast:'projectiles/orange-blast', diagonalBolt:'projectiles/diagonal-bolt', blueEnergyWave:'projectiles/blue-energy-wave',
    explosion:'effects/explosion', asteroidTrail:'effects/asteroid-trail', cometBlue:'effects/comet-blue', energyShield:'effects/energy-shield',
    alienIvory:'enemies/alien-ivory', alienGreen:'enemies/alien-green', alienArmor:'enemies/alien-armor',
    planetInsignia:'ui/planet-insignia', nebulaViolet:'background/nebula-violet', galaxyCyan:'background/galaxy-cyan', nebulaMagenta:'background/nebula-magenta',
    sun:'background/sun', moon:'background/moon', planetEarth:'background/planet-earth', planetStriped:'background/planet-striped', planetRingGreen:'background/planet-ring-green', planetRingRed:'background/planet-ring-red'
};
const PSD_ASSETS = {};
for (const [key, path] of Object.entries(PSD_ASSET_PATHS)) {
    const image = new Image(); image.src = `assets/psd/${path}.png`; PSD_ASSETS[key] = image;
}
function drawPsdAsset(ctx, key, x, y, width, height, options = {}) {
    const image = PSD_ASSETS[key];
    if (!image || !image.complete || !image.naturalWidth) return false;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha *= options.alpha ?? 1;
    if (options.rotation) { ctx.translate(x, y); ctx.rotate(options.rotation); ctx.drawImage(image, -width/2, -height/2, width, height); }
    else ctx.drawImage(image, x-width/2, y-height/2, width, height);
    ctx.restore(); return true;
}
