# Scale House camera setup on a Mac

## This Mac: repaired October 16, 2026

Agent DVR was running, but the Scale House bridge was stopped. The bridge is
now a macOS login service named `com.reusecanadascale.bridge`. It starts when
this user logs in and restarts after a crash. Chrome showed **Camera live**
and **2560 x 1440** after installation; the Bluetooth scale stayed connected.

The service uses a standalone copy in `~/Library/Application Support/Reuse Canada Scale`.
Logs are in `~/Library/Logs/Reuse Canada Scale`. It listens only on this Mac,
on port 5555. No router ports or public camera access were opened.
It does not prevent the Mac from sleeping and does not run before login.

## Set up a second Mac independently at the yard

1. Extract the entire `Reuse-Canada-Mac-Setup.zip` folder on that Mac.
2. Install Node.js LTS from https://nodejs.org if it is not already installed.
3. Double-click `install-scale-bridge.command`. Keep the scripts folder beside it.
4. Install Agent DVR from its official source and add the yard camera using
   the camera's address and credentials. This must be configured on the second
   Mac too if it should work while the first Mac is off. The bridge installer
   does not install Agent DVR or copy camera passwords.
5. Open https://www.reusecanadascale.com/employee/scale-house in Chrome and sign in.
   Allow local network access when Chrome asks.
6. Open **Equipment & settings → Yard cameras**, add/edit a network camera,
   and use **Find Agent DVR cameras**. Select the yard camera, enable it,
   and choose it for ticket photos. Confirm **LIVE** and a changing timestamp.
7. Connect the scale separately if this Mac will operate it. Bluetooth pairing
   belongs to each browser and Mac; a single adapter may not serve both at once.

Camera settings are currently saved per browser, not shared by the CRM login.
Use the same website address consistently. The www and non-www addresses have
separate browser settings and permissions.

## Access from another location

The installer alone does not provide off-site camera access. That requires a
secure private connection to the yard network, or an authenticated camera relay,
plus an always-on recorder/gateway at the yard. This has not been configured or
tested. Opening the CRM on another network cannot reach a yard-only camera by
itself. If both Macs are off, an independent always-on yard gateway is required.

## If the camera stops

- Ensure the Mac is awake and logged in, and Agent DVR is running.
- Open http://127.0.0.1:5555/status on that Mac to check the bridge.
  `connected: false` here can be normal: this field describes the bridge's
  serial scale connection, not the camera or Chrome's Bluetooth connection.
- Open http://127.0.0.1:8090 to check Agent DVR's picture.
- If those work but Scale House does not, check the site's local-network
  permission in Chrome and the selected camera in Equipment & settings.
- Rerun the installer to repair/update the bridge, including after removing
  or moving the Node.js version used at installation.

Do not disable Chrome's network protections or expose Agent DVR to the internet
to fix a local connection problem.

## Remove the startup service

Run `launchctl bootout gui/$(id -u)/com.reusecanadascale.bridge`, then remove
`~/Library/LaunchAgents/com.reusecanadascale.bridge.plist`. This leaves Agent DVR
and camera recordings unchanged.
