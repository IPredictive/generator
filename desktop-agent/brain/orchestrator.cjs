const { OpenAICompatibleProvider, UnconfiguredModelProvider } = require("./model-provider.cjs");
const { RoleRegistry } = require("./role-registry.cjs");
const { TaskPlanner } = require("./task-planner.cjs");
const { InMemoryMemoryStore } = require("./memory-store.cjs");
const { InMemoryAuditStore } = require("./audit-store.cjs");
const { ToolRegistry } = require("./tool-registry.cjs");
class BrainOrchestrator {
  constructor(options={}) {
    this.provider=options.provider||(process.env.APLUSCITY_MODEL_API_KEY&&process.env.APLUSCITY_MODEL?new OpenAICompatibleProvider(options.modelOptions):new UnconfiguredModelProvider());
    this.roles=options.roleRegistry||new RoleRegistry();
    this.memory=options.memoryStore||new InMemoryMemoryStore();
    this.audit=options.auditStore||new InMemoryAuditStore();
    this.tools=options.toolRegistry||new ToolRegistry({auditStore:this.audit});
    this.planner=options.planner||new TaskPlanner({provider:this.provider,roleRegistry:this.roles});
  }
  async planTask({request,identity,roles,mode="observe",includeMemory=false}={}) {
    if (!identity||!identity.tenantId||!identity.userId) throw new Error("A tenantId and userId are required before planning an enterprise task.");
    const context=includeMemory?await this.memory.search({identity,query:request,limit:8}):[];
    const plan=await this.planner.plan({request,identity,roles,memory:context});
    await this.audit.record({
      event:"task_planned",tenantId:identity.tenantId,userId:identity.userId,decision:"allow",outcome:"planned",
      metadata:{mode,provider:plan.provider,stepCount:plan.steps.length,specialistCount:plan.specialists?plan.specialists.length:0}
    });
    return {taskId:"task-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),status:"planned",
      identity:{tenantId:String(identity.tenantId),userId:String(identity.userId)},plan};
  }
  async invokeTool({name,input,identity,mode="observe",explicitlyRequested=false,preapproved=false}={}) {
    if (!identity||!identity.tenantId||!identity.userId) throw new Error("A tenantId and userId are required for tool invocation.");
    return this.tools.invoke(name,input,{identity,mode,explicitlyRequested,preapproved});
  }
  async remember({identity,type,content,metadata}={}) {
    const record=await this.memory.save({identity,type,content,metadata});
    await this.audit.record({event:"memory_saved",tenantId:identity.tenantId,userId:identity.userId,decision:"allow",outcome:"saved",metadata:{type:type||"note",memoryId:record.id}});
    return record;
  }
}
module.exports = { BrainOrchestrator };
