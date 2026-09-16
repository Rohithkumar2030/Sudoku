# Full-Stack Sudoku Validator

A clean, modern, full-stack Sudoku validator application built for a coding assignment task.

## Tech Stack

- **Frontend**: React 18, Vite, Lucide React, Modern CSS (Responsive, CSS Grid, Custom Design)
- **Backend**: Node.js, Express.js (ES Modules, CORS, JSON middleware)
- **Database**: SQLite
- **ORM**: Prisma ORM

---

## Features

1. **Clean 9x9 Sudoku Grid**:
   - Visual 3x3 block subgrid boundaries.
   - Enter digits `1` to `9`, or clear with `Backspace`, `Delete`, or `0`.
   - Smooth arrow-key navigation (`↑`, `↓`, `←`, `→`) across the board.
   - Auto-advance cursor to the next cell upon entering a valid digit.

2. **Sudoku Rule Validation**:
   - Checks every filled cell is an integer `1–9`.
   - Validates that no duplicates exist in any row.
   - Validates that no duplicates exist in any column.
   - Validates that no duplicates exist in any 3x3 subgrid.
   - Highlights conflicting cells on the grid in red with a soft pulse for easy debugging.

3. **Persistent SQLite Database via Prisma**:
   - Automatically stores the board state, `isValid` boolean flag, diagnostic message, and timestamp on every validation.
   - Validation records persist across server restarts in `backend/prisma/dev.db`.

4. **Validation History**:
   - Loaded from the backend (`GET /api/history`) upon initial page load.
   - Displays history cards with status tags (`VALID` / `INVALID`), formatted timestamps, and diagnostic messages.
   - **Inspect Board** feature: Click on any past history item to reload that board state onto the grid.
   - **Clear History** feature to reset past records.

---

## Project Structure

```
Sudoku/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (SQLite datasource & ValidationHistory model)
│   │   └── dev.db             # SQLite database file
│   ├── src/
│   │   ├── validator.js       # Pure Sudoku validator function
│   │   └── server.js          # Express server with REST API endpoints
│   ├── test-validator.js      # Unit tests for validation logic
│   ├── .env                   # Database URL and PORT configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SudokuGrid.jsx       # 9x9 interactive board component
│   │   │   ├── ValidationBanner.jsx # Result banner component
│   │   │   └── HistoryList.jsx      # Validation history list (sidebar)
│   │   ├── App.jsx                  # Main application state & API integration
│   │   ├── App.css                  # Modern, clean responsive styling
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js               # Vite config with backend proxy (/api -> :5001)
│   └── package.json
├── package.json               # Root scripts
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or v20+)
- npm

### 2. Quick Setup

You can install all dependencies from the root directory:
```bash
npm run install:all
```
*(Or navigate to `backend/` and `frontend/` and run `npm install` in each).*

The database schema is already pushed to SQLite, but you can re-run Prisma migration or push at any time:
```bash
cd backend
npx prisma db push
```

---

## Running the Application

### Option A: Run Backend and Frontend in separate terminals

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
Backend runs at: `http://localhost:5001`

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## Running Backend Unit Tests

To run the pure validator unit tests verifying all Sudoku rules and edge cases:
```bash
cd backend
node test-validator.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/validate` | Validates a 9x9 board and saves history record to SQLite |
| `GET` | `/api/history` | Fetches validation history records (ordered descending by timestamp) |
| `DELETE` | `/api/history` | Clears validation history records |
