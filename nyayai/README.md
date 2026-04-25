# Nyay AI Court (Syllabus Project)

Full-stack Case Management system built with:
- Frontend: React, Bootstrap, HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)

This version is aligned to academic syllabus. The runnable project is Node.js + MongoDB based, and SpringBoot theory notes are included separately for syllabus study.

## Project Structure

### Backend (`server/`)
- `server.js`
- `config/db.js`
- `models/Case.js`
- `controllers/caseController.js`
- `routes/caseRoutes.js`

### Frontend (`client/`)
- `src/components/AddCaseForm.jsx`
- `src/components/CasesList.jsx`
- `src/pages/HomePage.jsx`
- `src/App.js`

## Case Object

Each case contains:
- `title`
- `description`
- `verdict`
- `createdAt`

## API Endpoints

- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/:id`
- `PUT /api/cases/:id`
- `DELETE /api/cases/:id`

## Run Instructions

### 1. Start MongoDB
```powershell
cd "C:\Users\D Manoj Reddy\Desktop\ai court\nyayai"
mkdir mongodb-data -ErrorAction SilentlyContinue
mongod --dbpath "C:\Users\D Manoj Reddy\Desktop\ai court\nyayai\mongodb-data"
```

### 2. Run Backend
```powershell
cd "C:\Users\D Manoj Reddy\Desktop\ai court\nyayai\server"
npm install
node server.js
```

### 3. Run Frontend
```powershell
cd "C:\Users\D Manoj Reddy\Desktop\ai court\nyayai\client"
npm install
npm start
```

Frontend URL: `http://localhost:3000`  
Backend URL: `http://localhost:5000`

## Sample Data

Sample `POST /api/cases` body:
```json
{
  "title": "Landlord Deposit Dispute",
  "description": "Tenant claims landlord did not return security deposit after vacating.",
  "verdict": "Pending"
}
```

Another sample:
```json
{
  "title": "Salary Not Paid",
  "description": "Employee has not received salary for two months.",
  "verdict": "In Favor of Employee"
}
```

## Syllabus Mapping

- Unit I: HTML document structure in `public/index.html`, links/images/lists/tables/iframe in `HomePage.jsx`, and CSS + Bootstrap styling.
- Unit II: JavaScript fundamentals used in `HomePage.jsx` and form/event handling in `AddCaseForm.jsx`; async fetch API for CRUD calls; XML + DTD files in `client/public/legal-case.xml` and `client/public/legal-case.dtd`.
- Unit III: Bootstrap components demonstrated: navbar, cards, table, alerts, buttons, badges, progress bar, dropdown, pagination, collapse, and carousel.
- Unit III (SpringBoot theory): see `docs/springboot-theory-notes.md` for architecture and concepts.
- Unit IV: React functional components, props, state, conditional rendering, lists, keys, forms, and SPA behavior.
- Unit V: Node.js + Express + MongoDB with routes and async/await; event-driven usage via `EventEmitter`, listeners, timers, and callbacks.
