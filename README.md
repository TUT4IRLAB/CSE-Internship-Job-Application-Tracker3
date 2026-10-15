# CSE-Internship-Job-Application-Tracker3

CareerTrack — Internship & Job Application Tracker
CareerTrack is a full-stack web application designed to help students and recent graduates discover career opportunities and organize their applications in one place. It focuses on internships, graduate programmes, entry-level jobs, and Work-Integrated Learning (WIL) opportunities.

Problem it addresses: Students often search across multiple job websites and track applications using notes or spreadsheets. CareerTrack brings opportunity discovery and application records together to make follow-up and progress tracking easier.

Project status: Academic project under development. Application saving to Neon PostgreSQL has been tested locally. Authentication, remote job search, and production deployment require end-to-end verification.

What's in the repository
Folder	Purpose
[`client/`](client/)	Next.js frontend and user interface
[`server/`](server/)	Node.js and Express REST API
[`docs/`](docs/)	Project proposal, system documentation, and demo script


Features
Application tracking
- Record job applications and their details.
- View saved applications in the tracker.
- Edit and delete applications (implemented or planned; verify in the current build).
- Search or filter tracked applications (verify in the current build).
- Store application data in PostgreSQL rather than only in browser storage.
  
Opportunity discovery
- Intended to find internships, graduate programmes, entry-level roles, and WIL opportunities.
- Backend job-search integration using online listings (Remotive integration has been worked on; confirm current availability and results).
- Keep opportunity discovery separate from applications already submitted.
  
User accounts
- Sign-up and login flows using the backend API.
- JWT-based authentication design.
- Logout flow in the frontend.
Known issue: Local frontend-to-backend requests previously encountered a CORS / “Failed to fetch” problem. Login and signup should be retested after configuration changes.

Technology stack
Layer	Technology
Frontend	Next.js, React, Tailwind CSS, Lucide icons
Backend	Node.js, Express.js
Database	Neon PostgreSQL
Authentication	JSON Web Tokens (JWT)
External opportunities	Online job listings / Remotive API integration
Version control	Git and GitHub
Hosting option	Render for frontend and backend; Neon for the database


System architecture
                  ┌─────────────────────────┐
                  │   CareerTrack frontend  │
                  │      Next.js / React    │
                  └────────────┬────────────┘
                               │ HTTP / JSON
                               ▼
                  ┌─────────────────────────┐
                  │    CareerTrack API      │
                  │    Node.js / Express    │
                  └─────────┬─────────┬─────┘
                            │         │
                            ▼         ▼
                 ┌──────────────┐  ┌──────────────────┐
                 │ Neon         │  │ External job     │
                 │ PostgreSQL   │  │ listing service  │
                 └──────────────┘  └──────────────────┘
The frontend displays opportunities and application records. The Express API handles requests, authentication, database access, and job-search integration. PostgreSQL stores persistent application information.
Prerequisites
- Node.js and npm
- Git
- A Neon PostgreSQL database
- A code editor such as Visual Studio Code
  
Run locally
1. Clone the repository
git clone https://github.com/TUT4IRLAB/CSE-Internship-Job-Application-Tracker3.git
cd CSE-Internship-Job-Application-Tracker3
3. Configure and start the backend
cd server
npm install
Create a server/.env file based on [`server/.env.example`](server/.env.example). Set the database connection string and JWT secret using the variable names expected by server/index.js. Never commit the real .env file.
npm start
The backend has been run locally at http://localhost:4000. Check the health endpoint:
http://localhost:4000/api/health
Expected response in the tested local version:
{"status":"ok","message":"CareerTrack backend is running"}
4. Configure and start the frontend
Open a second terminal from the repository root:
cd client
npm install
npm run dev
The frontend has run locally at http://localhost:3001; Next.js may choose another port if the default is occupied. Open the URL displayed in your terminal.
Configure the frontend's API base URL to point to the backend. If the project uses NEXT_PUBLIC_API_URL, a local value is:
NEXT_PUBLIC_API_URL=http://localhost:4000
The exact variable name should match the frontend source code.
5. Check CORS configuration
The backend must allow the actual frontend origin, for example http://localhost:3001. A mismatch between ports 3000 and 3001 previously caused browser requests to fail. Restart the backend after changing its configuration.
API overview
The Express backend includes routes for the following areas. Consult [`server/index.js`](server/index.js) for exact paths, HTTP methods, request bodies, and authorization requirements in the uploaded version.
Area	Purpose
Health	Check whether the API is running
Authentication	Register and sign in users
Applications	Create, list, update, and delete application records
Jobs	Retrieve job opportunities from an external listing source


Known endpoint: GET /api/health.
For authenticated routes, the frontend is designed to send a JWT in an authorization header when required:
Authorization: Bearer <token>

Database
CareerTrack uses a hosted Neon PostgreSQL database. The backend connects using environment variables; database credentials must never be stored in the repository. See [`server/schema.sql`](server/schema.sql) for the SQL schema supplied with the project.
A local test previously confirmed that an application record could be saved from the interface and found in Neon PostgreSQL.

Project structure

CSE-Internship-Job-Application-Tracker3/
├── client/                     Next.js frontend
│   ├── package.json
│   ├── public/                  Static assets, if present
│   └── src/                     Frontend source, if used
├── server/                     Express backend
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── schema.sql
│   └── .env.example
├── docs/
│   ├── DEMO_SCRIPT.md
│   ├── SYSTEM_DOCUMENTATION.md
│   └── Project_Proposal_Completed.docx
├── .gitignore
└── README.md
The exact frontend subfolders depend on the uploaded project version.

Demonstration walkthrough
1. Start the backend and frontend.
2. Open CareerTrack in the browser.
3. Demonstrate the registration/login interface (after confirming the API connection works).
4. Add a sample application, such as an internship or graduate programme.
5. Show the application in the tracker and confirm it persists after refresh.
6. Demonstrate editing, deleting, and searching applications if these features are working in the current version.
7. Open the opportunity-search feature and show returned job listings if the external API is responding.
8. Explain how the frontend, backend, and Neon database communicate.
For a presentation script, see [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

Deployment
The intended simplified hosting arrangement is:
- Render: Host the frontend and backend as separate services under one platform/account.
- Neon: Continue using the existing managed PostgreSQL database.
Before deploying:
1. Ensure the backend listens on the hosting platform's PORT environment variable.
2. Set the database URL and JWT secret in the host's environment settings.
3. Configure the frontend with the public backend URL.
4. Add the deployed frontend origin to the backend's CORS allowlist.
5. Test registration, login, application CRUD, and job search on the public site.
Deployment is not yet confirmed complete. Do not add a live-site link until the deployed application is working.

Testing checklist
- [x] Frontend opens locally.
- [x] Backend health endpoint responds locally.
- [x] Backend connected to Neon PostgreSQL in local testing.
- [x] A sample application was saved and verified in Neon.
- [ ] Registration and login work end to end without CORS errors.
- [ ] Edit, delete, and search features are verified in the uploaded version.
- [ ] External opportunity search returns live results.
- [ ] Frontend and backend are deployed and connected.
- [ ] Full public-site demonstration passes.
      
Documentation
- [System documentation](docs/SYSTEM_DOCUMENTATION.md)
- [Demonstration script](docs/DEMO_SCRIPT.md)
- [Project proposal](docs/Project_Proposal_Completed.docx
  
Academic purpose
CareerTrack is developed as an educational full-stack software project. It is intended to demonstrate frontend development, REST API design, database integration, user authentication, and job application management.
