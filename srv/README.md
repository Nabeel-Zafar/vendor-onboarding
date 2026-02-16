# Vendor Onboarding Backend

This is the backend API server for the Vendor Onboarding System, built with SAP CAP (Cloud Application Programming Model).

## Tech Stack

- **Framework**: SAP CAP v7
- **Runtime**: Node.js with Express.js
- **Database**: SQLite (for development)
- **API Standard**: OData v4
- **Authentication**: JWT (jsonwebtoken)

## Project Structure

```
vendor-onboarding-backend/
├── db/                          # Database schema definitions (CDS)
│   ├── vendor.cds              # Vendor entity schema
│   ├── user.cds                # User entity schema
│   ├── onboardingSchema.cds    # Vendor onboarding form schema
│   └── data/                   # Sample/seed data (optional)
├── srv/                        # Service definitions and implementations
│   ├── VendorService.cds       # Vendor service definition
│   ├── VendorService.js        # Vendor business logic
│   ├── UserService.cds         # User service definition
│   ├── UserService.js          # User business logic
│   ├── VendorOnboardingFormService.cds
│   └── VendorOnboardingFormService.js
├── package.json                # Dependencies and CAP configuration
├── .cdsrc.json                 # CAP configuration
├── .eslintrc                   # ESLint configuration
└── .gitignore                  # Git ignore rules
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd vendor-onboarding-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the database (creates SQLite database):
   ```bash
   npm run deploy
   ```

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run watch
```

The backend server will start on `http://localhost:4004`

### Production Mode

```bash
npm start
```

## Available Services

Once the server is running, you can access the following services:

- **Service Index**: http://localhost:4004
- **Vendor Service**: http://localhost:4004/odata/v4/VendorService/
- **User Service**: http://localhost:4004/odata/v4/UserService/
- **Onboarding Form Service**: http://localhost:4004/odata/v4/VendorOnboardingFormService/

## API Endpoints

### Vendor Service

- `GET /odata/v4/VendorService/Vendor` - Get all vendors
- `GET /odata/v4/VendorService/Vendor(ID)` - Get vendor by ID
- `POST /odata/v4/VendorService/Vendor` - Create new vendor
- `PATCH /odata/v4/VendorService/Vendor(ID)` - Update vendor
- `DELETE /odata/v4/VendorService/Vendor(ID)` - Delete vendor
- `POST /odata/v4/VendorService/ApproveOrRejectAction` - Approve or reject vendor

### User Service

- `GET /odata/v4/UserService/User` - Get all users
- `POST /odata/v4/UserService/User` - Create new user

### Vendor Onboarding Form Service

- `POST /odata/v4/VendorOnboardingFormService/VendorOnboardingForm` - Submit onboarding form

## CORS Configuration

The backend is configured to accept requests from any origin (for development). Update the CORS settings in `package.json` under `cds.server.cors` for production.

## Database

The application uses SQLite for local development. The database file `db.sqlite` is created automatically when you deploy.

To reset the database:
```bash
rm db.sqlite
npm run deploy
```

## Environment Variables

You can configure the following via environment variables:

- `PORT` - Server port (default: 4004)
- `CDS_ENV` - Environment (development/production)

## Testing

You can test the API endpoints using:

- Browser: Navigate to http://localhost:4004
- Postman or similar REST client
- cURL commands

Example cURL:
```bash
curl http://localhost:4004/odata/v4/VendorService/Vendor
```

## Integration with SAP Build Process Automation

The VendorService includes integration with SAP Build Process Automation API. Update the credentials in `srv/VendorService.js` if needed.

## Development

- Service definitions are in `srv/*.cds` files
- Business logic is in `srv/*.js` files
- Database schemas are in `db/*.cds` files
- ESLint is configured for code quality

## Troubleshooting

**Error: "Cannot find module '@sap/cds'"**
- Run `npm install` to install dependencies

**Error: "Port 4004 already in use"**
- Kill the process using port 4004 or change the port in package.json

**Database errors**
- Delete `db.sqlite` and run `npm run deploy` again

## License

ISC
