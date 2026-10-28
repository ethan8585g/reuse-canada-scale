#!/usr/bin/env node
// Per-user installation: no administrator access or public listening socket.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

if (process.platform !== 'darwin') throw new Error('This installer is for macOS.');
if (Number(process.versions.node.split('.')[0]) < 18) throw new Error('Install a current Node.js LTS release, then run setup again.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const library = path.join(os.homedir(), 'Library');
const destination = path.join(library, 'Application Support', 'Reuse Canada Scale');
const agents = path.join(library, 'LaunchAgents');
const logs = path.join(library, 'Logs', 'Reuse Canada Scale');
const label = 'com.reusecanadascale.bridge';
const plist = path.join(agents, label + '.plist');
const domain = 'gui/' + process.getuid();
const xml = value => String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

for (const dir of [destination, agents, logs]) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
// Camera relay for the CRM's Cameras page: CRM_URL + CRM_CAMERA_TOKEN (the
// same value as the CAMERA_STATION_TOKEN Pages secret). Taken from this run's
// environment, else kept from the plist being replaced, so a routine reinstall
// does not silently turn the relay off.
const previous = key => {
  try { return execFileSync('/usr/bin/plutil', ['-extract', 'EnvironmentVariables.' + key, 'raw', '-o', '-', plist], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
};
const env = { BRIDGE_SERIAL: '0' };
for (const key of ['CRM_URL', 'CRM_CAMERA_TOKEN']) {
  const value = process.env[key] || previous(key);
  if (value) env[key] = value;
}
const envXml = Object.entries(env).map(([k, v]) => `<key>${xml(k)}</key><string>${xml(v)}</string>`).join('');
// A standalone .mjs works even on a second Mac without this repository's package.json.
fs.copyFileSync(path.join(root, 'scale-bridge.js'), path.join(destination, 'scale-bridge.mjs'));
fs.writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>${xml(path.join(destination, 'scale-bridge.mjs'))}</string></array>
<key>WorkingDirectory</key><string>${xml(destination)}</string>
<key>EnvironmentVariables</key><dict>${envXml}</dict>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>10</integer>
<key>StandardOutPath</key><string>${xml(path.join(logs, 'bridge.log'))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(logs, 'bridge-error.log'))}</string>
</dict></plist>
`, { mode: 0o600 });
execFileSync('/usr/bin/plutil', ['-lint', plist], { stdio: 'inherit' });
try { execFileSync('/bin/launchctl', ['bootout', domain + '/' + label], { stdio: 'ignore' }); } catch {}
// bootout returns before launchd has fully removed the old job. Give that
// teardown time to finish, otherwise a routine reinstall fails with EIO.
let loaded = false;
for (let attempt = 0; attempt < 20; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 500));
  try {
    execFileSync('/bin/launchctl', ['bootstrap', domain, plist], { stdio: 'pipe' });
    loaded = true;
    break;
  } catch (error) {
    if (attempt === 19) throw error;
  }
}
if (!loaded) throw new Error('Unable to load the bridge login service.');
let ready = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try {
    const response = await fetch('http://127.0.0.1:5555/status', { signal: AbortSignal.timeout(1000) });
    if (response.ok) { ready = true; break; }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 250));
}
if (!ready) throw new Error('Bridge did not start. Check ' + logs);
console.log('Scale House bridge is ready and will start whenever you log in to this Mac.');
console.log('Camera and printing are enabled. Chrome keeps its existing Bluetooth scale connection.');
console.log(env.CRM_CAMERA_TOKEN ? 'Camera relay is on: the Cameras page can be watched from anywhere.' : 'Camera relay is off (set CRM_URL and CRM_CAMERA_TOKEN to turn it on).');
console.log('Open Scale House in Chrome and allow local network access when asked.');
