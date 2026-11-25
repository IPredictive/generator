const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 820,
    minHeight: 600,
    title: "AplusCity Desktop Agent",
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  ipcMain.handle("agent:get-status", async () => ({
    app: "AplusCity Desktop Agent",
    platform: process.platform,
    version: app.getVersion(),
    phase: "foundation",
    capabilities: {
      localAutomation: false,
      wechat: "not-connected",
      zoom: "not-connected",
      recording: "not-enabled",
      aiBrain: "not-connected"
    }
  }));

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
