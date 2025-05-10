
/* create by create-app-cli */
import { join } from 'path';
import { app, BrowserWindow} from 'electron';

import './events';

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
	
	if ( process.platform !== 'darwin' ) {
		app.quit();
	}
});
	