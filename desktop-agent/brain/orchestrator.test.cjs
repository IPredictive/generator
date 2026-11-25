const test=require("node:test");
const assert=require("node:assert/strict");
const {BrainOrchestrator,InMemoryMemoryStore,InMemoryAuditStore,RoleRegistry,ToolRegistry}=require("./index.cjs");

test("registers exactly nine specialist roles",()=>{
  const roles=new RoleRegistry();
  assert.equal(roles.list().length,9);
  assert.ok(roles.get("risk"));
  assert.ok(roles.get("learning"));
});

test("plans a task without a model and never executes tools",async()=>{
  const brain=new BrainOrchestrator();
  const task=await brain.planTask({request:"Prepare a customer meeting",identity:{tenantId:"acme",userId:"u1"}});
  assert.equal(task.status,"planned");
  assert.equal(task.plan.provider,"fallback");
  assert.ok(task.plan.steps.length>=1);
  assert.equal(task.plan.mode,"planning_only");
});

test("memory is isolated by tenant and user",async()=>{
  const memory=new InMemoryMemoryStore();
  await memory.save({identity:{tenantId:"tenant-a",userId:"user-a"},content:"Customer Alpha renewal"});
  assert.equal((await memory.search({identity:{tenantId:"tenant-a",userId:"user-a"},query:"Alpha"})).length,1);
  assert.equal((await memory.search({identity:{tenantId:"tenant-b",userId:"user-a"},query:"Alpha"})).length,0);
  assert.equal((await memory.search({identity:{tenantId:"tenant-a",userId:"user-b"},query:"Alpha"})).length,0);
});

test("sensitive tool invocation requires confirmation and never runs",async()=>{
  const audit=new InMemoryAuditStore(), tools=new ToolRegistry({auditStore:audit});
  let executed=false;
  tools.register({name:"wechat.send",action:"send_message",execute:async()=>{executed=true;}});
  const result=await tools.invoke("wechat.send",{text:"hello"},{identity:{tenantId:"t1",userId:"u1"},mode:"auto",explicitlyRequested:true});
  assert.equal(result.status,"confirmation_required");
  assert.equal(executed,false);
  assert.equal((await audit.list({tenantId:"t1"})).length,1);
});

test("explicitly requested local app launch can run in observe mode",async()=>{
  const brain=new BrainOrchestrator(); let executed=false;
  brain.tools.register({name:"desktop.launch",action:"launch_app_on_user_request",execute:async()=>{executed=true;return "launched";}});
  const result=await brain.invokeTool({name:"desktop.launch",input:{},identity:{tenantId:"t1",userId:"u1"},mode:"observe",explicitlyRequested:true});
  assert.equal(result.status,"succeeded"); assert.equal(executed,true);
});

test("app launch is denied without explicit request",async()=>{
  const brain=new BrainOrchestrator(); let executed=false;
  brain.tools.register({name:"desktop.launch",action:"launch_app_on_user_request",execute:async()=>{executed=true;}});
  const result=await brain.invokeTool({name:"desktop.launch",input:{},identity:{tenantId:"t1",userId:"u1"},mode:"observe"});
  assert.equal(result.status,"denied"); assert.equal(executed,false);
});

test("audit metadata redacts credential-like fields",async()=>{
  const audit=new InMemoryAuditStore();
  await audit.record({event:"test",metadata:{api_key:"dont-store",count:2}});
  const [row]=await audit.list();
  assert.equal(row.metadata.api_key,"[REDACTED]"); assert.equal(row.metadata.count,2);
});

test("unconfigured model provider fails clearly without network access",async()=>{
  const {UnconfiguredModelProvider}=require("./model-provider.cjs");
  const provider=new UnconfiguredModelProvider();
  assert.equal(provider.isConfigured(),false);
  await assert.rejects(provider.generate(),/No model provider configured/);
});
