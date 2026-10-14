// Salvataggio dei progressi permanenti nel browser (localStorage).
// Se il browser lo blocca (navigazione privata, ecc.) il gioco funziona lo stesso,
// semplicemente non ricorda nulla.
import type { Meta } from './types.js';

const KEY = 'otd-v2-meta';

export function defaultMeta(): Meta {
  return { buoni: 0, best: 0, runs: 0, levels: {} };
}

export function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    return { ...defaultMeta(), ...JSON.parse(raw) } as Meta;
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: Meta): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(meta));
  } catch {
    // niente da fare: il salvataggio non è disponibile
  }
}
