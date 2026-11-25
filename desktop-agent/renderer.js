const $=id=>document.getElementById(id);
function showMessage(id,message,isError=false){const node=$(id);node.textContent=message;node.classList.toggle("error",isError);}
async function refreshStatus(){
  try{
    const s=await window.apluscityAgent.getStatus();
    $("status").textContent=s.ok?"本地 Windows 执行服务已连接（观察模式）。":(s.error||"本地服务未连接");
    const w=await window.apluscityAgent.detectWeChat();
    $("wechat-status").textContent=w.ok?(w.installed?"已找到 Windows 微信："+w.executable:"未找到微信，请先安装 Windows 版微信。"):(w.error||"检测失败");
  }catch(error){$("status").textContent=error.message;}
}
async function refreshWindows(){
  const list=$("windows");list.replaceChildren();
  try{
    const r=await window.apluscityAgent.getWindows();
    if(!r.ok)throw new Error(r.error||"读取失败");
    r.windows.forEach(w=>{const li=document.createElement("li");li.textContent=w.title+" · PID "+w.pid;list.append(li);});
    if(!r.windows.length){const li=document.createElement("li");li.textContent="没有检测到可见窗口";list.append(li);}
  }catch(error){const li=document.createElement("li");li.textContent=error.message;list.append(li);}
}
async function loadBrainStatus(){
  try{
    const s=await window.apluscityAgent.getBrainStatus();
    $("tenant-id").value=s.tenantId;$("user-id").value=s.userId;
    $("model-id").value=s.model;$("model-endpoint").value=s.endpoint;
    $("model-state").textContent=s.configured?"模型已配置："+s.model:"模型尚未连接";
    $("model-state").classList.toggle("ready",s.configured);
    $("role-status").textContent="九个专业脑已注册："+s.roles.map(r=>r.name).join("、");
  }catch(error){showMessage("settings-message",error.message,true);}
}
$("settings-form").addEventListener("submit",async event=>{
  event.preventDefault();showMessage("settings-message","正在加密保存设置…");
  try{
    const result=await window.apluscityAgent.saveBrainSettings({
      tenantId:$("tenant-id").value,userId:$("user-id").value,model:$("model-id").value,
      baseUrl:$("model-endpoint").value,apiKey:$("model-key").value
    });
    $("model-key").value="";$("model-state").textContent="模型已配置："+result.model;$("model-state").classList.add("ready");
    showMessage("settings-message","设置已加密保存。大脑模型接口已连接配置。");
  }catch(error){showMessage("settings-message",error.message,true);}
});
$("task-form").addEventListener("submit",async event=>{
  event.preventDefault();showMessage("task-message","大脑正在分析并制定计划…");$("task-result").textContent="正在规划…";
  try{
    const result=await window.apluscityAgent.planTask({request:$("task-request").value,includeMemory:$("include-memory").checked});
    $("task-result").textContent=JSON.stringify(result,null,2);
    showMessage("task-message",result.plan.provider==="model"?"模型规划完成。尚未执行任何步骤。":"基础规划完成。配置模型后可启用真实模型推理。");
  }catch(error){$("task-result").textContent="";showMessage("task-message",error.message,true);}
});
$("memory-form").addEventListener("submit",async event=>{
  event.preventDefault();showMessage("memory-message","正在加密保存…");
  try{
    const result=await window.apluscityAgent.remember({content:$("memory-content").value});
    $("memory-content").value="";showMessage("memory-message","已保存加密记忆："+result.id);await searchMemory("");
  }catch(error){showMessage("memory-message",error.message,true);}
});
async function searchMemory(query){
  const list=$("memory-results");list.replaceChildren();
  try{
    const rows=await window.apluscityAgent.searchMemory({query});
    if(!rows.length){const li=document.createElement("li");li.textContent="当前身份下暂无匹配记忆。";list.append(li);return;}
    rows.forEach(row=>{const li=document.createElement("li");li.textContent="["+row.type+"] "+row.content+" · "+new Date(row.createdAt).toLocaleString();list.append(li);});
  }catch(error){const li=document.createElement("li");li.textContent=error.message;list.append(li);}
}
$("launch-wechat").addEventListener("click",async()=>{
  $("wechat-status").textContent="正在通过大脑权限层启动微信…";
  try{
    const r=await window.apluscityAgent.launchWeChat();
    const result=r.result||{};
    $("wechat-status").textContent=r.status==="succeeded"&&result.ok?"已请求启动微信。请在电脑上完成登录。":(r.reason||result.error||r.status||"启动失败");
    setTimeout(refreshWindows,1500);
  }catch(error){$("wechat-status").textContent=error.message;}
});
$("refresh-windows").addEventListener("click",refreshWindows);
refreshStatus();refreshWindows();loadBrainStatus();searchMemory("");
