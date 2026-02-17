# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAP CAP + SAP UI5 vendor onboarding application. Two independent sub-projects:
- **`srv/`** — Backend: SAP CAP (Node.js) serving OData v4 APIs on port 4004, SQLite for dev
- **`ui5/`** — Frontend: SAPUI5 v1.120.17 Fiori app with an Express proxy server on port 8080

## Common Commands

### Backend (`srv/` directory)
```bash
cd srv && npm install          # Install dependencies
cd srv && npm run deploy       # Create/reset SQLite database
cd srv && npm run watch        # Dev server with auto-reload (port 4004)
cd srv && npm start            # Production server
```

### Frontend (`ui5/` directory)
```bash
cd ui5 && npm install          # Install dependencies
cd ui5 && npm start            # Express proxy server (port 8080, proxies /odata and /api to backend)
cd ui5 && npm run start:ui5    # UI5 tooling dev server (port 8080, no proxy)
cd ui5 && npm run build        # Production build to dist/
```

### Database Reset
```bash
cd srv && rm db.sqlite && npm run deploy
```

### Linting (backend only)
ESLint is configured in `srv/.eslintrc` with CAP globals (SELECT, INSERT, UPDATE, DELETE, cds, etc.).

## Architecture

### Backend (SAP CAP)

**Entity definitions** in `srv/db/*.cds` — three entities: Vendor, User, VendorOnboardingForm.

**Services** in `srv/srv/` — each service has a `.cds` definition and `.js` implementation:
- **VendorService** — Main service. Validates mandatory fields + duplicate email/phone on CREATE. Sets criticality scores on READ based on status. Triggers SAP Build Process Automation (BPA) workflow on vendor creation. Exposes `ApproveOrRejectAction` custom action.
- **UserService** — Simple CRUD for user management.
- **VendorOnboardingFormService** — Separate form submission endpoint.

**Custom server** (`srv/server.js`) — Adds `/api/vendor-approval-callback` webhook endpoint for BPA approval/rejection callbacks.

**OData endpoints** (all under `http://localhost:4004`):
- `/odata/v4/VendorService/Vendor`
- `/odata/v4/UserService/User`
- `/odata/v4/VendorOnboardingFormService/VendorOnboardingForm`

### Frontend (SAPUI5)

**MVC pattern** — XML views in `ui5/webapp/view/`, controllers in `ui5/webapp/controller/`.

**Routing** defined in `ui5/webapp/manifest.json`:
- `""` → Login (hardcoded credentials: admin/admin123, requester/req123)
- `dashboard` → Admin vendor list with filtering/search
- `onboarding` → Vendor submission form
- `vendor/{vendorId}` → Vendor detail
- `users` → User management
- `users/new` → New user form

**State**: Uses UI5 JSONModel. Session model stores logged-in user role. Role-based navigation (admin → dashboard, requester → onboarding form).

**Proxy**: `ui5/server.js` proxies `/odata` and `/api` requests to backend (`BACKEND_URL` env var, defaults to `http://localhost:4004`).

**i18n**: All labels in `ui5/webapp/i18n/i18n.properties`.

**Theme**: SAP Horizon with custom overrides in `ui5/webapp/css/style.css`.

### Vendor Onboarding Workflow
1. User submits vendor form → backend validates → persists to SQLite
2. BPA workflow triggered asynchronously on creation
3. Vendor starts as "Pending" status
4. BPA callback (`/api/vendor-approval-callback`) updates status to Approved/Rejected
5. Admin can also approve/reject via dashboard using `ApproveOrRejectAction`

## Deployment

Cloud Foundry via `manifest.yml` in both `srv/` and `ui5/`. Backend: 256MB, Frontend: 128MB. BPA credentials configured as environment variables in the backend manifest.
