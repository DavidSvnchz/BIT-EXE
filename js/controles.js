// ==========================================================================
// CONTROLES — acciones, teclas configurables y entrada de teclado/ratón.
// - ACCIONES y CONTROLES_POR_DEFECTO: qué hace cada tecla (hasta 3 por acción) y cada botón del mando
//   (la 4.ª casilla; el mando lo gestiona mando.js). Se guardan en el navegador.
// - pulsadas = acciones mantenidas; pedidas = acciones pulsadas desde el último paso (las consume bucle.js).
// - El doble toque de dirección (teletransporte) se detecta aquí y lo ejecuta bit.js.
// Usa: estado.js; llama a alPulsar() (partida.js) y a los ajustes (interfaz.js).
// ==========================================================================

// ============================================================
// CONTROLES CONFIGURABLES
//    Cada acción tiene 3 casillas de teclado/ratón: códigos de tecla (KeyA, Space…) o botones del ratón
//    (Raton0 = izquierdo, Raton1 = central, Raton2 = derecho), y una 4.ª de mando:
//    Boton0…Boton16 (distribución estándar: 0 = A/✕, 1 = B/○, 2 = X/□, 3 = Y/△…) o Eje0-/Eje0+… (sticks).
// ============================================================
const ACCIONES = [
  { id: 'izq',         nombre: 'Izquierda' },
  { id: 'der',         nombre: 'Derecha' },
  { id: 'saltar',      nombre: 'Saltar' },
  { id: 'disparar',    nombre: 'Atacar' },
  { id: 'cambiarArma', nombre: 'Cambiar arma' },
  { id: 'coger',       nombre: 'Coger objeto' },
];
const CONTROLES_POR_DEFECTO = {
  izq:         ['ArrowLeft', 'KeyA', null, 'Eje0-'],
  der:         ['ArrowRight', 'KeyD', null, 'Eje0+'],
  saltar:      ['Space', 'ArrowUp', 'KeyW', 'Boton0'],
  disparar:    ['Raton0', 'KeyJ', null, 'Boton2'],
  cambiarArma: ['Raton2', 'KeyQ', null, 'Boton3'],
  coger:       ['ArrowDown', 'KeyE', 'KeyS', 'Boton1'],
};
const RESERVADAS = ['Escape', 'KeyM', 'KeyP', 'Backspace', 'Tab', 'Boton9'];   // Boton9 = Start: abre Ajustes
const HUECO_MANDO = 3;
const esCodigoMando = cod => /^(Boton|Eje)/.test(cod || '');
const copiarControles = c => JSON.parse(JSON.stringify(c));

let controles = copiarControles(CONTROLES_POR_DEFECTO);
try {
  const guardados = JSON.parse(localStorage.getItem('bit-controles'));
  if (guardados) {
    for (const a of ACCIONES)
      if (Array.isArray(guardados[a.id]) && guardados[a.id].length >= 3)
        controles[a.id] = guardados[a.id].slice(0, 3).concat([guardados[a.id].length > 3 ? guardados[a.id][3] : CONTROLES_POR_DEFECTO[a.id][3]]);
    // acciones nuevas: quitar de sus teclas por defecto las que ya use otra acción guardada
    const usados = new Set(ACCIONES.filter(a => guardados[a.id]).flatMap(a => guardados[a.id]).filter(Boolean));
    for (const a of ACCIONES) if (!guardados[a.id]) controles[a.id] = controles[a.id].map(c => usados.has(c) ? null : c);
  }
} catch (err) {}

let accionDe = {};
function recalcularControles() {
  accionDe = {};
  for (const a of ACCIONES) for (const cod of controles[a.id]) if (cod) accionDe[cod] = a.id;
  try { localStorage.setItem('bit-controles', JSON.stringify(controles)); } catch (err) {}
  pintarTablaControles();
  document.getElementById('ayudaControles').textContent =
    'Moverse: ' + nombresDe('izq') + ' y ' + nombresDe('der') + ' · Saltar: ' + nombresDe('saltar') +
    ' · Atacar: ' + nombresDe('disparar') + ' · Cambiar arma: ' + nombresDe('cambiarArma') +
    ' · Coger: ' + nombresDe('coger') + ' · Ajustes: Esc. Cada 50 monedas: +1 batería; cada batería perdida: −10 monedas.';
}

const NOMBRES_TECLA = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espacio', Enter: 'Intro',
  ShiftLeft: 'Mayús izq.', ShiftRight: 'Mayús dcha.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl dcho.',
  AltLeft: 'Alt', AltRight: 'Alt Gr', MetaLeft: 'Cmd/Win', MetaRight: 'Cmd/Win', CapsLock: 'Bloq Mayús',
  Raton0: 'Clic izq.', Raton1: 'Clic central', Raton2: 'Clic dcho.', Raton3: 'Ratón atrás', Raton4: 'Ratón adelante',
  Semicolon: 'Ñ', Quote: '´', BracketLeft: '`', BracketRight: '+', Backslash: 'Ç', Slash: '-', Period: '.', Comma: ',',
  Minus: "'", Equal: '¡', IntlBackslash: '<'
};
const NOMBRES_BOTON = ['A / ✕', 'B / ○', 'X / □', 'Y / △', 'LB / L1', 'RB / R1', 'LT / L2', 'RT / R2',
  'Select', 'Start', 'L3', 'R3', 'Cruceta ↑', 'Cruceta ↓', 'Cruceta ←', 'Cruceta →', 'Home / PS'];
const NOMBRES_EJE = { 'Eje0-': 'Stick ←', 'Eje0+': 'Stick →', 'Eje1-': 'Stick ↑', 'Eje1+': 'Stick ↓',
  'Eje2-': 'Stick dcho. ←', 'Eje2+': 'Stick dcho. →', 'Eje3-': 'Stick dcho. ↑', 'Eje3+': 'Stick dcho. ↓' };
function nombreTecla(cod) {
  if (!cod) return '—';
  if (NOMBRES_TECLA[cod]) return NOMBRES_TECLA[cod];
  if (/^Boton\d+$/.test(cod)) return NOMBRES_BOTON[+cod.slice(5)] || 'Botón ' + cod.slice(5);
  if (/^Eje\d[+-]$/.test(cod)) return NOMBRES_EJE[cod] || 'Eje ' + cod.slice(3);
  if (/^Key[A-Z]$/.test(cod)) return cod.slice(3);
  if (/^Digit\d$/.test(cod)) return cod.slice(5);
  if (/^Numpad/.test(cod)) return 'Num ' + cod.slice(6);
  return cod;
}
const nombresDe = id => controles[id].slice(0, 3).filter(Boolean).map(nombreTecla).join(' / ') || 'sin asignar';
const primeraDe = id => nombreTecla(controles[id].slice(0, 3).find(Boolean));

// ============================================================
// ENTRADA: teclado y ratón
// ============================================================
const pulsadas = new Set();   // acciones mantenidas
const pedidas = new Set();    // acciones pulsadas desde el último paso
let capturando = null;        // { accion, hueco } mientras se espera una tecla nueva en Ajustes
let ignorarClic = false;
let ultimoToque = { accion: null, t: 0 };   // para el doble toque del teletransporte

function pulsar(cod, repetida) {
  const accion = accionDe[cod];
  if (!accion) return;
  pulsadas.add(accion);
  if (!repetida) { pedidas.add(accion); registrarToque(accion); }
}
function soltar(cod) {
  const accion = accionDe[cod];
  if (accion) pulsadas.delete(accion);
}

addEventListener('keydown', e => {
  if (e.target === inputNombre) return;   // escribiendo el nombre del ranking
  if (capturando) { e.preventDefault(); asignarCaptura(e.code); return; }
  if (pausado) { e.preventDefault(); if (!e.repeat && ['KeyP', 'Escape', 'Enter', 'Space'].includes(e.code)) reanudar(); return; }
  if (e.code === 'KeyP' && estado === 'jugando' && !ajustesAbiertos()) { pausar(); return; }
  if (e.code === 'Escape') { ajustesAbiertos() ? cerrarAjustes() : abrirAjustes(); return; }
  if (ajustesAbiertos()) return;
  if (e.code === 'KeyM') { if (!e.repeat) musica.alternar(); return; }
  const accion = accionDe[e.code];
  if (accion) e.preventDefault();
  if (!e.repeat && alPulsar(accion)) return;
  pulsar(e.code, e.repeat);
});
addEventListener('keyup', e => {
  if (accionDe[e.code]) e.preventDefault();
  soltar(e.code);
});
addEventListener('blur', () => pulsadas.clear());

addEventListener('mousedown', e => {
  if (capturando) {
    e.preventDefault(); e.stopPropagation();
    ignorarClic = e.button === 0;   // solo el botón izquierdo genera luego un 'click'
    asignarCaptura('Raton' + e.button);
    return;
  }
  if (performance.now() - (window.__ultimoTactil || 0) < 800) return;
  if (pausado) return;   // clic simulado tras un toque (móvil)
  if (ajustesAbiertos() || !marco.contains(e.target) || e.target.closest('button, input, form, .ajustes, table')) return;
  e.preventDefault();
  const cod = 'Raton' + e.button;
  if (alPulsar(accionDe[cod])) return;
  pulsar(cod, false);
}, true);
addEventListener('mouseup', e => soltar('Raton' + e.button));
addEventListener('click', e => {
  if (ignorarClic) { ignorarClic = false; e.preventDefault(); e.stopPropagation(); }
}, true);
marco.addEventListener('contextmenu', e => e.preventDefault());
marco.addEventListener('auxclick', e => e.preventDefault());
