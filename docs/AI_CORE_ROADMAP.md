# AplusCity AI Core — Architecture and Phase 1 Roadmap

Status: planning baseline, 2026-10-15  
Repository: `IPredictive/generator`

## Goals

Build an AplusCity-owned AI platform that can serve Companion and future AplusCity products through one stable server-side interface. Start with low cost and low operational risk. Keep the current Companion chat working while the new core is developed behind a feature flag and tested before any production cutover.

“Own model” is a staged goal: own the orchestration, product behavior, evaluation set, consented training data, deployment controls, and eventually a fine-tuned open-weight model. Phase 1 does **not** train a foundation model and does not remove the existing Agnes provider.

## Current verified baseline

- `api/companion-chat.js` calls `agnes-3.0-flash` through the Agnes-compatible chat completions endpoint.
- The backend verifies the Supabase Auth bearer token before reading or writing user data.
- Conversation history, memories, and care plans are queried with the verified user's ID and the caller's access token; database Row Level Security is enabled.
- Current context uses up to 12 recent messages and 30 saved memories.
- Chat data lives in the dedicated Supabase project `apluscity-companion` (`dmnrrgzqeagwqhwrmhok`), separate from the SSE community project.
- The current chat API is a Vercel serverless function. Existing Companion is production-facing and must remain the fallback during development.
- Existing per-instance throttling is best-effort only: the in-memory request counter resets on cold starts and is not a reliable cross-instance production quota.

## Target architecture

```text
Companion / Studio / future AplusCity apps
                  |
                  v
       AplusCity AI Gateway (server-side)
       - auth and per-user quotas
       - request validation
       - provider/model routing
       - timeout, retry and fallback policy
       - usage/cost and latency metrics
                  |
                  v
          Model Adapter Interface
           /                  \\
          v                    v
 Existing provider         Future AplusCity model
 (Agnes fallback)          (open-weight base + fine-tune)
          \\                    /
           v                  v
          Shared prompt, safety and evaluation layer

Supabase:
- private conversation history (per user)
- private personal memories / care plan (per user)
- separate consented, minimized training examples (not copied automatically)
- model evaluations and aggregate operational metrics (no raw private chat by default)
```

The gateway is the shared entry point; it is not itself a trained model. This lets all products share stable behavior and lets us swap model providers without rewriting every UI.

## Phase 1 — safe foundation (no model training yet)

### 1. Protect the working Companion
- Do not replace or rewrite `api/companion-chat.js` in the first change.
- Keep its current provider as the production fallback.
- Build new modules separately and enable them only with an explicit server-side feature flag.
- Make changes in small commits and test the deployed production chat after each release.

### 2. Define a provider-neutral adapter
Create a server-only adapter contract with inputs such as system instructions, recent conversation, private memory context, model selection, token budget, and abort signal. Normalize outputs to `{ reply, usage, provider, model, latencyMs }`. Never send provider API keys to the browser.

### 3. Establish measurable baselines
Capture only operational metadata by default: provider/model, latency, success/error class, token usage if available, and approximate cost if available. Do not log raw messages, personal memories, access tokens, PINs, or API keys. Add a small manually reviewed evaluation set covering Chinese and English, context continuity, helpfulness, latency, prompt injection, privacy boundaries, and safety.

### 4. Improve speed with bounded context
Keep recent turns bounded, summarize older turns only when needed, and retrieve a small number of relevant user-approved memories rather than injecting every memory. Treat retrieved memories as untrusted context, never as system instructions. Do not cache personalized prompts or answers across users. Cache only public, non-personal configuration where appropriate.

### 5. Enforce per-user privacy
- Continue verifying Supabase Auth on every request.
- Every private database query must be scoped to the verified `user.id`; retain and test Row Level Security.
- Never put one user's messages, memory, care plan, or embeddings into another user's prompt.
- Keep training data in separate tables/storage with explicit opt-in consent and provenance.
- Exclude secrets and sensitive personal data; support deletion and honor withdrawal from future training use.
- Use aggregate metrics without message content wherever possible.

### 6. Control cost and abuse
- Set explicit per-user request/token budgets and provider timeouts.
- Replace in-memory-only throttling with a durable shared quota mechanism before opening access broadly.
- Bound input length, output tokens, retries, and concurrent requests.
- Use a smaller/cheaper model for simple tasks only after quality is measured.
- Do not automatically send every user message to a fine-tuning dataset.

### 7. Prepare a consented improvement loop
Initially allow staff to create synthetic or explicitly consented, de-identified examples and annotate good/bad responses. Keep evaluation examples separate from training examples. Review data quality and privacy before any fine-tuning. User correction feedback must not automatically expose private conversations to other users or become training data without consent.

## Phase 1 acceptance criteria

- Existing Companion chat, history, and memory-code login continue to work.
- All new AI calls remain server-side; no secret keys are included in frontend bundles.
- Automated tests prove that user A cannot read user B's messages, memories, or care plan.
- Logs contain no raw private chat, bearer token, PIN, or API key.
- Baseline latency, error rate, and usage are measured before and after changes.
- A feature flag can turn off the new gateway and route back to the existing provider.
- No production model switch or paid GPU service is enabled without a separate decision.

## Later phases

### Phase 2 — shared intelligence
- Use one gateway across Companion and Studio.
- Add durable quotas, structured feedback, prompt/version management, regression evaluation, and provider fallback.
- Add a private memory retrieval layer with per-user access enforcement.

### Phase 3 — AplusCity model adaptation
- Select an appropriately licensed open-weight model based on language quality, hardware, latency, and commercial-use terms.
- Fine-tune with reviewed, consented examples; begin with a small supervised fine-tune or adapter/LoRA rather than training from scratch.
- Compare the tuned model against the current provider using a held-out evaluation set; do not deploy if quality or safety regresses.

### Phase 4 — controlled rollout
- Shadow-test or invite a small opt-in cohort.
- Compare response quality, p50/p95 latency, reliability, and cost per 1,000 turns.
- Keep a one-click rollback to the existing provider.
- Expand only after measurable acceptance criteria are met.

## Decisions still required before implementation of the gateway

1. Hosting choice for the first shared gateway: keep it on Vercel serverless initially, or use a separate inference service later.
2. Model budget and acceptable latency targets.
3. Whether model improvement data is opt-in only (recommended: yes).
4. Which first evaluation tasks define AplusCity's signature quality.

## Non-goals for Phase 1

- No training from scratch.
- No automatic use of all customer chats for training.
- No cross-user memory sharing.
- No production provider replacement.
- No GPU or paid infrastructure provisioning.
