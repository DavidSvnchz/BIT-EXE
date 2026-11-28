// ==========================================================================
// ANALÍTICA — Vercel Web Analytics (visitas, de dónde llegan) y eventos del juego.
// medir('nivel_superado', { nivel: '1-3' }) → aparece en Vercel › Analytics › Events.
// Si la analítica no está activada (o el juego se abre con doble clic), no hace nada.
// Usa: nada (se carga justo después de configuracion.js).
// ==========================================================================

window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
function medir(nombre, datos) {
  try { window.va('event', { name: nombre, data: datos || {} }); } catch (err) {}
}
