# Audiophone Player
Un proyecto personal, se crea un reproductor de audio con un diseño 
parecido a Youtube Music, Permite cargar las pistas cambiarlas,
reproducirlas y filtrar el playlist. Algo mas sencillo para disfrutar en
casa y trabajo con un toque mas moderno y profesional.

- Ligero
- Multiplataforma
- Escrito en Vanilla JS
- Se integra Howler.js como biblioteca para la gestion de las pistas de audio
- Se utiliza ZustandJS Vanilla para el control del estado de la aplicacion

## Que se aprendio
- Uso de las bibliotecas 
- Repaso de la gestión de Arrays
- Implementacion del patrón de diseño Observador, para mantener el control de la pista
seleccionada.

### instalacion de dependencias
```
    yarn install  # instala las dependencias
    yarn start  # inicia electron en modo desarrollo    
    yarn package  # enpaqueta la aplicación para el sistema operativo
```

Se recomienda leer la documentacion de electron forge para especificar
los paquetes para produccion del sistema operativo.