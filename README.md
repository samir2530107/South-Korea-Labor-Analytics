# South Korea Labor Analytics

A read-only labor-market dashboard for South Korea. The frontend is built with React, Vite and Chart.js; the API uses Node.js, Express and MySQL.

## Run locally

Requirements: Node.js 20.19+ and a MySQL server with the `south_korea_labor_market` schema and data imported.

1. Start MySQL.
2. Copy `backend/.env.example` to `backend/.env` and set the database connection values. Local MySQL defaults to `127.0.0.1:3306`, user `root`, database `south_korea_labor_market`, and no password; update these if your setup differs. For hosted MySQL, configure SSL with `DB_SSL_CA` or `DB_SSL_CA_PATH` when required.
3. Install dependencies once:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. Start the API and website in separate terminals:
   - `cd backend && npm start` — API on `http://localhost:5000`
   - `cd frontend && npm run dev` — website on `http://localhost:5173`
5. Open the Vite URL. The frontend proxies `/api` requests to the local API, so the browser does not need to call `localhost` directly.

On Windows, `start.bat` starts both processes. On macOS/Linux, run `./start.sh` after installing dependencies.

## Data quality and Total values

The regional analytics endpoints validate each region/year `Total` against the corresponding `Male + Female` population counts. A count is reconciled only when it is missing or differs materially (more than the larger of 2 thousand persons or 0.1%). Related rates are recalculated from the reconciled counts when they differ from the source by more than 0.5 percentage points. The API returns a `dataQuality` summary with the source value, validated value and method used.

This is a display-time correction only: the database is not edited. In **View Tables → Regional Labor Stats**, the **Readable** view uses validated totals; **Raw IDs** shows the stored source record. This makes a suspicious value such as a Seoul 2000 Total visible with an explanation instead of silently trusting it.

## Pages

- Dashboard — latest regional snapshot and long-term trends
- Regional Employment — city comparison, filters, detailed values and validation notices
- Gender Analysis — male/female comparisons and city trends
- Unemployment — rates and economically active population
- Industry Analysis — wages and working time by industry and establishment size
- View Tables — searchable, paginated, read-only table viewer
- About — definitions and data-quality methodology

## API

All endpoints are read-only `GET` routes:

- `/api/health`
- `/api/dashboard`
- `/api/regional/years`, `/api/regional/employment`, `/api/regional/trend`
- `/api/gender/years`, `/api/gender/employment`, `/api/gender/trend`
- `/api/unemployment`
- `/api/industry/meta`, `/api/industry`, `/api/industry/trend`
- `/api/tables`, `/api/tables/:name`

## Tests

Run the backend validation tests with `cd backend && npm test`. They use a synthetic Seoul 2000 example to exercise the reconciliation logic; they do not alter or assume values in your database.

## Deployment

GitHub Pages is configured in `.github/workflows/deploy.yml`. Set `VITE_API_BASE_URL` to the deployed API URL and `VITE_BASE_PATH` to `/South-Korea-Labor-Analytics/` in the build environment.
