"""Loopback-only Windows observe-mode bridge. No chat reading/sending in this milestone."""
import ctypes, json, os, subprocess, sys, winreg
from ctypes import wintypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
HOST, PORT = "127.0.0.1", int(os.environ.get("APLUSCITY_AGENT_PORT","18765"))
TOKEN = os.environ.get("APLUSCITY_AGENT_TOKEN","")
if not TOKEN: raise SystemExit("APLUSCITY_AGENT_TOKEN required")
user32=ctypes.windll.user32
EnumWindowsProc=ctypes.WINFUNCTYPE(ctypes.c_bool,wintypes.HWND,wintypes.LPARAM)
def visible_windows():
    rows=[]
    def cb(hwnd,_):
        if not user32.IsWindowVisible(hwnd): return True
        n=user32.GetWindowTextLengthW(hwnd)
        if n<=0: return True
        title=ctypes.create_unicode_buffer(n+1); user32.GetWindowTextW(hwnd,title,n+1)
        pid=wintypes.DWORD(); user32.GetWindowThreadProcessId(hwnd,ctypes.byref(pid))
        rows.append({"handle":int(hwnd),"title":title.value,"pid":int(pid.value)})
        return True
    user32.EnumWindows(EnumWindowsProc(cb),0)
    return rows
def find_wechat():
    roots=[Path(os.environ.get("ProgramFiles",r"C:\Program Files"))/"Tencent/WeChat/WeChat.exe",
           Path(os.environ.get("ProgramFiles(x86)",r"C:\Program Files (x86)"))/"Tencent/WeChat/WeChat.exe",
           Path(os.environ.get("LOCALAPPDATA",""))/"Tencent/WeChat/WeChat.exe"]
    for root in (winreg.HKEY_CURRENT_USER,winreg.HKEY_LOCAL_MACHINE):
      for view in (winreg.KEY_WOW64_64KEY,winreg.KEY_WOW64_32KEY):
       try:
        k=winreg.OpenKey(root,r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",0,winreg.KEY_READ|view); i=0
        while True:
         try:
          sub=winreg.EnumKey(k,i); i+=1; sk=winreg.OpenKey(k,sub)
          try:
           name,_=winreg.QueryValueEx(sk,"DisplayName")
           if "wechat" in str(name).lower() or "微信" in str(name):
            try:
             loc,_=winreg.QueryValueEx(sk,"InstallLocation"); roots.append(Path(loc)/"WeChat.exe")
            except OSError: pass
          finally: winreg.CloseKey(sk)
         except OSError: break
        winreg.CloseKey(k)
       except OSError: pass
    for p in roots:
      if p.is_file(): return str(p)
    return None
class Handler(BaseHTTPRequestHandler):
 def send_json(self,code,obj):
    b=json.dumps(obj,ensure_ascii=False).encode()
    self.send_response(code); self.send_header("Content-Type","application/json; charset=utf-8")
    self.send_header("Content-Length",str(len(b))); self.send_header("Cache-Control","no-store"); self.end_headers(); self.wfile.write(b)
 def authorized(self): return self.headers.get("Authorization","")=="Bearer "+TOKEN
 def do_GET(self):
    if not self.authorized(): return self.send_json(401,{"ok":False,"error":"unauthorized"})
    if self.path=="/status": return self.send_json(200,{"ok":True,"platform":sys.platform,"mode":"observe"})
    if self.path=="/windows": return self.send_json(200,{"ok":True,"windows":visible_windows()})
    if self.path=="/wechat/detect":
      p=find_wechat(); return self.send_json(200,{"ok":True,"installed":bool(p),"executable":p})
    return self.send_json(404,{"ok":False,"error":"not_found"})
 def do_POST(self):
    if not self.authorized(): return self.send_json(401,{"ok":False,"error":"unauthorized"})
    if self.path!="/wechat/launch": return self.send_json(404,{"ok":False,"error":"action_not_allowed"})
    p=find_wechat()
    if not p: return self.send_json(404,{"ok":False,"error":"WeChat desktop app was not found"})
    try: subprocess.Popen([p],close_fds=True); return self.send_json(200,{"ok":True,"message":"WeChat launch requested"})
    except OSError as e: return self.send_json(500,{"ok":False,"error":str(e)})
 def log_message(self,*args): pass
if __name__=="__main__": HTTPServer((HOST,PORT),Handler).serve_forever()
