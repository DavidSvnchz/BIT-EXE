// ==========================================================================
// TUTORIAL — el nivel 1-1 enseña a jugar mientras juegas.
// - Carteles «!» clavados en el escenario; al acercarte, aparece una pista arriba.
// - El texto cambia según el dispositivo: teclas (con tus controles) en PC, botones del mando si juegas
//   con mando y botones táctiles en el móvil.
// - En el móvil, con la pantalla en vertical, el juego se pausa y sale el aviso de girar.
// Usa: estado.js, mando.js (teclaDe: tecla o botón del mando), tactil.js (modoTactil), dibujo.js (ctx).
// ==========================================================================

const PISTAS_NIVEL1 = [
  { col: 3,  pc: () => 'MUÉVETE CON <b>' + teclaDe('izq') + '</b> Y <b>' + teclaDe('der') + '</b>', movil: () => 'MUÉVETE CON LA <b>CRUCETA</b>' },
  { col: 10, pc: () => 'SALTA CON <b>' + teclaDe('saltar') + '</b> · MANTÉN PARA SALTAR MÁS ALTO', movil: () => 'SALTA CON <b>A</b> · MANTÉN PARA SALTAR MÁS ALTO' },
  { col: 15, pc: () => '¡<b>PINCHOS</b>! CADA GOLPE TE QUITA UNA RAYA DE BATERÍA', movil: null },
  { col: 21, pc: () => 'DISPARA A LOS VIRUS CON <b>' + teclaDe('disparar') + '</b>', movil: () => 'DISPARA A LOS VIRUS CON <b>B</b>' },
  { col: 27, pc: () => 'COGE <b>MONEDAS</b>: CADA 50, UNA RAYA DE BATERÍA MÁS', movil: null },
  { col: -7, pc: () => 'LLEGA A LA <b>MEDALLA</b> PARA LIMPIAR EL NIVEL', movil: null },   // −7 = 7 casillas antes de la medalla
];
const elPista = document.getElementById('pista');
let carteles = [];   // [{ c, f, pista }] del nivel cargado

// Se llama al cargar un nivel: coloca los carteles sobre el suelo (solo en el 1-1)
function prepararTutorial(indice) {
  carteles = [];
  elPista.hidden = true;
  if (indice !== 0) return;
  let colMedalla = cols - 1;
  for (let f = 0; f < filas; f++) { const c = mapa[f].indexOf(MEDALLA); if (c >= 0) colMedalla = c; }
  for (const p of PISTAS_NIVEL1) {
    const c = p.col < 0 ? colMedalla + p.col : p.col;
    let f = 0;
    while (f < filas && !esSolida(c, f)) f++;   // primera casilla sólida desde arriba
    carteles.push({ c, f: f - 1, pista: p });
  }
}

function pasoTutorial() {
  if (!carteles.length || estado !== 'jugando') { elPista.hidden = true; return; }
  const cb = (bit.x + bit.w / 2) / T;
  let activa = null;
  for (const k of carteles) if (cb > k.c - 2.5 && cb < k.c + 5) activa = k;
  if (!activa) { elPista.hidden = true; return; }
  const p = activa.pista, html = (modoTactil && p.movil ? p.movil : p.pc)();
  if (elPista.dataset.h !== html) { elPista.innerHTML = html; elPista.dataset.h = html; }
  elPista.hidden = false;
}

function dibujarCarteles(cx, cy) {
  for (const k of carteles) {
    const x = k.c * T + 4 - cx, y = k.f * T - cy;
    if (x < -16 || x > ANCHO + 16) continue;
    ctx.fillStyle = PAL.gris; ctx.fillRect(x + 3, y + 8, 2, 8);           // poste
    ctx.fillStyle = PAL.lima; ctx.fillRect(x - 1, y - 1, 10, 10);         // borde
    ctx.fillStyle = PAL.tinta2; ctx.fillRect(x, y, 8, 8);                 // tablero
    const brillo = Math.floor(tiempo * 3 + k.c) % 2;
    ctx.fillStyle = brillo ? PAL.dorado : PAL.crema;
    ctx.fillRect(x + 3, y + 1, 2, 4); ctx.fillRect(x + 3, y + 6, 2, 1);   // «!»
  }
}

// ---------- Móvil en vertical: pausa ----------
const vertical = matchMedia('(orientation: portrait)');
const enVertical = () => modoTactil && vertical.matches;
