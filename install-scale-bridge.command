#!/bin/bash
# ============================================================
# Reuse Canada — make the scale-bridge start by itself
# ============================================================
# Double-click this file ONCE on the scale-house Mac. After that the bridge
# starts when you log in, restarts itself if it ever crashes, and needs no
# Terminal window left open.
#
# WHY THIS MATTERS FOR THE CAMERA
#   The yard camera reaches Scale House like this:
#
#     Reolink --RTSP--> Agent DVR (port 8090) --> scale-bridge.js (port 5555)
#       --> Scale House on this Mac --relay--> Scale House on any other screen
#
#   Every link has to be running for anyone to see the camera. Agent DVR runs
#   as a service already (its installer offers that). The bridge did not: it
#   was started by hand in Terminal, so after a restart, a power cut or a
#   closed window the camera, the scale feed and silent receipt printing all
#   stopped until someone noticed.
#
# RUN IT AGAIN whenever scale-bridge.js changes (after pulling new code). It
# copies the new file into place and restarts the bridge -- this replaces
# "restart the bridge".
#
#   ./install-scale-bridge.command               install or update
#   ./install-scale-bridge.command --uninstall   stop it and remove it
#
# Settings such as BAUD=4800 or PRINTER=... that you used to type before
# "node scale-bridge.js" can be given here the same way, and are kept -- a
# later re-run without them keeps the earlier values (--uninstall clears them):
#   BAUD=4800 ./install-scale-bridge.command
#
# Where things go (none of it needs an administrator password):
#   ~/Library/Application Support/ReuseCanada/scale-bridge.mjs   the bridge
#   ~/Library/LaunchAgents/com.reusecanada.scale-bridge.plist     autostart
#   ~/Library/Logs/scale-bridge.log                               its output
#
# The bridge is copied out of this folder on purpose: macOS will not let a
# background service read files in Desktop, Documents or Downloads without a
# privacy prompt nobody is there to answer. It is saved as .mjs because it is
# an ES module and, away from this repo's package.json, Node would otherwise
# not know that.

set -uo pipefail

LABEL="com.reusecanada.scale-bridge"
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/scale-bridge.js"
APP_DIR="$HOME/Library/Application Support/ReuseCanada"
DEST="$APP_DIR/scale-bridge.mjs"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/scale-bridge.log"
DOMAIN="gui/$(id -u)"
PORT="${HTTP_PORT:-5555}"

pause() { read -r -p "Press Return to close." _; }

if [ "$(uname)" != "Darwin" ]; then
  echo "This installer is for the scale-house Mac (macOS)."
  exit 1
fi

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1
  rm -f "$PLIST"
  echo "The scale-bridge will no longer start by itself."
  echo "(Left in place: $DEST and $LOG)"
  pause
  exit 0
fi

if [ ! -f "$SRC" ]; then
  echo "scale-bridge.js was not found next to this file:"
  echo "  $SRC"
  pause
  exit 1
fi

# Node: whatever this Terminal finds first, then the usual install places.
# launchd does not read your shell profile, so the full path is written into
# the plist rather than trusting PATH.
NODE="$(command -v node 2>/dev/null || true)"
for c in /opt/homebrew/bin/node /usr/local/bin/node; do
  [ -n "$NODE" ] && break
  [ -x "$c" ] && NODE="$c"
done
if [ -z "$NODE" ]; then
  echo "Node.js was not found. Install it from https://nodejs.org (LTS), then"
  echo "run this again."
  pause
  exit 1
fi
echo "Node:   $NODE ($("$NODE" --version))"

# A bridge started by hand still holds the port, and the new one cannot start
# until it lets go.
launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1
sleep 1
HELD="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1)"
if [ -n "$HELD" ]; then
  echo
  echo "A scale-bridge is already running by hand (process $HELD), probably in"
  echo "another Terminal window. It has to stop so the automatic one can start."
  read -r -p "Stop it now? [Y/n] " ans
  case "$ans" in
    [Nn]*) echo "Cancelled. Nothing changed."; pause; exit 0 ;;
    *) kill "$HELD" 2>/dev/null
       for _ in $(seq 1 10); do
         lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t >/dev/null 2>&1 || break
         sleep 0.5
       done ;;
  esac
fi

mkdir -p "$APP_DIR" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cp "$SRC" "$DEST"

xml() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

ENV_XML="    <key>PATH</key><string>/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin</string>"
for v in PORT_PATH BAUD PARITY DATABITS STOPBITS HTTP_PORT PRINTER RECEIPT_COLS \
         CAMERA_ALLOWED_HOSTS SCALE_BRIDGE_ALLOWED_ORIGINS SCALE_BRIDGE_TOKEN; do
  val="${!v:-}"
  # Re-running to update must not quietly drop a BAUD set the first time.
  if [ -z "$val" ] && [ -f "$PLIST" ]; then
    val="$(plutil -extract "EnvironmentVariables.$v" raw -o - "$PLIST" 2>/dev/null || true)"
  fi
  if [ -n "$val" ]; then
    ENV_XML="$ENV_XML
    <key>$v</key><string>$(xml "$val")</string>"
    echo "Keeping $v=$val"
  fi
done

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(xml "$NODE")</string>
    <string>$(xml "$DEST")</string>
  </array>
  <key>WorkingDirectory</key><string>$(xml "$APP_DIR")</string>
  <key>EnvironmentVariables</key>
  <dict>
$ENV_XML
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>ProcessType</key><string>Interactive</string>
  <key>StandardOutPath</key><string>$(xml "$LOG")</string>
  <key>StandardErrorPath</key><string>$(xml "$LOG")</string>
</dict>
</plist>
PLIST

if ! plutil -lint "$PLIST" >/dev/null; then
  echo "The autostart file came out malformed:"; plutil -lint "$PLIST"
  pause; exit 1
fi

launchctl enable "$DOMAIN/$LABEL" >/dev/null 2>&1
if ! launchctl bootstrap "$DOMAIN" "$PLIST"; then
  echo "macOS refused to start it. The last lines of $LOG:"
  tail -n 20 "$LOG" 2>/dev/null
  pause; exit 1
fi

# ── Check the whole camera chain, so this window says what is still missing ──
echo
echo "Checking..."
UP=""
for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/status" >/dev/null 2>&1; then UP=1; break; fi
  sleep 0.5
done
if [ -z "$UP" ]; then
  echo "  ✗ scale-bridge did not answer on port $PORT. The last lines of $LOG:"
  tail -n 20 "$LOG" 2>/dev/null
  pause; exit 1
fi
echo "  ✓ scale-bridge is running and will start by itself from now on."

if ls /Library/LaunchDaemons /Library/LaunchAgents "$HOME/Library/LaunchAgents" 2>/dev/null \
     | grep -qi -E 'ispy|agentdvr|agent\.dvr'; then
  echo "  ✓ Agent DVR is set to start by itself."
else
  echo "  ! Agent DVR does not look like it starts by itself. Re-run its installer"
  echo "    and answer yes when it offers to set Agent DVR up as a service."
fi

CAMS="$(curl -fsS --max-time 5 "http://127.0.0.1:$PORT/camera/agentdvr" 2>/dev/null || true)"
case "$CAMS" in
  *'"ok":true'*)
    NAMES="$(printf '%s' "$CAMS" | sed -n 's/.*"cameras":\[\(.*\)\].*/\1/p' | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | paste -sd, -)"
    if [ -n "$NAMES" ]; then
      echo "  ✓ Agent DVR is answering. Cameras: $NAMES"
    else
      echo "  ! Agent DVR is answering but has no cameras. Add the Reolink in Agent DVR"
      echo "    (http://localhost:8090) first."
    fi ;;
  *)
    echo "  ! Agent DVR is not answering on port 8090. Open it (http://localhost:8090)"
    echo "    and check it is running." ;;
esac

echo
echo "Last step: open Scale House with scale-house.command (it lets Chrome talk to"
echo "this Mac). Once the yard camera shows LIVE there, every other Scale House"
echo "screen picks it up by itself."
pause
