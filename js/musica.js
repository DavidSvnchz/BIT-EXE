// ==========================================================================
// MÚSICA — bucle de musica/musica-bucle.ogg (o .mp3).
// Con página servida por http usa Web Audio (bucle sin cortes); abierta con doble clic usa <audio>.
// Empieza con la primera tecla o clic (los navegadores no dejan sonar nada antes).
// Usa: los controles del apartado Sonido de index.html.
// ==========================================================================

// ============================================================
// MÚSICA en bucle (empieza con la primera tecla o clic)
// ============================================================
const elAudio = document.getElementById('musica');
const botonMusica = document.getElementById('botonMusica');
const sliderVolumen = document.getElementById('volumen');
const musica = {
  iniciada: false, silenciada: false, volumen: 0.5,
  ac: null, ganancia: null, modo: null,

  iniciar() {
    if (this.iniciada) { this.desbloquear(); return; }
    this.iniciada = true;
    // iPhone: que suene como música aunque el móvil esté en silencio (Safari 17+)
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (err) {}
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && location.protocol !== 'file:') {   // Web Audio: bucle sin cortes
      try {
        this.ac = new AC();
        this.ganancia = this.ac.createGain();
        this.ganancia.connect(this.ac.destination);
        this.modo = 'webaudio';
        this.aplicar();
        this.ac.resume();
        const url = elAudio.canPlayType('audio/ogg; codecs="vorbis"') ? 'musica/musica-bucle.ogg' : 'musica/musica-bucle.mp3';
        fetch(url)
          .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
          .then(datos => new Promise((ok, mal) => this.ac.decodeAudioData(datos, ok, mal)))
          .then(buffer => {
            const fuente = this.ac.createBufferSource();
            fuente.buffer = buffer; fuente.loop = true;
            fuente.connect(this.ganancia); fuente.start();
          })
          .catch(() => this.usarElemento());
        return;
      } catch (err) {}
    }
    this.usarElemento();
  },
  // Los móviles solo dejan arrancar el sonido en ciertos gestos (al levantar el dedo,
  // un clic, una tecla): si quedó en pausa, se reanuda en el siguiente.
  desbloquear() {
    if (this.ac && this.ac.state !== 'running') this.ac.resume().catch(() => {});
    if (this.modo === 'elemento' && elAudio.paused && !document.hidden) elAudio.play().catch(() => {});
  },
  usarElemento() {
    this.modo = 'elemento';
    this.aplicar();
    const p = elAudio.play();
    if (p) p.catch(() => { this.iniciada = false; });
  },
  aplicar() {
    if (this.ganancia) this.ganancia.gain.value = this.silenciada ? 0 : this.volumen;
    elAudio.volume = this.volumen;
    elAudio.muted = this.silenciada;
    botonMusica.textContent = this.silenciada ? 'NO' : 'SÍ';
    botonMusica.setAttribute('aria-pressed', String(!this.silenciada));
    sliderVolumen.value = Math.round(this.volumen * 100);
  },
  guardar() {
    try { localStorage.setItem('bit-sonido', JSON.stringify({ silenciada: this.silenciada, volumen: this.volumen })); } catch (err) {}
  },
  alternar() { this.silenciada = !this.silenciada; this.guardar(); this.aplicar(); },
  cambiarVolumen(v) { this.volumen = v; this.guardar(); this.aplicar(); }
};
try {
  const s = JSON.parse(localStorage.getItem('bit-sonido'));
  if (s) { musica.silenciada = !!s.silenciada; if (typeof s.volumen === 'number') musica.volumen = s.volumen; }
} catch (err) {}
musica.aplicar();
botonMusica.addEventListener('click', () => { musica.alternar(); musica.iniciar(); });
// Gestos que los navegadores aceptan para activar el sonido (en el móvil, al levantar el dedo)
for (const tipo of ['touchend', 'pointerup', 'click', 'keydown']) {
  addEventListener(tipo, () => musica.iniciar(), { capture: true, passive: true });
}
sliderVolumen.addEventListener('input', () => { musica.cambiarVolumen(sliderVolumen.value / 100); musica.iniciar(); });
document.addEventListener('visibilitychange', () => {
  if (!musica.iniciada) return;
  if (musica.modo === 'webaudio' && musica.ac) document.hidden ? musica.ac.suspend() : musica.ac.resume();
  else if (musica.modo === 'elemento') document.hidden ? elAudio.pause() : elAudio.play().catch(() => {});
});
