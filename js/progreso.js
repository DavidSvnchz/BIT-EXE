// ==========================================================================
// PROGRESO — lo que hace que merezca la pena repetir niveles y que no frustra en los largos.
// - Estrellas: 3 por nivel (superarlo · todas las monedas · sin recibir golpes). Se guardan en el navegador
//   y se ven en el selector de nivel, en el menú (total) y al superar un nivel.
// - Cronómetro: tiempo del nivel en el marcador y récord por nivel.
// - Puntos de control: banderas en los niveles largos. Si te quedas sin batería después de pasar una,
//   vuelves a ella con 1 raya (y −500 puntos) en vez de perder la partida. Cada bandera sirve una vez.
// - Pausa: botón ❚❚ del marcador, tecla P o Start del mando. También se pausa al cambiar de pestaña.
// Usa: estado.js, partida.js, interfaz.js, configuracion.js, sonidos.js.
// ==========================================================================

const ESTRELLA = { superado: 1, monedas: 2, sinGolpes: 4 };
const CONTROL = { columnasMin: 140, columnasDos: 200, penalizacion: 500 };   // banderas: 1 si el nivel mide ≥140, 2 si ≥200

function leerJSON(clave) { try { return JSON.parse(localStorage.getItem(clave)) || {}; } catch (err) { return {}; } }
function guardarJSON(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch (err) {} }
let estrellas = leerJSON('bit-estrellas');   // { indice: máscara de bits }
let records = leerJSON('bit-tiempos');       // { indice: segundos }

const contarEstrellas = m => ((m & 1) ? 1 : 0) + ((m & 2) ? 1 : 0) + ((m & 4) ? 1 : 0);
const totalEstrellas = () => Object.values(estrellas).reduce((s, m) => s + contarEstrellas(m), 0);
const textoEstrellas = m => [1, 2, 4].map(b => (m & b) ? '★' : '☆').join('');

// ---------- Cronómetro ----------
let tiempoNivel = 0, golpesNivel = 0;
const elCrono = document.getElementById('crono');
function formatoTiempo(s) {
  const m = Math.floor(s / 60), r = s - m * 60;
  return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
}
let cronoPintado = '';
function pintarCrono() {
  const txt = formatoTiempo(tiempoNivel);
  if (txt !== cronoPintado) { elCrono.textContent = txt; cronoPintado = txt; }
}

// ---------- Puntos de control ----------
let controlesNivel = [];   // [{ c, f, activo, usado }]
function prepararControles() {
  controlesNivel = [];
  if (cols < CONTROL.columnasMin) return;
  const objetivos = cols >= CONTROL.columnasDos ? [0.36, 0.66] : [0.5];
  for (const p of objetivos) {
    const c0 = Math.round(cols * p);
    for (let d = 0; d < 20; d++) {          // busca cerca una columna con suelo, sin pinchos ni enemigos al lado
      const c = c0 + (d % 2 ? -1 : 1) * Math.ceil(d / 2);
      let f = 0;
      while (f < filas && !esSolida(c, f)) f++;
      if (f >= filas || f === 0) continue;
      const libre = k => casilla(c + k, f - 1) === AIRE && esSolida(c + k, f);
      if (libre(-1) && libre(0) && libre(1) && !enemigos.some(e => Math.abs(e.x / T - c) < 3 && e.tipo !== 'volador')) {
        controlesNivel.push({ c, f: f - 1, activo: false, usado: false });
        break;
      }
    }
  }
}
function pasoControles() {
  for (const k of controlesNivel) {
    if (!k.activo && !k.usado && bit.x > k.c * T && bit.enSuelo) {
      k.activo = true;
      for (const otro of controlesNivel) if (otro !== k && otro.activo) { otro.activo = false; otro.usado = true; }
      mostrarAviso('PUNTO DE CONTROL', 1.4);
      estallido(k.c * T + 8, k.f * T + 4, PAL.lima, 14, 60);
      sonido('bateria');
    }
  }
}
// La llama herir() cuando la batería llega a 0: devuelve true si Bit se salva en una bandera
function salvarEnControl() {
  const k = controlesNivel.find(x => x.activo && !x.usado);
  if (!k) return false;
  k.activo = false; k.usado = true;
  bateria = 1; pintarBateria(false);
  if (mejora) { mejora = null; golpesEscudo = 0; bit.arma = 'disparo'; pintarMejora(); }
  const perder = Math.min(partida.puntos, CONTROL.penalizacion);
  partida.puntos -= perder; actualizarContador();
  bit.x = k.c * T + (T - bit.w) / 2; bit.y = (k.f + 1) * T - bit.h; bit.vx = 0; bit.vy = 0;
  bit.seguro = { x: bit.x, y: bit.y };
  bit.parpadeo = 2.2;
  proyectiles = proyectiles.filter(p => p.deBit);
  centrarCamara(1);
  mostrarAviso(perder ? '¡REINTENTO! −' + perder + ' PUNTOS' : '¡REINTENTO!', 2);
  destellar(0.25, PAL.lima); sonido('teleporte');
  medir('punto_control', { nivel: etiqueta(nivelActual) });
  return true;
}
function dibujarControles(cx, cy) {
  for (const k of controlesNivel) {
    const x = k.c * T + 6 - cx, y = k.f * T - cy;
    if (x < -20 || x > ANCHO + 20) continue;
    ctx.fillStyle = PAL.gris; ctx.fillRect(x, y - 6, 1, 22);                               // mástil
    const ondea = Math.floor(tiempo * 6) % 2;
    ctx.fillStyle = k.usado ? PAL.tinta2 : k.activo ? PAL.lima : PAL.acero;
    ctx.fillRect(x + 1, y - 6 + ondea, 8, 5); ctx.fillRect(x + 9, y - 5 + ondea, 2, 3);   // bandera
    if (k.activo) { ctx.fillStyle = PAL.crema; ctx.fillRect(x + 3, y - 5 + ondea, 2, 1); }
  }
}

// ---------- Estrellas al superar un nivel ----------
// Devuelve { mascara, nuevas, record, mejorado } y guarda lo conseguido
function cerrarNivel(gana) {
  if (!gana) return null;
  let m = ESTRELLA.superado;
  if (monedas >= totalMonedas) m |= ESTRELLA.monedas;
  if (golpesNivel === 0) m |= ESTRELLA.sinGolpes;
  const antes = estrellas[nivelActual] || 0;
  estrellas[nivelActual] = antes | m;
  guardarJSON('bit-estrellas', estrellas);
  const previo = records[nivelActual];
  const mejorado = !previo || tiempoNivel < previo;
  if (mejorado) { records[nivelActual] = Math.round(tiempoNivel * 10) / 10; guardarJSON('bit-tiempos', records); }
  pintarTotalEstrellas();
  return { mascara: m, nuevas: m & ~antes, record: records[nivelActual], mejorado, primero: !previo };
}
function pintarEstrellasFin(r) {
  const caja = document.getElementById('finEstrellas');
  if (!r) { caja.hidden = true; return; }
  caja.hidden = false;
  const nombres = ['NIVEL', 'MONEDAS', 'SIN GOLPES'];
  caja.innerHTML = [1, 2, 4].map((b, i) =>
    '<span class="estrella' + ((r.mascara & b) ? ' si' : '') + ((r.nuevas & b) ? ' nueva' : '') + '" style="animation-delay:' + (0.15 + i * 0.25) + 's">' +
    '<b>' + ((r.mascara & b) ? '★' : '☆') + '</b><small>' + nombres[i] + '</small></span>').join('') +
    '<span class="tiempo-fin">' + formatoTiempo(tiempoNivel) + (r.primero ? '' : r.mejorado ? ' · <em>¡NUEVO RÉCORD!</em>' : ' · RÉCORD ' + formatoTiempo(r.record)) + '</span>';
  if (r.nuevas) setTimeout(() => sonido('moneda'), 400);
}
function pintarTotalEstrellas() {
  const el = document.getElementById('totalEstrellas');
  if (el) el.textContent = '★ ' + totalEstrellas() + ' / ' + NIVELES.length * 3;
}
pintarTotalEstrellas();

// ---------- Pausa ----------
let pausado = false;
const panelPausa = document.getElementById('panelPausa');
function pausar() {
  if (estado !== 'jugando' || pausado || ajustesAbiertos()) return;
  pausado = true;
  pulsadas.clear(); pedidas.clear();
  document.getElementById('pausaNivel').textContent = 'NIVEL ' + etiqueta(nivelActual) + ' · ' + NIVELES[nivelActual].nombre.toUpperCase();
  document.getElementById('pausaDatos').textContent = 'Tiempo ' + formatoTiempo(tiempoNivel) + ' · Monedas ' + monedas + ' de ' + totalMonedas +
    ' · ' + (golpesNivel ? 'Has recibido golpes' : 'Sin golpes, de momento');
  panelPausa.hidden = false;
  sonido('menu');
}
function reanudar() {
  if (!pausado) return;
  pausado = false;
  panelPausa.hidden = true;
  pulsadas.clear(); pedidas.clear();
  document.activeElement && document.activeElement.blur();
}
document.getElementById('botonPausa').addEventListener('click', e => { e.currentTarget.blur(); pausado ? reanudar() : pausar(); });
document.getElementById('continuar').addEventListener('click', reanudar);
document.getElementById('pausaAjustes').addEventListener('click', () => { reanudar(); abrirAjustes(); });
document.getElementById('pausaMenu').addEventListener('click', () => { reanudar(); medir('abandona', { nivel: etiqueta(nivelActual) }); irAlMenu(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
pintarSelector();   // el selector ya puede enseñar las estrellas
