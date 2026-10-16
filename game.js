'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, color = '#fff') {
    this.x = x;
    this.y = y;
    this.color = color;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño
const STAR_POINTS = 300;          // puntos por destruir una estrella fugaz

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor() {
    // Entra por un borde aleatorio en dirección hacia el interior
    const side = randInt(0, 3);   // 0 izq, 1 der, 2 arriba, 3 abajo
    let x, y, angle;
    if      (side === 0) { x = 12;          y = rand(0, H); angle = rand(-0.6, 0.6); }
    else if (side === 1) { x = W - 12;      y = rand(0, H); angle = Math.PI + rand(-0.6, 0.6); }
    else if (side === 2) { x = rand(0, W);  y = 12;         angle = Math.PI / 2 + rand(-0.6, 0.6); }
    else                 { x = rand(0, W);  y = H - 12;     angle = -Math.PI / 2 + rand(-0.6, 0.6); }

    super(x, y, 1);

    this.especial = true;
    const speed = rand(240, 320);          // ~3x más rápido que un asteroide pequeño
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.5, 1.5);

    this.ttl  = rand(5, 8);                // desaparece con el tiempo
    this.life = this.ttl;

    // Estrella de 4 puntas en lugar del polígono irregular
    const r = this.radius, k = r * 0.26;
    this.verts = [
      [ 0, -r], [ k, -k], [ r,  0], [ k,  k],
      [ 0,  r], [-k,  k], [-r,  0], [-k, -k],
    ];
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];   // nunca se parte en fragmentos
  }

  draw() {
    // Parpadeo en los últimos 1.5 s antes de desaparecer
    if (this.ttl < 1.5 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const fade = Math.max(this.ttl / this.life, 0);   // fundido progresivo

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = fade;

    // Estela hacia atrás (opuesto a la dirección de movimiento)
    const back = Math.atan2(-this.vy, -this.vx);
    ctx.rotate(back);
    const trail = [[40, 3, 0.5], [70, 2, 0.3], [100, 1, 0.15]];
    for (const [len, w, a] of trail) {
      ctx.strokeStyle = `rgba(255, 210, 90, ${a})`;
      ctx.lineWidth   = w;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(6 + len, 0);
      ctx.stroke();
    }
    ctx.rotate(-back);

    // Brillo ámbar (los asteroides comunes son blancos y sin glow)
    ctx.shadowColor = '#ffd24d';
    ctx.shadowBlur  = 18;
    ctx.strokeStyle = '#ffd24d';
    ctx.fillStyle   = 'rgba(255, 210, 90, 0.25)';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Núcleo blanco brillante
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();   // resetea shadowBlur y globalAlpha
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
// Color y relleno de cada tipo de pickup. Al añadir un tipo, basta con meterlo
// aquí, dibujar su icono en `PowerUp.draw()` y repartir su probabilidad en `update()`.
const POWERUP_STYLE = {
  vel:    { color: '#7df',    fill: 'rgba(119, 221, 255, 0.18)' },   // rayo cian
  triple: { color: '#ffb347', fill: 'rgba(255, 179, 71, 0.18)' },    // tres puntos ámbar
  shield: { color: '#7f9',    fill: 'rgba(119, 255, 153, 0.18)' },   // burbuja verde
};

class PowerUp {
  constructor(x, y, type = 'vel') {
    this.x = x;
    this.y = y;
    this.type  = type;   // 'vel' (velocidad) | 'triple' (triple shot) | 'shield' (escudo)
    this.color = POWERUP_STYLE[type].color;
    this.radius = 10;
    this.ttl    = 10;   // desaparece a los 10 s si nadie lo coge
    this.dead   = false;

    const angle = rand(0, Math.PI * 2);
    const speed = 25;   // deriva lenta
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en los últimos 2 s antes de desaparecer
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = this.color;
    ctx.fillStyle   = POWERUP_STYLE[this.type].fill;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Disco contenedor
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (this.type === 'vel') {
      // Rayo
      ctx.beginPath();
      ctx.moveTo( 2, -6);
      ctx.lineTo(-3,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-2,  6);
      ctx.lineTo( 4, -1);
      ctx.lineTo( 1, -1);
      ctx.closePath();
      ctx.stroke();
    } else if (this.type === 'triple') {
      // Tres puntos en fila (triple shot)
      for (const px of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.arc(px, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Burbuja: cúpula sobre base (escudo)
      ctx.beginPath();
      ctx.arc(0, 1, 5.5, Math.PI, 0);   // arco superior
      ctx.lineTo( 5.5, 3);
      ctx.lineTo(-5.5, 3);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Skins (apariencia de la nave) ─────────────────────────────────────────────
// Cada skin define la silueta (nariz hacia +x), sus colores y su llama. La hitbox
// es siempre la misma (`Ship.radius`), así que las skins son puramente cosméticas.
const SHIP_VERTS = [[20, 0], [-12, -9], [-7, 0], [-12, 9]];

const SKINS = [
  { nombre: 'Clásica',   verts: SHIP_VERTS, stroke: '#fff', fill: null, glow: null,
    flame: 'rgba(255, 130, 0, 0.85)',  flameBoost: 'rgba(70, 230, 255, 0.9)' },
  { nombre: 'Sólida',    verts: SHIP_VERTS, stroke: '#fff', fill: 'rgba(255, 255, 255, 0.85)', glow: null,
    flame: 'rgba(255, 130, 0, 0.85)',  flameBoost: 'rgba(70, 230, 255, 0.9)' },
  { nombre: 'Neón',      verts: SHIP_VERTS, stroke: '#7df', fill: null, glow: '#7df',
    flame: 'rgba(70, 230, 255, 0.9)',  flameBoost: 'rgba(70, 230, 255, 0.9)' },
  { nombre: 'Dorada',    verts: SHIP_VERTS, stroke: '#ffd24d', fill: null, glow: '#ffd24d',
    flame: 'rgba(255, 210, 90, 0.9)',  flameBoost: 'rgba(70, 230, 255, 0.9)' },
  { nombre: 'Esmeralda', verts: SHIP_VERTS, stroke: '#5f6', fill: null, glow: null,
    flame: 'rgba(90, 255, 120, 0.85)', flameBoost: 'rgba(70, 230, 255, 0.9)' },
];

let skinIndex = 0;

// Recupera la skin guardada; si no hay localStorage válido, deja la Clásica.
function loadSkin() {
  try {
    const v = parseInt(localStorage.getItem('asteroids.skin'), 10);
    if (Number.isInteger(v) && v >= 0 && v < SKINS.length) skinIndex = v;
  } catch (e) { /* localStorage no disponible */ }
}

function saveSkin() {
  try { localStorage.setItem('asteroids.skin', String(skinIndex)); } catch (e) { /* ignore */ }
}

// Dibuja la silueta de una skin en coordenadas locales (transformación ya aplicada).
// `glow` fuerza un color de halo; si se omite, usa el de la propia skin.
function drawShipShape(skin, scale = 1, glow = undefined) {
  const halo = glow === undefined ? skin.glow : glow;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  if (halo) { ctx.shadowColor = halo; ctx.shadowBlur = 14; }
  ctx.beginPath();
  const v = skin.verts;
  ctx.moveTo(v[0][0], v[0][1]);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1]);
  ctx.closePath();
  if (skin.fill) { ctx.fillStyle = skin.fill; ctx.fill(); }
  ctx.lineWidth   = 1.5;
  ctx.strokeStyle = skin.stroke;
  ctx.stroke();
  ctx.restore();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const BOOST_MULT = 2;       // duplica el empuje con el power-up de velocidad
const BOOST_DURATION = 5;   // duración del boost en segundos
const TRIPLE_DURATION = 5;  // duración del triple shot en segundos
const TRIPLE_SPREAD = 10;   // separación lateral (px) de las 3 balas en línea
const SHIELD_MAX = 3;       // cargas que otorga un power-up de escudo
const SHIELD_RADIUS = 24;   // radio de la burbuja del escudo alrededor de la nave
const SHIELD_GRACE = 0.6;   // s de gracia tras bloquear (evita drenar cargas de golpe)

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.boost         = 0;   // segundos restantes del boost de velocidad
    this.triple        = 0;   // segundos restantes del triple shot
    this.shield        = 0;   // cargas restantes del escudo
    this.shieldGrace   = 0;   // gracia tras bloquear un impacto
    this.shieldFlash   = 0;   // destello visual al bloquear
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boost         > 0) this.boost         -= dt;
    if (this.triple        > 0) this.triple        -= dt;
    if (this.shieldGrace   > 0) this.shieldGrace   -= dt;
    if (this.shieldFlash   > 0) this.shieldFlash   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const mult   = this.boost > 0 ? BOOST_MULT : 1;  // solo afecta al movimiento lineal

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * mult * dt;
      this.vy += Math.sin(this.angle) * THRUST * mult * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.triple > 0) {
      // 3 balas paralelas en línea recta: misma dirección, desplazadas lateralmente
      const perp = this.angle + Math.PI / 2;
      const px = Math.cos(perp) * TRIPLE_SPREAD;
      const py = Math.sin(perp) * TRIPLE_SPREAD;
      return [-1, 0, 1].map(k =>
        new Bullet(ox + px * k, oy + py * k, this.angle, '#ffb347'));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin    = SKINS[skinIndex];
    const boosted = this.boost > 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Silueta según la skin; el boost de velocidad añade un halo cian encima
    drawShipShape(skin, 1, boosted ? '#7df' : undefined);

    // Llama del propulsor (más larga y en color de boost durante el power-up)
    if (this.thrusting && Math.random() > 0.35) {
      const flame = boosted ? rand(10, 22) : rand(6, 14);
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - flame, 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = boosted ? skin.flameBoost : skin.flame;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    ctx.restore();

    // Burbuja del escudo: anillo verde con pulso sutil y onda expansiva al bloquear
    if (this.shield > 0) {
      const t = performance.now() / 1000;
      // Con una sola carga restante parpadea para avisar de que se agota
      const blinkOff = this.shield === 1 && Math.floor(t * 6) % 2 === 0;
      if (!blinkOff) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 4);   // 0..1
        let r = SHIELD_RADIUS + pulse * 2;
        let alpha = 0.35 + pulse * 0.2;
        if (this.shieldFlash > 0) {                   // onda tras bloquear
          const f = this.shieldFlash / SHIELD_GRACE;  // 1 -> 0
          r     += (1 - f) * 10;                      // se expande
          alpha += f * 0.5;                           // y se desvanece
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = '#7f9';
        ctx.fillStyle   = `rgba(119, 255, 153, ${alpha * 0.25})`;
        ctx.lineWidth   = 2;
        ctx.shadowColor = '#7f9';
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '#fff') {
    this.x  = x;
    this.y  = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'menu' | 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;  // tiempo hasta el próximo intento de estrella fugaz
let menuTime;   // tiempo acumulado para animar la pantalla de selección

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  // Hasta 5 intentos para no aparecer encima de la nave
  let star;
  for (let i = 0; i < 5; i++) {
    star = new ShootingStar();
    if (dist(star, ship) >= 130) break;
  }
  asteroids.push(star);
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(5, 8);
  spawnAsteroids(4);
}

// Pantalla de selección de skin: sin entidades, solo la vista previa animada.
function startMenu() {
  ship      = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  menuTime = 0;
  state = 'menu';
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  asteroids = asteroids.filter(a => !a.especial);  // la estrella fugaz no sobrevive de nivel
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '#fff') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'menu') {
    menuTime += dt;
    if (pressed('ArrowLeft'))  { skinIndex = wrap(skinIndex - 1, SKINS.length); saveSkin(); }
    if (pressed('ArrowRight')) { skinIndex = wrap(skinIndex + 1, SKINS.length); saveSkin(); }
    if (pressed('Space')) initGame();
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    if (pressed('KeyS'))  startMenu();   // vuelve a elegir nave sin recargar
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  // Estrella fugaz: intenta aparecer cada 8-14 s (máx. 1 a la vez)
  starTimer -= dt;
  if (starTimer <= 0) {
    starTimer = rand(8, 14);
    if (!asteroids.some(a => a.especial)) spawnShootingStar();
  }

  // Nave vs power-ups (velocidad, triple shot o escudo)
  for (const p of powerups) {
    if (dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if      (p.type === 'vel')    ship.boost  = BOOST_DURATION;
      else if (p.type === 'triple') ship.triple = TRIPLE_DURATION;
      else                          ship.shield = SHIELD_MAX;   // recarga completa
    }
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        if (a.especial) {
          // Estrella fugaz: bonus fijo, sin fragmentos ni power-up
          score += STAR_POINTS;
          explode(a.x, a.y, 16, '#ffd24d');
        } else {
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          // Suelte de power-ups: 20% de probabilidad total
          // (8% velocidad, 6% triple shot, 6% escudo)
          const drop = Math.random();
          if      (drop < 0.08) powerups.push(new PowerUp(a.x, a.y, 'vel'));
          else if (drop < 0.14) powerups.push(new PowerUp(a.x, a.y, 'triple'));
          else if (drop < 0.20) powerups.push(new PowerUp(a.x, a.y, 'shield'));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide (el escudo bloquea el impacto y gasta una carga)
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shield > 0 && ship.shieldGrace <= 0) {
          // Bloquea: desintegra al atacante sin partirlo y gasta una carga
          ship.shield--;
          ship.shieldGrace = SHIELD_GRACE;
          ship.shieldFlash = SHIELD_GRACE;
          a.dead = true;
          score += a.especial ? STAR_POINTS : POINTS[a.size];
          explode(a.x, a.y, a.especial ? 16 : a.size * 5 + 4, '#7f9');
        } else if (ship.shield <= 0) {
          killShip();
          break;
        }
        // Si shield > 0 pero en gracia, el impacto no hace nada este frame
      }
    }
    // Retira en este frame los asteroides destruidos por el escudo
    asteroids = asteroids.filter(a => !a.dead);
  }

  // Nivel completado (una estrella fugaz viva no bloquea el cambio)
  if (asteroids.filter(a => !a.especial).length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  drawShipShape(SKINS[skinIndex], 0.45);   // miniatura de la skin activa
  ctx.restore();
}

// Barra descendiente de un buff (boost o triple shot) con parpadeo en el último segundo
function drawBuffBar(by, timeLeft, duration, color, label) {
  const bw = 140, bh = 10, bx = 14;
  const ratio = Math.max(timeLeft, 0) / duration;
  const blink = timeLeft < 1 && Math.floor(timeLeft * 10) % 2 === 0;
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(bx, by, bw, bh);
  if (!blink) {
    ctx.fillStyle = color;
    ctx.fillRect(bx + 2, by + 2, (bw - 4) * ratio, bh - 4);
  }
  ctx.textAlign = 'left';
  ctx.font      = '13px monospace';
  ctx.fillText(label, bx + bw + 10, by + bh - 1);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicadores de buff apilados bajo el marcador: velocidad, triple, escudo.
  // `by` es un cursor de fila (18 px por fila) para que nunca se solapen.
  let by = 40;
  if (ship.boost > 0) {
    drawBuffBar(by, ship.boost, BOOST_DURATION, '#7df', 'VEL x2');
    by += 18;
  }
  if (ship.triple > 0) {
    drawBuffBar(by, ship.triple, TRIPLE_DURATION, '#ffb347', 'TRIPLE');
    by += 18;
  }

  // Pips de carga del escudo (bajo las barras activas)
  if (ship.shield > 0) {
    const sx = 14, sy = by + 4;
    ctx.textAlign = 'left';
    ctx.font      = '13px monospace';
    ctx.fillStyle = '#7f9';
    ctx.fillText('ESCUDO', sx, sy + 4);
    for (let i = 0; i < SHIELD_MAX; i++) {
      ctx.beginPath();
      ctx.arc(sx + 66 + i * 14, sy, 4, 0, Math.PI * 2);
      if (i < ship.shield) {
        ctx.fillStyle = '#7f9';
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(119, 255, 153, 0.35)';
        ctx.lineWidth   = 1.2;
        ctx.stroke();
      }
    }
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawSkinMenu() {
  const skin = SKINS[skinIndex];

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font      = 'bold 40px monospace';
  ctx.fillText('SELECCIONA TU NAVE', W / 2, 120);

  // Vista previa grande: balanceo vertical, ligera rotación y llama animada
  const bob = Math.sin(menuTime * 2) * 8;
  const rot = -Math.PI / 2 + Math.sin(menuTime * 1.3) * 0.12;

  ctx.save();
  ctx.translate(W / 2, 300 + bob);
  ctx.rotate(rot);
  ctx.scale(4, 4);

  // Llama del propulsor (siempre encendida como adorno)
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-8 - rand(4, 9), 0);
  ctx.lineTo(-8,  4);
  ctx.strokeStyle = skin.flame;
  ctx.lineWidth   = 1.3;
  ctx.stroke();

  drawShipShape(skin, 1);
  ctx.restore();

  // Nombre de la skin
  ctx.fillStyle = '#7df';
  ctx.font      = 'bold 28px monospace';
  ctx.fillText(skin.nombre, W / 2, 430);

  // Puntos indicadores de posición
  const gap = 26, total = (SKINS.length - 1) * gap;
  for (let i = 0; i < SKINS.length; i++) {
    const px = W / 2 - total / 2 + i * gap;
    ctx.beginPath();
    ctx.arc(px, 470, i === skinIndex ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === skinIndex ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.fill();
  }

  // Instrucciones
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font      = '18px monospace';
  ctx.fillText('←  →  CAMBIAR      ESPACIO  EMPEZAR', W / 2, 530);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'menu') { drawSkinMenu(); return; }

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR   —   S PARA CAMBIAR NAVE`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSkin();
startMenu();
requestAnimationFrame(loop);
