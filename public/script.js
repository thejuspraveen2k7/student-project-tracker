// START OF FILE public/script.js
const VALID_STATUSES = ['Planned', 'In Progress', 'Completed'];

const projectForm = document.getElementById('project-form');
const formTitle = document.getElementById('form-title');
const nameInput = document.getElementById('name');
const statusSelect = document.getElementById('status');
const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const messageEl = document.getElementById('message');
const emptyStateEl = document.getElementById('empty-state');
const projectListEl = document.getElementById('project-list');

let projects = [];
let editingId = null;
let isProcessing = false;

function showMessage(text) {
  messageEl.textContent = text;
}

function setProcessing(processing, messageText = '') {
  isProcessing = processing;
  nameInput.disabled = processing;
  statusSelect.disabled = processing;
  saveButton.disabled = processing;
  cancelButton.disabled = processing;
  
  const listButtons = projectListEl.querySelectorAll('button');
  listButtons.forEach(btn => btn.disabled = processing);

  if (messageText) {
    showMessage(messageText);
  }
}

async function loadProjects(successMessage = '') {
  setProcessing(true, successMessage ? successMessage : 'Loading projects...');
  
  try {
    const response = await fetch('/api/projects');
    
    if (!response.ok) {
      let errorMsg = 'Failed to load projects.';
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {}
      
      setProcessing(false, `API Error: ${errorMsg}`);
      emptyStateEl.hidden = true;
      projectListEl.textContent = '';
      return;
    }

    projects = await response.json();
    renderProjects();
    setProcessing(false, successMessage || 'Projects loaded.');
  } catch (error) {
    setProcessing(false, 'Network error: Could not connect to the server to load projects.');
    emptyStateEl.hidden = true;
    projectListEl.textContent = '';
  }
}

function resetFormToAddMode() {
  editingId = null;
  projectForm.reset();
  statusSelect.value = 'Planned';
  formTitle.textContent = 'Add Project';
  saveButton.textContent = 'Add project';
  cancelButton.hidden = true;
}

function startEdit(id) {
  if (isProcessing) return;
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  editingId = project.id;
  nameInput.value = project.name;
  statusSelect.value = project.status;
  formTitle.textContent = 'Edit Project';
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  showMessage(`Editing "${project.name}".`);
  nameInput.focus();
}

async function deleteProject(id) {
  if (isProcessing) return;
  const project = projects.find((item) => item.id === id);
  if (!project) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${project.name}" (${project.status})?`
  );

  if (!confirmed) {
    showMessage(`Deletion of "${project.name}" cancelled.`);
    return;
  }

  setProcessing(true, 'Deleting project...');

  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      let errorMsg = 'Failed to delete project.';
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {}
      setProcessing(false, `API Error: ${errorMsg}`);
      return;
    }

    if (editingId === id) {
      resetFormToAddMode();
    }

    await loadProjects(`Deleted "${project.name}".`);
  } catch (error) {
    setProcessing(false, 'Network error: Could not connect to the server to delete.');
  }
}

function renderProjects() {
  projectListEl.textContent = '';

  if (projects.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }

  emptyStateEl.hidden = true;

  projects.forEach((project) => {
    const li = document.createElement('li');
    li.dataset.id = String(project.id);
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.gap = '0.75rem';
    li.style.padding = '0.75rem 0';
    li.style.borderBottom = '1px solid #e2e8f0';

    const infoSpan = document.createElement('span');
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = project.name;

    const statusText = document.createElement('span');
    statusText.textContent = ` — ${project.status}`;

    infoSpan.appendChild(nameStrong);
    infoSpan.appendChild(statusText);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '0.5rem';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      startEdit(project.id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteProject(project.id);
    });

    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(deleteButton);

    li.appendChild(infoSpan);
    li.appendChild(actionsDiv);
    projectListEl.appendChild(li);
  });
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isProcessing) return;

  const trimmedName = nameInput.value.trim();
  const selectedStatus = statusSelect.value;

  if (!trimmedName) {
    showMessage('Please enter a non-empty project name.');
    nameInput.focus();
    return;
  }

  if (trimmedName.length > 80) {
    showMessage('Project name must be 80 characters or fewer.');
    nameInput.focus();
    return;
  }

  setProcessing(true, 'Saving project...');

  const payload = {
    name: trimmedName,
    status: selectedStatus
  };

  try {
    let response;
    if (editingId === null) {
      response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`/api/projects/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      let errorMsg = 'Failed to save project.';
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {}
      
      setProcessing(false, `API Error: ${errorMsg}`);
      return; 
    }

    const successMsg = editingId === null ? `Added "${trimmedName}".` : `Updated "${trimmedName}".`;
    resetFormToAddMode();
    await loadProjects(successMsg);

  } catch (error) {
    setProcessing(false, 'Network error: Could not connect to the server to save.');
  }
});

cancelButton.addEventListener('click', () => {
  if (isProcessing) return;
  resetFormToAddMode();
  showMessage('Edit cancelled.');
});

// Initial API load
loadProjects();
// END OF FILE public/script.js