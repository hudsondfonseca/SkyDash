/* Deep-space pixel-art backdrop. Static nebula/rock details are generated once;
   only layer offsets and sparse glints are updated while drawing. */
const DEFAULT_SPACE_BACKGROUND = {
    pixelSize: 3,
    referenceWidth: 960,
    referenceHeight: 540,
    layers: {
        farStars: { enabled: true, parallax: 0.025, count: 190, seed: 81 },
        nebulae: { enabled: true, parallax: 0.07, seed: 421, clusters: 118 },
        nearStars: { enabled: true, parallax: 0.12, count: 72, seed: 612 },
        planets: { enabled: true, parallax: 0.19, scale: 1, items: [
            { x: 0.075, y: 0.16, radius: 74, palette: 'ocean' },
            { x: 0.79, y: 0.16, radius: 48, palette: 'ember' },
            { x: 0.94, y: 0.83, radius: 67, palette: 'violet' }
        ] },
        asteroids: { enabled: true, parallax: 0.42, scale: 1, count: 13, seed: 922 },
        particles: { enabled: true, parallax: 0.2, count: 32, seed: 333 }
    }
};

class PixelSpaceBackground {
    constructor(config = {}) {
        this.config = { ...DEFAULT_SPACE_BACKGROUND, ...config, layers: { ...DEFAULT_SPACE_BACKGROUND.layers, ...(config.layers || {}) } };
        for (const key of Object.keys(DEFAULT_SPACE_BACKGROUND.layers)) {
            this.config.layers[key] = { ...DEFAULT_SPACE_BACKGROUND.layers[key], ...(config.layers?.[key] || {}) };
        }
        this.camera = { x: 0, y: 0 };
        this.distance = 0;
        this.rand = seed => { let n = seed >>> 0; return () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296); };
        this.farStars = this.makeStars(this.config.layers.farStars);
        this.nearStars = this.makeStars(this.config.layers.nearStars);
        this.rocks = this.makeRocks();
        this.dust = this.makeDust();
        this.nebulaCanvas = document.createElement('canvas');
        this.nebulaCanvas.width = this.config.referenceWidth;
        this.nebulaCanvas.height = this.config.referenceHeight;
        this.bakeNebulae();
    }
    makeStars(c) {
        const r = this.rand(c.seed), a = [];
        for (let i = 0; i < c.count; i++) a.push({ x: r(), y: r(), size: c === this.config.layers.farStars ? 1 : 1 + Math.floor(r() * 2), tint: r(), twinkle: r() * Math.PI * 2 });
        return a;
    }
    makeRocks() {
        const c = this.config.layers.asteroids, r = this.rand(c.seed), a = [];
        for (let i = 0; i < c.count; i++) a.push({ x: r(), y: r(), radius: 6 + r() * 15, shape: Math.floor(r() * 4), palette: Math.floor(r() * 3) });
        return a;
    }
    makeDust() {
        const c = this.config.layers.particles, r = this.rand(c.seed), a = [];
        for (let i = 0; i < c.count; i++) a.push({ x: r(), y: r(), size: 1 + Math.floor(r() * 2), phase: r() * 6.28 });
        return a;
    }
    setCamera(x = 0, y = 0) { this.camera.x = x; this.camera.y = y; }
    configure(path, value) {
        const keys = path.split('.'); let target = this.config;
        while (keys.length > 1) target = target[keys.shift()]; target[keys[0]] = value;
        if (path === 'layers.farStars.count' || path === 'layers.farStars.seed') this.farStars = this.makeStars(this.config.layers.farStars);
        if (path === 'layers.nearStars.count' || path === 'layers.nearStars.seed') this.nearStars = this.makeStars(this.config.layers.nearStars);
        if (path === 'layers.asteroids.count' || path === 'layers.asteroids.seed') this.rocks = this.makeRocks();
        if (path === 'layers.particles.count' || path === 'layers.particles.seed') this.dust = this.makeDust();
        if (path.startsWith('layers.nebulae.')) this.bakeNebulae();
    }
    update(delta = 1) {
        this.distance += delta * 1.25;
    }
    px(ctx, x, y, w, h, color, p) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x / p) * p, Math.round(y / p) * p, Math.max(p, Math.round(w / p) * p), Math.max(p, Math.round(h / p) * p));
    }
    bakeNebulae() {
        const ctx = this.nebulaCanvas.getContext('2d'), w = this.nebulaCanvas.width, h = this.nebulaCanvas.height, p = this.config.pixelSize, c = this.config.layers.nebulae;
        ctx.clearRect(0, 0, w, h);
        const r = this.rand(c.seed), colors = ['#101447', '#15175c', '#1a2477', '#193d91', '#173f89', '#32166b', '#451476', '#54208c', '#263a9c', '#60206f'];
        // Scattered pixel clusters form irregular arms and leave broad dark lanes.
        for (let i = 0; i < c.clusters; i++) {
            const arm = i % 4, t = r(), centerX = ((arm * .27 + t * .66 + r() * .12) % 1) * w;
            const centerY = (arm < 2 ? .08 + t * .5 : .56 + t * .42) * h + (r() - .5) * h * .12;
            if (r() < .3 && centerX > w * .28 && centerX < w * .72) continue;
            const rad = (5 + r() * 24) * p;
            const color = colors[Math.floor(r() * colors.length)];
            const count = 4 + Math.floor(r() * 11);
            for (let j = 0; j < count; j++) {
                const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
                const x = centerX + Math.cos(a) * d, y = centerY + Math.sin(a) * d * .62;
                this.px(ctx, x, y, p * (1 + (r() < .18)), p * (1 + (r() < .24)), color, p);
            }
        }
        // Sparse brighter knots, kept dim enough to preserve combat readability.
        for (let i = 0; i < 34; i++) {
            const x = r() * w, y = r() * h;
            this.px(ctx, x, y, p * (1 + Math.floor(r() * 3)), p, i % 2 ? '#204ca2' : '#6b258e', p);
        }
    }
    drawStars(ctx, list, w, h, p, speed, bright) {
        const drift = this.distance * speed;
        for (let i = 0; i < list.length; i++) {
            const s = list[i], x = ((s.x * w - drift) % w + w) % w, y = s.y * h;
            const shimmer = bright && Math.sin(this.distance * .035 + s.twinkle) > .45;
            this.px(ctx, x, y, p * s.size, p * s.size, shimmer ? '#dcf5ff' : (s.tint > .7 ? '#a68cff' : '#789bd9'), p);
            if (shimmer) {
                this.px(ctx, x - p * 2, y, p * 5, p, '#73cfff', p);
                this.px(ctx, x, y - p * 2, p, p * 5, '#73cfff', p);
                this.px(ctx, x - p, y - p, p * 3, p * 3, '#9c8cff', p);
            }
        }
    }
    drawPlanets(ctx, w, h, p, c) {
        const palettes = { ocean: ['#07194a', '#0b3278', '#1053a2', '#1686c9', '#48c4ec'], ember: ['#55215e', '#8a337e', '#c34f86', '#ed8c91', '#ffd19b'], violet: ['#25145c', '#4b238b', '#7137ad', '#a851ce', '#e49ce9'] };
        for (let n = 0; n < c.items.length; n++) {
            const pl = c.items[n], r = pl.radius * c.scale, x = pl.x * w - this.distance * c.parallax, y = pl.y * h;
            if (x < -r * 2 || x > w + r * 2) continue;
            const colors = palettes[pl.palette] || palettes.ocean, steps = Math.max(10, Math.ceil(r / p));
            for (let row = -steps; row <= steps; row++) {
                const yn = row / steps, half = Math.sqrt(Math.max(0, 1 - yn * yn)) * r;
                const light = Math.max(0, Math.min(1, .68 - (x / w - pl.x) * .8 - yn * .35));
                const index = Math.max(0, Math.min(4, Math.floor(light * 5)));
                this.px(ctx, x - half, y + yn * r, half * 2, p * 1.2, colors[index], p);
                // Pixelated continents / bands vary by latitude.
                if ((row + n * 3) % 5 === 0) {
                    const landX = x + Math.sin(row * .73 + n) * half * .28;
                    this.px(ctx, landX, y + yn * r, half * .4, p, colors[Math.min(4, index + 1)], p);
                }
            }
            // Terminator shadow and a crisp rim-lit crescent.
            this.px(ctx, x + r * .48, y - r * .5, p * 2, r, colors[0], p);
            this.px(ctx, x - r * .83, y - r * .25, p * 2, r * .5, colors[4], p);
        }
    }
    drawAsteroids(ctx, w, h, p, c) {
        const palettes = [['#252942', '#4c5172', '#858cae'], ['#29243e', '#594873', '#a491b9'], ['#1c3049', '#405f83', '#91b0c7']];
        for (let i = 0; i < this.rocks.length; i++) {
            const a = this.rocks[i], r = a.radius * c.scale, drift = this.distance * c.parallax * (1 + (i % 3) * .18);
            const x = ((a.x * w - drift) % (w + r * 3) + w + r * 3) % (w + r * 3) - r, y = a.y * h;
            if (x < -r * 2 || x > w + r * 2) continue;
            const col = palettes[a.palette];
            const shape = a.shape;
            this.px(ctx,x-r*.55,y-r*.42,r*1.15,r*.86,col[0],p); this.px(ctx,x-r*.4,y-r*.62,r*.88,r*1.16,col[0],p);
            if (shape === 1 || shape === 3) this.px(ctx,x-r*.72,y-r*.12,r*.42,r*.8,col[0],p);
            if (shape === 2 || shape === 3) this.px(ctx,x+r*.28,y-r*.35,r*.48,r*.68,col[0],p);
            this.px(ctx,x-r*.35,y-r*.4,r*.72,r*.38,col[2],p); this.px(ctx,x-r*.22,y-r*.05,r*.64,r*.52,col[1],p);
            this.px(ctx,x+r*.2,y+r*.3,r*.28,r*.18,col[0],p);
        }
    }
    draw(ctx, w, h) {
        const p = this.config.pixelSize, layers = this.config.layers;
        ctx.fillStyle = '#050617'; ctx.fillRect(0, 0, w, h);
        // Tile the baked pixel nebulae. Nearest-neighbor scaling retains crisp pixels at any viewport.
        if (layers.nebulae.enabled) {
            const nw = this.nebulaCanvas.width, nh = this.nebulaCanvas.height;
            const offset = (this.distance * layers.nebulae.parallax) % nw;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.nebulaCanvas, -offset, 0, w, h);
            ctx.drawImage(this.nebulaCanvas, nw - offset, 0, w, h);
        }
        if (layers.farStars.enabled) this.drawStars(ctx, this.farStars, w, h, p, layers.farStars.parallax, false);
        if (layers.nearStars.enabled) this.drawStars(ctx, this.nearStars, w, h, p, layers.nearStars.parallax, true);
        if (layers.planets.enabled) this.drawPlanets(ctx, w, h, p, layers.planets);
        if (layers.asteroids.enabled) this.drawAsteroids(ctx, w, h, p, layers.asteroids);
        if (layers.particles.enabled) {
            for (let i = 0; i < this.dust.length; i++) {
                const d = this.dust[i], x = ((d.x * w - this.distance * layers.particles.parallax) % w + w) % w;
                if (Math.sin(this.distance * .025 + d.phase) > .78) this.px(ctx, x, d.y * h, d.size * p, d.size * p, '#536cb5', p);
            }
        }
    }
}
