"use strict";

// src/index.ts
var import_path = require("path");
var import_electron2 = require("electron");

// src/events.ts
var import_electron = require("electron");
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

// src/index.ts
var createWindow = () => {
  const win = new import_electron2.BrowserWindow({
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
import_electron2.app.whenReady().then(() => {
  createWindow();
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron2.app.quit();
  }
});
