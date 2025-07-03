// OCR Handler for BoltDIY Platform
// Enhanced version with AI analysis

class OCRHandler {
    constructor() {
        this.isInitialized = false;
        this.currentImage = null;
        this.results = null;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }

    initialize() {
        console.log('🔍 Initializing OCR Handler...');
        this.setupDropZone();
        this.setupImageInput();
        this.isInitialized = true;
        console.log('✅ OCR Handler initialized');
    }

    setupDropZone() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
            
            const files = Array.from(e.dataTransfer.files);
            const imageFile = files.find(file => this.supportedFormats.includes(file.type));
            
            if (imageFile) {
                this.processImage(imageFile);
            } else {
                this.showError('Please drop a valid image file (JPEG, PNG, WebP, GIF)');
            }
        });
    }

    setupImageInput() {
        const imageInput = document.getElementById('image-input');
        if (!imageInput) return;

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && this.supportedFormats.includes(file.type)) {
                this.processImage(file);
            } else {
                this.showError('Please select a valid image file');
            }
        });
    }

    async processImage(file) {
        if (!file || !this.supportedFormats.includes(file.type)) {
            this.showError('Unsupported file format');
            return;
        }

        this.showProcessing();
        this.currentImage = file;

        try {
            // Show image preview
            await this.showImagePreview(file);
            
            // Process with Tesseract.js
            const text = await this.extractText(file);
            
            // Analyze with AI if enabled
            const analysis = await this.analyzeWithAI(text, file.name);
            
            // Display results
            this.displayResults(text, analysis);
            
        } catch (error) {
            console.error('OCR Error:', error);
            this.showError(`OCR failed: ${error.message}`);
        }
    }

    async showImagePreview(file) {
        const previewContainer = document.getElementById('image-preview');
        if (!previewContainer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div class="relative">
                    <img src="${e.target.result}" alt="Preview" class="max-w-full max-h-64 rounded border">
                    <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        ${(file.size / 1024).toFixed(1)} KB
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    async extractText(file) {
        if (!window.Tesseract) {
            throw new Error('Tesseract.js not loaded');
        }

        const progressElement = document.getElementById('ocr-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');

        return new Promise((resolve, reject) => {
            window.Tesseract.recognize(file, 'eng+ara', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        if (progressBar) progressBar.style.width = `${progress}%`;
                        if (progressText) progressText.textContent = `Processing... ${progress}%`;
                    }
                }
            }).then(({ data: { text } }) => {
                resolve(text);
            }).catch(reject);
        });
    }

    async analyzeWithAI(text, filename) {
        if (!text.trim() || !window.aiAgent) {
            return null;
        }

        try {
            const prompt = `Analyze this extracted text from image "${filename}" and provide:
1. Text type (code, document, form, etc.)
2. Programming language (if code)
3. Key insights or improvements
4. Suggested next actions

Text:
${text}`;

            const analysis = await window.aiAgent.processMessage(prompt);
            return analysis;
        } catch (error) {
            console.warn('AI analysis failed:', error);
            return null;
        }
    }

    displayResults(text, analysis) {
        const resultsContainer = document.getElementById('ocr-results');
        if (!resultsContainer) return;

        this.results = { text, analysis };

        // Detect if text looks like code
        const isCode = this.detectCodeType(text);
        const language = isCode ? this.detectProgrammingLanguage(text) : 'text';

        resultsContainer.innerHTML = `
            <div class="space-y-4">
                <!-- Extracted Text -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="font-semibold text-gray-200">Extracted Text</h3>
                        <div class="flex gap-2">
                            <button onclick="ocrHandler.copyText()" 
                                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                                <i class="fas fa-copy mr-1"></i> Copy
                            </button>
                            ${isCode ? `
                                <button onclick="ocrHandler.createFileFromText()" 
                                        class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors">
                                    <i class="fas fa-file-code mr-1"></i> Create File
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="bg-gray-800 rounded p-3 max-h-40 overflow-y-auto">
                        <pre class="text-sm text-gray-300 whitespace-pre-wrap">${text}</pre>
                    </div>
                    ${isCode ? `<div class="text-xs text-blue-400 mt-1">Detected: ${language}</div>` : ''}
                </div>

                <!-- AI Analysis -->
                ${analysis ? `
                    <div>
                        <h3 class="font-semibold text-gray-200 mb-2">AI Analysis</h3>
                        <div class="bg-gray-800 rounded p-3">
                            <div class="text-sm text-gray-300 whitespace-pre-wrap">${analysis}</div>
                        </div>
                    </div>
                ` : ''}

                <!-- Actions -->
                <div class="flex flex-wrap gap-2">
                    <button onclick="ocrHandler.enhanceText()" 
                            class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors">
                        <i class="fas fa-magic mr-1"></i> Enhance with AI
                    </button>
                    <button onclick="ocrHandler.translateText()" 
                            class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors">
                        <i class="fas fa-language mr-1"></i> Translate
                    </button>
                    <button onclick="ocrHandler.processAnother()" 
                            class="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors">
                        <i class="fas fa-plus mr-1"></i> Process Another
                    </button>
                </div>
            </div>
        `;

        this.hideProcessing();
    }

    detectCodeType(text) {
        const codeIndicators = [
            /function\s*\w*\s*\(/i,
            /class\s+\w+/i,
            /import\s+.*from/i,
            /\w+\s*=\s*\w+\(/i,
            /<\w+.*>/,
            /def\s+\w+\s*\(/i,
            /\{\s*[\w\s:"',]+\}/,
            /\$\w+/,
            /console\.log/i,
            /print\s*\(/i
        ];

        return codeIndicators.some(pattern => pattern.test(text));
    }

    detectProgrammingLanguage(text) {
        const patterns = {
            javascript: [/function\s*\w*\s*\(/, /console\.log/, /const\s+\w+/, /=>\s*{/],
            python: [/def\s+\w+\s*\(/, /import\s+\w+/, /print\s*\(/, /if\s+__name__/],
            html: [/<html/, /<div/, /<body/, /<head/],
            css: [/\w+\s*{/, /color\s*:/, /margin\s*:/, /@media/],
            java: [/public\s+class/, /public\s+static\s+void/, /System\.out/],
            cpp: [/#include/, /int\s+main\s*\(/, /std::/],
            sql: [/SELECT\s+/, /FROM\s+/, /WHERE\s+/, /INSERT\s+INTO/i]
        };

        for (const [lang, langPatterns] of Object.entries(patterns)) {
            if (langPatterns.some(pattern => pattern.test(text))) {
                return lang;
            }
        }

        return 'text';
    }

    copyText() {
        if (this.results?.text) {
            navigator.clipboard.writeText(this.results.text);
            if (window.app) {
                window.app.showToast('Text copied to clipboard', 'success');
            }
        }
    }

    async createFileFromText() {
        if (!this.results?.text || !window.app) return;

        const language = this.detectProgrammingLanguage(this.results.text);
        const extension = this.getFileExtension(language);
        const filename = prompt(`Enter filename (will be saved as .${extension}):`, `extracted-code.${extension}`);
        
        if (filename) {
            // Create file in app
            const fullPath = filename.includes('/') ? filename : `src/${filename}`;
            
            window.app.fileSystem.set(fullPath, {
                content: this.results.text,
                language: language
            });
            
            window.app.updateFileTree();
            window.app.openFile(fullPath);
            window.app.showToast(`Created file: ${filename}`, 'success');
            
            // Close OCR modal
            window.app.closeModal('ocr-modal');
        }
    }

    getFileExtension(language) {
        const extensions = {
            javascript: 'js',
            typescript: 'ts',
            python: 'py',
            html: 'html',
            css: 'css',
            java: 'java',
            cpp: 'cpp',
            sql: 'sql',
            json: 'json'
        };
        return extensions[language] || 'txt';
    }

    async enhanceText() {
        if (!this.results?.text || !window.aiAgent) return;

        try {
            const prompt = `Please enhance and clean up this extracted text, fixing any OCR errors and improving formatting:

${this.results.text}`;

            const enhanced = await window.aiAgent.processMessage(prompt);
            
            // Update results display
            this.displayResults(enhanced, this.results.analysis);
            
            if (window.app) {
                window.app.showToast('Text enhanced with AI', 'success');
            }
        } catch (error) {
            console.error('Enhancement failed:', error);
            if (window.app) {
                window.app.showToast('Enhancement failed', 'error');
            }
        }
    }

    async translateText() {
        if (!this.results?.text || !window.aiAgent) return;

        const targetLang = prompt('Translate to (en/ar/es/fr/de):');
        if (!targetLang) return;

        try {
            const prompt = `Translate this text to ${targetLang}:

${this.results.text}`;

            const translated = await window.aiAgent.processMessage(prompt);
            
            // Show translation in a modal or toast
            if (window.app) {
                window.app.showToast('Translation completed', 'success');
                // Could show in agent response panel
                if (window.app.agentResponsePanel) {
                    const content = document.getElementById('agent-response-content');
                    if (content) {
                        content.textContent = translated;
                        window.app.agentResponsePanel.classList.remove('hidden');
                    }
                }
            }
        } catch (error) {
            console.error('Translation failed:', error);
            if (window.app) {
                window.app.showToast('Translation failed', 'error');
            }
        }
    }

    processAnother() {
        // Reset state
        this.currentImage = null;
        this.results = null;
        
        // Clear UI
        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('ocr-results').innerHTML = '';
        document.getElementById('image-input').value = '';
        
        this.hideProcessing();
    }

    showProcessing() {
        const progressElement = document.getElementById('ocr-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressElement) progressElement.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = 'Initializing...';
    }

    hideProcessing() {
        const progressElement = document.getElementById('ocr-progress');
        if (progressElement) progressElement.classList.add('hidden');
    }

    showError(message) {
        console.error('OCR Error:', message);
        
        const resultsContainer = document.getElementById('ocr-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-400 text-4xl mb-4">⚠️</div>
                    <h3 class="text-lg font-semibold text-red-400 mb-2">Processing Failed</h3>
                    <p class="text-gray-400 mb-4">${message}</p>
                    <button onclick="ocrHandler.processAnother()" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }
        
        this.hideProcessing();
        
        if (window.app) {
            window.app.showToast(message, 'error');
        }
    }
}

// Initialize OCR Handler
window.ocrHandler = new OCRHandler();

console.log('📷 OCR Handler loaded');