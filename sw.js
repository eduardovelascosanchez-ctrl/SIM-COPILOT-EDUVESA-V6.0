const CACHE="simcopilot-fase5-v3";
const ASSETS=["./","./index.html","./css/styles.css","./data/scenarios.js","./js/app.js","./js/state.js","./js/monitor.js","./js/audio.js","./js/report.js","./js/voice.js","./js/pwa.js","./manifest.webmanifest","./assets/icons/icon-192.png","./assets/icons/icon-512.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match("./index.html"))))});
