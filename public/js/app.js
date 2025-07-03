// التشخيص الأولي
console.log('🔍 App.js loading...', new Date().toLocaleTimeString());
console.log('📍 Current URL:', window.location.href);
console.log('📄 Document readyState:', document.readyState);

// التأكد من وجود العناصر الأساسية
function checkEssentialElements() {
    const elements = {
        'monaco-container': document.getElementById('monaco-container'),
        'sidebar': document.getElementById('sidebar'),
        'agent-input': document.getElementById('agent-input'),
        'file-tree': document.getElementById('file-tree')
    };
    
    console.log('🔍 Checking essential elements:');
    Object.entries(elements).forEach(([name, element]) => {
        console.log(`  ${element ? '✅' : '❌'} ${name}:`, element);
    });
    
    return Object.values(elements).every(el => el !== null);
}

// Main application state
class BoltDIYApp {
    constructor() {
        this.currentFile = null;
        this.openTabs = new Map();
        this.fileSystem = new Map();
        this.settings = this.loadSettings();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing BoltDIY App...');
            
            // التحقق من العناصر الأساسية أولاً
            if (!checkEssentialElements()) {
                console.error('❌ Essential elements missing, showing error page');
                this.showErrorPage();
                return;
            }
            
            console.log('✅ Essential elements found, continuing initialization...');
            
            await this.initializeEditor();
            this.setupEventListeners();
            this.setupMobileHandlers();
            this.initializeFileSystem();
            this.showToast('BoltDIY AI Agent Platform loaded!', 'success');
            this.isInitialized = true;
            
            console.log('🎉 BoltDIY App initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'error');
            this.showErrorPage();
        }
    }
    
    showErrorPage() {
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div class="text-center max-w-md mx-4">
                    <div class="text-6xl mb-4">⚠️</div>
                    <h1 class="text-2xl font-bold mb-4">خطأ في تحميل التطبيق</h1>
                    <p class="text-gray-400 mb-6">فشل في تحميل العناصر الأساسية للتطبيق. قد تكون هناك مشكلة في الاتصال بالخادم.</p>
                    <div class="space-y-2">
                        <button onclick="location.reload()" class="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors">
                            إعادة المحاولة
                        </button>
                        <button onclick="console.log('Debug info:', {url: location.href, userAgent: navigator.userAgent, timestamp: new Date()})" 
                                class="block w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition-colors">
                            إظهار معلومات التشخيص في Console
                        </button>
                    </div>
                    <div class="mt-6 text-xs text-gray-500">
                        <p>إذا استمرت المشكلة، تحقق من:</p>
                        <ul class="list-disc list-inside mt-2 space-y-1">
                            <li>اتصال الإنترنت</li>
                            <li>إعدادات مانع الإعلانات</li>
                            <li>إعدادات الأمان في المتصفح</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeEditor() {
        // Monaco editor initialization is handled in monaco-setup.js
        if (window.monacoSetup) {
            await window.monacoSetup.init();
        }
    }

    setupEventListeners() {
        // Header buttons - تحديث IDs للتطابق مع HTML
        document.getElementById('toggle-sidebar')?.addEventListener('click', this.toggleSidebar.bind(this));
        document.getElementById('settings-btn')?.addEventListener('click', this.toggleSettingsModal.bind(this));

        // Modal close buttons - تحديث IDs
        document.getElementById('cancel-settings')?.addEventListener('click', this.closeSettingsModal.bind(this));
        document.getElementById('save-settings')?.addEventListener('click', this.saveSettingsModal.bind(this));
        document.getElementById('close-search')?.addEventListener('click', () => this.closeModal('search-modal'));
        document.getElementById('close-ocr')?.addEventListener('click', this.closeOCRModal.bind(this));
        document.getElementById('toggle-terminal')?.addEventListener('click', this.closeTerminal.bind(this));
        document.getElementById('minimize-ai')?.addEventListener('click', this.minimizeAIPanel.bind(this));

        // Search modal
        document.getElementById('search-input')?.addEventListener('input', this.handleSearch.bind(this));

        // File operations
        document.getElementById('new-file-btn')?.addEventListener('click', this.createNewFile.bind(this));

        // AI Agent commands
        document.querySelectorAll('.agent-cmd').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = e.target.dataset.cmd;
                this.executeAgentCommand(cmd);
            });
        });

        // Agent input
        document.getElementById('agent-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleAgentInput(e.target.value);
                e.target.value = '';
            }
        });
        
        // Send button
        document.getElementById('send-agent')?.addEventListener('click', () => {
            const input = document.getElementById('agent-input');
            if (input.value.trim()) {
                this.handleAgentInput(input.value);
                input.value = '';
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Modal backdrop clicks
        this.setupModalBackdropClicks();

        // Keyboard shortcuts for search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleSearchModal();
            }
        });
    }

    setupModalBackdropClicks() {
        const modals = ['search-modal', 'settings-modal', 'ocr-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }

    setupMobileHandlers() {
        // Mobile-specific event handlers are in mobile-handlers.js
        if (window.mobileHandlers) {
            window.mobileHandlers.init();
        }
    }

    // Sidebar management
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar && sidebar.classList.contains('-translate-x-full')) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('-translate-x-full');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
    }

    // Modal management
    toggleSearchModal() {
        const modal = document.getElementById('search-modal');
        if (modal.classList.contains('hidden')) {
            this.openModal('search-modal');
            setTimeout(() => {
                document.getElementById('search-input')?.focus();
            }, 100);
        } else {
            this.closeModal('search-modal');
        }
    }

    toggleSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal.classList.contains('hidden')) {
            this.openModal('settings-modal');
        } else {
            this.closeModal('settings-modal');
        }
    }

    openModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
        document.body.style.overflow = '';
    }

    closeSettingsModal() {
        this.closeModal('settings-modal');
    }

    closeOCRModal() {
        this.closeModal('ocr-modal');
    }
    
    saveSettingsModal() {
        // حفظ الإعدادات
        const openaiKey = document.getElementById('openai-key')?.value;
        const anthropicKey = document.getElementById('anthropic-key')?.value;
        const googleKey = document.getElementById('google-key')?.value;
        
        if (openaiKey) this.settings.openaiKey = openaiKey;
        if (anthropicKey) this.settings.anthropicKey = anthropicKey;
        if (googleKey) this.settings.googleKey = googleKey;
        
        this.saveSettings();
        this.showToast('تم حفظ الإعدادات', 'success');
        this.closeModal('settings-modal');
    }
    
    minimizeAIPanel() {
        const panel = document.querySelector('.fixed.bottom-4.right-4');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }

    // Terminal management
    toggleTerminal() {
        const terminal = document.getElementById('terminal-container');
        if (terminal && terminal.classList.contains('hidden')) {
            terminal.classList.remove('hidden');
            if (window.terminalHandler) {
                window.terminalHandler.resize();
            }
        } else {
            this.closeTerminal();
        }
    }

    closeTerminal() {
        document.getElementById('terminal-container')?.classList.add('hidden');
    }

    // Search functionality
    async handleSearch(e) {
        const query = e.target.value.trim();
        const resultsContainer = document.getElementById('search-results');
        
        if (query.length < 2) {
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
            return;
        }

        // البحث البسيط في الملفات المحلية
        const results = this.searchInFiles(query);
        this.displaySearchResults(results);
    }
    
    searchInFiles(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [filepath, file] of this.fileSystem.entries()) {
            const content = file.content.toLowerCase();
            const lines = file.content.split('\n');
            
            // البحث في اسم الملف
            if (filepath.toLowerCase().includes(queryLower)) {
                results.push({
                    file: filepath,
                    content: `File: ${filepath}`,
                    score: 0.9,
                    type: 'filename'
                });
            }
            
            // البحث في محتوى الملف
            lines.forEach((line, index) => {
                if (line.toLowerCase().includes(queryLower)) {
                    results.push({
                        file: filepath,
                        content: line.trim(),
                        line: index + 1,
                        score: 0.7,
                        type: 'content'
                    });
                }
            });
        }
        
        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="text-gray-400 text-center py-8">No results found</div>';
            return;
        }

        container.innerHTML = results.map(result => `
            <div class="border border-gray-600 rounded p-3 mb-2 hover:bg-gray-800 cursor-pointer" 
                 onclick="app.openFile('${result.file}', ${result.line || 0})">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-sm font-medium text-blue-400">${result.file}</span>
                    <span class="text-xs text-gray-400">${(result.score * 100).toFixed(1)}%</span>
                </div>
                <div class="text-xs text-gray-300 line-clamp-2">${result.content}</div>
                ${result.line ? `<div class="text-xs text-gray-500 mt-1">Line ${result.line}</div>` : ''}
            </div>
        `).join('');
    }

    // File management
    initializeFileSystem() {
        // Create some sample files
        this.fileSystem.set('src/index.ts', {
            content: `// Welcome to BoltDIY AI Agent Platform المتقدمة
import { McpAgent } from "agents/mcp";

// Your MCP server with AI-powered tools
// خادم MCP الخاص بك مع أدوات الذكاء الاصطناعي
export class MyMCP extends McpAgent {
    // Add your tools here
    // أضف أدواتك هنا
}

console.log('🚀 BoltDIY Platform Ready!');`,
            language: 'typescript'
        });

        this.fileSystem.set('README.md', {
            content: `# BoltDIY AI Agent Platform المتقدمة

## المميزات الرئيسية
- 🧠 مساعدة ذكية للبرمجة مدعومة بالذكاء الاصطناعي
- 🔍 بحث دلالي عبر جميع الملفات
- 🖼️ تحويل الصور إلى كود (OCR)
- 📱 تصميم متجاوب للهواتف المحمولة
- 🚀 نظام وكلاء متقدم متعدد النماذج
- ⚡ واجهة سريعة ومحسنة

## كيفية البدء
1. افتح ملف من الشريط الجانبي
2. استخدم Ctrl+K للبحث الدلالي
3. اسأل الوكيل الذكي للمساعدة
4. ارفع الصور لتحليل OCR
5. استمتع بالبرمجة المتقدمة!

## الأدوات المتاحة
- 🎯 6 أنواع وكلاء متخصصة
- 🤖 دعم 5 مقدمي خدمات AI
- 🔧 أدوات تحليل وإصلاح الكود
- 📊 لوحة تحكم إدارية شاملة`,
            language: 'markdown'
        });

        this.fileSystem.set('styles.css', {
            content: `/* Mobile-first responsive styles */
@media (max-width: 768px) {
    .mobile-hidden { display: none; }
    .text-responsive { font-size: 14px; }
}

@media (min-width: 769px) {
    .desktop-visible { display: block; }
}`,
            language: 'css'
        });

        this.updateFileTree();
        
        // فتح README.md تلقائياً كترحيب
        setTimeout(() => {
            this.openFile('README.md');
        }, 500);
    }

    updateFileTree() {
        const container = document.getElementById('file-tree');
        const files = Array.from(this.fileSystem.keys()).sort();
        
        container.innerHTML = files.map(filepath => {
            const parts = filepath.split('/');
            const filename = parts[parts.length - 1];
            const isActive = filepath === this.currentFile;
            
            return `
                <div class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 cursor-pointer ${isActive ? 'bg-blue-900' : ''}" 
                     onclick="app.openFile('${filepath}')">
                    <i class="fas fa-file-code text-xs text-gray-400"></i>
                    <span class="text-xs truncate">${filename}</span>
                </div>
            `;
        }).join('');
    }

    async createNewFile() {
        const filename = prompt('Enter filename:');
        if (!filename) return;
        
        const fullPath = filename.includes('/') ? filename : `src/${filename}`;
        const language = this.detectLanguage(filename);
        
        this.fileSystem.set(fullPath, {
            content: `// New file: ${filename}\n`,
            language: language
        });
        
        this.updateFileTree();
        this.openFile(fullPath);
        this.showToast(`Created ${filename}`, 'success');
    }

    detectLanguage(filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const langMap = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'json': 'json',
            'sh': 'shell',
            'sql': 'sql'
        };
        return langMap[ext] || 'text';
    }

    async openFile(filepath, line = 0) {
        const file = this.fileSystem.get(filepath);
        if (!file) {
            this.showToast(`File not found: ${filepath}`, 'error');
            return;
        }

        this.currentFile = filepath;
        
        // Update Monaco editor
        if (window.monacoSetup && window.monacoSetup.editor) {
            const model = window.monaco.editor.createModel(file.content, file.language);
            window.monacoSetup.editor.setModel(model);
            
            if (line > 0) {
                window.monacoSetup.editor.revealLineInCenter(line);
                window.monacoSetup.editor.setPosition({ lineNumber: line, column: 1 });
            }
        }

        // Update AI agent context
        this.updateAgentContext(filepath, file.language);
        
        // Update UI
        this.updateFileTree();
        this.updateEditorTabs();
        
        // Close sidebar on mobile after file selection
        if (window.innerWidth < 1024) {
            this.closeSidebar();
        }
    }

    updateAgentContext(filepath, language) {
        document.getElementById('current-file').textContent = filepath.split('/').pop();
        document.getElementById('current-language').textContent = language;
        
        // Notify AI agent of context change
        if (window.aiAgent) {
            window.aiAgent.updateContext({
                file: filepath,
                language: language,
                content: this.fileSystem.get(filepath)?.content || ''
            });
        }
    }

    updateEditorTabs() {
        const container = document.getElementById('editor-tabs');
        if (!this.currentFile) {
            container.innerHTML = '';
            return;
        }

        const filename = this.currentFile.split('/').pop();
        container.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-2 bg-gray-700 border-r border-gray-600">
                <i class="fas fa-file-code text-xs"></i>
                <span class="text-xs">${filename}</span>
                <button class="text-xs hover:text-red-400 ml-2" onclick="app.closeFile('${this.currentFile}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    closeFile(filepath) {
        if (filepath === this.currentFile) {
            this.currentFile = null;
            if (window.monacoSetup && window.monacoSetup.editor) {
                window.monacoSetup.editor.setModel(null);
            }
        }
        this.updateEditorTabs();
    }

    // AI Agent integration
    async executeAgentCommand(command) {
        const input = document.getElementById('agent-input');
        input.value = command + ' ';
        input.focus();
    }

    async handleAgentInput(message) {
        if (!message.trim()) return;
        
        this.showToast('Processing AI request...', 'info');
        
        // Send to AI agent
        if (window.aiAgent) {
            try {
                const response = await window.aiAgent.processMessage(message);
                this.showAgentResponse(response);
            } catch (error) {
                this.showToast('AI agent error: ' + error.message, 'error');
            }
        } else {
            this.showToast('AI agent not available', 'error');
        }
    }

    showAgentResponse(response) {
        // Show response in a toast or modal
        this.showToast(response.slice(0, 100) + '...', 'success');
        
        // If response includes code, offer to apply it
        if (response.includes('```')) {
            // Extract and offer code application
            console.log('AI Response:', response);
        }
    }

    // Keyboard shortcuts
    handleKeyboard(e) {
        // Ctrl+K or Cmd+K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.toggleSearchModal();
        }
        
        // Ctrl+` for terminal
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            this.toggleTerminal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModals = ['search-modal', 'settings-modal', 'ocr-modal'];
            openModals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    this.closeModal(modalId);
                }
            });
            
            // Also close sidebar on mobile
            if (window.innerWidth < 1024) {
                this.closeSidebar();
            }
        }
    }

    // Settings management
    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('boltdiy_settings') || '{}');
        } catch {
            return {};
        }
    }

    saveSettings() {
        localStorage.setItem('boltdiy_settings', JSON.stringify(this.settings));
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        
        toast.className = `${colors[type]} text-white px-4 py-2 rounded shadow-lg text-sm transform transition-all duration-300 translate-x-full`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Save file content
    saveCurrentFile() {
        if (!this.currentFile || !window.monacoSetup?.editor) return;
        
        const content = window.monacoSetup.editor.getValue();
        const file = this.fileSystem.get(this.currentFile);
        if (file) {
            file.content = content;
            this.fileSystem.set(this.currentFile, file);
            this.showToast('File saved', 'success');
        }
    }
}

// تحميل التطبيق عند جاهزية الصفحة
console.log('📋 Setting up app initialization...');

let app;

function initializeApp() {
    console.log('🔄 Initializing BoltDIY App...');
    try {
        app = new BoltDIYApp();
        
        // Auto-save functionality
        setTimeout(() => {
            if (window.monacoSetup && app) {
                setInterval(() => {
                    if (app.settings.autoSave !== false && app.isInitialized) {
                        app.saveCurrentFile();
                    }
                }, 5000); // Auto-save every 5 seconds
            }
        }, 2000);
        
        // Export for global access
        window.app = app;
        
        console.log('✅ App instance created and exported to window.app');
    } catch (error) {
        console.error('❌ Failed to create app instance:', error);
        
        // عرض رسالة خطأ للمستخدم
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div class="text-center max-w-md mx-4">
                    <div class="text-6xl mb-4">💥</div>
                    <h1 class="text-2xl font-bold mb-4">خطأ في تشغيل التطبيق</h1>
                    <p class="text-gray-400 mb-6">حدث خطأ غير متوقع أثناء تشغيل التطبيق.</p>
                    <details class="text-left bg-gray-800 p-4 rounded mb-4">
                        <summary class="cursor-pointer text-sm font-medium">تفاصيل الخطأ</summary>
                        <pre class="text-xs mt-2 text-red-400">${error.message}</pre>
                    </details>
                    <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors">
                        إعادة تحميل الصفحة
                    </button>
                </div>
            </div>
        `;
    }
}

// تحميل التطبيق حسب حالة الصفحة
if (document.readyState === 'loading') {
    console.log('📄 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('📄 Document already loaded, initializing immediately...');
    initializeApp();
}