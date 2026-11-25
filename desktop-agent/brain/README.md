# AplusCity Brain Core V1 / V2 Desktop Runtime

Brain Core is a modular orchestration foundation for the AplusCity digital agent. It remains isolated from the existing production web application.

## V1 modules

- orchestrator.cjs: unified planning, memory lookup, tool invocation and audit.
- model-provider.cjs: OpenAI-compatible chat-completions provider and unconfigured fallback.
- roles.json / role-registry.cjs: nine specialist roles.
- task-planner.cjs: structured model planning with a safe local fallback. Planning never executes tools.
- tool-registry.cjs / decision-engine.cjs: named tool registry and centralized permission checks.
- memory-store.cjs / audit-store.cjs: memory and audit interfaces with in-memory reference adapters.

## V2 desktop runtime

- Electron main process creates one BrainOrchestrator and exposes narrowly scoped IPC methods through preload.cjs.
- The desktop UI can configure a model endpoint, model ID, API key, enterprise scope label and employee scope label.
- API key and settings are stored in the OS-protected encrypted vault. No plaintext fallback is permitted.
- PersistentMemoryStore and PersistentAuditStore use EncryptedJsonStore; the data files are stored under Electron userData/brain-vault.
- Windows safeStorage uses DPAPI. It protects data from other Windows user accounts, but does not protect against malicious software already running as the same Windows user.
- WeChat launch is registered as a Brain tool and passes through the permission policy. The existing Windows agent still only launches the app and observes visible window metadata.
- IPC handlers reject calls from a renderer other than the app's own local file renderer.

## Configure a model

In the desktop app, enter:
- Enterprise scope ID (a local partition label, not authentication)
- Employee scope ID (a local partition label, not authentication)
- Model ID
- Full chat-completions endpoint URL
- API key

The key is encrypted locally and is not returned to the renderer after saving. HTTPS is required except for localhost endpoints, which may use HTTP for local model runtimes. Never commit API keys to GitHub.

## Use

1. Run `npm install` and `npm start` from `desktop-agent/`.
2. Configure the model and local scope labels in the app.
3. Enter a task and ask the Brain Core to produce a plan.
4. Save durable notes/experience in the encrypted memory panel.
5. The plan is planning-only. Tool execution requires a separate invocation and permission decision.

## Security boundaries

- Default permission mode remains observe.
- Sensitive actions such as sending messages, recording meetings, deleting data, payments and external sharing require explicit confirmation and are not exposed as automatic UI actions in this release.
- A task plan is never permission to execute its steps.
- No tool reads private WeChat messages, sends messages, records meetings, deletes files, pays, or shares data.
- Enterprise and employee identifiers currently provide data partitioning only. They are not a login system or proof of identity; production multi-user authentication and server-side tenant authorization remain future work.
- Windows DPAPI protects the vault across Windows user accounts but not against malicious processes running as the same account. Use a dedicated, secured Windows account for sensitive enterprise data.
- Model calls send the task prompt to the configured model endpoint. Local memory is not included by default; the user must explicitly check the memory-sharing consent before relevant memory is sent. Review the provider's privacy, retention and regional processing terms before sending enterprise information.

## Tests

Run `npm test` from `desktop-agent/`. Tests use Node's built-in test runner and require no API key or network access. Persistent-store tests use a deterministic test cipher; they do not replace an integration test on a real Windows machine using DPAPI.
