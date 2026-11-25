const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("apluscityAgent", Object.freeze({
  getStatus: () => ipcRenderer.invoke("agent:get-status")
}));
