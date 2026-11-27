// ==========================================================================
// INTERFAZ — todo lo que es HTML encima del juego.
// - Ajustes: pestañas Sonido / Controles y la captura de teclas nuevas.
// - Marcador: batería, monedas, puntos, mejora activa, avisos flotantes y barra del jefe.
// - Selector de nivel de la pantalla de inicio.
// - Ranking: guardar nombre, top 10 en el navegador, paneles de fin y menú.
// Usa: estado.js, controles.js, configuracion.js.
// ==========================================================================

// ============================================================
// AJUSTES: pestañas Sonido / Controles (el juego se pausa)
// ============================================================
const panelAjustes = document.getElementById('panelAjustes');
const tablaControles = document.getElementById('tablaControles');
const avisoTecla = document.getElementById('avisoTecla');
const ajustesAbiertos = () => !panelAjustes.hidden;

function abrirAjustes() {
  panelAjustes.hidden = false;
  pulsadas.clear(); pedidas.clear();
  document.getElementById('cerrarAjustes').focus();
}
function cerrarAjustes() {
  if (capturando) { cancelarCaptura(); return; }
  panelAjustes.hidden = true;
  avisoTecla.textContent = '';
  pulsadas.clear(); pedidas.clear();
  document.activeElement && document.activeElement.blur();
}
document.getElementById('abrirAjustes').addEventListener('click', e => { e.currentTarget.blur(); abrirAjustes(); });
document.getElementById('cerrarAjustes').addEventListener('click', cerrarAjustes);

const PESTANAS = [['tabSonido', 'apSonido'], ['tabControles', 'apControles']];
for (const [tab, ap] of PESTANAS) {
  document.getElementById(tab).addEventListener('click', () => {
    cancelarCaptura();
    for (const [t2, a2] of PESTANAS) {
      document.getElementById(t2).setAttribute('aria-selected', String(t2 === tab));
      document.getElementById(a2).hidden = a2 !== ap;
    }
  });
}

function escaparHTML(t) {
  return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pintarTablaControles() {
  tablaControles.innerHTML = ACCIONES.map(a => '<tr><td>' + a.nombre + '</td>' +
    [0, 1, 2].map(h => {
      const cod = controles[a.id][h];
      const esperando = capturando && capturando.accion === a.id && capturando.hueco === h;
      const clases = 'tecla' + (cod ? '' : ' vacia') + (esperando ? ' esperando' : '');
      return '<td><button type="button" class="' + clases + '" data-accion="' + a.id + '" data-hueco="' + h + '">' +
        (esperando ? 'Pulsa…' : escaparHTML(nombreTecla(cod))) + '</button></td>';
    }).join('') + '</tr>').join('');
}
tablaControles.addEventListener('click', e => {
  const b = e.target.closest('.tecla');
  if (!b) return;
  capturando = { accion: b.dataset.accion, hueco: Number(b.dataset.hueco) };
  avisoTecla.textContent = 'Pulsa la tecla o el botón del ratón para «' + ACCIONES.find(a => a.id === capturando.accion).nombre + '».';
  pintarTablaControles();
});
function asignarCaptura(cod) {
  const { accion, hueco } = capturando;
  if (cod === 'Escape') { cancelarCaptura(); return; }
  if (cod === 'Backspace' || cod === 'Delete') {
    controles[accion][hueco] = null;
    capturando = null; avisoTecla.textContent = 'Casilla vaciada.';
    recalcularControles(); return;
  }
  if (RESERVADAS.includes(cod)) { avisoTecla.textContent = nombreTecla(cod) + ' está reservada; elige otra.'; return; }
  let quitada = '';
  for (const a of ACCIONES) controles[a.id] = controles[a.id].map((c, i) => {
    if (c === cod && !(a.id === accion && i === hueco)) { if (a.id !== accion) quitada = a.nombre; return null; }
    return c;
  });
  controles[accion][hueco] = cod;
  capturando = null;
  avisoTecla.textContent = quitada ? nombreTecla(cod) + ' ya no sirve para «' + quitada + '».' : '';
  recalcularControles();
}
function cancelarCaptura() {
  if (!capturando) return;
  capturando = null; avisoTecla.textContent = '';
  pintarTablaControles();
}
document.getElementById('restablecer').addEventListener('click', () => {
  controles = copiarControles(CONTROLES_POR_DEFECTO);
  avisoTecla.textContent = 'Controles restablecidos.';
  recalcularControles();
});
recalcularControles();

const contador = document.getElementById('contador');
const svgBateria = document.getElementById('bateria');
const cajaMejora = document.getElementById('mejora');
const panelInicio = document.getElementById('panelInicio');
const panelFin = document.getElementById('panelFin');
const avisoCoger = document.getElementById('avisoCoger');
const elAviso = document.getElementById('aviso');

function pintarBateria(golpe) {
  const n = Math.max(0, bateria), huecos = Math.max(3, n), w = huecos * 3 + 4, h = 9;
  let r = '<rect class="borde" x="0" y="0" width="' + (w - 1) + '" height="1"/>' +
    '<rect class="borde" x="0" y="' + (h - 1) + '" width="' + (w - 1) + '" height="1"/>' +
    '<rect class="borde" x="0" y="0" width="1" height="' + h + '"/>' +
    '<rect class="borde" x="' + (w - 2) + '" y="0" width="1" height="' + h + '"/>' +
    '<rect class="borde" x="' + (w - 1) + '" y="3" width="1" height="3"/>';
  for (let i = 0; i < huecos; i++)
    r += '<rect class="' + (i < n ? (n <= 1 ? 'baja' : 'llena') : 'vacia') + '" x="' + (2 + i * 3) + '" y="2" width="2" height="5"/>';
  svgBateria.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svgBateria.style.width = 'calc(var(--s) * ' + w + 'px)';
  svgBateria.innerHTML = r;
  svgBateria.classList.toggle('critica', n === 1);
  svgBateria.setAttribute('aria-label', 'Batería: ' + n + (n === 1 ? ' raya' : ' rayas'));
  if (golpe) { svgBateria.classList.remove('golpe'); void svgBateria.getBoundingClientRect(); svgBateria.classList.add('golpe'); }
}

function pintarMejora() {
  cajaMejora.hidden = !mejora;
  if (!mejora) return;
  cajaMejora.dataset.tipo = mejora;
  document.getElementById('mejoraNombre').textContent = NOMBRE_MEJORA[mejora];
  let extra = '';
  if (mejora === 'escudo') extra = '◆'.repeat(ESCUDO.golpesMax - golpesEscudo) + '◇'.repeat(golpesEscudo);
  if (mejora === 'espada') extra = '· ' + (bit && bit.arma === 'espada' ? 'ESPADA' : 'DISPARO');
  document.getElementById('mejoraExtra').textContent = extra;
}

let temporizadorAviso = 0;
function mostrarAviso(texto, segundos = 1.8) {
  elAviso.textContent = texto;
  elAviso.classList.remove('oculto');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => elAviso.classList.add('oculto'), segundos * 1000);
}

function pintarSelector() {
  document.getElementById('nivelSel').innerHTML = 'NIVEL ' + etiqueta(nivelElegido) +
    '<small>' + escaparHTML(NIVELES[nivelElegido].nombre) + ' · ' + (nivelElegido + 1) + ' de ' + NIVELES.length + (nivelElegido < nivelMaximo || nivelMaximo === NIVELES.length - 1 ? '' : ' · nuevo') + '</small>';
  document.getElementById('nivelMenos').disabled = nivelElegido <= 0;
  document.getElementById('nivelMas').disabled = nivelElegido >= nivelMaximo;
}
function elegirNivel(d) {
  nivelElegido = Math.max(0, Math.min(nivelMaximo, nivelElegido + d));
  pintarSelector();
}
document.getElementById('nivelMenos').addEventListener('click', e => { e.currentTarget.blur(); elegirNivel(-1); });
document.getElementById('nivelMas').addEventListener('click', e => { e.currentTarget.blur(); elegirNivel(1); });
pintarSelector();

// ---------- Ranking (guardado en este navegador) ----------
const formRanking = document.getElementById('formRanking');
const inputNombre = document.getElementById('nombreRanking');
function leerRanking() {
  try {
    const r = JSON.parse(localStorage.getItem('bit-ranking'));
    return Array.isArray(r) ? r.filter(e => e && typeof e.puntos === 'number').slice(0, RANKING_MAX) : [];
  } catch (err) { return []; }
}
function entraEnRanking(p) {
  const r = leerRanking();
  return p > 0 && (r.length < RANKING_MAX || p > r[r.length - 1].puntos);
}
function anadirRanking(nombre, puntos, nivel) {
  const r = leerRanking(), entrada = { nombre, puntos, mundo: MUNDO.numero, nivel, fecha: Date.now() };
  r.push(entrada);
  r.sort((a, b) => b.puntos - a.puntos);
  const top = r.slice(0, RANKING_MAX);
  try { localStorage.setItem('bit-ranking', JSON.stringify(top)); } catch (err) {}
  return top.indexOf(entrada);
}
function pintarRanking(tbody, maxFilas, resaltar) {
  const r = leerRanking();
  tbody.innerHTML = r.length ? r.slice(0, maxFilas).map((e, i) =>
    '<tr' + (i === resaltar ? ' class="nuevo"' : '') + '><td>' + (i + 1) + '</td><td>' + escaparHTML(e.nombre) +
    '</td><td>' + escaparHTML(Number(e.puntos)) + '</td><td>' + escaparHTML((Number(e.mundo) || 1) + '-' + (Number(e.nivel) || '?')) + '</td></tr>').join('')
    : '<tr><td colspan="4">Todavía no hay puntuaciones.</td></tr>';
}
function mostrarRankingFin(resaltar) {
  const tabla = document.getElementById('rankingFin');
  pintarRanking(tabla.querySelector('tbody'), 5, resaltar);
  tabla.hidden = false;
  const llamada = document.getElementById('finLlamada');
  llamada.hidden = false;
  if (resaltar >= 5) llamada.textContent = 'PUESTO ' + (resaltar + 1) + ' · ' + llamada.textContent;
}
function cerrarFormulario(guardar) {
  if (!esperandoNombre) return;
  let puesto = -1;
  if (guardar) {
    const nombre = (inputNombre.value.trim().toUpperCase().slice(0, 10)) || 'BIT';
    try { localStorage.setItem('bit-nombre', nombre); } catch (err) {}
    puesto = anadirRanking(nombre, partida.puntos, nivelActual + 1);
  }
  esperandoNombre = false;
  formRanking.hidden = true;
  inputNombre.blur();
  tiempoFin = tiempo;
  mostrarRankingFin(puesto);
}
formRanking.addEventListener('submit', e => { e.preventDefault(); cerrarFormulario(true); });
document.getElementById('noGuardar').addEventListener('click', () => cerrarFormulario(false));

function irAlMenu() {
  estado = 'inicio';
  finDePartida = false;
  panelFin.hidden = true;
  panelInicio.hidden = false;
  nivelElegido = Math.min(nivelElegido, nivelMaximo);
  pintarSelector();
}
document.getElementById('irMenu').addEventListener('click', e => { e.currentTarget.blur(); irAlMenu(); });
const panelRanking = document.getElementById('panelRanking');
document.getElementById('verRanking').addEventListener('click', e => {
  e.currentTarget.blur();
  pintarRanking(document.getElementById('rankingInicio'), RANKING_MAX, -1);
  panelRanking.hidden = false;
});
document.getElementById('cerrarRanking').addEventListener('click', () => { panelRanking.hidden = true; });

const barraJefe = document.getElementById('barraJefe');
function pintarJefe() {
  const e = enemigos.find(x => x.tipo === 'jefe' && x.activo);
  barraJefe.hidden = !e || estado !== 'jugando';
  if (!e) return;
  document.getElementById('vidaJefe').style.width = Math.max(0, e.vida / e.vidaMax * 100) + '%';
  barraJefe.classList.toggle('fase2', e.fase2);
}
