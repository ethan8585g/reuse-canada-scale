#!/bin/bash
# ============================================================
# Reuse Canada — Scale House launcher (silent receipt printing)
# ============================================================
# Double-click this file. It cold-starts Chrome with the two flags the Scale
# House station needs: one to let the page talk to this Mac at all, and one to
# send window.print() straight to the printer with no dialog.
#
# WHY THIS EXISTS -- TWO SEPARATE REASONS
#
# 1. LOCAL NETWORK ACCESS (the important one, since Chrome 142).
#    www.reusecanadascale.com is a public https site, and Chrome now blocks a
#    public site from reaching 127.0.0.1 unless the operator grants a
#    permission prompt. Everything the Scale House gets from this Mac goes
#    through http://localhost:5555 -- the scale feed, silent receipt printing,
#    and the yard camera -- so when that is blocked the page looks like the
#    bridge is simply not running, with only a CORS error in the console to
#    say otherwise. --disable-features=LocalNetworkAccessChecks removes the
#    gate for this launch. (Clicking "Allow" on Chrome's prompt works too, but
#    it is one unlabelled dialog between the operator and a working scale.)
#
# 2. SILENT PRINTING, which is now only the fallback path. If scale-bridge.js
#    is running and a receipt printer is picked in the Scale House sidebar,
#    receipts print through `lp`: silent in any browser, no flags needed.
#
# Browser printing is what needs the flag: in ordinary Chrome, window.print()
# always opens the macOS print preview and waits for a click -- no JavaScript
# can suppress that. --kiosk-printing is the only switch that removes it, and
# it can only be set when Chrome COLD STARTS.
#
# TWO TRAPS THIS SCRIPT HANDLES FOR YOU
#   1. Chrome ignores startup flags if it is already running -- a new window
#      just joins the existing process. So it must be fully quit first.
#   2. It runs on your NORMAL profile on purpose. A separate profile would
#      cost you your CRM login and, more painfully, your Web Bluetooth
#      pairing with the scale -- those permissions are per-profile.
#
# BEFORE FIRST USE
#   System Settings -> Printers & Scanners -> set the receipt printer as
#   Default. Kiosk printing always uses the system default printer.
#
# VERIFY IT WORKED
#   Press "Test Print" in the sidebar, then read the Scale Agent log:
#     "receipt sent to printer — 40ms (silent)"          <- working
#     "receipt sent to printer — 6200ms (print dialog…)" <- not working
#
# Pass --fullscreen for a dedicated kiosk station.

set -uo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="https://www.reusecanadascale.com/employee/scale-house?kiosk=1"

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome was not found at:"
  echo "  $CHROME"
  echo
  echo "Kiosk printing is a Chrome feature. Safari has no equivalent, and the"
  echo "scale needs Web Bluetooth, which Safari also lacks."
  read -r -p "Press Return to close."
  exit 1
fi

EXTRA=""
if [ "${1:-}" = "--fullscreen" ]; then EXTRA="--kiosk"; fi

if pgrep -x "Google Chrome" > /dev/null; then
  echo "Chrome is already running."
  echo
  echo "Startup flags only apply to a COLD start -- relaunching now would just"
  echo "open a window inside the running process and silently ignore"
  echo "--kiosk-printing. Chrome has to be fully quit first."
  echo
  read -r -p "Quit Chrome and reopen the scale house? [y/N] " ans
  case "$ans" in
    [Yy]*)
      osascript -e 'quit app "Google Chrome"' >/dev/null 2>&1
      for _ in $(seq 1 20); do
        pgrep -x "Google Chrome" >/dev/null || break
        sleep 0.5
      done
      if pgrep -x "Google Chrome" >/dev/null; then
        echo
        echo "Chrome did not quit -- something may be holding it (an unsaved tab?)."
        echo "Quit it by hand with Cmd-Q, then run this again."
        read -r -p "Press Return to close."
        exit 1
      fi
      sleep 1
      ;;
    *)
      echo "Cancelled. Nothing changed."
      exit 0
      ;;
  esac
fi

echo "Starting the scale house with silent printing."
echo "Receipts go straight to the macOS default printer, no dialog."
echo
echo "Note: this applies to ALL Chrome windows until you next restart Chrome"
echo "normally. Anything you print from any tab will skip the dialog."

# No --user-data-dir on purpose: the normal profile keeps the CRM login and
# the Web Bluetooth pairing with the scale.
exec "$CHROME" --kiosk-printing --disable-features=LocalNetworkAccessChecks $EXTRA "$URL" >/dev/null 2>&1 &
