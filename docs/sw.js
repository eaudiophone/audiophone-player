(()=>{var s={CACHE_NAME:"cache-v.0.6.1",CACHE_STATIC:"static-v.0.6.1",CACHE_DYNAMIC:"dynamic-v.0.6.1",CACHE_INMUTABLE:"inmutable-v.0.6.1"},r=`
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
`;self.addEventListener("install",o=>{console.info("installation SW");let i=caches.open(s.CACHE_STATIC).then(e=>{let t=["./","./index.html","./index.css","./mobile.css","./index.js","./img/note-double.svg","./img/user.svg","./img/home.svg","./img/music-note.svg","./img/play.svg","./img/prev.svg","./img/next.svg","./img/sound-loud.svg","./img/pause.svg","./manifest.json"];return e.addAll(t)}),n=caches.open(s.CACHE_INMUTABLE).then(e=>{let t=["./js/howler.min.js","./js/zustand.js","./fonts/Roboto-Bold.ttf","./fonts/Roboto-Regular.ttf"];return e.addAll(t)});o.waitUntil(Promise.all([i,n]))});self.addEventListener("fetch",o=>{console.info("cache with network fallback");let i=caches.match(o.request).then(n=>n&&n.ok?n:(console.info("go to web"),fetch(o.request).then(e=>(caches.open(s.CACHE_DYNAMIC).then(t=>{t.put(o.request,e)}),e.clone())).catch(()=>new Response(r,{headers:{"Content-Type":"text/html"}}))));o.respondWith(i)});})();
//# sourceMappingURL=sw.js.map
