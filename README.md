# NyayAI - AI Courtroom Simulator

NyayAI is a full-stack legal-tech project that helps users simulate courtroom argument flow, classify legal disputes, review applicable laws, and discover relevant government schemes.

The app includes:
- A React frontend for case intake, courtroom simulation, verdict review, and downloadable reports
- A Node.js + Express backend with JWT authentication and domain-specific legal modules
- A MongoDB data layer for users, sessions, laws, and schemes
- Gemini-powered legal question generation and verdict analysis

## Highlights

- Secure auth flow with register, login, and protected routes
- Case classification engine with keyword-based legal routing
- Structured courtroom Q and A generation workflow
- Verdict engine with strengths, weaknesses, favorable and opposing laws
- Law lookup and search endpoints
- Scheme matching based on state, category, income, and case type
- Report and verdict PDF export from the frontend

## Tech Stack

- Frontend: React, React Router, Axios, Bootstrap, Chart.js
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs
- Database: MongoDB
- AI: Google Gemini API (key rotation support in services)

## Repository Layout

The app source lives inside the `nyayai` folder.

```
nyayai/
  client/                  # React app
  server/                  # Express API and services
  docs/                    # Theory/reference notes
  start-nyayai.bat         # Starts frontend + backend on Windows
```

## API Modules

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile` (protected)
- `POST /api/classify`
- `POST /api/courtroom/start` (protected)
- `POST /api/courtroom/qa-grid` (protected)
- `POST /api/courtroom/verdict-engine` (protected)
- `POST /api/courtroom/simulate` (protected)
- `POST /api/schemes/match` (protected)
- `GET /api/schemes/:id` (protected)
- `GET /api/laws`
- `GET /api/laws/search`
- `GET /api/laws/:sectionId`
- `GET /api/health`

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6+ (local or remote URI)

### 1) Install dependencies

From repository root:

```powershell
cd nyayai
npm run install:all
```

### 2) Configure backend environment

Create `nyayai/server/.env` from `nyayai/server/.env.example` and update values:

- `PORT=5000`
- `MONGODB_URI=<your_mongodb_uri>`
- `JWT_SECRET=<strong_secret>`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=http://localhost:3000`
- `REACT_APP_GOOGLE_API_KEYS=<comma_separated_keys_if_used>`

Note: The current backend services read Gemini keys from `REACT_APP_GOOGLE_API_KEYS`.

### 3) Seed legal data (optional but recommended)

```powershell
cd nyayai/server
npm run seed
```

### 4) Run the project

Option A (Windows helper script):

```powershell
cd nyayai
npm start
```

Option B (separate terminals):

```powershell
cd nyayai/server
npm run dev
```

```powershell
cd nyayai/client
npm start
```

## Default URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

