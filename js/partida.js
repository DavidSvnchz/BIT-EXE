// ==========================================================================
// PARTIDA — el flujo del juego.
// cargarNivel() prepara un nivel; nuevaPartida() empieza de cero; sumarPuntos()/sumarMoneda()
// llevan la cuenta (y dan la batería extra cada 50 monedas); terminar() muestra victoria o derrota;
// alPulsar() decide qué hace la primera tecla en el inicio y en los paneles de fin.
// Usa: casi todo; es el pegamento entre bit.js, enemigos.js e interfaz.js.
// ==========================================================================

function cargarNivel(indice, reiniciar) {
  const nivel = NIVELES[indice];
  tema = ZONAS[Math.max(0, zonaDe(indice))];
  mapa = nivel.mapa.map(fila => [...fila]);   // copia editable
  filas = mapa.length;
  cols = mapa[0].length;
  enemigos = []; proyectiles = []; rayos = []; particulas = []; fantasmas = []; textos = [];
  objetoCerca = null; avisoCoger.hidden = true;
  congelado = 0; destello = 0; temblor = 0;
  const d = nivel.dificultad || 0;
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    const tipo = ENEMIGO_DE[mapa[f][c]];
    if (tipo) {
      if (!opcionesPrueba.sinEnemigos) enemigos.push(crearEnemigo(tipo, c, f, d));
      mapa[f][c] = AIRE;
    }
  }
  prepararTeniente(indice);   // lugarteniente al final de cada zona (tenientes.js)
  totalMonedas = mapa.flat().filter(v => v === MONEDA).length;
  tiempoNivel = 0; golpesNivel = 0;
  monedas = 0;
  if (reiniciar) { bateria = BATERIA.inicial; mejora = null; golpesEscudo = 0; }
  else bateria = Math.max(bateria, BATERIA.inicial);
  bit = {
    x: nivel.inicio.col * T + (T - CAJA.ancho) / 2,
    y: nivel.inicio.fila * T + T - CAJA.alto,
    w: CAJA.ancho, h: CAJA.alto,
    vx: 0, vy: 0, enSuelo: false, saltando: false,
    mira: 1, fotograma: 0, paso: 0,
    parpadeo: 0, recarga: 0, rafaga: 0, rafagaT: 0, tpRecarga: 0,
    arma: mejora === 'espada' ? 'espada' : 'disparo',
    tajo: null,
    seguro: null
  };
  bit.seguro = { x: bit.x, y: bit.y };
  centrarCamara(1);
  actualizarContador();
  pintarBateria(false);
  pintarMejora();
  mostrarAviso(etiqueta(indice) + ' · ' + nivel.nombre.toUpperCase(), 2.2);
  prepararTutorial(indice);
  prepararControles();
}

function actualizarContador() {
  contador.textContent = partida.monedas + ' / ' + partida.proximaVida;
  document.getElementById('puntos').textContent = String(partida.puntos).padStart(6, '0');
}
function sumarPuntos(n, x, y) {
  partida.puntos += n;
  if (x !== undefined) textos.push({ txt: '+' + n, x, y, t: 0 });
  actualizarContador();
}
function sumarMoneda() {
  partida.monedas++;
  sonido('moneda');
  sumarPuntos(PUNTOS.moneda);
  // cada 50 monedas acumuladas, una batería extra (el umbral solo sube: perder monedas no la regala otra vez)
  while (partida.monedas >= partida.proximaVida) {
    partida.proximaVida += MONEDAS.porVida;
    sonido('bateria');
    if (bateria < BATERIA.maxima) { bateria++; pintarBateria(false); mostrarAviso('¡' + MONEDAS.porVida + ' MONEDAS! +1 BATERÍA'); }
    else { sumarPuntos(PUNTOS.vidaConBateriaLlena, bit.x, bit.y - 6); mostrarAviso('¡' + MONEDAS.porVida + ' MONEDAS! +' + PUNTOS.vidaConBateriaLlena); }
    estallido(bit.x + bit.w / 2, bit.y + 8, PAL.lima, 16);
  }
  actualizarContador();
}
function nuevaPartida(nivel) {
  partida = { puntos: 0, monedas: 0, proximaVida: MONEDAS.porVida };
  finDePartida = false;
  nivelActual = nivel;
  cargarNivel(nivel, true);
  estado = 'jugando';
  panelInicio.hidden = true;
  panelFin.hidden = true;
  medir('partida_empezada', { nivel: etiqueta(nivel) });
}

function terminar(gana) {
  estado = gana ? 'victoria' : 'derrota';
  tiempoFin = tiempo;
  bit.vx = 0;
  avisoCoger.hidden = true;
  const ultimo = nivelActual === NIVELES.length - 1;
  if (gana && !ultimo && nivelActual + 1 > nivelMaximo) {
    nivelMaximo = nivelActual + 1;
    try { localStorage.setItem('bit-progreso', String(nivelMaximo)); } catch (err) {}
  }
  const titulo = document.getElementById('finTitulo');
  titulo.className = gana ? 'oro' : 'peligro';
  titulo.textContent = !gana ? '¡SIN BATERÍA!' : ultimo ? '¡ASCENDIDO!' : '¡NIVEL SUPERADO!';
  sonido(gana ? 'victoria' : 'derrota');
  medir(!gana ? 'sin_bateria' : ultimo ? 'juego_completado' : 'nivel_superado', { nivel: etiqueta(nivelActual), puntos: partida.puntos });
  let bonus = 0;
  if (gana) { bonus = PUNTOS.nivel + PUNTOS.porRaya * bateria; sumarPuntos(bonus); }
  document.getElementById('finTexto').textContent = !gana
    ? 'Bit se ha quedado sin batería en «' + NIVELES[nivelActual].nombre + '». Los virus siguen sueltos…'
    : ultimo ? 'Malware Smith ha caído: por fin, Bit recibe la Medalla al Honor y asciende a Sheriff Mayor de la Red. Mundo 2: próximamente.'
    : 'Nivel ' + etiqueta(nivelActual) + ' limpio: «' + NIVELES[nivelActual].nombre + '».';
  const teniente = TENIENTES[nivelActual];
  if (gana && teniente) document.getElementById('finTexto').textContent = 'Has detenido a ' + teniente.nombre + ', lugarteniente de Malware Smith. Nivel ' + etiqueta(nivelActual) + ' limpio.';
  pintarEstrellasFin(cerrarNivel(gana));
  document.getElementById('finMonedas').textContent = 'Monedas del nivel: ' + monedas + ' de ' + totalMonedas +
    (gana ? ' · Bonus: +' + bonus + ' (nivel ' + PUNTOS.nivel + ' + ' + bateria + ' × ' + PUNTOS.porRaya + ' por batería)' : '');
  document.getElementById('finPuntos').textContent = 'PUNTOS: ' + partida.puntos;
  document.getElementById('finMonedas').hidden = gana && ultimo;   // en el final, menos texto: que se vea el ascenso
  finDePartida = !gana || ultimo;
  const llamada = document.getElementById('finLlamada');
  const pulsa = window.PULSA_TXT || 'PULSA UNA TECLA';   // «TOCA LA PANTALLA» en móvil (tactil.js)
  llamada.textContent = !gana ? pulsa + ' PARA EMPEZAR UNA PARTIDA NUEVA EN ESTE NIVEL'
    : ultimo ? pulsa + ' PARA VOLVER AL MENÚ' : pulsa + ' PARA EL SIGUIENTE NIVEL';
  document.getElementById('rankingFin').hidden = true;
  document.getElementById('tipoRankingFin').hidden = true;
  document.getElementById('finPuesto').textContent = '';
  document.getElementById('arteFin').hidden = true;
  document.getElementById('finBotones').hidden = !finDePartida;
  panelFin.hidden = false;
  if (gana && ultimo) mostrarAscenso();
  if (finDePartida) {
    if (entraEnRanking(partida.puntos)) {
      esperandoNombre = true;
      llamada.hidden = true;
      formRanking.hidden = false;
      try { inputNombre.value = localStorage.getItem('bit-nombre') || ''; } catch (err) {}
      setTimeout(() => { inputNombre.focus(); inputNombre.select(); }, 50);
    } else {
      mostrarRankingFin(-1);
    }
  }
}

// Primera tecla/clic: música y empezar; en el inicio ← → eligen nivel; en los paneles de fin, continúa.
function alPulsar(accion) {
  musica.iniciar();
  if (estado === 'historia') { historia.avanzar(); return true; }
  if (estado === 'inicio') {
    if (accion === 'izq' || accion === 'der') { elegirNivel(accion === 'izq' ? -1 : 1); return true; }
    if (!panelRanking.hidden) { panelRanking.hidden = true; return true; }
    if (nivelElegido === 0 && !historia.vista()) historia.mostrar(() => nuevaPartida(0));
    else nuevaPartida(nivelElegido);
    return true;
  }
  if (estado === 'victoria' || estado === 'derrota') {
    if (esperandoNombre || tiempo - tiempoFin < 0.6) return true;
    if (estado === 'derrota') { nuevaPartida(nivelActual); return true; }
    if (nivelActual === NIVELES.length - 1) { irAlMenu(); return true; }
    nivelActual++;
    cargarNivel(nivelActual, false);   // la partida sigue: batería, mejora, monedas y puntos
    estado = 'jugando';
    panelFin.hidden = true;
    return true;
  }
  return false;
}
