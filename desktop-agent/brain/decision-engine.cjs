const policy = require("./decision-policy.json");

const SENSITIVE = new Set(policy.sensitive_actions);

function evaluateAction({ mode = "observe", action, explicitlyRequested = false, preapproved = false } = {}) {
  const rules = policy.permission_modes[mode];
  if (!rules || !action) return { decision: "deny", reason: "Unknown permission mode or missing action." };

  if (SENSITIVE.has(action)) {
    return {
      decision: "confirm",
      reason: "Sensitive or externally visible action requires explicit user confirmation."
    };
  }

  const allowed = new Set(rules.allow || []);
  if (allowed.has(action) || (mode !== "observe" && action === "observe")) {
    if (mode === "auto" && action === "preapproved_reversible_local_actions" && !preapproved) {
      return { decision: "confirm", reason: "Auto mode requires a previously approved scope." };
    }
    return { decision: "allow", reason: "Action is within the current permission policy." };
  }

  if (mode === "observe" && action === "launch_app_on_user_request" && explicitlyRequested) {
    return { decision: "allow", reason: "The user explicitly requested this local app launch." };
  }

  return { decision: "deny", reason: "Action is not enabled in the current permission mode." };
}

function buildDecisionBrief(input = {}) {
  return {
    objective: input.objective || "Clarify the intended outcome",
    beneficiary: input.beneficiary || "Not yet identified",
    value_hypothesis: input.valueHypothesis || "State the human or customer value to be created",
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    assumptions: Array.isArray(input.assumptions) ? input.assumptions : [],
    options: Array.isArray(input.options) ? input.options : [],
    recommendation: input.recommendation || "Do not decide until the key uncertainty is addressed",
    risks: Array.isArray(input.risks) ? input.risks : [],
    next_action: input.nextAction || "Gather the smallest piece of evidence that can change the decision",
    success_check: input.successCheck || "Define an observable result before execution"
  };
}

module.exports = { evaluateAction, buildDecisionBrief };
