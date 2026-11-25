# South Korea Labor Analytics

React + Vite frontend, Node/Express backend, MySQL database `south_korea_labor_market`.
Runs on your own computer only. The "View Tables" page is read-only.

## Run it

1. Start MySQL and make sure the database `south_korea_labor_market` is imported.
2. If `node_modules` folders are missing, run `npm install` inside `backend` and inside `frontend`.
3. Double-click `start.bat` (Windows), or open two terminals:
   - `cd backend` then `npm start`   -> http://localhost:5000
   - `cd frontend` then `npm run dev` -> http://localhost:5173
4. Open http://localhost:5173

## MySQL password

The password is set in `backend/config/db.js` (or use env var `DB_PASSWORD`).

## Pages

Dashboard, Regional Employment, Gender Analysis, Unemployment, Industry Analysis,
View Tables (all 7 tables, search, paging, Readable/Raw IDs), About.

## API (all GET)

/api/health, /api/dashboard, /api/regional/{years,employment,trend},
/api/gender/{years,employment,trend}, /api/unemployment, /api/industry/{meta,trend},
/api/tables, /api/tables/:name
