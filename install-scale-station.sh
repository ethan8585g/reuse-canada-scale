#!/bin/bash
# ============================================================
# Reuse Canada — set up a Mac as the scale-house station
# ============================================================
# Run this once on the Mac at the scale, in Terminal:
#
#   curl -fsSL https://www.reusecanadascale.com/station/install.sh | bash
#
# Run it again any time to update the bridge to the deployed version. To
# remove everything it installed:
#
#   curl -fsSL https://www.reusecanadascale.com/station/install.sh | bash -s -- --uninstall
#
# WHAT IT DOES
#   The Scale House page reaches this Mac's hardware through scale-bridge, a
#   small local server on http://localhost:5555. The yard camera (via Agent
#   DVR), silent receipt printing and the USB scale feed all go through it, and
#   a browser cannot do any of those itself. On a new Mac nothing is running
#   there, and the page can only say "Cannot reach this computer".
#
#   1. Downloads Node.js (official build, checksum-verified) into
#      ~/Library/Application Support/ReuseCanada/node. Private to this
#      install: no Homebrew, no admin password, nothing system-wide.
#   2. Downloads scale-bridge from the site, so it always matches the page.
#   3. Installs it as a launchd service: starts at login, restarts itself if it
#      ever stops. No Terminal window has to stay open.
#   4. Checks Agent DVR on port 8090 and says what is missing, if anything.
#   5. Puts "Scale House.command" on the Desktop (Chrome launcher; optional).
#
# It never asks questions (stdin is this script when piped into bash) and it
# does not touch Chrome, Agent DVR or the printers.

set -euo pipefail

# Everything runs from main(), called on the very last line: bash has to read
# the whole file before anything executes, so a download cut off half-way
# fails to parse instead of running half an installer.
main() {
SITE="${RC_SITE:-https://www.reusecanadascale.com}"
APP_DIR="$HOME/Library/Application Support/ReuseCanada"
LOG_DIR="$HOME/Library/Logs/ReuseCanada"
LOG_FILE="$LOG_DIR/scale-bridge.log"
LABEL="com.reusecanada.scale-bridge"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_DIR="$APP_DIR/node"
NODE="$NODE_DIR/bin/node"
BRIDGE="$APP_DIR/scale-bridge.mjs"
LAUNCHER="$HOME/Desktop/Scale House.command"
NODE_MAJOR=24
BRIDGE_URL="http://127.0.0.1:5555"
AGENT_DVR_URL="http://127.0.0.1:8090"
DOMAIN="gui/$(id -u)"

if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'; else B=""; G=""; Y=""; R=""; N=""; fi
step() { printf '\n%s==> %s%s\n' "$B" "$1" "$N"; }
ok()   { printf '    %s✓%s %s\n' "$G" "$N" "$1"; }
warn() { printf '    %s!%s %s\n' "$Y" "$N" "$1"; }
say()  { printf '      %s\n' "$1"; }
die()  { printf '\n%sSetup stopped:%s %s\n' "$R" "$N" "$1" >&2; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

[ "$(uname -s)" = "Darwin" ] || die "this installer is for macOS (the scale-house Mac)."

# ── Uninstall ────────────────────────────────────────────────────────────────
if [ "${1:-}" = "--uninstall" ]; then
  step "Removing the scale-house station setup"
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  rm -f "$PLIST"
  rm -rf "$APP_DIR"
  ok "Stopped scale-bridge and removed it (logs kept in $LOG_DIR)."
  [ -f "$LAUNCHER" ] && say "\"Scale House.command\" is still on the Desktop -- delete it by hand if you like."
  exit 0
fi

# Usable = runs, and is Node 18 or newer (the bridge is an ES module that uses
# nothing newer than that).
node_ok() { [ -x "$1" ] && "$1" -e 'process.exit(parseInt(process.versions.node, 10) >= 18 ? 0 : 1)' >/dev/null 2>&1; }

# ── 1. Node.js ───────────────────────────────────────────────────────────────
step "Node.js"
if node_ok "$NODE"; then
  ok "Already installed: Node $("$NODE" -v)"
else
  case "$(uname -m)" in
    arm64)  ARCH=arm64 ;;
    x86_64) ARCH=x64 ;;
    *)      die "unrecognised CPU type $(uname -m)." ;;
  esac
  DIST="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
  # The checksum list names the current release, so it doubles as the "what is
  # the latest version" lookup -- and the download is verified against it.
  SUMS="$(curl -fsSL "$DIST/SHASUMS256.txt")" || die "could not reach nodejs.org. Check the internet connection and run this again."
  LINE="$(printf '%s\n' "$SUMS" | grep -E "  node-v[0-9.]+-darwin-${ARCH}\.tar\.gz\$" | head -n 1 || true)"
  [ -n "$LINE" ] || die "nodejs.org did not list a macOS ${ARCH} build."
  SUM="${LINE%% *}"
  FILE="${LINE##* }"
  say "Downloading ${FILE} ..."
  curl -fL --progress-bar -o "$TMP/$FILE" "$DIST/$FILE" || die "the Node.js download failed. Run this again."
  GOT="$(shasum -a 256 "$TMP/$FILE" | awk '{print $1}')"
  [ "$GOT" = "$SUM" ] || die "the Node.js download is corrupt (checksum mismatch). Run this again."
  tar -xzf "$TMP/$FILE" -C "$TMP"
  mkdir -p "$APP_DIR"
  rm -rf "$NODE_DIR"
  mv "$TMP/${FILE%.tar.gz}" "$NODE_DIR"
  node_ok "$NODE" || die "Node.js was downloaded but will not run on this Mac."
  ok "Installed Node $("$NODE" -v)"
fi

# ── 2. scale-bridge ──────────────────────────────────────────────────────────
step "scale-bridge"
mkdir -p "$APP_DIR" "$LOG_DIR" "$HOME/Library/LaunchAgents"
curl -fsSL "$SITE/station/scale-bridge.mjs" -o "$TMP/scale-bridge.mjs" || die "could not download scale-bridge from $SITE."
# A captive portal or an error page would otherwise be installed as the bridge
# and fail at every restart, forever, in a log nobody reads.
grep -q "Reuse Canada — Scale Bridge" "$TMP/scale-bridge.mjs" || die "$SITE did not send the scale-bridge file. Run this again."
"$NODE" --check "$TMP/scale-bridge.mjs" || die "the downloaded scale-bridge does not parse."
mv "$TMP/scale-bridge.mjs" "$BRIDGE"
ok "Downloaded to $BRIDGE"

# ── 3. Run it as a service ───────────────────────────────────────────────────
step "Starting scale-bridge as a service"
launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
# Give launchd a moment to release the port before checking who else holds it.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -fsS -m 1 "$BRIDGE_URL/status" >/dev/null 2>&1 || break
  sleep 0.5
done

# A copy still answering now is not ours: almost always one started by hand in
# a Terminal window before this Mac had the service. It is the same program, so
# hand the port over to the service rather than leave two fighting for it.
if curl -fsS -m 1 "$BRIDGE_URL/status" >/dev/null 2>&1; then
  for pid in $(lsof -nP -iTCP:5555 -sTCP:LISTEN -t 2>/dev/null || true); do
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    case "$cmd" in
      *scale-bridge*)
        kill "$pid" 2>/dev/null || true
        ok "Stopped a scale-bridge that was running by hand (pid $pid) -- the service replaces it."
        ;;
      *)
        die "port 5555 is taken by another program: $cmd"
        ;;
    esac
  done
  sleep 1
fi

# XML-escape the paths that go into the plist. Account names can contain "&".
xml() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(xml "$NODE")</string>
    <string>$(xml "$BRIDGE")</string>
  </array>
  <key>WorkingDirectory</key><string>$(xml "$APP_DIR")</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>5</integer>
  <key>ProcessType</key><string>Interactive</string>
  <key>StandardOutPath</key><string>$(xml "$LOG_FILE")</string>
  <key>StandardErrorPath</key><string>$(xml "$LOG_FILE")</string>
</dict>
</plist>
PLIST
plutil -lint "$PLIST" >/dev/null || die "wrote an invalid service file at $PLIST."

# Keep the log from growing without bound across months of uptime.
if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt 5000000 ]; then
  mv -f "$LOG_FILE" "$LOG_FILE.old"
fi

launchctl bootstrap "$DOMAIN" "$PLIST" || die "launchd refused the service. Details: launchctl print $DOMAIN/$LABEL"

UP=""
for _ in $(seq 1 20); do
  if curl -fsS -m 1 "$BRIDGE_URL/status" >/dev/null 2>&1; then UP=1; break; fi
  sleep 0.5
done
if [ -z "$UP" ]; then
  warn "scale-bridge did not answer on $BRIDGE_URL. Last lines of its log:"
  tail -n 15 "$LOG_FILE" 2>/dev/null | sed 's/^/        /' || true
  die "the service is installed but not answering."
fi
ok "Running on $BRIDGE_URL -- starts by itself at login from now on."

# ── 4. Agent DVR ─────────────────────────────────────────────────────────────
add_camera_help() {
  say "To add the Reolink: open $AGENT_DVR_URL, click + and choose IP Camera"
  say "Wizard, pick Reolink, and enter the camera's IP address (the one in its"
  say "rtsp:// address, e.g. 192.168.0.188), username and password."
}
# Asked through the bridge, which is exactly the path the Scale House page
# uses, so a pass here means the page's "Find Agent DVR cameras" will work too.
step "Agent DVR (the yard camera)"
AGENT_JSON="$(curl -fsS -m 10 "$BRIDGE_URL/camera/agentdvr" 2>/dev/null || true)"
AGENT_REPORT="$(printf '%s' "$AGENT_JSON" | "$NODE" -e '
  let s = ""; process.stdin.on("data", c => s += c).on("end", () => {
    let d; try { d = JSON.parse(s); } catch { console.log("down"); return; }
    if (!d.ok) { console.log("down"); return; }
    if (!d.cameras || !d.cameras.length) { console.log("empty"); return; }
    console.log("ok " + d.cameras.map(c => c.name).join(", "));
  });' 2>/dev/null || echo down)"
case "$AGENT_REPORT" in
  ok*)
    ok "Agent DVR is running with: ${AGENT_REPORT#ok }"
    say "If its picture is black, open System Settings > Privacy & Security >"
    say "Local Network and turn on Agent DVR -- without that, macOS stops it"
    say "reaching the camera."
    ;;
  empty)
    warn "Agent DVR is running but has no camera yet."
    add_camera_help
    ;;
  *)
    if [ -d "/Applications/AgentDVR" ]; then
      warn "Agent DVR is installed but not running (nothing on $AGENT_DVR_URL)."
      say "Open it from Applications > AgentDVR, then press \"Find Agent DVR"
      say "cameras\" in the Scale House page."
    else
      warn "Agent DVR is not installed on this Mac."
      say "Install the macOS version from https://www.ispyconnect.com/download.aspx"
      say "and open it. When macOS asks whether it may find devices on your local"
      say "network, click Allow -- the camera is on the local network."
      add_camera_help
    fi
    say "scale-bridge is already running -- this installer does not need re-running."
    ;;
esac

# ── 5. Chrome launcher (optional) ────────────────────────────────────────────
step "Scale House launcher"
if curl -fsSL "$SITE/station/scale-house.command" -o "$TMP/launcher" 2>/dev/null && grep -q "Scale House launcher" "$TMP/launcher"; then
  mv "$TMP/launcher" "$LAUNCHER"
  chmod +x "$LAUNCHER"
  ok "\"Scale House.command\" is on the Desktop (opens Chrome with silent printing)."
else
  warn "Could not download the launcher. Not required -- see below."
fi

step "Done"
say "Reload the Scale House page in Chrome. If Chrome asks to let"
say "reusecanadascale.com use apps on this device, click Allow."
say ""
say "Bridge log:  $LOG_FILE"
say "Status page: $BRIDGE_URL"
echo
}

main "$@"
