const crypto=require("node:crypto");
const {MemoryStore,scopeKey}=require("./memory-store.cjs");
class PersistentMemoryStore extends MemoryStore {
  constructor({store}={}) { super(); if(!store) throw new TypeError("Encrypted store is required."); this.store=store; this.queue=Promise.resolve(); }
  async save({identity,type="note",content,metadata={}}={}) {
    const scope=scopeKey(identity);
    if(typeof content!=="string"||!content.trim()) throw new TypeError("Memory content is required.");
    const record={id:"mem-"+crypto.randomUUID(),scope,tenantId:String(identity.tenantId),userId:String(identity.userId),
      type:String(type),content:content.trim(),metadata:{...metadata},createdAt:new Date().toISOString()};
    const op=async()=>{const rows=await this.store.load([]);rows.push(record);await this.store.save(rows);return record;};
    const result=this.queue.then(op,op);this.queue=result.then(()=>undefined,()=>undefined);return result;
  }
  async search({identity,query="",limit=10,type}={}) {
    const scope=scopeKey(identity),terms=String(query).toLowerCase().split(/\s+/).filter(Boolean);
    await this.queue;
    const rows=await this.store.load([]);
    return rows.filter(row=>row.scope===scope&&(!type||row.type===type))
      .map(row=>({row,score:terms.length?terms.filter(term=>row.content.toLowerCase().includes(term)).length:1}))
      .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||b.row.createdAt.localeCompare(a.row.createdAt))
      .slice(0,Math.max(1,Math.min(Number(limit)||10,50))).map(item=>item.row);
  }
}
module.exports={PersistentMemoryStore};
