const REDACT_KEYS = /token|secret|password|api.?key|authorization|cookie/i;
function safeMetadata(value) {
  if (!value || typeof value !== "object") return {};
  const output={};
  for (const [key,item] of Object.entries(value)) {
    if (REDACT_KEYS.test(key)) output[key]="[REDACTED]";
    else if (item===null || ["string","number","boolean"].includes(typeof item)) output[key]=item;
    else if (Array.isArray(item)) output[key]="[array:"+item.length+"]";
    else output[key]="[object]";
  }
  return output;
}
class AuditStore {
  async record() { throw new Error("AuditStore.record must be implemented."); }
  async list() { throw new Error("AuditStore.list must be implemented."); }
}
class InMemoryAuditStore extends AuditStore {
  constructor() { super(); this.events=[]; }
  async record(event={}) {
    const row=Object.freeze({
      id:"audit-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),
      timestamp:new Date().toISOString(), event:String(event.event||"unknown"),
      tenantId:event.tenantId?String(event.tenantId):null, userId:event.userId?String(event.userId):null,
      action:event.action?String(event.action):null, decision:event.decision?String(event.decision):null,
      outcome:event.outcome?String(event.outcome):null, metadata:safeMetadata(event.metadata)
    });
    this.events.push(row); return row;
  }
  async list({tenantId,limit=100}={}) {
    return this.events.filter(e=>!tenantId||e.tenantId===String(tenantId)).slice(-Math.max(1,Number(limit)||100));
  }
}
module.exports = { AuditStore, InMemoryAuditStore, safeMetadata };
