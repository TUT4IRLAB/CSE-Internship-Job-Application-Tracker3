# System Documentation
## Problem
Students apply to many roles but can lose track of employers, dates and application status.
## Objectives
Store applications, update statuses, filter records, view counts and discover remote jobs from a public feed.
## Architecture
Browser -> Next.js (Vercel) -> Express REST API (Render) -> Neon PostgreSQL. Job searches flow from Express to the Remotive public API.
## Data Model
`applications`: id (PK), company, role, applied_on, status (applied/interview/offer/rejected), url, notes, created_at.
## Core Workflow
Create application -> save to PostgreSQL -> display in tracker -> update status -> see dashboard count -> optionally delete.
## API
GET /api/applications returns all rows. POST creates. PUT /api/applications/:id updates. DELETE removes. GET /api/jobs?search=term returns external jobs. GET /api/health checks the API.
## Testing Checklist
- Create valid application and verify it appears
- Edit status and verify dashboard counts
- Filter each status
- Delete and verify removal
- Search jobs and open provider link
- Verify invalid empty company is rejected
- Verify database/API unavailable shows an error
- Verify mobile screen layout
## Security / limitations
Single-user demonstration only. No authentication or authorisation; never expose sensitive data. Use parameterised SQL and private environment variables. Add authentication, access controls, rate limits, monitoring and stronger validation before public production use.
