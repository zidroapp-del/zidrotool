# ZidroTool account authentication

The sign-in UI is production-safe: when Supabase is not configured, it clearly explains that account features are unavailable instead of showing raw `Auth not configured` errors.

To enable real authentication, add these environment variables to your local `.env` and to the Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then configure Google and/or GitHub providers in Supabase and add your production callback URL. Do not commit `.env` or private keys to Git.

The public anon key is intended for browser use; server secrets must never be placed in `VITE_*` variables.


## Provider recommendation

For the initial public launch, ZidroTool intentionally keeps Google and GitHub as the only social sign-in buttons. Facebook is not enabled in the UI because it adds another OAuth configuration and maintenance surface without being essential for a developer/creator utility platform. The auth layer can be extended later if audience data shows a meaningful demand for Facebook login.
