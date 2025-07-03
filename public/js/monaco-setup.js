// Monaco Editor setup with Yjs collaborative editing
class MonacoSetup {
    constructor() {
        this.editor = null;
        this.yDoc = null;
        this.yText = null;
        this.binding = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            await this.loadMonaco();
            this.setupEditor();
            this.setupCollaboration();
            this.setupMobileOptimizations();
            this.setupAIIntegration();
            this.isInitialized = true;
            
            // Hide loading overlay
            document.getElementById('editor-loading')?.classList.add('hidden');
        } catch (error) {
            console.error('Monaco setup failed:', error);
            throw error;
        }
    }

    async loadMonaco() {
        return new Promise((resolve, reject) => {
            require.config({ 
                paths: { 
                    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs' 
                } 
            });
            
            require(['vs/editor/editor.main'], () => {
                resolve();
            }, reject);
        });
    }

    setupEditor() {
        const container = document.getElementById('monaco-container');
        if (!container) throw new Error('Monaco container not found');

        // Detect if mobile for different configuration
        const isMobile = window.innerWidth < 768;
        
        this.editor = monaco.editor.create(container, {
            value: '// Welcome to BoltDIY AI Agent Platform\n// Start typing or open a file from the sidebar\n',
            language: 'typescript',
            theme: 'vs-dark',
            automaticLayout: true,
            
            // Mobile optimizations
            lineNumbers: isMobile ? 'off' : 'on',
            minimap: { enabled: !isMobile },
            folding: !isMobile,
            lineDecorationsWidth: isMobile ? 0 : 10,
            lineNumbersMinChars: isMobile ? 0 : 3,
            glyphMargin: !isMobile,
            
            // Enhanced features
            wordWrap: 'on',
            contextmenu: true,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderWhitespace: 'selection',
            
            // Accessibility
            accessibilitySupport: 'auto',
            
            // Performance
            renderValidationDecorations: 'on',
            scrollbar: {
                verticalScrollbarSize: isMobile ? 8 : 12,
                horizontalScrollbarSize: isMobile ? 8 : 12,
            },
            
            fontSize: isMobile ? 12 : 14,
            lineHeight: isMobile ? 18 : 20,
        });

        // Setup language detection and AI context
        this.editor.onDidChangeModelContent(() => {
            this.detectLanguageFromContent();
            this.updateAIContext();
        });

        // Setup cursor change events for AI context
        this.editor.onDidChangeCursorPosition(() => {
            this.updateCursorContext();
        });

        // Auto-resize on window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setupCollaboration() {
        try {
            // Initialize Yjs document
            this.yDoc = new Y.Doc();
            this.yText = this.yDoc.getText('monaco');
            
            // Bind Monaco to Yjs
            if (window.MonacoBinding) {
                this.binding = new MonacoBinding(
                    this.yText,
                    this.editor.getModel(),
                    new Set([this.editor]),
                    null // Provider will be added when connecting to server
                );
            }
        } catch (error) {
            console.warn('Yjs collaboration setup failed:', error);
            // Continue without collaboration
        }
    }

    setupMobileOptimizations() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Add mobile-specific styles
            const style = document.createElement('style');
            style.textContent = `
                .monaco-editor .margin { display: none !important; }
                .monaco-editor .minimap { display: none !important; }
                .monaco-editor .decorationsOverviewRuler { display: none !important; }
                .monaco-editor .scroll-decoration { display: none !important; }
                .monaco-scrollable-element > .scrollbar > .slider {
                    background: rgba(255, 255, 255, 0.2) !important;
                }
            `;
            document.head.appendChild(style);

            // Touch-friendly context menu
            this.editor.addAction({
                id: 'mobile-context-menu',
                label: 'Show Options',
                contextMenuGroupId: 'navigation',
                run: () => {
                    this.showMobileContextMenu();
                }
            });
        }
    }

    setupAIIntegration() {
        // AI-powered features
        this.setupInlineSuggestions();
        this.setupSymbolNavigation();
        this.setupErrorAnalysis();
    }

    setupInlineSuggestions() {
        // Register AI completion provider
        monaco.languages.registerCompletionItemProvider('typescript', {
            provideCompletionItems: async (model, position) => {
                return this.getAICompletions(model, position);
            }
        });

        monaco.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: async (model, position) => {
                return this.getAICompletions(model, position);
            }
        });

        monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: async (model, position) => {
                return this.getAICompletions(model, position);
            }
        });
    }

    async getAICompletions(model, position) {
        try {
            const word = model.getWordUntilPosition(position);
            const textBeforeCursor = model.getValueInRange({
                startLineNumber: Math.max(1, position.lineNumber - 10),
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            // Get AI suggestions
            if (window.aiAgent) {
                const suggestions = await window.aiAgent.getCompletions(textBeforeCursor, word.word);
                return {
                    suggestions: suggestions.map(suggestion => ({
                        label: suggestion.text,
                        kind: monaco.languages.CompletionItemKind.Text,
                        insertText: suggestion.text,
                        documentation: suggestion.description || 'AI-generated suggestion'
                    }))
                };
            }
        } catch (error) {
            console.warn('AI completions failed:', error);
        }
        
        return { suggestions: [] };
    }

    setupSymbolNavigation() {
        // Jump to definition with AI help
        this.editor.addAction({
            id: 'ai-goto-definition',
            label: 'AI: Go to Definition',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F12],
            run: async () => {
                const position = this.editor.getPosition();
                const word = this.editor.getModel().getWordAtPosition(position);
                
                if (word && window.semanticSearch) {
                    const results = await window.semanticSearch.findSymbol(word.word);
                    if (results.length > 0) {
                        window.app.openFile(results[0].file, results[0].line);
                    }
                }
            }
        });
    }

    setupErrorAnalysis() {
        // AI-powered error analysis
        monaco.editor.onDidChangeMarkers((uri) => {
            const markers = monaco.editor.getModelMarkers({ resource: uri });
            if (markers.length > 0 && window.aiAgent) {
                // Analyze errors with AI
                window.aiAgent.analyzeErrors(markers);
            }
        });
    }

    detectLanguageFromContent() {
        const content = this.editor.getValue();
        const model = this.editor.getModel();
        
        if (!model) return;
        
        const currentLanguage = model.getLanguageId();
        let detectedLanguage = currentLanguage;
        
        // Simple content-based detection
        if (content.includes('import ') && content.includes('from ')) {
            if (content.includes('interface ') || content.includes(': string')) {
                detectedLanguage = 'typescript';
            } else {
                detectedLanguage = 'javascript';
            }
        } else if (content.includes('def ') || content.includes('import ')) {
            detectedLanguage = 'python';
        } else if (content.includes('<html') || content.includes('<div')) {
            detectedLanguage = 'html';
        } else if (content.includes('{') && content.includes('color:')) {
            detectedLanguage = 'css';
        }
        
        if (detectedLanguage !== currentLanguage) {
            monaco.editor.setModelLanguage(model, detectedLanguage);
            this.updateLanguageContext(detectedLanguage);
        }
    }

    updateLanguageContext(language) {
        document.getElementById('current-language').textContent = language;
        
        // Update AI agent context
        if (window.aiAgent) {
            window.aiAgent.setLanguage(language);
        }
        
        // Show language-specific toolbar
        this.updateLanguageToolbar(language);
    }

    updateLanguageToolbar(language) {
        // Language-specific actions
        const actions = {
            python: ['Run Python', 'Add Tests', 'Debug'],
            javascript: ['Run JS', 'Bundle', 'Test'],
            typescript: ['Compile TS', 'Type Check', 'Test'],
            html: ['Preview', 'Validate', 'Optimize'],
            css: ['Minify', 'Autoprefixer', 'Validate'],
            sql: ['Format SQL', 'Optimize Query', 'Validate'],
            shell: ['Execute', 'Validate Syntax']
        };
        
        const languageActions = actions[language] || [];
        // Implementation for dynamic toolbar would go here
    }

    updateAIContext() {
        const content = this.editor.getValue();
        const position = this.editor.getPosition();
        
        if (window.aiAgent) {
            window.aiAgent.updateContext({
                content: content,
                position: position,
                selection: this.editor.getSelection()
            });
        }
    }

    updateCursorContext() {
        const position = this.editor.getPosition();
        const model = this.editor.getModel();
        
        if (!model || !position) return;
        
        // Get surrounding context
        const lineContent = model.getLineContent(position.lineNumber);
        const wordAtPosition = model.getWordAtPosition(position);
        
        if (window.aiAgent) {
            window.aiAgent.updateCursorContext({
                line: lineContent,
                word: wordAtPosition?.word,
                lineNumber: position.lineNumber,
                column: position.column
            });
        }
    }

    showMobileContextMenu() {
        const position = this.editor.getPosition();
        const selection = this.editor.getSelection();
        
        // Create mobile-friendly context menu
        const menu = document.createElement('div');
        menu.className = 'fixed bottom-4 left-4 right-4 bg-gray-800 rounded-lg p-3 z-50 shadow-lg';
        menu.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-xs">
                <button class="p-2 bg-blue-600 rounded" onclick="monacoSetup.formatCode()">Format</button>
                <button class="p-2 bg-green-600 rounded" onclick="monacoSetup.askAI()">Ask AI</button>
                <button class="p-2 bg-purple-600 rounded" onclick="monacoSetup.findReferences()">Find</button>
                <button class="p-2 bg-yellow-600 rounded" onclick="monacoSetup.toggleComment()">Comment</button>
                <button class="p-2 bg-red-600 rounded" onclick="monacoSetup.closeMobileMenu()">Close</button>
                <button class="p-2 bg-gray-600 rounded" onclick="monacoSetup.showMore()">More</button>
            </div>
        `;
        
        document.body.appendChild(menu);
        this.currentMobileMenu = menu;
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            this.closeMobileMenu();
        }, 5000);
    }

    closeMobileMenu() {
        if (this.currentMobileMenu) {
            document.body.removeChild(this.currentMobileMenu);
            this.currentMobileMenu = null;
        }
    }

    formatCode() {
        this.editor.getAction('editor.action.formatDocument').run();
        this.closeMobileMenu();
    }

    askAI() {
        const selection = this.editor.getSelection();
        const selectedText = this.editor.getModel().getValueInRange(selection);
        
        if (selectedText && window.aiAgent) {
            window.aiAgent.explainCode(selectedText);
        }
        this.closeMobileMenu();
    }

    findReferences() {
        this.editor.getAction('editor.action.goToReferences').run();
        this.closeMobileMenu();
    }

    toggleComment() {
        this.editor.getAction('editor.action.commentLine').run();
        this.closeMobileMenu();
    }

    handleResize() {
        const isMobile = window.innerWidth < 768;
        const wasMobile = this.editor.getOption(monaco.editor.EditorOption.lineNumbers) === 'off';
        
        if (isMobile !== wasMobile) {
            // Update mobile settings
            this.editor.updateOptions({
                lineNumbers: isMobile ? 'off' : 'on',
                minimap: { enabled: !isMobile },
                folding: !isMobile,
                lineDecorationsWidth: isMobile ? 0 : 10,
                fontSize: isMobile ? 12 : 14,
                lineHeight: isMobile ? 18 : 20,
            });
        }
        
        // Force layout update
        setTimeout(() => {
            this.editor.layout();
        }, 100);
    }

    // Public API methods
    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value);
        }
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setLanguage(language) {
        const model = this.editor?.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, language);
        }
    }

    insertText(text) {
        if (this.editor) {
            const position = this.editor.getPosition();
            this.editor.executeEdits('ai-insertion', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text
            }]);
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }
}

// Initialize Monaco setup
const monacoSetup = new MonacoSetup();

// Export for global access
window.monacoSetup = monacoSetup;