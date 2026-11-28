// ==========================================================================
// MANDO — juega con un mando (Xbox, PlayStation o genérico) conectado al PC.
// - Se lee con la Gamepad API en cada fotograma y se convierte en las mismas acciones que el
//   teclado (pulsadas / pedidas). Los botones se configuran en Ajustes › Controles (columna Mando).
// - Fijos además de lo configurable: la cruceta mueve (← →), salta (↑) y coge (↓); Start pausa
//   la partida (en los menús abre Ajustes).
// - En Ajustes, con el mando: ↑ ↓ eligen fila, LB/RB cambian de pestaña, A cambia el botón de la fila
//   (luego pulsa el botón nuevo; Start cancela), X restablece, B cierra.
// - En los menús cualquier botón vale para «pulsa una tecla»; vibra con los golpes si el mando puede.
// Usa: controles.js, interfaz.js, partida.js (alPulsar), historia.js, estado.js.
// ==========================================================================

const UMBRAL_EJE = 0.5;
const FIJOS_MANDO = { Boton12: 'saltar', Boton13: 'coger', Boton14: 'izq', Boton15: 'der' };
let usandoMando = false;
let codigosAntes = new Set(), accionesMando = new Set();
let filaMando = 0;   // fila con el foco en Ajustes › Controles

function leerMando() {
  const lista = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const m of lista) if (m && m.connected) return m;
  return null;
}
function codigosActivos(m) {
  const s = new Set();
  m.buttons.forEach((b, i) => { if (b && (b.pressed || b.value > 0.5)) s.add('Boton' + i); });
  m.axes.slice(0, 4).forEach((v, i) => { if (v < -UMBRAL_EJE) s.add('Eje' + i + '-'); else if (v > UMBRAL_EJE) s.add('Eje' + i + '+'); });
  return s;
}
const accionDeMando = cod => accionDe[cod] || FIJOS_MANDO[cod] || null;

function empezarAUsarMando() {
  if (usandoMando) return;
  usandoMando = true;
  window.PULSA_TXT = 'PULSA UN BOTÓN';
  const llamada = document.getElementById('llamadaInicio');
  if (llamada) llamada.textContent = 'PULSA UN BOTÓN PARA EMPEZAR';
  mostrarAviso('MANDO CONECTADO', 1.6);
  medir('mando_conectado', { id: (leerMando() || {}).id || '' });
}
// Al volver al teclado, los textos vuelven a hablar de teclas
addEventListener('keydown', () => {
  if (!usandoMando) return;
  usandoMando = false;
  if (!modoTactil) { window.PULSA_TXT = 'PULSA UNA TECLA'; document.getElementById('llamadaInicio').textContent = 'PULSA UNA TECLA PARA EMPEZAR'; }
}, true);
// Nombre que enseñan las pistas del tutorial: el botón del mando si se juega con mando
function teclaDe(id) {
  if (usandoMando) return nombreTecla(controles[id][HUECO_MANDO]) || nombreTecla(Object.keys(FIJOS_MANDO).find(k => FIJOS_MANDO[k] === id));
  return primeraDe(id);
}

function vibrar(ms = 120, fuerza = 0.6) {
  const m = leerMando();
  try { if (m && m.vibrationActuator) m.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: fuerza, weakMagnitude: fuerza * 0.7 }); } catch (err) {}
}

// ---- Ajustes con el mando ----
function marcarFilaMando() {
  document.querySelectorAll('.tecla.foco-mando').forEach(b => b.classList.remove('foco-mando'));
  if (!ajustesAbiertos() || document.getElementById('apControles').hidden) return;
  const b = document.querySelector('.tecla[data-accion="' + ACCIONES[filaMando].id + '"][data-hueco="' + HUECO_MANDO + '"]');
  if (b) b.classList.add('foco-mando');
}
function mandoEnAjustes(cod) {
  if (capturando) {
    if (cod === 'Boton9') { cancelarCaptura(); marcarFilaMando(); return; }   // Start cancela
    if (capturando.hueco === HUECO_MANDO) { asignarCaptura(cod); marcarFilaMando(); }
    return;
  }
  const controlesVisibles = !document.getElementById('apControles').hidden;
  if (cod === 'Boton1' || cod === 'Boton9') { cerrarAjustes(); return; }
  if (cod === 'Boton4' || cod === 'Boton5') {
    document.getElementById(controlesVisibles ? 'tabSonido' : 'tabControles').click();
    marcarFilaMando(); return;
  }
  if (!controlesVisibles) {
    if (cod === 'Boton0') musica.alternar();
    return;
  }
  if (cod === 'Boton12' || cod === 'Eje1-') filaMando = (filaMando + ACCIONES.length - 1) % ACCIONES.length;
  else if (cod === 'Boton13' || cod === 'Eje1+') filaMando = (filaMando + 1) % ACCIONES.length;
  else if (cod === 'Boton0') {
    capturando = { accion: ACCIONES[filaMando].id, hueco: HUECO_MANDO };
    avisoTecla.textContent = 'Pulsa el botón del mando para «' + ACCIONES[filaMando].nombre + '».';
    pintarTablaControles();
  } else if (cod === 'Boton2') {
    document.getElementById('restablecer').click();
  }
  marcarFilaMando();
}

// ---- Bucle del mando ----
function pasoMando() {
  requestAnimationFrame(pasoMando);
  const m = leerMando();
  if (!m) { if (accionesMando.size) { for (const a of accionesMando) pulsadas.delete(a); accionesMando.clear(); } codigosAntes.clear(); return; }
  const codigos = codigosActivos(m);
  const nuevos = [...codigos].filter(c => !codigosAntes.has(c));
  codigosAntes = codigos;
  if (nuevos.length) { empezarAUsarMando(); musica.iniciar(); }

  if (ajustesAbiertos()) {
    for (const a of accionesMando) pulsadas.delete(a);
    accionesMando.clear();
    for (const c of nuevos) mandoEnAjustes(c);
    return;
  }
  // Pausa: Start pausa y reanuda; en pausa, A o B continúan e Y abre Ajustes
  if (pausado) {
    if (nuevos.some(c => c === 'Boton9' || c === 'Boton0' || c === 'Boton1')) reanudar();
    else if (nuevos.includes('Boton3')) { reanudar(); abrirAjustes(); filaMando = 0; marcarFilaMando(); }
    return;
  }
  if (nuevos.includes('Boton9')) {
    if (estado === 'jugando') { for (const a of accionesMando) pulsadas.delete(a); accionesMando.clear(); pausar(); return; }
    abrirAjustes(); filaMando = 0; marcarFilaMando(); return;
  }

  // Formulario del ranking: A guarda (con el último nombre o «BIT»), B no guarda
  if (esperandoNombre) {
    if (nuevos.includes('Boton0')) cerrarFormulario(true);
    else if (nuevos.includes('Boton1')) cerrarFormulario(false);
    return;
  }
  // Menús, historia y paneles de fin: cualquier botón hace de «pulsa una tecla»
  if (estado !== 'jugando') {
    for (const c of nuevos) { if (alPulsar(accionDeMando(c))) break; }
    return;
  }
  // Partida: acciones mantenidas y recién pulsadas, igual que el teclado
  const ahora = new Set();
  for (const c of codigos) { const a = accionDeMando(c); if (a) ahora.add(a); }
  for (const a of ahora) if (!accionesMando.has(a)) { pedidas.add(a); registrarToque(a); }
  for (const a of accionesMando) if (!ahora.has(a)) pulsadas.delete(a);
  for (const a of ahora) pulsadas.add(a);
  accionesMando = ahora;
}
requestAnimationFrame(pasoMando);
addEventListener('gamepadconnected', () => mostrarAviso('MANDO DETECTADO · PULSA UN BOTÓN', 2));
addEventListener('gamepaddisconnected', () => { mostrarAviso('MANDO DESCONECTADO', 1.6); for (const a of accionesMando) pulsadas.delete(a); accionesMando.clear(); });
