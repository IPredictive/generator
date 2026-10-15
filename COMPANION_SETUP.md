# AplusCity Companion setup

AplusCity Companion is the new text-first personal AI companion experience. Video generation remains intentionally disabled.

## Files added
- `companion.html`: responsive chat UI, Supabase Auth sign-up/sign-in, cross-device conversation history, memory review/deletion.
- `api/companion-config.js`: exposes only the public Supabase URL and anon key to the browser.
- `api/companion-chat.js`: verifies each Supabase Auth session, calls the existing Agnes text model, and stores messages/memories per authenticated user.
- `supabase/companion-schema.sql`: schema and Row Level Security policies. Apply only to a dedicated Companion Supabase project.

## Required Vercel environment variables
- `AGNES_API_KEY`: existing secret; keep it server-side.
- `SUPABASE_URL`: URL of the dedicated Companion Supabase project.
- `SUPABASE_ANON_KEY`: public/anon key for that project.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret. Never prefix it with `NEXT_PUBLIC_`, expose it in browser code, or commit it to GitHub.

The currently connected Supabase project discovered during initial inspection is named `sse-agents-community`; it belongs to a different project and must not be reused for Companion data. Create/select a separate Companion project, apply `supabase/companion-schema.sql`, then add its three Supabase values to the Vercel project's environment settings. The app will show a setup notice until these are configured.

In Supabase Auth settings, configure the production site URL and allowed redirect URLs for `https://generator-gamma-plum.vercel.app/**`. For a production deployment, enable email confirmation and configure email delivery before inviting real users.

## Privacy and product notes
- Server verifies the access token with Supabase Auth before any user-specific operation.
- Database queries include the verified user ID; service-role credentials never leave the server.
- Only a small number of non-sensitive, durable details explicitly shared in a message may be saved as memory. Users can inspect and delete memories.
- The AI is clearly presented as AI. Do not market it as a replacement for family, caregivers, clinical care, or emergency services.
- Text requests may consume Agnes quota or incur charges. No video generation endpoint is called.
