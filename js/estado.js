// ==========================================================================
// ESTADO — las variables que cambian mientras se juega.
// Nivel actual, mapa en memoria, batería, mejora, Bit, listas de enemigos/proyectiles/efectos,
// cámara, reloj y la partida (puntos y monedas acumuladas).
// Las modifican partida.js, bit.js y enemigos.js; las leen dibujo.js e interfaz.js.
// Usa: configuracion.js, niveles.js.
// ==========================================================================

let estado = 'inicio';            // 'inicio' | 'jugando' | 'victoria' | 'derrota'
let nivelActual = 0, nivelElegido = 0, nivelMaximo = 0;
let mapa, filas, cols, totalMonedas, monedas;
let bateria = BATERIA.inicial;
let mejora = null;                // null | 'enchufe' | 'laser' | 'escudo' | 'espada'
let golpesEscudo = 0;
let bit;
let enemigos = [], proyectiles = [], rayos = [], particulas = [], fantasmas = [];
let objetoCerca = null;           // mejora distinta que Bit está tocando (para "Coger")
let camX = 0, camY = 0, temblor = 0;
let tiempo = 0, tiempoFin = 0, avisoJaula = -9;
// La partida dura desde que empiezas hasta quedarte sin batería o ganar el último nivel
let partida = { puntos: 0, monedas: 0, proximaVida: MONEDAS.porVida };
let textos = [];   // puntos flotantes
let esperandoNombre = false, finDePartida = false;
let opcionesPrueba = {};

try { nivelMaximo = Math.min(NIVELES.length - 1, Math.max(0, parseInt(localStorage.getItem('bit-progreso')) || 0)); } catch (err) {}
nivelElegido = nivelMaximo;
