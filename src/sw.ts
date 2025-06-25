const APP_SHELL = {
    CACHE_NAME: 'cache-v.0.1',
    CACHE_STATIC: 'static-v.0.1',
    CACHE_DYNAMIC: 'dynamic-v.0.1',
    CACHE_INMUTABLE: 'inmutable-v.0.1',
};

self.addEventListener('install', (event: any) => {
    console.info('instalación SW');

    const cacheStaticPromise = caches.open(APP_SHELL.CACHE_STATIC)
        .then(cache => {
            const files = [
                './', 
                './index.html', 
                './index.css', 
                './index.js',
                './img/note-double.svg',
                './img/user.svg',
                './img/home.svg',
                './img/music-note.svg',
                './img/play.svg',
                './img/prev.svg',
                './img/next.svg',
                './img/sound-loud.svg',
                './img/pause.svg'
            ];

            return cache.addAll(files);
        });

    const cacheInmutablePromise = caches.open(APP_SHELL.CACHE_INMUTABLE)
        .then(cache => {
            const files = [
                './js/howler.min.js',
                './js/zustand.js'
            ];

            return cache.addAll(files);
        });

    event.waitUntil(Promise.all([cacheStaticPromise, cacheInmutablePromise]));
});