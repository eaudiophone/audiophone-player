import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('API', {
    loadFiles: () => ipcRenderer.invoke('loadFiles'),
});