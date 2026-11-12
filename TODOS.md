# TODOS

State at end of the Nov 12 session: app is live, de-Lovelabled, on your own
Supabase, and pushed. Nothing below is blocking — these are the next moves in
priority order.

## Live now

- Site: https://screenpilot-smoky.vercel.app
- Repo: https://github.com/theaymanian2803/screenpilot (`main` @ `5368cf7`)
- Local: `C:\Users\PC\Desktop\screenpilot`
- Vercel project: `screenpilot` (scope `codys-projects-43132bcc`)
- Relay: Supabase project `xtosjzppxqawymzfqtiz`

---

## Next session (Nov 13)

### 1. Finish Vercel ↔ GitHub auto-deploy

Right now every deploy is manual. The GitHub App isn't installed on the repo, so
`vercel git connect` returns "You need admin or write access".

- [ ] While logged into **theaymanian2803** on GitHub, open
      https://github.com/apps/vercel/installations/new
- [ ] Grant access to `screenpilot`
- [ ] Run `vercel git connect https://github.com/theaymanian2803/screenpilot.git`
- [ ] Confirm Project → Settings → Git shows the repo and production branch `main`
- [ ] Make a trivial commit, push, and confirm Vercel builds automatically
- [ ] If the Vercel account belongs to someone else (scope `codys-projects-43132bcc`
      vs GitHub `theaymanian2803`), either move the project to your own Vercel
      scope or have that account's owner install the app

Why it matters: until this works, the live site only updates when we run
`bun run build && vercel deploy --prebuilt --prod`.

### 2. Rotate the two secrets

The passcode is still the temporary one set during setup.

- [ ] Pick a new `SITE_PASSWORD` (a multi-word passphrase, not a 6-char code —
      there is no rate limiting on unlock yet)
- [ ] Generate a fresh `SESSION_SECRET`:
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Update both in Vercel (production/preview/development) and in local `.env`
- [ ] Redeploy and confirm: old passcode rejected, new one unlocks, existing
      sessions are invalidated by the secret change

### 3. Test the real thing on a real phone

The unit tests cover capture presets and passcode hashing, but not the actual
cross-device flow.

- [ ] Open the dashboard on the PC, pick a monitor or window
- [ ] Scan the QR with the phone over the same Wi-Fi
- [ ] Confirm: auto-pair, live preview appears, pairing survives a page refresh
- [ ] Controls: start, pause, resume, stop from the bubble
- [ ] "Ask PC to pick a screen" reaches the dashboard
- [ ] Pointer mode draws the laser dot on the PC preview
- [ ] Mouse mode with `ws-server` running: tap = click, double-tap = double-click,
      drag = move
- [ ] Save the recording and confirm the `.webm` plays
- [ ] Note anything that fails into this file before fixing it

### 4. Harden pairing (highest-risk open item)

Realtime broadcast is public: anyone who knows or guesses a 6-character pair
code can join the channel, watch the preview signaling, and send commands.
Pair codes are short and there is no rate limit on unlock attempts.

Pick one:

- [ ] **Option A (lightest):** add a server-issued room token — after the site
      gate is unlocked, a server fn signs `{room, exp}` with `SESSION_SECRET`;
      the dashboard and remote include it in join messages, and each side
      rejects `hello`/`command`/`signal`/`mouse` messages whose token doesn't
      verify or whose `exp` has passed
- [ ] **Option B (cleanest):** Supabase private channels — enables RLS on
      `realtime.messages`, authorize the channel with a JWT that carries the room
      claim, and turn off public broadcast for the project
- [ ] **Option C (quick win while deciding):** rate-limit `unlockSite` by IP
      (e.g. 5 attempts / 15 min) and lengthen pair codes from 6 to 8 characters

Recommendation: C today, then A. B is the proper end state if this ever gets
more than a couple of users.

### 5. Decide on the AI "preview not working" helper

`diagnosePreview` needs `AI_API_KEY`; without it the button still renders and
returns "AI help isn't configured yet", which looks broken.

- [ ] Either set `AI_API_KEY` (plus optional `AI_BASE_URL` / `AI_MODEL`) in Vercel
- [ ] Or hide the button when the key is absent — expose a build-time flag from
      the server fn (e.g. a `getFeatures` server fn the remote calls once) or
      gate it behind an env var baked into the client

### 6. Custom domain

- [ ] Tell me the domain
- [ ] Attach it to the Vercel project and set it as the primary domain
- [ ] Add `og:url` + canonical pointing at the new domain in `src/routes/__root.tsx`
      and the two route `head()` blocks
- [ ] Redeploy and verify `https://<domain>/` and `/remote`

---

## Backlog (not tomorrow)

- [ ] **OG image** — `public/og-image.png` (1200×630) plus `og:image` /
      `twitter:image` meta. Nothing currently renders a rich social card.
- [ ] **Service worker** — the manifest exists but there's no SW, so "Add to Home
      Screen" works without offline support. A tiny cache-first SW would make the
      remote feel like a real app.
- [ ] **Lighthouse + a11y pass** on `/` and `/remote` (contrast on the dark
      palette, focus rings on the floating bubble, `aria-live` for recording
      state changes).
- [ ] **Self-hosted relay verification** — `cd ws-server && npm install && npm start`,
      put `ws://<lan-ip>:8787` in both Relay URL fields, confirm pairing and
      preview; this is the fallback if Supabase is ever down.
- [ ] **Browser matrix** — MediaRecorder output is `.webm` (VP9/Opus). Check
      Safari/Firefox behavior on the dashboard and document the limitation in the
      README.
- [ ] **Repo housekeeping** — `roadmap.md` still holds the original product
      checklist; fold its two unchecked items (real-phone test, pointer/mouse
      confirmation) into this file once done, or delete it.
- [ ] **Screenshots** in the README (dashboard + phone bubble).

---

## Deploy cheat sheet

```sh
# local dev
bun run dev                 # http://localhost:8080

# ship
bun run build               # writes .vercel/output
vercel deploy --prebuilt --prod

# checks
bun run test
npx eslint .
node node_modules/typescript/bin/tsc --noEmit
```

Auto-deploy works once item 1 is done; after that a push to `main` is enough.

## Caveats to remember

- `.env` is local-only and gitignored (it holds `SESSION_SECRET` and the
  passcode). `.env.example` is the tracked template.
- The session cookie is `secure: true`, so the gate only works over HTTPS or
  `localhost` — testing from another machine over plain `http://<lan-ip>` will
  look like a broken unlock.
- The mouse helper is localhost-only by design; it can never be driven from the
  internet, only from the dashboard running on the same PC.
- Vercel SSO deployment protection was disabled on this project so the URL is
  publicly reachable. Re-enable it if the app should stay private.
