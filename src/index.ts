
/* create by create-app-cli */
import {join} from 'path';
import {app, BrowserWindow, ipcMain, dialog} from 'electron';

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: join(__dirname, 'preload.js'),
			contextIsolation: true,
		},
	});

	win.maximize();
	// win.setMenu(null); // establecer en production
	win.loadFile(join(__dirname, 'frontend', 'index.html'));
};

// =========
// Events
// =========
ipcMain.handle('openFileDialog', async () => {
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

// ===========
// APP
// ===========
app.whenReady()
	.then(() => {
		createWindow();

		app.on('activate', () => {
			if ( BrowserWindow.getAllWindows().length === 0 ) {
				createWindow();
			}
		});
	});

app.on('window-all-closed', () => {
	if ( process.platform !== 'darwin' ) app.quit();
});
	