import {ipcMain, dialog} from 'electron';

ipcMain.handle('loadFiles', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Abrir archivo o carpeta',
        properties: ['openFile', 'multiSelections'],
        filters: [{
            extensions: ['mp3', 'wav', 'ogg', 'webm'],
            name: 'music'
        }]
    });

    if (result.canceled) return;

    // realizamos una lectura del archivo para obtener los datos del buffer
    const files = result.filePaths.map((filePath, index) => {
        const resultSplit = filePath.split('/');
        const name = resultSplit[resultSplit.length - 1];
        
        return {name, filePath, index};
    });

    return files;
});