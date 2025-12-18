// Store projects in browser's local storage
let projects = JSON.parse(localStorage.getItem('myhost_projects')) || [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const fileListDiv = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const linksContainer = document.getElementById('linksContainer');
const adminAccessBtn = document.getElementById('adminAccessBtn');
const passwordModal = document.getElementById('passwordModal');
const adminPasswordInput = document.getElementById('adminPassword');
const submitPasswordBtn = document.getElementById('submitPassword');
const adminPanel = document.getElementById('adminPanel');
const projectCountSpan = document.getElementById('projectCount');
const totalFilesSpan = document.getElementById('totalFiles');
const clearAllBtn = document.getElementById('clearAllBtn');

// Display selected files
fileInput.addEventListener('change', function(e) {
    fileListDiv.innerHTML = '';
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    files.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <span>${index + 1}. ${file.name}</span>
            <span>${(file.size / 1024).toFixed(2)} KB</span>
        `;
        fileListDiv.appendChild(div);
    });
});

// Generate hosted links
uploadBtn.addEventListener('click', function() {
    const files = Array.from(fileInput.files);
    if (files.length === 0) {
        alert('Please select files first!');
        return;
    }

    const projectName = `project-${Date.now().toString(36)}`;
    
    // Create object URLs for all files[citation:7]
    const fileObjects = files.map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size
    }));

    // Save project
    const project = {
        id: projectName,
        name: projectName,
        files: fileObjects,
        createdAt: new Date().toISOString(),
        indexFile: fileObjects.find(f => f.name.toLowerCase() === 'index.html')?.name || null
    };

    projects.push(project);
    localStorage.setItem('myhost_projects', JSON.stringify(projects));
    
    // Display the link
    displayProjectLink(project);
    updateAdminStats();
    
    // Clear file input
    fileInput.value = '';
    fileListDiv.innerHTML = '<p class="empty-state">Files uploaded successfully!</p>';
});

// Display a project link card
function displayProjectLink(project) {
    const mainFile = project.indexFile || project.files[0].name;
    const projectUrl = `${window.location.origin}/${project.id}/${mainFile}`;
    const localViewUrl = `/${project.id}/${mainFile}`;
    
    const linkCard = document.createElement('div');
    linkCard.className = 'link-card';
    linkCard.innerHTML = `
        <div class="project-name">
            <i class="fas fa-folder"></i> ${project.name}
            <span style="float:right; font-size:0.8rem; opacity:0.7;">
                ${project.files.length} files
            </span>
        </div>
        <div class="project-url">
            <strong>Hosted URL:</strong><br>
            <a href="${localViewUrl}" target="_blank">${localViewUrl}</a>
        </div>
        <div>
            <button class="copy-btn" onclick="copyToClipboard('${localViewUrl}')">
                <i class="far fa-copy"></i> Copy Link
            </button>
            <button class="copy-btn" onclick="window.open('${localViewUrl}', '_blank')">
                <i class="fas fa-external-link-alt"></i> Open
            </button>
            <button class="copy-btn" style="background:#f72585;" 
                    onclick="deleteProject('${project.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
        <div style="margin-top:10px; font-size:0.9rem; opacity:0.8;">
            <strong>Files:</strong> ${project.files.map(f => f.name).join(', ')}
        </div>
    `;
    
    // Remove the empty state message if it exists
    const emptyState = linksContainer.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
    
    linksContainer.prepend(linkCard);
}

// Display all existing projects on page load
function loadProjects() {
    linksContainer.innerHTML = '';
    if (projects.length === 0) {
        linksContainer.innerHTML = '<p class="empty-state">No projects hosted yet. Upload files to generate links.</p>';
        return;
    }
    
    projects.forEach(project => displayProjectLink(project));
}

// Copy to clipboard function
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Link copied to clipboard!');
    });
};

// Delete a project
window.deleteProject = function(projectId) {
    if (!confirm('Delete this project?')) return;
    
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem('myhost_projects', JSON.stringify(projects));
    
    // Revoke object URLs to free memory
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.files.forEach(file => {
            URL.revokeObjectURL(file.url);
        });
    }
    
    loadProjects();
    updateAdminStats();
};

// Admin password protection
adminAccessBtn.addEventListener('click', () => {
    passwordModal.style.display = 'flex';
});

submitPasswordBtn.addEventListener('click', () => {
    const password = adminPasswordInput.value;
    const passwordError = document.getElementById('passwordError');
    
    if (password === 'KAMIXHACKER') {
        passwordModal.style.display = 'none';
        adminPanel.style.display = 'block';
        adminPasswordInput.value = '';
        passwordError.textContent = '';
        updateAdminStats();
    } else {
        passwordError.textContent = 'Incorrect password!';
    }
});

// Close modal on outside click
passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
        adminPasswordInput.value = '';
        document.getElementById('passwordError').textContent = '';
    }
});

// Update admin statistics
function updateAdminStats() {
    projectCountSpan.textContent = projects.length;
    const totalFiles = projects.reduce((sum, project) => sum + project.files.length, 0);
    totalFilesSpan.textContent = totalFiles;
}

// Clear all projects
clearAllBtn.addEventListener('click', () => {
    if (!confirm('Delete ALL projects? This cannot be undone.')) return;
    
    // Revoke all object URLs
    projects.forEach(project => {
        project.files.forEach(file => {
            URL.revokeObjectURL(file.url);
        });
    });
    
    projects = [];
    localStorage.removeItem('myhost_projects');
    loadProjects();
    updateAdminStats();
    adminPanel.style.display = 'none';
    alert('All projects deleted!');
});

// Simulate serving files via URL patterns
// Note: This requires a simple server or specific hosting setup for actual file serving
// For local testing, this creates blob URLs that work within the session

// Initialize
loadProjects();
updateAdminStats();
