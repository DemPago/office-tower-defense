// Pulsanti "Offrimi un caffè" (Ko-fi) e condivisione sui social.
// I link di condivisione sono normali indirizzi web: si aprono in una nuova scheda.
export const KOFI_URL = 'https://ko-fi.com/dem420156';
export const GAME_URL = 'https://dempago.github.io/office-tower-defense/';

const NETWORKS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', url: (t, u) => 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u) },
  { id: 'telegram', label: 'Telegram', icon: '✈️', url: (t, u) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { id: 'x',        label: 'X',        icon: '𝕏',  url: (t, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { id: 'facebook', label: 'Facebook', icon: 'f',  url: (t, u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: 'linkedin', label: 'LinkedIn', icon: 'in', url: (t, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
];

// Riempie il contenitore con i pulsanti. text() restituisce il testo da condividere al momento del clic.
export function renderShare(container, text) {
  container.innerHTML = '';
  for (const n of NETWORKS) {
    const a = document.createElement('a');
    a.className = `share ${n.id}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.title = `Condividi su ${n.label}`;
    a.textContent = n.icon;
    a.href = n.url(text(), GAME_URL);
    a.addEventListener('pointerdown', () => { a.href = n.url(text(), GAME_URL); }); // testo aggiornato
    container.appendChild(a);
  }
  // Copia link (e, sul telefono, il menu di condivisione del sistema)
  const copy = document.createElement('button');
  copy.className = 'share copy';
  copy.title = 'Copia il link';
  copy.textContent = '🔗';
  copy.addEventListener('click', async () => {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: 'Office Tower Defense', text: text(), url: GAME_URL }); return; } catch { /* annullato */ }
    }
    try {
      await navigator.clipboard.writeText(text() + ' ' + GAME_URL);
      copy.textContent = '✓';
    } catch {
      copy.textContent = '✗';
    }
    setTimeout(() => { copy.textContent = '🔗'; }, 1500);
  });
  container.appendChild(copy);
}
