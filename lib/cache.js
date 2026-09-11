const memory = globalThis.__streamhub_cache || new Map();
globalThis.__streamhub_cache = memory;
export async function cached(key, loader, ttl = Number(process.env.CACHE_TTL || 300)) {
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && hit.expires > now) return { data: hit.data, cached: true };
  if (hit?.promise) return { data: await hit.promise, cached: false };
  const promise = loader();
  memory.set(key, { promise, expires: now + ttl * 1000 });
  try { const data = await promise; memory.set(key, { data, expires: Date.now() + ttl * 1000 }); return { data, cached: false }; }
  catch (e) { memory.delete(key); throw e; }
}
