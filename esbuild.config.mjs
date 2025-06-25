import * as esbuild from 'esbuild';

esbuild.context({
    entryPoints: [
        './src/index.ts',
        './src/sw.ts'
    ],
    outdir: './www',
    bundle: true,
    write: true,
    minifyWhitespace: false,
    minifySyntax: false,
    minifyIdentifiers: false,
    sourcemap: 'linked',
    tsconfig: './tsconfig.json',
    target: ['chrome58', 'firefox57']
})
    .then(ctx => {
        // inicia el revision de los archivos
        ctx.watch()
            .catch(console.error);
        
        // inicia el servidor de desarrollo
        ctx.serve({
            port: 3000,
            servedir: 'www',
            fallback: './www/index.html'
        })
            .then(server => console.log('Servidor corriendo en el ' + server.port))
            .catch(console.error);
    });
