# AplusCity Companion setup

AplusCity Companion is the new text-first personal AI companion experience. Video generation remains intentionally disabled.

## Files added
- `companion.html`: responsive chat UI, Supabase Auth sign-up/sign-in, cross-device conversation history, memory review/deletion.
- `api/companion-config.js`: exposes only the public Supabase URL and anon key to the browser.
- `api/companion-chat.js`: verifies each Supabase Auth session, calls the existing Agnes text model, and stores messages/memories per authenticated user.
- `supabase/companion-schema.sql`: schema and Row Level Security policies. Apply only to a dedicated Companion Supabase project.

## Database provisioned

A dedicated free-tier project has been created in the `predictapp` organization:
- Project: `apluscity-companion`
- Project ref: `dmnrrgzqeagwqhwrmhok`
- Region: Singapore (`ap-southeast-1`)
- Current project creation estimate: US$0/month (usage and third-party AI charges may still apply).

The schema in `supabase/companion-schema.sql` has been applied to this dedicated project. The tables use Row Level Security so authenticated users can access only rows whose `user_id` matches their Supabase Auth identity.

## Vercel environment variables

The following values have been configured for production, preview, and development:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Keep the existing `AGNES_API_KEY` server-side. This implementation uses the signed-in user's access token and row-level security for database operations; it does not require or expose a Supabase service-role key. Vercel environment changes take effect after a new deployment.

In Supabase Auth settings, configure the production site URL and allowed redirect URLs for `https://generator-gamma-plum.vercel.app`. Email confirmation and production email delivery should be configured before inviting real users.

## Privacy and product notes
- Server verifies the access token with Supabase Auth before any user-specific operation.
- Database queries include the verified user ID; service-role credentials never leave the server.
- Only a small number of non-sensitive, durable details explicitly shared in a message may be saved as memory. Users can inspect and delete memories.
- The AI is clearly presented as AI. Do not market it as a replacement for family, caregivers, clinical care, or emergency services.
- Text requests may consume Agnes quota or incur charges. No video generation endpoint is called.
