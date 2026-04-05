const path = require("path");
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DB_PATH = path.join(__dirname, "inquiries.db");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "amar";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "EverestAdmin!2026";

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.all("PRAGMA table_info(inquiries)", (error, columns) => {
    if (error) {
      console.error("Failed to inspect inquiries table:", error.message);
      return;
    }

    const hasPhoneColumn = columns.some((column) => column.name === "phone");

    if (!hasPhoneColumn) {
      db.run(
        "ALTER TABLE inquiries ADD COLUMN phone TEXT NOT NULL DEFAULT ''",
        (alterError) => {
          if (alterError) {
            console.error("Failed to add phone column:", alterError.message);
          }
        }
      );
    }
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "everest-studio-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 4
    }
  })
);

function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireLogin(req, res, next) {
  if (!req.session.loggedIn) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  return next();
}

function requireLoginPage(req, res, next) {
  if (!req.session.loggedIn) {
    return res.redirect("/login.html");
  }

  return next();
}

app.get("/admin", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/admin/dashboard");
  }

  return res.redirect("/login.html");
});

app.get("/login", (_req, res) => {
  return res.redirect("/login.html");
});

app.get("/admin/dashboard", requireLoginPage, (_req, res) => {
  return res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.get("/admin.html", requireLoginPage, (_req, res) => {
  return res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use(express.static(PUBLIC_DIR));

app.post("/submit-inquiry", (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!isNonEmpty(name) || !isNonEmpty(phone) || !isNonEmpty(email) || !isNonEmpty(message)) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  db.run(
    "INSERT INTO inquiries (name, phone, email, message) VALUES (?, ?, ?, ?)",
    [name.trim(), phone.trim(), email.trim(), message.trim()],
    (error) => {
      if (error) {
        return res.status(500).json({ success: false, error: "Failed to save inquiry." });
      }

      return res.json({ success: true });
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, error: "Invalid credentials." });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.get("/admin/inquiries", requireLogin, (_req, res) => {
  db.all(
    "SELECT id, name, phone, email, message, created_at FROM inquiries ORDER BY created_at DESC, id DESC",
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({ success: false, error: "Failed to load inquiries." });
      }

      return res.json({ success: true, inquiries: rows });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
