/* Smart Blocus : la version en ligne d'abord (mises à jour immédiates), la copie locale si pas de réseau. */
const CACHE = 'smart-blocus-v3';
const SHELL = ['./', 'index.html', 'config.js', 'vendor/supabase.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.hostname.endsWith('github.com') || u.hostname.endsWith('githubusercontent.com')) return;
  if (u.origin === self.location.origin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
    return;
  }
  // Seules les polices viennent d'ailleurs : jamais les données (Supabase, GitHub…), toujours en direct.
  if (!/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
