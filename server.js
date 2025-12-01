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
