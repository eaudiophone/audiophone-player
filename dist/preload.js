"use strict";

// src/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("API", {
  openFileDialog: () => import_electron.ipcRenderer.invoke("openFileDialog")
});
