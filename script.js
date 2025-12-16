// DOM Elements
const htmlCode = document.getElementById('htmlCode');
const cssCode = document.getElementById('cssCode');
const jsCode = document.getElementById('jsCode');
const outputCode = document.getElementById('outputCode');
const previewFrame = document.getElementById('previewFrame');
const previewPlaceholder = document.getElementById('previewPlaceholder');

// Buttons
const generateBtn = document.getElementById('generateBtn');
const sampleBtn = document.getElementById('sampleBtn');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const refreshPreview = document.getElementById('refreshPreview');

// Clear buttons
const clearHtml = document.getElementById('clearHtml');
const clearCss = document.getElementById('clearCss');
const clearJs = document.getElementById('clearJs');

// Stats elements
const htmlLines = document.getElementById('htmlLines');
const htmlChars = document.getElementById('htmlChars');
const cssLines = document.getElementById('cssLines');
const cssChars = document.getElementById('cssChars');
const jsLines = document.getElementById('jsLines');
const jsChars = document.getElementById('jsChars');
const outputStatus = document.getElementById('outputStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    generateBtn.addEventListener('click', generateCombinedFile);
    sampleBtn.addEventListener('click', loadSampleCode);
    resetBtn.addEventListener('click', resetAll);
    copyBtn.addEventListener('click', copyOutputCode);
    downloadBtn.addEventListener('click', downloadHTMLFile);
    refreshPreview.addEventListener('click', refreshPreviewFrame);
    
    // Clear buttons
    clearHtml.addEventListener('click', () => clearCode('html'));
    clearCss.addEventListener('click', () => clearCode('css'));
    clearJs.addEventListener('click', () => clearCode('js'));
    
    // Update stats on input
    htmlCode.addEventListener('input', updateStats);
    cssCode.addEventListener('input', updateStats);
    jsCode.addEventListener('input', updateStats);
    
    // Initialize stats
    updateStats();
    
    // Set initial placeholder content
    updateOutputCode();
});

// Update character and line counts
function updateStats() {
    // HTML stats
    const htmlText = htmlCode.value;
    htmlLines.textContent = `${htmlText.split('\n').length} lines`;
    htmlChars.textContent = `${htmlText.length} characters`;
    
    // CSS stats
    const cssText = cssCode.value;
    cssLines.textContent = `${cssText.split('\n').length} lines`;
    cssChars.textContent = `${cssText.length} characters`;
    
    // JS stats
    const jsText = jsCode.value;
    jsLines.textContent = `${jsText.split('\n').length} lines`;
    jsChars.textContent = `${jsText.length} characters`;
}

// Clear specific code area
function clearCode(type) {
    switch(type) {
        case 'html':
            htmlCode.value = '';
            break;
        case 'css':
            cssCode.value = '';
            break;
        case 'js':
            jsCode.value = '';
            break;
    }
    updateStats();
}

// Generate the combined HTML file
function generateCombinedFile() {
    const html = htmlCode.value.trim();
    const css = cssCode.value.trim();
    const js = jsCode.value.trim();
    
    // Validate that we have at least HTML code
    if (!html && !css && !js) {
        outputStatus.textContent = 'Please enter some code to combine';
        outputStatus.style.color = '#f72585';
        return;
    }
    
    // Create the combined HTML structure
    let combinedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Frontend Project</title>
    <style>
`;
    
    // Add CSS if provided
    if (css) {
        combinedHTML += css;
    } else {
        combinedHTML += '        /* No CSS provided */';
    }
    
    combinedHTML += `
    </style>
</head>
<body>
`;
    
    // Add HTML if provided
    if (html) {
        combinedHTML += html;
    } else {
        combinedHTML += '    <!-- No HTML provided -->';
    }
    
    combinedHTML += '\n\n';
    
    // Add JavaScript if provided
    if (js) {
        combinedHTML += `    <script>
${js}
    </script>`;
    } else {
        combinedHTML += '    <!-- No JavaScript provided -->';
    }
    
    combinedHTML += '\n</body>\n</html>';
    
    // Update the output code display
    outputCode.textContent = combinedHTML;
    
    // Enable output buttons
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    
    // Update status
    outputStatus.textContent = 'File generated successfully';
    outputStatus.style.color = '#4361ee';
    
    // Update preview
    updatePreview(combinedHTML);
}

// Update the live preview
function updatePreview(htmlContent) {
    // Show the iframe and hide placeholder
    previewFrame.style.display = 'block';
    previewPlaceholder.style.display = 'none';
    
    // Write the HTML to the iframe
    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
}

// Refresh the preview frame
function refreshPreviewFrame() {
    if (outputCode.textContent.includes('<!DOCTYPE html>')) {
        updatePreview(outputCode.textContent);
    }
}

// Update the output code display with template
function updateOutputCode() {
    // This is just the initial template, will be replaced when generating
    outputCode.textContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Combined Frontend Project</title>
    <style>
        /* CSS will be placed here */
    </style>
</head>
<body>
    <!-- HTML will be placed here -->
    
    <script>
        // JavaScript will be placed here
    </script>
</body>
</html>`;
}

// Copy output code to clipboard
function copyOutputCode() {
    const textToCopy = outputCode.textContent;
    
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.style.background = '#4cc9f0';
            copyBtn.style.color = 'white';
            copyBtn.style.borderColor = '#4cc9f0';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
                copyBtn.style.color = '';
                copyBtn.style.borderColor = '';
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy code to clipboard. Please try again.');
        });
}

// Download the generated HTML file
function downloadHTMLFile() {
    const htmlContent = outputCode.textContent;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'combined-frontend-project.html';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Load sample code for demonstration
function loadSampleCode() {
    // HTML sample
    htmlCode.value = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Project</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1><i class="fas fa-rocket"></i> Frontend Code Combiner</h1>
            <p class="subtitle">A tool to merge HTML, CSS, and JavaScript into one file</p>
        </header>
        
        <main class="main-content">
            <div class="card">
                <h2><i class="fas fa-cube"></i> Single File Deployment</h2>
                <p>This is a sample project generated by the Frontend Code Combiner tool. All HTML, CSS, and JavaScript are combined into one file.</p>
                <button id="demoButton" class="btn">
                    <i class="fas fa-magic"></i> Click Me!
                </button>
                <div id="demoOutput" class="output"></div>
            </div>
            
            <div class="features">
                <div class="feature">
                    <i class="fas fa-file-contract"></i>
                    <h3>Single File</h3>
                    <p>Everything in one HTML file for easy deployment.</p>
                </div>
                <div class="feature">
                    <i class="fas fa-unlink"></i>
                    <h3>No Dependencies</h3>
                    <p>No external files needed - completely self-contained.</p>
                </div>
                <div class="feature">
                    <i class="fas fa-bolt"></i>
                    <h3>Fast Loading</h3>
                    <p>Single file means fewer HTTP requests.</p>
                </div>
            </div>
        </main>
        
        <footer class="footer">
            <p>Generated with Frontend Code Combiner &copy; 2023</p>
        </footer>
    </div>
</body>
</html>`;

    // CSS sample
    cssCode.value = `/* Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #333;
    min-height: 100vh;
    padding: 20px;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

/* Header */
.header {
    text-align: center;
    color: white;
    padding: 40px 20px;
    margin-bottom: 40px;
}

.header h1 {
    font-size: 2.8rem;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

.header .subtitle {
    font-size: 1.3rem;
    opacity: 0.9;
    max-width: 600px;
    margin: 0 auto;
}

/* Card */
.card {
    background: white;
    border-radius: 15px;
    padding: 40px;
    margin-bottom: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.card h2 {
    color: #667eea;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

.card p {
    font-size: 1.1rem;
    margin-bottom: 30px;
    color: #666;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Button */
.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 40px;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.3s ease;
    font-weight: 600;
    margin-bottom: 30px;
}

.btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* Output */
.output {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
    border-left: 4px solid #667eea;
    text-align: left;
    display: none;
}

.output.show {
    display: block;
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Features */
.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
}

.feature {
    background: white;
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.feature:hover {
    transform: translateY(-10px);
}

.feature i {
    font-size: 3rem;
    color: #667eea;
    margin-bottom: 20px;
}

.feature h3 {
    color: #333;
    margin-bottom: 15px;
}

.feature p {
    color: #666;
}

/* Footer */
.footer {
    text-align: center;
    color: white;
    padding: 30px;
    margin-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.footer p {
    opacity: 0.9;
}

/* Responsive */
@media (max-width: 768px) {
    .header h1 {
        font-size: 2rem;
        flex-direction: column;
        gap: 10px;
    }
    
    .card {
        padding: 30px 20px;
    }
    
    .features {
        grid-template-columns: 1fr;
    }
}`;

    // JavaScript sample
    jsCode.value = `// Sample JavaScript for the demo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sample project loaded successfully!');
    
    // Get DOM elements
    const demoButton = document.getElementById('demoButton');
    const demoOutput = document.getElementById('demoOutput');
    
    // Button click handler
    demoButton.addEventListener('click', function() {
        // Generate random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        
        // Update button color
        demoButton.style.background = randomColor;
        
        // Show output
        demoOutput.innerHTML = \`
            <h3><i class="fas fa-check-circle"></i> Action Successful!</h3>
            <p>Button color changed to: <strong>\${randomColor}</strong></p>
            <p>Current time: <strong>\${new Date().toLocaleTimeString()}</strong></p>
            <p>This demonstrates that JavaScript is working correctly in the combined file.</p>
        \`;
        demoOutput.classList.add('show');
        
        // Add confetti effect
        createConfetti();
    });
    
    // Simple confetti effect
    function createConfetti() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-20px';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            
            document.body.appendChild(confetti);
            
            // Animate confetti
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: \`translateY(\${window.innerHeight + 20}px) rotate(\${Math.random() * 360}deg)\`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
            });
            
            // Remove confetti after animation
            animation.onfinish = () => {
                confetti.remove();
            };
        }
    }
    
    // Display load message
    demoOutput.innerHTML = '<p><i class="fas fa-info-circle"></i> Click the button above to see JavaScript in action!</p>';
    demoOutput.classList.add('show');
});`;

    // Update stats and generate
    updateStats();
    generateCombinedFile();
}

// Reset all code areas
function resetAll() {
    // Clear all textareas
    htmlCode.value = '';
    cssCode.value = '';
    jsCode.value = '';
    
    // Reset output
    updateOutputCode();
    
    // Disable output buttons
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // Reset status
    outputStatus.textContent = 'Ready to generate';
    outputStatus.style.color = '';
    
    // Hide preview and show placeholder
    previewFrame.style.display = 'none';
    previewPlaceholder.style.display = 'flex';
    
    // Update stats
    updateStats();
}
