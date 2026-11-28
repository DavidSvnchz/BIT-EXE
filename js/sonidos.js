// ==========================================================================
// SONIDOS — efectos de 8 bits sintetizados con Web Audio (no hay archivos de audio).
// sonido('salto'), sonido('moneda')… Cada efecto es una lista de notas con forma de onda,
// frecuencia inicial y final, duración y volumen; 'ruido' es ruido blanco filtrado.
// Comparte el AudioContext de la música si existe. Se activan/silencian en Ajustes › Sonido.
// Usa: musica.js (musica.ac, volumen).
// ==========================================================================

const botonEfectos = document.getElementById('botonEfectos');
const efectos = {
  activos: true, ac: null, salida: null, ruido: null,
  contexto() {
    if (this.ac) return this.ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.ac = musica.ac || new AC();
    this.salida = this.ac.createGain();
    this.salida.connect(this.ac.destination);
    // 1 s de ruido blanco reutilizable
    const n = this.ac.sampleRate, b = this.ac.createBuffer(1, n, n), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.ruido = b;
    return this.ac;
  },
  aplicar() {
    botonEfectos.textContent = this.activos ? 'SÍ' : 'NO';
    botonEfectos.setAttribute('aria-pressed', String(this.activos));
  },
  guardar() { try { localStorage.setItem('bit-efectos', this.activos ? '1' : '0'); } catch (err) {} }
};
try { efectos.activos = localStorage.getItem('bit-efectos') !== '0'; } catch (err) {}
efectos.aplicar();
botonEfectos.addEventListener('click', () => { efectos.activos = !efectos.activos; efectos.guardar(); efectos.aplicar(); sonido('menu'); });

// [onda, frecuencia inicial, frecuencia final, duración (s), volumen, retraso (s)]
const SONIDOS = {
  salto:     [['square', 220, 520, 0.11, 0.18]],
  disparo:   [['square', 900, 520, 0.06, 0.12]],
  rafaga:    [['sawtooth', 700, 300, 0.07, 0.12]],
  laser:     [['sawtooth', 1400, 180, 0.22, 0.16], ['ruido', 3000, 800, 0.15, 0.10]],
  tajo:      [['ruido', 5000, 900, 0.12, 0.18], ['triangle', 500, 200, 0.08, 0.10]],
  moneda:    [['square', 988, 988, 0.05, 0.10], ['square', 1319, 1319, 0.10, 0.10, 0.05]],
  impacto:   [['square', 300, 120, 0.05, 0.12]],
  bloqueo:   [['triangle', 1200, 1100, 0.04, 0.12]],
  muere:     [['ruido', 2500, 200, 0.18, 0.20], ['square', 400, 60, 0.18, 0.12]],
  herido:    [['ruido', 1200, 200, 0.2, 0.22], ['square', 180, 70, 0.25, 0.18]],
  escudo:    [['triangle', 600, 1200, 0.1, 0.14], ['triangle', 900, 1800, 0.08, 0.08, 0.05]],
  mejora:    [['square', 523, 523, 0.07, 0.12], ['square', 659, 659, 0.07, 0.12, 0.07], ['square', 784, 784, 0.07, 0.12, 0.14], ['square', 1047, 1047, 0.14, 0.12, 0.21]],
  bateria:   [['triangle', 440, 880, 0.12, 0.16], ['triangle', 660, 1320, 0.16, 0.14, 0.1]],
  teleporte: [['sine', 1500, 200, 0.14, 0.16], ['ruido', 6000, 2000, 0.1, 0.06]],
  victoria:  [['square', 523, 523, 0.1, 0.12], ['square', 659, 659, 0.1, 0.12, 0.1], ['square', 784, 784, 0.1, 0.12, 0.2], ['square', 1047, 1047, 0.35, 0.13, 0.3]],
  derrota:   [['square', 392, 392, 0.15, 0.13], ['square', 330, 330, 0.15, 0.13, 0.16], ['square', 262, 200, 0.4, 0.13, 0.32]],
  jefe:      [['sawtooth', 110, 110, 0.25, 0.14], ['sawtooth', 147, 147, 0.25, 0.14, 0.3], ['sawtooth', 110, 110, 0.25, 0.14, 0.6]],
  fase2:     [['sawtooth', 200, 60, 0.5, 0.18], ['ruido', 800, 100, 0.4, 0.12]],
  explosion: [['ruido', 1500, 60, 0.9, 0.28], ['square', 120, 30, 0.8, 0.16], ['square', 523, 523, 0.12, 0.10, 0.9], ['square', 784, 784, 0.12, 0.10, 1.0], ['square', 1047, 1047, 0.4, 0.11, 1.1]],
  menu:      [['square', 660, 660, 0.04, 0.08]],
  soltar:    [['triangle', 800, 1600, 0.08, 0.12, 0.08], ['triangle', 1200, 2400, 0.1, 0.10, 0.16]],
};

function sonido(nombre) {
  if (!efectos.activos) return;
  const notas = SONIDOS[nombre];
  if (!notas) return;
  const ac = efectos.contexto();
  if (!ac || ac.state !== 'running') { if (ac) ac.resume().catch(() => {}); return; }
  efectos.salida.gain.value = 0.35 + musica.volumen * 0.65;
  const ahora = ac.currentTime;
  for (const [onda, f0, f1, dur, vol, retraso = 0] of notas) {
    const t0 = ahora + retraso, g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    g.connect(efectos.salida);
    let fuente;
    if (onda === 'ruido') {
      fuente = ac.createBufferSource(); fuente.buffer = efectos.ruido;
      const filtro = ac.createBiquadFilter(); filtro.type = 'bandpass'; filtro.Q.value = 1.2;
      filtro.frequency.setValueAtTime(f0, t0);
      filtro.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
      fuente.connect(filtro); filtro.connect(g);
    } else {
      fuente = ac.createOscillator(); fuente.type = onda;
      fuente.frequency.setValueAtTime(f0, t0);
      if (f1 !== f0) fuente.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      fuente.connect(g);
    }
    fuente.start(t0); fuente.stop(t0 + dur + 0.02);
  }
}
// Los gestos que activan la música también despiertan los efectos (móviles)
for (const tipo of ['touchend', 'pointerup', 'click', 'keydown']) {
  addEventListener(tipo, () => { const ac = efectos.contexto(); if (ac && ac.state !== 'running') ac.resume().catch(() => {}); }, { capture: true, passive: true });
}

// ---------- Sensación de golpe: sacudida, parón y destello ----------
let fuerzaTemblor = 3, congelado = 0, destello = 0, colorDestello = PAL.crema;
function sacudir(segundos, fuerza = 3) { fuerzaTemblor = temblor > 0 ? Math.max(fuerzaTemblor, fuerza) : fuerza; temblor = Math.max(temblor, segundos); }
function congelar(segundos) { congelado = Math.max(congelado, segundos); }
function destellar(segundos, color = PAL.crema) { destello = segundos; colorDestello = color; }
