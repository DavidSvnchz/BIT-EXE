// ==========================================================================
// CONFIGURACIÓN — todos los números del juego en un solo sitio.
// Aquí se ajusta la dificultad sin tocar la lógica: física del salto, batería, armas, enemigos,
// puntos, monedas por vida extra… y los códigos de casilla que usan los mapas.
// Usa: nada (es lo primero que se carga).
// ==========================================================================

// ============================================================
// CONSTANTES: paleta, tamaños, casillas, física y equilibrio
// ============================================================
const PAL = {
  noche:'#120F1F', tinta:'#1E1A33', tinta2:'#2C264A', lima:'#C8F135', fucsia:'#FF3D7F',
  cian:'#33D6E6', dorado:'#FFC43D', crema:'#F3EEE3', gris:'#A9A3C2',
  // solo para las skins de las mejoras
  rojo:'#E8323C', rojoOscuro:'#7A1626', rojoVivo:'#FF2B2B', violeta:'#9B4DFF', violetaOscuro:'#4B2287',
  negro:'#0B0B10', acero:'#6F6A8E'
};
const ANCHO = 320, ALTO = 180;   // resolución interna
const T = 16;                    // tamaño de casilla

// Casillas del mapa (un carácter por casilla)
const AIRE = '0', SUELO = '1', MONEDA = '2', PINCHOS = '3', MEDALLA = '9';   // la medalla es la meta de cada nivel
const ENEMIGO_DE = { '4': 'patrullero', '5': 'torreta', '6': 'volador', '7': 'rafaga', '8': 'saltador', 'K': 'blindado', 'H': 'cazador', 'X': 'jefe' };
const MEJORA_DE = { 'E': 'enchufe', 'L': 'laser', 'C': 'escudo', 'S': 'espada' };
const LETRA_MEJORA = { enchufe: 'E', laser: 'L', escudo: 'C', espada: 'S' };
const BATERIA_EXTRA = 'B';
const NOMBRE_MEJORA = { enchufe: 'ENCHUFE', laser: 'CAÑÓN LÁSER', escudo: 'CAMPO DE FUERZA', espada: 'ESPADA FRAME' };

const FISICA = {
  gravedad: 900, salto: 310, cortarSalto: 110,
  velMax: 95, acel: 900, frenado: 1100, acelAire: 600, caidaMax: 420
};
const BATERIA = { inicial: 3, maxima: 5 };   // rayas de batería
const MONEDAS = { porVida: 50, perdidaPorBateria: 10 };   // cada 50: +1 batería; cada batería perdida: −10
const PUNTOS = {
  moneda: 10, nivel: 1000, porRaya: 250, vidaConBateriaLlena: 500,
  patrullero: 100, volador: 100, saltador: 150, torreta: 150, blindado: 200, rafaga: 250, cazador: 200, jefe: 5000
};
const RANKING_MAX = 10;
const MUNDO = { numero: 1, nombre: 'La Red' };   // el mundo 2 llegará próximamente
const etiqueta = i => MUNDO.numero + '-' + (i + 1);   // «1-5» = mundo 1, nivel 5
const INVENCIBLE = 1.2;                       // segundos sin daño tras un golpe

const ARMAS = {
  normal:  { vel: 240, recarga: 0.28, maxEnPantalla: 3 },          // disparo lima
  enchufe: { vel: 260, recarga: 0.50, balas: 3, entreBalas: 0.07 }, // ráfaga de 3 rojos
  laser:   { recarga: 0.55, dano: 2, alcance: 300 },                // rayo que atraviesa
  espada:  { recarga: 0.32, dano: 2, duracion: 0.24 },              // tajo violeta
};
// Al morir, cada virus (no el jefe) puede soltar una mejora al azar distinta de la que llevas
const DROP = { probabilidad: 0.08 };
const ESCUDO = { golpesMax: 4 };   // el campo de fuerza para 4 golpes sin gastar batería y luego se rompe
const TELETRANSPORTE = { ventana: 0.85, distancia: 64, recarga: 0.35 };   // 64 px ≈ lo que alcanza un salto

// Enemigos. Cada nivel tiene "dificultad" (0 a 1) que los acelera.
const ENEMIGOS = {
  patrullero: { vida: 1, vel: 30 },
  blindado:   { vida: 3, vel: 22 },
  torreta:    { vida: 2, cadencia: 2.2, velBala: 100, alcanceX: 150, alcanceY: 48 },
  rafaga:     { vida: 3, cadencia: 2.8, velBala: 110, balas: 3, alcanceX: 170, alcanceY: 48 },
  volador:    { vida: 1, vel: 40, recorrido: 40 },
  saltador:   { vida: 2, espera: 1.3, salto: 260, vel: 70, alcance: 130 },
  cazador:    { vida: 2, vel: 45, alcance: 140 },
  jefe:       { vida: 30, cadencia: 1.5, velBala: 105, recorrido: 48, alcance: 170 },
};

const CAJA = { ancho: 10, alto: 16, dx: -7, dy: -5 };   // caja de Bit dentro del sprite 24×24
