// 🚀 FreeHost Pro - 6-in-1 Hosting Platform
// 🔐 ADMIN PASSWORD: "kamix123" (Change if you want)

const CONFIG = {
    ADMIN_PASSWORD: "kamix123",
    VERSION: "3.0",
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
};

// State Management
let currentType = null;
let uploadedFiles = [];
let projects = JSON.parse(localStorage.getItem('freeHostProjects')) || [];
let currentDeleteId = null;
let originalImage = null;
let processedImage = null;
let isProcessing = false;

// File Type Configuration
const FILE_TYPES = {
    media: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi', '.webm'],
        title: "Photo & Video Hosting",
        desc: "Upload images and videos, get direct download links",
        uploadTitle: "DROP PHOTOS & VIDEOS HERE",
        uploadDesc: "Supported: JPG, PNG, GIF, MP4, MOV, AVI, WEBM",
        icon: "fa-photo-video"
    },
    apk: {
        extensions: ['.apk', '.zip', '.rar', '.7z', '.tar', '.gz'],
        title: "APK & ZIP Hosting",
        desc: "Host APK, ZIP, RAR files for easy sharing",
        uploadTitle: "DROP APK/ZIP FILES HERE",
        uploadDesc: "Supported: APK, ZIP, RAR, 7Z, TAR, GZ",
        icon: "fa-file-archive"
    },
    website: {
        extensions: ['.html', '.css', '.js', '.json', '.txt', '.xml'],
        title: "Website Hosting",
        desc: "Upload HTML, CSS, JS files to create a website",
        uploadTitle: "DROP WEBSITE FILES HERE",
        uploadDesc: "Supported: HTML, CSS, JavaScript, JSON",
        icon: "fa-code"
    },
    news: {
        extensions: ['.txt', '.md', '.html', '.doc', '.docx'],
        title: "News Hosting",
        desc: "Create and share news articles",
        uploadTitle: "DROP NEWS FILES HERE",
        uploadDesc: "Supported: TXT, MD, HTML files",
        icon: "fa-newspaper"
    },
    imagelink: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        title: "Image to Link",
        desc: "Upload images and get direct shareable links",
        uploadTitle: "DROP IMAGES HERE",
        uploadDesc: "Supported: JPG, PNG, GIF, WebP",
        icon: "fa-link"
    },
    bgremover: {
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        title: "Image Background Remover",
        desc: "Remove background from images instantly",
        uploadTitle: "DROP IMAGE HERE",
        uploadDesc: "Supported: JPG, PNG, GIF, WebP",
        icon: "fa-magic"
    }
};

// DOM Elements
const elements = {
    // Type Selection
    typeSelection: document.getElementById('typeSelection'),
    uploadSection: document.getElementById('uploadSection'),
    
    // Upload Section
    backToTypes: document.getElementById('backToTypes'),
    sectionTitle: document.getElementById('sectionTitle'),
    sectionDesc: document.getElementById('sectionDesc'),
    uploadTitle: document.getElementById('uploadTitle'),
    uploadDesc: document.getElementById('uploadDesc'),
    dropZone: document.getElementById('dropZone'),
    browseBtn: document.getElementById('browseBtn'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    previewSection: document.getElementById('previewSection'),
    originalImage: document.getElementById('originalImage'),
    resultCanvas: document.getElementById('resultCanvas'),
    processing: document.getElementById('processing'),
    bgControls: document.getElementById('bgControls'),
    threshold: document.getElementById('threshold'),
    thresholdValue: document.getElementById('thresholdValue'),
    feathering: document.getElementById('feathering'),
    featheringValue: document.getElementById('featheringValue'),
    projectNameSection: document.getElementById('projectNameSection'),
    projectNameInput: document.getElementById('projectNameInput'),
    urlPreview: document.getElementById('urlPreview'),
    generateBtn: document.getElementById('generateBtn'),
    processBgBtn: document.getElementById('processBgBtn'),
    
    // Result Section
    resultSection: document.getElementById('resultSection'),
    resultTitle: document.getElementById('resultTitle'),
    resultContent: document.getElementById('resultContent'),
    downloadActions: document.getElementById('downloadActions'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyAllBtn: document.getElementById('copyAllBtn'),
    shareWhatsApp: document.getElementById('shareWhatsApp'),
    shareTelegram: document.getElementById('shareTelegram'),
    
    // Projects Section
    projectsList: document.getElementById('projectsList'),
    emptyState: document.getElementById('emptyState'),
    projectCount: document.getElementById('projectCount'),
    
    // Modal
    adminModal: document.getElementById('adminModal'),
    adminPassword: document.getElementById('adminPassword'),
    showPassword: document.getElementById('showPassword'),
    confirmDelete: document.getElementById('confirmDelete'),
    closeModal: document.querySelector('.close-modal'),
    cancelBtn: document.querySelector('.btn-cancel'),
    
    // Toast
    toast: document.getElementById('toast')
};

// Initialize Application
function init() {
    console.log(`🚀 FreeHost Pro v${CONFIG.VERSION} loaded`);
    
    // Setup event listeners
    setupEventListeners();
    
    // Load projects
    loadProjects();
    updateProjectCount();
    
    // Check for direct access
    checkDirectAccess();
    
    // Show welcome message
    setTimeout(() => {
        showToast('🎉 Welcome to FreeHost Pro! Select a hosting type to begin.', 'info');
    }, 1000);
}

// Setup all event listeners
function setupEventListeners() {
    // Type selection buttons
    document.querySelectorAll('.select-type').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = e.target.dataset.type;
            selectHostingType(type);
        });
    });
    
    // Back to types
    elements.backToTypes.addEventListener('click', goBackToTypes);
    
    // File upload
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    
    // Project name input
    elements.projectNameInput.addEventListener('input', updateUrlPreview);
    
    // Generate button
    elements.generateBtn.addEventListener('click', generateLinks);
    
    // Process BG button
    elements.processBgBtn.addEventListener('click', processBackgroundRemoval);
    
    // Range inputs
    elements.threshold.addEventListener('input', updateThresholdValue);
    elements.feathering.addEventListener('input', updateFeatheringValue);
    
    // Result buttons
    elements.downloadBtn.addEventListener('click', downloadResult);
    elements.copyAllBtn.addEventListener('click', copyAllLinks);
    elements.shareWhatsApp.addEventListener('click', shareViaWhatsApp);
    elements.shareTelegram.addEventListener('click', shareViaTelegram);
    
    // Project tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            e.target.classList.add('active');
            // Filter projects
            filterProjects(e.target.textContent.toLowerCase());
        });
    });
    
    // Modal events
    elements.showPassword.addEventListener('click', togglePasswordVisibility);
    elements.confirmDelete.addEventListener('click', confirmDeleteProject);
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.adminModal.addEventListener('click', (e) => {
        if (e.target === elements.adminModal) closeModal();
    });
    
    // Handle copy buttons dynamically
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn-small')) {
            const input = e.target.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                copyToClipboard(input.value);
            }
        }
        
        // Handle project actions
        if (e.target.closest('.project-btn.view')) {
            const projectId = e.target.closest('.project-card').dataset.id;
            viewProject(projectId);
        }
        
        if (e.target.closest('.project-btn.delete')) {
            const projectId = e.target.closest('.project-card').dataset.id;
            requestDeleteProject(projectId);
        }
    });
}

// Select hosting type
function selectHostingType(type) {
    currentType = type;
    const info = FILE_TYPES[type];
    
    // Update UI
    elements.sectionTitle.innerHTML = `<i class="fas ${info.icon}"></i> ${info.title}`;
    elements.sectionDesc.textContent = info.desc;
    elements.uploadTitle.textContent = info.uploadTitle;
    elements.uploadDesc.textContent = info.uploadDesc;
    
    // Show upload section
    elements.typeSelection.style.display = 'none';
    elements.uploadSection.style.display = 'block';
    elements.resultSection.style.display = 'none';
    
    // Show/hide preview section for BG Remover
    if (type === 'bgremover') {
        elements.previewSection.style.display = 'block';
        elements.bgControls.style.display = 'block';
        elements.processBgBtn.style.display = 'block';
        elements.generateBtn.style.display = 'none';
        elements.projectNameSection.style.display = 'none';
    } else {
        elements.previewSection.style.display = 'none';
        elements.bgControls.style.display = 'none';
        elements.processBgBtn.style.display = 'none';
        elements.generateBtn.style.display = 'block';
        elements.projectNameSection.style.display = 'block';
    }
    
    // Reset
    uploadedFiles = [];
    originalImage = null;
    processedImage = null;
    renderFileList();
    updateUrlPreview();
    
    // Update file input accept attribute
    const extensions = FILE_TYPES[type].extensions.join(',');
    elements.fileInput.setAttribute('accept', extensions);
    elements.fileInput.value = ''; // Clear file input
    
    showToast(`Selected: ${info.title}`, 'info');
}

// Go back to type selection
function goBackToTypes() {
    elements.typeSelection.style.display = 'block';
    elements.uploadSection.style.display = 'none';
    elements.resultSection.style.display = 'none';
    uploadedFiles = [];
    originalImage = null;
    processedImage = null;
    renderFileList();
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.style.borderColor = '#4299e1';
    elements.dropZone.style.background = 'rgba(66, 153, 225, 0.2)';
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.style.borderColor = '#4a5568';
    elements.dropZone.style.background = 'rgba(26, 32, 44, 0.5)';
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleDragLeave(e);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = ''; // Reset input
}

// Add files to list
function addFiles(files) {
    if (!currentType) {
        showToast('Please select a hosting type first!', 'error');
        return;
    }
    
    const allowedTypes = FILE_TYPES[currentType].extensions;
    
    files.forEach(file => {
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showToast(`File too large: ${file.name} (max 10MB)`, 'error');
            return;
        }
        
        // Check file type
        const fileName = file.name.toLowerCase();
        const fileExt = '.' + fileName.split('.').pop();
        const isAllowed = allowedTypes.includes(fileExt);
        
        if (!isAllowed) {
            showToast(`Unsupported file type: ${file.name}`, 'error');
            return;
        }
        
        // For BG Remover, only allow one image
        if (currentType === 'bgremover' && uploadedFiles.length >= 1) {
            showToast('Only one image allowed for background removal', 'error');
            return;
        }
        
        // Check if file already exists
        const existingIndex = uploadedFiles.findIndex(f => f.name === file.name);
        
        if (existingIndex !== -1) {
            uploadedFiles[existingIndex] = file;
            showToast(`Updated: ${file.name}`, 'info');
        } else {
            uploadedFiles.push(file);
            showToast(`Added: ${file.name}`, 'success');
        }
        
        // For BG Remover, load and display image
        if (currentType === 'bgremover' && file.type.startsWith('image/')) {
            loadImageForBG(file);
        }
    });
    
    renderFileList();
}

// Load image for BG Remover
function loadImageForBG(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            // Display original image
            elements.originalImage.src = originalImage.src;
            
            // Setup canvas
            const canvas = elements.resultCanvas;
            const ctx = canvas.getContext('2d');
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            
            // Draw placeholder
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#718096';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Processed image will appear here', canvas.width/2, canvas.height/2);
            
            showToast('✅ Image loaded for background removal', 'success');
        };
        originalImage.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Render file list
function renderFileList() {
    const fileList = elements.fileList;
    
    if (uploadedFiles.length === 0) {
        fileList.innerHTML = `
            <div class="file-item">
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">No files selected</div>
                    <div class="file-size">Drag & drop or click browse</div>
                </div>
            </div>
        `;
        return;
    }
    
    fileList.innerHTML = '';
    
    uploadedFiles.forEach((file, index) => {
        const extension = file.name.toLowerCase().split('.').pop();
        let icon = 'fa-file';
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            icon = 'fa-image';
        } else if (['mp4', 'mov', 'avi'].includes(extension)) {
            icon = 'fa-video';
        } else if (['apk'].includes(extension)) {
            icon = 'fa-android';
        } else if (['zip', 'rar', '7z'].includes(extension)) {
            icon = 'fa-file-archive';
        } else if (['html', 'htm'].includes(extension)) {
            icon = 'fa-html5';
        } else if (['css'].includes(extension)) {
            icon = 'fa-css3';
        } else if (['js'].includes(extension)) {
            icon = 'fa-js';
        } else if (['txt', 'md'].includes(extension)) {
            icon = 'fa-file-alt';
        }
        
        const fileSize = formatFileSize(file.size);
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
            <button class="remove-btn" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
}

// Remove file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
    
    if (currentType === 'bgremover') {
        originalImage = null;
        processedImage = null;
        elements.originalImage.src = '';
        const canvas = elements.resultCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    showToast('File removed', 'info');
}

// Update URL preview
function updateUrlPreview() {
    const name = elements.projectNameInput.value.trim() || 'project';
    const cleanName = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    elements.urlPreview.textContent = `freehost.site/${cleanName}`;
}

// Update threshold value
function updateThresholdValue() {
    elements.thresholdValue.textContent = elements.threshold.value;
}

// Update feathering value
function updateFeatheringValue() {
    elements.featheringValue.textContent = elements.feathering.value;
}

// Process background removal
async function processBackgroundRemoval() {
    if (!originalImage) {
        showToast('Please upload an image first!', 'error');
        return;
    }
    
    if (isProcessing) return;
    
    isProcessing = true;
    elements.processing.style.display = 'flex';
    elements.processBgBtn.disabled = true;
    
    try {
        const threshold = parseInt(elements.threshold.value);
        const feathering = parseInt(elements.feathering.value);
        
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        // Draw original image
        ctx.drawImage(originalImage, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple background removal algorithm (remove white/light backgrounds)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Detect light colors (white/light background)
            const brightness = (r + g + b) / 3;
            
            if (brightness > 200) { // Adjust threshold as needed
                data[i + 3] = 0; // Make pixel transparent
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Create result image
        processedImage = new Image();
        processedImage.onload = () => {
            // Display result
            const resultCanvas = elements.resultCanvas;
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = processedImage.width;
            resultCanvas.height = processedImage.height;
            
            // Draw checkerboard background
            drawCheckerboard(resultCtx, resultCanvas.width, resultCanvas.height);
            
            // Draw processed image
            resultCtx.drawImage(processedImage, 0, 0);
            
            // Show success
            showToast('✅ Background removed successfully!', 'success');
            
            // Show download button
            elements.downloadBtn.textContent = 'Download PNG';
            elements.downloadBtn.onclick = downloadBGResult;
            elements.downloadActions.style.display = 'flex';
            
            isProcessing = false;
            elements.processing.style.display = 'none';
            elements.processBgBtn.disabled = false;
        };
        
        processedImage.src = canvas.toDataURL('image/png');
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error removing background. Please try again.', 'error');
        isProcessing = false;
        elements.processing.style.display = 'none';
        elements.processBgBtn.disabled = false;
    }
}

// Draw checkerboard pattern
function drawCheckerboard(ctx, width, height) {
    const size = 20;
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#4a5568';
    for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size * 2) {
            if (y % (size * 2) === 0) {
                ctx.fillRect(x + size, y, size, size);
                ctx.fillRect(x, y + size, size, size);
            } else {
                ctx.fillRect(x, y, size, size);
                ctx.fillRect(x + size, y + size, size, size);
            }
        }
    }
}

// Download BG result
function downloadBGResult() {
    if (!processedImage) return;
    
    const canvas = elements.resultCanvas;
    const link = document.createElement('a');
    link.download = `bg-removed-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showToast('✅ Image downloaded!', 'success');
}

// Generate links for hosting
async function generateLinks() {
    // Validate
    if (uploadedFiles.length === 0) {
        showToast('Please upload at least one file!', 'error');
        return;
    }
    
    const projectName = elements.projectNameInput.value.trim() || 'project';
    const cleanName = projectName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Generate unique ID
    const projectId = cleanName + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Create project object
    const project = {
        id: projectId,
        type: currentType,
        name: projectName,
        date: new Date().toISOString(),
        files: []
    };
    
    // Show loading
    elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    elements.generateBtn.disabled = true;
    
    try {
        // Read all files
        for (const file of uploadedFiles) {
            const content = await readFileAsDataURL(file);
            project.files.push({
                name: file.name,
                type: file.type,
                size: file.size,
                content: content
            });
        }
        
        // Save project
        projects.unshift(project);
        localStorage.setItem('freeHostProjects', JSON.stringify(projects));
        
        // Display result
        displayResult(project);
        
        // Reset
        uploadedFiles = [];
        renderFileList();
        
        // Update projects list
        loadProjects();
        updateProjectCount();
        
        showToast('✅ Files hosted successfully!', 'success');
        
    } catch (error) {
        showToast('Error processing files. Please try again.', 'error');
        console.error('Error:', error);
    } finally {
        elements.generateBtn.innerHTML = '<i class="fas fa-bolt"></i> Generate Public Links';
        elements.generateBtn.disabled = false;
    }
}

// Read file as DataURL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Display result based on type
function displayResult(project) {
    elements.resultSection.style.display = 'block';
    elements.resultTitle.textContent = '🎉 Success! Files Hosted';
    
    const resultContent = elements.resultContent;
    resultContent.innerHTML = '';
    
    switch (project.type) {
        case 'media':
        case 'apk':
            displayDownloadLinks(project);
            break;
        case 'website':
            displayWebsiteLink(project);
            break;
        case 'news':
            displayNewsLink(project);
            break;
        case 'imagelink':
            displayImageLinks(project);
            break;
    }
    
    // Scroll to result
    elements.resultSection.scrollIntoView({ behavior: 'smooth' });
    
    // Setup download button
    if (project.type === 'media' || project.type === 'apk' || project.type === 'imagelink') {
        elements.downloadBtn.style.display = 'none';
        elements.copyAllBtn.style.display = 'block';
    } else {
        elements.downloadBtn.style.display = 'block';
        elements.copyAllBtn.style.display = 'block';
        elements.downloadBtn.textContent = project.type === 'website' ? 'Open Website' : 'View Article';
        elements.downloadBtn.onclick = () => viewProject(project.id);
    }
}

// Display download links
function displayDownloadLinks(project) {
    const resultContent = elements.resultContent;
    let html = '<div class="download-links">';
    
    project.files.forEach((file, index) => {
        const fileSize = formatFileSize(file.size);
        const fileUrl = `${window.location.origin}${window.location.pathname}?download=${project.id}&file=${index}`;
        
        html += `
            <div class="download-item">
                <div class="download-header">
                    <div class="download-name">
                        <i class="fas fa-file"></i> ${file.name}
                    </div>
                    <div class="download-size">${fileSize}</div>
                </div>
                <div class="download-url">
                    <input type="text" value="${fileUrl}" readonly>
                    <button class="copy-btn-small">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultContent.innerHTML = html;
}

// Display website link
function displayWebsiteLink(project) {
    const resultContent = elements.resultContent;
    const websiteUrl = `${window.location.origin}${window.location.pathname}?website=${project.id}`;
    
    resultContent.innerHTML = `
        <div class="link-box">
            <i class="fas fa-globe"></i>
            <input type="text" value="${websiteUrl}" readonly>
            <button class="copy-btn-small">
                <i class="fas fa-copy"></i>
            </button>
        </div>
        <p style="color: #a0aec0; text-align: center; margin-top: 15px;">
            <i class="fas fa-info-circle"></i> This link will open your hosted website
        </p>
    `;
}

// Display news link
function displayNewsLink(project) {
    const resultContent = elements.resultContent;
    const newsUrl = `${window.location.origin}${window.location.pathname}?news=${project.id}`;
    
    resultContent.innerHTML = `
        <div class="link-box">
            <i class="fas fa-newspaper"></i>
            <input type="text" value="${newsUrl}" readonly>
            <button class="copy-btn-small">
                <i class="fas fa-copy"></i>
            </button>
        </div>
        <p style="color: #a0aec0; text-align: center; margin-top: 15px;">
            <i class="fas fa-info-circle"></i> This link will open your news article
        </p>
    `;
}

// Display image links
function displayImageLinks(project) {
    const resultContent = elements.resultContent;
    let html = '<div class="download-links">';
    
    project.files.forEach((file, index) => {
        const fileSize = formatFileSize(file.size);
        const fileUrl = `${window.location.origin}${window.location.pathname}?imagelink=${project.id}&file=${index}`;
        
        html += `
            <div class="download-item">
                <div class="download-header">
                    <div class="download-name">
                        <i class="fas fa-image"></i> ${file.name}
                    </div>
                    <div class="download-size">${fileSize}</div>
                </div>
                <div class="image-preview">
                    <img src="${file.content}" alt="${file.name}" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
                </div>
                <div class="download-url">
                    <input type="text" value="${fileUrl}" readonly>
                    <button class="copy-btn-small">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="share-buttons" style="margin-top: 10px;">
                    <button class="share-btn" onclick="shareImageLink('${fileUrl}', '${file.name}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultContent.innerHTML = html;
}

// Download result
function downloadResult() {
    // This is handled per type
}

// Copy all links
function copyAllLinks() {
    let allLinks = '';
    const inputs = document.querySelectorAll('.download-url input, .link-box input');
    
    inputs.forEach(input => {
        allLinks += input.value + '\n';
    });
    
    if (allLinks) {
        copyToClipboard(allLinks);
        showToast('All links copied to clipboard!', 'success');
    }
}

// Share via WhatsApp
function shareViaWhatsApp() {
    let url = '';
    const input = document.querySelector('.link-box input, .download-url input');
    
    if (input) {
        url = input.value;
        const text = `Check this out: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }
}

// Share image link
function shareImageLink(url, filename) {
    const text = `Check out this image: ${url}`;
    if (navigator.share) {
        navigator.share({
            title: filename,
            text: text,
            url: url
        });
    } else {
        copyToClipboard(url);
        showToast('Image link copied to clipboard!', 'success');
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showToast('Copied to clipboard!', 'success'))
        .catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('Copied to clipboard!', 'success');
        });
}

// Load projects
function loadProjects(filter = 'all') {
    const projectsList = elements.projectsList;
    const emptyState = elements.emptyState;
    
    let filteredProjects = projects;
    if (filter !== 'all') {
        filteredProjects = projects.filter(p => p.type === filter);
    }
    
    if (filteredProjects.length === 0) {
        projectsList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    projectsList.innerHTML = '';
    
    filteredProjects.forEach(project => {
        const date = new Date(project.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let projectUrl = '';
        let actionText = 'View';
        
        switch (project.type) {
            case 'website':
                projectUrl = `${window.location.origin}${window.location.pathname}?website=${project.id}`;
                actionText = 'View Site';
                break;
            case 'news':
                projectUrl = `${window.location.origin}${window.location.pathname}?news=${project.id}`;
                actionText = 'View Article';
                break;
            case 'imagelink':
                projectUrl = `${window.location.origin}${window.location.pathname}?imagelink=${project.id}&file=0`;
                actionText = 'View Image';
                break;
            default:
                projectUrl = `${window.location.origin}${window.location.pathname}?download=${project.id}&file=0`;
                actionText = 'View Files';
        }
        
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.id = project.id;
        projectCard.innerHTML = `
            <div class="project-header">
                <span class="project-type ${project.type}">
                    <i class="fas ${FILE_TYPES[project.type].icon}"></i>
                    ${project.type.toUpperCase()}
                </span>
                <span class="project-date">${formattedDate}</span>
            </div>
            <div class="project-title">${project.name}</div>
            <div class="project-url">${projectUrl}</div>
            <div class="project-actions">
                <button class="project-btn view">
                    <i class="fas fa-eye"></i> ${actionText}
                </button>
                <button class="project-btn delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        
        projectsList.appendChild(projectCard);
    });
}

// Filter projects
function filterProjects(filter) {
    loadProjects(filter === 'all' ? 'all' : filter);
}

// Update project count
function updateProjectCount() {
    elements.projectCount.textContent = projects.length;
}

// View project
function viewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    switch (project.type) {
        case 'website':
            window.open(`${window.location.origin}${window.location.pathname}?website=${projectId}`, '_blank');
            break;
        case 'news':
            window.open(`${window.location.origin}${window.location.pathname}?news=${projectId}`, '_blank');
            break;
        case 'imagelink':
            window.open(`${window.location.origin}${window.location.pathname}?imagelink=${projectId}&file=0`, '_blank');
            break;
        default:
            window.open(`${window.location.origin}${window.location.pathname}?download=${projectId}&file=0`, '_blank');
    }
}

// Request delete project
function requestDeleteProject(projectId) {
    currentDeleteId = projectId;
    elements.adminModal.style.display = 'flex';
    elements.adminPassword.value = '';
    elements.adminPassword.focus();
}

// Confirm delete project
function confirmDeleteProject() {
    const password = elements.adminPassword.value.trim();
    
    if (password !== CONFIG.ADMIN_PASSWORD) {
        showToast('Incorrect admin password!', 'error');
        return;
    }
    
    // Delete project
    projects = projects.filter(p => p.id !== currentDeleteId);
    localStorage.setItem('freeHostProjects', JSON.stringify(projects));
    
    // Update UI
    loadProjects();
    updateProjectCount();
    
    // Close modal
    closeModal();
    
    // Show success
    showToast('Project deleted successfully!', 'success');
    
    // Reset
    currentDeleteId = null;
}

// Close modal
function closeModal() {
    elements.adminModal.style.display = 'none';
    currentDeleteId = null;
}

// Toggle password visibility
function togglePasswordVisibility() {
    const type = elements.adminPassword.getAttribute('type');
    elements.adminPassword.setAttribute('type', type === 'password' ? 'text' : 'password');
    elements.showPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

// Check for direct access
function checkDirectAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for website
    const websiteId = urlParams.get('website');
    if (websiteId) {
        const project = projects.find(p => p.id === websiteId && p.type === 'website');
        if (project) {
            showWebsite(project);
            return;
        }
    }
    
    // Check for news
    const newsId = urlParams.get('news');
    if (newsId) {
        const project = projects.find(p => p.id === newsId && p.type === 'news');
        if (project) {
            showNews(project);
            return;
        }
    }
    
    // Check for download
    const downloadId = urlParams.get('download');
    const fileIndex = urlParams.get('file');
    if (downloadId && fileIndex !== null) {
        const project = projects.find(p => p.id === downloadId);
        if (project && project.files[fileIndex]) {
            downloadFile(project.files[fileIndex]);
            return;
        }
    }
    
    // Check for image link
    const imageLinkId = urlParams.get('imagelink');
    const imageFileIndex = urlParams.get('file');
    if (imageLinkId && imageFileIndex !== null) {
        const project = projects.find(p => p.id === imageLinkId && p.type === 'imagelink');
        if (project && project.files[imageFileIndex]) {
            showImage(project.files[imageFileIndex]);
            return;
        }
    }
}

// Show website
function showWebsite(project) {
    const htmlFile = project.files.find(f => f.name.toLowerCase().endsWith('.html'));
    
    if (htmlFile) {
        let htmlContent = atob(htmlFile.content.split(',')[1]);
        
        // Inject CSS and JS
        project.files.forEach(file => {
            if (file.name.toLowerCase().endsWith('.css')) {
                const cssContent = atob(file.content.split(',')[1]);
                htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
            }
            
            if (file.name.toLowerCase().endsWith('.js')) {
                const jsContent = atob(file.content.split(',')[1]);
                htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
            }
        });
        
        // Add hosting badge
        htmlContent = htmlContent.replace('</body>', `
            <div style="position:fixed;bottom:10px;right:10px;background:#4299e1;color:white;padding:5px 10px;border-radius:4px;font-size:12px;z-index:9999;font-family:sans-serif;">
                <i class="fas fa-server" style="margin-right:5px;"></i>
                Hosted on FreeHost Pro
            </div>
        </body>`);
        
        document.write(htmlContent);
        document.close();
        
        throw new Error('Website loaded');
    }
}

// Show news article
function showNews(project) {
    const textFile = project.files.find(f => 
        f.name.toLowerCase().endsWith('.txt') || 
        f.name.toLowerCase().endsWith('.md') || 
        f.name.toLowerCase().endsWith('.html')
    );
    
    if (textFile) {
        const content = atob(textFile.content.split(',')[1]);
        
        const newsPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${project.name} - FreeHost News</title>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        background: #f5f5f5;
                        color: #333;
                    }
                    .article-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #ddd;
                    }
                    .article-title {
                        font-size: 2.5rem;
                        color: #2d3748;
                        margin-bottom: 10px;
                    }
                    .article-date {
                        color: #718096;
                        font-size: 0.9rem;
                    }
                    .article-content {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                        white-space: pre-wrap;
                        font-size: 1.1rem;
                    }
                    .hosting-badge {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        color: #718096;
                        font-size: 0.9rem;
                    }
                </style>
            </head>
            <body>
                <div class="article-header">
                    <h1 class="article-title">${project.name}</h1>
                    <div class="article-date">Published: ${new Date(project.date).toLocaleDateString()}</div>
                </div>
                <div class="article-content">${content}</div>
                <div class="hosting-badge">
                    📰 Article hosted on <strong>FreeHost Pro</strong> - 100% Free Unlimited Hosting
                </div>
            </body>
            </html>
        `;
        
        document.write(newsPage);
        document.close();
        
        throw new Error('News article loaded');
    }
}

// Show image
function showImage(file) {
    const imagePage = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Image - FreeHost Pro</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    background: #f5f5f5;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    font-family: 'Segoe UI', sans-serif;
                }
                .image-container {
                    max-width: 90%;
                    max-height: 80vh;
                    margin-bottom: 30px;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                img {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .info {
                    text-align: center;
                    color: #666;
                    margin-top: 20px;
                }
                .badge {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    background: #4299e1;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="image-container">
                <img src="${file.content}" alt="Hosted Image">
            </div>
            <div class="info">
                <p>Image hosted on <strong>FreeHost Pro</strong></p>
                <p style="font-size: 0.9rem; color: #999;">Right click and select "Save image as" to download</p>
            </div>
            <div class="badge">
                <i class="fas fa-image"></i> FreeHost Pro
            </div>
        </body>
        </html>
    `;
    
    document.write(imagePage);
    document.close();
}

// Download file
function downloadFile(file) {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = elements.toast;
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

// Prevent accidental page leave
window.addEventListener('beforeunload', (e) => {
    if (uploadedFiles.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved files. Are you sure you want to leave?';
    }
});

// Export functions for global access
window.removeFile = removeFile;
window.shareImageLink = shareImageLink;
window.filterProjects = filterProjects;
window.viewProject = viewProject;
