// registro de SW.
if (navigator.serviceWorker) navigator.serviceWorker.register('./sw.js');

interface Track {
    name: string;
    index: number;
    filePath: string;
    selected: boolean;
    format: string;
}

interface State {
    playlist: Array<Track>;
    selectedTrack: Track | null;
    setPlaylist: (playlist: Array<Track>) => void;
    setSelectedTrack: (track: Track) => void;
    audio: any | null;
    setAudio: (data: {filePath: string, format: string}) => void;
}

interface UI {
    uploadButton: HTMLButtonElement,
    inputFile: HTMLInputElement,
    playListData: HTMLSpanElement | HTMLDivElement,
    inputSearch: HTMLInputElement,
    player: HTMLDivElement,
    volume: HTMLInputElement,
    buttonPlay: HTMLButtonElement,
    durationTrack: HTMLSpanElement,
    timerTrack: HTMLSpanElement,
    progress: HTMLInputElement,
    nextTrack: HTMLButtonElement,
    prevTrack: HTMLButtonElement,
    titleTrack: HTMLSpanElement,
}

/** inicializa el estado de la aplicacion */
function initState(set: any) {
    const STATE: State = {
        playlist: [],
        selectedTrack: null,
        audio: null,
        setPlaylist: playlist => set((state: State) => ({ ...state, playlist })),
        setSelectedTrack: track => set((state: State) => ({ ...state, selectedTrack: track })),
        setAudio: ({filePath, format}) => set((state: State) => {
            if (state.audio) state.audio.unload(); // desmonta el sonido si existe una instancia

            // crea una referencia local que apunta al mismo objeto de sonido
            // para acceder al objeto sound dentro del objeto de config de howler
            let sound = state.audio = new Howl({
                src: [filePath],
                html5: true, // html5 streaming, ideal para grandes buffer de datos
                format: [format],
                onload: () => {
                    if (UI.buttonPlay.getAttribute('value') === 'play') UI.buttonPlay.click();
                },
                onloaderror: (id: number, error: any) => {
                    console.error('Error al cargar el audio', filePath, error);
                },
                onplay: () => {
                    if (!UI.durationTrack) return;

                    let duration = sound.duration();
                    UI.durationTrack.innerHTML = formatTime(Math.round(duration));

                    requestAnimationFrame(updateTimer);
                },
                onend: () => {
                    if (UI.buttonPlay.getAttribute('value') === 'pause') UI.buttonPlay.click();

                    // pasamos a la siguiente valor de la lista de reproduccion 
                    // si no es el ultima pista
                    if (state.selectedTrack && state.selectedTrack.index !== (state.playlist.length - 1)) 
                        UI.nextTrack.click();
                },
                onseek: () => { 
                    // evento que captura los eventos de los saltos y actualiza
                    // el frame
                    requestAnimationFrame(updateTimer);
                }
            });

            return { ...state, audio: sound };
        }),
    };

    return STATE;
}

/** aplica un formato al tiempo de reproduccion */
function formatTime(seconds: number) {
    let minutes = Math.floor(seconds / 60) || 0;
    let secs = (seconds - minutes * 60) || 0;

    return (`${minutes}:${secs < 10 ? '0' : ''}${secs}`);
}

/**
* funcion que controla la actualizacion del tiempo
*/
function updateTimer() {
    const {audio}: State = STORE.getState();
    const seek = audio.seek() || 0;

    if (UI.timerTrack) UI.timerTrack.innerHTML = formatTime(Math.round(seek));

    let width = ((seek / audio.duration()) * 100) || 0;

    if (UI.progress) {
        // establecemos los estilos de la linea
        UI.progress.value = width.toString();
        UI.progress.style.background = (`linear-gradient(to right, var(--color-indicators) ${width}%, var(--borders) ${width}%)`);
    }

    // ejecuta la animacion mientras se reproduce la pista
    if (audio.playing()) requestAnimationFrame(updateTimer);
}

/**
 * salta a la pista siguiente
 * @param {'next' | 'prev'} direction 
 */
function skipTo(direction: 'next' | 'prev' = 'next') {
    const {
        playlist,
        selectedTrack,
        audio,
        setSelectedTrack,
        setPlaylist
    }: State = STORE.getState();

    if (playlist.length === 0 || !selectedTrack) return;

    let index = selectedTrack.index || 0;

    if (direction === 'prev') {
        index = selectedTrack.index - 1;

        // nos ubica al ultimo de la lista
        if (index < 0) index = playlist.length - 1;
    }

    if (direction === 'next') {
        index = selectedTrack.index + 1;

        // si alcanza el limite retrocede al primer elemento
        if (index >= playlist.length) index = 0;
    }

    // detiene la pista actual
    audio.stop();
    if (UI.buttonPlay.getAttribute('value') === 'pause') UI.buttonPlay.click();

    // reset progress
    // establecemos los estilos de la linea
    (UI.progress as HTMLInputElement).value = (0).toString();
    UI.progress.style.background = (`var(--borders)`);

    // actualiza la lista con la nueva posicion seleccionada
    // para señalar el nuevo elemento
    const newPlaylist: Track[] = playlist.map(track => {
        if (track.index === index) {
            return { ...track, selected: true };
        }

        return { ...track, selected: false };
    });

    setPlaylist(newPlaylist);

    setSelectedTrack(playlist[index]);
}

/**
 * salta a cualquier seccion de la pista
 * @param {MouseEvent} event 
 */
function jumpTo(event: MouseEvent) {
    const {playlist, selectedTrack, audio}: State = STORE.getState();

    if (playlist.length === 0 || !selectedTrack) return;

    // permite obtener el porcentaje de la posicion donde se hace 
    // click al indicador
    let per = event.clientX / window.innerWidth;

    // aplicamos el salto y luego la animacion
    if (audio.playing()) audio.seek(audio.duration() * per);
}

/**
* carga la pista en el reproductor
* @param {number} index indice de la pista
* @returns 
*/
function loadTrack(index: number) {
    const state: State = STORE.getState();
    
    if (state.playlist.length === 0) {
        console.error('No tracks loaded ...');
        return;
    }

    // se genera una playlist nueva
    const newPlaylist: Track[] = state.playlist.map(track => {
        if (track.index === index) return {...track, selected: true};
        return {...track, selected: false};
    });
    
    // console.log(newPlaylist);

    state.setPlaylist(newPlaylist);

    // procedemos a pasar los datos al componente del reproductor
    const track = newPlaylist.find(track => track.index === index) || null;
    
    if (track) state.setSelectedTrack(track);
}

/**
 * Manejador del boton de carga de archivos
 */
async function handleLoadButton() {
    const playlist = await getFiles();
    
    if (!playlist) return;

    const state: State = STORE.getState();

    // establecemos una copia en el session storage
    window.sessionStorage.setItem('playlist', JSON.stringify(playlist));
    
    state.setPlaylist(playlist);
}

/** obtiene la instancias de los archivos */
async function getFiles(): Promise<Track[]> {
    return new Promise(resolve => {
        UI.inputFile.addEventListener('input', event => {
            const {files} = (event.target as any);
        
            let tracks: Track[] = [];
        
            for (const file of files) {
                tracks = [
                    ...tracks, 
                    {
                        selected: false, 
                        index: tracks.length, 
                        name: file.name || '', 
                        filePath: URL.createObjectURL(file),
                        // manda el formato a howler ya que el filePath
                        // para que reproduzca el archivo
                        format: file.type.split('/')[1] 
                    }
                ];
            }
            
            resolve(tracks);
    
        }, {once: true}); // el evento se ejecuta solo una vez
        
        // llamamos al input file cuando registre el cambio dispara el evento
        UI.inputFile.click();
    });
};

/**
 * busca la pista dentro de la lista de reproduccion
 * @param {InputEvent} event 
 */
function searchTrack(event: any) {
    /** @type {State} */
    const state: State = STORE.getState();

    let value: string = event.target.value;
    let playList: Track[] = [];

    if (value.length === 0) {
        // obtenemos desde el session storage
        // luego verificamos si existe una pista seleccionada
        // y la marcamos para que aparezca seleccionado en pista

        playList = JSON
            .parse(window.sessionStorage.getItem('playlist') || '{}')
            .map((track: Track) => {
                if (state.selectedTrack && track.index === state.selectedTrack.index) {
                    return {...track, selected: true};
                }

                return track;
            });

    } else {
        // validar datos alfanumericos ...
        value = value.toLowerCase(); // pasamos a lowercase
        
        if (!(/^[\w\s\d]{1,255}$/).test(value)) {
            console.error(new Error('Solo caracteres alfanúmericos'));
            return;
        }

        // filtramos la lista
        // devuelve las coincidencias
        playList = state.playlist.filter(track => {
            const position = (track.name.toLowerCase()).search(value);
            return (position !== -1); 
        });
    }

    // actualizamos la nuevo playlist
    state.setPlaylist(playList);
}

/** cambia la pista en el reproductor */
function switchTrack() {
    const {audio}: State = STORE.getState();

    audio.stop();

    // cambiamos los atributos del boton
    UI.buttonPlay.setAttribute('value', 'pause');
    UI.buttonPlay.setAttribute('src', 'img/play.svg');

    // reproducimos la nueva pista
    UI.buttonPlay.click();
}

/**
 * renderiza el listado de archivos de musica
 * @param {State} state
 * @param {State} prevState 
 */
function renderPlaylist(state: State, prevState: State) {
    if (state.playlist === prevState.playlist) return;
    if (state.playlist.length === 0) return;

    UI.playListData.innerHTML = state.playlist.map(file => {
        return (`
            <div class="item ${file.selected ? 'selected' : ''}" track="${file.index}">
                <img src="img/play.svg" alt="play" class="icons" />
                <span>${
                    file.name.length > 35 ? 
                        file.name.slice(0, 35) + '...' : 
                        file.name
                }</span>
            </div>    
        `);
    }).join('');
    
    // añadimos los eventos de click
    const items = Array.from(UI.playListData.querySelectorAll('.item'));
    items.forEach(item => item.addEventListener(
        'click', 
        () => loadTrack(Number(item.getAttribute('track')))
    ));
}

/**
 * crea la instancia de howler e inicia el reproductor
 * @param {State} state
 * @param {State} prevState 
 */
function loadTrackPlayer(state: State, prevState: State) {
    if (state.selectedTrack === prevState.selectedTrack) return;
    if (!UI.titleTrack) return;

    if (!state.selectedTrack) {
        UI.titleTrack.innerText = 'No track loaded';            
        return;
    }
    
    // cambia la pista
    if (state.audio && state.audio.playing()) switchTrack();

    UI.titleTrack.innerText = state.selectedTrack.name;

    // genera la instancia de Howler.js
    state.setAudio({
        filePath: state.selectedTrack.filePath, 
        format: state.selectedTrack.format || 'mp3'
    });
}

/**
 * manejador de instancias de howler
 * @param {Event} event 
 */
function handleVolume(event: any) {
    const element = event.target;

    let value = Number(element.value); 
    let maxValue = Number(element.max);
    let progress = (value / maxValue) * 100;
    
    // establecemos los estilos de la linea
    element.style.background = (`linear-gradient(to right, var(--foreground) ${progress}%, var(--borders) ${progress}%)`);
    
    // establece el volumen global de todas las instancias de Howler
    Howler.volume(value / 100);
}

/**
 * maneja la reproduccion de la pista de audio
 * @param {Event} event
 */
function handlePlay({target}: any) {
    const {audio, playlist, selectedTrack}: State = STORE.getState();

    // validamos si existe alguna pista en la playlist
    let isNotReady = playlist.length === 0 || !selectedTrack;
    if (isNotReady) return;

    /** @type {'pause' | 'play'} */
    const value = target.getAttribute('value');
    
    if (value === 'pause') {
        // cambia la imagen del boton 
        target.setAttribute('value', 'play');
        target.setAttribute('src', 'img/play.svg');

        if (audio && audio.state() === 'loaded') {
            audio.pause(); 
        
        } else if (audio && audio.state() !== 'loading') {
            console.warn('No se ha cargado ningún archivo de audio o aún está cargando.');
        
        }
    }
    
    if (value === 'play') {
        target.setAttribute('value', 'pause');
        target.setAttribute('src', 'img/pause.svg');

        if (audio && audio.state() === 'loaded') {
            audio.play();
        
        } else if (audio && audio.state() !== 'loading') {
            console.warn('No se ha cargado ningún archivo de audio o aún está cargando.');
        
        }
    }
}

declare var Howl: any, Howler: any, zustandVanilla: any;

const UI: UI = {
    uploadButton: document.querySelector('button#load-playlist')!,
    inputFile: document.querySelector('#upload-input')!,
    playListData: document.querySelector('#playlist #data')!,
    inputSearch: document.querySelector('#search')!,
    player: document.querySelector('footer#player')!,
    volume: document.querySelector('footer #indicator-volume')!,
    buttonPlay: document.querySelector('#play-pause')!,
    durationTrack: document.querySelector('span#duration')!,
    timerTrack: document.querySelector('span#timer')!,
    progress: document.querySelector('#progress')!,
    nextTrack: document.querySelector('#next')!,
    prevTrack: document.querySelector('#prev')!,
    titleTrack: document.querySelector('#title-track')!,
};

const STORE = zustandVanilla.createStore(initState);

// nos subscribimos a los cambios del estado para renderizar
// la lista de reproduccion y la pista seleccionada
STORE.subscribe(renderPlaylist);
STORE.subscribe(loadTrackPlayer); 

// eventos
UI.uploadButton.addEventListener('click', handleLoadButton);
UI.buttonPlay.addEventListener('click', handlePlay);
UI.volume.addEventListener('input', handleVolume);
UI.inputSearch.addEventListener('input', searchTrack); // busca la pista
UI.prevTrack.addEventListener('click', () => skipTo('prev'));
UI.nextTrack.addEventListener('click', () => skipTo('next'));
UI.progress.addEventListener('click', jumpTo);

