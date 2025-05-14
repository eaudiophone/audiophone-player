import {contextBridge, ipcRenderer} from 'electron';

contextBridge.exposeInMainWorld('API', {
    openFileDialog: () => ipcRenderer.invoke('openFileDialog'),
});