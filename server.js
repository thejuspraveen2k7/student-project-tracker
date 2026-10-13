// START OF FILE server.js
import express from 'express';

const app = express();
const VALID_STATUSES = ['Planned', 'In Progress', 'Completed'];

// Server-side in-memory store
const projects = [];
let nextId = 1;

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
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const checked = readProject(req.body);
  if (checked.error) {
    return res.status(400).json({ error: checked.error });
  }

  const created = {
    id: nextId++,
    name: checked.value.name,
    status: checked.value.status
  };
  projects.push(created);
  return res.status(201).json(created);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Open http://localhost:3000`));
// END OF FILE server.js