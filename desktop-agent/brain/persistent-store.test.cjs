const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const os=require("node:os");
const path=require("node:path");
const {EncryptedJsonStore,PersistentMemoryStore,PersistentAuditStore}=require("./index.cjs");

async function fixture(){
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),"apluscity-brain-"));
  const store=new EncryptedJsonStore({
    filePath:path.join(directory,"data.vault"),
    encrypt:async text=>Buffer.from("test-cipher:"+Buffer.from(text,"utf8").toString("base64"),"utf8"),
    decrypt:async bytes=>{
      const value=bytes.toString("utf8");
      if(!value.startsWith("test-cipher:"))throw new Error("invalid ciphertext");
      return Buffer.from(value.slice("test-cipher:".length),"base64").toString("utf8");
    }
  });
  return{directory,store};
}

test("encrypted JSON store persists data without writing plaintext",async()=>{
  const {directory,store}=await fixture();
  try{
    await store.save({secret:"enterprise-memory"});
    const bytes=await fs.readFile(path.join(directory,"data.vault"),"utf8");
    assert.ok(bytes.startsWith("test-cipher:"));
    assert.ok(!bytes.includes("enterprise-memory"));
    assert.deepEqual(await store.load({}),{secret:"enterprise-memory"});
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test("persistent memory survives adapter recreation and remains tenant/user isolated",async()=>{
  const {directory,store}=await fixture();
  try{
    const first=new PersistentMemoryStore({store});
    await first.save({identity:{tenantId:"tenant-a",userId:"employee-1"},content:"Acme renewal is in June"});
    const second=new PersistentMemoryStore({store});
    assert.equal((await second.search({identity:{tenantId:"tenant-a",userId:"employee-1"},query:"renewal"})).length,1);
    assert.equal((await second.search({identity:{tenantId:"tenant-b",userId:"employee-1"},query:"renewal"})).length,0);
    assert.equal((await second.search({identity:{tenantId:"tenant-a",userId:"employee-2"},query:"renewal"})).length,0);
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test("persistent audit survives restart and redacts credentials",async()=>{
  const {directory,store}=await fixture();
  try{
    const first=new PersistentAuditStore({store});
    await first.record({event:"model_configured",tenantId:"t1",userId:"u1",metadata:{api_key:"never-store",model:"model-x"}});
    const second=new PersistentAuditStore({store});
    const [event]=await second.list({tenantId:"t1"});
    assert.equal(event.metadata.api_key,"[REDACTED]");
    assert.equal(event.metadata.model,"model-x");
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test("encrypted store refuses corrupted data and does not replace it",async()=>{
  const {directory,store}=await fixture();
  try{
    const file=path.join(directory,"data.vault");
    await fs.mkdir(directory,{recursive:true});
    await fs.writeFile(file,"broken ciphertext");
    await assert.rejects(store.load([]),/could not be opened/);
    assert.equal(await fs.readFile(file,"utf8"),"broken ciphertext");
  }finally{await fs.rm(directory,{recursive:true,force:true});}
});
