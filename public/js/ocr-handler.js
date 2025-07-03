// OCR Handler using Tesseract.js for Image-to-Code
class OCRHandler {
    constructor() {
        this.isInitialized = false;
        this.isProcessing = false;
        this.worker = null;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.isInitialized = true;
        } catch (error) {
            console.error('OCR initialization failed:', error);
        }
    }

    setupEventListeners() {
        // OCR modal triggers
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.openOCRModal();
            }
        });

        // Image input
        const imageInput = document.getElementById('image-input');
        if (imageInput) {
            imageInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Drop zone click
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('image-input')?.click();
            });
        }

        // OCR result buttons
        this.setupResultButtons();
    }

    setupResultButtons() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.matches('button')) return;

            const ocrResult = document.getElementById('ocr-result');
            if (!ocrResult || ocrResult.classList.contains('hidden')) return;

            if (target.textContent === 'Create File') {
                this.createFileFromOCR();
            } else if (target.textContent === 'Generate Code') {
                this.generateCodeFromOCR();
            } else if (target.textContent === 'Fix Bugs') {
                this.fixBugsFromOCR();
            }
        });
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    async handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    openOCRModal() {
        document.getElementById('ocr-modal')?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeOCRModal() {
        document.getElementById('ocr-modal')?.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetOCRModal();
    }

    resetOCRModal() {
        const ocrResult = document.getElementById('ocr-result');
        const dropZone = document.getElementById('drop-zone');
        
        if (ocrResult) {
            ocrResult.classList.add('hidden');
        }
        
        if (dropZone) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-900', 'bg-opacity-20');
        }
        
        // Reset file input
        const imageInput = document.getElementById('image-input');
        if (imageInput) {
            imageInput.value = '';
        }
    }

    async processFile(file) {
        if (!this.isValidImageFile(file)) {
            this.showError('Please select a valid image file (JPEG, PNG, GIF, BMP, WebP)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('File size too large. Please select an image under 10MB.');
            return;
        }

        this.isProcessing = true;
        this.showProcessingState();

        try {
            const imageUrl = URL.createObjectURL(file);
            const ocrText = await this.performOCR(imageUrl);
            
            if (ocrText.trim()) {
                this.showOCRResult(ocrText);
            } else {
                this.showError('No text detected in the image. Please try a clearer image.');
            }
            
            URL.revokeObjectURL(imageUrl);
        } catch (error) {
            console.error('OCR processing failed:', error);
            this.showError('Failed to process image. Please try again.');
        } finally {
            this.isProcessing = false;
            this.hideProcessingState();
        }
    }

    isValidImageFile(file) {
        return this.supportedFormats.includes(file.type);
    }

    async performOCR(imageUrl) {
        try {
            // Initialize Tesseract worker if not already done
            if (!this.worker) {
                this.worker = await Tesseract.createWorker('eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            this.updateProgress(m.progress);
                        }
                    }
                });
            }

            const { data: { text } } = await this.worker.recognize(imageUrl);
            return text;
        } catch (error) {
            console.error('Tesseract OCR failed:', error);
            throw new Error('OCR processing failed');
        }
    }

    showProcessingState() {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-400 mb-4"></i>
                    <p class="text-sm text-gray-400 mb-2">Processing image...</p>
                    <div class="w-full bg-gray-600 rounded-full h-2">
                        <div id="ocr-progress" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <p id="ocr-status" class="text-xs text-gray-500 mt-2">Initializing OCR...</p>
                </div>
            `;
        }
    }

    updateProgress(progress) {
        const progressBar = document.getElementById('ocr-progress');
        const statusText = document.getElementById('ocr-status');
        
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        
        if (statusText) {
            statusText.textContent = `Recognizing text... ${Math.round(progress * 100)}%`;
        }
    }

    hideProcessingState() {
        const dropZone = document.getElementById('drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <i class="fas fa-upload text-4xl text-gray-400 mb-4"></i>
                <p class="text-sm text-gray-400 mb-2">Drop screenshots, whiteboards, or sketches here</p>
                <p class="text-xs text-gray-500">Or click to browse files</p>
                <input id="image-input" type="file" accept="image/*" class="hidden">
            `;
            
            // Re-attach file input listener
            const imageInput = document.getElementById('image-input');
            if (imageInput) {
                imageInput.addEventListener('change', this.handleFileSelect.bind(this));
            }
        }
    }

    showOCRResult(text) {
        const ocrResult = document.getElementById('ocr-result');
        const textarea = ocrResult?.querySelector('textarea');
        
        if (ocrResult && textarea) {
            textarea.value = text;
            ocrResult.classList.remove('hidden');
            
            // Auto-scroll to result
            ocrResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showError(message) {
        if (window.app) {
            window.app.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Result action handlers
    async createFileFromOCR() {
        const textarea = document.querySelector('#ocr-result textarea');
        if (!textarea || !textarea.value.trim()) return;

        const content = textarea.value.trim();
        const language = this.detectLanguageFromContent(content);
        const extension = this.getExtensionForLanguage(language);
        
        const filename = prompt(`Enter filename for the extracted content:`, `extracted_code.${extension}`);
        if (!filename) return;

        // Create file in the app
        if (window.app && window.app.fileSystem) {
            const fullPath = filename.includes('/') ? filename : `src/${filename}`;
            window.app.fileSystem.set(fullPath, {
                content: content,
                language: language
            });
            
            window.app.updateFileTree();
            window.app.openFile(fullPath);
            window.app.showToast(`Created file: ${filename}`, 'success');
            this.closeOCRModal();
        }
    }

    async generateCodeFromOCR() {
        const textarea = document.querySelector('#ocr-result textarea');
        if (!textarea || !textarea.value.trim()) return;

        const content = textarea.value.trim();
        
        if (window.aiAgent) {
            window.app?.showToast('Generating code from OCR text...', 'info');
            
            try {
                const prompt = `Convert this extracted text/pseudocode into working code:

${content}

Generate clean, working code with proper syntax and structure. Infer the programming language from the content.`;
                
                const response = await window.aiAgent.callAIModel('gpt-4o', prompt);
                
                // Create a new file with the generated code
                const language = this.detectLanguageFromContent(response);
                const extension = this.getExtensionForLanguage(language);
                const filename = `generated_code.${extension}`;
                
                if (window.app && window.app.fileSystem) {
                    window.app.fileSystem.set(`src/${filename}`, {
                        content: response,
                        language: language
                    });
                    
                    window.app.updateFileTree();
                    window.app.openFile(`src/${filename}`);
                    window.app.showToast('Generated code from OCR!', 'success');
                    this.closeOCRModal();
                }
            } catch (error) {
                window.app?.showToast('Failed to generate code', 'error');
            }
        }
    }

    async fixBugsFromOCR() {
        const textarea = document.querySelector('#ocr-result textarea');
        if (!textarea || !textarea.value.trim()) return;

        const content = textarea.value.trim();
        
        if (window.aiAgent) {
            window.app?.showToast('Analyzing and fixing code...', 'info');
            
            try {
                const prompt = `Analyze this code for bugs and issues, then provide a fixed version:

${content}

Identify and fix:
- Syntax errors
- Logic errors
- Best practice violations
- Performance issues
- Security vulnerabilities

Provide the corrected code with explanations.`;
                
                const response = await window.aiAgent.callAIModel('gpt-4', prompt);
                
                // Create a new file with the fixed code
                const language = this.detectLanguageFromContent(content);
                const extension = this.getExtensionForLanguage(language);
                const filename = `fixed_code.${extension}`;
                
                if (window.app && window.app.fileSystem) {
                    window.app.fileSystem.set(`src/${filename}`, {
                        content: response,
                        language: language
                    });
                    
                    window.app.updateFileTree();
                    window.app.openFile(`src/${filename}`);
                    window.app.showToast('Fixed code issues!', 'success');
                    this.closeOCRModal();
                }
            } catch (error) {
                window.app?.showToast('Failed to fix code', 'error');
            }
        }
    }

    detectLanguageFromContent(content) {
        const contentLower = content.toLowerCase();
        
        // Check for language-specific keywords
        if (contentLower.includes('def ') || contentLower.includes('import ') && contentLower.includes('print(')) {
            return 'python';
        } else if (contentLower.includes('function ') || contentLower.includes('const ') || contentLower.includes('console.log')) {
            return 'javascript';
        } else if (contentLower.includes('interface ') || contentLower.includes(': string') || contentLower.includes('type ')) {
            return 'typescript';
        } else if (contentLower.includes('<html') || contentLower.includes('<div') || contentLower.includes('<!doctype')) {
            return 'html';
        } else if (contentLower.includes('{') && (contentLower.includes('color:') || contentLower.includes('margin:'))) {
            return 'css';
        } else if (contentLower.includes('select ') || contentLower.includes('from ') || contentLower.includes('where ')) {
            return 'sql';
        } else if (contentLower.includes('#!/bin/bash') || contentLower.includes('echo ') || contentLower.includes('chmod ')) {
            return 'shell';
        } else if (contentLower.includes('{') && contentLower.includes('"')) {
            return 'json';
        } else {
            return 'text';
        }
    }

    getExtensionForLanguage(language) {
        const extensionMap = {
            'python': 'py',
            'javascript': 'js',
            'typescript': 'ts',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
            'shell': 'sh',
            'json': 'json',
            'markdown': 'md',
            'text': 'txt'
        };
        
        return extensionMap[language] || 'txt';
    }

    // Cleanup
    async destroy() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}

// Initialize OCR handler
const ocrHandler = new OCRHandler();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    ocrHandler.destroy();
});

// Export for global access
window.ocrHandler = ocrHandler;