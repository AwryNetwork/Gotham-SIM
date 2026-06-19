import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(__dirname, "..", "gotham.sqlite"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    clearance INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed',
    created_by TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS imported_objects (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL
  );
`);

const ROLES = [
  { username: "admin", password: "admin123", role: "Admin", clearance: 3 },
  { username: "analyst", password: "analyst123", role: "Analyst", clearance: 2 },
  { username: "viewer", password: "viewer123", role: "Viewer", clearance: 1 },
];

const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (userCount === 0) {
  const insert = db.prepare(
    "INSERT INTO users (username, password_hash, role, clearance) VALUES (?, ?, ?, ?)",
  );
  for (const u of ROLES) {
    insert.run(u.username, bcrypt.hashSync(u.password, 10), u.role, u.clearance);
  }
  console.log("[db] seeded demo users: admin/admin123, analyst/analyst123, viewer/viewer123");
}

export function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function insertTask(task) {
  db.prepare(
    "INSERT INTO tasks (id, type, payload, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(task.id, task.type, JSON.stringify(task.payload), task.status, task.createdBy, task.createdAt);
}

export function listTasks() {
  return db
    .prepare("SELECT * FROM tasks ORDER BY created_at DESC")
    .all()
    .map((row) => ({ ...row, payload: JSON.parse(row.payload) }));
}

export function updateTaskStatus(id, status) {
  db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
}

export function upsertImportedObjects(entities, createdBy) {
  const stmt = db.prepare(
    "INSERT INTO imported_objects (id, entity, created_by, created_at) VALUES (?, ?, ?, ?) " +
      "ON CONFLICT(id) DO UPDATE SET entity = excluded.entity",
  );
  const now = new Date().toISOString();
  const tx = db.transaction((rows) => {
    for (const entity of rows) {
      stmt.run(entity.id, JSON.stringify(entity), createdBy, now);
    }
  });
  tx(entities);
}

export function listImportedObjects() {
  return db
    .prepare("SELECT entity FROM imported_objects ORDER BY created_at DESC")
    .all()
    .map((row) => JSON.parse(row.entity));
}
