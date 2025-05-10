(function () {
    /** @type {Array<{name: string, filePath: string, index: number}>} */
    let playlist = [];  // lista de reproduccion
    const UI = {
        uploadButton: document.querySelector('button#load-playlist'),
        playListData: document.querySelector('#playlist #data'),
        inputSearch: document.querySelector('#search'),
    };

    /**
     * carga la pista en el reproductor
     * @param {number} index indice de la pista
     * @returns 
     */
    function loadTrack(index) {
        if (playlist.length === 0) {
            console.error('No tracks loaded ...');
            return;
        }

        const track = playlist[index];
        console.log(track);
        
        // procedemos a pasar los datos al componente del reproductor
    }

    /**
     * Manejador del boton de carga de archivos
     */
    async function handleLoadButton() {
        playlist = await window.API.loadFiles();

        if (!UI.playListData) return;
        if (playlist.length > 0) renderPlaylist();
    }

    /**
     * busca la pista dentro de la lista de reproduccion
     * @param {InputEvent} event 
     */
    function searchTrack(event) {
        /** @type {string} */
        let value = event.target.value;

        if (value.length === 0) {
            renderPlaylist();
            return;
        }

        // validar datos alfanumericos ...

        value = value.toLowerCase(); // pasamos a lowercase
        
        if (!(/^[\w\s\d]{1,255}$/).test(value)) {
            console.error(new Error('Solo caracteres alfanúmericos'));
            return;
        }

        // filtramos la lista
        const data = playlist.filter(list => {
            const position = (list.name.toLowerCase()).search(value);

            // devuelve las coincidencias
            return (position !== -1); 
        });

        renderPlaylist(data);
    }

    /**
     * renderiza el listado de archivos de musica
     * @param {Array<{name: string, filePath: string, index: number}>} [lists] 
     */
    function renderPlaylist(lists = playlist) {
        if (lists.length === 0) return;

        UI.playListData.innerHTML = lists.map(file => (`
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

    // main ...
    if (!UI.uploadButton) return;

    UI.uploadButton.addEventListener('click', handleLoadButton);   
    
    if (!UI.inputSearch) return;

    UI.inputSearch.addEventListener('input', searchTrack);
})();