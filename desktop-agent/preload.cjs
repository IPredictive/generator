const {contextBridge,ipcRenderer}=require("electron");
const invoke=channel=>(payload)=>ipcRenderer.invoke(channel,payload);
contextBridge.exposeInMainWorld("apluscityAgent",Object.freeze({
  getStatus:()=>ipcRenderer.invoke("agent:get-status"),
  getWindows:()=>ipcRenderer.invoke("agent:get-windows"),
  detectWeChat:()=>ipcRenderer.invoke("agent:detect-wechat"),
  launchWeChat:()=>ipcRenderer.invoke("agent:launch-wechat"),
  getBrainStatus:()=>ipcRenderer.invoke("brain:get-status"),
  saveBrainSettings:invoke("brain:save-settings"),
  planTask:invoke("brain:plan-task"),
  remember:invoke("brain:remember"),
  searchMemory:invoke("brain:search-memory")
}));
