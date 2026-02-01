'use strict';

const {join} = require('path');
const {BrowserWindow, ipcMain, app, dialog, nativeImage} = require('electron');

const createWindow = () => {
	const URILogo = join(__dirname, 'icons', 'logo_audiophone_65x65.png');	
	const win = new BrowserWindow({
		icon: nativeImage.createFromPath(URILogo),
		width: 800,
		height: 600,
		show: false,
		webPreferences: {
			preload: join(__dirname, 'preload.js'),
			contextIsolation: true,
		},
	});

	win.loadFile(join(__dirname, 'rendered', 'index.html'));
	win.maximize();
	win.setMenu(null); // establecer en production
	win.show();
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

	// separator multiplataforma
	const separator = (process.platform === 'linux' || process.platform === 'darwin') ?  '/' : '\\';
    const files = result.filePaths.map((filePath, index) => {
        const resultSplit = filePath.split(separator);
        const name = resultSplit.pop();
         
        return {name, filePath, index, selected: false};
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
