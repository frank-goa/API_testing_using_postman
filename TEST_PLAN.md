# Test Plan - API Practice Project

## 1. Project Overview
The API Practice Project is an Express.js application designed for learning API testing with Postman. It provides endpoints for authentication (JWT & cookie-based), student CRUD operations, and test endpoints.

## 2. Objectives
- Validate API functionality: authentication, authorization, CRUD, and error handling.
- Ensure endpoints return correct HTTP status codes and response shapes.
- Verify session and token flows (JWT and cookies).
- Provide a reproducible test suite for learning and CI integration.

## 3. Scope
In-scope:
- Functional tests of all endpoints included in the Postman collection.
- Positive and negative test cases (error handling, invalid inputs).
- Cookie and JWT authentication flows.

Out-of-scope:
- Performance/stress testing
- Security penetration testing beyond basic auth checks
- Database migration / schema tests (data is file-backed JSON)

## 4. Test Items (mapped to collection)
- Auth: `/auth/login-jwt`, `/auth/login-cookie`, `/auth/me`, `/auth/me-cookie`, `/auth/logout-cookie`
- Students: `/students` (GET, POST), `/students/:id` (GET, PUT, PATCH, DELETE)
- Test endpoints: `/test/headers`, `/test/set-cookie`, `/test/get-cookies`, `/health`

## 5. Test Types and Approach
- Smoke tests: Quick checks to validate server is up (`GET /health`) and basic auth flows.
- Functional tests: Confirm endpoints behave as expected under normal conditions.
- Negative tests: Provide invalid payloads, missing headers, or invalid IDs to ensure proper error handling.
- Auth flow tests: Validate JWT issuance and usage; cookie issuance, clearing, and protection.

## 6. Test Data
- Demo user (hard-coded): `testuser` / `password123` (role: `student-admin`)
- Initial students are in `data/students.json` (3 sample records).
- Tests that create data should clean up (delete created student) or use unique emails.

## 7. Test Environment
- Local development: `http://localhost:3000`
- Use Postman collection: `API Practice Project (Full with Tests)`
- Environment variables to set in Postman: `base_url` (optional), `jwtToken`, `createdStudentId` (used by flow)

Notes: the repository now includes `QA.postman_environment.json` with `base_url` pre-populated for local runs. The project also includes a `test:newman` npm script which sets `--env-var base_url=http://localhost:3000` for automated runs.

## 8. Test Execution
- Manual: Run requests in Postman in the order:
  1. `Health`  
  2. `Auth - Login JWT` (save token)  
  3. `Students - Create (JWT)` (creates student)  
  4. `Students - Update / Patch / Delete`  
  5. `Auth - Logout Cookie` + cookie-protected tests  
  6. Error cases

- Automated: Use Postman Collection Runner or Newman. Example with newman:

```bash
npm install -g newman
newman run "API_postman_collection.json" -e QA.postman_environment.json

# Or use the provided npm script (recommended):
npm run test:newman
```

## 9. Pass/Fail Criteria
- Pass: Tests assert expected HTTP status codes and response structures.
- Fail: Any test expecting a specific status or JSON property returns a different result or a script error occurs.

## 10. Test Maintenance
- Keep `TEST_PLAN.md` and `Postman` collection in the repo.
- Update test cases when endpoints change or new features are added.
- Document new environment variables or external dependencies.

Repository housekeeping notes:
- A `.gitignore` file was added and `node_modules/` has been removed from Git tracking. Developers should run `npm install` after cloning.
- Generated reports (the `reports/` folder) are intentionally ignored from version control — they are produced locally or uploaded as CI artifacts.

## 11. Responsibilities
- Test author / maintainer: update Postman collection and test plan.
- Developer: fix failing API behavior reported by tests.

## 12. Cleanup and Data Management
- Tests that create resources must delete them (collection includes a DELETE request that unsets `createdStudentId`).
- When running repeated tests, ensure unique emails are used or the JSON file is reset.

## 13. Reporting
- Use Postman or Newman reports for test results (HTML or JSON output) and attach to issue tracker when failures occur.

CI recommendation: Add a GitHub Actions workflow to run `npm ci` and `npm run test:newman` on push/PR and upload the `reports/` folder as build artifacts. This lets you display a build/test badge on the README and preserves historical test runs in CI.

## 14. Notes
- This project is a learning project. Passwords are hard-coded and data is stored in JSON for convenience.
- For CI, replace JSON persistence with a disposable test database or mocking approach.

Recent repository updates (housekeeping):
- Added `README.md` with setup and demo instructions.
- Added `docs/DEMO_INSTRUCTIONS.md` and `scripts/render_demo_with_terminalizer.sh` to help produce a short demo GIF (`docs/demo.gif`).
- Added `.gitignore` and removed `node_modules/` from the repository to keep the repo lightweight.
