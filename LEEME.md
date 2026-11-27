# Bit.exe

Juego de plataformas en pixel art protagonizado por Bit.

Este paquete trae a Bit, la música y la idea del juego para seguir con él en otro chat.

## Cómo usarlo
1. Abre un chat nuevo.
2. Sube este zip (`juego-bit.zip`).
3. Pega el texto del apartado **"Texto para empezar"** de más abajo.

## Qué hay dentro

| Carpeta / archivo | Qué es |
|---|---|
| `bit/bit-1.svg` … `bit-8.svg` | Los 8 fotogramas de Bit corriendo, dibujados en SVG (24×24 px). |
| `bit/bit-1.png` … `bit-8.png` | Los mismos fotogramas en PNG transparente. |
| `bit/bit-sprite.png` | Los 8 fotogramas en una tira de 192×24 px (fotograma *n* empieza en x = (n‑1)·24). |
| `bit/bit-animado.gif` | La animación de correr en bucle, ampliada ×6, para verla rápido. |
| `musica/musica-bucle.ogg` y `.mp3` | Música tipo 8 bits de 15 s, mono, preparada para sonar en bucle sin corte. |
| `musica/generar-musica.sh` | El comando de FFmpeg que genera la música, por si hay que cambiar notas o tempo. |
| `fondos/hero-fondo.png` | Ilustración de 192×108 px de una ciudad de noche con máquinas recreativas y un trofeo (sirve de referencia o de fondo). |
| `fondos/icono-*.png` | 4 iconos de 16×16 (balón, guante, kart, diana) que pueden servir de objetos coleccionables. |

## Bit
Un pequeño robot verde lima con pantalla oscura en la cara, ojos cian, boca fucsia y una antena que cambia de color. Es el protagonista de Bit.exe.

- Tamaño: 24×24 px; el cuerpo ocupa aprox. de x = 4 a x = 19 y de y = 2 a y = 20 (hay margen transparente).
- Los 8 fotogramas son un ciclo de carrera: piernas y brazos alternan, el cuerpo sube y baja hasta 2 px, la antena alterna fucsia/dorado y en el fotograma 6 parpadea.
- Estando quieto se puede usar el fotograma 1; para el salto, el 3 (cuerpo más alto, piernas abiertas).
- Siempre se escala sin suavizar (pixel art): en canvas `imageSmoothingEnabled = false`, en CSS `image-rendering: pixelated`.

## Paleta (no usar colores fuera de esta lista)

| Nombre | Hex | Uso sugerido en el juego |
|---|---|---|
| Noche | `#120F1F` | Fondo / cielo |
| Tinta | `#1E1A33` | Edificios lejanos, plataformas de fondo |
| Tinta 2 | `#2C264A` | Bloques, sombras |
| Lima | `#C8F135` | Bit, bordes de plataforma, botones |
| Fucsia | `#FF3D7F` | Peligros, sombras "pixel" de textos |
| Cian | `#33D6E6` | Monedas / datos / interfaz |
| Dorado | `#FFC43D` | Medallas, meta, premios |
| Crema | `#F3EEE3` | Texto |
| Gris | `#A9A3C2` | Texto secundario, estrellas |

Tipografía de la marca: **Anton** para títulos (Google Fonts, licencia SIL OFL).

## La idea del juego
Plataformas de scroll lateral en el que Bit corre por los tejados de una ciudad de noche hasta llegar a la medalla dorada de cada nivel.

**Versión mínima (lo primero):**
- Al principio era un solo `index.html`; ahora está dividido en archivos (ver «Cómo está organizado el código»). Sigue sin librerías.
- Resolución interna pequeña (por ejemplo 320×180) escalada al tamaño de la ventana sin suavizar.
- Bucle de juego con `requestAnimationFrame`.
- Física simple: gravedad, salto con Espacio/↑/W, movimiento con ←/→ o A/D.
- Nivel definido como una matriz de casillas de 16×16 (0 = aire, 1 = suelo, 2 = moneda, 3 = pinchos, 9 = medalla).
- Colisiones con las casillas de suelo; la cámara sigue a Bit.
- Animación de correr con los 8 fotogramas de `bit-sprite.png`; fotograma 1 parado y 3 en el aire; voltear el sprite cuando va a la izquierda.
- Recoger monedas (contador en pantalla) y llegar a la medalla para ganar. Si toca pinchos o cae al vacío, vuelve al inicio del nivel.
- Música en bucle (`musica-bucle.ogg`, con `.mp3` de respaldo) que empiece con la primera tecla o toque, porque los navegadores bloquean el sonido automático. Botón para silenciar.
- Fondo con estrellas y edificios en la paleta, con un poco de parallax.

**Ampliaciones (después):**
- Controles táctiles en pantalla para el móvil.
- Enemigos sencillos que patrullan.
- Coyote time y salto con buffer para que se sienta mejor.
- Varios niveles, pantalla de inicio y pantalla de victoria con la medalla.
- Los 4 iconos (balón, guante, kart, diana) como objetos especiales, uno por cada modalidad del torneo.

## Texto para empezar
Copia y pega esto en el chat nuevo después de subir el zip:

> Te paso un zip con los recursos de Bit, la mascota de un proyecto web: 8 fotogramas de carrera en SVG y PNG (24×24 px), una tira sprite de 192×24, música 8 bits en bucle y una ilustración de fondo. En el archivo LEEME.md está la idea completa, la paleta de colores y lo que quiero. Quiero un juego de plataformas en un solo index.html con canvas y JavaScript sin librerías, empezando por la "versión mínima" que describe el LEEME. Usa los recursos del zip tal cual (sprite, música y colores de la paleta) y mantén el estilo pixel art sin suavizado. Cuando lo tengas, explícame brevemente cómo está organizado el código y cómo añadir niveles.

## Cómo está organizado el código

Abre `index.html` con doble clic y funciona (no hace falta servidor). Ese archivo solo tiene el HTML
(marcador, paneles, ajustes) y carga los estilos y 13 scripts **en este orden**: cada uno usa lo que
cargan los anteriores. Cada archivo empieza con un comentario que explica qué contiene y de qué depende.

```
index.html              HTML: marcador, pantalla de inicio, paneles de fin, ranking y ajustes
css/estilos.css         todos los estilos
js/
  configuracion.js      ← EMPIEZA AQUÍ: todos los números del juego (física, armas, enemigos, puntos…)
  niveles.js            los mapas del mundo 1 (solo datos)
  graficos.js           lienzo, pixel art, skins de Bit, sprites de enemigos y fondos
  estado.js             variables que cambian al jugar (nivel, batería, Bit, enemigos, partida…)
  controles.js          acciones, teclas configurables, teclado y ratón
  musica.js             música en bucle
  interfaz.js           ajustes, marcador, avisos, selector de nivel, ranking
  fisica.js             casillas y colisiones
  enemigos.js           comportamiento, ataques y daño de los enemigos y del jefe
  bit.js                el personaje: movimiento, ataques, mejoras, daño
  partida.js            flujo: cargar nivel, puntos, monedas, victoria/derrota
  dibujo.js             pinta cada fotograma
  bucle.js              el bucle principal y el arranque
herramientas/
  generar_niveles.py    genera los niveles 2-20 dentro de js/niveles.js
bit/ musica/ fondos/    recursos originales
```

### Qué pasa en cada fotograma

```
bucle()  (bucle.js, ~60 veces por segundo)
 └─ paso(1/60)  (bucle.js)
     ├─ pasoBit()          bit.js       mover, saltar, atacar, recoger, pinchos, medalla
     ├─ pasoEnemigos()     enemigos.js  moverse, disparar, tocar a Bit → herir()
     ├─ pasoProyectiles()  enemigos.js  balas de todos → danarEnemigo() / herir()
     ├─ pasoEfectos()      bucle.js     rayos, partículas, puntos flotantes
     └─ centrarCamara()    bucle.js
 └─ dibujar()  (dibujo.js)   fondo → casillas → enemigos → Bit → disparos → partículas
```

La entrada no mueve nada directamente: `controles.js` apunta qué acciones están pulsadas
(`pulsadas`) o se acaban de pulsar (`pedidas`), y `pasoBit()` las lee en el siguiente paso.

### Recetas

**Cambiar la dificultad** → `js/configuracion.js`: `FISICA` (salto, velocidad), `BATERIA`, `MONEDAS`,
`ARMAS`, `ENEMIGOS` (vida, velocidad, cadencia), `PUNTOS`. Cada nivel tiene además su `dificultad` (0 a 1)
en `js/niveles.js`, que acelera a sus enemigos.

**Editar un nivel** → `js/niveles.js`. Una cadena por fila, un carácter por casilla:
`0` aire · `1` suelo · `2` moneda · `3` pinchos · `9` medalla · `4` patrullero · `K` blindado · `5` torreta ·
`7` torreta de ráfaga · `6` volador · `8` saltador · `H` cazador · `X` jefe · `B` batería extra ·
`E` enchufe · `L` láser · `C` campo de fuerza · `S` espada frame. Todas las filas deben medir lo mismo.

**Curva de dificultad** → los niveles 1-3 son de aprendizaje y el 20 es el del jefe. Del 4 al 9 hay de 10 a 15 enemigos;
del 10 al 19, de 18 a 32, con más pinchos, una sola mejora por nivel y batería extra solo cada 3 niveles. Desde el 12
(dificultad mayor que 1) los enemigos aguantan un golpe más. Esto lo hace la pasada «REFUERZO» de
`herramientas/generar_niveles.py`, que añade enemigos sin cambiar el recorrido.

**Añadir un nivel** → copia un bloque `{ nombre, dificultad, inicio, mapa }` en `js/niveles.js`.
Si es de los generados, cambia `herramientas/generar_niveles.py` y ejecuta `python3 herramientas/generar_niveles.py`.

**Añadir un tipo de enemigo** (4 sitios):
1. `configuracion.js`: su letra en `ENEMIGO_DE`, sus valores en `ENEMIGOS` y sus puntos en `PUNTOS`.
2. `graficos.js`: su dibujo con `dibujoPixel([...])`.
3. `enemigos.js`: un `case` en `crearEnemigo()` y su comportamiento en `pasoEnemigos()`.
4. `dibujo.js`: un `case` en `dibujarEnemigos()`.

**Añadir una mejora** (5 sitios):
1. `configuracion.js`: letra en `MEJORA_DE` y `LETRA_MEJORA`, nombre en `NOMBRE_MEJORA` y valores en `ARMAS`.
2. `graficos.js`: icono en `IMG_OBJETO`/`COLOR_OBJETO` y skin en `SKINS` + `SKIN_DE_MEJORA`.
3. `bit.js`: qué hace al atacar (`atacar()`) y al recibir un golpe (`herir()`).
4. `dibujo.js`: adornos de la skin en `dibujarBit()`.
5. `css/estilos.css`: color de la etiqueta `.mejora[data-tipo="…"]`.

**Añadir una acción o tecla** → `controles.js`: `ACCIONES` y `CONTROLES_POR_DEFECTO`; la tabla de Ajustes
se actualiza sola. Después léela en `pasoBit()` con `pulsadas.has('…')` o `pedidas.has('…')`.

**Cambiar textos** → los fijos están en `index.html`; los de victoria/derrota, en `terminar()` (`partida.js`).

**Probar desde la consola del navegador** (F12): `bitJuego.darMejora('laser')`, `bitJuego.jugar(19)`
(ir al nivel 1-20), `bitJuego.bateria`, `bitJuego.partida`…

**Mundo 2** → cuando llegue, lo natural será un `js/niveles-mundo2.js` con sus mapas y cambiar `MUNDO`
en `configuracion.js` para elegir entre mundos.

## Mundos
- Mundo 1 · La Red: los 20 niveles actuales (1-1 a 1-20), con el Arcade Corrupto como jefe final.
- Mundo 2: próximamente (en la pantalla de inicio aparece bloqueado). Al terminar el mundo 1, la historia lo anuncia.

## Historia
Unos virus se han escapado por la Red. Bit sale de ella para eliminarlos nivel a nivel, a través de cinco zonas
(La entrada, Ciudad Caché, Los archivos olvidados, Las profundidades y Hacia el núcleo), hasta derrotar al
Arcade Corrupto en El Núcleo, consiguiendo la medalla de cada nivel.

## Puntos, monedas y ranking (versión 4)
- Las monedas se acumulan durante toda la partida: cada 50, +1 batería (o +500 puntos si ya tienes 5).
- Cada batería perdida resta 10 monedas.
- Puntos: moneda 10 · patrullero y volador 100 · saltador y torreta 150 · blindado y cazador 200 ·
  torreta de ráfaga 250 · jefe 5000 · nivel superado 1000 + 250 por raya de batería que te quede.
- La partida termina al quedarte sin batería o al ganar el último nivel; entonces puedes guardar tu nombre
  en el ranking (top 10, guardado en el navegador). Botón RANKING en la pantalla de inicio.

## Estado del juego (versión 3)
- 20 niveles con dificultad creciente, selector de nivel y progreso guardado en el navegador.
- Batería de 3 rayas (máximo 5 con baterías extra). Sin batería: «¡SIN BATERÍA!».
- Mejoras (solo una a la vez; si tocas otra, la tecla «Coger» las cambia):
  - Enchufe (E): Bit rojo, ráfagas de 3 disparos rojos.
  - Cañón láser (L): Bit francotirador, rayo que atraviesa enemigos.
  - Campo de fuerza (C): Bit acorazado; aguanta 4 golpes sin gastar batería y al cuarto se rompe.
  - Espada frame (S): Bit negro de ojos rojos, espada violeta, teletransporte con doble toque de dirección (0,85 s) y cambio de arma.
  - Enchufe, láser y espada se pierden con un golpe, pero ese golpe no gasta batería.
- Enemigos: patrullero (4), blindado (K), torreta (5), torreta de ráfaga (7), volador (6), saltador (8), cazador (H) y el jefe Arcade Corrupto (X).
- Objetos en el mapa: B batería extra, E, L, C, S mejoras.
- Los niveles 2-20 se generan con `herramientas/generar_niveles.py` y están escritos en `js/niveles.js` como cadenas: se pueden editar a mano.
