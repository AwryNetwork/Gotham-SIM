const store = new Map();

export async function cached(key, ttlMs, fetcher) {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && now - hit.time < ttlMs) {
    return hit.value;
  }
  const value = await fetcher();
  store.set(key, { value, time: now });
  return value;
}
