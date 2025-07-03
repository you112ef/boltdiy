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
            await this.initializeEditor();
            this.setupEventListeners();
            this.setupMobileHandlers();
            this.initializeFileSystem();
            this.showToast('BoltDIY AI Agent Platform loaded!', 'success');
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'error');
        }
    }

    async initializeEditor() {
        // Monaco editor initialization is handled in monaco-setup.js
        if (window.monacoSetup) {
            await window.monacoSetup.init();
        }
    }

    setupEventListeners() {
        // Header buttons
        document.getElementById('menu-toggle')?.addEventListener('click', this.toggleSidebar.bind(this));
        document.getElementById('search-toggle')?.addEventListener('click', this.toggleSearchModal.bind(this));
        document.getElementById('terminal-toggle')?.addEventListener('click', this.toggleTerminal.bind(this));
        document.getElementById('settings-toggle')?.addEventListener('click', this.toggleSettingsModal.bind(this));

        // Modal close buttons
        document.getElementById('settings-close')?.addEventListener('click', this.closeSettingsModal.bind(this));
        document.getElementById('ocr-close')?.addEventListener('click', this.closeOCRModal.bind(this));
        document.getElementById('terminal-close')?.addEventListener('click', this.closeTerminal.bind(this));

        // Search modal
        document.getElementById('search-input')?.addEventListener('input', this.handleSearch.bind(this));

        // File operations
        document.getElementById('new-file')?.addEventListener('click', this.createNewFile.bind(this));

        // AI Agent commands
        document.querySelectorAll('.agent-cmd').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cmd = e.target.dataset.cmd;
                this.executeAgentCommand(cmd);
            });
        });

        // Agent input
        document.getElementById('agent-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAgentInput(e.target.value);
                e.target.value = '';
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Modal backdrop clicks
        this.setupModalBackdropClicks();

        // Sidebar overlay for mobile
        document.getElementById('sidebar-overlay')?.addEventListener('click', this.closeSidebar.bind(this));
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
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar.classList.contains('-translate-x-full')) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
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

    // Terminal management
    toggleTerminal() {
        const terminal = document.getElementById('terminal-panel');
        if (terminal.classList.contains('hidden')) {
            terminal.classList.remove('hidden');
            if (window.terminalHandler) {
                window.terminalHandler.resize();
            }
        } else {
            this.closeTerminal();
        }
    }

    closeTerminal() {
        document.getElementById('terminal-panel')?.classList.add('hidden');
    }

    // Search functionality
    async handleSearch(e) {
        const query = e.target.value.trim();
        if (query.length < 2) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        // Use semantic search
        if (window.semanticSearch) {
            const results = await window.semanticSearch.search(query);
            this.displaySearchResults(results);
        }
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
            content: `// Welcome to BoltDIY AI Agent Platform
import { McpAgent } from "agents/mcp";

// Your MCP server with AI-powered tools
export class MyMCP extends McpAgent {
    // Add your tools here
}`,
            language: 'typescript'
        });

        this.fileSystem.set('README.md', {
            content: `# BoltDIY AI Agent Platform

## Features
- 🧠 AI-powered code assistance
- 🔍 Semantic search across files
- 🖼️ OCR for image-to-code
- 📱 Mobile-responsive design
- 🚀 Collaborative editing

## Getting Started
1. Open a file from the sidebar
2. Use Ctrl+K for semantic search
3. Ask the AI agent for help
4. Upload images for OCR analysis`,
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
        if (window.innerWidth < 640) {
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
            if (window.innerWidth < 640) {
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

// Initialize the application
const app = new BoltDIYApp();

// Auto-save functionality
if (window.monacoSetup) {
    setInterval(() => {
        if (app.settings.autoSave !== false) {
            app.saveCurrentFile();
        }
    }, 5000); // Auto-save every 5 seconds
}

// Export for global access
window.app = app;