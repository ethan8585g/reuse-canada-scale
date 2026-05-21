# Reuse Canada — CRM & Operations Platform

## Project Overview
- **Name**: Reuse Canada CRM
- **Goal**: Unified platform for managing tire pickup logistics, digital scale ticketing, customer relationships, and route planning
- **Tech Stack**: Hono + TypeScript + TailwindCSS + Cloudflare Workers (D1 SQLite)
- **Version**: v3.1

## Live URLs
- **GitHub**: https://github.com/ethan8585g/Reuse-Canada-CRM-v3

## Login Credentials

### Customer Portal (default login screen)
| Username | Password | Company |
|----------|----------|---------|
| KALTIRE | TIRES! | Kal Tire - Edmonton South |
| GOINGTIRE | Tires2024! | Going Tire - Spruce Grove |

### Employee Portal (click "Employee Login" toggle at bottom)
| Email | Password | Role | Portal |
|-------|----------|------|--------|
| Ethan@reuse-canada.ca | Tires123! | Admin | Employee Dashboard |
| admin@reusecanada.ca | admin123 | Admin | Employee Dashboard |
| mike@reusecanada.ca | driver123 | Driver | **Driver Portal** |
| sarah@reusecanada.ca | driver123 | Driver | **Driver Portal** |
| james@reusecanada.ca | yard123 | Yard Operator | Employee Dashboard |
| dave@reusecanada.ca | driver123 | Driver | **Driver Portal** |

> **Note**: Drivers are automatically redirected to `/driver/portal` on login. Admins/managers/yard operators go to `/employee/dashboard`.

## Completed Features

### 1. Login System (`/`) -- UPDATED v3.1
- **Customer-first login**: Shows customer portal as the default login
- **Toggle button**: "Employee Login" button at the bottom switches to employee portal view
- **Driver auto-redirect**: Employees with `driver` role are automatically sent to `/driver/portal`
- Session management with token auth
- Auto-redirect if already logged in
- Case-insensitive login matching
- Expired session cleanup on login

### 2. Employee Dashboard (`/employee/dashboard`)
- **Clickable stat cards** -- Pending Pickups, Today's Routes, Open Scale Tickets, Completed Today all link directly to their respective pages
- **Dashboard Mini-Map** -- Google Maps with pinpoints for all scheduled pickups for the current day (color-coded by status)
- **Performance Micro-Graph** -- 7-day bar chart for completed items + daily volume stats (pickups, ~tires, kg weighed, tickets)
- **Live Driver Status** -- Real-time sidebar widget showing On Road vs Idle at Yard counts (polls every 30s)
- **Sidebar-only navigation** -- Removed redundant Quick Actions section; all navigation through the left sidebar
- Recent pickup requests and scale tickets with status badges
- Axios CDN fallback and safety checks

### 3. Customer Onboarding & Management (`/employee/customers`)
- **Full CRUD** for customer accounts
- Create customer with: username, password, company name, contact, phone, address, city, province, postal code, **region (N/S/E/W)**, notes
- Edit existing customer details (including password reset)
- Activate / deactivate customer accounts
- Search by company, contact, city, or username
- Filter by active/inactive status
- **Region column** in customer table (North/South/East/West)
- Stats: Total Active, Total Inactive, Pending Pickups (live from DB), Added This Month

### 4. Driver & Staff Management (`/employee/drivers`) -- UPDATED v3.1
- **Tabbed interface**: Staff tab and Vehicles tab
- **Create Driver Accounts**: Admin can create driver accounts with email/password -- drivers get their own login
- **Role hints**: When creating staff, shows what access level each role gets
- **Driver Portal badge**: Driver cards show "Has Driver Portal access" indicator
- Role-based card display with color-coded badges and icons
- Password management for all staff accounts
- **Vehicle Management** (Vehicles tab): Create/edit/toggle vehicles with types, plates, tare weights

### 5. Scale House (`/employee/scale-house`)
Full-featured scale house ticketing station:
- **Bluetooth Western APX Integration**: Web Bluetooth API connects to the Western APX indicator (model AM5332C) via an IRXON RS-232↔BT adapter
- **3-Step Workflow**: Create Ticket -> Capture Weight In (Gross) -> Capture Weight Out (Tare) -> Auto-calculate Net Weight
- **Auto Pricing**: Pulls rates from pricing table by material type. Calculates subtotal + 5% GST
- **Square Terminal Payment**: Sends $ amount to Square Reader for card tap/insert
- **Receipt Printing**: 80mm thermal receipt layout with REUSE CANADA branding
- **Ticket Queue**: Shows all active/pending tickets in sidebar (multi-status filter)
- **Simulation Mode**: "Sim" button for testing without physical scale hardware

### 6. Scale Ticket History (`/employee/scale-tickets`)
- Full ticket list with search/filter by status and date
- Ticket detail modal with all field data, weight history, and field photos/signatures
- Weigh-in and weigh-out actions from the table
- Void ticket functionality

### 7. Customer Dashboard (`/customer/dashboard`)
- Submit tire pickup requests (count, type, date, time preference, notes)
- View request status and history with color-coded status badges
- Stats: Pending, Scheduled, Completed, Total Tires

### 8. Pickup Management (`/employee/pickups`)
- Pickup request cards with full details (customer, address, tires, dates)
- **Regional Filtering**: North/South/East/West dropdown filter
- **Region badges** on each pickup card
- Driver assignment modal with date scheduling
- **Notify toggle** on each card (bell icon) for auto-SMS notification
- **Notify checkbox** in Assign & Schedule modal
- Status lifecycle: pending -> confirmed -> scheduled -> in_progress -> completed
- Cancel pickup option
- Field Form integration from scheduled pickups

### 9. Route Planning (`/employee/routing`)
- Create routes with driver/vehicle assignment
- Add pickup stops to routes
- **Google Maps Integration**: Live route visualization with markers, directions, and distance/time calculation
- Route stops timeline (Yard -> Stops -> Return)

### 10. iPad Field Form (`/employee/field-form`) -- FIXED v3.1
- 4-step touch-optimized workflow
- Step 1: Tire cage photo capture
  - **Separate "Take Photo" and "Choose from Gallery" buttons** (fixes iOS/iPadOS camera bug)
  - **Image compression**: Resizes to max 1200px, JPEG 80% quality (reduces 8MB iPad photos to ~200KB)
  - **Input reset on each use** (fixes iOS re-selection bug)
  - Error handlers for image load/read failures
- Step 2: Store name, employee name, tire count
- Step 3: Digital signature pad (touch-enabled)
- Step 4: Review & submit (auto-creates scale ticket)
- Pre-fills data when linked from pickup management

### 11. Driver Portal (`/driver/portal`) -- REWRITTEN v3.1
- **Full dashboard** with sidebar navigation (Dashboard, My Pickups, Routes, Scale Tickets, iPad Field Form)
- **Mobile responsive** with collapsible sidebar
- **Status toggle**: On Road vs At Yard (updates live sidebar widget on employee dashboard)
- **Dashboard tab**: Stats (Assigned, In Progress, Completed Today, Status) + quick pickup list
- **Pickups tab**: Full pickup list with Start/Complete/Proof actions + direct link to iPad field form
- **Routes tab**: View assigned routes with distance, duration, vehicle info
- **Scale Tickets tab**: View ticket list (ticket number, customer, material, weight, date) -- **NO revenue, pricing, or payment data visible**
- **Proof of Work upload**: Camera photo capture of cage/bin with GPS + timestamp
- Auto-notification to location manager on proof submission

### 12. Automated Notifications System
- **SMS schedule notification**: "Reuse Canada is scheduled for your pickup on [Date] at [Time]"
  - Triggered on status change to scheduled/confirmed when notify is enabled
  - Controlled per-pickup with bell toggle icon
- **Proof of work notification**: "Cage/Bin was swapped/picked up. Thanks for your business!"
  - Triggered when driver uploads proof photo
- All notifications logged in `notification_log` table
- View notification history via API

## Driver Permission Matrix

| Feature | Admin | Manager | Yard Operator | Driver |
|---------|-------|---------|---------------|--------|
| Employee Dashboard | Yes | Yes | Yes | No |
| Driver Portal | No | No | No | **Yes** |
| Scale House (full) | Yes | Yes | Yes | No |
| Scale Tickets (view, no $) | Yes | Yes | Yes | **Yes** |
| Pickup Management | Yes | Yes | Yes | **Yes** (own only) |
| Routes (view) | Yes | Yes | Yes | **Yes** (own only) |
| iPad Field Form | Yes | Yes | Yes | **Yes** |
| Customer Management | Yes | Yes | No | No |
| Staff Management | Yes | Yes | No | No |
| Revenue / Pricing Data | Yes | Yes | Yes | **No** |
| Proof of Work Upload | Yes | Yes | No | **Yes** |

## API Endpoints

### Auth
- `POST /api/auth/login` -- Login (customer or employee)
- `POST /api/auth/logout` -- Logout
- `GET /api/auth/verify` -- Verify session

### Employee Dashboard
- `GET /api/employee/dashboard` -- Dashboard stats + recent data + performance + daily_stats

### Driver Status
- `GET /api/employee/driver-status-summary` -- On Road vs Idle counts (sidebar widget)
- `POST /api/employee/driver-status` -- Update driver status (on_road/idle/at_pickup/returning)

### Map Data
- `GET /api/employee/todays-pickups-map` -- Today's scheduled pickups with GPS for map

### Proof of Work
- `POST /api/employee/pickup-proof` -- Submit proof (photo, GPS, timestamp, notes)
- `GET /api/employee/pickup-proof/:id` -- View proof records for a pickup

### Notifications
- `GET /api/employee/notifications` -- Notification log (last 50)

### Customer Management
- `GET /api/employee/customers` -- Active customers (for dropdowns)
- `GET /api/employee/customers/all?status=active|inactive` -- Full customer list with pending_pickups count
- `POST /api/employee/customers` -- Create new customer account (with region field)
- `PUT /api/employee/customers/:id` -- Update customer (with region field)
- `POST /api/employee/customers/:id/toggle` -- Activate/deactivate

### Staff Management
- `GET /api/employee/staff?role=driver|admin|manager|yard_operator` -- List employees
- `POST /api/employee/staff` -- Create new employee (auto-creates driver_status for drivers)
- `PUT /api/employee/staff/:id` -- Update employee
- `POST /api/employee/staff/:id/toggle` -- Activate/deactivate

### Vehicle Management
- `GET /api/employee/vehicles?all=true` -- List vehicles
- `POST /api/employee/vehicles` -- Create new vehicle
- `PUT /api/employee/vehicles/:id` -- Update vehicle
- `POST /api/employee/vehicles/:id/toggle` -- Activate/deactivate

### Pickups
- `GET /api/pickups?status=x&date=YYYY-MM-DD&region=north|south|east|west` -- List with region filter
- `GET /api/pickups/:id` -- Single pickup detail
- `POST /api/pickups/:id/status` -- Update status (with auto-notification if notify enabled)
- `POST /api/pickups/:id/assign` -- Assign driver + schedule (with notify option)
- `POST /api/pickups/:id/notify` -- Toggle notify_customer flag

### Scale Tickets
- `GET /api/scale-tickets?status=x,y,z&date=YYYY-MM-DD` -- List (multi-status filter)
- `GET /api/scale-tickets/:id` -- Detail
- `POST /api/scale-tickets` -- Create ticket
- `POST /api/scale-tickets/field` -- Create from iPad field form
- `POST /api/scale-tickets/:id/weight` -- Record weight (in/out)
- `POST /api/scale-tickets/:id/finalize` -- Save pricing
- `POST /api/scale-tickets/:id/payment` -- Update payment status
- `POST /api/scale-tickets/:id/void` -- Void ticket

### Routes
- `GET /api/routes?date=x&employee_id=y` -- List routes
- `GET /api/routes/:id` -- Route with stops
- `POST /api/routes` -- Create route with stops
- `POST /api/routes/:id/status` -- Update route status
- `POST /api/routes/:routeId/stops/:stopId/status` -- Update stop status

### Customer Pickups
- `GET /api/customer/pickups` -- Customer's own pickup requests
- `POST /api/customer/pickups` -- Submit new pickup request
- `GET /api/customer/pickups/:id` -- Single pickup detail

### Square Payments
- `POST /api/square/terminal-checkout` -- Send to Square Reader
- `GET /api/square/terminal-checkout/:id` -- Check payment status
- `POST /api/square/terminal-checkout/:id/cancel` -- Cancel checkout
- `POST /api/square/payment` -- Direct payment
- `GET /api/square/devices` -- List Square terminals
- `POST /api/square/cash-payment` -- Record cash payment

### Pricing
- `GET /api/pricing` -- Get all pricing rates
- `POST /api/pricing/:id` -- Update pricing

### Config
- `GET /api/config/maps-key` -- Google Maps API key (for frontend)

## Data Architecture

### Database: Cloudflare D1 (SQLite)
- **customers** -- Company info, contacts, addresses, coordinates, **region (N/S/E/W)**, login credentials
- **employees** -- Staff with roles (admin, manager, driver, yard_operator) -- each with their own login
- **sessions** -- Auth tokens with expiry (auto-cleaned on login)
- **pickup_requests** -- Tire pickup requests with lifecycle status, **notify_customer flag**
- **routes** -- Route plans with driver/vehicle assignment
- **route_stops** -- Individual stops within routes
- **scale_tickets** -- Core ticket with field data, weights, pricing, payments
- **vehicles** -- Fleet with plate numbers, types, tare weights
- **pricing** -- Material-type pricing table (per-kg and per-tire rates)
- **payment_log** -- Payment audit trail
- **driver_status** -- Real-time driver location and status tracking
- **pickup_proof** -- Photo proof of work with GPS and timestamps
- **notification_log** -- SMS/email notification history

### Pricing Table (Default Rates)
| Material | Price/kg | Price/tire |
|----------|----------|------------|
| Passenger Tires | $0.15 | $4.00 |
| Truck Tires | $0.12 | $15.00 |
| Mixed Tires | $0.14 | $5.00 |
| Off-Road Tires | $0.10 | $25.00 |
| Shingles | $0.08 | -- |
| Scrap Metal | $0.45 | -- |

## Hardware Integration

### Western APX Indicator (Bluetooth via IRXON adapter)
- Indicator: Western Scale APX, model **AM5332C** (mfg Accurate Scale Industries, Edmonton AB). Load cell unit: Western AM4913. Capacity 32,000 kg, class III HD, e=d=10 kg.
- Connection: IRXON RS-232↔Bluetooth adapter on the indicator's DB9 serial port (USB-powered).
- Web Bluetooth API in Chrome/Edge scans for the IRXON BLE service and reads the APX serial frames.
- Displays live weight + stable/unstable indicator.

### Square Terminal Reader
- Sends payment amounts via Square Terminal API
- Polls for card tap/insert completion
- Records payment IDs and status in our database

### Receipt Printer
- Uses browser's native print dialog
- Formatted for 80mm thermal receipt paper
- Prints full scale ticket with weights, pricing, company info

## Environment Variables (.dev.vars)
```
GOOGLE_MAPS_API_KEY=<configured>
SQUARE_APP_ID=<configured>
SQUARE_ACCESS_TOKEN=<configured>
```

## Deployment
- **Platform**: Cloudflare Pages (Workers + D1)
- **GitHub**: https://github.com/ethan8585g/Reuse-Canada-CRM-v3
- **Status**: Running in sandbox (Cloudflare deployment pending API key update)
- **Last Updated**: 2026-03-24

## Recent Changes (v3.1)

### Login Redesign
- Single customer-first login page (no side-by-side cards)
- "Employee Login" toggle button at the bottom of the page
- Clicking the toggle swaps between customer and employee login forms
- Drivers (role=driver) auto-redirect to `/driver/portal` on login

### Driver Account System
- Admins create driver accounts from Driver & Staff Management page
- Each driver gets their own email/password login credentials
- Role hint on create form shows access level for each role
- Driver cards show "Has Driver Portal access" badge
- Drivers access: pickups, routes, scale tickets (no revenue), iPad field form
- Drivers cannot see: revenue data, pricing, payment amounts, customer management, staff management

### Driver Portal Rewrite
- Full sidebar navigation (Dashboard, Pickups, Routes, Scale Tickets, iPad Form)
- Dashboard with stats cards (Assigned, In Progress, Completed Today, Status)
- Pickups tab with full action buttons (Start, Upload Proof, Complete, iPad Form)
- Routes tab showing assigned routes with distance/duration
- Scale Tickets tab showing tickets without any pricing/revenue/payment data
- Mobile responsive with collapsible sidebar

### iPad Field Form Fix
- Split single file input into separate "Take Photo" and "Choose from Gallery" buttons
- Fixes iOS/iPadOS bug where `capture="environment"` attribute prevents gallery access
- Image compression: 1200px max width, JPEG 80% quality (reduces 8MB to ~200KB)
- File input value reset on each use (fixes iOS onchange re-trigger bug)
- Added error handlers for image load and FileReader failures

### Previous Changes (v3.0)
- Sidebar cleanup (removed Quick Actions), live driver-status widget, dashboard mini-map
- Regional filtering (N/S/E/W), driver workflow with proof-of-work
- Automated status triggers (SMS notifications), performance micro-graph
- New DB tables: driver_status, pickup_proof, notification_log
