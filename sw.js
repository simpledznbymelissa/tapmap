const cacheName = 'Tapmapcache';

// Cache all the files to make a PWA
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            // Our application only has two files here index.html and manifest.json
            // but you can add more such as style.css as your app grows
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './images/africa.png',
                './images/africa.png',
                './images/asia.png',
                './images/europe.png',
                './images/logo.png',
                './images/northamerica.png',
                './images/oceania.png',
                './images/pwa-192x192.png',
                './images/pwa-384x384.png',
                './images/pwa-512x512.png',
                './images/southamerica.png',
                './js/continent.js',
                './js/d3.v5.min.js',
                './js/sweetalert1.js',
                './js/sweetalert2.js',
                './js/topojson.v2.min.js',
                './json/africa.json',
                './json/asia.json',
                './json/europe.json',
                './json/northamerica.json',
                './json/oceania.json',
                './json/southamerica.json',
                './json/world.json',
                './africa.html',
                './asia.html',
                './europe.html',
                './northamerica.html',
                './southamerica.html',
                './world.html'

            ]);
        })
    );
});

// Our service worker will intercept all fetch requests
// and check if we have cached the file
// if so it will serve the cached file
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(cacheName)
            .then(cache => cache.match(event.request, { ignoreSearch: true }))
            .then(response => {
                return response || fetch(event.request);
            })
    );
});