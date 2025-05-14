/**
 * @typedef Track
 * @type {Object}
 * @property {string} name
 * @property {number} index
 * @property {string} filePath 
 * @property {boolean} selected
 */

/**
 * @typedef State
 * @type {Object}
 * @property {Array<Track>} playlist
 * @property {Track | null} selectedTrack
 * @property {(playlist: Array<Track>) => void} setPlaylist
 * @property {(playlist: Track) => void} setSelectedTrack
 * @property {Howl | null} audio  instancia de Howl.js
 * @property {(filePath: string) => void} setAudio
 */

(function () {
    const STORE = zustandVanilla.createStore(set => {
        /** @type {State} */
        const STATE = {
            playlist: [],
            selectedTrack: null,
            audio: null,
            setPlaylist: playlist => set(state => ({...state, playlist})),
            setSelectedTrack: track => set(state => ({...state, selectedTrack: track})), 
            setAudio: filePath => set((state) => {
                if (state.audio) {
                    state.audio.unload(); // desmonta el sonido si existe una instancia
                } 
    
                const audio = new Howl({
                    src: [filePath],
                    // This should be used for large audio files so that you don't have to wait 
                    // for the full file to be downloaded and decoded before playing.
                    html5: true,

                    onload: () => {
                        UI.buttonPlay.click();
                    },
                    onloaderror: (id, error) => {
                        console.error('Error al cargar el audio', filePath, error);
                    },
                }); 
    
                return {...state, audio};
            }),
        };
    
        return STATE;
    });
    
    const UI = {
        uploadButton: document.querySelector('button#load-playlist'),
        playListData: document.querySelector('#playlist #data'),
        inputSearch: document.querySelector('#search'),
        player: document.querySelector('footer#player'),
        volume: document.querySelector('footer #indicator-volume'), 
        buttonPlay: document.querySelector('#play-pause'),   
    };


    /**
     * carga la pista en el reproductor
     * @param {number} index indice de la pista
     * @returns 
     */
    function loadTrack(index) {
        /** @type {State} */
        const state = STORE.getState();
        
        if (state.playlist.length === 0) {
            console.error('No tracks loaded ...');
            return;
        }

        const newPlaylist = state.playlist.map(track => {
            if (track.index === index) return {...track, selected: true};
    
            return {...track, selected: false};
        });

        state.setPlaylist(newPlaylist);

        // procedemos a pasar los datos al componente del reproductor
        const track = newPlaylist[index] || null;
        state.setSelectedTrack(track);
    }

    /**
     * Manejador del boton de carga de archivos
     */
    async function handleLoadButton() {
        /** @type {Array<Track>} */
        const playlist = await window.API.openFileDialog();

        /** @type {State} */
        const state = STORE.getState();

        // establecemos una copia en el session storage
        window.sessionStorage.setItem('playlist', JSON.stringify(playlist));
        
        state.setPlaylist(playlist);
    }

    /**
     * busca la pista dentro de la lista de reproduccion
     * @param {InputEvent} event 
     */
    function searchTrack(event) {
        /** @type {State} */
        const state = STORE.getState();

        /** @type {string} */
        let value = event.target.value;

        if (value.length === 0) {
            /** @type {Array<Track>} */
            const playList = JSON.parse(window.sessionStorage.getItem('playlist'));
            
            // reestablecemos los valores nuevamente en la lista
            state.setPlaylist(playList);

            return;
        }

        // validar datos alfanumericos ...
        value = value.toLowerCase(); // pasamos a lowercase
        
        if (!(/^[\w\s\d]{1,255}$/).test(value)) {
            console.error(new Error('Solo caracteres alfanúmericos'));
            return;
        }


        // filtramos la lista
        const data = state.playlist.filter(list => {
            const position = (list.name.toLowerCase()).search(value);

            // devuelve las coincidencias
            return (position !== -1); 
        });

        state.setPlaylist(data);
    }

    /**
     * renderiza el listado de archivos de musica
     * @param {State} state
     * @param {State} prevState 
     */
    function renderPlaylist(state, prevState) {
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
    function loadTrackPlayer(state, prevState) {
        if (state.selectedTrack === prevState.selectedTrack) return;

        const title = UI.player.querySelector('#title-track');
        
        if (!state.selectedTrack) {
            title.innerText = 'No track loaded';
            return;
        }

        title.innerText = state.selectedTrack.name;

        // genera la instancia de Howler.js
        state.setAudio(state.selectedTrack.filePath);
    }

    /**
     * manejador de instancias de howler
     * @param {Event} event 
     */
    function handleVolume(event) {
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
    function handlePlay({target}) {
        /** @type {State} */
        const {audio, playlist, selectedTrack} = STORE.getState();

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

    // main ...
    if (!UI.uploadButton) return;

    UI.uploadButton.addEventListener('click', handleLoadButton);   
    
    if (!UI.inputSearch) return;

    UI.inputSearch.addEventListener('input', searchTrack);

    if (!UI.volume) return;

    UI.volume.addEventListener('input', handleVolume);

    if (!UI.buttonPlay) return;

    UI.buttonPlay.addEventListener('click', handlePlay);

    // patron observador Zustand
    // nos subscribimos al cambio del estado
    STORE.subscribe(renderPlaylist); // renderiza la playlist cuando se cambia la playlist
    STORE.subscribe(loadTrackPlayer); // carga el track seleccionado
})();