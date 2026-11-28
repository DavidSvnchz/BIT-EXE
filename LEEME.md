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
(marcador, paneles, ajustes) y carga los estilos y 23 scripts **en este orden**: cada uno usa lo que
cargan los anteriores. Cada archivo empieza con un comentario que explica qué contiene y de qué depende.

```
index.html              HTML: marcador, pantalla de inicio, paneles de fin, ranking y ajustes
css/estilos.css         todos los estilos
js/
  configuracion.js      ← EMPIEZA AQUÍ: todos los números del juego (física, armas, enemigos, puntos…)
  analitica.js          medir('evento') → Vercel Analytics
  niveles.js            los mapas del mundo 1 (solo datos)
  graficos.js           lienzo, pixel art, skins de Bit, sprites de enemigos y fondos
  zonas.js              ambiente de cada zona: cielo, edificios, suelo y partículas
  estado.js             variables que cambian al jugar (nivel, batería, Bit, enemigos, partida…)
  controles.js          acciones, teclas configurables, teclado y ratón
  musica.js             música en bucle
  sonidos.js            efectos de 8 bits sintetizados + sacudida, parón y destello de los golpes
  interfaz.js           ajustes, marcador, avisos, selector de nivel, ranking
  fisica.js             casillas y colisiones
  enemigos.js           comportamiento, ataques y daño de los enemigos y del jefe
  tenientes.js          los 4 lugartenientes de Malware Smith (niveles 4, 8, 12 y 16)
  bit.js                el personaje: movimiento, ataques, mejoras, daño
  partida.js            flujo: cargar nivel, puntos, monedas, victoria/derrota
  historia.js           viñetas de la intro (antes del 1-1) y escena final del ascenso
  progreso.js           estrellas, cronómetro y récords, puntos de control y pausa
  dibujo.js             pinta cada fotograma
  tactil.js             controles táctiles para móvil
  mando.js              mando de consola en el PC (Xbox, PlayStation o genérico)
  tutorial.js           carteles «!» del 1-1 con pistas, y pausa del móvil en vertical
  app.js                instalar como app (PWA): botón INSTALAR y nota para iPhone
  bucle.js              el bucle principal y el arranque
sw.js                   service worker: el juego funciona sin conexión una vez abierto
manifest.webmanifest    datos de la app instalable (nombre, iconos, horizontal, pantalla completa)
vercel.json             cabeceras para sw.js y el manifest
iconos/                 iconos de la app
api/
  ranking.js            ranking mundial (función de Vercel + Upstash Redis)
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

**Curva de dificultad** → los niveles 1 y 2 son de aprendizaje y el 20 es el del jefe. El 3 tiene 9 enemigos; del 4 al 9
hay de 13 a 21; del 10 al 19, de 22 a 37, con más pinchos, una sola mejora por nivel y batería extra solo cada 3 niveles. Desde el 12
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

## Móvil
Con el móvil en vertical el juego se pausa y pide girarlo (animación). El juego detecta solo si se abre en un dispositivo táctil (o en cuanto se toca la pantalla) y muestra, mientras se juega, una cruceta casi transparente a la izquierda (◀ ▶ moverse, ▲ saltar, ▼ coger, doble toque ◀ ▶ teletransporte) y los botones A (saltar) y B (atacar) a la derecha; ⇄ (cambiar arma) aparece solo con la espada. En PC no cambia nada. Código: `js/tactil.js`.

## Mundos
- Mundo 1 · La Red: los 20 niveles actuales (1-1 a 1-20), con el Malware Smith como jefe final.
- Mundo 2: próximamente (en la pantalla de inicio aparece bloqueado). Al terminar el mundo 1, la historia lo anuncia.

## Historia
Bit es un antivirus: básicamente, un sheriff internáutico con un cañón láser. Trabaja de noche capturando
virus sueltos, esperando la Medalla al Honor que nunca llega. Su objetivo es Malware Smith, el capo más
buscado de la zona y prácticamente invencible. Con la ayuda del jugador, Bit cruza la Red nivel a nivel
(La entrada, Ciudad Caché, Los archivos olvidados, Las profundidades y Hacia el núcleo) hasta derrotarlo
en El Núcleo; entonces recibe por fin la Medalla al Honor y asciende a Sheriff Mayor de la Red.

- La intro (4 viñetas) sale sola la primera vez que se juega el 1-1 y siempre desde el botón HISTORIA.
  Textos en `VINETAS` (`js/historia.js`).
- El final (panel «¡ASCENDIDO!» con la animación de la medalla) está en `terminar()` y `mostrarAscenso()`.

## Tutorial del 1-1
Carteles «!» clavados en el suelo del 1-1; al acercarte sale una pista arriba (moverse, saltar, pinchos,
disparar, monedas, medalla). En PC usa tus teclas configuradas; en el móvil habla de la cruceta y de A/B.
Para cambiarlas: `PISTAS_NIVEL1` en `js/tutorial.js` (`col` = columna del cartel; negativa = antes de la medalla).

## Zonas y lugartenientes
Cada zona tiene su ambiente (`ZONAS` en `js/zonas.js`): 1-4 La entrada (la noche de siempre), 5-8 Ciudad Caché
(azul, lluvia), 9-12 Los archivos olvidados (sepia, polvo), 13-16 Las profundidades (verde azulado, burbujas) y
17-20 Hacia el núcleo (rojo, brasas). Cada zona termina con un lugarteniente de Malware Smith que enjaula la medalla:
**Troyano** (1-4, salta y dispara a ras de suelo), **Spambot** (1-8, bombardea con correo basura y baja en picado),
**Gusano** (1-12, embiste) y **Ransomware** (1-16, blindado de frente: solo es vulnerable cuando se abre para disparar,
o con láser y espada). Vida y tamaños en `TENIENTES` (`js/tenientes.js`); 1500 puntos cada uno.

## Estrellas, récords, puntos de control y pausa
- **3 estrellas por nivel**: superarlo · todas las monedas · sin recibir ningún golpe. Se ven en el selector de nivel
  (con tu récord de tiempo), el total en el menú (★ x / 60) y se celebran al superar el nivel.
- **Cronómetro** en el marcador; el mejor tiempo de cada nivel se guarda.
- **Puntos de control**: banderas en los niveles de 140 casillas o más (dos desde 200). Si te quedas sin batería
  después de pasar una, vuelves a ella con 1 raya, sin mejora y −500 puntos. Cada bandera sirve una vez.
  Ajustes en `CONTROL` (`js/progreso.js`).
- **Pausa**: botón ❚❚ del marcador, tecla P o Start del mando. También se pausa sola al cambiar de pestaña o de app.

## App instalable (PWA)
Al abrirlo en el móvil (Chrome/Android) sale **INSTALAR LA APP** en el menú; en iPhone, una nota explica
«Compartir ▸ Añadir a pantalla de inicio». Instalado se abre a pantalla completa, en horizontal y funciona sin
conexión. Importante al publicar cambios: el móvil enseña primero la versión guardada y descarga la nueva en
segundo plano (se ve la siguiente vez). Si cambias muchas cosas, sube `VERSION` en `sw.js` (`bitexe-v16` → `v17`)
y, si añades archivos, añádelos a `ARCHIVOS`.

## Mando (PC)
Conecta un mando y pulsa cualquier botón: el juego lo detecta y los textos pasan a hablar de botones.
- Por defecto: stick izquierdo o cruceta para moverse, A/✕ saltar, X/□ atacar, Y/△ cambiar arma,
  B/○ coger. La cruceta también salta (↑) y coge (↓). Start pausa (en la pausa: A/B continúan, Y abre Ajustes).
- En Ajustes › Controles hay una columna **Mando** para cambiarlos. Con el ratón: pulsa la casilla y luego el
  botón del mando. Solo con el mando: Start → Y (Ajustes) → RB (pestaña Controles) → ↑ ↓ elige fila → A → pulsa el botón nuevo
  (Start cancela) · X restablece · B cierra.
- En el ranking: A guarda con el último nombre (o «BIT»), B no guarda. Vibra al recibir golpes si el mando lo permite.

## Mejoras que sueltan los virus
Al morir, cada virus (no el jefe) tiene un 8 % de soltar una mejora al azar distinta de la que llevas; cae al suelo
que tenga debajo. Se cambia en `DROP.probabilidad` (`js/configuracion.js`).

## Sonido y sensación de golpe
- Efectos de 8 bits sintetizados en `js/sonidos.js` (no hay archivos): salto, disparos, láser, tajo, monedas,
  golpes, mejoras, jefe, victoria… Se activan o silencian en Ajustes › Sonido › Efectos de sonido.
  Para cambiar uno, edita su lista en `SONIDOS` (onda, frecuencia inicial y final, duración, volumen, retraso).
- `sacudir(segundos, fuerza)`, `congelar(segundos)` (parón de un instante) y `destellar(segundos, color)`
  dan peso a los golpes. Polvo al saltar/aterrizar y restos al eliminar virus: `polvo()` y `restos()` en `fisica.js`.

## Ranking mundial (Vercel + Upstash, gratis)
`api/ranking.js` guarda los 200 mejores en Upstash Redis y devuelve el top 10. Si no está configurado
(o el juego se abre con doble clic), el juego usa el ranking de este navegador como antes.
Para activarlo:
1. Vercel → tu proyecto → **Storage** → **Create** → **Upstash for Redis** (plan gratuito) → conéctalo al proyecto.
   Eso crea solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
2. **Deployments** → **Redeploy** (las variables nuevas solo llegan en un despliegue nuevo).
3. Comprueba que `https://bit-exe.vercel.app/api/ranking` responde `{"top":[]}`.
Protecciones: nombres limpiados (10 caracteres), puntos entre 10 y 200.000 y múltiplos de 10, nivel 1-20,
y una puntuación cada 20 s por IP. Si cambias los puntos en `configuracion.js`, revisa `MAX_PUNTOS`.

## Compartir y analítica
- Al acabar una partida, COMPARTIR abre el menú de compartir del móvil (o copia el enlace en el PC).
- `index.html` carga Vercel Web Analytics. Actívalo en Vercel → tu proyecto → **Analytics** → **Enable**.
  Verás visitas, países y de dónde llega la gente (TikTok incluido). Los eventos del juego
  (`partida_empezada`, `nivel_superado`, `sin_bateria`, `juego_completado`, `compartir`, `historia_vista`…)
  aparecen en la pestaña Events si tu plan de Vercel los incluye.

## Puntos, monedas y ranking (versión 4)
- Las monedas se acumulan durante toda la partida: cada 50, +1 batería (o +500 puntos si ya tienes 5).
- Cada batería perdida resta 10 monedas.
- Puntos: moneda 10 · patrullero y volador 100 · saltador y torreta 150 · blindado y cazador 200 ·
  torreta de ráfaga 250 · jefe 5000 · nivel superado 1000 + 250 por raya de batería que te quede.
- La partida termina al quedarte sin batería o al ganar el último nivel; entonces puedes guardar tu nombre
  en el ranking (top 10 mundial si está activado; si no, el del navegador). Botón RANKING en la pantalla de inicio.

## Estado del juego (versión 3)
- 20 niveles con dificultad creciente, selector de nivel y progreso guardado en el navegador.
- Batería de 3 rayas (máximo 5 con baterías extra). Sin batería: «¡SIN BATERÍA!».
- Mejoras (solo una a la vez; si tocas otra, la tecla «Coger» las cambia):
  - Enchufe (E): Bit rojo, ráfagas de 3 disparos rojos.
  - Cañón láser (L): Bit francotirador, rayo que atraviesa enemigos.
  - Campo de fuerza (C): Bit acorazado; aguanta 4 golpes sin gastar batería y al cuarto se rompe.
  - Espada frame (S): Bit negro de ojos rojos, espada violeta, teletransporte con doble toque de dirección (0,85 s) y cambio de arma.
  - Enchufe, láser y espada se pierden con un golpe, pero ese golpe no gasta batería.
- Enemigos: patrullero (4), blindado (K), torreta (5), torreta de ráfaga (7), volador (6), saltador (8), cazador (H) y el jefe Malware Smith (X).
- Objetos en el mapa: B batería extra, E, L, C, S mejoras.
- Los niveles 2-20 se generan con `herramientas/generar_niveles.py` y están escritos en `js/niveles.js` como cadenas: se pueden editar a mano.
