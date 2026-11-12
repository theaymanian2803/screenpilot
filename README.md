# ScreenPilot

A browser screen recorder you steer from your phone.

Open the dashboard on your computer, pick a monitor, window or tab, then scan the
pairing QR code with your phone. The phone becomes a floating remote: live
preview, play / pause / stop, and optional tap-to-click control of the real
machine.

## What's inside

- **`/` — desktop dashboard.** `getDisplayMedia` capture with quality presets,
  system + microphone audio mixing, live preview, and local `.webm` download.
- **`/remote` — phone remote.** Installable PWA with a draggable control bubble,
  live WebRTC preview, and View / Pointer / Mouse touch modes.
- **Signaling.** Pairing, commands and WebRTC offers travel over Supabase Realtime
  (broadcast + presence) by default — no server to run. You can point both sides
  at your own WebSocket relay instead.
- **`ws-server/` — optional local helpers.** A relay for self-hosting and a
  localhost-only mouse agent that turns phone taps into real OS clicks.

## Getting started

You need Node.js 22+ and [Bun](https://bun.sh) (the repo ships a `bun.lock`).

```sh
bun install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
bun run dev             # http://localhost:8080
```

```sh
bun run build           # production build (Vercel Build Output API)
bun run preview         # preview the production build
bun test                # vitest
bun run lint
```

## Environment

| Variable                        | Required               | Purpose                                                           |
| ------------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `SESSION_SECRET`                | yes                    | Signs the unlocked-site session cookie. 32+ characters.           |
| `SITE_PASSWORD`                 | yes                    | Passcode that unlocks the dashboard and phone remote.             |
| `VITE_SUPABASE_URL`             | for the built-in relay | Supabase project URL.                                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | for the built-in relay | Supabase publishable (anon) key.                                  |
| `AI_API_KEY`                    | no                     | Enables the "Preview not working?" helper.                        |
| `AI_BASE_URL`                   | no                     | OpenAI-compatible endpoint (default `https://api.openai.com/v1`). |
| `AI_MODEL`                      | no                     | Model name for the helper (default `gpt-4o-mini`).                |

Generate a secret with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Without a Supabase project, pairing falls back to same-browser `BroadcastChannel`
or your own relay from `ws-server/`.

## Deploying to Vercel

The build targets Vercel directly (`nitro` with the `vercel` preset). Import the
repo, then add the environment variables above to the project. Build command:
`bun run build`. Alternatively deploy the build output from your machine:

```sh
bun run build
vercel deploy --prebuilt --prod
```

## Self-hosting the relay (optional)

```sh
cd ws-server
npm install
npm start            # relay on :8787
npm run mouse        # local mouse helper on :8788 (prints an access code)
```

Enter the relay URL in the dashboard and the remote to bypass the built-in
cloud relay.

## How pairing works

1. The dashboard generates a short pair code and a QR link (`/remote?room=CODE`).
2. Both sides join the same realtime channel and exchange presence.
3. The phone asks for a preview; the desktop sends a WebRTC offer; video flows
   peer-to-peer over STUN.
4. Commands (`play`, `pause`, `stop`, `request-source`) and pointer events are
   broadcast on the same channel.

## Project layout

```
src/routes/index.tsx      desktop recorder dashboard
src/routes/remote.tsx     phone remote + floating bubble
src/lib/recording-media.ts  capture presets, audio mixing, cleanup
src/lib/control-channel.ts  relay selection: WebSocket / Supabase / BroadcastChannel
src/lib/live-preview.ts   WebRTC peer helpers
src/lib/site-gate.functions.ts  passcode session (server functions)
ws-server/                optional relay + mouse agent
```
