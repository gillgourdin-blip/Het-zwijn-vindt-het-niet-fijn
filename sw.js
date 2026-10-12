// Service worker: laat het spel installeren als app en ook offline werken.
// Verhoog VERSIE als je bestanden vervangt en de gsm de oude moet weggooien.
const VERSIE = 'zwijn-v1';
const KERN = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSIE)
      .then(c => Promise.all(KERN.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // pagina: eerst het internet (dan zie je altijd de nieuwste versie), anders de bewaarde kopie
    e.respondWith(
      fetch(r).then(res => {
        const kopie = res.clone();
        caches.open(VERSIE).then(c => c.put('index.html', kopie));
        return res;
      }).catch(() => caches.match('index.html').then(m => m || caches.match('./')))
    );
    return;
  }
  // iconen en rest: eerst de bewaarde kopie
  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok) { const kopie = res.clone(); caches.open(VERSIE).then(c => c.put(r, kopie)); }
      return res;
    }))
  );
});
