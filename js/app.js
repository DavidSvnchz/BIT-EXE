// ==========================================================================
// APP — Bit.exe se puede instalar en el móvil (o en el PC) como una app: icono en la pantalla de
// inicio, pantalla completa en horizontal y funciona sin conexión (sw.js guarda los archivos).
// - Android/Chrome/Edge: aparece el botón INSTALAR LA APP en el menú.
// - iPhone/iPad (Safari no tiene botón): una nota explica «Compartir ▸ Añadir a pantalla de inicio».
// Usa: interfaz.js, analitica.js.
// ==========================================================================

const esApp = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let avisoInstalar = null;

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  avisoInstalar = e;
  if (!esApp) document.getElementById('cajaInstalar').hidden = false;
});
document.getElementById('instalar').addEventListener('click', async e => {
  e.currentTarget.blur();
  if (!avisoInstalar) return;
  avisoInstalar.prompt();
  const { outcome } = await avisoInstalar.userChoice;
  medir('instalar_app', { resultado: outcome });
  avisoInstalar = null;
  document.getElementById('cajaInstalar').hidden = true;
});
addEventListener('appinstalled', () => { document.getElementById('cajaInstalar').hidden = true; mostrarAviso('¡BIT.EXE INSTALADO!', 2); });
if (esIOS && !esApp) document.getElementById('avisoIOS').hidden = false;
if (esApp) { document.documentElement.classList.add('app'); medir('abre_app'); }
