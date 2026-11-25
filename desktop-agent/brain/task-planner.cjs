function extractJson(text) {
  const source = String(text || "").trim().replace(/^\x60\x60\x60(?:json)?\s*/i, "").replace(/\x60\x60\x60\s*$/i, "");
  const start = source.indexOf("{"), end = source.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Planner response did not contain a JSON object.");
  return JSON.parse(source.slice(start, end + 1));
}
function fallbackPlan(request) {
  const objective = String(request || "").trim();
  return {
    title: objective.length > 72 ? objective.slice(0, 69) + "..." : objective,
    objective, mode: "planning_only",
    steps: [
      { id:"understand", title:"确认目标与约束", description:"明确期望结果、受益者、范围和限制。", kind:"reasoning", requiresApproval:false },
      { id:"context", title:"收集获授权的相关信息", description:"检索可用记忆、文件或业务上下文；不得越过访问权限。", kind:"context", requiresApproval:false },
      { id:"prepare", title:"准备方案与待执行事项", description:"形成可审查的行动步骤；本阶段不自动调用外部工具。", kind:"preparation", requiresApproval:false },
      { id:"verify", title:"定义完成验证", description:"明确可观察的成功标准、风险和回退方式。", kind:"verification", requiresApproval:false }
    ],
    successCriteria:["目标和约束清晰","行动方案可审查","每项结果有验证方式"],
    assumptions:["当前未连接真实模型时使用基础规划模板"],
    risks:["基础模板不是领域专家判断，重要决策需要进一步核实"]
  };
}
class TaskPlanner {
  constructor({ provider, roleRegistry } = {}) { this.provider = provider || null; this.roleRegistry = roleRegistry; }
  async plan({ request, roles, memory = [], identity = {} } = {}) {
    if (!String(request || "").trim()) throw new TypeError("Task request is required.");
    const selectedRoles = this.roleRegistry ? this.roleRegistry.select(roles) : [];
    if (!this.provider || !this.provider.isConfigured || !this.provider.isConfigured()) {
      return { ...fallbackPlan(request), specialists:selectedRoles.map(r => r.id), provider:"fallback" };
    }
    const roleBrief = selectedRoles.map(r => ({ id:r.id, name:r.name, focus:r.focus, instruction:r.instruction }));
    const prompt = [
      "Create a safe, verifiable task plan for AplusCity Silicon Intelligence.",
      "Return JSON only with keys: title, objective, steps, successCriteria, assumptions, risks.",
      "Each step must have id, title, description, kind, requiresApproval.",
      "Do not execute tools. Mark externally visible, destructive, financial, recording or data-sharing actions as requiring approval.",
      "Do not invent facts. Separate assumptions from evidence.",
      "Tenant: " + String(identity.tenantId || ""),
      "Specialist roles: " + JSON.stringify(roleBrief),
      "Relevant authorized memory: " + JSON.stringify(memory),
      "User request: " + String(request)
    ].join("\n");
    const raw = await this.provider.generate({ system:"You are the planning engine. Produce conservative, structured and testable plans.", user:prompt });
    const parsed = extractJson(raw);
    if (!Array.isArray(parsed.steps) || !parsed.steps.length) throw new Error("Planner response must include at least one step.");
    return {
      title:String(parsed.title || request).slice(0,160), objective:String(parsed.objective || request), mode:"planning_only",
      steps:parsed.steps.map((step,index)=>({ id:String(step.id || "step-"+(index+1)), title:String(step.title || "Step "+(index+1)), description:String(step.description || ""), kind:String(step.kind || "reasoning"), requiresApproval:Boolean(step.requiresApproval) })),
      successCriteria:Array.isArray(parsed.successCriteria)?parsed.successCriteria:[],
      assumptions:Array.isArray(parsed.assumptions)?parsed.assumptions:[],
      risks:Array.isArray(parsed.risks)?parsed.risks:[],
      specialists:selectedRoles.map(r=>r.id), provider:"model"
    };
  }
}
module.exports = { TaskPlanner, fallbackPlan, extractJson };
