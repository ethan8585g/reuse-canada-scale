import { Hono } from 'hono'
// The station files are bundled from the repo root as text (Vite ?raw), so the
// copy a Mac downloads is always the copy in this build -- there is no second
// version to drift. A new scale-house Mac has no checkout of this repo, which
// is why they are served at all.
import installer from '../../install-scale-station.sh?raw'
import bridge from '../../scale-bridge.js?raw'
import launcher from '../../scale-house.command?raw'

// Public on purpose: the installer is fetched with curl, which has no session.
// None of these files carries a secret -- the bridge only listens on 127.0.0.1
// and keeps its own origin allow-list.
export const stationRoutes = new Hono()

// Re-running the installer is how a station updates its bridge, so it must
// never be handed a cached copy of an older one.
const NO_CACHE = { 'Cache-Control': 'no-cache' }

stationRoutes.get('/install.sh', (c) => c.text(installer, 200, NO_CACHE))
stationRoutes.get('/scale-bridge.mjs', (c) => c.text(bridge, 200, NO_CACHE))
stationRoutes.get('/scale-house.command', (c) => c.text(launcher, 200, NO_CACHE))
