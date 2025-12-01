# API Practice Project Setup Guide

## Overview

This is an **Express.js API practice project** designed for learning API testing with Postman. It includes authentication (JWT & Cookie-based), CRUD operations for students, and various test endpoints to practice API concepts.

### Key Features
- ✅ Express.js server with middleware setup
- 🔐 JWT (JSON Web Token) authentication
- 🍪 Cookie-based session authentication
- 📚 CRUD operations for student management
- 🧪 Test endpoints for learning headers, cookies, and requests
- 📄 JSON-based data persistence
- ⚡ Development mode with nodemon support

---

## Project Structure

```
API/
├── package.json              # Project dependencies and scripts
├── server.js                 # Main Express server
├── routes/
│   └── students.js          # Student CRUD routes
├── data/
│   └── students.json        # Student data storage
├── postman_collection.json  # Postman collection for testing
└── postman_collection2.json # Additional Postman collection
```

---

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Postman (for testing the API)

### Step 1: Install Dependencies

```bash
cd /Users/frank/Documents/Postman_Project/API
npm install
```

This installs all required packages:
- `express` - Web framework
- `cookie-parser` - Parse cookies
- `cors` - Cross-Origin Resource Sharing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `nodemon` (dev) - Auto-reload during development

### Step 2: Environment Setup (Optional)

Create a `.env` file in the root directory to customize settings:

```env
PORT=3000
JWT_SECRET=your-super-secret-key-here
```

**Note:** Defaults are already configured, so this step is optional.

### Step 3: Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

Expected output:
```
API Practice Server running on http://localhost:3000
Try GET /health
```

---

## File Documentation

### 1. `package.json`

The project manifest file that defines dependencies and scripts.

```json
{
  "name": "api-practice-project",
  "version": "1.0.0",
  "description": "API testing practice project with Express, cookies, JWT, and CRUD for Postman learners.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [
    "express",
    "api",
    "postman",
    "jwt",
    "cookies",
    "students",
    "practice"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

### 2. `server.js`

Main Express server file that sets up middleware, authentication, and routes.

```javascript
// server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");

const studentsRouter = require("./routes/students");

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(cookieParser());

// CORS: allow requests from Postman / browser; you can restrict origins if needed
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true, // allow cookies
  })
);

// Simple request logger for learning
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ====== UTILITY: AUTH MIDDLEWARE ======
function requireJwt(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      error: "Missing Authorization header",
      hint: "Send: Authorization: Bearer <token>",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Invalid Authorization header format",
      example: "Authorization: Bearer <token>",
    });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: "Invalid or expired token",
        details: err.message,
      });
    }

    // Attach decoded payload to request
    req.user = decoded;
    next();
  });
}

function requireCookieLogin(req, res, next) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({
      error: "Missing sessionId cookie. Please login via /auth/login-cookie.",
    });
  }

  // This is a demo: we just check that sessionId equals a fake value.
  if (sessionId !== "dummy-session-id") {
    return res.status(401).json({
      error: "Invalid session cookie. Please login again.",
    });
  }

  // Attach a fake user
  req.user = { username: "cookieUser", role: "cookie-tester" };
  next();
}

// ====== BASIC ROUTES FOR TESTING ======

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Echo headers (for Postman header practice)
app.get("/test/headers", (req, res) => {
  res.status(200).json({
    message: "Here are your request headers",
    headers: req.headers,
  });
});

// Set a demo cookie
app.get("/test/set-cookie", (req, res) => {
  res
    .cookie("demoCookie", "hello-from-server", {
      httpOnly: true,
      sameSite: "Lax",
    })
    .status(200)
    .json({
      message: "demoCookie set. Check 'Cookies' in Postman.",
    });
});

// Read cookies
app.get("/test/get-cookies", (req, res) => {
  res.status(200).json({
    cookies: req.cookies,
  });
});

// ====== AUTH ROUTES (JWT & COOKIE) ======

// Simple hard-coded user
const DEMO_USER = {
  username: "testuser",
  password: "password123",
  role: "student-admin",
};

// Login and receive JWT
app.post("/auth/login-jwt", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: "username and password are required",
      exampleBody: {
        username: "testuser",
        password: "password123",
      },
    });
  }

  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    return res.status(401).json({
      error: "Invalid credentials",
      hint: "Try username: testuser, password: password123",
    });
  }

  // payload kept small on purpose
  const token = jwt.sign(
    { username: DEMO_USER.username, role: DEMO_USER.role },
    JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.status(200).json({
    message: "Login successful. Use this token in Authorization header.",
    token,
    howToUse:
      "Add header: Authorization: Bearer <token> to protected routes such as /students/protected",
  });
});

// Protected route to test JWT
app.get("/auth/me", requireJwt, (req, res) => {
  res.status(200).json({
    message: "You are authenticated with JWT!",
    user: req.user,
  });
});

// Login and receive cookie
app.post("/auth/login-cookie", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      error: "username and password are required",
    });
  }

  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    return res.status(401).json({
      error: "Invalid credentials",
      hint: "Try username: testuser, password: password123",
    });
  }

  // In a real app you'd store a real session id in a DB/redis.
  const sessionId = "dummy-session-id";

  res
    .cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "Lax",
    })
    .status(200)
    .json({
      message:
        "Cookie login successful. 'sessionId' cookie set. Use it for cookie-protected routes.",
      note: "Check 'Cookies' tab in Postman.",
    });
});

// Protected route using cookie
app.get("/auth/me-cookie", requireCookieLogin, (req, res) => {
  res.status(200).json({
    message: "You are authenticated with a cookie!",
    user: req.user,
  });
});

// Logout cookie session
app.post("/auth/logout-cookie", (req, res) => {
  res
    .clearCookie("sessionId")
    .status(200)
    .json({ message: "Logged out cookie session." });
});

// ====== STUDENTS ROUTES (CRUD) ======
app.use("/students", studentsRouter(requireJwt, requireCookieLogin));

// ====== 404 HANDLER ======
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    pathTried: req.originalUrl,
    method: req.method,
  });
});

// ====== GENERIC ERROR HANDLER ======
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong.",
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`API Practice Server running on http://localhost:${PORT}`);
  console.log("Try GET /health");
});
```

**Key Concepts:**
- **Middleware:** JSON parsing, cookie parsing, CORS, and request logging
- **Authentication:** Two middleware functions for JWT and cookie-based auth
- **Routes:** Health check, test endpoints, auth endpoints, and student CRUD routes
- **Error Handling:** 404 handler and generic error handler

### 3. `routes/students.js`

Express Router file that handles all student CRUD operations with authentication.

```javascript
// routes/students.js
const express = require("express");
const fs = require("fs");
const path = require("path");

// Simple in-memory "database" loaded from JSON
let students = [];
const dataFilePath = path.join(__dirname, "..", "data", "students.json");

// Load data on startup
function loadStudents() {
  try {
    const raw = fs.readFileSync(dataFilePath, "utf-8");
    students = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load students.json:", err);
    students = [];
  }
}

// Save data back to file (for practice; not for production)
function saveStudents() {
  fs.writeFileSync(dataFilePath, JSON.stringify(students, null, 2));
}

loadStudents();

module.exports = function (requireJwt, requireCookieLogin) {
  const router = express.Router();

  // ====== PUBLIC ROUTES (no auth) ======

  // GET all students
  router.get("/", (req, res) => {
    res.status(200).json({
      count: students.length,
      data: students
    });
  });

  // GET a single student by ID
  router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID. Must be a number."
      });
    }

    const student = students.find((s) => s.id === id);
    if (!student) {
      return res.status(404).json({
        error: `Student with id ${id} not found`
      });
    }

    res.status(200).json(student);
  });

  // ====== PROTECTED ROUTES (JWT) ======

  // Create new student (JWT required)
  router.post("/", requireJwt, (req, res) => {
    const { name, age, email, isActive } = req.body || {};

    const errors = [];

    if (!name || typeof name !== "string") {
      errors.push("name is required and must be a string");
    }
    if (age === undefined || typeof age !== "number" || age <= 0) {
      errors.push("age is required and must be a positive number");
    }
    if (!email || typeof email !== "string") {
      errors.push("email is required and must be a string");
    }
    if (typeof isActive !== "boolean") {
      errors.push("isActive is required and must be a boolean");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors
      });
    }

    // Check for duplicate email
    const existing = students.find(
      (s) => s.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({
        error: "A student with this email already exists",
        student: existing
      });
    }

    const maxId = students.reduce((max, s) => (s.id > max ? s.id : max), 0);
    const newStudent = {
      id: maxId + 1,
      name,
      age,
      email,
      isActive
    };

    students.push(newStudent);
    saveStudents();

    res.status(201).json({
      message: "Student created",
      student: newStudent
    });
  });

  // Update student entirely (PUT, JWT required)
  router.put("/:id", requireJwt, (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID. Must be a number."
      });
    }

    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({
        error: `Student with id ${id} not found`
      });
    }

    const { name, age, email, isActive } = req.body || {};
    const errors = [];

    if (!name || typeof name !== "string") {
      errors.push("name is required and must be a string");
    }
    if (age === undefined || typeof age !== "number" || age <= 0) {
      errors.push("age is required and must be a positive number");
    }
    if (!email || typeof email !== "string") {
      errors.push("email is required and must be a string");
    }
    if (typeof isActive !== "boolean") {
      errors.push("isActive is required and must be a boolean");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors
      });
    }

    // Check for duplicate email (excluding current student)
    const existing = students.find(
      (s) =>
        s.email.toLowerCase() === email.toLowerCase() && s.id !== id
    );
    if (existing) {
      return res.status(409).json({
        error: "Another student with this email already exists",
        student: existing
      });
    }

    const updatedStudent = {
      id,
      name,
      age,
      email,
      isActive
    };

    students[index] = updatedStudent;
    saveStudents();

    res.status(200).json({
      message: "Student updated",
      student: updatedStudent
    });
  });

  // Partially update (PATCH) - JWT required
  router.patch("/:id", requireJwt, (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID. Must be a number."
      });
    }

    const student = students.find((s) => s.id === id);
    if (!student) {
      return res.status(404).json({
        error: `Student with id ${id} not found`
      });
    }

    const { name, age, email, isActive } = req.body || {};

    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          error: "Invalid 'name'. Must be a string."
        });
      }
      student.name = name;
    }

    if (age !== undefined) {
      if (typeof age !== "number" || age <= 0) {
        return res.status(400).json({
          error: "Invalid 'age'. Must be a positive number."
        });
      }
      student.age = age;
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          error: "Invalid 'email'. Must be a string."
        });
      }
      // Duplicate email check
      const existing = students.find(
        (s) =>
          s.email.toLowerCase() === email.toLowerCase() &&
          s.id !== id
      );
      if (existing) {
        return res.status(409).json({
          error: "Another student with this email already exists",
          student: existing
        });
      }
      student.email = email;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          error: "Invalid 'isActive'. Must be a boolean."
        });
      }
      student.isActive = isActive;
    }

    saveStudents();

    res.status(200).json({
      message: "Student partially updated",
      student
    });
  });

  // Delete student (JWT required)
  router.delete("/:id", requireJwt, (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({
        error: "Invalid ID. Must be a number."
      });
    }

    const index = students.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({
        error: `Student with id ${id} not found`
      });
    }

    const deleted = students.splice(index, 1)[0];
    saveStudents();

    res.status(200).json({
      message: "Student deleted",
      student: deleted
    });
  });

  // ====== COOKIE-PROTECTED TEST ROUTE ======

  // Example: only accessible with cookie auth
  router.get("/protected/cookie-only", requireCookieLogin, (req, res) => {
    res.status(200).json({
      message: "This students route is protected by cookie-based auth.",
      user: req.user
    });
  });

  // ====== JWT-PROTECTED TEST ROUTE ======
  router.get("/protected/jwt-only", requireJwt, (req, res) => {
    res.status(200).json({
      message: "This students route is protected by JWT.",
      user: req.user
    });
  });

  return router;
};
```

**Key Concepts:**
- **Data Loading:** Students loaded from JSON file on startup
- **Public Routes:** GET all students, GET single student by ID
- **Protected Routes:** POST (create), PUT (update), PATCH (partial update), DELETE
- **Validation:** Input validation and duplicate email checking
- **Persistence:** `saveStudents()` writes changes back to JSON file

### 4. `data/students.json`

JSON file that stores the student data. Acts as the database for this learning project.

```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "age": 20,
    "email": "alice@example.com",
    "isActive": true
  },
  {
    "id": 2,
    "name": "Bob Smith",
    "age": 22,
    "email": "bob@example.com",
    "isActive": true
  },
  {
    "id": 3,
    "name": "Charlie Brown",
    "age": 19,
    "email": "charlie@example.com",
    "isActive": false
  }
]
```

**Data Structure:**
- `id` (number) - Unique student identifier
- `name` (string) - Student's full name
- `age` (number) - Student's age
- `email` (string) - Student's email address
- `isActive` (boolean) - Whether the student is active

---

## API Endpoints Reference

### Health Check
```
GET /health
Status: 200 OK
Response: { status: "ok", timestamp: "2025-11-29T..." }
```

### Test Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/test/headers` | Echo request headers |
| GET | `/test/set-cookie` | Set a demo cookie |
| GET | `/test/get-cookies` | Read cookies from request |

### Authentication Routes

#### JWT Authentication
```
POST /auth/login-jwt
Body: { "username": "testuser", "password": "password123" }
Response: { "message": "...", "token": "<JWT_TOKEN>", "howToUse": "..." }
```

#### JWT Protected Route
```
GET /auth/me
Headers: Authorization: Bearer <JWT_TOKEN>
Response: { "message": "...", "user": { "username": "...", "role": "..." } }
```

#### Cookie Authentication
```
POST /auth/login-cookie
Body: { "username": "testuser", "password": "password123" }
Response: Sets 'sessionId' cookie
```

#### Cookie Protected Route
```
GET /auth/me-cookie
Requires: sessionId cookie
Response: { "message": "...", "user": { "username": "...", "role": "..." } }
```

#### Logout
```
POST /auth/logout-cookie
Response: { "message": "Logged out cookie session." }
```

### Student CRUD Routes

#### Get All Students (Public)
```
GET /students
Response: 200 OK
{
  "count": 3,
  "data": [{ "id": 1, "name": "Alice Johnson", ... }, ...]
}
```

#### Get Single Student (Public)
```
GET /students/:id
Response: 200 OK
{ "id": 1, "name": "Alice Johnson", "age": 20, "email": "alice@example.com", "isActive": true }
```

#### Create Student (JWT Required)
```
POST /students
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "name": "David Lee",
  "age": 21,
  "email": "david@example.com",
  "isActive": true
}
Response: 201 Created
{ "message": "Student created", "student": { "id": 4, ... } }
```

#### Update Student (PUT - JWT Required)
```
PUT /students/:id
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "name": "David Lee",
  "age": 22,
  "email": "david.lee@example.com",
  "isActive": true
}
Response: 200 OK
{ "message": "Student updated", "student": { ... } }
```

#### Partial Update Student (PATCH - JWT Required)
```
PATCH /students/:id
Headers: Authorization: Bearer <JWT_TOKEN>
Body: { "age": 23 }
Response: 200 OK
{ "message": "Student partially updated", "student": { ... } }
```

#### Delete Student (JWT Required)
```
DELETE /students/:id
Headers: Authorization: Bearer <JWT_TOKEN>
Response: 200 OK
{ "message": "Student deleted", "student": { ... } }
```

#### Protected Route - JWT Only
```
GET /students/protected/jwt-only
Headers: Authorization: Bearer <JWT_TOKEN>
Response: 200 OK
{ "message": "This students route is protected by JWT.", "user": { ... } }
```

#### Protected Route - Cookie Only
```
GET /students/protected/cookie-only
Requires: sessionId cookie
Response: 200 OK
{ "message": "This students route is protected by cookie-based auth.", "user": { ... } }
```

---

## Testing with Postman

### Quick Start

1. **Open Postman** and import one of the included collections:
   - `postman_collection.json`
   - `postman_collection2.json`

2. **Test Health Check:**
   - Create new request: `GET http://localhost:3000/health`

3. **Get JWT Token:**
   - Create new request: `POST http://localhost:3000/auth/login-jwt`
   - Set Body (raw JSON):
     ```json
     {
       "username": "testuser",
       "password": "password123"
     }
     ```
   - Copy the `token` from response

4. **Use JWT for Protected Routes:**
   - Create new request: `GET http://localhost:3000/auth/me`
   - Set Header: `Authorization: Bearer <paste-token-here>`

5. **Create a Student:**
   - Create new request: `POST http://localhost:3000/students`
   - Set Header: `Authorization: Bearer <token>`
   - Set Body (raw JSON):
     ```json
     {
       "name": "Eva Chen",
       "age": 21,
       "email": "eva@example.com",
       "isActive": true
     }
     ```

### Demo Credentials
- **Username:** `testuser`
- **Password:** `password123`
- **Role:** `student-admin`

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Port 3000 already in use` | Another app using port 3000 | Change PORT in `.env` or kill the process |
| `Missing Authorization header` | No auth header in request | Add `Authorization: Bearer <token>` header |
| `Invalid or expired token` | Token is invalid or expired | Get a new token from `/auth/login-jwt` |
| `Duplicate email` | Email already exists | Use a unique email address |
| `Student not found` | Invalid student ID | Verify the ID with `GET /students` |

---

## Development Tips

### Enable Custom Port
Create a `.env` file:
```env
PORT=3001
JWT_SECRET=my-custom-secret
```

### Run with Nodemon (Auto-Reload)
```bash
npm run dev
```

### Run Tests
Use the included Postman collections to test all endpoints.

### Modify Student Data
Edit `data/students.json` directly, then restart the server to reload.

### Add New Routes
Edit `routes/students.js` to add new endpoints following the existing patterns.

---

## Best Practices Demonstrated

✅ **Middleware:** CORS, cookie parsing, request logging  
✅ **Authentication:** JWT tokens with expiration, cookie-based sessions  
✅ **Validation:** Input validation with detailed error messages  
✅ **RESTful Design:** Proper HTTP methods and status codes  
✅ **Error Handling:** Global error handler and 404 responses  
✅ **Data Persistence:** JSON file-based storage  
✅ **Security:** HttpOnly cookies, CORS configuration  

---

## Notes

- This is a **learning project**, not production-ready
- Passwords are hard-coded for educational purposes
- Data is stored in JSON (not a real database)
- Consider these patterns when building real APIs:
  - Use a database (MongoDB, PostgreSQL, etc.)
  - Implement proper authentication (OAuth, bcrypt passwords)
  - Add rate limiting and request validation
  - Use environment variables for secrets
  - Implement comprehensive logging

---

## License

MIT License - Free to use and modify for learning purposes.

## Stopping the Server
control + C
