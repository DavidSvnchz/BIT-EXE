// ==========================================================================
// ZONAS — cada una de las 5 zonas del mundo 1 tiene su ambiente: color del cielo, edificios del
// fondo, luces de las ventanas, color del suelo y partículas (lluvia, polvo, burbujas, brasas).
// zonaDe(indice) dice la zona de un nivel; tema = la zona del nivel cargado (lo pone partida.js).
// Usa: configuracion.js, graficos.js (crearCapa, azar).
// ==========================================================================

function edificiosTema(ancho, semilla, color, minAlto, maxAlto, luces, coloresLuz, apagada) {
  return crearCapa(ancho, ALTO, g => {
    const r = azar(semilla);
    let x = 0;
    while (x < ancho) {
      const w = 20 + Math.floor(r() * 28), h = minAlto + Math.floor(r() * (maxAlto - minAlto)), top = ALTO - h;
      g.fillStyle = color; g.fillRect(x, top, w, h);
      if (r() < 0.35) g.fillRect(x + Math.floor(w / 2) - 1, top - 6, 2, 6);
      for (let wy = top + 5; wy < ALTO - 6; wy += 6)
        for (let wx = x + 3; wx < x + w - 3; wx += 5) {
          const v = r();
          if (v < luces) { g.fillStyle = coloresLuz[Math.floor(v / luces * coloresLuz.length)]; g.fillRect(wx, wy, 2, 2); }
          else if (v < luces + 0.25) { g.fillStyle = apagada; g.fillRect(wx, wy, 2, 2); }
        }
      x += w + 2 + Math.floor(r() * 6);
    }
  });
}

const ZONAS = [
  { nombre: 'La entrada', niveles: [0, 3], cielo: PAL.noche, suelo: [PAL.tinta2, PAL.tinta], ambiente: null,
    lejana: capaLejana, cercana: capaCercana },
  { nombre: 'Ciudad Caché', niveles: [4, 7], cielo: '#0B1626', suelo: ['#1B3350', '#10233A'], ambiente: 'lluvia',
    lejana: edificiosTema(480, 14, '#15304A', 70, 130, 0.05, [PAL.cian, PAL.cian, PAL.crema], '#1E3D5C'),
    cercana: edificiosTema(416, 17, '#0F2236', 45, 100, 0.16, [PAL.cian, PAL.lima, PAL.crema, PAL.fucsia], '#183150') },
  { nombre: 'Los archivos olvidados', niveles: [8, 11], cielo: '#17110D', suelo: ['#3A2D1F', '#261C13'], ambiente: 'polvo',
    lejana: edificiosTema(480, 24, '#2E2418', 50, 105, 0.02, [PAL.dorado], '#3A2E20'),
    cercana: edificiosTema(416, 27, '#211910', 35, 85, 0.07, [PAL.dorado, PAL.dorado, PAL.crema], '#33271A') },
  { nombre: 'Las profundidades', niveles: [12, 15], cielo: '#05131A', suelo: ['#123540', '#0A242C'], ambiente: 'burbujas',
    lejana: edificiosTema(480, 34, '#0C2A33', 80, 140, 0.04, [PAL.cian, PAL.lima], '#123A45'),
    cercana: edificiosTema(416, 37, '#081E25', 50, 110, 0.10, [PAL.cian, PAL.lima, PAL.lima], '#0F3039') },
  { nombre: 'Hacia el núcleo', niveles: [16, 19], cielo: '#1A0610', suelo: ['#43142A', '#2D0B1B'], ambiente: 'brasas',
    lejana: edificiosTema(480, 44, '#3A0E1E', 70, 135, 0.05, [PAL.rojoVivo, PAL.fucsia], '#4D1428'),
    cercana: edificiosTema(416, 47, '#28091A', 45, 100, 0.14, [PAL.rojoVivo, PAL.fucsia, PAL.dorado], '#3D1026') },
];
const zonaDe = indice => ZONAS.findIndex(z => indice >= z.niveles[0] && indice <= z.niveles[1]);
let tema = ZONAS[0];

// Partículas de ambiente en coordenadas de pantalla (no guardan estado: dependen solo del reloj)
function dibujarAmbiente() {
  const t = tiempo;
  if (tema.ambiente === 'lluvia') {
    ctx.fillStyle = 'rgba(51,214,230,.35)';
    for (let i = 0; i < 46; i++) {
      const x = ((i * 53 - t * 40) % (ANCHO + 20) + ANCHO + 20) % (ANCHO + 20) - 10;
      const y = (i * 71 + t * 230) % (ALTO + 10) - 5;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
    }
  } else if (tema.ambiente === 'polvo') {
    for (let i = 0; i < 28; i++) {
      const x = ((i * 97 + t * (6 + i % 5)) % (ANCHO + 10)) - 5, y = (i * 41 + Math.sin(t * 0.7 + i) * 8 + t * 3) % ALTO;
      ctx.fillStyle = i % 3 ? 'rgba(255,196,61,.35)' : 'rgba(169,163,194,.4)';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  } else if (tema.ambiente === 'burbujas') {
    ctx.fillStyle = 'rgba(51,214,230,.45)';
    for (let i = 0; i < 22; i++) {
      const x = (i * 61) % ANCHO + Math.sin(t * 2 + i) * 3, y = ALTO - ((t * (12 + i % 7 * 3) + i * 37) % (ALTO + 10));
      const r = i % 4 === 0 ? 2 : 1;
      ctx.fillRect(Math.round(x), Math.round(y), r, r);
      if (r === 2) { ctx.fillStyle = 'rgba(243,238,227,.6)'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.fillStyle = 'rgba(51,214,230,.45)'; }
    }
  } else if (tema.ambiente === 'brasas') {
    for (let i = 0; i < 30; i++) {
      const x = (i * 43) % ANCHO + Math.sin(t * 1.5 + i * 2) * 6, y = ALTO - ((t * (18 + i % 5 * 6) + i * 29) % (ALTO + 10));
      ctx.fillStyle = (Math.floor(t * 8 + i) % 3) ? 'rgba(255,43,43,.6)' : 'rgba(255,196,61,.7)';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
}
