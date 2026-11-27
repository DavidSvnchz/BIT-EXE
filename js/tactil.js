// ==========================================================================
// TÁCTIL — controles para móvil, que aparecen solos si el juego se abre en un
// dispositivo táctil (o en cuanto se toca la pantalla).
// - Cruceta a la izquierda: ◀ ▶ moverse (doble toque = teletransporte con la espada),
//   ▲ saltar, ▼ coger objeto. Se puede deslizar el dedo entre direcciones.
// - Botones a la derecha: A saltar, B atacar y ⇄ cambiar de arma (solo con la espada).
// - Un toque en la pantalla hace lo mismo que «pulsa una tecla» en los menús.
// En PC no se muestra nada de esto y el juego funciona igual que antes.
// Usa: controles.js (pulsadas, pedidas, registrarToque), partida.js (alPulsar), estado.js.
// ==========================================================================

const esMovil = matchMedia('(hover: none) and (pointer: coarse)').matches;
const tactil = document.getElementById('tactil');
let modoTactil = false;

// Texto de los avisos «pulsa una tecla» (partida.js lo lee al terminar un nivel)
window.PULSA_TXT = 'PULSA UNA TECLA';

function activarTactil() {
  if (modoTactil) return;
  modoTactil = true;
  document.documentElement.classList.add('movil');
  window.PULSA_TXT = 'TOCA LA PANTALLA';
  const llamada = document.getElementById('llamadaInicio');
  if (llamada) llamada.textContent = 'TOCA LA PANTALLA PARA EMPEZAR';
  tactil.hidden = false;
}
if (esMovil) activarTactil();

// Pulsar y soltar una acción desde un control táctil (igual que una tecla)
function accionTactil(accion, abajo) {
  if (abajo) {
    if (!pulsadas.has(accion)) { pedidas.add(accion); registrarToque(accion); }
    pulsadas.add(accion);
  } else {
    pulsadas.delete(accion);
  }
}

// ---- Cruceta: dirección según dónde está el dedo respecto al centro ----
const cruceta = document.getElementById('cruceta');
let accionesCruceta = new Set();
function direccionesCruceta(e) {
  const r = cruceta.getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
  const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const nuevas = new Set();
  if (dx < -0.3) nuevas.add('izq');
  if (dx > 0.3) nuevas.add('der');
  if (dy < -0.45) nuevas.add('saltar');
  if (dy > 0.45 && Math.abs(dx) < 0.6) nuevas.add('coger');
  return nuevas;
}
function actualizarCruceta(nuevas) {
  for (const a of accionesCruceta) if (!nuevas.has(a)) accionTactil(a, false);
  for (const a of nuevas) if (!accionesCruceta.has(a)) accionTactil(a, true);
  accionesCruceta = nuevas;
  cruceta.dataset.dir = [...nuevas].join(' ');
}
cruceta.addEventListener('pointerdown', e => {
  e.preventDefault();
  try { cruceta.setPointerCapture(e.pointerId); } catch (err) {}
  actualizarCruceta(direccionesCruceta(e));
});
cruceta.addEventListener('pointermove', e => {
  if (accionesCruceta.size || cruceta.hasPointerCapture(e.pointerId)) actualizarCruceta(direccionesCruceta(e));
});
for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  cruceta.addEventListener(tipo, () => actualizarCruceta(new Set()));
}

// ---- Botones A, B y ⇄ ----
for (const boton of document.querySelectorAll('.btn-t')) {
  const accion = boton.dataset.accion;
  boton.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { boton.setPointerCapture(e.pointerId); } catch (err) {}
    boton.classList.add('activo');
    accionTactil(accion, true);
  });
  for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    boton.addEventListener(tipo, () => { boton.classList.remove('activo'); accionTactil(accion, false); });
  }
}

// ---- Toques fuera de los controles: empezar, continuar y pasar de nivel ----
addEventListener('touchstart', e => {
  window.__ultimoTactil = performance.now();   // para ignorar el clic de ratón que el navegador simula
  activarTactil();
  if (e.target.closest('.tactil, button, input, form, table, .ajustes, a')) return;
  if (ajustesAbiertos()) return;
  if (estado !== 'jugando') {
    // En el móvil, intenta pantalla completa en horizontal (si el navegador lo permite)
    try {
      const raiz = document.documentElement;
      if (!document.fullscreenElement && raiz.requestFullscreen) {
        raiz.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
      }
    } catch (err) {}
    alPulsar(null);
  }
}, { passive: true });

// Evita el desplazamiento y el zoom con el dedo mientras se juega
document.addEventListener('touchmove', e => { if (modoTactil && !e.target.closest('.panel')) e.preventDefault(); }, { passive: false });

// Los controles solo se ven durante la partida; ⇄ solo con la espada frame
function pintarTactil() {
  if (modoTactil) {
    tactil.classList.toggle('oculto', estado !== 'jugando' || ajustesAbiertos());
    document.getElementById('btnArma').hidden = mejora !== 'espada';
  }
  requestAnimationFrame(pintarTactil);
}
requestAnimationFrame(pintarTactil);
