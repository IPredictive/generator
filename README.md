# AplusCity AI Business Studio

A responsive dark-tech website for AplusCity's AI business planning, digital workflow improvement, website/growth projects, and customer enquiries.

Production site: https://generator-gamma-plum.vercel.app/  
Inquiry contact: inquiry@aplusachiever.com  
Source: https://github.com/IPredictive/generator

## Current implementation

- `index.html`: business-services homepage, service engagement overview, customer enquiry form, reference-code display, and project-status tracker.
- `studio.html`: free project brief builder. It assembles a structured brief locally in the visitor's browser and supports copy/save as a text file. Visitors can optionally request an AI proposal outline using the Agnes text API.
- `api/inquiry.js`: validates enquiry submissions and forwards them to the configured Google Apps Script web app. A successful response must include a reference code.
- `api/status.js`: looks up enquiry status by reference code through the same Google Apps Script web app.
- `api/ai-assist.js`: optional, bounded text-only business analysis endpoint using `AGNES_API_KEY` and `agnes-3.0-flash`.
- `api/companion-brain.js`: secured, text-only companion-brain adapter for trusted applications such as ZEE. It accepts character/persona context, relevant memories, recent conversation history, and the latest message; returns `reply` and optional token usage. It does not access or write ZEE's database.
- `api/generate.js` and `api/generate-status.js`: retired endpoints. Both return HTTP 410 and do not contact Agnes AI.

## ZEE / AplusCity Companion brain adapter

This adapter reuses the same OpenAI-compatible Agnes text API contract, but it does not reuse `api/ai-assist.js` because that endpoint has a business-proposal system prompt. ZEE remains responsible for user authentication, loading the correct character and user-specific memories, and persisting each turn. The adapter only generates a reply from the context sent by ZEE.

Request: `POST /api/companion-brain`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <COMPANION_BRAIN_KEY>`

Example request body:
```json
{
  "agent": {
    "name": "ZEE character name",
    "persona": "Character persona notes",
    "traits": "Character traits",
    "currentState": "Read-only character/world state"
  },
  "memories": [{"summary": "A relevant remembered fact"}],
  "history": [
    {"role": "user", "content": "Earlier message"},
    {"role": "assistant", "content": "Earlier reply"}
  ],
  "message": "The latest user message"
}
```

Successful response includes `ok: true`, `reply`, `model`, and optional `usage`. The endpoint limits input context, history and memory counts, request duration, output tokens, and best-effort per-instance request rate. It requires both secrets below and does not expose the provider API key to browsers.

### Required Vercel environment variables

- `AGNES_API_KEY`: server-side provider key; never expose it in frontend code or commit it.
- `COMPANION_BRAIN_KEY`: a separate, high-entropy shared secret. Configure the same value as a Supabase Edge Function secret in ZEE; the ZEE backend sends it in the Authorization header. Do not reuse a user password or publish this value.
- `AGNES_COMPANION_MODEL` (optional): companion model; defaults to `AGNES_MODEL` or `agnes-3.0-flash`.
- `AGNES_BASE_URL` (optional): defaults to `https://apihub.agnes-ai.com/v1`.

Do not point a browser directly at this endpoint. Only a trusted server-side ZEE function should call it. The shared secret is an integration gate, not a replacement for ZEE's user authorization. ZEE must still scope every memory query to the correct user/agent before sending context.

## Cost-control decision

Paid video generation has been intentionally retired. The site no longer offers a live video generation action. The video generation and polling endpoints are disabled in code to prevent calls to the paid provider. The text endpoints can consume Agnes text-model quota; keep usage limits enabled and test with short requests. No video generation is used by the companion-brain adapter.

The basic project brief is generated locally in the browser. If a visitor clicks “Analyse with AI”, the brief is sent to the server-side Agnes text endpoint for an AI proposal outline.

## Enquiry flow

1. A visitor completes the enquiry form on the site.
2. The browser sends form data to `POST /api/inquiry`.
3. The API forwards the request to Google Apps Script.
4. The form displays the reference code returned by the backend.
5. The visitor can enter that code in the project tracker, which calls `GET /api/status?code=...`.

A success message confirms that the backend returned a valid reference code. Email notifications and spreadsheet persistence depend on the deployed Google Apps Script implementation and should be tested separately.

## Deployment on Vercel

The repository is linked to Vercel. With Git integration enabled, changes pushed to the production branch should trigger a deployment.

After each change:
1. Confirm the latest production deployment completed successfully.
2. Test the free local brief builder, copy and text-file export.
3. Test the companion adapter from a trusted backend with a short synthetic character context after both secrets have been configured.
4. Confirm no API key or shared secret appears in browser code or logs.
5. Test the enquiry form with a controlled test submission and verify its status tracker.
6. Confirm the retired video endpoints remain disabled.

## Environment variables and privacy

- Keep all provider and bridge secrets in Vercel environment settings; never commit them.
- The enquiry and status APIs depend on the Google Apps Script deployment URL configured in source.
- Add a privacy notice explaining how names, business details, email addresses, and enquiry content are used and retained.
- Restrict access to the connected spreadsheet and Apps Script project.

## Troubleshooting

- **Companion endpoint returns 503:** configure `AGNES_API_KEY` and `COMPANION_BRAIN_KEY` in Vercel, then redeploy.
- **Companion endpoint returns 401:** verify ZEE's server-side `COMPANION_BRAIN_KEY` exactly matches the Vercel value.
- **AI provider returns an error:** inspect Vercel function logs for `/api/companion-brain`; never log request bodies or secrets.
- **Enquiry fails:** inspect Vercel function logs for `/api/inquiry`, then check the Apps Script deployment and execution logs.
- **Status lookup fails:** confirm the reference code format and that Apps Script reads the same data source used by enquiry submission.
- **Old video behavior appears:** hard-refresh and confirm the latest deployment; the retired API endpoints return HTTP 410 and do not call Agnes AI.
