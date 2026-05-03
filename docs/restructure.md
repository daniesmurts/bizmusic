The most urgent single fix is making sure the billing cron job can't block your web server. Even 5-10 clients hitting renewal at the same time could cause noticeable slowdowns for anyone using the player.

My recommended priority order given active onboarding:

Immediately (before first billing cycle): Make sure audio is served via signed S3/Yandex URLs, not proxied through Node. Check src/app/api/download/track/[trackId] — if it's streaming bytes through the server, that's the first thing to fix. It's a one-file change.
Within 1-2 weeks: Extract the cron jobs (billing, daily-summary, approve-commissions) out of the Next.js process into a separate worker. I can set this up as a simple apps/workers/ folder with a standalone Node runner, keeping the shared DB layer.
When you hit 50+ clients: Move TTS and PDF generation to serverless functions.
The restructure into a proper monorepo (apps/web + apps/workers + packages/db) is probably 2-3 hours of work and sets up the foundation cleanly. Want me to do that now, or start with just the audio serving fix since that's the quickest win?