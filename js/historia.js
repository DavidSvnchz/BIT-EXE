// ==========================================================================
// HISTORIA — la intro en viñetas (antes del nivel 1-1) y la escena final del ascenso.
// - historia.mostrar(alAcabar): enseña las viñetas; una tecla/toque pasa a la siguiente.
//   Sale sola la primera vez que se juega el 1-1; luego, desde el botón HISTORIA del menú.
// - dibujarAscenso(lienzo): la imagen del panel final (Bit con la Medalla al Honor).
// Las viñetas se pintan con los mismos sprites del juego (graficos.js) en un lienzo pequeño.
// Usa: graficos.js, estado.js, interfaz.js, partida.js.
// ==========================================================================

const VINETAS = [
  { texto: 'Bit es un <b>antivirus</b>. Básicamente, un <b>sheriff internáutico</b>… con un cañón láser.', escena: 'sheriff' },
  { texto: 'Trabaja de noche capturando virus sueltos, esperando la <b>Medalla al Honor</b> que nunca llega.', escena: 'noche' },
  { texto: 'Y tiene un objetivo: <b>Malware Smith</b>, el capo más buscado de la zona. Prácticamente invencible.', escena: 'cartel' },
  { texto: '¿Cómo puede Bit enfrentarse a semejante bestia? <b>Con tu ayuda.</b>', escena: 'ayuda' },
];

const panelHistoria = document.getElementById('panelHistoria');
const lienzoHistoria = document.getElementById('lienzoHistoria');
const ctxH = lienzoHistoria.getContext('2d');
ctxH.imageSmoothingEnabled = false;

// Estrella de sheriff de 5×4 píxeles
function estrellaPixel(g, x, y) {
  g.fillStyle = PAL.dorado;
  ['..D..', 'DDDDD', '.DDD.', '.D.D.'].forEach((fila, f) =>
    [...fila].forEach((ch, c) => { if (ch === 'D') g.fillRect(x + c, y + f, 1, 1); }));
  g.fillStyle = PAL.crema; g.fillRect(x + 2, y + 1, 1, 1);
}
function bitEn(g, x, y, skin = 'normal', fot = 0, estrella = true) {
  const hoja = hojas[skin] || hojas.normal;
  if (hoja) g.drawImage(hoja, fot * 24, 0, 24, 24, x, y, 24, 24);
  if (estrella) estrellaPixel(g, x + 9, y + 12);
}
function fondoNoche(g, w, h, t) {
  g.fillStyle = PAL.noche; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) {   // estrellas que titilan
    if ((i + Math.floor(t * 3)) % 5 === 0) continue;
    g.fillStyle = i % 4 ? PAL.gris : PAL.crema;
    g.fillRect((i * 37) % w, (i * 13) % (h - 20), 1, 1);
  }
  g.drawImage(capaCercana, 0, 0, w, capaCercana.height, 0, h - capaCercana.height + 50, w, capaCercana.height);
}

function dibujarVineta(escena, t) {
  const g = ctxH, W = 128, H = 72;
  g.clearRect(0, 0, W, H);
  fondoNoche(g, W, H, t);
  const bote = Math.round(Math.sin(t * 5) * 1);
  const fot = [0, 0, 4, 4][Math.floor(t * 4) % 4];
  if (escena === 'sheriff') {
    // rayos dorados detrás de Bit
    g.fillStyle = 'rgba(255,196,61,.18)';
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + t * 0.6;
      g.beginPath(); g.moveTo(64, 38);
      g.lineTo(64 + Math.cos(a - 0.15) * 90, 38 + Math.sin(a - 0.15) * 90);
      g.lineTo(64 + Math.cos(a + 0.15) * 90, 38 + Math.sin(a + 0.15) * 90); g.fill();
    }
    bitEn(g, 52, 24 + bote, 'normal', fot);
    if (Math.floor(t * 4) % 3 === 0) { g.fillStyle = PAL.crema; g.fillRect(60, 35 + bote, 1, 1); g.fillRect(65, 34 + bote, 1, 1); }
  } else if (escena === 'noche') {
    g.drawImage(capaLuna, 104, 6);
    bitEn(g, 30, 40 + bote, 'normal', fot);
    // virus suelto huyendo
    const vx = 70 + ((t * 20) % 40);
    dibujarImagenEn(g, imgVolador[Math.floor(t * 10) % 2], Math.round(vx), 44 + Math.round(Math.sin(t * 6) * 2));
    // medalla en gris, lejos: la que nunca llega
    g.globalAlpha = 0.35 + 0.15 * Math.sin(t * 2);
    g.drawImage(imgMedalla, 104, 26);
    g.globalAlpha = 1;
    g.fillStyle = PAL.gris; g.fillRect(110, 21, 1, 3); g.fillRect(110, 25, 1, 1);   // «!»
  } else if (escena === 'cartel') {
    g.fillStyle = '#3A0F1F'; g.fillRect(0, 0, W, H);
    g.fillStyle = Math.floor(t * 4) % 2 ? 'rgba(255,43,43,.25)' : 'rgba(51,214,230,.18)';
    g.fillRect(Math.floor(t * 4) % 2 ? 0 : 64, 0, 64, H);
    // cartel de «se busca»
    g.fillStyle = '#E9DCC0'; g.fillRect(38, 6, 52, 60);
    g.fillStyle = PAL.dorado; g.fillRect(37, 5, 54, 1); g.fillRect(37, 66, 54, 1); g.fillRect(37, 5, 1, 62); g.fillRect(90, 5, 1, 62);
    g.drawImage(imgJefe[Math.floor(t * 2) % 2], 48, 20 + bote);
    g.fillStyle = '#B3122A'; g.fillRect(42, 10, 44, 2);
    for (let k = 0; k < 5; k++) g.fillRect(44 + k * 9, 56, 6, 2);   // «nombre» en el cartel
  } else if (escena === 'ayuda') {
    g.fillStyle = 'rgba(200,241,53,.16)';
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5 + t;
      g.beginPath(); g.moveTo(40, 40);
      g.lineTo(40 + Math.cos(a - 0.12) * 100, 40 + Math.sin(a - 0.12) * 100);
      g.lineTo(40 + Math.cos(a + 0.12) * 100, 40 + Math.sin(a + 0.12) * 100); g.fill();
    }
    bitEn(g, 28, 28 + bote, 'normal', fot);
    g.drawImage(imgJefe[1], 84, 22 + Math.round(Math.sin(t * 2) * 2));
    // baterías: 3 contra 30
    g.fillStyle = PAL.lima; for (let k = 0; k < 3; k++) g.fillRect(31 + k * 3, 58, 2, 4);
    g.fillStyle = PAL.fucsia; for (let k = 0; k < 15; k++) g.fillRect(78 + k * 3, 58, 2, 4);
  }
}
function dibujarImagenEn(g, img, x, y) { g.drawImage(img, x, y); }

const historia = {
  indice: 0, inicio: 0, alAcabar: null, abierta: false,
  vista() { try { return localStorage.getItem('bit-historia') === '1'; } catch (err) { return false; } },
  mostrar(alAcabar) {
    this.alAcabar = alAcabar || null;
    this.indice = 0; this.inicio = tiempo; this.abierta = true;
    estado = 'historia';
    panelInicio.hidden = true; panelRanking.hidden = true;
    panelHistoria.hidden = false;
    this.pintar();
    medir('historia_vista');
    requestAnimationFrame(() => this.animar());
  },
  pintar() {
    const v = VINETAS[this.indice];
    document.getElementById('textoHistoria').innerHTML = v.texto;
    document.getElementById('pasoHistoria').textContent = (this.indice + 1) + ' / ' + VINETAS.length;
    document.getElementById('llamadaHistoria').textContent = this.indice === VINETAS.length - 1
      ? '¡A POR ÉL! · ' + (window.PULSA_TXT || 'PULSA UNA TECLA')
      : (window.PULSA_TXT || 'PULSA UNA TECLA') + ' PARA SEGUIR';
    this.inicio = tiempo;
    sonido('menu');
  },
  animar() {
    if (!this.abierta) return;
    dibujarVineta(VINETAS[this.indice].escena, tiempo - this.inicio);
    requestAnimationFrame(() => this.animar());
  },
  avanzar() {
    if (tiempo - this.inicio < 0.35) return;   // evita saltarse una viñeta sin querer
    if (this.indice < VINETAS.length - 1) { this.indice++; this.pintar(); return; }
    this.cerrar();
  },
  cerrar(saltada) {
    if (!this.abierta) return;
    this.abierta = false;
    panelHistoria.hidden = true;
    try { localStorage.setItem('bit-historia', '1'); } catch (err) {}
    if (saltada) medir('historia_saltada', { vineta: this.indice + 1 });
    estado = 'inicio';
    if (this.alAcabar) this.alAcabar(); else irAlMenu();
  }
};
document.getElementById('saltarHistoria').addEventListener('click', e => { e.currentTarget.blur(); historia.cerrar(true); });
document.getElementById('verHistoria').addEventListener('click', e => { e.currentTarget.blur(); historia.mostrar(null); });

// ---------- Escena final: el ascenso ----------
function dibujarAscenso(lienzo, t) {
  const g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
  g.imageSmoothingEnabled = false;
  g.fillStyle = PAL.noche; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,196,61,.2)';
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6 + t * 0.5;
    g.beginPath(); g.moveTo(W / 2, H / 2 + 4);
    g.lineTo(W / 2 + Math.cos(a - 0.13) * 120, H / 2 + 4 + Math.sin(a - 0.13) * 120);
    g.lineTo(W / 2 + Math.cos(a + 0.13) * 120, H / 2 + 4 + Math.sin(a + 0.13) * 120); g.fill();
  }
  const bote = Math.round(Math.sin(t * 5));
  bitEn(g, W / 2 - 12, 12 + bote, 'normal', [0, 0, 4, 4][Math.floor(t * 4) % 4]);
  g.drawImage(imgMedalla, W / 2 - 8, 34 + bote);          // la Medalla al Honor, por fin
  for (let i = 0; i < 14; i++) {                          // confeti
    const x = (i * 23 + t * 30 * (1 + i % 3)) % W, y = (i * 17 + t * 40 * (1 + i % 2)) % H;
    g.fillStyle = [PAL.lima, PAL.cian, PAL.fucsia, PAL.dorado][i % 4];
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
}
let animandoAscenso = false;
function mostrarAscenso() {
  const c = document.getElementById('arteFin');
  c.hidden = false;
  if (animandoAscenso) return;
  animandoAscenso = true;
  const t0 = tiempo;
  const paso = () => {
    if (c.hidden || panelFin.hidden) { animandoAscenso = false; return; }
    dibujarAscenso(c, tiempo - t0);
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
