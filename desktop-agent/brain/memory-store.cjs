function scopeKey(identity = {}) {
  if (!identity.tenantId || !identity.userId) throw new Error("tenantId and userId are required for memory isolation.");
  return String(identity.tenantId) + "::" + String(identity.userId);
}
class MemoryStore {
  async search() { throw new Error("MemoryStore.search must be implemented."); }
  async save() { throw new Error("MemoryStore.save must be implemented."); }
}
class InMemoryMemoryStore extends MemoryStore {
  constructor() { super(); this.records = new Map(); }
  async save({ identity, type = "note", content, metadata = {} } = {}) {
    const key = scopeKey(identity);
    if (typeof content !== "string" || !content.trim()) throw new TypeError("Memory content is required.");
    const record = Object.freeze({
      id:"mem-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),
      scope:key, tenantId:String(identity.tenantId), userId:String(identity.userId),
      type, content:content.trim(), metadata:{...metadata}, createdAt:new Date().toISOString()
    });
    const rows=this.records.get(key)||[]; rows.push(record); this.records.set(key,rows); return record;
  }
  async search({ identity, query = "", limit = 10, type } = {}) {
    const key=scopeKey(identity), terms=String(query).toLowerCase().split(/\s+/).filter(Boolean);
    return (this.records.get(key)||[]).filter(row=>!type||row.type===type)
      .map(row=>({row,score:terms.length?terms.filter(term=>row.content.toLowerCase().includes(term)).length:1}))
      .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||b.row.createdAt.localeCompare(a.row.createdAt))
      .slice(0,Math.max(1,Math.min(Number(limit)||10,50))).map(item=>item.row);
  }
}
module.exports = { MemoryStore, InMemoryMemoryStore, scopeKey };
