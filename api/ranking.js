// Ranking mundial de Bit.exe — función de Vercel (Node, sin dependencias).
// GET  /api/ranking        → { top: [{ nombre, puntos, mundo, nivel }] } (los 10 mejores)
// POST /api/ranking  JSON  { nombre, puntos, nivel } → { top, puesto }
// Guarda los datos en Upstash Redis (gratis). Variables de entorno que crea la integración
// de Upstash en Vercel: KV_REST_API_URL y KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL/TOKEN).

const CLAVE = 'bitexe:ranking:m1';
const TOP = 10, GUARDAR = 200;
const MAX_PUNTOS = 200000;              // más que esto no se puede hacer en el mundo 1
const recientes = new Map();            // freno sencillo: una puntuación cada 20 s por IP

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_DB = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(comandos) {
  const r = await fetch(URL_DB + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN_DB, 'Content-Type': 'application/json' },
    body: JSON.stringify(comandos)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map(x => x.result);
}

async function leerTop() {
  const [lista] = await redis([['ZREVRANGE', CLAVE, '0', String(TOP - 1), 'WITHSCORES']]);
  const top = [];
  for (let i = 0; i < lista.length; i += 2) {
    let e; try { e = JSON.parse(lista[i]); } catch (err) { continue; }
    top.push({ nombre: e.n, puntos: Number(lista[i + 1]), mundo: 1, nivel: e.l, id: e.i });
  }
  return top;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN_DB) return res.status(503).json({ error: 'ranking sin configurar' });
  try {
    if (req.method === 'GET') return res.status(200).json({ top: (await leerTop()).map(({ id, ...e }) => e) });
    if (req.method !== 'POST') return res.status(405).json({ error: 'método no permitido' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
    const ahora = Date.now();
    if (ahora - (recientes.get(ip) || 0) < 20000) return res.status(429).json({ error: 'espera un poco' });

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const nombre = String(b.nombre || '').toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚÜ _.-]/g, '').trim().slice(0, 10) || 'BIT';
    const puntos = Math.floor(Number(b.puntos));
    const nivel = Math.floor(Number(b.nivel));
    if (!(puntos > 0 && puntos <= MAX_PUNTOS) || !(nivel >= 1 && nivel <= 20) || puntos % 10 !== 0)
      return res.status(400).json({ error: 'puntuación no válida' });
    recientes.set(ip, ahora);

    const id = ahora.toString(36) + Math.random().toString(36).slice(2, 6);
    const miembro = JSON.stringify({ n: nombre, l: nivel, i: id });
    await redis([['ZADD', CLAVE, String(puntos), miembro], ['ZREMRANGEBYRANK', CLAVE, '0', String(-GUARDAR - 1)]]);
    const [rango] = await redis([['ZREVRANK', CLAVE, miembro]]);
    const top = await leerTop();
    return res.status(200).json({ top: top.map(({ id: x, ...e }) => e), puesto: rango === null ? -1 : rango });
  } catch (err) {
    return res.status(500).json({ error: 'error del ranking' });
  }
};
