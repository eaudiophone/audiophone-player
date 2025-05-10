/*
*
	Archivo de configuracion del empaquetador EsBuild para electron
	Escrito en GO.
*
*/

package main

import (
	"fmt"
	"log"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	ctx, ctxErr := api.Context(api.BuildOptions{
		EntryPoints: []string{
			"./src/index.ts",   // main process
			"./src/preload.ts", // preload process
		},
		Bundle:            true,
		Outdir:            "./dist",
		Tsconfig:          "./tsconfig.json",
		Platform:          api.PlatformNode,
		Format:            api.FormatCommonJS,
		Write:             true,  // permite a esbuild escribir los cambios
		MinifyWhitespace:  false, // change a true for production
		MinifySyntax:      false, // change a true for production
		MinifyIdentifiers: false, // change a true for production
		// excluye el paquete de electron ya que contiene binarios no soportados en la compilacion de esbuild
		// delega la carga de modulos nativos a NodeJS
		External: []string{"electron"},
	})

	if ctxErr != nil {
		fmt.Println(ctxErr.Errors)
		log.Fatal(ctxErr.Errors)
	}

	// activamos la opcion para observar los cambios
	if err := ctx.Watch(api.WatchOptions{}); err != nil {
		fmt.Println(err.Error())
		log.Fatal(err)
	}

	fmt.Printf("EsBuild: live build\n")
	fmt.Printf("watching for changes ...\n")

	// bloquea el hilo para que escuche los cambios
	<-make(chan struct{})
}
