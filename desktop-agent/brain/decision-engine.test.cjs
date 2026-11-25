const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateAction, buildDecisionBrief } = require("./decision-engine.cjs");

test("sensitive actions always require confirmation", () => {
  for (const action of ["send_message", "record_meeting", "delete_data", "payment", "external_share"]) {
    assert.equal(evaluateAction({ mode: "auto", action }).decision, "confirm");
  }
});

test("observe mode allows app launch only when explicitly requested", () => {
  assert.equal(evaluateAction({ mode: "observe", action: "launch_app_on_user_request", explicitlyRequested: true }).decision, "allow");
  assert.equal(evaluateAction({ mode: "observe", action: "launch_app_on_user_request" }).decision, "deny");
});

test("observe mode denies private chat reading", () => {
  assert.equal(evaluateAction({ mode: "observe", action: "read_private_chat_content" }).decision, "deny");
});

test("decision brief keeps a stable structure", () => {
  const brief = buildDecisionBrief({ objective: "Improve customer response time", evidence: ["Current response takes 2 days"] });
  assert.equal(brief.objective, "Improve customer response time");
  assert.deepEqual(brief.evidence, ["Current response takes 2 days"]);
  assert.ok(brief.success_check);
});
