// Main Application Class
class WebHostPro {
    constructor() {
        this.db = null;
        this.DB_NAME = "WebHostProDB";
        this.DB_VERSION = 3;
        
        this.STORES = {
            WEBSITES: "websites",
            ARTICLES: "articles",
            MEDIA: "media",
            APK_ZIP: "apk_zip"
        };
        
        this.init();
    }
    
    // Initialize the application
    async init() {
        await this.initDB();
        this.initEventListeners();
        this.loadAllData();
        this.checkUrlForArticle();
        
        // Show welcome notification
        setTimeout(() => {
            this.showNotification("Welcome to WebHost Pro! All data is stored locally in your browser.", "info");
        }, 1000);
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
                
                // Create object stores if they don't exist
                const objectStores = this.db.objectStoreNames;
                
                if (!objectStores.contains(this.STORES.WEBSITES)) {
                    this.db.createObjectStore(this.STORES.WEBSITES, { keyPath: "id", autoIncrement: true });
                }
                
                if (!objectStores.contains(this.STORES.ARTICLES)) {
                    this.db.createObjectStore(this.STORES.ARTICLES, { keyPath: "id", autoIncrement: true });
                }
                
                if (!objectStores.contains(this.STORES.MEDIA)) {
                    this.db.createObjectStore(this.STORES.MEDIA, { keyPath: "id", autoIncrement: true });
                }
                
                if (!objectStores.contains(this.STORES.APK_ZIP)) {
                    this.db.createObjectStore(this.STORES.APK_ZIP, { keyPath: "id", autoIncrement: true });
                }
                
                console.log("Database schema created/updated");
            };
        });
    }
    
    // Initialize all event listeners
    initEventListeners() {
        // Tab switching
        document.querySelectorAll(".tab").forEach(tab => {
            tab.addEventListener("click", (e) => this.switchTab(e));
        });
        
        // Website hosting
        const websiteUploadArea = document.getElementById("website-upload-area");
        const websiteUploadBtn = document.getElementById("website-upload-btn");
        const websiteFilesInput = document.getElementById("website-files");
        
        websiteUploadArea.addEventListener("click", () => websiteFilesInput.click());
        websiteUploadBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            websiteFilesInput.click();
        });
        
        websiteFilesInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                this.showNotification(`Selected ${e.target.files.length} file(s) for website hosting`, "success");
            }
        });
        
        document.getElementById("create-project").addEventListener("click", () => this.createWebsiteProject());
        
        // Article hosting
        const articleUploadArea = document.getElementById("article-upload-area");
        const articleImageBtn = document.getElementById("article-image-btn");
        const articleImageInput = document.getElementById("article-image");
        
        articleUploadArea.addEventListener("click", () => articleImageInput.click());
        articleImageBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            articleImageInput.click();
        });
        
        document.getElementById("publish-article").addEventListener("click", () => this.publishArticle());
        
        // Media hosting
        const mediaUploadArea = document.getElementById("media-upload-area");
        const mediaUploadBtn = document.getElementById("media-upload-btn");
        const mediaFilesInput = document.getElementById("media-files");
        
        mediaUploadArea.addEventListener("click", () => mediaFilesInput.click());
        mediaUploadBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            mediaFilesInput.click();
        });
        
        mediaFilesInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                this.handleMediaUpload(e.target.files);
            }
        });
        
        // APK/ZIP hosting
        const apkUploadArea = document.getElementById("apk-upload-area");
        const apkUploadBtn = document.getElementById("apk-upload-btn");
        const apkFilesInput = document.getElementById("apk-files");
        
        apkUploadArea.addEventListener("click", () => apkFilesInput.click());
        apkUploadBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            apkFilesInput.click();
        });
        
        apkFilesInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                this.handleApkZipUpload(e.target.files);
            }
        });
        
        // Modals
        document.querySelector(".close-modal").addEventListener("click", () => this.closeModal());
        document.querySelector(".close-article-modal").addEventListener("click", () => this.closeArticleModal());
        document.getElementById("copy-article-link").addEventListener("click", () => this.copyArticleLink());
        
        // Initialize drag and drop
        this.initDragAndDrop();
    }
    
    // Initialize drag and drop functionality
    initDragAndDrop() {
        const uploadAreas = [
            { id: "website-upload-area", type: "website" },
            { id: "article-upload-area", type: "article" },
            { id: "media-upload-area", type: "media" },
            { id: "apk-upload-area", type: "apk" }
        ];
        
        uploadAreas.forEach(area => {
            const element = document.getElementById(area.id);
            
            element.addEventListener("dragover", (e) => {
                e.preventDefault();
                element.style.borderColor = "var(--secondary)";
                element.style.backgroundColor = "rgba(108, 99, 255, 0.1)";
            });
            
            element.addEventListener("dragleave", () => {
                element.style.borderColor = "var(--primary)";
                element.style.backgroundColor = "rgba(108, 99, 255, 0.03)";
            });
            
            element.addEventListener("drop", (e) => {
                e.preventDefault();
                element.style.borderColor = "var(--primary)";
                element.style.backgroundColor = "rgba(108, 99, 255, 0.03)";
                
                const files = e.dataTransfer.files;
                
                switch(area.type) {
                    case "website":
                        document.getElementById("website-files").files = files;
                        if (files.length > 0) {
                            this.showNotification(`Dropped ${files.length} file(s) for website hosting`, "success");
                        }
                        break;
                    case "article":
                        const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
                        if (imageFiles.length > 0) {
                            const dataTransfer = new DataTransfer();
                            imageFiles.forEach(file => dataTransfer.items.add(file));
                            document.getElementById("article-image").files = dataTransfer.files;
                            this.showNotification("Article image dropped", "success");
                        } else {
                            this.showNotification("Please drop an image file", "error");
                        }
                        break;
                    case "media":
                        this.handleMediaUpload(files);
                        break;
                    case "apk":
                        this.handleApkZipUpload(files);
                        break;
                }
            });
        });
    }
    
    // Switch between tabs
    switchTab(e) {
        const tab = e.currentTarget;
        const tabId = tab.getAttribute("data-tab");
        
        // Remove active class from all tabs
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        
        // Add active class to clicked tab
        tab.classList.add("active");
        
        // Hide all tab contents
        document.querySelectorAll(".tab-content").forEach(content => {
            content.classList.remove("active");
        });
        
        // Show the corresponding tab content
        document.getElementById(tabId).classList.add("active");
    }
    
    // Show notification
    showNotification(message, type = "success") {
        const notification = document.getElementById("notification");
        const notificationText = document.getElementById("notification-text");
        const icon = notification.querySelector("i");
        
        notificationText.textContent = message;
        notification.className = "notification";
        
        // Set icon based on type
        switch(type) {
            case "success":
                icon.className = "fas fa-check-circle";
                notification.classList.add("success");
                break;
            case "error":
                icon.className = "fas fa-exclamation-circle";
                notification.classList.add("error");
                break;
            default:
                icon.className = "fas fa-info-circle";
                notification.classList.add("info");
        }
        
        notification.classList.add("show");
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }
    
    // Create website project
    async createWebsiteProject() {
        const projectName = document.getElementById("project-name").value.trim() || "Unnamed Project";
        const filesInput = document.getElementById("website-files");
        const files = filesInput.files;
        
        if (files.length === 0) {
            this.showNotification("Please select at least one file for your project", "error");
            return;
        }
        
        this.showNotification("Creating website project...", "info");
        
        let htmlContent = "";
        let cssContent = "";
        let jsContent = "";
        
        // Read all files
        for (const file of files) {
            const content = await this.readFileAsText(file);
            
            if (file.name.endsWith(".html")) {
                htmlContent = content;
            } else if (file.name.endsWith(".css")) {
                cssContent = content;
            } else if (file.name.endsWith(".js")) {
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
    <title>${projectName}</title>
    <style>${cssContent}</style>
</head>
<body>
    <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>${projectName}</h1>
        <p>This website was created with WebHost Pro</p>
        <p>You can edit this HTML by uploading your own HTML file.</p>
    </div>
    <script>${jsContent}</script>
</body>
</html>`;
        } else if (cssContent) {
            // Insert CSS into HTML if provided
            if (htmlContent.includes("</head>")) {
                htmlContent = htmlContent.replace("</head>", `<style>${cssContent}</style></head>`);
            } else {
                htmlContent = `<style>${cssContent}</style>` + htmlContent;
            }
        }
        
        // Insert JS into HTML if provided
        if (jsContent) {
            if (htmlContent.includes("</body>")) {
                htmlContent = htmlContent.replace("</body>", `<script>${jsContent}</script></body>`);
            } else if (htmlContent.includes("</html>")) {
                htmlContent = htmlContent.replace("</html>", `<script>${jsContent}</script></html>`);
            } else {
                htmlContent += `<script>${jsContent}</script>`;
            }
        }
        
        // Save project to IndexedDB
        const transaction = this.db.transaction([this.STORES.WEBSITES], "readwrite");
        const store = transaction.objectStore(this.STORES.WEBSITES);
        
        const project = {
            name: projectName,
            html: htmlContent,
            css: cssContent,
            js: jsContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const request = store.add(project);
        
        request.onsuccess = () => {
            this.showNotification("Website project created successfully!", "success");
            document.getElementById("project-name").value = "";
            filesInput.value = "";
            this.loadWebsiteProjects();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to create project", "error");
        };
    }
    
    // Publish article
    async publishArticle() {
        const title = document.getElementById("article-title").value.trim();
        const content = document.getElementById("article-content").value.trim();
        const imageInput = document.getElementById("article-image");
        
        if (!title || !content) {
            this.showNotification("Please enter both title and content", "error");
            return;
        }
        
        this.showNotification("Publishing article...", "info");
        
        let imageData = null;
        
        // Read image if provided
        if (imageInput.files.length > 0) {
            imageData = await this.readFileAsDataURL(imageInput.files[0]);
        }
        
        // Save article to IndexedDB
        const transaction = this.db.transaction([this.STORES.ARTICLES], "readwrite");
        const store = transaction.objectStore(this.STORES.ARTICLES);
        
        const article = {
            title: title,
            content: content,
            image: imageData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const request = store.add(article);
        
        request.onsuccess = () => {
            this.showNotification("Article published successfully!", "success");
            document.getElementById("article-title").value = "";
            document.getElementById("article-content").value = "";
            imageInput.value = "";
            this.loadArticles();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to publish article", "error");
        };
    }
    
    // Handle media file upload
    async handleMediaUpload(files) {
        const mediaFiles = Array.from(files).filter(file => 
            file.type.startsWith("image/") || file.type.startsWith("video/")
        );
        
        if (mediaFiles.length === 0) {
            this.showNotification("No valid image or video files selected", "error");
            return;
        }
        
        this.showNotification(`Uploading ${mediaFiles.length} media file(s)...`, "info");
        
        for (const file of mediaFiles) {
            await this.saveMediaFile(file);
        }
        
        this.showNotification(`Uploaded ${mediaFiles.length} media file(s)`, "success");
        this.loadMediaFiles();
    }
    
    // Handle APK/ZIP file upload
    async handleApkZipUpload(files) {
        const apkZipFiles = Array.from(files).filter(file => 
            file.name.endsWith(".apk") || 
            file.name.endsWith(".zip") || 
            file.name.endsWith(".rar") || 
            file.name.endsWith(".7z")
        );
        
        if (apkZipFiles.length === 0) {
            this.showNotification("No valid APK or ZIP files selected", "error");
            return;
        }
        
        this.showNotification(`Uploading ${apkZipFiles.length} file(s)...`, "info");
        
        for (const file of apkZipFiles) {
            await this.saveApkZipFile(file);
        }
        
        this.showNotification(`Uploaded ${apkZipFiles.length} file(s)`, "success");
        this.loadApkZipFiles();
    }
    
    // Save media file to IndexedDB
    saveMediaFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const transaction = this.db.transaction([this.STORES.MEDIA], "readwrite");
                const store = transaction.objectStore(this.STORES.MEDIA);
                
                const mediaItem = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                const request = store.add(mediaItem);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject("Failed to save media file");
            };
            
            reader.onerror = () => reject("Failed to read file");
            reader.readAsDataURL(file);
        });
    }
    
    // Save APK/ZIP file to IndexedDB
    saveApkZipFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const transaction = this.db.transaction([this.STORES.APK_ZIP], "readwrite");
                const store = transaction.objectStore(this.STORES.APK_ZIP);
                
                const apkItem = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                const request = store.add(apkItem);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject("Failed to save file");
            };
            
            reader.onerror = () => reject("Failed to read file");
            reader.readAsDataURL(file);
        });
    }
    
    // Load all data from IndexedDB
    loadAllData() {
        this.loadWebsiteProjects();
        this.loadArticles();
        this.loadMediaFiles();
        this.loadApkZipFiles();
    }
    
    // Load website projects
    loadWebsiteProjects() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.WEBSITES], "readonly");
        const store = transaction.objectStore(this.STORES.WEBSITES);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const projects = request.result;
            const projectList = document.getElementById("website-project-list");
            
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
            
            projectList.innerHTML = "<h3>Your Website Projects</h3>";
            
            projects.reverse().forEach(project => {
                const projectElement = document.createElement("div");
                projectElement.className = "card";
                projectElement.style.marginTop = "15px";
                
                // Create preview URL
                const blob = new Blob([project.html || "<h1>No HTML content</h1>"], { type: "text/html" });
                const previewUrl = URL.createObjectURL(blob);
                
                // Count files
                const fileCount = (project.html ? 1 : 0) + 
                                 (project.css ? 1 : 0) + 
                                 (project.js ? 1 : 0);
                
                projectElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0;">${this.escapeHtml(project.name || "Unnamed Project")}</h4>
                        <span class="btn btn-secondary btn-small">${fileCount} file(s)</span>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        ${project.html ? '<span class="btn btn-secondary btn-small"><i class="fab fa-html5"></i> HTML</span>' : ''}
                        ${project.css ? '<span class="btn btn-secondary btn-small"><i class="fab fa-css3-alt"></i> CSS</span>' : ''}
                        ${project.js ? '<span class="btn btn-secondary btn-small"><i class="fab fa-js"></i> JavaScript</span>' : ''}
                    </div>
                    
                    <div class="link-container">
                        <div class="link-text">Preview URL: <a href="${previewUrl}" target="_blank">${window.location.origin}/project/${project.id}</a></div>
                        <button class="btn btn-primary btn-small copy-link" data-url="${window.location.origin}/project/${project.id}">
                            <i class="fas fa-copy"></i> Copy Link
                        </button>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        <button class="btn btn-success btn-small preview-website" data-url="${previewUrl}">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-warning btn-small download-website" data-id="${project.id}">
                            <i class="fas fa-download"></i> Download Project
                        </button>
                        <button class="btn btn-danger btn-small delete-website" data-id="${project.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                projectList.appendChild(projectElement);
            });
            
            // Add event listeners for the buttons
            this.addWebsiteEventListeners();
        };
    }
    
    // Load articles
    loadArticles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.ARTICLES], "readonly");
        const store = transaction.objectStore(this.STORES.ARTICLES);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const articles = request.result;
            const articlesList = document.getElementById("articles-list");
            
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
            
            articlesList.innerHTML = "";
            
            articles.reverse().forEach(article => {
                const articleElement = document.createElement("div");
                articleElement.className = "article-card";
                
                // Create article URL
                const articleUrl = `${window.location.origin}?article=${article.id}`;
                const excerpt = article.content.length > 150 ? 
                    article.content.substring(0, 150) + "..." : 
                    article.content;
                
                articleElement.innerHTML = `
                    <div class="article-image">
                        ${article.image ? 
                            `<img src="${article.image}" alt="${this.escapeHtml(article.title)}">` : 
                            `<i class="fas fa-newspaper"></i>`
                        }
                    </div>
                    <div class="article-content">
                        <h3 class="article-title">${this.escapeHtml(article.title || "Untitled Article")}</h3>
                        <div class="article-meta">
                            Published on ${new Date(article.createdAt).toLocaleDateString()}
                        </div>
                        <div class="article-excerpt">
                            ${this.escapeHtml(excerpt)}
                        </div>
                        <div class="article-actions">
                            <button class="btn btn-primary btn-small view-article" data-id="${article.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-secondary btn-small copy-article" data-url="${articleUrl}">
                                <i class="fas fa-copy"></i> Copy Link
                            </button>
                            <button class="btn btn-danger btn-small delete-article" data-id="${article.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                articlesList.appendChild(articleElement);
            });
            
            // Add event listeners for article buttons
            this.addArticleEventListeners();
        };
    }
    
    // Load media files
    loadMediaFiles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.MEDIA], "readonly");
        const store = transaction.objectStore(this.STORES.MEDIA);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const mediaFiles = request.result;
            const mediaList = document.getElementById("media-file-list");
            
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
            
            mediaList.innerHTML = "<h3>Your Media Files</h3>";
            
            mediaFiles.reverse().forEach(file => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                
                const fileElement = document.createElement("div");
                fileElement.className = "file-item";
                
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
                        <button class="btn btn-primary btn-small download-file" data-url="${file.data}" data-filename="${file.name}">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-danger btn-small delete-media" data-id="${file.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                mediaList.appendChild(fileElement);
            });
            
            // Add event listeners for file actions
            this.addFileEventListeners();
        };
    }
    
    // Load APK/ZIP files
    loadApkZipFiles() {
        if (!this.db) return;
        
        const transaction = this.db.transaction([this.STORES.APK_ZIP], "readonly");
        const store = transaction.objectStore(this.STORES.APK_ZIP);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const files = request.result;
            const fileList = document.getElementById("apk-file-list");
            
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
            
            fileList.innerHTML = "<h3>Your APK & ZIP Files</h3>";
            
            files.reverse().forEach(file => {
                const isApk = file.name.endsWith(".apk");
                const isZip = file.name.endsWith(".zip") || file.name.endsWith(".rar") || file.name.endsWith(".7z");
                
                const fileElement = document.createElement("div");
                fileElement.className = "file-item";
                
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
                        <button class="btn btn-primary btn-small download-file" data-url="${file.data}" data-filename="${file.name}">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-danger btn-small delete-apk" data-id="${file.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                fileList.appendChild(fileElement);
            });
            
            // Add event listeners for file actions
            this.addFileEventListeners();
        };
    }
    
    // Add event listeners for website project buttons
    addWebsiteEventListeners() {
        // Copy link buttons
        document.querySelectorAll(".copy-link").forEach(button => {
            button.addEventListener("click", (e) => {
                const url = e.currentTarget.getAttribute("data-url");
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification("Link copied to clipboard!", "success");
                });
            });
        });
        
        // Preview buttons
        document.querySelectorAll(".preview-website").forEach(button => {
            button.addEventListener("click", (e) => {
                const url = e.currentTarget.getAttribute("data-url");
                this.previewWebsite(url);
            });
        });
        
        // Download buttons
        document.querySelectorAll(".download-website").forEach(button => {
            button.addEventListener("click", async (e) => {
                const projectId = parseInt(e.currentTarget.getAttribute("data-id"));
                await this.downloadWebsiteProject(projectId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll(".delete-website").forEach(button => {
            button.addEventListener("click", (e) => {
                const projectId = parseInt(e.currentTarget.getAttribute("data-id"));
                if (confirm("Are you sure you want to delete this project?")) {
                    this.deleteWebsiteProject(projectId);
                }
            });
        });
    }
    
    // Add event listeners for article buttons
    addArticleEventListeners() {
        // View article buttons
        document.querySelectorAll(".view-article").forEach(button => {
            button.addEventListener("click", async (e) => {
                const articleId = parseInt(e.currentTarget.getAttribute("data-id"));
                await this.viewArticle(articleId);
            });
        });
        
        // Copy article link buttons
        document.querySelectorAll(".copy-article").forEach(button => {
            button.addEventListener("click", (e) => {
                const url = e.currentTarget.getAttribute("data-url");
                navigator.clipboard.writeText(url).then(() => {
                    this.showNotification("Article link copied to clipboard!", "success");
                });
            });
        });
        
        // Delete article buttons
        document.querySelectorAll(".delete-article").forEach(button => {
            button.addEventListener("click", (e) => {
                const articleId = parseInt(e.currentTarget.getAttribute("data-id"));
                if (confirm("Are you sure you want to delete this article?")) {
                    this.deleteArticle(articleId);
                }
            });
        });
    }
    
    // Add event listeners for file actions
    addFileEventListeners() {
        // Download file buttons
        document.querySelectorAll(".download-file").forEach(button => {
            button.addEventListener("click", (e) => {
                const url = e.currentTarget.getAttribute("data-url");
                const filename = e.currentTarget.getAttribute("data-filename");
                this.downloadFile(url, filename);
            });
        });
        
        // Delete media buttons
        document.querySelectorAll(".delete-media").forEach(button => {
            button.addEventListener("click", (e) => {
                const fileId = parseInt(e.currentTarget.getAttribute("data-id"));
                if (confirm("Are you sure you want to delete this file?")) {
                    this.deleteMediaFile(fileId);
                }
            });
        });
        
        // Delete APK/ZIP buttons
        document.querySelectorAll(".delete-apk").forEach(button => {
            button.addEventListener("click", (e) => {
                const fileId = parseInt(e.currentTarget.getAttribute("data-id"));
                if (confirm("Are you sure you want to delete this file?")) {
                    this.deleteApkZipFile(fileId);
                }
            });
        });
    }
    
    // Preview website in modal
    previewWebsite(url) {
        const modal = document.getElementById("preview-modal");
        const iframe = document.getElementById("preview-frame");
        
        iframe.src = url;
        modal.classList.add("active");
        
        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    
    // Close preview modal
    closeModal() {
        const modal = document.getElementById("preview-modal");
        const iframe = document.getElementById("preview-frame");
        
        iframe.src = "";
        modal.classList.remove("active");
    }
    
    // View article in modal
    async viewArticle(articleId) {
        const article = await this.getArticleById(articleId);
        if (!article) return;
        
        const modal = document.getElementById("article-modal");
        const title = document.getElementById("article-modal-title");
        const image = document.getElementById("article-modal-image");
        const content = document.getElementById("article-modal-content");
        const link = document.getElementById("article-modal-link");
        
        // Set article data
        title.textContent = article.title;
        
        if (article.image) {
            image.innerHTML = `<img src="${article.image}" alt="${this.escapeHtml(article.title)}">`;
        } else {
            image.innerHTML = '<i class="fas fa-newspaper"></i>';
        }
        
        content.innerHTML = article.content.replace(/\n/g, '<br>');
        
        const articleUrl = `${window.location.origin}?article=${article.id}`;
        link.textContent = `Share: ${articleUrl}`;
        
        // Store the URL for copying
        link.setAttribute("data-url", articleUrl);
        
        // Show modal
        modal.classList.add("active");
        
        // Close modal when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.closeArticleModal();
            }
        });
    }
    
    // Close article modal
    closeArticleModal() {
        const modal = document.getElementById("article-modal");
        modal.classList.remove("active");
    }
    
    // Copy article link from modal
    copyArticleLink() {
        const link = document.getElementById("article-modal-link");
        const url = link.getAttribute("data-url");
        
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification("Article link copied to clipboard!", "success");
        });
    }
    
    // Get article by ID
    getArticleById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database not initialized");
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.ARTICLES], "readonly");
            const store = transaction.objectStore(this.STORES.ARTICLES);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to get article");
        });
    }
    
    // Download website project
    async downloadWebsiteProject(projectId) {
        const project = await new Promise((resolve, reject) => {
            if (!this.db) {
                reject("Database not initialized");
                return;
            }
            
            const transaction = this.db.transaction([this.STORES.WEBSITES], "readonly");
            const store = transaction.objectStore(this.STORES.WEBSITES);
            const request = store.get(projectId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to get project");
        });
        
        if (!project) return;
        
        // Create a ZIP file with all project files
        const zipContent = `
Project: ${project.name}
Created: ${new Date(project.createdAt).toLocaleString()}
Updated: ${new Date(project.updatedAt).toLocaleString()}

=== index.html ===
${project.html || "No HTML content"}

${project.css ? `=== style.css ===
${project.css}` : ''}

${project.js ? `=== script.js ===
${project.js}` : ''}
        `;
        
        const blob = new Blob([zipContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        this.downloadFile(url, `${project.name.replace(/\s+/g, '_')}_project.txt`);
    }
    
    // Delete website project
    deleteWebsiteProject(projectId) {
        const transaction = this.db.transaction([this.STORES.WEBSITES], "readwrite");
        const store = transaction.objectStore(this.STORES.WEBSITES);
        const request = store.delete(projectId);
        
        request.onsuccess = () => {
            this.showNotification("Project deleted successfully", "success");
            this.loadWebsiteProjects();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to delete project", "error");
        };
    }
    
    // Delete article
    deleteArticle(articleId) {
        const transaction = this.db.transaction([this.STORES.ARTICLES], "readwrite");
        const store = transaction.objectStore(this.STORES.ARTICLES);
        const request = store.delete(articleId);
        
        request.onsuccess = () => {
            this.showNotification("Article deleted successfully", "success");
            this.loadArticles();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to delete article", "error");
        };
    }
    
    // Delete media file
    deleteMediaFile(fileId) {
        const transaction = this.db.transaction([this.STORES.MEDIA], "readwrite");
        const store = transaction.objectStore(this.STORES.MEDIA);
        const request = store.delete(fileId);
        
        request.onsuccess = () => {
            this.showNotification("Media file deleted successfully", "success");
            this.loadMediaFiles();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to delete media file", "error");
        };
    }
    
    // Delete APK/ZIP file
    deleteApkZipFile(fileId) {
        const transaction = this.db.transaction([this.STORES.APK_ZIP], "readwrite");
        const store = transaction.objectStore(this.STORES.APK_ZIP);
        const request = store.delete(fileId);
        
        request.onsuccess = () => {
            this.showNotification("File deleted successfully", "success");
            this.loadApkZipFiles();
        };
        
        request.onerror = () => {
            this.showNotification("Failed to delete file", "error");
        };
    }
    
    // Download file
    downloadFile(url, filename) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showNotification(`Downloading ${filename}`, "success");
    }
    
    // Check if URL has article parameter and show it
    checkUrlForArticle() {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get("article");
        
        if (articleId && this.db) {
            // Load and display the specific article
            this.viewArticle(parseInt(articleId));
            
            // Remove the article parameter from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }
    
    // Helper function to read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject("Failed to read file");
            reader.readAsText(file);
        });
    }
    
    // Helper function to read file as data URL
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject("Failed to read file");
            reader.readAsDataURL(file);
        });
    }
    
    // Helper function to format file size
    formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
    
    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.webHostPro = new WebHostPro();
});
