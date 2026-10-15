# AplusCity AI Video Studio

A responsive, single-page landing site for an AI-assisted short-video production service targeting Singapore and Southeast Asian small businesses.

## Current status

- The current version is a static landing page in `index.html`.
- It includes service descriptions, indicative package prices, a responsive layout, and an inquiry form.
- The inquiry form currently opens the visitor's email application. **It does not save leads online.**
- The email address `hello@apluscity.com` is a placeholder and must be replaced with a real inbox before launch.
- No AGNES AI API is connected yet. Do not describe video generation as fully automated until the API flow is implemented and tested.
- Prices are introductory draft prices; confirm scope, costs and commercial rights before accepting orders.

## Deploy with Vercel

1. Open https://vercel.com/ and sign in with GitHub.
2. Choose **Add New → Project**.
3. Import `IPredictive/generator`.
4. For this static HTML version, no framework or build command is required. If prompted, select **Other** and leave the build command blank.
5. Deploy and open the generated preview URL.
6. Test the page on desktop and mobile, especially the inquiry form.
7. Connect a custom domain only after confirming domain ownership and DNS settings.

If Vercel detects a framework or an existing project configuration in the repository later, review the detected build settings before deploying.

## Alternative: GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Choose **Deploy from a branch**.
3. Select the `main` branch and `/(root)`, then save.
4. Wait for the deployment URL shown in the Pages section.

Use only one production deployment workflow initially to keep setup simple.

## Before public launch

- [ ] Replace `hello@apluscity.com` in `index.html` with a real monitored email address.
- [ ] Add a real lead-capture destination (for example, a backend endpoint or a form service) if you want inquiries saved automatically.
- [ ] Add Privacy Policy and Terms pages before collecting customer information at scale.
- [ ] Confirm current AGNES AI API access, model IDs, quotas, pricing and commercial-use terms.
- [ ] Keep API keys in server-side environment variables; never put secrets in `index.html` or public GitHub files.
- [ ] Implement video generation as a server-side asynchronous job, including status tracking, failure handling, storage and usage limits.
- [ ] Confirm package pricing against actual generation costs and editing time.
- [ ] Add genuine portfolio examples only when you have permission to use the assets.

## Suggested next technical phase

Keep this landing page as the public marketing site. Add a server-side API (for example, Next.js route handlers deployed on Vercel) for order intake and AGNES AI integration only after the API credentials and usage limits have been verified.
