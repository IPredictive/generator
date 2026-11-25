const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("apluscityAgent",Object.freeze({getStatus:()=>ipcRenderer.invoke("agent:get-status"),getWindows:()=>ipcRenderer.invoke("agent:get-windows"),detectWeChat:()=>ipcRenderer.invoke("agent:detect-wechat"),launchWeChat:()=>ipcRenderer.invoke("agent:launch-wechat")}));
