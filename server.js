// START OF FILE server.js
import express from 'express';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject
} from './database.js';

const app = express();
const VALID_STATUSES = ['Planned', 'In Progress', 'Completed'];

function readProject(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object.' };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const status = body.status;

  if (!name || name.length > 80) {
    return { error: 'Project name is required and must be 80 characters or fewer.' };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: 'Status must be Planned, In Progress, or Completed.' };
  }

  return { value: { name, status } };
}

app.use(express.static('public'));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/projects', (req, res) => {
  res.json(listProjects());
});

app.post('/api/projects', (req, res) => {
  const checked = readProject(req.body);
  if (checked.error) {
    return res.status(400).json({ error: checked.error });
  }

  const created = createProject(checked.value);
  return res.status(201).json(created);
});

app.put('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const checked = readProject(req.body);
  if (checked.error) {
    return res.status(400).json({ error: checked.error });
  }

  const updated = updateProject(id, checked.value);
  if (!updated) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  return res.json(updated);
});

app.delete('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid project id.' });
  }

  const removed = deleteProject(id);
  if (!removed) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  return res.status(204).end();
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Open http://localhost:${port}`));
// END OF FILE server.js