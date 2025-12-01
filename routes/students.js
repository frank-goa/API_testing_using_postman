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
