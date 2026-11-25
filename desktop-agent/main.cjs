const {app,BrowserWindow,ipcMain,safeStorage}=require("electron");
const path=require("node:path");
const {spawn}=require("node:child_process");
const crypto=require("node:crypto");
const {BrainOrchestrator,OpenAICompatibleProvider,UnconfiguredModelProvider}=require("./brain");
const {EncryptedJsonStore}=require("./brain/encrypted-json-store.cjs");
const {PersistentMemoryStore}=require("./brain/persistent-memory-store.cjs");
const {PersistentAuditStore}=require("./brain/persistent-audit-store.cjs");

let win,service,brain,settingsStore,settings={};
const token=crypto.randomBytes(32).toString("hex"),port=18765,base="http://127.0.0.1:"+port;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function encryptText(value) {
  if(typeof safeStorage.isAsyncEncryptionAvailable==="function"&&await safeStorage.isAsyncEncryptionAvailable()) {
    return safeStorage.encryptStringAsync(value);
  }
  if(typeof safeStorage.isEncryptionAvailable==="function"&&safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value);
  }
  throw new Error("操作系统加密服务不可用。为保护企业记忆，系统不会降级保存明文。");
}
async function decryptText(bytes) {
  if(typeof safeStorage.decryptStringAsync==="function") {
    const result=await safeStorage.decryptStringAsync(bytes);
    return typeof result==="string"?result:result.result;
  }
  if(typeof safeStorage.decryptString==="function"&&safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(bytes);
  throw new Error("无法使用当前 Windows 用户凭据解密本地数据。");
}
function encryptedStore(fileName) {
  return new EncryptedJsonStore({filePath:path.join(app.getPath("userData"),"brain-vault",fileName),
    encrypt:encryptText,decrypt:decryptText});
}
function createBrain() {
  const provider=settings.apiKey&&settings.model
    ?new OpenAICompatibleProvider({apiKey:settings.apiKey,model:settings.model,baseUrl:settings.baseUrl})
    :new UnconfiguredModelProvider();
  const memoryStore=new PersistentMemoryStore({store:encryptedStore("memory.vault")});
  const auditStore=new PersistentAuditStore({store:encryptedStore("audit.vault")});
  brain=new BrainOrchestrator({provider,memoryStore,auditStore});
  brain.tools.register({name:"desktop.launch-wechat",description:"Launch the installed Windows WeChat app when the user explicitly requests it.",
    action:"launch_app_on_user_request",execute:async()=>request("/wechat/launch","POST")});
}
function startService() {
  if(process.platform!=="win32")return;
  service=spawn("python",[path.join(__dirname,"windows-agent","agent_service.py")],{
    windowsHide:true,stdio:"ignore",env:{...process.env,APLUSCITY_AGENT_TOKEN:token,APLUSCITY_AGENT_PORT:String(port)}
  });
  service.on("error",()=>{});
}
async function request(route,method="GET") {
  if(process.platform!=="win32")return{ok:false,error:"Windows only"};
  let last;
  for(let i=0;i<12;i++) {
    try {const response=await fetch(base+route,{method,headers:{Authorization:"Bearer "+token}});return await response.json();}
    catch(error){last=error;await wait(250);}
  }
  return{ok:false,error:"本地执行服务未启动。请确认已安装 Python 3.10+ 并重启应用。",detail:last&&last.message};
}
function assertTrustedSender(event) {
  if(!win||event.sender!==win.webContents||!event.senderFrame||!event.senderFrame.url.startsWith("file://")) {
    throw new Error("Blocked IPC call from an untrusted renderer.");
  }
}
function handle(channel,handler) {
  ipcMain.handle(channel,(event,...args)=>{assertTrustedSender(event);return handler(...args);});
}
function safeEndpoint(value) {
  const url=new URL(value);
  if(url.protocol!=="https:"&&!(url.protocol==="http:"&&(url.hostname==="127.0.0.1"||url.hostname==="localhost"))) {
    throw new Error("模型端点必须使用 HTTPS；仅允许 localhost 使用 HTTP。");
  }
  if(url.username||url.password)throw new Error("模型端点不能包含账号或密码。");
  return url.toString();
}
function createWindow() {
  win=new BrowserWindow({width:1080,height:900,minWidth:820,minHeight:680,title:"AplusCity Silicon Intelligence",
    backgroundColor:"#0b1020",webPreferences:{preload:path.join(__dirname,"preload.cjs"),
      contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.loadFile(path.join(__dirname,"index.html"));
  win.webContents.setWindowOpenHandler(()=>({action:"deny"}));
}
app.whenReady().then(async()=>{
  settingsStore=encryptedStore("settings.vault");
  try {settings=await settingsStore.load({});}
  catch(error){settings={};console.error("Settings vault error:",error.message);}
  createBrain();
  startService();
  handle("agent:get-status",()=>request("/status"));
  handle("agent:get-windows",()=>request("/windows"));
  handle("agent:detect-wechat",()=>request("/wechat/detect"));
  handle("agent:launch-wechat",async()=>{
    const identity={tenantId:settings.tenantId||"local-enterprise",userId:settings.userId||"desktop-user"};
    return brain.invokeTool({name:"desktop.launch-wechat",input:{},identity,mode:"observe",explicitlyRequested:true});
  });
  handle("brain:get-status",()=>({configured:Boolean(settings.apiKey&&settings.model),model:settings.model||"",
    endpoint:settings.baseUrl||"https://api.openai.com/v1/chat/completions",
    tenantId:settings.tenantId||"",userId:settings.userId||"",roles:brain.roles.list().map(r=>({id:r.id,name:r.name}))}));
  handle("brain:save-settings",async(input={})=>{
    const tenantId=String(input.tenantId||"").trim(),userId=String(input.userId||"").trim();
    const model=String(input.model||"").trim();
    const baseUrl=safeEndpoint(String(input.baseUrl||"https://api.openai.com/v1/chat/completions").trim());
    const apiKey=String(input.apiKey||"").trim()||settings.apiKey||"";
    if(!tenantId||!userId)throw new Error("请填写企业标识和员工标识，用于本机记忆隔离。");
    if(!model)throw new Error("请填写模型名称。");
    if(!apiKey)throw new Error("请填写模型 API Key。密钥会加密保存在本机。");
    if(tenantId.length>100||userId.length>100||model.length>160||apiKey.length>2048)throw new Error("设置内容超过允许长度。");
    settings={tenantId,userId,model,baseUrl,apiKey};
    await settingsStore.save(settings);
    createBrain();
    await brain.audit.record({event:"model_config_saved",tenantId,userId,decision:"allow",outcome:"saved",metadata:{model,endpointHost:new URL(baseUrl).host}});
    return{ok:true,configured:true,model,tenantId,userId};
  });
  handle("brain:plan-task",async(input={})=>{
    const requestText=String(input.request||"").trim();
    if(requestText.length<2||requestText.length>8000)throw new Error("任务内容需为 2 至 8000 个字符。");
    const identity={tenantId:settings.tenantId||"local-enterprise",userId:settings.userId||"desktop-user"};
    return brain.planTask({request:requestText,identity,roles:Array.isArray(input.roles)?input.roles:undefined,mode:"observe"});
  });
  handle("brain:remember",async(input={})=>{
    const content=String(input.content||"").trim();
    if(content.length<2||content.length>4000)throw new Error("记忆内容需为 2 至 4000 个字符。");
    const identity={tenantId:settings.tenantId||"local-enterprise",userId:settings.userId||"desktop-user"};
    return brain.remember({identity,type:"user_note",content});
  });
  handle("brain:search-memory",async(input={})=>{
    const identity={tenantId:settings.tenantId||"local-enterprise",userId:settings.userId||"desktop-user"};
    return brain.memory.search({identity,query:String(input.query||""),limit:10});
  });
  createWindow();
  app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on("before-quit",()=>{if(service)service.kill();});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit();});
