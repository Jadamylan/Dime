<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Dime architecture
- No app backend: host browser calls Google directly with user-entered keys; guests never receive keys (keeps the app static and key-free).
- Peer transport and all room/turn logic live in src/lib/room.ts as a module-level store, so the host room survives navigating to /setup.
- Languages and all UI copy live in src/config/languages.ts; new languages must not need transport/UI branching.
- /demo is a pure function of elapsed time (src/lib/demoScript.ts) with no network, so it plays offline and deterministically.
- Live captions use Gemini Live via raw WebSocket (src/lib/live.ts), one session per turn, opened only by the host.

<!-- AGENT-MEMORY:BEGIN -->
- Keep conversation height driven by the visual viewport and use an in-flow dock, so software keyboards cannot cover messages or the composer.
- Keep microphone readiness, PCM conversion and capture tails in audio helpers; do not change room admission or transport for conversation UI work.
- Build all public QR/link addresses through src/config/publicUrl.ts and gate room creation to its canonical hostname, so preview receipts and login-gated origins cannot reach guests.
- Validate URLs at the shared Invite rendering/copy boundary as well as at generation, so every caller rejects nonpublic addresses and unexpected parameters.
- Guest join parses canonical query parameters and legacy hash invitations, so existing invitations remain usable.
<!-- AGENT-MEMORY:END -->
