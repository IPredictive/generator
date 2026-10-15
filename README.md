# AplusCity AI Video Studio

A responsive, dark-tech landing page for AplusCity's AI-assisted short-video services, aimed at Singapore and Southeast Asian businesses.

Production site: https://generator-gamma-plum.vercel.app/  
Inquiry contact: inquiry@aplusachiever.com  
Source: https://github.com/IPredictive/generator

## Current implementation

- `index.html`: responsive marketing page, service packages, inquiry form, reference-code display, and project-status tracker.
- `api/inquiry.js`: validates inquiry submissions and forwards them to the configured Google Apps Script web app. A successful response must include a reference code.
- `api/status.js`: looks up inquiry status by reference code through the same Google Apps Script web app.
- `api/generate.js`: starts an asynchronous image-to-video job through Agnes AI.
- `api/generate-status.js`: polls the Agnes AI task and returns its status and video URL when complete.

The inquiry endpoints depend on the Google Apps Script deployment configured in the source. The video-generation endpoints require the server-side `AGNES_API_KEY` environment variable in Vercel. Do not put secrets in client-side HTML or commit them to GitHub.

## Inquiry flow

1. A visitor completes the form on the site.
2. The browser sends the form data to `POST /api/inquiry`.
3. The API forwards the request to Google Apps Script.
4. The form displays the reference code returned by the backend.
5. The visitor can enter that code in the project tracker, which calls `GET /api/status?code=...`.

A successful browser message only confirms that the backend returned a valid reference code. Email notifications and spreadsheet persistence depend on the deployed Google Apps Script implementation and should be tested separately.

## Deployment on Vercel

The repository is linked to Vercel. With Git integration enabled, changes pushed to the production branch should trigger a deployment.

After each change:
1. Open the Vercel project and confirm the latest deployment completed successfully.
2. Open the production site in a private/incognito window.
3. Test the inquiry form with a controlled test submission and save its reference code.
4. Check the new record in the connected Google Sheet and confirm any intended email notification reaches `inquiry@aplusachiever.com`.
5. Test the status tracker using the test reference code.
6. Test on both desktop and mobile.

## Vercel environment variables

Set secrets in **Vercel → Project Settings → Environment Variables**, not in repository files.

- `AGNES_API_KEY`: required for Agnes AI video generation. Redeploy after changing environment variables.

The inquiry and status APIs currently contain a Google Apps Script deployment URL. If that deployment is rotated, update both `api/inquiry.js` and `api/status.js` together.

## Pre-launch checklist

- [ ] Confirm the Google Apps Script web app is deployed and accessible to the Vercel API.
- [ ] Submit a test inquiry and confirm the record is saved.
- [ ] Confirm notification/reply email behavior and check spam folders.
- [ ] Confirm a reference code can retrieve the correct inquiry status.
- [ ] Add a privacy notice explaining how names, business details, email addresses, and inquiry content are used and retained.
- [ ] Restrict access to the connected spreadsheet and Apps Script project.
- [ ] Verify Agnes AI account access, model parameters, quota, pricing, and commercial-use terms before selling automated video generation.
- [ ] Confirm package pricing against actual generation costs and editing time.
- [ ] Use only portfolio images and videos that AplusCity has permission to publish.

## Troubleshooting

- **Inquiry fails:** inspect the Vercel function logs for `/api/inquiry`, then check the Apps Script deployment and execution logs.
- **Reference code is shown but no email arrives:** check the Apps Script email logic, recipient address, authorization, quotas, and spam folder. The Vercel endpoint itself does not send email.
- **Status lookup fails:** confirm the reference code format and that the Apps Script status action reads the same data source used by inquiry submission.
- **Video generation says unconfigured:** set `AGNES_API_KEY` in the Vercel project and redeploy.
