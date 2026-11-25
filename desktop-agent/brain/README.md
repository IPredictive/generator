# AplusCity Brain Core V1

Brain Core V1 is a modular orchestration foundation for the AplusCity digital agent. It is separate from the Electron renderer and does not change the existing production web application.

## Modules

- orchestrator.cjs: unified entry point for planning, memory lookup, tool invocation and audit.
- model-provider.cjs: OpenAI-compatible chat-completions provider and an explicit unconfigured provider.
- roles.json and role-registry.cjs: nine specialist roles registered under one Brain Core.
- task-planner.cjs: structured model planning with a safe local fallback. Planning never executes tools.
- tool-registry.cjs: named tool registry with centralized permission checks.
- memory-store.cjs: tenant/user-scoped memory interface and in-memory reference adapter.
- audit-store.cjs: audit interface and in-memory adapter with credential-key redaction.
- decision-engine.cjs: centralized action policy, including explicit-request enforcement for local app launch.

## Configure a model

Set these environment variables before launching the desktop app or a Node process:

- APLUSCITY_MODEL_API_KEY
- APLUSCITY_MODEL
- Optional: APLUSCITY_MODEL_BASE_URL (full chat-completions endpoint)
- Optional: APLUSCITY_MODEL_TIMEOUT_MS

The provider uses Node's built-in fetch and does not add a model SDK dependency. Do not commit API keys or place them in renderer code.

## Example

    const { BrainOrchestrator } = require("./index.cjs");
    const brain = new BrainOrchestrator();
    const task = await brain.planTask({
      request: "Prepare tomorrow's customer meeting",
      identity: { tenantId: "company-001", userId: "employee-001" }
    });
    console.log(task.plan);

Register executable tools explicitly. A plan is not permission to execute. Tool invocations are checked by decision-engine.cjs; sensitive actions always return confirmation_required and do not execute.

## Important V1 boundaries

- Default memory and audit adapters are in-memory only and reset when the process exits. They are interfaces for later encrypted/durable adapters, not yet a production persistence layer.
- Model integration is optional and is not configured by this commit. Without credentials, deterministic planning fallback is used.
- No default tool can read private chat content, send messages, record meetings, delete files, pay, or share data.
- Existing Windows agent remains observe-mode; Brain Core does not grant it new OS permissions.
- Specialist roles are registered and can be selected, but V1 does not run nine independent model agents in parallel.
- The model provider sends only prompt/context supplied by the caller. Review privacy and provider retention terms before connecting enterprise data.

## Tests

Run npm test from desktop-agent/. Tests use Node's built-in test runner and require no API key or network access.
