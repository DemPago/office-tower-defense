// Classifica: online su Supabase se configurata (src/config.js), altrimenti solo locale.
// Ogni punteggio viene salvato anche in locale, così la classifica funziona pure offline.
import { SUPABASE } from './config.js';

const LOCAL_KEY = 'otd-v2-scores';
const INITIALS_KEY = 'otd-v2-initials';
const online = !!(SUPABASE.url && SUPABASE.key);

// ─── Locale ─────────────────────────────────────────────────────

function sortScores(rows) {
  return rows.sort((a, b) => b.wave - a.wave || b.kills - a.kills || a.ts - b.ts);
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal(row) {
  const rows = sortScores([...loadLocal(), row]).slice(0, 50);
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  } catch {
    // salvataggio non disponibile
  }
  return rows.indexOf(row) + 1; // posizione in classifica
}

export function lastInitials() {
  try {
    return localStorage.getItem(INITIALS_KEY) || 'AAA';
  } catch {
    return 'AAA';
  }
}

// ─── Online (API REST di Supabase) ──────────────────────────────

function headers(extra = {}) {
  const h = { apikey: SUPABASE.key, 'Content-Type': 'application/json', ...extra };
  // Le vecchie chiavi "anon" sono JWT (iniziano con eyJ) e vanno anche in Authorization.
  if (SUPABASE.key.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE.key}`;
  return h;
}

async function fetchOnline(limit) {
  const url = `${SUPABASE.url}/rest/v1/scores?select=id,initials,wave,kills,bosses&order=wave.desc,kills.desc,created_at.asc&limit=${limit}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error('Classifica non disponibile: ' + res.status);
  return res.json();
}

async function submitOnline(row) {
  const res = await fetch(`${SUPABASE.url}/rest/v1/scores?select=id`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify({ initials: row.initials, wave: row.wave, kills: row.kills, bosses: row.bosses }),
  });
  if (!res.ok) throw new Error('Invio non riuscito: ' + res.status);
  const [saved] = await res.json();
  // Posizione: quanti punteggi sono migliori del nostro, più uno.
  const better = `or=(wave.gt.${row.wave},and(wave.eq.${row.wave},kills.gt.${row.kills}))`;
  const countRes = await fetch(`${SUPABASE.url}/rest/v1/scores?select=id&${better}`, {
    method: 'HEAD',
    headers: headers({ Prefer: 'count=exact' }),
  });
  const total = (countRes.headers.get('content-range') || '').split('/')[1];
  return { id: saved?.id, rank: total ? Number(total) + 1 : null };
}

// ─── API usata dal gioco ────────────────────────────────────────

// Restituisce { source: 'online' | 'locale', rows: [...] }
export async function getTop(limit = 10) {
  if (online) {
    try {
      return { source: 'online', rows: await fetchOnline(limit) };
    } catch {
      // senza rete si mostra quella locale
    }
  }
  return { source: 'locale', rows: loadLocal().slice(0, limit) };
}

// Salva il punteggio. Restituisce { rank, id, ts, source }.
export async function submitScore({ initials, wave, kills, bosses }) {
  try {
    localStorage.setItem(INITIALS_KEY, initials);
  } catch {
    // niente
  }
  const row = { initials, wave, kills, bosses, ts: Date.now() };
  const localRank = saveLocal(row);
  if (online) {
    try {
      const { id, rank } = await submitOnline(row);
      return { id, rank, ts: row.ts, source: 'online' };
    } catch {
      // se l'invio fallisce resta salvato in locale
    }
  }
  return { rank: localRank, ts: row.ts, source: 'locale' };
}

export const isOnline = online;
