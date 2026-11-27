// ==========================================================================
// BIT — el personaje: mejoras, daño, ataques y movimiento.
// - aplicarMejora / perderMejora: cambian la skin y el arma.
// - herir(): qué pasa al recibir un golpe (escudo, mejoras que protegen, batería, −10 monedas).
// - teletransportar(), atacar(), lanzarRayo(), tajo de espada.
// - pasoBit(): movimiento, salto, ataques, recoger monedas/objetos, pinchos, medalla y caídas.
// Usa: estado.js, fisica.js, controles.js, configuracion.js.
// ==========================================================================

function aplicarMejora(tipo) {
  mejora = tipo;
  golpesEscudo = 0;
  bit.arma = tipo === 'espada' ? 'espada' : 'disparo';
  bit.rafaga = 0;
  estallido(bit.x + bit.w / 2, bit.y + 8, COLOR_OBJETO[LETRA_MEJORA[tipo]], 14);
  pintarMejora();
  mostrarAviso(NOMBRE_MEJORA[tipo] + '!');
}
function perderMejora() {
  estallido(bit.x + bit.w / 2, bit.y + 8, COLOR_OBJETO[LETRA_MEJORA[mejora]], 18);
  mostrarAviso('MEJORA PERDIDA', 1.2);
  mejora = null; golpesEscudo = 0;
  bit.arma = 'disparo'; bit.rafaga = 0; bit.tajo = null;
  pintarMejora();
}

// Golpe a Bit. desdeX = de dónde viene (para el empujón); forzado = aunque esté parpadeando (caídas)
function herir(desdeX, forzado) {
  const j = bit;
  if (estado !== 'jugando' || (j.parpadeo > 0 && !forzado)) return;
  let gastar = true;
  if (mejora === 'escudo') {
    golpesEscudo++;
    gastar = false;   // su fuerte: ningún golpe gasta batería mientras dure
    estallido(j.x + j.w / 2, j.y + 8, PAL.cian, 8);
    if (golpesEscudo >= ESCUDO.golpesMax) perderMejora();
    else pintarMejora();
  } else if (mejora) {
    perderMejora();   // enchufe, láser y espada se pierden pero protegen la batería
    gastar = false;
  }
  if (gastar) {
    bateria--;
    pintarBateria(true);
    if (partida.monedas > 0) {
      const perdidas = Math.min(partida.monedas, MONEDAS.perdidaPorBateria);
      partida.monedas -= perdidas;
      textos.push({ txt: '-' + perdidas, x: j.x, y: j.y - 6, t: 0, malo: true });
      actualizarContador();
    }
    if (bateria <= 0) { terminar(false); return; }
  }
  temblor = 0.15;
  j.parpadeo = INVENCIBLE;
  if (desdeX !== null) {
    j.vy = -200; j.saltando = false; j.enSuelo = false;
    j.vx = (j.x + j.w / 2 < desdeX ? -1 : 1) * 120;
  }
}

// Doble toque de dirección con la espada frame → teletransporte
function registrarToque(accion) {
  if (accion !== 'izq' && accion !== 'der') return;
  const ahora = performance.now() / 1000;
  if (estado === 'jugando' && mejora === 'espada' && ultimoToque.accion === accion && ahora - ultimoToque.t < TELETRANSPORTE.ventana) {
    teletransportar(accion === 'der' ? 1 : -1);
    ultimoToque = { accion: null, t: 0 };
  } else {
    ultimoToque = { accion, t: ahora };
  }
}
function teletransportar(dir) {
  const j = bit;
  if (j.tpRecarga > 0 || ajustesAbiertos()) return;
  fantasmas.push({ x: j.x, y: j.y, fotograma: j.fotograma, mira: j.mira, t: 0 });
  estallido(j.x + j.w / 2, j.y + 8, PAL.violeta, 12, 40);
  let resto = TELETRANSPORTE.distancia;
  while (resto > 0) {   // avanza a pasos cortos para no atravesar paredes
    const d = Math.min(4, resto);
    if (moverX(j, dir * d)) break;
    resto -= d;
  }
  j.mira = dir;
  j.tpRecarga = TELETRANSPORTE.recarga;
  estallido(j.x + j.w / 2, j.y + 8, PAL.violeta, 16, 70);
  estallido(j.x + j.w / 2, j.y + 8, PAL.crema, 6, 40);
}

function disparar(color, vel, extra = {}) {
  const j = bit;
  proyectiles.push({ deBit: true, x: j.mira > 0 ? j.x + j.w : j.x - 6, y: j.y + 7, w: 6, h: 3,
    vx: j.mira * vel, color, dano: 1, ...extra });
}

function atacar() {
  const j = bit;
  if (j.recarga > 0) return;
  if (j.arma === 'espada') {
    j.tajo = { t: 0, golpeados: new Set() };
    j.recarga = ARMAS.espada.recarga;
  } else if (mejora === 'laser') {
    lanzarRayo();
    j.recarga = ARMAS.laser.recarga;
  } else if (mejora === 'enchufe') {
    j.rafaga = ARMAS.enchufe.balas; j.rafagaT = 0;
    j.recarga = ARMAS.enchufe.recarga;
  } else if (proyectiles.filter(p => p.deBit).length < ARMAS.normal.maxEnPantalla) {
    disparar(PAL.lima, ARMAS.normal.vel);
    j.recarga = ARMAS.normal.recarga;
  }
}

function lanzarRayo() {
  const j = bit, dir = j.mira, y = j.y + 7;
  const x0 = dir > 0 ? j.x + j.w + 6 : j.x - 6;
  let x1 = x0, recorrido = 0;
  while (recorrido < ARMAS.laser.alcance && !esSolida(Math.floor(x1 / T), Math.floor(y / T))) { x1 += dir * 2; recorrido += 2; }
  const izq = Math.min(x0, x1), ancho = Math.abs(x1 - x0);
  const franja = { x: izq, y: y - 3, w: ancho, h: 7 };
  for (const e of enemigos) if (e.vida > 0 && solapan(franja, e.x, e.y, e.w, e.h)) danarEnemigo(e, ARMAS.laser.dano, null);
  for (const p of proyectiles) if (!p.deBit && solapan(franja, p.x, p.y, p.w, p.h)) { p.fuera = true; estallido(p.x, p.y, PAL.cian, 4); }
  rayos.push({ x0, x1, y, t: 0 });
  estallido(x1, y, PAL.cian, 10, 80);
  estallido(x1, y, PAL.crema, 5, 50);
  temblor = 0.12;
}

function cajaTajo() {
  const j = bit;
  return j.mira > 0 ? { x: j.x + j.w - 2, y: j.y - 8, w: 22, h: 24 } : { x: j.x - 20, y: j.y - 8, w: 22, h: 24 };
}

function pasoBit(dt) {
  const j = bit;
  const dir = (pulsadas.has('der') ? 1 : 0) - (pulsadas.has('izq') ? 1 : 0);

  if (dir) {
    j.vx += dir * (j.enSuelo ? FISICA.acel : FISICA.acelAire) * dt;
    j.vx = Math.max(-FISICA.velMax, Math.min(FISICA.velMax, j.vx));
    j.mira = dir;
  } else {
    const fr = (j.enSuelo ? FISICA.frenado : FISICA.acelAire * 0.5) * dt;
    j.vx = Math.abs(j.vx) <= fr ? 0 : j.vx - Math.sign(j.vx) * fr;
  }

  if (pedidas.has('saltar') && j.enSuelo) { j.vy = -FISICA.salto; j.enSuelo = false; j.saltando = true; }
  if (j.saltando && !pulsadas.has('saltar') && j.vy < -FISICA.cortarSalto) j.vy = -FISICA.cortarSalto;
  if (j.vy >= 0) j.saltando = false;

  // Cambiar de arma (solo con la espada frame)
  if (pedidas.has('cambiarArma')) {
    if (mejora === 'espada') {
      j.arma = j.arma === 'espada' ? 'disparo' : 'espada';
      j.tajo = null;
      mostrarAviso('ARMA: ' + (j.arma === 'espada' ? 'ESPADA' : 'DISPARO'), 1);
      pintarMejora();
    }
  }

  // Ataque: un toque ataca; si lo mantienes, repite
  j.recarga -= dt;
  j.tpRecarga -= dt;
  if (pedidas.has('disparar') || pulsadas.has('disparar')) atacar();
  if (j.rafaga > 0) {
    j.rafagaT -= dt;
    if (j.rafagaT <= 0) { disparar(PAL.rojoVivo, ARMAS.enchufe.vel, { w: 7 }); j.rafaga--; j.rafagaT = ARMAS.enchufe.entreBalas; }
  }

  j.vy = Math.min(j.vy + FISICA.gravedad * dt, FISICA.caidaMax);
  moverX(j, j.vx * dt);
  moverY(j, j.vy * dt);
  if (j.enSuelo) j.seguro = { x: j.x, y: j.y };

  // Tajo de espada: golpea a cada enemigo una vez y deshace balas enemigas
  if (j.tajo) {
    j.tajo.t += dt;
    if (j.tajo.t < 0.18) {
      const caja = cajaTajo();
      for (const e of enemigos)
        if (e.vida > 0 && !j.tajo.golpeados.has(e) && solapan(caja, e.x, e.y, e.w, e.h)) {
          j.tajo.golpeados.add(e);
          danarEnemigo(e, ARMAS.espada.dano, null);
        }
      for (const p of proyectiles)
        if (!p.deBit && solapan(caja, p.x, p.y, p.w, p.h)) { p.fuera = true; estallido(p.x, p.y, PAL.violeta, 5); }
    }
    if (j.tajo.t >= ARMAS.espada.duracion) j.tajo = null;
  }

  // Casillas que toca: monedas, pinchos, objetos y medalla
  const c0 = Math.floor(j.x / T), c1 = Math.floor((j.x + j.w) / T);
  const f0 = Math.floor(j.y / T), f1 = Math.floor((j.y + j.h) / T);
  objetoCerca = null;
  for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) {
    const v = casilla(c, f), x = c * T, y = f * T;
    if (v === MONEDA && solapan(j, x + 4, y + 4, 8, 8)) {
      mapa[f][c] = AIRE; monedas++; sumarMoneda();
    } else if (v === PINCHOS && solapan(j, x + 2, y + 9, 12, 7)) {
      herir(x + 8);
    } else if (v === BATERIA_EXTRA && solapan(j, x + 2, y + 2, 12, 12)) {
      mapa[f][c] = AIRE;
      if (bateria < BATERIA.maxima) { bateria++; pintarBateria(false); mostrarAviso('+1 BATERÍA'); }
      else mostrarAviso('BATERÍA AL MÁXIMO');
      estallido(x + 8, y + 8, PAL.lima, 12);
    } else if (MEJORA_DE[v] && solapan(j, x + 2, y + 2, 12, 12)) {
      const tipo = MEJORA_DE[v];
      if (!mejora || mejora === tipo) {
        mapa[f][c] = AIRE;
        aplicarMejora(tipo);   // si es la misma, se renueva (el escudo vuelve a 4 golpes)
      } else {
        objetoCerca = { c, f, tipo };
      }
    } else if (v === MEDALLA && solapan(j, x + 3, y + 2, 10, 14)) {
      if (hayJefe()) { if (tiempo - avisoJaula > 2) { mostrarAviso('¡DERROTA AL ARCADE CORRUPTO!'); avisoJaula = tiempo; } }
      else { terminar(true); return; }
    }
    if (estado !== 'jugando') return;
  }

  // Cambiar de mejora: se deja la actual en el suelo y se coge la nueva
  if (objetoCerca) {
    if (pedidas.has('coger')) {
      const { c, f, tipo } = objetoCerca;
      mapa[f][c] = LETRA_MEJORA[mejora];
      aplicarMejora(tipo);
      objetoCerca = null;
    }
  }
  if (objetoCerca) {
    avisoCoger.innerHTML = '<b>' + escaparHTML(primeraDe('coger')) + '</b>: cambiar ' +
      NOMBRE_MEJORA[mejora] + ' por <b>' + NOMBRE_MEJORA[objetoCerca.tipo] + '</b>';
    avisoCoger.hidden = false;
  } else {
    avisoCoger.hidden = true;
  }

  // Caída al vacío: un golpe y vuelve al último sitio que pisó
  if (j.y > filas * T + 40) {
    herir(null, true);
    if (estado !== 'jugando') return;
    j.x = j.seguro.x; j.y = j.seguro.y; j.vx = 0; j.vy = 0;
    centrarCamara(1);
  }

  if (!j.enSuelo) j.fotograma = 2;
  else if (Math.abs(j.vx) > 5) { j.paso += Math.abs(j.vx) * dt / 7; j.fotograma = Math.floor(j.paso) % 8; }
  else { j.fotograma = 0; j.paso = 0; }

  if (j.parpadeo > 0) j.parpadeo -= dt;
}
