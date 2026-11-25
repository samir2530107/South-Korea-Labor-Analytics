#!/bin/bash
# Starts backend (5000) and frontend (5173). MySQL must already be running.
cd "$(dirname "$0")"
(cd backend && npm start) &
(cd frontend && npm run dev) &
wait
