// ==========================================================================
// ENEMIGOS — cómo nacen, se mueven, atacan y reciben daño.
// - crearEnemigo(): convierte una letra del mapa en un enemigo con sus valores.
// - pasoEnemigos(): el comportamiento de cada tipo (patrullero, blindado, torretas, volador,
//   saltador, cazador) y del jefe (pasoJefe / colaJefe).
// - pasoProyectiles(): balas de Bit y de los enemigos.
// - danarEnemigo(): daño, escudo frontal del blindado, puntos y fase 2 del jefe.
// Usa: estado.js, fisica.js, configuracion.js; llama a herir() (bit.js) y sumarPuntos() (partida.js).
// ==========================================================================

function crearEnemigo(tipo, c, f, d) {
  const E = ENEMIGOS[tipo], vel = 1 + 0.6 * d, cad = Math.max(0.45, 1 - 0.35 * d);
  const suelo = (w, h) => ({ x: c * T + (T - w) / 2, y: f * T + T - h, w, h });
  // Con dificultad mayor que 1 (niveles 12-19) los enemigos aguantan un golpe más
  const base = { tipo, vida: E.vida + (d > 1 && tipo !== 'jefe' ? 1 : 0), golpe: 0 };
  switch (tipo) {
    case 'patrullero': return { ...base, ...suelo(12, 12), vx: E.vel * vel };
    case 'blindado':   return { ...base, ...suelo(12, 12), vx: -E.vel * vel };
    case 'torreta':    return { ...base, ...suelo(14, 14), mira: -1, recarga: 0.8, cadencia: E.cadencia * cad, velBala: E.velBala * (1 + 0.4 * d) };
    case 'rafaga':     return { ...base, ...suelo(14, 14), mira: -1, recarga: 1.0, cadencia: E.cadencia * cad, velBala: E.velBala * (1 + 0.4 * d), cola: 0, colaT: 0 };
    case 'volador':    return { ...base, x: c * T + 2, y: f * T + 3, w: 12, h: 10, x0: c * T + 2, y0: f * T + 3, vx: E.vel * vel, fase: c };
    case 'saltador':   return { ...base, ...suelo(12, 12), vx: 0, vy: 0, enSuelo: false, espera: E.espera, esperaMax: E.espera * cad, velSalto: E.vel * (1 + 0.3 * d) };
    case 'cazador':    return { ...base, x: c * T + 2, y: f * T + 2, w: 12, h: 11, vx: 0, vy: 0, vel: E.vel * (1 + 0.4 * d), visto: false };
    case 'jefe':       return { ...base, x: c * T - 8, y: f * T - 8, w: 32, h: 24, x0: c * T - 8, y0: f * T - 8, vidaMax: E.vida,
                                recarga: 1.2, patron: 0, activo: false, fase2: false };
  }
}

function danarEnemigo(e, dano, velProyectil) {
  // El blindado para de frente los proyectiles (no el láser ni la espada)
  if (e.tipo === 'blindado' && velProyectil !== null && Math.sign(velProyectil) === -Math.sign(e.vx)) {
    estallido(e.vx > 0 ? e.x + e.w : e.x, e.y + 6, PAL.crema, 5, 50);
    sonido('bloqueo');
    return false;
  }
  if (e.tipo === 'teniente' && tenienteBloquea(e, velProyectil)) {
    estallido(e.mira > 0 ? e.x + e.w : e.x, e.y + 10, PAL.dorado, 5, 50);
    sonido('bloqueo');
    return false;
  }
  e.vida -= dano;
  e.golpe = 0.15;
  if (e.tipo === 'blindado') e.vx = Math.abs(e.vx) * Math.sign(bit.x - e.x || 1);   // se gira hacia Bit
  if (e.tipo === 'jefe' && !e.fase2 && e.vida <= e.vidaMax / 2) { e.fase2 = true; mostrarAviso('¡FASE 2!', 1.4); sacudir(0.4, 4); sonido('fase2'); destellar(0.15, PAL.rojoVivo); }
  if (e.tipo === 'jefe' && e.vida <= 0) {
    for (let k = 0; k < 4; k++) estallido(e.x + Math.random() * e.w, e.y + Math.random() * e.h, [PAL.fucsia, PAL.dorado, PAL.crema, PAL.cian][k], 20, 110);
    sacudir(0.9, 6); congelar(0.3); destellar(0.3); sonido('explosion'); vibrar(700, 1); mostrarAviso('¡MALWARE SMITH DERROTADO!', 2.2);
  }
  if (e.vida > 0) sonido('impacto');
  if (e.vida <= 0) {
    if (e.tipo === 'teniente') {
      for (let k = 0; k < 3; k++) estallido(e.x + Math.random() * e.w, e.y + Math.random() * e.h, [PAL.dorado, PAL.fucsia, PAL.crema][k], 18, 100);
      sonido('explosion'); congelar(0.25); sacudir(0.6, 5); destellar(0.2); vibrar(400, 0.9);
      mostrarAviso('¡' + e.nombre + ' DETENIDO!', 2.2);
    } else if (e.tipo !== 'jefe') { sonido('muere'); congelar(0.045); sacudir(0.1, 2); vibrar(50, 0.3); soltarMejora(e); }
    restos(e.x + e.w / 2, e.y + e.h / 2);
    sumarPuntos(PUNTOS[e.tipo] || 100, e.x + e.w / 2 - 6, e.y - 4);
    estallido(e.x + e.w / 2, e.y + e.h / 2, PAL.fucsia, 12, 70);
    estallido(e.x + e.w / 2, e.y + e.h / 2, PAL.crema, 6, 40);
  }
  return true;
}

function dispararEnemigo(e, vel) {
  proyectiles.push({ deBit: false, x: e.mira < 0 ? e.x - 4 : e.x + e.w, y: e.y + 4, w: 4, h: 4, vx: e.mira * vel });
}

// Mejora que suelta un virus al morir: cae hasta el suelo que tenga debajo (si hay hueco, se queda en el aire)
function soltarMejora(e) {
  if (Math.random() >= DROP.probabilidad) return;
  const tipos = Object.keys(LETRA_MEJORA).filter(t => t !== mejora);
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  const c = Math.floor((e.x + e.w / 2) / T);
  let f = Math.floor((e.y + e.h / 2) / T);
  if (c < 0 || c >= cols || f < 0 || f >= filas || casilla(c, f) !== AIRE) return;
  let g = f;
  while (g + 1 < filas && casilla(c, g + 1) === AIRE) g++;
  if (g + 1 < filas && esSolida(c, g + 1)) f = g;   // apoyada en el suelo
  mapa[f][c] = LETRA_MEJORA[tipo];
  estallido(c * T + 8, f * T + 8, COLOR_OBJETO[LETRA_MEJORA[tipo]], 14, 60);
  textos.push({ txt: '+', x: c * T + 6, y: f * T - 4, t: 0 });
  sonido('soltar');
}

const hayJefe = () => enemigos.some(e => e.tipo === 'jefe' || e.tipo === 'teniente');   // la medalla queda enjaulada

// Malware Smith: flota de lado a lado y alterna tres ataques; en la fase 2 va más rápido
function pasoJefe(e, dt, dx, dy) {
  const J = ENEMIGOS.jefe, rapidez = e.fase2 ? 1.6 : 1;
  e.x = e.x0 + Math.sin(tiempo * 0.8 * rapidez) * J.recorrido;
  e.y = e.y0 + Math.sin(tiempo * 2) * 4;
  if (!e.activo && Math.abs(dx) < J.alcance) { e.activo = true; mostrarAviso('¡MALWARE SMITH!', 1.6); sonido('jefe'); sacudir(0.3, 3); }
  if (!e.activo) return;
  e.recarga -= dt * rapidez;
  if (e.recarga > 0) return;
  const ox = e.x + 16, oy = e.y + 11, ang = Math.atan2(dy + 4, dx);
  const bala = (a, vel) => proyectiles.push({ deBit: false, grande: true, x: ox - 2, y: oy - 2, w: 5, h: 5,
    vx: Math.cos(a) * vel, vy: Math.sin(a) * vel });
  if (e.patron === 0) for (const k of [-0.25, 0, 0.25]) bala(ang + k, J.velBala);
  else if (e.patron === 1) for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) bala(ang + k, J.velBala * 0.8);
  else { e.cola = e.fase2 ? 6 : 4; e.colaT = 0; }
  e.patron = (e.patron + 1) % 3;
  e.recarga = J.cadencia;
}
function colaJefe(e, dt) {   // ráfaga recta y rápida del tercer ataque
  if (!(e.cola > 0)) return;
  e.colaT -= dt;
  if (e.colaT > 0) return;
  const dx = bit.x + bit.w / 2 - (e.x + 16), dy = bit.y + 8 - (e.y + 11), ang = Math.atan2(dy, dx);
  proyectiles.push({ deBit: false, grande: true, x: e.x + 14, y: e.y + 9, w: 5, h: 5, vx: Math.cos(ang) * 150, vy: Math.sin(ang) * 150 });
  e.cola--; e.colaT = 0.12;
}

function pasoEnemigos(dt) {
  const cbx = bit.x + bit.w / 2, cby = bit.y + bit.h / 2;
  for (const e of enemigos) {
    if (e.golpe > 0) e.golpe -= dt;
    const dx = cbx - (e.x + e.w / 2), dy = cby - (e.y + e.h / 2);

    if (e.tipo === 'patrullero' || e.tipo === 'blindado') {
      const frente = e.vx > 0 ? e.x + e.w : e.x - 1;
      const c = Math.floor(frente / T);
      const fCuerpo = Math.floor((e.y + e.h - 1) / T), fPies = fCuerpo + 1;
      if (esSolida(c, fCuerpo) || !esSolida(c, fPies) || casilla(c, fCuerpo) === PINCHOS) e.vx = -e.vx;
      else e.x += e.vx * dt;
    } else if (e.tipo === 'torreta' || e.tipo === 'rafaga') {
      const E = ENEMIGOS[e.tipo];
      e.mira = dx < 0 ? -1 : 1;
      if (Math.abs(dx) < E.alcanceX && Math.abs(dy) < E.alcanceY) {
        e.recarga -= dt;
        if (e.recarga <= 0) {
          if (e.tipo === 'rafaga') { e.cola = E.balas; e.colaT = 0; }
          else dispararEnemigo(e, e.velBala);
          e.recarga = e.cadencia;
        }
      } else {
        e.recarga = Math.max(e.recarga, 0.8);
      }
      if (e.cola > 0) {
        e.colaT -= dt;
        if (e.colaT <= 0) { dispararEnemigo(e, e.velBala); e.cola--; e.colaT = 0.14; }
      }
    } else if (e.tipo === 'volador') {
      e.x += e.vx * dt;
      if (Math.abs(e.x - e.x0) > ENEMIGOS.volador.recorrido) { e.x = e.x0 + Math.sign(e.x - e.x0) * ENEMIGOS.volador.recorrido; e.vx = -e.vx; }
      e.y = e.y0 + Math.sin(tiempo * 3 + e.fase) * 6;
    } else if (e.tipo === 'saltador') {
      if (e.enSuelo) {
        e.vx = 0;
        e.espera -= dt;
        if (e.espera <= 0 && Math.abs(dx) < ENEMIGOS.saltador.alcance) {
          e.vy = -ENEMIGOS.saltador.salto;
          e.vx = Math.sign(dx) * e.velSalto;
          e.espera = e.esperaMax;
        }
      }
      e.vy = Math.min(e.vy + FISICA.gravedad * dt, FISICA.caidaMax);
      moverX(e, e.vx * dt);
      moverY(e, e.vy * dt);
      if (e.y > filas * T + 40) e.vida = 0;
    } else if (e.tipo === 'cazador') {
      // vuela hacia Bit cuando lo ve (atraviesa paredes)
      if (!e.visto && Math.hypot(dx, dy) < ENEMIGOS.cazador.alcance) e.visto = true;
      if (e.visto) {
        const dist = Math.hypot(dx, dy) || 1;
        e.vx += (dx / dist * e.vel - e.vx) * Math.min(1, dt * 2);
        e.vy += (dy / dist * e.vel - e.vy) * Math.min(1, dt * 2);
        e.x += e.vx * dt; e.y += e.vy * dt;
      } else {
        e.y += Math.sin(tiempo * 4 + e.x) * 0.2;
      }
    } else if (e.tipo === 'jefe') {
      pasoJefe(e, dt, dx, dy);
      colaJefe(e, dt);
    } else if (e.tipo === 'teniente') {
      pasoTeniente(e, dt, dx, dy);
    }

    if (e.vida > 0 && solapan(bit, e.x + 1, e.y + 2, e.w - 2, e.h - 2)) herir(e.x + e.w / 2);
    if (estado !== 'jugando') return;
  }
}

function pasoProyectiles(dt) {
  for (const p of proyectiles) {
    if (p.fuera) continue;
    p.x += p.vx * dt;
    if (p.vy) p.y += p.vy * dt;
    if (p.g) p.vy += p.g * dt;   // correos basura del Spambot: caen
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    if (esSolida(Math.floor(cx / T), Math.floor(cy / T)) || cx < camX - 40 || cx > camX + ANCHO + 40 || cy > filas * T + 20 || cy < -60) {
      p.fuera = true;
      if (esSolida(Math.floor(cx / T), Math.floor(cy / T))) estallido(cx, cy, p.deBit ? p.color : PAL.fucsia, 3, 30);
      continue;
    }
    if (p.deBit) {
      for (const e of enemigos)
        if (e.vida > 0 && solapan(p, e.x, e.y, e.w, e.h)) { p.fuera = true; danarEnemigo(e, p.dano, p.vx); break; }
    } else if (bit.parpadeo <= 0 && solapan(bit, p.x, p.y, p.w, p.h)) {
      p.fuera = true;
      herir(p.x + p.w / 2);
      if (estado !== 'jugando') return;
    }
  }
  proyectiles = proyectiles.filter(p => !p.fuera);
  enemigos = enemigos.filter(e => e.vida > 0);
}
