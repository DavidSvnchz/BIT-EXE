// Service worker de Bit.exe: guarda el juego en el móvil para que funcione sin conexión y cargue al instante.
// Estrategia: los archivos del juego se sirven desde la caché y se actualizan en segundo plano
// (la versión nueva se ve la siguiente vez que se abre). /api/ (ranking) va siempre por la red.
// Al publicar una versión con cambios grandes, sube VERSION para limpiar la caché antigua.
const VERSION = 'bitexe-v16';
const ARCHIVOS = [
  './',
  'index.html',
  'css/estilos.css',
  'manifest.webmanifest',
  'bit/bit-sprite.png',
  'musica/musica-bucle.ogg',
  'musica/musica-bucle.mp3',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/apple-touch-icon.png',
  'fondos/hero-fondo.png',
  'js/configuracion.js',
  'js/analitica.js',
  'js/niveles.js',
  'js/graficos.js',
  'js/zonas.js',
  'js/estado.js',
  'js/controles.js',
  'js/musica.js',
  'js/sonidos.js',
  'js/interfaz.js',
  'js/fisica.js',
  'js/enemigos.js',
  'js/tenientes.js',
  'js/bit.js',
  'js/partida.js',
  'js/historia.js',
  'js/progreso.js',
  'js/tactil.js',
  'js/mando.js',
  'js/tutorial.js',
  'js/app.js',
  'js/dibujo.js',
  'js/bucle.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;
  const propio = url.origin === location.origin, fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuentes) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const clave = e.request.mode === 'navigate' ? 'index.html' : e.request;
    const guardada = await cache.match(clave, { ignoreSearch: e.request.mode === 'navigate' });
    const red = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) cache.put(clave, r.clone());
      return r;
    }).catch(() => guardada);
    return guardada || red;
  }));
});
