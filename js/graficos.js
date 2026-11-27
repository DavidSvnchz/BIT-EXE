// ==========================================================================
// GRÁFICOS — el lienzo, el pixel art y los fondos (se dibuja todo una vez al cargar).
// - Lienzo de 320×180 escalado a la ventana sin suavizar.
// - dibujoPixel(): convierte dibujos de texto (una letra = un color) en imágenes.
// - Skins de Bit: se crean recoloreando bit/bit-sprite.png (rojo, francotirador, acorazado, espada).
// - Sprites de objetos, enemigos, jefe y los 4 fotogramas del tajo de la espada.
// - Capas del fondo: estrellas, luna y dos filas de edificios.
// Usa: configuracion.js.
// ==========================================================================

// ============================================================
// LIENZO Y ESCALADO (pixel art: sin suavizado)
// ============================================================
const lienzo = document.getElementById('juego');
const ctx = lienzo.getContext('2d');
ctx.imageSmoothingEnabled = false;
const marco = document.getElementById('marco');

function ajustarTamano() {
  const exacta = Math.min(innerWidth / ANCHO, innerHeight / ALTO);
  const entera = Math.floor(exacta);
  const s = entera >= 1 && entera / exacta >= 0.85 ? entera : exacta;
  marco.style.width = ANCHO * s + 'px';
  marco.style.height = ALTO * s + 'px';
  marco.style.setProperty('--s', s);
}
addEventListener('resize', ajustarTamano);
ajustarTamano();

// ============================================================
// GRÁFICOS: sprite de Bit, skins, dibujos píxel a píxel y fondos
// ============================================================
function azar(semilla) {   // pseudoaleatorio con semilla
  return () => {
    semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
    let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function crearCapa(ancho, alto, dibujar) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  dibujar(c.getContext('2d'));
  return c;
}
// Dibujo de texto → imagen. Cada letra es un color; '.' es transparente.
const LETRAS = {
  D: PAL.dorado, C: PAL.crema, T: PAL.tinta2, L: PAL.lima, F: PAL.fucsia, N: PAL.noche, G: PAL.gris,
  A: PAL.cian, R: PAL.rojo, V: PAL.violeta, K: PAL.negro, P: PAL.acero, O: PAL.violetaOscuro
};
function dibujoPixel(filasTexto, extra = {}) {
  const colores = { ...LETRAS, ...extra };
  const ancho = filasTexto[0].length;
  filasTexto.forEach((f, i) => { if (f.length !== ancho) console.warn('Dibujo con filas desiguales', i, f); });
  return crearCapa(ancho, filasTexto.length, g => {
    filasTexto.forEach((fila, y) => [...fila].forEach((ch, x) => {
      if (colores[ch]) { g.fillStyle = colores[ch]; g.fillRect(x, y, 1, 1); }
    }));
  });
}
function dibujarImagen(img, x, y, voltear) {
  if (!voltear) { ctx.drawImage(img, x, y); return; }
  ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0); ctx.restore();
}

// --- Bit y sus skins -------------------------------------------------
// Las skins se crean cambiando los colores del sprite original píxel a píxel.
const SKINS = {
  normal: null,
  rojo: {        // enchufe
    cambios: { C8F135: PAL.rojo, FF3D7F: PAL.dorado, '33D6E6': PAL.dorado, FFC43D: PAL.crema, '2C264A': PAL.rojoOscuro }
  },
  francotirador: {   // cañón láser
    cambios: { C8F135: PAL.cian, '33D6E6': PAL.rojoVivo, FF3D7F: PAL.crema, '2C264A': PAL.tinta, FFC43D: PAL.rojoVivo }
  },
  acorazado: {   // campo de fuerza: cuerpo más grueso (contorno de acero alrededor del cuerpo)
    cambios: { C8F135: PAL.gris, '2C264A': PAL.acero, FF3D7F: PAL.dorado },
    engordar: { color: 'C8F135', relleno: PAL.acero }
  },
  espada: {      // espada frame: negro, ojos rojos, contorno violeta
    cambios: { C8F135: PAL.negro, '0A0812': '#2A0F3A', '33D6E6': PAL.rojoVivo, FF3D7F: PAL.violeta, FFC43D: PAL.rojoVivo, '2C264A': '#1A1022' },
    contorno: PAL.violeta
  }
};
const SKIN_DE_MEJORA = { enchufe: 'rojo', laser: 'francotirador', escudo: 'acorazado', espada: 'espada' };
const hojas = {};          // nombre de skin → imagen de 192×24
let altoCabeza = [4, 3, 2, 3, 4, 3, 2, 3];   // fila superior de cada fotograma (se recalcula)

const SPRITE_RESPALDO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAYCAYAAACssfJFAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAAAAAAAAPlDu38AAAAHdElNRQfqCxsAFCcAZxH1AAACJklEQVR42u2bMU7DMBSGHZSNgQlxgE5ITEiWGMjCiDgGK2eoegZWzsHYpQxBlTohMXGAiikDsxlQkOu6jh2/Zz8379+SOH6fP7ttkrZCcDgcDodz9FHNXOVmmHIo+q9yA+hRb42qblcoTG0nd+TfnK3B62Dyp8gU/Qc1Vs1cVatFcYLaTiqzP9s+qvx92D88vzdAqYJMbjNQNahOcG5+6v69ipcqqO2kurv4crZZbmfRNbD49RrsH4e/9i1gKxQ7CT6CICb6cvMhhBDi8/rKuk2Zn/3j8tdDJ5csKFUoT/AUEuN/8BMgtgCFmJylcPfB9o/dP2X/Xi8A7EALsl0u/Minne3T9fNe+7HvpJQnOAd/Sf6dBbFuYnRBff+HBC23s/99MXVcocxfkn/zcmyMf59LOkj+CruAzyBCJYXWeJTn1uMv6+/ovjH4Mf3rCyx0gQ4tzkNPq1z+Q59uQfPXrpPaTqpe8Lt43Tm+FLO9tj4wthpDgsb07csVcwOJyU/Jf0h/Y12O6QOC33kPAC0oZqBjagjj1S+MxQLRLyY/hv9UYzbPgfIPzV/7NsQCw1qgqYLBz/7T8Q8+BSpdkD6OtpOqNPbS/dtYbWPKxXeSWxBFKVPjN5lDbzJzJ4afxPcAKaKauRIP+vY92i8rOX/RnZu+XcdSJvjRHNZHsO3PEiUtUGx+LP8md7VaVLZ92P5y8XsNzPVPHspyjiXsn8PhcDgcDocDmF95ROWeQ9G9wgAAAABJRU5ErkJggg==';
const spriteBit = new Image();
spriteBit.onload = () => { if (!construirSkins(spriteBit)) { const r = new Image(); r.onload = () => construirSkins(r); r.src = SPRITE_RESPALDO; } };
spriteBit.src = 'bit/bit-sprite.png';   // 8 fotogramas de 24×24 en fila

const hex = (d, i) => ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).toUpperCase().padStart(6, '0');
function construirSkins(img) {
  hojas.normal = img;
  let datos;
  try {
    const base = crearCapa(192, 24, g => g.drawImage(img, 0, 0));
    datos = base.getContext('2d').getImageData(0, 0, 192, 24);   // falla si la imagen viene de file://
  } catch (err) { return false; }
  const d = datos.data, opaco = (x, y) => x >= 0 && y >= 0 && x < 192 && y < 24 && d[(y * 192 + x) * 4 + 3] > 0;
  altoCabeza = [...Array(8)].map((_, f) => {
    for (let y = 0; y < 24; y++) for (let x = f * 24; x < f * 24 + 24; x++) if (opaco(x, y)) return y;
    return 4;
  });
  for (const [nombre, skin] of Object.entries(SKINS)) {
    if (!skin) continue;
    hojas[nombre] = crearCapa(192, 24, g => {
      const pintar = (x, y, color) => { g.fillStyle = color; g.fillRect(x, y, 1, 1); };
      for (let y = 0; y < 24; y++) for (let x = 0; x < 192; x++) {
        const i = (y * 192 + x) * 4;
        if (d[i + 3] > 0) {
          const h = hex(d, i);
          pintar(x, y, skin.cambios[h] || '#' + h);
        } else {
          // píxel vacío: ¿toca el cuerpo? → se engorda o se perfila
          const vecinos = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) =>
            Math.floor((x + dx) / 24) === Math.floor(x / 24) && opaco(x + dx, y + dy));
          if (skin.engordar && vecinos.some(([dx, dy]) => hex(d, ((y + dy) * 192 + x + dx) * 4) === skin.engordar.color))
            pintar(x, y, skin.engordar.relleno);
          else if (skin.contorno && vecinos.length) pintar(x, y, skin.contorno);
        }
      }
    });
  }
  return true;
}

// --- Objetos (12×12) ------------------------------------------------
const IMG_OBJETO = {
  E: dibujoPixel([   // enchufe
    "...G....G...",
    "...G....G...",
    ".RRRRRRRRRR.",
    "RRRRRRDRRRRR",
    "RRRRRDDRRRRR",
    "RRRRDDDDDRRR",
    "RRRRRRDDRRRR",
    "RRRRRRDRRRRR",
    ".RRRRRRRRRR.",
    "...RRRRRR...",
    "....RRRR....",
    ".....GG.....",
  ]),
  L: dibujoPixel([   // cañón láser
    "............",
    "............",
    "..GGGGGGGG..",
    ".GPPPPPPPPGA",
    ".GPAAAPPPPGA",
    ".GPPPPPPPPGA",
    "..GGGGGGGG..",
    "...GPG......",
    "...GPG......",
    "...GGG......",
    "............",
    "............",
  ]),
  C: dibujoPixel([   // campo de fuerza
    "..AAAAAAAA..",
    ".ACCCCCCCCA.",
    ".ACAAAAAACA.",
    ".ACAAGGAACA.",
    ".ACAGAAGACA.",
    ".ACAAGGAACA.",
    "..ACAAAACA..",
    "..ACAAAACA..",
    "...ACAACA...",
    "....ACCA....",
    ".....AA.....",
    "............",
  ]),
  S: dibujoPixel([   // espada frame
    "..........VV",
    ".........VCV",
    "........VCV.",
    ".......VCV..",
    "......VCV...",
    ".....VCV....",
    "..D.VCV.....",
    "...DCV......",
    "....DD......",
    "...KDDD.....",
    "..KK..D.....",
    ".KK.........",
  ]),
  B: dibujoPixel([   // batería extra
    "....GGGG....",
    "..GGGGGGGG..",
    "..GLLLLLLG..",
    "..G......G..",
    "..GLLLLLLG..",
    "..G......G..",
    "..GLLLLLLG..",
    "..G......G..",
    "..GLLLLLLG..",
    "..GGGGGGGG..",
    "............",
    "............",
  ]),
};
const COLOR_OBJETO = { E: PAL.rojo, L: PAL.cian, C: PAL.cian, S: PAL.violeta, B: PAL.lima };

// --- Escenario ------------------------------------------------------
const capaEstrellas = crearCapa(512, ALTO, g => {
  const r = azar(9);
  for (let i = 0; i < 90; i++) {
    const v = r();
    g.fillStyle = v < 0.7 ? PAL.gris : v < 0.9 ? PAL.cian : PAL.crema;
    g.fillRect(Math.floor(r() * 512), Math.floor(r() * 120), 1, 1);
  }
});
const capaLuna = crearCapa(16, 16, g => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const a = (x - 7.5) ** 2 + (y - 7.5) ** 2 < 49;
    const b = (x - 11) ** 2 + (y - 5.5) ** 2 < 42;
    if (a && !b) { g.fillStyle = PAL.crema; g.fillRect(x, y, 1, 1); }
  }
});
function capaEdificios(ancho, semilla, color, minAlto, maxAlto, luces) {
  return crearCapa(ancho, ALTO, g => {
    const r = azar(semilla);
    let x = 0;
    while (x < ancho) {
      const w = 20 + Math.floor(r() * 28);
      const h = minAlto + Math.floor(r() * (maxAlto - minAlto));
      const top = ALTO - h;
      g.fillStyle = color;
      g.fillRect(x, top, w, h);
      if (r() < 0.35) g.fillRect(x + Math.floor(w / 2) - 1, top - 6, 2, 6);
      for (let wy = top + 5; wy < ALTO - 6; wy += 6)
        for (let wx = x + 3; wx < x + w - 3; wx += 5) {
          const v = r();
          if (v < luces) {
            g.fillStyle = v < luces * 0.5 ? PAL.dorado : v < luces * 0.8 ? PAL.cian : PAL.fucsia;
            g.fillRect(wx, wy, 2, 2);
          } else if (v < luces + 0.25) {
            g.fillStyle = PAL.tinta2;
            g.fillRect(wx, wy, 2, 2);
          }
        }
      x += w + 2 + Math.floor(r() * 6);
    }
  });
}
const capaLejana = capaEdificios(480, 4, PAL.tinta2, 60, 120, 0.02);
const capaCercana = capaEdificios(416, 7, PAL.tinta, 40, 95, 0.10);

// Medalla de 16×16: la meta de cada nivel (cinta fucsia y cian, disco dorado con estrella)
const imgMedalla = dibujoPixel([
  "..FFAA....AAFF..",
  "..FFAA....AAFF..",
  "...FFAA..AAFF...",
  "....FFAAAAFF....",
  ".....FFAAFF.....",
  "......DDDD......",
  "....DDDDDDDD....",
  "...DDCCDDDDDD...",
  "...DCDDDCDDDD...",
  "..DDCDDCCCDDDD..",
  "..DDDCCCCCCCDD..",
  "..DDDDCCCCCDDD..",
  "...DDDCDDDCDD...",
  "...DDDDDDDDDD...",
  "....DDDDDDDD....",
  "......DDDD......",
]);

// --- Enemigos ---------------------------------------------------------
const CUERPO_PATRULLERO = [
  "...FFFFFF...",
  "..FFFFFFFF..",
  ".FFFFFFFFFF.",
  ".FCCFFFFCCF.",
  ".FCNFFFFCNF.",
  "FFFFFFFFFFFF",
  "FFFNNNNNNFFF",
  "FFFFFFFFFFFF",
  ".FFFFFFFFFF.",
  "..FFFFFFFF..",
];
const imgPatrullero = [
  dibujoPixel([...CUERPO_PATRULLERO, "..F..FF..F..", ".F...FF...F."]),
  dibujoPixel([...CUERPO_PATRULLERO, "...F.FF.F...", "...F.FF.F..."]),
];
const CUERPO_BLINDADO = [   // mira a la derecha; el escudo crema va delante
  "...GGGGG....",
  "..GPPPPPG.GG",
  ".GPPPPPPPGCG",
  ".GPPPFFPPGCG",
  ".GPPPFFPPGCG",
  ".GPPPPPPPGCG",
  ".GPNNNNPPGCG",
  ".GPPPPPPPGCG",
  ".GPPPPPPPGCG",
  "..GPPPPPG.GG",
];
const imgBlindado = [
  dibujoPixel([...CUERPO_BLINDADO, "..G.G.G.G...", ".G...G...G.."]),
  dibujoPixel([...CUERPO_BLINDADO, "...G.G.G....", "...G.G.G...."]),
];
const DIBUJO_TORRETA = [   // el cañón mira a la izquierda; E = ojo
  "....GGGGGG....",
  "...GTTTTTTG...",
  "..GTTEEETTTG..",
  "..GTTEEETTTG..",
  "FFFFTTTTTTTG..",
  "FFFFTTTTTTTG..",
  "..GTTTTTTTTG..",
  "..GGGGGGGGGGG.",
  "..TTTTTTTTTTT.",
  "..TGTTTTTTGTT.",
  "..TTTTTTTTTTT.",
  ".TTTTTTTTTTTTT",
  ".TTTTTTTTTTTTT",
  ".GGGGGGGGGGGGG",
];
const imgTorreta = [dibujoPixel(DIBUJO_TORRETA, { E: PAL.fucsia }), dibujoPixel(DIBUJO_TORRETA, { E: PAL.crema })];
const imgRafaga = [
  dibujoPixel(DIBUJO_TORRETA, { E: PAL.dorado, G: PAL.dorado, F: PAL.dorado }),
  dibujoPixel(DIBUJO_TORRETA, { E: PAL.crema, G: PAL.dorado, F: PAL.dorado }),
];
const imgVolador = [
  dibujoPixel([
    "GG........GG",
    ".GG......GG.",
    "..GGGTTGGG..",
    "...TTTTTT...",
    "..TTFFFFTT..",
    "..TTFCCFTT..",
    "..TTFFFFTT..",
    "...TTTTTT...",
    "....T..T....",
    "....F..F....",
  ]),
  dibujoPixel([
    "............",
    "............",
    "..GGTTTTGG..",
    ".GGTTTTTTGG.",
    "GG.TFFFFT.GG",
    "G..TFCCFT..G",
    "...TFFFFT...",
    "...TTTTTT...",
    "....T..T....",
    "....F..F....",
  ]),
];
const imgSaltador = [
  dibujoPixel([
    "............",
    "..AA....AA..",
    ".AFFA..AFFA.",
    ".AFCA..AFCA.",
    ".AAAAAAAAAA.",
    "AAAAAAAAAAAA",
    "AATTTTTTTTAA",
    "AAAAAAAAAAAA",
    ".AAAAAAAAAA.",
    "..AA....AA..",
    ".AA......AA.",
    "AA........AA",
  ]),
  dibujoPixel([   // agachado, a punto de saltar
    "............",
    "............",
    "............",
    "..AA....AA..",
    ".AFFA..AFFA.",
    ".AFCA..AFCA.",
    "AAAAAAAAAAAA",
    "AATTTTTTTTAA",
    "AAAAAAAAAAAA",
    ".AAAAAAAAAA.",
    "AAA......AAA",
    "AA........AA",
  ]),
];

const imgCazador = [dibujoPixel([
  "G....GG....G",
  ".G..TTTT..G.",
  "..GTTTTTTG..",
  ".TTTTTTTTTT.",
  ".TFFTTTTFFT.",
  ".TFCTTTTFCT.",
  ".TTTTTTTTTT.",
  ".TTFFFFFFTT.",
  "..TTTTTTTT..",
  ".G.TTTTTT.G.",
  "G...G..G...G",
  "............",
]), dibujoPixel([
  "....G..G....",
  "G...TTTT...G",
  ".GGTTTTTTGG.",
  ".TTTTTTTTTT.",
  ".TFFTTTTFFT.",
  ".TFCTTTTFCT.",
  ".TTTTTTTTTT.",
  ".TTFFFFFFTT.",
  "..TTTTTTTT..",
  "G..TTTTTT..G",
  ".G..G..G..G.",
  "............",
])];
const DIBUJO_JEFE = [
  "....DDDDDDDDDDDDDDDDDDDDDDDD....",
  "....DCCDDDDDDDDDDDDDDDDDDCCD....",
  "....DDDDDDDDDDDDDDDDDDDDDDDD....",
  "...TTTTTTTTTTTTTTTTTTTTTTTTTT...",
  "...TGGGGGGGGGGGGGGGGGGGGGGGGT...",
  "...TGNNNNNNNNNNNNNNNNNNNNNNGT...",
  "...TGNEEEENNNNNNNNNNNNEEEENGT...",
  "...TGNECCENNNNNNNNNNNNECCENGT...",
  "...TGNEEEENNNNNNNNNNNNEEEENGT...",
  "...TGNNNNNNNNNNNNNNNNNNNNNNGT...",
  "...TGNNNNEEEEEEEEEEEEEENNNNGT...",
  "...TGNNNNENENENENENENENNNNNGT...",
  "...TGNNNNNNNNNNNNNNNNNNNNNNGT...",
  "...TGGGGGGGGGGGGGGGGGGGGGGGGT...",
  "..TTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
  ".TTTDTTTFTTTATTTTTTATTTFTTTDTTT.",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "..TTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
  "..TTTTTTTPPPPPPPPPPPPPPTTTTTTT..",
  "..TTTTTTTPDDDDDDDDDDDDPTTTTTTT..",
  "..TTTTTTTPPPPPPPPPPPPPPTTTTTTT..",
  "..TTTTTTTTTTTTTTTTTTTTTTTTTTTT..",
  "..GGGGGGGGGGGGGGGGGGGGGGGGGGGG..",
  "...GG....GG..........GG....GG...",
];
const imgJefe = [dibujoPixel(DIBUJO_JEFE, { E: PAL.fucsia }), dibujoPixel(DIBUJO_JEFE, { E: PAL.rojoVivo, D: PAL.rojo })];   // fase 1 y fase 2

// --- Tajo de la espada: 4 fotogramas píxel a píxel (mira a la derecha) ---
// Cada fotograma mide 26×30; la empuñadura está en (3, 15).
const imgTajo = [-70, -25, 25, 60].map((angFinal, f) => crearCapa(26, 30, g => {
  const hx = 3, hy = 15;
  const punto = (x, y, color) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  // estela: arco violeta oscuro desde -85° hasta el ángulo actual
  for (let a = -85; a <= angFinal; a += 3) {
    const rad = a * Math.PI / 180;
    const desde = f === 3 ? 14 : 9;
    for (let r = desde; r <= 20; r++) punto(hx + Math.cos(rad) * r, hy + Math.sin(rad) * r, r > 17 ? PAL.violeta : PAL.violetaOscuro);
  }
  if (f < 3) {   // hoja: violeta con filo crema, empuñadura dorada
    const rad = angFinal * Math.PI / 180;
    for (let r = 3; r <= 21; r++) {
      punto(hx + Math.cos(rad) * r, hy + Math.sin(rad) * r, r > 4 ? PAL.crema : PAL.dorado);
      punto(hx + Math.cos(rad) * r + Math.sin(rad), hy + Math.sin(rad) * r - Math.cos(rad), PAL.violeta);
      punto(hx + Math.cos(rad) * r - Math.sin(rad), hy + Math.sin(rad) * r + Math.cos(rad), PAL.violeta);
    }
    punto(hx, hy, PAL.dorado); punto(hx + 1, hy, PAL.dorado);
  }
}));
