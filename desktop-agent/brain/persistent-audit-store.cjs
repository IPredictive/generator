const crypto=require("node:crypto");
const {AuditStore,safeMetadata}=require("./audit-store.cjs");
class PersistentAuditStore extends AuditStore {
  constructor({store}={}) { super(); if(!store) throw new TypeError("Encrypted store is required."); this.store=store; this.queue=Promise.resolve(); }
  async record(event={}) {
    const row={id:"audit-"+crypto.randomUUID(),timestamp:new Date().toISOString(),event:String(event.event||"unknown"),
      tenantId:event.tenantId?String(event.tenantId):null,userId:event.userId?String(event.userId):null,
      action:event.action?String(event.action):null,decision:event.decision?String(event.decision):null,
      outcome:event.outcome?String(event.outcome):null,metadata:safeMetadata(event.metadata)};
    const op=async()=>{const rows=await this.store.load([]);rows.push(row);await this.store.save(rows.slice(-10000));return row;};
    const result=this.queue.then(op,op);this.queue=result.then(()=>undefined,()=>undefined);return result;
  }
  async list({tenantId,limit=100}={}) {
    await this.queue;const rows=await this.store.load([]);
    return rows.filter(row=>!tenantId||row.tenantId===String(tenantId)).slice(-Math.max(1,Number(limit)||100));
  }
}
module.exports={PersistentAuditStore};
