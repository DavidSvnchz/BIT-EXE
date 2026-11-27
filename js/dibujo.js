// ==========================================================================
// DIBUJO — pinta un fotograma en el lienzo.
// Orden: cielo y fondos con paralaje → casillas visibles → enemigos → Bit (con su skin y
// complementos) → proyectiles, rayos, partículas → puntos flotantes.
// No cambia el estado del juego: solo lo lee.
// Usa: graficos.js, estado.js.
// ==========================================================================

// ============================================================
// DIBUJO
// ============================================================
function capaRepetida(img, factor, y) {
  const off = -Math.floor(camX * factor) % img.width;
  for (let x = off; x < ANCHO; x += img.width) ctx.drawImage(img, x, y);
}

function dibujarCasilla(v, c, f, x, y) {
  if (v === SUELO) {
    ctx.fillStyle = PAL.tinta2; ctx.fillRect(x, y, T, T);
    ctx.fillStyle = PAL.tinta;
    ctx.fillRect(x, y + 7, T, 1); ctx.fillRect(x, y + 15, T, 1);
    ctx.fillRect(x + (f % 2 ? 3 : 11), y, 1, 7);
    ctx.fillRect(x + (f % 2 ? 11 : 3), y + 8, 1, 7);
    if (!esSolida(c - 1, f)) ctx.fillRect(x, y, 1, T);
    if (!esSolida(c + 1, f)) ctx.fillRect(x + T - 1, y, 1, T);
    if (!esSolida(c, f - 1)) {
      ctx.fillStyle = PAL.lima; ctx.fillRect(x, y, T, 2);
      ctx.fillStyle = PAL.tinta2; ctx.fillRect(x, y + 2, T, 1);
    }
  } else if (v === MONEDA) {
    const bote = Math.round(Math.sin(tiempo * 4 + c * 0.7) * 1.5);
    const w = [6, 4, 2, 4][Math.floor(tiempo * 8 + c) % 4];
    const mx = x + 8 - w / 2, my = y + 4 + bote;
    ctx.fillStyle = PAL.cian;
    ctx.fillRect(mx, my + 1, w, 6);
    if (w > 2) ctx.fillRect(mx + 1, my, w - 2, 8); else ctx.fillRect(mx, my, w, 8);
    if (w >= 4) { ctx.fillStyle = PAL.crema; ctx.fillRect(mx + 1, my + 2, 1, 2); }
  } else if (v === PINCHOS) {
    ctx.fillStyle = PAL.fucsia;
    for (let p = 0; p < 2; p++) for (let k = 0; k < 4; k++) ctx.fillRect(x + p * 8 + 3 - k, y + 8 + k * 2, 2 + 2 * k, 2);
    ctx.fillStyle = PAL.crema;
    ctx.fillRect(x + 3, y + 8, 2, 1); ctx.fillRect(x + 11, y + 8, 2, 1);
  } else if (v === MEDALLA) {
    ctx.drawImage(imgMedalla, x, y);
    if (hayJefe()) {   // jaula
      ctx.fillStyle = PAL.fucsia;
      for (let k = 0; k < 4; k++) ctx.fillRect(x + 1 + k * 4, y - 2, 1, 18);
      ctx.fillRect(x, y - 3, 16, 1);
    }
    const b = Math.floor(tiempo * 3) % 3;
    ctx.fillStyle = b === 0 ? PAL.crema : PAL.dorado;
    ctx.fillRect(x + [1, 14, 8][b], y + [1, 0, -3][b], 1, 1);
  } else if (IMG_OBJETO[v]) {
    // objeto: flota, con un halo de su color que gira
    const bote = Math.round(Math.sin(tiempo * 3 + c) * 2);
    const k = Math.floor(tiempo * 10) % 8;
    ctx.fillStyle = COLOR_OBJETO[v];
    const halo = [[0, 0], [7, -1], [14, 0], [15, 7], [14, 14], [7, 15], [0, 14], [-1, 7]];
    for (let i = 0; i < 2; i++) { const [hx, hy] = halo[(k + i * 4) % 8]; ctx.fillRect(x + hx, y + hy + bote, 1, 1); }
    ctx.drawImage(IMG_OBJETO[v], x + 2, y + 2 + bote);
  }
}

function dibujarEnemigos(cx, cy) {
  const anim = Math.floor(tiempo * 6) % 2;
  for (const e of enemigos) {
    if (e.golpe > 0 && Math.floor(e.golpe * 40) % 2) continue;
    const x = Math.round(e.x) - cx, y = Math.round(e.y) - cy;
    if (x < -24 || x > ANCHO + 24) continue;
    switch (e.tipo) {
      case 'patrullero': dibujarImagen(imgPatrullero[anim], x, y, e.vx < 0); break;
      case 'blindado':   dibujarImagen(imgBlindado[anim], x, y, e.vx < 0); break;
      case 'torreta':    dibujarImagen(imgTorreta[e.recarga < 0.35 ? 1 : 0], x, y, e.mira > 0); break;
      case 'rafaga':     dibujarImagen(imgRafaga[e.recarga < 0.45 || e.cola > 0 ? 1 : 0], x, y, e.mira > 0); break;
      case 'volador':    dibujarImagen(imgVolador[Math.floor(tiempo * 10) % 2], x, y - (anim ? 0 : 1), e.vx < 0); break;
      case 'saltador':   dibujarImagen(imgSaltador[e.enSuelo && e.espera < 0.3 ? 1 : 0], x, y, bit.x < e.x); break;
      case 'cazador':    dibujarImagen(imgCazador[Math.floor(tiempo * 12) % 2], x, y, e.vx < 0); break;
      case 'jefe': {
        ctx.drawImage(imgJefe[e.fase2 ? 1 : 0], x, y);
        const llama = Math.floor(tiempo * 14) % 2;   // propulsores
        ctx.fillStyle = e.fase2 ? PAL.rojoVivo : PAL.fucsia;
        for (const lx of [3, 9, 21, 27]) ctx.fillRect(x + lx, y + 24, 2, 2 + llama * 2);
        ctx.fillStyle = PAL.dorado;
        for (const lx of [3, 9, 21, 27]) ctx.fillRect(x + lx, y + 26 + llama * 2, 2, 1);
        if (e.recarga < 0.3) { ctx.fillStyle = PAL.crema; ctx.fillRect(x + 10, y + 10, 12, 1); }   // aviso de disparo
        break;
      }
    }
  }
}

// Píxel relativo al sprite de Bit (24×24), volteado si mira a la izquierda
function pixelBit(px, py, lx, ly, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(bit.mira < 0 ? px + 24 - lx - w : px + lx, py + ly, w, h);
}

function dibujarBit(cx, cy) {
  const j = bit;
  const px = Math.round(j.x + CAJA.dx) - cx, py = Math.round(j.y + CAJA.dy) - cy;
  const cab = altoCabeza[j.fotograma] || 4;
  const skin = mejora ? SKIN_DE_MEJORA[mejora] : 'normal';
  const hoja = hojas[skin] || hojas.normal;

  // Fantasmas del teletransporte
  for (const f of fantasmas) {
    if (!hoja) break;
    ctx.globalAlpha = 0.5 * (1 - f.t / 0.35);
    const fx = Math.round(f.x + CAJA.dx) - cx, fy = Math.round(f.y + CAJA.dy) - cy;
    ctx.save();
    if (f.mira < 0) { ctx.translate(fx + 24, fy); ctx.scale(-1, 1); ctx.drawImage(hoja, f.fotograma * 24, 0, 24, 24, 0, 0, 24, 24); }
    else ctx.drawImage(hoja, f.fotograma * 24, 0, 24, 24, fx, fy, 24, 24);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  if (!hoja || (j.parpadeo > 0 && Math.floor(j.parpadeo * 15) % 2)) return;

  // Detrás del cuerpo: bufanda del francotirador y espada envainada
  if (mejora === 'laser') {
    const ola = Math.floor(tiempo * 8) % 2;
    pixelBit(px, py, 5, cab + 8, 2, 1, PAL.fucsia);
    pixelBit(px, py, 3, cab + 8 + ola, 2, 1, PAL.fucsia);
    pixelBit(px, py, 1, cab + 9 - ola, 2, 1, PAL.fucsia);
  }
  if (mejora === 'espada' && j.arma === 'espada' && !j.tajo) {
    for (let k = 0; k < 7; k++) pixelBit(px, py, 6 - k, cab + 2 + k, 1, 1, k < 5 ? PAL.violeta : PAL.dorado);
  }

  ctx.save();
  if (j.mira < 0) { ctx.translate(px + 24, py); ctx.scale(-1, 1); ctx.drawImage(hoja, j.fotograma * 24, 0, 24, 24, 0, 0, 24, 24); }
  else ctx.drawImage(hoja, j.fotograma * 24, 0, 24, 24, px, py, 24, 24);
  ctx.restore();

  // Delante del cuerpo
  if (mejora === 'laser') {
    // cañón láser con la punta cargándose
    pixelBit(px, py, 15, cab + 7, 9, 2, PAL.gris);
    pixelBit(px, py, 15, cab + 9, 5, 1, PAL.acero);
    const listo = j.recarga <= 0;
    pixelBit(px, py, 24, cab + 7, 2, 2, listo ? (Math.floor(tiempo * 6) % 2 ? PAL.cian : PAL.crema) : PAL.acero);
    pixelBit(px, py, 9, cab + 4, 2, 1, PAL.crema);   // mira telescópica
  }
  if (mejora === 'escudo') {
    // burbuja de fuerza: puntos que giran; más débil cuantos más golpes
    const n = 18, giro = tiempo * 2, fuerza = 1 - golpesEscudo / ESCUDO.golpesMax;
    const ccx = px + 12, ccy = py + cab + 8;
    for (let i = 0; i < n; i++) {
      if ((i + Math.floor(tiempo * 6)) % (fuerza > 0.5 ? 2 : 3) !== 0) continue;
      const a = (i / n) * Math.PI * 2 + giro;
      ctx.fillStyle = i % 3 ? PAL.cian : PAL.crema;
      ctx.fillRect(Math.round(ccx + Math.cos(a) * 13), Math.round(ccy + Math.sin(a) * 13), 1, 1);
    }
    pixelBit(px, py, 9, cab + 13, 1, 1, PAL.dorado);   // remaches
    pixelBit(px, py, 14, cab + 13, 1, 1, PAL.dorado);
  }
  if (j.tajo) {
    const f = Math.min(3, Math.floor(j.tajo.t / (ARMAS.espada.duracion / 4)));
    const img = imgTajo[f];
    const hx = j.mira > 0 ? px + 17 : px + 7;   // mano delantera
    const hy = py + cab + 9;
    if (j.mira > 0) ctx.drawImage(img, hx - 3, hy - 15);
    else { ctx.save(); ctx.translate(hx + 3, hy - 15); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
  }
}

function dibujarProyectiles(cx, cy) {
  for (const p of proyectiles) {
    const x = Math.round(p.x) - cx, y = Math.round(p.y) - cy;
    if (p.deBit) {
      ctx.fillStyle = p.color; ctx.fillRect(x, y, p.w, p.h);
      ctx.fillStyle = PAL.crema; ctx.fillRect(p.vx > 0 ? x + p.w - 2 : x, y + 1, 2, 1);
      if (p.color === PAL.rojoVivo) { ctx.fillStyle = PAL.dorado; ctx.fillRect(p.vx > 0 ? x - 2 : x + p.w, y + 1, 2, 1); }
    } else {
      if (p.grande) {
        ctx.fillStyle = PAL.rojoVivo; ctx.fillRect(x, y + 1, 5, 3); ctx.fillRect(x + 1, y, 3, 5);
        ctx.fillStyle = Math.floor(tiempo * 12) % 2 ? PAL.dorado : PAL.crema; ctx.fillRect(x + 1, y + 1, 3, 3);
        continue;
      }
      ctx.fillStyle = PAL.fucsia; ctx.fillRect(x, y + 1, 4, 2); ctx.fillRect(x + 1, y, 2, 4);
      if (Math.floor(tiempo * 10) % 2) { ctx.fillStyle = PAL.crema; ctx.fillRect(x + 1, y + 1, 2, 2); }
    }
  }
  // Rayos láser: núcleo crema, halo cian y destellos
  for (const r of rayos) {
    const izq = Math.min(r.x0, r.x1) - cx, ancho = Math.abs(r.x1 - r.x0), y = r.y - cy;
    const g = r.t < 0.05 ? 3 : r.t < 0.12 ? 2 : 1;
    ctx.fillStyle = PAL.cian; ctx.fillRect(izq, y - g, ancho, g * 2 + 1);
    ctx.fillStyle = PAL.crema; ctx.fillRect(izq, y - (g > 1 ? 1 : 0), ancho, g > 1 ? 3 : 1);
    if (r.t < 0.1) {
      ctx.fillStyle = PAL.cian;
      for (let k = 0; k < ancho; k += 9) ctx.fillRect(izq + k + (Math.floor(r.t * 100) % 9), y - 5 + ((k * 7) % 11), 1, 1);
      ctx.fillStyle = PAL.crema;
      ctx.fillRect(r.x0 - cx - 2, y - 4, 4, 9); ctx.fillRect(r.x0 - cx - 4, y - 2, 8, 5);   // fogonazo
    }
  }
  for (const p of particulas) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x) - cx, Math.round(p.y) - cy, p.t < p.vida * 0.5 ? 2 : 1, p.t < p.vida * 0.5 ? 2 : 1);
  }
}

// Cifras de 3×5 píxeles para los puntos flotantes
const CIFRAS = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010',
  '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', '-': '000000111000000'
};
function textoPixel(txt, x, y, color) {
  [...txt].forEach((ch, i) => {
    const patron = CIFRAS[ch]; if (!patron) return;
    for (let k = 0; k < 15; k++) if (patron[k] === '1') {
      const px = x + i * 4 + (k % 3), py = y + Math.floor(k / 3);
      ctx.fillStyle = PAL.noche; ctx.fillRect(px + 1, py + 1, 1, 1);
      ctx.fillStyle = color; ctx.fillRect(px, py, 1, 1);
    }
  });
}

function dibujar() {
  let cx = Math.round(camX), cy = Math.round(camY);
  if (temblor > 0) { cx += Math.round((Math.random() - 0.5) * 3); cy += Math.round((Math.random() - 0.5) * 3); }

  ctx.fillStyle = PAL.noche; ctx.fillRect(0, 0, ANCHO, ALTO);
  capaRepetida(capaEstrellas, 0.05, 0);
  ctx.drawImage(capaLuna, 262 - Math.floor(camX * 0.02), 14);
  capaRepetida(capaLejana, 0.2, Math.round(30 - cy * 0.3));
  capaRepetida(capaCercana, 0.45, Math.round(48 - cy * 0.5));

  const c0 = Math.floor(cx / T), c1 = Math.floor((cx + ANCHO) / T);
  const f0 = Math.floor(cy / T), f1 = Math.floor((cy + ALTO) / T);
  for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) {
    const v = casilla(c, f);
    if (v !== AIRE && c >= 0 && c < cols) dibujarCasilla(v, c, f, c * T - cx, f * T - cy);
  }

  dibujarEnemigos(cx, cy);
  dibujarBit(cx, cy);
  dibujarProyectiles(cx, cy);
  for (const tx of textos) if (Math.floor(tx.t * 20) % 2 || tx.t < 0.6)
    textoPixel(tx.txt, Math.round(tx.x) - cx, Math.round(tx.y) - cy, tx.malo ? PAL.fucsia : PAL.dorado);
}
