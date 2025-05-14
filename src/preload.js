"use strict";

const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("API", {
  openFileDialog: () => ipcRenderer.invoke("openFileDialog")
});
