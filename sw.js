
const CACHE='efa-professional-v1';
const ASSETS=['./','index.html','css/style.css','js/storage.js','js/project.js','js/photo.js','js/export.js','js/ui.js','js/app.js','js/jszip.min.js','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
