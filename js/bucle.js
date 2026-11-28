// ==========================================================================
// BUCLE — el corazón del juego.
// paso(dt) avanza la simulación 1/60 s: Bit → enemigos → proyectiles → efectos → cámara.
// bucle() se llama en cada fotograma de la pantalla, ejecuta los pasos que toquen y dibuja.
// Al final arranca el juego y deja window.bitJuego para pruebas desde la consola.
// Usa: todo lo anterior (es lo último que se carga).
// ==========================================================================

function pasoEfectos(dt) {
  for (const r of rayos) r.t += dt;
  rayos = rayos.filter(r => r.t < 0.2);
  for (const p of particulas) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.peso || 120) * dt; }
  particulas = particulas.filter(p => p.t < p.vida);
  for (const tx of textos) { tx.t += dt; tx.y -= 18 * dt; }
  textos = textos.filter(tx => tx.t < 0.9);
  for (const f of fantasmas) f.t += dt;
  fantasmas = fantasmas.filter(f => f.t < 0.35);
  if (temblor > 0) temblor -= dt;
  if (destello > 0) destello -= dt;
  // chispas de ambiente según la mejora
  if (mejora === 'espada' && Math.random() < 0.3)
    particulas.push({ x: bit.x + Math.random() * bit.w, y: bit.y + 4 + Math.random() * 10, vx: 0, vy: -20, t: 0, vida: 0.4, color: PAL.violeta });
  if (mejora === 'enchufe' && Math.random() < 0.12)
    particulas.push({ x: bit.x + Math.random() * bit.w, y: bit.y + Math.random() * 12, vx: (Math.random() - 0.5) * 30, vy: -10, t: 0, vida: 0.25, color: PAL.dorado });
}

function paso(dt) {
  if (opcionesPrueba.bot) opcionesPrueba.bot();
  pasoBit(dt);
  if (estado === 'jugando') pasoEnemigos(dt);
  if (estado === 'jugando') pasoProyectiles(dt);
  pasoEfectos(dt);
  pintarJefe();
  pasoTutorial();
  pedidas.clear();
  centrarCamara(Math.min(1, dt * 8));
}

function centrarCamara(suavidad) {
  const objX = bit.x + bit.w / 2 - ANCHO * 0.4;
  const objY = bit.y + bit.h / 2 - ALTO * 0.55;
  camX += (Math.max(0, Math.min(cols * T - ANCHO, objX)) - camX) * suavidad;
  camY += (Math.max(0, Math.min(filas * T - ALTO, objY)) - camY) * suavidad;
}

// ============================================================
// BUCLE PRINCIPAL (paso fijo de 1/60 s; se pausa con Ajustes abiertos)
// ============================================================
const PASO = 1 / 60;
let ultimo = performance.now(), acumulado = 0;

function bucle(ahora) {
  const dt = Math.min((ahora - ultimo) / 1000, 0.1) * (opcionesPrueba.velocidad || 1);
  ultimo = ahora;
  const pausa = ajustesAbiertos() || enVertical();   // en el móvil, en vertical, se pausa
  if (!pausa) tiempo += dt;
  if (estado === 'jugando' && !pausa && congelado > 0) {   // parón de un instante al golpear
    congelado -= dt; acumulado = 0;
  } else if (estado === 'jugando' && !pausa) {
    acumulado += dt;
    while (acumulado >= PASO && estado === 'jugando') { paso(PASO); acumulado -= PASO; }
  } else {
    acumulado = 0;
  }
  dibujar();
  requestAnimationFrame(bucle);
}

cargarNivel(nivelElegido, true);
elAviso.classList.add('oculto');
requestAnimationFrame(bucle);

// Ganchos para pruebas desde la consola
window.bitJuego = {
  get bit() { return bit; }, get estado() { return estado; }, get monedas() { return monedas; },
  get mapa() { return mapa; }, get bateria() { return bateria; }, get enemigos() { return enemigos; },
  get proyectiles() { return proyectiles; }, get controles() { return controles; }, get mejora() { return mejora; },
  get niveles() { return NIVELES.length; }, get partida() { return partida; },
  darMejora(t) { aplicarMejora(t); },
  entrada(accion, abajo) { if (abajo) { if (!pulsadas.has(accion)) pedidas.add(accion); pulsadas.add(accion); } else pulsadas.delete(accion); },
  jugar(i, opciones = {}) {
    opcionesPrueba = opciones; nuevaPartida(i);
  }
};
