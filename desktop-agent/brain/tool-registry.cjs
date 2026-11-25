const { evaluateAction } = require("./decision-engine.cjs");
class ToolRegistry {
  constructor({auditStore}={}) { this.tools=new Map(); this.auditStore=auditStore||null; }
  register(tool) {
    if (!tool || !/^[a-z][a-z0-9_.-]*$/.test(tool.name||"") || !tool.action || typeof tool.execute!=="function") throw new TypeError("A tool requires a valid name, action and execute function.");
    if (this.tools.has(tool.name)) throw new Error("Duplicate tool: "+tool.name);
    this.tools.set(tool.name,Object.freeze({name:tool.name,description:String(tool.description||""),action:tool.action,execute:tool.execute}));
    return this.tools.get(tool.name);
  }
  list() { return Array.from(this.tools.values()).map(({name,description,action})=>({name,description,action})); }
  async invoke(name,input,context={}) {
    const tool=this.tools.get(name), identity=context.identity||{};
    if (!tool) throw new Error("Unknown tool: "+name);
    const permission=evaluateAction({
      mode:context.mode||"observe", action:tool.action,
      explicitlyRequested:Boolean(context.explicitlyRequested), preapproved:Boolean(context.preapproved)
    });
    const baseEvent={event:"tool_invocation",tenantId:identity.tenantId,userId:identity.userId,action:tool.action,decision:permission.decision,metadata:{tool:name,mode:context.mode||"observe"}};
    if (permission.decision!=="allow") {
      if (this.auditStore) await this.auditStore.record({...baseEvent,outcome:permission.decision});
      return {status:permission.decision==="confirm"?"confirmation_required":"denied",reason:permission.reason};
    }
    if (this.auditStore) await this.auditStore.record({...baseEvent,outcome:"started"});
    try {
      const result=await tool.execute(input,context);
      if (this.auditStore) await this.auditStore.record({...baseEvent,outcome:"succeeded"});
      return {status:"succeeded",result};
    } catch(error) {
      if (this.auditStore) await this.auditStore.record({...baseEvent,outcome:"failed",metadata:{tool:name,error:error.message}});
      throw error;
    }
  }
}
module.exports = { ToolRegistry };
