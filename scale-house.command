#!/bin/bash
# ============================================================
# Reuse Canada — Scale House kiosk launcher
# ============================================================
# Double-click this file on the scale-house Mac.
#
# WHY THIS EXISTS
# The Epson TM-T88VI is a USB printer owned by macOS CUPS. A browser cannot
# talk to it directly, so receipts are printed with window.print() -- which
# normally opens the macOS print dialog and waits for someone to press Enter.
# That is fine for a human operator but breaks a closed-loop agent.
#
# Chrome's --kiosk-printing flag makes window.print() go straight to the
# system DEFAULT printer with no dialog at all. That is the only way to get
# genuinely hands-off receipts out of a USB thermal printer on macOS.
#
# BEFORE FIRST USE
#   System Settings -> Printers & Scanners -> set the Epson TM-T88VI
#   as the Default printer. Kiosk printing always uses the default.
#
# NOTES
#   * A separate --user-data-dir keeps this away from your everyday Chrome
#     profile, so your normal browsing, extensions and logins are untouched.
#     It also means you log into the CRM once in this profile and it sticks.
#   * Quit with Cmd-Q. Kiosk mode hides the usual window chrome.

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="https://www.reusecanadascale.com/employee/scale-house?kiosk=1"
PROFILE="$HOME/.reuse-scale-chrome"

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome was not found at:"
  echo "  $CHROME"
  echo
  echo "Install Chrome, or edit the CHROME= line in this file to point at it."
  echo "Kiosk printing is a Chrome feature -- Safari has no equivalent."
  read -r -p "Press Return to close."
  exit 1
fi

mkdir -p "$PROFILE"

echo "Starting the scale house in kiosk mode."
echo "Receipts will print straight to the macOS default printer."
echo "Quit with Cmd-Q."

exec "$CHROME" \
  --kiosk \
  --kiosk-printing \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  "$URL"
