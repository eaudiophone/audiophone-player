/**
 * @typedef Track
 * @type {Object}
 * @property {string} name
 * @property {number} index
 * @property {string} filePath 
 */

/**
 * @typedef State
 * @type {Object}
 * @property {Array<Track>} playlist
 * @property {Track | null} selectedTrack
 * @property {(playlist: Array<Track>) => void} setPlaylist
 * @property {(playlist: Track) => void} setSelectedTrack
 */

const STORE = zustandVanilla.createStore(set => {
    /** @type {State} */
    const STATE = {
        playlist: [],
        selectedTrack: null,
        setPlaylist: playlist => set({playlist}),
        setSelectedTrack: track => set(state => ({...state, selectedTrack: track})), 
    };

    return STATE
});


(function () {
    const UI = {
        uploadButton: document.querySelector('button#load-playlist'),
        playListData: document.querySelector('#playlist #data'),
        inputSearch: document.querySelector('#search'),
        player: document.querySelector('footer#player'),
        volume: document.querySelector('footer #indicator-volume'),    
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

        // procedemos a pasar los datos al componente del reproductor
        const track = state.playlist.find(track => track.index === index) || null;
        state.setSelectedTrack(track);
    }

    /**
     * Manejador del boton de carga de archivos
     */
    async function handleLoadButton() {
        /** @type {Array<Track>} */
        const playlist = await window.API.loadFiles();

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

        UI.playListData.innerHTML = state.playlist.map(file => (`
            <div class="item" track="${file.index}">
                <img src="img/play.svg" alt="play" class="icons" />
                <span>${
                    file.name.length > 35 ? 
                        file.name.slice(0, 35) + '...' : 
                        file.name
                }</span>
            </div>    
        `)).join('');
        
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
    }

    function handleVolume(event) {
        const element = event.target;

        let value = Number(element.value); 
        let maxValue = Number(element.max);
        let progress = (value / maxValue) * 100;
        
        // establecemos los estilos de la linea
        element.style.background = (`linear-gradient(to right, var(--foreground) ${progress}%, var(--borders) ${progress}%)`);
    }

    function handleProgress() {
        
    }

    // main ...
    if (!UI.uploadButton) return;

    UI.uploadButton.addEventListener('click', handleLoadButton);   
    
    if (!UI.inputSearch) return;

    UI.inputSearch.addEventListener('input', searchTrack);

    if (!UI.volume) return;

    UI.volume.addEventListener('input', handleVolume);

    // patron observador Zustand
    // nos subscribimos al cambio del estado
    STORE.subscribe(renderPlaylist); // renderiza la playlist cuando se cambia la playlist
    STORE.subscribe(loadTrackPlayer); // carga el track seleccionado
})();