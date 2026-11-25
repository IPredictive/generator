const fs=require("node:fs/promises");
const path=require("node:path");
class EncryptedJsonStore {
  constructor({filePath,encrypt,decrypt}={}) {
    if(!filePath||typeof encrypt!=="function"||typeof decrypt!=="function") throw new TypeError("filePath, encrypt and decrypt are required.");
    this.filePath=filePath; this.encrypt=encrypt; this.decrypt=decrypt; this.queue=Promise.resolve();
  }
  async load(fallback) {
    try {
      const bytes=await fs.readFile(this.filePath);
      const plain=await this.decrypt(bytes);
      return JSON.parse(plain);
    } catch(error) {
      if(error.code==="ENOENT") return fallback;
      throw new Error("Encrypted store could not be opened. Data was not overwritten: "+error.message);
    }
  }
  async save(value) {
    const operation=async()=>{
      const directory=path.dirname(this.filePath);
      await fs.mkdir(directory,{recursive:true});
      const encrypted=await this.encrypt(JSON.stringify(value));
      const temp=this.filePath+".tmp";
      await fs.writeFile(temp,encrypted,{mode:0o600});
      await fs.rename(temp,this.filePath);
    };
    this.queue=this.queue.then(operation,operation);
    return this.queue;
  }
}
module.exports={EncryptedJsonStore};
