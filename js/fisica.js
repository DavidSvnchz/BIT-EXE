// ==========================================================================
// FÍSICA — casillas y colisiones.
// casilla(c, f) lee el mapa; moverX/moverY mueven cualquier cosa con x, y, w, h sin atravesar el suelo;
// solapan() comprueba si dos cajas se tocan; estallido() lanza partículas.
// Usa: estado.js (mapa), configuracion.js.
// ==========================================================================

// ============================================================
// FÍSICA, COLISIONES Y ACCIONES DE BIT
// ============================================================
function casilla(c, f) {
  if (c < 0 || c >= cols) return SUELO;
  if (f < 0 || f >= filas) return AIRE;
  return mapa[f][c];
}
const esSolida = (c, f) => casilla(c, f) === SUELO;
const solapan = (a, x, y, w, h) => a.x < x + w && a.x + a.w > x && a.y < y + h && a.y + a.h > y;

// Mueven cualquier cosa con x, y, w, h. Devuelven true si chocan.
function moverX(j, dx) {
  j.x += dx;
  const f0 = Math.floor(j.y / T), f1 = Math.floor((j.y + j.h - 0.01) / T);
  if (dx > 0) {
    const c = Math.floor((j.x + j.w - 0.01) / T);
    for (let f = f0; f <= f1; f++) if (esSolida(c, f)) { j.x = c * T - j.w; j.vx = 0; return true; }
  } else if (dx < 0) {
    const c = Math.floor(j.x / T);
    for (let f = f0; f <= f1; f++) if (esSolida(c, f)) { j.x = (c + 1) * T; j.vx = 0; return true; }
  }
  return false;
}
function moverY(j, dy) {
  j.y += dy;
  j.enSuelo = false;
  const c0 = Math.floor(j.x / T), c1 = Math.floor((j.x + j.w - 0.01) / T);
  if (dy > 0) {
    const f = Math.floor((j.y + j.h - 0.01) / T);
    for (let c = c0; c <= c1; c++) if (esSolida(c, f)) { j.y = f * T - j.h; j.vy = 0; j.enSuelo = true; return true; }
  } else if (dy < 0) {
    const f = Math.floor(j.y / T);
    for (let c = c0; c <= c1; c++) if (esSolida(c, f)) { j.y = (f + 1) * T; j.vy = 0; return true; }
  }
  return false;
}

function estallido(x, y, color, n = 10, vel = 60) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = vel * (0.4 + Math.random() * 0.8);
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vida: 0.3 + Math.random() * 0.3, color });
  }
}

// Polvo al saltar y al aterrizar: nubecillas que salen a los lados y apenas caen
function polvo(x, y, n = 5) {
  for (let i = 0; i < n; i++) {
    const lado = i % 2 ? 1 : -1;
    particulas.push({ x: x + lado * 2, y: y - 1, vx: lado * (15 + Math.random() * 30), vy: -8 - Math.random() * 12,
      t: 0, vida: 0.25 + Math.random() * 0.15, color: i % 3 ? PAL.gris : PAL.crema, peso: 20 });
  }
}
// Restos de un virus eliminado: trozos de 3 píxeles que saltan y caen
function restos(x, y) {
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 70 + Math.random() * 60;
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vida: 0.6 + Math.random() * 0.3,
      color: [PAL.fucsia, PAL.tinta2, PAL.crema][i % 3], tam: 3, peso: 420 });
  }
}
