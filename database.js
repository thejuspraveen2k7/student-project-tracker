// START OF FILE database.js
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const dataDir = path.resolve('data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'projects.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT NOT NULL
  )
`);

export function listProjects() {
  return db.prepare('SELECT id, name, status FROM projects ORDER BY id ASC').all();
}

export function createProject({ name, status }) {
  const result = db
    .prepare('INSERT INTO projects (name, status) VALUES (?, ?)')
    .run(name, status);

  return {
    id: Number(result.lastInsertRowid),
    name,
    status
  };
}

export function updateProject(id, { name, status }) {
  const result = db
    .prepare('UPDATE projects SET name = ?, status = ? WHERE id = ?')
    .run(name, status, id);

  if (result.changes === 0) {
    return null;
  }

  return { id: Number(id), name, status };
}

export function deleteProject(id) {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}
// END OF FILE database.js