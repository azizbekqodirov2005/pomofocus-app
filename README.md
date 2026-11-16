# Fokus — Pomodoro Timer

A production-ready, distraction-free Pomodoro timer for the web. Drift-free
timing, task tracking, daily statistics, three languages (Uzbek, English,
Russian) and hand-tuned light and dark themes. Everything runs in the browser —
no account, no server, no tracking.

![Stack](https://img.shields.io/badge/React-19-informational) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Vite](https://img.shields.io/badge/Vite-7-646cff)

## Features

### Timer
- Focus / short break / long break with automatic transitions
- Start, pause, resume, reset and skip
- Long break after a configurable number of focus sessions
- **Drift-free countdown.** The remaining time is always derived from a stored
  end timestamp (`endsAt - Date.now()`), never accumulated from interval ticks,
  so a background tab, a throttled timer or a sleeping machine cannot make the
  clock wrong.
- **Refresh-safe.** The full timer state is persisted; reloading mid-session
  restores the exact remaining time, and a session that expired while the page
  was closed is completed and recorded on the next load.
- Sound chime generated with the Web Audio API (no audio asset to load)
- Browser notifications, requested only on an explicit user action
- Live progress bar, cycle indicator and remaining time in the tab title

### Tasks
- Add, edit, delete and complete tasks
- Pick one active task; finished focus sessions are counted against it
- Per-task pomodoro estimate and progress

### Statistics
- Completed focus sessions and total focused time for the day
- Daily goal with progress visualisation
- Session history for the current day
- Automatic reset when a new **local** calendar day begins
- **Last 7 days** chart plus 7- and 30-day totals: each finished day is archived
  before the daily counters clear, so the weekly view survives the reset
  (120 days are kept)

### Installable (PWA)
- Installs to the home screen or desktop with its own icon and standalone window
- Works fully offline after the first visit — the app shell, fonts and icons are
  precached by a service worker
- Updates are never applied silently: a new version offers a Reload toast, so a
  running session is never interrupted without the user's say-so

### Interface
- Uzbek / English / Russian, switched instantly, remembered across reloads
- Light and dark themes, each designed separately (not inverted), with optional
  system detection on first visit
- Keyboard shortcuts, toast notifications, empty states, confirmation dialogs
  before destructive actions
- Accessible: semantic landmarks, `role="progressbar"`, focus-trapped dialogs,
  visible focus rings, `prefers-reduced-motion` support
- Responsive from 320 px upward, with a tab-based mobile layout

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Start / pause |
| `R` | Reset session |
| `S` | Skip session |
| `T` | Toggle theme |
| `,` | Open settings |
| `?` | Show shortcuts |
| `Esc` | Close dialog |

## Tech stack

- **React 19** + **TypeScript** (strict, `noUncheckedIndexedAccess`, `noUnusedLocals`)
- **Vite 7** for dev server and build
- **Tailwind CSS 4** (CSS-first configuration with design tokens)
- **vite-plugin-pwa** (build time only) for the manifest and service worker
- No state library, no UI kit, no icon package, no chart library — the only
  runtime dependencies are React and a self-hosted Inter font

### Architecture

```
src/
├── components/
│   ├── layout/      Header, Footer, brand, language select
│   ├── settings/    Settings and shortcuts dialogs
│   ├── stats/       Daily statistics and session history
│   ├── tasks/       Task list, item, composer
│   ├── timer/       Timer card, session tabs, controls
│   └── ui/          Button, Modal, Toggle, NumberField, Toaster, icons …
├── config/          Footer brand details
├── hooks/           Keyboard shortcuts, document title
├── i18n/            uz / en / ru dictionaries, provider, typed `t()`
├── lib/             storage, time, sound, notifications helpers
├── state/           Theme, Toast, Settings, Tasks, Stats, Timer providers
└── types/           Shared domain types
```

State lives in small, focused React contexts — one per concern. Every value
read back from `localStorage` is re-validated and clamped before use, so corrupt
or hand-edited storage can never crash the app. Translation keys are typed:
a missing or misspelled key is a compile error.

## Data storage

Frontend only, by design — the feature set needs no server. Settings, theme,
language, tasks, daily statistics, the day archive, session history and timer
state are kept in `localStorage` under the `fokus.` prefix. If storage is unavailable (private
mode, blocked cookies) the app still works and tells the user that nothing will
be saved.

## Getting started

Requires **Node.js 20.19+ or 22.12+**.

```bash
git clone https://github.com/<your-username>/fokus-pomodoro.git
cd fokus-pomodoro
npm install
npm run dev          # http://localhost:5173
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript check only |
| `npm test` | Integration suite (53 checks) in jsdom |

### Tests

`qa/app.test.tsx` drives the real component tree in jsdom against a controlled
clock. It covers timer accuracy across a 60-second wall-clock jump, pausing,
refresh recovery, a session that expired while the page was closed, auto-start
cycles and long breaks, task counting, daily rollover and archiving, language
and theme persistence, and recovery from corrupt storage.

Screenshots across breakpoints and themes come from `qa/shots.mjs`, which needs
a local Chrome plus `npm i --no-save puppeteer-core`.

## Deployment

### Netlify

`netlify.toml` is included with the build command, publish directory, SPA
fallback and asset caching headers.

**From Git (recommended):** connect the repository in Netlify. The settings are
read from `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`

**From the CLI:**

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### Any static host

The build output in `dist/` is a plain static bundle. On hosts other than
Netlify, add a rewrite of all paths to `/index.html`.

## Customisation

- **Durations, auto-start, goal, alerts** — in the app's settings dialog, with
  a restore-defaults option.
- **Footer logo** — replace `public/logo.png` (dark mark, shown on the light
  theme) and `public/logo-dark.png` (light mark, shown on the dark theme), or
  point `logoSrc` / `logoDarkSrc` in `src/config/brand.ts` at different files.
- **Colours** — all design tokens are CSS custom properties at the top of
  `src/index.css`, grouped per theme and per session type.
- **App icons** — replace `public/pwa-192.png`, `public/pwa-512.png`,
  `public/pwa-maskable-512.png` and `public/apple-touch-icon.png`; the manifest
  itself lives in `vite.config.ts`.
- **Languages** — add a dictionary next to `src/i18n/uz.ts` and register it in
  `src/i18n/index.ts`. TypeScript will list any missing keys.

## Known behaviour

Browsers throttle timers in background tabs. Time accounting is unaffected
(it is timestamp-based), but in an aggressively throttled tab the chime and
notification for a finished session can arrive a few seconds late — a deadline
timeout plus a re-check on tab focus keeps this to a minimum.

## License

MIT
