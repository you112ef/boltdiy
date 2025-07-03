// BoltDIY AI Agent Platform - Main Application
console.log('� BoltDIY App initializing...');

// Main application state
class BoltDIYApp {
    constructor() {
        this.currentFile = null;
        this.openTabs = new Map();
        this.fileSystem = new Map();
        this.settings = this.loadSettings();
        this.isInitialized = false;
        this.agentResponsePanel = null;
        this.currentAgent = null;
        this.collaborationProvider = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('� Initializing components...');
            
            // Hide loading overlay
            this.hideLoadingOverlay();
            
            // Initialize core systems
            await this.initializeEditor();
            await this.initializeAgentSystem();
            await this.initializeCollaboration();
            
            // Setup UI and handlers
            this.setupEventListeners();
            this.setupMobileHandlers();
            this.initializeFileSystem();
            this.setupAgentResponsePanel();
            
            // Initialize tools
            this.initializeOCR();
            this.initializeTerminal();
            this.initializeSemanticSearch();
            
            this.showToast('🚀 BoltDIY Platform Ready!', 'success');
            this.isInitialized = true;
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showToast('Failed to initialize application', 'error');
        }
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('editor-loading');
        if (overlay) {
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 1000);
        }
    }

    async initializeAgentSystem() {
        if (window.agentManager) {
            this.currentAgent = await window.agentManager.initialize();
            this.updateAgentStatus();
        }
    }

    async initializeCollaboration() {
        if (window.Y && this.settings.collaborativeEditing !== false) {
            try {
                this.collaborationProvider = new window.Y.Doc();
                console.log('✅ Collaboration initialized');
            } catch (error) {
                console.warn('⚠️ Collaboration failed to initialize:', error);
            }
        }
    }

    setupAgentResponsePanel() {
        this.agentResponsePanel = document.getElementById('agent-response-panel');
    }

    initializeOCR() {
        if (window.ocrHandler) {
            window.ocrHandler.initialize();
        }
    }

    initializeTerminal() {
        if (window.terminalHandler) {
            window.terminalHandler.initialize();
        }
    }

    initializeSemanticSearch() {
        if (window.semanticSearch) {
            window.semanticSearch.initialize();
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
        document.getElementById('ocr-toggle')?.addEventListener('click', this.toggleOCRModal.bind(this));
        document.getElementById('settings-toggle')?.addEventListener('click', this.toggleSettingsModal.bind(this));

        // Admin dashboard
        document.getElementById('admin-dashboard-toggle')?.addEventListener('click', this.toggleAdminDashboard.bind(this));

        // Modal close buttons
        document.getElementById('settings-close')?.addEventListener('click', this.closeSettingsModal.bind(this));
        document.getElementById('ocr-close')?.addEventListener('click', this.closeOCRModal.bind(this));
        document.getElementById('search-close')?.addEventListener('click', this.closeSearchModal.bind(this));
        document.getElementById('terminal-close')?.addEventListener('click', this.closeTerminal.bind(this));

        // Settings buttons
        document.getElementById('settings-save')?.addEventListener('click', this.saveSettings.bind(this));
        document.getElementById('settings-reset')?.addEventListener('click', this.resetSettings.bind(this));

        // Agent system
        document.getElementById('agent-switch')?.addEventListener('click', this.openAgentSwitch.bind(this));
        document.getElementById('send-message')?.addEventListener('click', this.sendAgentMessage.bind(this));

        // Response panel
        document.getElementById('response-close')?.addEventListener('click', this.closeResponsePanel.bind(this));
        document.getElementById('response-minimize')?.addEventListener('click', this.minimizeResponsePanel.bind(this));
        document.getElementById('apply-response')?.addEventListener('click', this.applyResponse.bind(this));
        document.getElementById('copy-response')?.addEventListener('click', this.copyResponse.bind(this));

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
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendAgentMessage();
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        // Modal backdrop clicks
        this.setupModalBackdropClicks();

        // OCR handlers
        document.getElementById('drop-zone')?.addEventListener('click', () => {
            document.getElementById('image-input')?.click();
        });
        
        document.getElementById('image-input')?.addEventListener('change', this.handleImageUpload.bind(this));

        // Sidebar overlay for mobile
        document.getElementById('sidebar-overlay')?.addEventListener('click', this.closeSidebar.bind(this));
    }

    setupModalBackdropClicks() {
        const modals = ['search-modal', 'settings-modal', 'ocr-modal', 'agent-switch-modal'];
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

    updateAgentStatus() {
        if (this.currentAgent) {
            const statusElement = document.getElementById('agent-name');
            const typeElement = document.getElementById('agent-type');
            const modelElement = document.getElementById('agent-model');
            const headerElement = document.getElementById('current-agent-name');
            
            if (statusElement) statusElement.textContent = this.currentAgent.name;
            if (typeElement) typeElement.textContent = this.currentAgent.type;
            if (modelElement) modelElement.textContent = this.currentAgent.model;
            if (headerElement) headerElement.textContent = this.currentAgent.name;
        }
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

    toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (modal.classList.contains('hidden')) {
                this.openModal(modalId);
            } else {
                this.closeModal(modalId);
            }
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

    toggleOCRModal() {
        this.toggleModal('ocr-modal');
    }

    closeOCRModal() {
        this.closeModal('ocr-modal');
    }

    closeSearchModal() {
        this.closeModal('search-modal');
    }

    toggleAdminDashboard() {
        if (window.adminDashboard) {
            window.adminDashboard.toggle();
        }
    }

    openAgentSwitch() {
        if (window.agentManager) {
            window.agentManager.showAgentSwitcher();
        }
    }

    sendAgentMessage() {
        const input = document.getElementById('agent-input');
        if (input && input.value.trim()) {
            this.handleAgentInput(input.value.trim());
            input.value = '';
        }
    }

    closeResponsePanel() {
        if (this.agentResponsePanel) {
            this.agentResponsePanel.classList.add('hidden');
        }
    }

    minimizeResponsePanel() {
        // Toggle minimized state
        if (this.agentResponsePanel) {
            this.agentResponsePanel.classList.toggle('minimized');
        }
    }

    applyResponse() {
        // Apply AI response to current file
        const content = document.getElementById('agent-response-content')?.textContent;
        if (content && this.currentFile) {
            this.showToast('Response applied to file', 'success');
        }
    }

    copyResponse() {
        const content = document.getElementById('agent-response-content')?.textContent;
        if (content) {
            navigator.clipboard.writeText(content);
            this.showToast('Response copied to clipboard', 'success');
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && window.ocrHandler) {
            window.ocrHandler.processImage(file);
        }
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            localStorage.removeItem('boltdiy_settings');
            this.settings = {};
            this.showToast('Settings reset to defaults', 'success');
            location.reload();
        }
    }

    // Terminal management
    toggleTerminal() {
        const terminal = document.getElementById('terminal-panel');
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
        document.getElementById('terminal-panel')?.classList.add('hidden');
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
        
        // Create with appropriate template
        let content = this.generateFileTemplate(filename, language);
        
        this.fileSystem.set(fullPath, {
            content: content,
            language: language
        });
        
        this.updateFileTree();
        this.openFile(fullPath);
        this.showToast(`Created ${filename}`, 'success');
    }

    generateFileTemplate(filename, language) {
        const ext = filename.split('.').pop()?.toLowerCase();
        const baseName = filename.replace(/\.[^/.]+$/, "");
        
        switch (ext) {
            case 'html':
                return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${baseName}</title>
</head>
<body>
    <h1>Welcome to ${baseName}</h1>
</body>
</html>`;
            case 'css':
                return `/* Styles for ${baseName} */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}`;
            case 'js':
                return `// ${baseName} JavaScript Module

'use strict';

/**
 * Main function for ${baseName}
 */
function main() {
    console.log('${baseName} loaded successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}`;
            case 'ts':
                return `// ${baseName} TypeScript Module

interface Config {
    name: string;
    version: string;
}

class ${baseName.charAt(0).toUpperCase() + baseName.slice(1)} {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    public initialize(): void {
        console.log(\`\${this.config.name} v\${this.config.version} initialized\`);
    }
}

export default ${baseName.charAt(0).toUpperCase() + baseName.slice(1)};`;
            case 'py':
                return `#!/usr/bin/env python3
"""
${baseName} - Python Module
"""

__version__ = "1.0.0"
__author__ = "BoltDIY"


def main():
    """Main function for ${baseName}"""
    print(f"${baseName} v{__version__} started")


if __name__ == "__main__":
    main()`;
            case 'md':
                return `# ${baseName.charAt(0).toUpperCase() + baseName.slice(1)}

## Overview

Description of ${baseName}

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

\`\`\`bash
# Example usage
echo "Hello ${baseName}"
\`\`\`

## License

MIT License`;
            case 'json':
                return `{
  "name": "${baseName}",
  "version": "1.0.0",
  "description": "Configuration file for ${baseName}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"No tests specified\\""
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}`;
            default:
                return `// New file: ${filename}
// Created by BoltDIY Platform

`;
        }
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
        const filenameElement = document.getElementById('current-file');
        const languageElement = document.getElementById('current-language');
        
        if (filenameElement) filenameElement.textContent = filepath.split('/').pop();
        if (languageElement) languageElement.textContent = language;
        
        // Notify AI agent of context change
        if (window.aiAgent) {
            window.aiAgent.updateContext({
                file: filepath,
                language: language,
                content: this.fileSystem.get(filepath)?.content || ''
            });
        }

        // Update agent suggestions if enabled
        if (this.settings.agentSuggestions && window.agentManager) {
            window.agentManager.suggestBestAgent(language, filepath);
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

        // Ctrl+Shift+D for admin dashboard
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            this.toggleAdminDashboard();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModals = ['search-modal', 'settings-modal', 'ocr-modal', 'agent-switch-modal'];
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
            const defaultSettings = {
                autoSave: true,
                collaborativeEditing: true,
                semanticSearch: true,
                autoAgentSwitch: true,
                agentSuggestions: true,
                agentMemory: true,
                aiSuggestions: false,
                hideLineNumbers: false,
                hideMinimap: false
            };
            const saved = JSON.parse(localStorage.getItem('boltdiy_settings') || '{}');
            return { ...defaultSettings, ...saved };
        } catch {
            return {};
        }
    }

    saveSettings() {
        // Collect all settings from UI
        const inputs = {
            'openai-key': 'openaiKey',
            'anthropic-key': 'anthropicKey',
            'google-key': 'googleKey',
            'mistral-key': 'mistralKey',
            'cohere-key': 'cohereKey'
        };

        const checkboxes = {
            'auto-save': 'autoSave',
            'collaborative-editing': 'collaborativeEditing',
            'semantic-search': 'semanticSearch',
            'auto-agent-switch': 'autoAgentSwitch',
            'agent-suggestions': 'agentSuggestions',
            'agent-memory': 'agentMemory',
            'ai-suggestions': 'aiSuggestions',
            'hide-line-numbers': 'hideLineNumbers',
            'hide-minimap': 'hideMinimap'
        };

        const selects = {
            'python-model': 'pythonModel',
            'js-model': 'jsModel',
            'web-model': 'webModel',
            'shell-model': 'shellModel'
        };

        // Update settings
        Object.entries(inputs).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element && element.value) {
                this.settings[key] = element.value;
            }
        });

        Object.entries(checkboxes).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                this.settings[key] = element.checked;
            }
        });

        Object.entries(selects).forEach(([id, key]) => {
            const element = document.getElementById(id);
            if (element) {
                this.settings[key] = element.value;
            }
        });

        localStorage.setItem('boltdiy_settings', JSON.stringify(this.settings));
        this.showToast('Settings saved successfully', 'success');
        this.closeModal('settings-modal');
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