// Web Hosting Pro - Fixed Version
// This version properly simulates real hosting with working public links

class WebHostPro {
    constructor() {
        this.db = null;
        this.DB_NAME = "WebHostProDB";
        this.DB_VERSION = 4;
        
        this.STORES = {
            WEBSITES: "websites",
            ARTICLES: "articles",
            MEDIA: "media",
            APK_ZIP: "apk_zip"
        };
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }
    
    async init() {
        // Check URL first to see if we should show hosted content
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const id = urlParams.get('id');
        const slug = urlParams.get('slug');
        
        // Initialize database
        await this.initDB();
        
        // If we have a mode and id/slug, show the hosted content
        if (mode && (id || slug)) {
            await this.showHostedContent(mode, id || slug);
        } else {
            // Otherwise show the hosting dashboard
            this.showHostingDashboard();
            this.initEventListeners();
            this.loadAllData();
            
            // Show welcome notification
            setTimeout(() => {
                this.showNotification("Welcome to WebHost Pro! All data is stored locally in your browser.", "info");
            }, 1000);
        }
    }
    
    // Initialize IndexedDB
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                this.showNotification("Failed to initialize database. Some features may not work.", "error");
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Database initialized successfully");
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // Create all object stores
                if (!this.db.objectStoreNames.contains(this.STORES.WEBSITES)) {
                    const websiteStore = this.db.createObjectStore(this.STORES.WEBSITES, { keyPath: "id", autoIncrement: true });
                    websiteStore.createIndex("slug", "slug", { unique: true });
                }
                
                if (!this.db.objectStoreNames.contains(this.STORES.ARTICLES)) {
                    const articleStore = this.db.createObjectStore(this.STORES.ARTICLES, { keyPath: "id", autoIncrement: true });
                    articleStore.createIndex("slug", "slug", { unique: true });
                }
                
                if (!this.db.objectStoreNames.contains(this.STORES.MEDIA)) {
                    this.db.createObjectStore(this.STORES.MEDIA, { keyPath: "id", autoIncrement: true });
                }
                
                if (!this.db.objectStoreNames.contains(this.STORES.APK_ZIP)) {
                    this.db.createObjectStore(this.STORES.APK_ZIP, { keyPath: "id", autoIncrement: true });
                }
                
                console.log("Database schema created/updated");
            };
        });
    }
    
    // Show hosting dashboard
    showHostingDashboard() {
        document.getElementById('hosting-dashboard').style.display = 'block';
        document.getElementById('content-display').style.display = 'none';
        document.title = "WebHost Pro - Client-Side Hosting Platform";
    }
    
    // Show hosted content
    async showHostedContent(mode, identifier) {
        document.getElementById('hosting-dashboard').style.display = 'none';
        const contentDisplay = document.getElementById('content-display');
        contentDisplay.style.display = 'block';
        contentDisplay.innerHTML = '<div class="spinner"></div>';
        
        try {
            switch(mode) {
                case 'website':
                    await this.displayWebsite(identifier);
                    break;
                case 'article':
                    await this.displayArticle(identifier);
                    break;
                case 'media':
                    await this.displayMedia(identifier);
                    break;
                case 'download':
                    await this.downloadFile(identifier);
                    break;
                default:
                    contentDisplay.innerHTML = '<h1>Content Not Found</h1><p>The requested content could not be found.</p>';
            }
        } catch (error) {
            console.error("Error displaying content:", error);
            contentDisplay.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Content Not Found</h3>
                    <p>The requested content could not be loaded.</p>
                    <button class="btn btn-primary" onclick="window.location.href='index.html'">
                        <i class="fas fa-home"></i> Back to Dashboard
                    </button>
                </div>
            `;
        }
    }
    
    // Display hosted website
    async displayWebsite(identifier) {
        const website = await this.getWebsite(identifier);
        if (!website) throw new Error("Website not found");
        
        document.title = website.title || website.name || "Hosted Website";
        
        const contentDisplay = document.getElementById('content-display');
        contentDisplay.innerHTML = `
            <div class="content-display-header">
                <div class="container">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>${this.escapeHtml(website.name || "Hosted Website")}</h2>
                        <button class="btn btn-back" onclick="window.location.href='index.html'">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
            <div class="content-display-body">
                <iframe 
                    class="hosted-website" 
                    srcdoc="${this.escapeHtml(website.html)}" 
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    title="${this.escapeHtml(website.name || "Hosted Website")}"
                ></iframe>
            </div>
        `;
    }
    
    // Display hosted article
    async displayArticle(identifier) {
        const article = await this.getArticle(identifier);
        if (!article) throw new Error("Article not found");
        
        document.title = article.title || "Hosted Article";
        
        const contentDisplay = document.getElementById('content-display');
        contentDisplay.innerHTML = `
            <div class="content-display-header">
                <div class="container">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2>${this.escapeHtml(article.title)}</h2>
                        <button class="btn btn-back" onclick="window.location.href='index.html'">
                            <i class="fas fa-arrow-left"></i> Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
            <div class="content-display-body">
                <div class="hosted-article">
                    <h1 class="hosted-article-title">${this.escapeHtml(article.title)}</h1>
                    <div class="article-meta" style="margin-bottom: 2rem;">
                        Published on ${new Date(article.createdAt).toLocaleDateString()}
                    </div>
                    ${article.image ? `<img src="${article.image}" alt="${this.escapeHtml(article.title)}" class="hosted-article-image">` : ''}
                    <div class="hosted-article-content">
                        ${article.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        `;
    }
    
    // Display hosted media (image/video)
    async displayMedia(id) {
        const media = await this.getMediaFile(id);
        if (!media) throw new Error("Media file not found");
        
        document.title = media.name || "Hosted Media";
        
        const isImage = media.type.startsWith('image/');
        const isVideo = media.type.startsWith('video/');
        
        const contentDisplay = document.getElementById('content-display');
        
        if (isImage) {
            contentDisplay.innerHTML = `
                <div class="content-display-header">
                    <div class="container">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2>${this.escapeHtml(media.name)}</h2>
                            <button class="btn btn-back" onclick="window.location.href='index.html'">
                                <i class="fas fa-arrow-left"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
                <div class="content-display-body">
                    <div class="hosted-media-container">
                        <img src="${media.data}" alt="${this.escapeHtml(media.name)}" class="hosted-media">
                        <button class="btn btn-primary download-button" onclick="this.downloadFile('${media.data}', '${this.escapeHtml(media.name)}')">
                            <i class="fas fa-download"></i> Download ${media.name}
                        </button>
                    </div>
                </div>
            `;
        } else if (isVideo) {
            contentDisplay.innerHTML = `
                <div class="content-display-header">
                    <div class="container">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2>${this.escapeHtml(media.name)}</h2>
                            <button class="btn btn-back" onclick="window.location.href='index.html'">
                                <i class="fas fa-arrow-left"></i> Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
                <div class="content-display-body">
                    <div class="hosted-media-container">
                        <video controls class="hosted-media">
                            <source src="${media.data}" type="${media.type}">
                            Your browser does not support the video tag.
                        </video>
                        <button class="btn btn-primary download-button" onclick="this.downloadFile('${media.data}', '${this.escapeHtml(media.name)}')">
                            <i class="fas fa-download"></i> Download ${media.name}
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // Download file directly
    async downloadFile(id) {
        const file = await this.getDownloadFile(id);
        if (!file) throw new Error("File not found");
        
        // Create a download link and trigger it
        const a = document.createElement('a');
        a.href = file.data;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show a message and redirect back
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    // Initialize event listeners for the dashboard
    initEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Website hosting
        const websiteUploadArea = document.getElementById('website-upload-area');
        const websiteUploadBtn = document.getElementById('website-upload-btn');
        const websiteFilesInput = document.getElementById('website-files');
        
        websiteUploadArea.addEventListener('click', () => websiteFilesInput.click());
        websiteUploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            websiteFilesInput.click();
        });
        
        document.getElementById('create-project').addEventListener('click', () => this.createWebsiteProject());
        
        // Article hosting
        const articleUploadArea = document.getElementById('article-upload-area');
        const articleImageBtn = document.getElementById('article-image-btn');
        const articleImageInput = document.getElementById('article-image');
        
        articleUploadArea.addEventListener('click', () => articleImageInput.click());
        articleImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            articleImageInput.click();
        });
        
        document.getElementById('publish-article').addEventListener('click', () => this.publishArticle());
        
        // Media hosting
        const mediaUploadArea = document.getElementById('media-upload-area');
        const mediaUploadBtn = document.getElementById('media-upload-btn');
        const mediaFilesInput = document.getElementById('media-files');
        
        mediaUploadArea.addEventListener('click', () => mediaFilesInput.click());
        mediaUploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mediaFilesInput.click();
        });
        
        mediaFilesInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleMediaUpload(e.target.files);
            }
        });
        
        // APK/ZIP hosting
        const apkUploadArea = document.getElementById('apk-upload-area');
        const apkUploadBtn = document.getElementById('apk-upload-btn');
        const apkFilesInput = document.getElementById('apk-files');
        
        apkUploadArea.addEventListener('click', () => apkFilesInput.click());
        apkUploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            apkFilesInput.click();
        });
        
        apkFilesInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleApkZipUpload(e.target.files);
            }
        });
        
        // Initialize drag and drop
        this.initDragAndDrop();
    }
    
    // Initialize drag and drop
    initDragAndDrop() {
        const uploadAreas = [
            { id: 'website-upload-area', type: 'website' },
            { id: 'article-upload-area', type: 'article' },
            { id: 'media-upload-area', type: 'media' },
            { id: 'apk-upload-area', type: 'apk' }
        ];
        
        uploadAreas.forEach(area => {
            const element = document.getElementById(area.id);
            
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                element.style.borderColor = 'var(--secondary)';
                element.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
            });
            
            element.addEventListener('dragleave', () => {
                element.style.borderColor = 'var(--primary)';
                element.style.backgroundColor = 'rgba(108, 99, 255, 0.03)';
            });
            
            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.style.borderColor = 'var(--primary)';
                element.style.backgroundColor = 'rgba(108, 99, 255, 0.03)';
                
                const files = e.dataTransfer.files;
                
                switch(area.type) {
                    case 'website':
                        document.getElementById('website-files').files = files;
                        if (files.length > 0) {
                            this.showNotification(`Dropped ${files.length} file(s) for website hosting`, 'success');
                        }
                        break;
                    case 'article':
                        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
                        if (imageFiles.length > 0) {
                            const dataTransfer = new DataTransfer();
                            imageFiles.forEach(file => dataTransfer.items.add(file));
                            document.getElementById('article-image').files = dataTransfer.files;
                            this.showNotification('Article image dropped', 'success');
                        } else {
                            this.showNotification('Please drop an image file', 'error');
                        }
                        break;
                    case 'media':
                        this.handleMediaUpload(files);
                        break;
                    case 'apk':
                        this.handleApkZipUpload(files);
                        break;
                }
            });
        });
    }
    
    // Switch tabs
    switchTab(e) {
        const tab = e.currentTarget;
        const tabId = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show the corresponding tab content
        document.getElementById(tabId).classList.add('active');
    }
    
    // Create website project
    async createWebsiteProject() {
        const projectName = document.getElementById('project-name').value.trim();
        const websiteTitle = document.getElementById('website-title').value.trim() || projectName;
        const filesInput = document.getElementById('website-files');
        const files = filesInput.files;
        
        if (!projectName) {
            this.showNotification('Please enter a project name for the URL', 'error');
            return;
        }
        
        // Validate slug (project name)
        const slug = this.slugify(projectName);
        if (!slug) {
            this.showNotification('Invalid project name. Use letters, numbers, and hyphens only.', 'error');
            return;
        }
        
        // Check if slug already exists
        const existing = await this.getWebsite(slug);
        if (existing) {
            this.showNotification('A project with this name already exists. Please choose a different name.', 'error');
            return;
        }
        
        if (files.length === 0) {
            this.showNotification('Please select at least one file for your project', 'error');
            return;
        }
        
        this.showNotification('Creating website project...', 'info');
        
        let htmlContent = '';
        let cssContent = '';
        let jsContent = '';
        
        // Read all files
        for (const file of files) {
            const content = await this.readFileAsText(file);
            
            if (file.name.endsWith('.html')) {
                htmlContent = content;
            } else if (file.name.endsWith('.css')) {
                cssContent = content;
            } else if (file.name.endsWith('.js')) {
                jsContent = content;
            }
        }
        
        // If no HTML file was uploaded, create a basic one
        if (!htmlContent) {
            htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${websiteTitle}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #6c63ff;
            padding-bottom: 10px;
        }
        ${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <h1>${websiteTitle}</h1>
        <p>This website was created with WebHost Pro</p>
        <p>You can edit this HTML by uploading your own HTML file.</p>
    </div>
    <script>
        ${jsContent}
    </script>
</body>
</html>`;
        } else if (cssContent) {
            // Insert CSS into HTML if provided
            if (htmlContent.includes('</head>')) {
                htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
            } else if (htmlContent.includes('<head>')) {
                htmlContent = htmlContent.replace('<head>', `<head><style>${cssContent}</style>`);
            } else {
                htmlContent = `<style>${cssContent}</style>` + htmlContent;
            }
        }
        
        // Insert JS into HTML if provided
        if (jsContent) {
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
            } else if (htmlContent.includes('</html>')) {
                htmlContent = htmlContent.replace('</html>', `<script>${jsContent}</script></html>`);
            } else {
                htmlContent += `<script>${jsContent}</script>`;
            }
        }
        
        // Save project to IndexedDB
        const transaction = this.db.transaction([this.STORES.WEBSITES], 'readwrite');
        const store = transaction.objectStore(this.STORES.WEBSITES);
        
        const project = {
            name: projectName,
            slug: slug,
            title: websiteTitle,
            html: htmlContent,
            css: cssContent,
            js: jsContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const request = store.add(project);
        
        request.onsuccess = () => {
            // Generate public URL
            const publicUrl = `${window.location.origin}${window.location.pathname}?mode=website&slug=${slug}`;
            
            this.showNotification(`Website project created! Public URL: ${publicUrl}`, 'success');
            
            // Copy URL to clipboard
            navigator.clipboard.writeText(publicUrl).then(() => {
                this.showNotification('Public URL copied to clipboard!', 'success');
            });
            
            // Clear form
            document.getElementById('project-name').value = '';
            document.getElementById('website-title').value = '';
            filesInput.value = '';
            
            // Reload projects list
            this.loadWebsiteProjects();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to create project', 'error');
        };
    }
    
    // Publish article
    async publishArticle() {
        const title = document.getElementById('article-title').value.trim();
        const slugInput = document.getElementById('article-slug').value.trim();
        const content = document.getElementById('article-content').value.trim();
        const imageInput = document.getElementById('article-image');
        
        if (!title || !content) {
            this.showNotification('Please enter both title and content', 'error');
            return;
        }
        
        // Generate slug from title if not provided
        let slug = slugInput || this.slugify(title);
        if (!slug) {
            this.showNotification('Invalid article slug. Use letters, numbers, and hyphens only.', 'error');
            return;
        }
        
        // Check if slug already exists
        const existing = await this.getArticle(slug);
        if (existing) {
            this.showNotification('An article with this slug already exists. Please choose a different slug.', 'error');
            return;
        }
        
        this.showNotification('Publishing article...', 'info');
        
        let imageData = null;
        
        // Read image if provided
        if (imageInput.files.length > 0) {
            imageData = await this.readFileAsDataURL(imageInput.files[0]);
        }
        
        // Save article to IndexedDB
        const transaction = this.db.transaction([this.STORES.ARTICLES], 'readwrite');
        const store = transaction.objectStore(this.STORES.ARTICLES);
        
        const article = {
            title: title,
            slug: slug,
            content: content,
            image: imageData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const request = store.add(article);
        
        request.onsuccess = () => {
            // Generate public URL
            const publicUrl = `${window.location.origin}${window.location.pathname}?mode=article&slug=${slug}`;
            
            this.showNotification(`Article published! Public URL: ${publicUrl}`, 'success');
            
            // Copy URL to clipboard
            navigator.clipboard.writeText(publicUrl).then(() => {
                this.showNotification('Article URL copied to clipboard!', 'success');
            });
            
            // Clear form
            document.getElementById('article-title').value = '';
            document.getElementById('article-slug').value = '';
            document.getElementById('article-content').value = '';
            imageInput.value = '';
            
            // Reload articles list
            this.loadArticles();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to publish article', 'error');
        };
    }
    
    // Handle media upload
    async handleMediaUpload(files) {
        const mediaFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );
        
        if (mediaFiles.length === 0) {
            this.showNotification('No valid image or video files selected', 'error');
            return;
        }
        
        this.showNotification(`Uploading ${mediaFiles.length} media file(s)...`, 'info');
        
        for (const file of mediaFiles) {
            await this.saveMediaFile(file);
        }
        
        this.showNotification(`Uploaded ${mediaFiles.length} media file(s)`, 'success');
        this.loadMediaFiles();
    }
    
    // Handle APK/ZIP upload
    async handleApkZipUpload(files) {
        const apkZipFiles = Array.from(files).filter(file => 
            file.name.endsWith('.apk') || 
            file.name.endsWith('.zip') || 
            file.name.endsWith('.rar') || 
            file.name.endsWith('.7z') ||
            file.name.endsWith('.tar.gz')
        );
        
        if (apkZipFiles.length === 0) {
            this.showNotification('No valid APK or ZIP files selected', 'error');
            return;
        }
        
        this.showNotification(`Uploading ${apkZipFiles.length} file(s)...`, 'info');
        
        for (const file of apkZipFiles) {
            await this.saveApkZipFile(file);
        }
        
        this.showNotification(`Uploaded ${apkZipFiles.length} file(s)`, 'success');
        this.loadApkZipFiles();
    }
    
    // Save media file
    saveMediaFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const transaction = this.db.transaction([this.STORES.MEDIA], 'readwrite');
                const store = transaction.objectStore(this.STORES.MEDIA);
                
                const mediaItem = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                const request = store.add(mediaItem);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to save media file');
            };
            
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }
    
    // Save APK/ZIP file
    saveApkZipFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const transaction = this.db.transaction([this.STORES.APK_ZIP], 'readwrite');
                const store = transaction.objectStore(this.STORES.APK_ZIP);
                
                const apkItem = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                const request = store.add(apkItem);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to save file');
            };
            
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }
    
    // Load all data
    loadAllData() {
        this.loadWebsiteProjects();
        this.loadArticles();
        this.loadMediaFiles();
        this.loadApkZipFiles();
    }
    
    // Load website projects
    loadWebsiteProjects() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.WEBSITES], 'readonly');
        const store = transaction.objectStore(this.STORES.WEBSITES);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const projects = request.result;
            const projectList = document.getElementById('website-project-list');
            
            if (projects.length === 0) {
                projectList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h3>No Website Projects Yet</h3>
                        <p>Upload HTML, CSS, and JS files to create your first project</p>
                    </div>
                `;
                return;
            }
            
            projectList.innerHTML = '<h3>Your Website Projects</h3>';
            
            projects.reverse().forEach(project => {
                const publicUrl = `${window.location.origin}${window.location.pathname}?mode=website&slug=${project.slug}`;
                
                const projectElement = document.createElement('div');
                projectElement.className = 'file-item';
                
                projectElement.innerHTML = `
                    <div class="file-info">
                        <div class="file-icon html">
                            <i class="fas fa-code"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">${this.escapeHtml(project.name)}</div>
                            <div style="font-size: 0.85rem; color: var(--gray);">
                                Created: ${new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <a href="${publicUrl}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fas fa-external-link-alt"></i> Open
                        </a>
                        <button class="btn btn-success btn-small copy-link" data-url="${publicUrl}">
                            <i class="fas fa-copy"></i> Copy Link
                        </button>
                        <button class="btn btn-danger btn-small delete-website" data-id="${project.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="link-container" style="width: 100%; margin-top: 10px;">
                        <div class="link-text">${publicUrl}</div>
                    </div>
                `;
                
                projectList.appendChild(projectElement);
            });
            
            // Add event listeners
            this.addWebsiteEventListeners();
        };
    }
    
    // Load articles
    loadArticles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.ARTICLES], 'readonly');
        const store = transaction.objectStore(this.STORES.ARTICLES);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const articles = request.result;
            const articlesList = document.getElementById('articles-list');
            
            if (articles.length === 0) {
                articlesList.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-newspaper"></i>
                        <h3>No Articles Yet</h3>
                        <p>Create and publish your first article</p>
                    </div>
                `;
                return;
            }
            
            articlesList.innerHTML = '';
            
            articles.reverse().forEach(article => {
                const publicUrl = `${window.location.origin}${window.location.pathname}?mode=article&slug=${article.slug}`;
                const excerpt = article.content.length > 150 ? 
                    article.content.substring(0, 150) + '...' : 
                    article.content;
                
                const articleElement = document.createElement('div');
                articleElement.className = 'article-card';
                
                articleElement.innerHTML = `
                    <div class="article-image">
                        ${article.image ? 
                            `<img src="${article.image}" alt="${this.escapeHtml(article.title)}">` : 
                            `<i class="fas fa-newspaper"></i>`
                        }
                    </div>
                    <div class="article-content">
                        <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
                        <div class="article-meta">
                            Published on ${new Date(article.createdAt).toLocaleDateString()}
                        </div>
                        <div class="article-excerpt">
                            ${this.escapeHtml(excerpt)}
                        </div>
                        <div class="article-actions">
                            <a href="${publicUrl}" target="_blank" class="btn btn-primary btn-small">
                                <i class="fas fa-external-link-alt"></i> Open
                            </a>
                            <button class="btn btn-success btn-small copy-article" data-url="${publicUrl}">
                                <i class="fas fa-copy"></i> Copy Link
                            </button>
                            <button class="btn btn-danger btn-small delete-article" data-id="${article.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                
                articlesList.appendChild(articleElement);
            });
            
            // Add event listeners
            this.addArticleEventListeners();
        };
    }
    
    // Load media files
    loadMediaFiles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.MEDIA], 'readonly');
        const store = transaction.objectStore(this.STORES.MEDIA);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const mediaFiles = request.result;
            const mediaList = document.getElementById('media-file-list');
            
            if (mediaFiles.length === 0) {
                mediaList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-photo-video"></i>
                        <h3>No Media Files Yet</h3>
                        <p>Upload images or videos to get started</p>
                    </div>
                `;
                return;
            }
            
            mediaList.innerHTML = '<h3>Your Media Files</h3>';
            
            mediaFiles.reverse().forEach(file => {
                const publicUrl = `${window.location.origin}${window.location.pathname}?mode=media&id=${file.id}`;
                const isImage = file.type.startsWith('image/');
                
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item';
                
                fileElement.innerHTML = `
                    <div class="file-info">
                        <div class="file-icon ${isImage ? 'img' : 'vid'}">
                            <i class="fas ${isImage ? 'fa-image' : 'fa-video'}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">${this.escapeHtml(file.name)}</div>
                            <div style="font-size: 0.85rem; color: var(--gray);">
                                ${isImage ? 'Image' : 'Video'} • ${this.formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <a href="${publicUrl}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fas fa-external-link-alt"></i> ${isImage ? 'View' : 'Play'}
                        </a>
                        <button class="btn btn-success btn-small copy-link" data-url="${publicUrl}">
                            <i class="fas fa-copy"></i> Copy Link
                        </button>
                        <button class="btn btn-danger btn-small delete-media" data-id="${file.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="link-container" style="width: 100%; margin-top: 10px;">
                        <div class="link-text">${publicUrl}</div>
                    </div>
                `;
                
                mediaList.appendChild(fileElement);
            });
            
            // Add event listeners
            this.addMediaEventListeners();
        };
    }
    
    // Load APK/ZIP files
    loadApkZipFiles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.APK_ZIP], 'readonly');
        const store = transaction.objectStore(this.STORES.APK_ZIP);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const files = request.result;
            const fileList = document.getElementById('apk-file-list');
            
            if (files.length === 0) {
                fileList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-archive"></i>
                        <h3>No APK or ZIP Files Yet</h3>
                        <p>Upload APK or ZIP files to get started</p>
                    </div>
                `;
                return;
            }
            
            fileList.innerHTML = '<h3>Your APK & ZIP Files</h3>';
            
            files.reverse().forEach(file => {
                const publicUrl = `${window.location.origin}${window.location.pathname}?mode=download&id=${file.id}`;
                const isApk = file.name.endsWith('.apk');
                
                const fileElement = document.createElement('div');
                fileElement.className = 'file-item';
                
                fileElement.innerHTML = `
                    <div class="file-info">
                        <div class="file-icon ${isApk ? 'apk' : 'zip'}">
                            <i class="fas ${isApk ? 'fa-mobile-alt' : 'fa-file-archive'}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600;">${this.escapeHtml(file.name)}</div>
                            <div style="font-size: 0.85rem; color: var(--gray);">
                                ${isApk ? 'Android APK' : 'Archive'} • ${this.formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <a href="${publicUrl}" target="_blank" class="btn btn-primary btn-small">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <button class="btn btn-success btn-small copy-link" data-url="${publicUrl}">
                            <i class="fas fa-copy"></i> Copy Link
                        </button>
                        <button class="btn btn-danger btn-small delete-apk" data-id="${file.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="link-container" style="width: 100%; margin-top: 10px;">
                        <div class="link-text">${publicUrl}</div>
                    </div>
                `;
                
                fileList.appendChild(fileElement);
            });
            
            // Add event listeners
            this.addApkZipEventListeners();
        };
    }
    
    // Add website event listeners
    addWebsiteEventListeners() {
        // Copy link buttons
        document.querySelectorAll('.copy-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Link copied to clipboard!', 'success');
                });
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-website').forEach(button => {
            button.addEventListener('click', (e) => {
                const projectId = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this project?')) {
                    this.deleteWebsite(projectId);
                }
            });
        });
    }
    
    // Add article event listeners
    addArticleEventListeners() {
        // Copy article link buttons
        document.querySelectorAll('.copy-article').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Article link copied to clipboard!', 'success');
                });
            });
        });
        
        // Delete article buttons
        document.querySelectorAll('.delete-article').forEach(button => {
            button.addEventListener('click', (e) => {
                const articleId = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this article?')) {
                    this.deleteArticle(articleId);
                }
            });
        });
    }
    
    // Add media event listeners
    addMediaEventListeners() {
        // Copy link buttons
        document.querySelectorAll('.copy-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Link copied to clipboard!', 'success');
                });
            });
        });
        
        // Delete media buttons
        document.querySelectorAll('.delete-media').forEach(button => {
            button.addEventListener('click', (e) => {
                const fileId = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this file?')) {
                    this.deleteMediaFile(fileId);
                }
            });
        });
    }
    
    // Add APK/ZIP event listeners
    addApkZipEventListeners() {
        // Copy link buttons
        document.querySelectorAll('.copy-link').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification('Link copied to clipboard!', 'success');
                });
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-apk').forEach(button => {
            button.addEventListener('click', (e) => {
                const fileId = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this file?')) {
                    this.deleteApkZipFile(fileId);
                }
            });
        });
    }
    
    // Get website by slug or ID
    async getWebsite(identifier) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.WEBSITES], 'readonly');
            const store = transaction.objectStore(this.STORES.WEBSITES);
            
            // Try to get by slug first (if identifier is not a number)
            if (isNaN(identifier)) {
                const index = store.index('slug');
                const request = index.get(identifier);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to get website');
            } else {
                // Otherwise get by ID
                const request = store.get(parseInt(identifier));
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to get website');
            }
        });
    }
    
    // Get article by slug or ID
    async getArticle(identifier) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.ARTICLES], 'readonly');
            const store = transaction.objectStore(this.STORES.ARTICLES);
            
            // Try to get by slug first (if identifier is not a number)
            if (isNaN(identifier)) {
                const index = store.index('slug');
                const request = index.get(identifier);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to get article');
            } else {
                // Otherwise get by ID
                const request = store.get(parseInt(identifier));
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject('Failed to get article');
            }
        });
    }
    
    // Get media file by ID
    async getMediaFile(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.MEDIA], 'readonly');
            const store = transaction.objectStore(this.STORES.MEDIA);
            const request = store.get(parseInt(id));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Failed to get media file');
        });
    }
    
    // Get download file by ID
    async getDownloadFile(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.APK_ZIP], 'readonly');
            const store = transaction.objectStore(this.STORES.APK_ZIP);
            const request = store.get(parseInt(id));
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Failed to get file');
        });
    }
    
    // Delete website
    deleteWebsite(id) {
        const transaction = this.db.transaction([this.STORES.WEBSITES], 'readwrite');
        const store = transaction.objectStore(this.STORES.WEBSITES);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            this.showNotification('Website deleted successfully', 'success');
            this.loadWebsiteProjects();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to delete website', 'error');
        };
    }
    
    // Delete article
    deleteArticle(id) {
        const transaction = this.db.transaction([this.STORES.ARTICLES], 'readwrite');
        const store = transaction.objectStore(this.STORES.ARTICLES);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            this.showNotification('Article deleted successfully', 'success');
            this.loadArticles();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to delete article', 'error');
        };
    }
    
    // Delete media file
    deleteMediaFile(id) {
        const transaction = this.db.transaction([this.STORES.MEDIA], 'readwrite');
        const store = transaction.objectStore(this.STORES.MEDIA);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            this.showNotification('Media file deleted successfully', 'success');
            this.loadMediaFiles();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to delete media file', 'error');
        };
    }
    
    // Delete APK/ZIP file
    deleteApkZipFile(id) {
        const transaction = this.db.transaction([this.STORES.APK_ZIP], 'readwrite');
        const store = transaction.objectStore(this.STORES.APK_ZIP);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            this.showNotification('File deleted successfully', 'success');
            this.loadApkZipFiles();
        };
        
        request.onerror = () => {
            this.showNotification('Failed to delete file', 'error');
        };
    }
    
    // Helper: Show notification
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const icon = notification.querySelector('i');
        
        notificationText.textContent = message;
        notification.className = 'notification';
        
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                notification.classList.add('success');
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                notification.classList.add('error');
                break;
            default:
                icon.className = 'fas fa-info-circle';
                notification.classList.add('info');
        }
        
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Helper: Read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject('Failed to read file');
            reader.readAsText(file);
        });
    }
    
    // Helper: Read file as data URL
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject('Failed to read file');
            reader.readAsDataURL(file);
        });
    }
    
    // Helper: Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Helper: Convert string to URL slug
    slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }
    
    // Helper: Download file
    downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Initialize the application
const webHostPro = new WebHostPro();
