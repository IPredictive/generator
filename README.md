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
- `api/ai-assist.js`: optional, bounded text-only business analysis endpoint using `AGNES_API_KEY` and `agnes-3.0-flash`. It limits brief length, output tokens, request timeout, and applies best-effort per-instance throttling.
- `api/generate.js` and `api/generate-status.js`: retired endpoints. Both return HTTP 410 and do not contact Agnes AI.

## Cost-control decision

Paid video generation has been intentionally retired. The site no longer offers a live video generation action. The video generation and polling endpoints are disabled in code to prevent calls to the paid provider. The `AGNES_API_KEY` environment variable is no longer required; it can be removed from Vercel after confirming the latest deployment is live.

The basic project brief is generated locally in the browser. If a visitor clicks “Analyse with AI”, the brief is sent to the server-side Agnes text endpoint for an AI proposal outline. This can consume the Agnes account's text-model quota. Video generation is disabled.

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
2. Open the production site in a private/incognito window.
3. Test the free local brief builder, copy and text-file export; optionally test AI analysis with a short brief and confirm the video endpoints remain disabled.
4. Test the enquiry form with a controlled test submission and save its reference code.
5. Check the connected Google Sheet and confirm any intended email notification reaches `inquiry@aplusachiever.com`.
6. Test the enquiry status tracker and verify desktop/mobile layouts.

## Environment variables and privacy

- Keep `AGNES_API_KEY` in Vercel for the optional text assistant. Never expose it in client-side code or commit it to GitHub. The video endpoints do not use this key.
- The enquiry and status APIs depend on the Google Apps Script deployment URL configured in source.
- Add a privacy notice explaining how names, business details, email addresses, and enquiry content are used and retained.
- Restrict access to the connected spreadsheet and Apps Script project.

## Troubleshooting

- **Enquiry fails:** inspect Vercel function logs for `/api/inquiry`, then check the Apps Script deployment and execution logs.
- **Reference code is shown but no email arrives:** check Apps Script email logic, recipient address, authorization, quotas, and spam folder. The Vercel endpoint itself does not send email.
- **Status lookup fails:** confirm the reference code format and that Apps Script reads the same data source used by enquiry submission.
- **Old video button or behavior appears:** hard-refresh the page and confirm the latest production deployment is active. The API endpoints return HTTP 410 and no longer call Agnes AI.
