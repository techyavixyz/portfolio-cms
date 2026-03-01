import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const db = new Database("portfolio.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    title TEXT,
    bio TEXT,
    email TEXT,
    github TEXT,
    linkedin TEXT,
    avatar_url TEXT,
    contact_heading TEXT,
    contact_subheading TEXT,
    footer_copyright TEXT,
    footer_name TEXT,
    show_social_footer INTEGER DEFAULT 1,
    open_to_work INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    link TEXT,
    tags TEXT,
    content TEXT,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    proficiency INTEGER
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    excerpt TEXT,
    image_url TEXT,
    tags TEXT,
    date TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    name TEXT,
    content TEXT,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  );
`);

// Migration: Add contact columns if they don't exist
try {
  db.prepare("ALTER TABLE settings ADD COLUMN contact_heading TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE settings ADD COLUMN contact_subheading TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE settings ADD COLUMN footer_copyright TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE settings ADD COLUMN footer_name TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE settings ADD COLUMN show_social_footer INTEGER DEFAULT 1").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE settings ADD COLUMN open_to_work INTEGER DEFAULT 1").run();
} catch (e) {}

// Seed initial data if empty
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO settings (id, name, title, bio, email, github, linkedin, avatar_url, contact_heading, contact_subheading, footer_copyright, footer_name, show_social_footer, open_to_work)
    VALUES (1, 'John Doe', 'Full Stack Developer', 'I build beautiful and functional web applications.', 'john@example.com', 'https://github.com', 'https://linkedin.com', 'https://picsum.photos/seed/portfolio/200/200', 'Get in touch', 'Let''s build something extraordinary.', 'All rights reserved.', 'Portfolio', 1, 1)
  `).run();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  try {
  db.prepare("ALTER TABLE projects ADD COLUMN content TEXT").run();
} catch (e) {}

// API Routes
  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const filePath = req.file.path;
    const ext = path.extname(req.file.filename);
    const baseName = path.basename(req.file.filename, ext);
    
    // Generate responsive versions
    const sizes = [
      { width: 400, suffix: "-sm" },
      { width: 800, suffix: "-md" },
      { width: 1200, suffix: "-lg" }
    ];
    
    try {
      await Promise.all(sizes.map(size => 
        sharp(filePath)
          .resize(size.width)
          .toFile(path.join(uploadsDir, `${baseName}${size.suffix}${ext}`))
      ));
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Image processing error:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  app.post("/api/upload-base64", async (req, res) => {
    const { base64Data, fileName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "No data provided" });
    }

    try {
      const buffer = Buffer.from(base64Data.split(",")[1], "base64");
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = ".png";
      const baseName = uniqueSuffix;
      const fullFileName = `${baseName}${ext}`;
      const filePath = path.join(uploadsDir, fullFileName);

      fs.writeFileSync(filePath, buffer);

      // Generate responsive versions
      const sizes = [
        { width: 400, suffix: "-sm" },
        { width: 800, suffix: "-md" },
        { width: 1200, suffix: "-lg" }
      ];

      await Promise.all(sizes.map(size => 
        sharp(filePath)
          .resize(size.width)
          .toFile(path.join(uploadsDir, `${baseName}${size.suffix}${ext}`))
      ));

      res.json({ imageUrl: `/uploads/${fullFileName}` });
    } catch (error) {
      console.error("Base64 upload error:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  app.get("/api/portfolio", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    const projects = db.prepare("SELECT * FROM projects ORDER BY display_order ASC").all();
    const skills = db.prepare("SELECT * FROM skills").all();
    const posts = db.prepare("SELECT * FROM posts ORDER BY date DESC").all();
    res.json({ settings, projects, skills, posts });
  });

  app.post("/api/settings", (req, res) => {
    const { name, title, bio, email, github, linkedin, avatar_url, contact_heading, contact_subheading, footer_copyright, footer_name, show_social_footer, open_to_work } = req.body;
    db.prepare(`
      UPDATE settings 
      SET name = ?, title = ?, bio = ?, email = ?, github = ?, linkedin = ?, avatar_url = ?, contact_heading = ?, contact_subheading = ?, footer_copyright = ?, footer_name = ?, show_social_footer = ?, open_to_work = ?
      WHERE id = 1
    `).run(name, title, bio, email, github, linkedin, avatar_url, contact_heading, contact_subheading, footer_copyright, footer_name, show_social_footer, open_to_work);
    res.json({ success: true });
  });

  app.post("/api/projects", (req, res) => {
    const { title, description, image_url, link, tags, content } = req.body;
    db.prepare(`
      INSERT INTO projects (title, description, image_url, link, tags, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, description, image_url, link, tags, content);
    res.json({ success: true });
  });

  app.put("/api/projects/:id", (req, res) => {
    const { title, description, image_url, link, tags, content } = req.body;
    db.prepare(`
      UPDATE projects 
      SET title = ?, description = ?, image_url = ?, link = ?, tags = ?, content = ?
      WHERE id = ?
    `).run(title, description, image_url, link, tags, content, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/projects/:id", (req, res) => {
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/projects/reorder", (req, res) => {
    const { ids } = req.body;
    const update = db.prepare("UPDATE projects SET display_order = ? WHERE id = ?");
    const transaction = db.transaction((ids: number[]) => {
      for (let i = 0; i < ids.length; i++) {
        update.run(i, ids[i]);
      }
    });
    transaction(ids);
    res.json({ success: true });
  });

  app.post("/api/skills", (req, res) => {
    const { name, category, proficiency } = req.body;
    db.prepare(`
      INSERT INTO skills (name, category, proficiency)
      VALUES (?, ?, ?)
    `).run(name, category, proficiency);
    res.json({ success: true });
  });

  app.delete("/api/skills/:id", (req, res) => {
    db.prepare("DELETE FROM skills WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Blog Routes
  app.post("/api/posts", (req, res) => {
    const { title, content, excerpt, image_url, tags, date } = req.body;
    db.prepare(`
      INSERT INTO posts (title, content, excerpt, image_url, tags, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, content, excerpt, image_url, tags, date || new Date().toISOString());
    res.json({ success: true });
  });

  app.put("/api/posts/:id", (req, res) => {
    const { title, content, excerpt, image_url, tags, date } = req.body;
    db.prepare(`
      UPDATE posts 
      SET title = ?, content = ?, excerpt = ?, image_url = ?, tags = ?, date = ?
      WHERE id = ?
    `).run(title, content, excerpt, image_url, tags, date, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/posts/:id", (req, res) => {
    db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Comment Routes
  app.get("/api/posts/:id/comments", (req, res) => {
    const comments = db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY date DESC").all(req.params.id);
    res.json(comments);
  });

  app.post("/api/posts/:id/comments", (req, res) => {
    const { name, content } = req.body;
    db.prepare(`
      INSERT INTO comments (post_id, name, content)
      VALUES (?, ?, ?)
    `).run(req.params.id, name, content);
    res.json({ success: true });
  });

  app.delete("/api/comments/:id", (req, res) => {
    db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
