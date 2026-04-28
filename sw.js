var CACHE = 'harmreduction-v1';
var OFFLINE_URLS = [
  '/',
  '/index.html',
  '/kalkulator/',
  '/kalkulator/index.html',
  '/interakcje/',
  '/interakcje/index.html',
  '/pomoc/',
  '/pomoc/index.html',
  '/sor/',
  '/sor/index.html',
  '/panic/',
  '/panic/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(OFFLINE_URLS);
    }).catch(function(err){
      console.log('Cache install error:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);})
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  // skip non-GET and external requests (Leaflet CDN, fonts etc)
  if(e.request.method!=='GET') return;
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        if(!response || response.status!==200 || response.type==='opaque') return response;
        var clone = response.clone();
        caches.open(CACHE).then(function(cache){cache.put(e.request, clone);});
        return response;
      }).catch(function(){
        return caches.match('/') || new Response('Offline - brak polaczenia', {status:503});
      });
    })
  );
});
