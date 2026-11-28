// ==========================================================================
// TENIENTES — los 4 lugartenientes de Malware Smith, uno al final de cada zona (niveles 4, 8, 12 y 16).
// Aparecen solos al cargar el nivel, unas casillas antes de la medalla, y la dejan enjaulada hasta
// que caen (igual que el jefe). Cada uno ataca a su manera:
//   Troyano     (1-4)  caja que salta hacia Bit y suelta disparos a ras de suelo al caer.
//   Spambot     (1-8)  sobre que vuela y bombardea con correos basura; cada 4 s baja en picado.
//   Gusano      (1-12) se prepara, embiste a toda velocidad y se para en los bordes.
//   Ransomware  (1-16) candado blindado de frente; se abre para disparar y solo entonces es vulnerable.
// Usa: estado.js, fisica.js, graficos.js (dibujoPixel), enemigos.js, configuracion.js.
// ==========================================================================

const TENIENTES = {
  3:  { id: 'troyano',    nombre: 'TROYANO',    vida: 10,  w: 20, h: 16 },
  7:  { id: 'spambot',    nombre: 'SPAMBOT',    vida: 10, w: 20, h: 14 },
  11: { id: 'gusano',     nombre: 'GUSANO',     vida: 14, w: 30, h: 10 },
  15: { id: 'ransomware', nombre: 'RANSOMWARE', vida: 14, w: 20, h: 19 },
};

const IMG_TENIENTE = {
  troyano: [0, 1].map(k => dibujoPixel([
    '......F......F......',
    '.......F....F.......',
    '........FFFF........',
    'DDDDDDDDDFFDDDDDDDDD',
    'DCDDDDDDDFFDDDDDDDCD',
    'DDDDDDDDDFFDDDDDDDDD',
    'FFFFFFFFFFFFFFFFFFFF',
    'DDDDDDDDDFFDDDDDDDDD',
    'DDDNNNDDDFFDDDNNNDDD',
    'DDDNENDDDFFDDDNENDDD',
    'DDDNNNDDDFFDDDNNNDDD',
    'DDDDDDDDDFFDDDDDDDDD',
    'DDDDNNNNNNNNNNNNDDDD',
    'DDDDNCNCNCNCNCNCDDDD',
    'DDDDDDDDDFFDDDDDDDDD',
    'TTTTTTTTTTTTTTTTTTTT',
  ], { E: k ? PAL.crema : PAL.fucsia })),
  spambot: [0, 1].map(k => dibujoPixel([
    k ? '....................' : 'A..................A',
    k ? 'AA................AA' : 'AA................AA',
    k ? '.AAA.CCCCCCCCCC.AAA.' : '.AAA.CCCCCCCCCC.AAA.',
    k ? 'AA.ACCCCCCCCCCCCA.AA' : '...ACCCCCCCCCCCCA...',
    '...CFCCCCCCCCCCFC...',
    '...CCFCCCCCCCCFCC...',
    '...CCCFFCCCCFFCCC...',
    '...CCCCCFFFFCCCCC...',
    '...CCNNCCCCCCNNCC...',
    '...CCNECCCCCCENCC...',
    '...CCCCCCCCCCCCCC...',
    '...CCCCNNNNNNCCCC...',
    '...CCCCCCCCCCCCCC...',
    '....GGGGGGGGGGGG....',
  ], { E: PAL.fucsia })),
  gusano: [0, 1].map(k => dibujoPixel([
    '..VVVVVV..',
    '.VVVVVVVV.',
    'VVCCVVCCVV',
    'VVCNVVCNVV',
    'VVVVVVVVVV',
    k ? 'VFFFFFFFFV' : 'VVVVVVVVVV',
    k ? 'VFCFCFCFFV' : 'VFFFFFFFFV',
    'VVVVVVVVVV',
    '.OOOOOOOO.',
    '..O....O..',
  ])),
  ransomware: [0, 1].map(abierto => dibujoPixel([
    abierto ? '..GGGGGGGG..........' : '......GGGGGGGG......',
    abierto ? '.GG......GG.........' : '.....GG......GG.....',
    abierto ? 'GG........GG........' : '....GG........GG....',
    abierto ? 'G..........G........' : '....G..........G....',
    abierto ? 'G...................' : '....G..........G....',
    '....G..........G....',
    '..DDDDDDDDDDDDDDDD..',
    '..DKKKKKKKKKKKKKKD..',
    '..DKRRKKKKKKKKRRKD..',
    '..DKREKKKKKKKKERKD..',
    '..DKKKKKKKKKKKKKKD..',
    '..DKKKKKKDDKKKKKKD..',
    '..DKKKKKKDDKKKKKKD..',
    '..DKKKKKKKDKKKKKKD..',
    '..DKKKKKKKDKKKKKKD..',
    '..DKFFFFFFFFFFFFKD..',
    '..DKKKKKKKKKKKKKKD..',
    '..DDDDDDDDDDDDDDDD..',
    '...P............P...',
  ], { E: abierto ? PAL.crema : PAL.rojoVivo, R: abierto ? PAL.lima : PAL.rojo })),
};

// Coloca al teniente del nivel (si lo tiene) en el tramo de suelo antes de la medalla
function prepararTeniente(indice) {
  const datos = TENIENTES[indice];
  if (!datos || opcionesPrueba.sinEnemigos) return;
  let mc = -1, mf = -1;
  for (let f = 0; f < filas; f++) { const c = mapa[f].indexOf(MEDALLA); if (c >= 0) { mc = c; mf = f; } }
  if (mc < 0) return;
  const c = mc - 5, suelo = (mf + 1) * T;
  const e = { tipo: 'teniente', id: datos.id, nombre: datos.nombre, vida: datos.vida, vidaMax: datos.vida, golpe: 0,
    w: datos.w, h: datos.h, x: c * T - datos.w / 2, y: suelo - datos.h, activo: false,
    vx: 0, vy: 0, enSuelo: true, espera: 1.0, fase: 0, abierto: false, t: 0, limites: [(mc - 8) * T, mc * T] };
  e.x0 = e.x; e.y0 = e.y;
  if (e.id === 'spambot') { e.y = e.y0 = suelo - 48; }
  enemigos.push(e);
}

function balaTeniente(e, ang, vel, extra = {}) {
  proyectiles.push({ deBit: false, grande: true, x: e.x + e.w / 2 - 2, y: e.y + e.h / 2 - 2, w: 5, h: 5,
    vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel, ...extra });
}

function pasoTeniente(e, dt, dx, dy) {
  e.t += dt;
  if (!e.activo) {
    if (Math.abs(dx) < 170 && Math.abs(dy) < 80) {
      e.activo = true;
      mostrarAviso('¡' + e.nombre + '! LUGARTENIENTE DE MALWARE SMITH', 2.2);
      sonido('jefe'); sacudir(0.3, 3);
    }
    return;
  }
  const hacia = Math.sign(dx) || 1;
  if (e.id === 'troyano') {
    // salta hacia Bit; al caer, dos disparos rasantes a cada lado
    e.vy = Math.min(e.vy + FISICA.gravedad * dt, FISICA.caidaMax);
    const enAire = !e.enSuelo;
    moverX(e, e.vx * dt); moverY(e, e.vy * dt);
    e.x = Math.max(e.limites[0], Math.min(e.limites[1] - e.w, e.x));
    if (enAire && e.enSuelo) {
      e.vx = 0; sacudir(0.15, 2); polvo(e.x + e.w / 2, e.y + e.h, 8); sonido('impacto');
      for (const s of [-1, 1]) proyectiles.push({ deBit: false, x: e.x + e.w / 2, y: e.y + e.h - 5, w: 4, h: 4, vx: s * 110 });
    }
    if (e.enSuelo) {
      e.espera -= dt;
      if (e.espera <= 0) { e.vy = -270; e.vx = hacia * 70; e.enSuelo = false; e.espera = 1.5; }
    }
  } else if (e.id === 'spambot') {
    // vuela de lado a lado y suelta correos basura que caen; cada 4 s baja en picado casi al suelo
    // (ahí se le puede disparar sin saltar, pero también embiste)
    const ciclo = e.t % 6, abajo = e.y0 + 30;
    const baja = ciclo < 4 ? 0 : ciclo < 4.5 ? (ciclo - 4) / 0.5 : ciclo < 5.5 ? 1 : 1 - (ciclo - 5.5) / 0.5;
    e.picado = baja > 0.9;
    e.x = e.x0 + Math.sin(e.t * 1.1) * 56;
    e.y = e.y0 + (abajo - e.y0) * baja + (baja ? 0 : Math.sin(e.t * 3) * 5);
    e.espera -= dt;
    if (e.espera <= 0 && baja === 0) {
      e.espera = 1.3;
      for (const k of [-1, 0, 1]) proyectiles.push({ deBit: false, spam: true, x: e.x + e.w / 2 - 3 + k * 6, y: e.y + e.h, w: 6, h: 4, vx: k * 30, vy: 10, g: 260 });
      sonido('disparo');
    }
  } else if (e.id === 'gusano') {
    // fases: 0 esperar, 1 prepararse (tiembla), 2 embestir
    if (e.fase === 0) { e.espera -= dt; if (e.espera <= 0) { e.fase = 1; e.espera = 0.55; e.dir = hacia; } }
    else if (e.fase === 1) { e.espera -= dt; if (e.espera <= 0) { e.fase = 2; sonido('teleporte'); } }
    else {
      e.x += e.dir * 170 * dt;
      if (e.x <= e.limites[0] || e.x + e.w >= e.limites[1]) {
        e.x = Math.max(e.limites[0], Math.min(e.limites[1] - e.w, e.x));
        e.fase = 0; e.espera = 0.9; sacudir(0.2, 3); sonido('impacto');
      }
    }
  } else if (e.id === 'ransomware') {
    // cerrado (blindado de frente) 2,4 s; abierto 1,4 s disparando en abanico hacia Bit
    e.y = e.y0 - 4 + Math.sin(e.t * 2) * 3;
    e.mira = hacia;
    e.espera -= dt;
    if (e.espera <= 0) {
      e.abierto = !e.abierto;
      e.espera = e.abierto ? 1.4 : 2.4;
      if (e.abierto) {
        const ang = Math.atan2(dy, dx);
        for (const k of [-0.35, -0.17, 0, 0.17, 0.35]) balaTeniente(e, ang + k, 110);
        sonido('fase2');
      }
    }
  }
}

// ¿Para este golpe? El ransomware cerrado para los disparos de frente (no el láser ni la espada)
function tenienteBloquea(e, velProyectil) {
  return e.id === 'ransomware' && !e.abierto && velProyectil !== null && Math.sign(velProyectil) === -Math.sign(e.mira || 1);
}

function dibujarTeniente(e, x, y) {
  const imgs = IMG_TENIENTE[e.id];
  if (e.id === 'troyano') dibujarImagen(imgs[e.enSuelo && e.espera < 0.35 ? 1 : 0], x, y, false);
  else if (e.id === 'spambot') dibujarImagen(imgs[Math.floor(tiempo * 8) % 2], x, y, false);
  else if (e.id === 'gusano') {
    const temblor = e.fase === 1 ? Math.round(Math.sin(tiempo * 60)) : 0;
    const mira = e.fase === 0 ? Math.sign(bit.x - e.x) || 1 : e.dir;
    // cuerpo: 4 segmentos que ondulan detrás de la cabeza
    for (let k = 3; k >= 0; k--) {
      const sx = mira > 0 ? x + 15 - k * 5 : x + 10 + k * 5, sy = y + 3 + Math.round(Math.sin(tiempo * 12 - k) * 1.5);
      ctx.fillStyle = k % 2 ? PAL.violetaOscuro : PAL.violeta; ctx.fillRect(sx + temblor, sy, 6, 6);
    }
    dibujarImagen(imgs[e.fase === 2 ? 1 : 0], (mira > 0 ? x + 20 : x) + temblor, y, mira < 0);
  } else if (e.id === 'ransomware') dibujarImagen(imgs[e.abierto ? 1 : 0], x, y, false);
}
