"use strict";

// src/index.ts
var import_path = require("path");
var import_electron = require("electron");
var createWindow = () => {
  const win = new import_electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: (0, import_path.join)(__dirname, "preload.js"),
      contextIsolation: true
    }
  });
  win.maximize();
  win.loadFile((0, import_path.join)(__dirname, "frontend", "index.html"));
};
import_electron.ipcMain.handle("loadFiles", async () => {
  const result = await import_electron.dialog.showOpenDialog({
    title: "Abrir archivo o carpeta",
    properties: ["openFile", "multiSelections"],
    filters: [{
      extensions: ["mp3", "wav", "ogg", "webm"],
      name: "music"
    }]
  });
  if (result.canceled) return;
  const files = result.filePaths.map((filePath, index) => {
    const resultSplit = filePath.split("/");
    const name = resultSplit[resultSplit.length - 1];
    return { name, filePath, index };
  });
  return files;
});
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron.app.quit();
});
