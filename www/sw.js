"use strict";
(() => {
  // src/sw.ts
  var APP_SHELL = {
    CACHE_NAME: "cache-v.0.1",
    CACHE_STATIC: "static-v.0.1",
    CACHE_DYNAMIC: "dynamic-v.0.1",
    CACHE_INMUTABLE: "inmutable-v.0.1"
  };
  var offlinePage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Necesitas conexion</title>
</head>
<style>
    :root {
        --background: #000;
        --foreground: #fff;
        --borders: #3c3c3c;
        --background-form: rgba(136, 136, 136, .5);
        --color-indicators: #f50;
    }
    
    body {
        font-family: sans-serif;
        background-color: var(--background);
        color: var(--foreground);
        margin: 0;
        overflow-x: hidden;
        height: 100vh;
    }

    .h-full {
        height: inherit;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .button-offline {
        padding: 12px 24px;
        color: var(--foreground);
        background-color: var(--color-indicators);
        border: none;
        outline: none;
        cursor: pointer;
        font-size: 1rem;
    }
</style>
<body>
    <div class="h-full">
        <h1>Sin conexion</h1>
        <h3>Necesitas conexion a internet para continuar</h3>
        <button onclick="window.location.reload();" class="button-offline">Recargar</button>
    </div>
</body>
</html>     
`;
  self.addEventListener("install", (event) => {
    console.info("installation SW");
    const cacheStaticPromise = caches.open(APP_SHELL.CACHE_STATIC).then((cache) => {
      const files = [
        "./",
        "./index.html",
        "./index.css",
        "./index.js",
        "./img/note-double.svg",
        "./img/user.svg",
        "./img/home.svg",
        "./img/music-note.svg",
        "./img/play.svg",
        "./img/prev.svg",
        "./img/next.svg",
        "./img/sound-loud.svg",
        "./img/pause.svg",
        "./manifest.json"
      ];
      return cache.addAll(files);
    });
    const cacheInmutablePromise = caches.open(APP_SHELL.CACHE_INMUTABLE).then((cache) => {
      const files = [
        "./js/howler.min.js",
        "./js/zustand.js",
        "./fonts/Roboto-Bold.ttf",
        "./fonts/Roboto-Regular.ttf"
      ];
      return cache.addAll(files);
    });
    event.waitUntil(Promise.all([cacheStaticPromise, cacheInmutablePromise]));
  });
  self.addEventListener("fetch", (event) => {
    console.info("cache with network fallback");
    const cacheNetwork = caches.match(event.request).then((cacheResponse) => {
      if (cacheResponse && cacheResponse.ok) return cacheResponse;
      console.info("go to web");
      return fetch(event.request).then((webResponse) => {
        caches.open(APP_SHELL.CACHE_DYNAMIC).then((cache) => {
          cache.put(event.request, webResponse);
        });
        return webResponse.clone();
      }).catch(() => {
        const offlineResponse = new Response(
          offlinePage,
          {
            headers: { "Content-Type": "text/html" }
          }
        );
        return offlineResponse;
      });
    });
    event.respondWith(cacheNetwork);
  });
})();
//# sourceMappingURL=sw.js.map
