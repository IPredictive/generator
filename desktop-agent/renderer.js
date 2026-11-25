async function loadStatus() {
  const target = document.getElementById("status");
  try {
    const status = await window.apluscityAgent.getStatus();
    target.textContent = `桌面外壳已启动（${status.platform}）。本地自动化：未启用；微信：未连接；Zoom：未连接。`;
  } catch {
    target.textContent = "无法读取本地代理状态。";
  }
}
loadStatus();
