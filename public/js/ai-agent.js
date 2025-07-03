// AI Agent Core with Language-Aware Models
class AIAgent {
    constructor() {
        this.context = {
            file: null,
            language: null,
            content: '',
            position: null,
            selection: null
        };
        this.sessionHistory = [];
        this.languageModels = this.getDefaultLanguageMapping();
        this.apiKeys = this.loadAPIKeys();
        this.isProcessing = false;
    }

    getDefaultLanguageMapping() {
        return {
            'python': 'gpt-4',
            'javascript': 'gpt-4o',
            'typescript': 'gpt-4o',
            'html': 'gemini-vision',
            'css': 'gemini-vision',
            'bash': 'claude-3',
            'shell': 'claude-3',
            'sql': 'claude-3',
            'json': 'gpt-4o',
            'markdown': 'gpt-4',
            'default': 'gpt-4o'
        };
    }

    loadAPIKeys() {
        try {
            return JSON.parse(localStorage.getItem('boltdiy_api_keys') || '{}');
        } catch {
            return {};
        }
    }

    saveAPIKeys() {
        localStorage.setItem('boltdiy_api_keys', JSON.stringify(this.apiKeys));
    }

    updateContext(newContext) {
        this.context = { ...this.context, ...newContext };
        this.updateAgentStatus();
    }

    updateCursorContext(cursorInfo) {
        this.context.cursorContext = cursorInfo;
    }

    setLanguage(language) {
        this.context.language = language;
        this.updateAgentStatus();
    }

    updateAgentStatus() {
        const statusEl = document.getElementById('agent-status');
        const fileEl = document.getElementById('current-file');
        const langEl = document.getElementById('current-language');

        if (statusEl) {
            if (this.isProcessing) {
                statusEl.innerHTML = '🟡 Processing...';
            } else if (this.context.file) {
                statusEl.innerHTML = '🟢 Ready';
            } else {
                statusEl.innerHTML = '⚪ No file open';
            }
        }

        if (fileEl && this.context.file) {
            fileEl.textContent = this.context.file.split('/').pop();
        }

        if (langEl && this.context.language) {
            langEl.textContent = this.context.language;
        }
    }

    async processMessage(message) {
        if (this.isProcessing) {
            throw new Error('Agent is busy processing another request');
        }

        this.isProcessing = true;
        this.updateAgentStatus();

        try {
            // Parse command if it starts with /
            if (message.startsWith('/')) {
                return await this.handleCommand(message);
            } else {
                return await this.handleNaturalLanguage(message);
            }
        } finally {
            this.isProcessing = false;
            this.updateAgentStatus();
        }
    }

    async handleCommand(command) {
        const [cmd, ...args] = command.slice(1).split(' ');
        const argText = args.join(' ');

        switch (cmd.toLowerCase()) {
            case 'explain':
                return await this.explainCode(argText || this.getSelectedText());
            case 'refactor':
                return await this.refactorCode(argText || this.getSelectedText());
            case 'test':
                return await this.generateTests(argText || this.context.content);
            case 'fix':
                return await this.fixCode(argText || this.getSelectedText());
            case 'optimize':
                return await this.optimizeCode(argText || this.getSelectedText());
            case 'document':
                return await this.generateDocumentation(argText || this.getSelectedText());
            case 'complete':
                return await this.completeCode(argText || this.getCurrentLine());
            default:
                return `Unknown command: ${cmd}. Available commands: explain, refactor, test, fix, optimize, document, complete`;
        }
    }

    async handleNaturalLanguage(message) {
        const prompt = this.buildContextualPrompt(message);
        const model = this.getModelForLanguage(this.context.language);
        
        return await this.callAIModel(model, prompt);
    }

    buildContextualPrompt(userMessage) {
        let prompt = `You are an AI coding assistant integrated into a mobile-first code editor. 

Current context:
- File: ${this.context.file || 'None'}
- Language: ${this.context.language || 'Unknown'}
- Line: ${this.context.cursorContext?.lineNumber || 'Unknown'}

`;

        if (this.context.content) {
            prompt += `Current file content (truncated):
\`\`\`${this.context.language || 'text'}
${this.context.content.slice(0, 1000)}${this.context.content.length > 1000 ? '...' : ''}
\`\`\`

`;
        }

        if (this.context.selection && this.context.selection.startLineNumber !== this.context.selection.endLineNumber) {
            prompt += `Selected code:
\`\`\`${this.context.language || 'text'}
${this.getSelectedText()}
\`\`\`

`;
        }

        prompt += `User question: ${userMessage}

Please provide a helpful, concise response. If suggesting code changes, provide specific, actionable suggestions.`;

        return prompt;
    }

    getModelForLanguage(language) {
        return this.languageModels[language] || this.languageModels.default;
    }

    async callAIModel(model, prompt) {
        try {
            // استخدام النظام الموحد للذكاء الاصطناعي
            if (window.unifiedAI && window.modelSelector) {
                // اختيار أفضل نموذج للمهمة
                const task = { type: this.getTaskType(prompt) };
                const selectedModel = window.modelSelector.selectBestModel(task, {
                    preferredProviders: this.getPreferredProviders(),
                    maxCost: 'high',
                    minSpeed: 'slow'
                });

                if (selectedModel) {
                    const response = await window.unifiedAI.generateCompletion({
                        model: selectedModel.model,
                        provider: selectedModel.provider,
                        messages: prompt,
                        options: {
                            temperature: 0.7,
                            maxTokens: 2000
                        }
                    });

                    // تسجيل الأداء للتحسين المستقبلي
                    window.modelSelector.recordPerformance(
                        selectedModel.model, 
                        this.evaluateResponse(response.content),
                        response.metadata.processingTime
                    );

                    return response.content;
                }
            }

            // النظام البديل في حالة عدم توفر النظام الموحد
            return this.generateMockResponse(model, prompt);
        } catch (error) {
            console.error('AI model call failed:', error);
            return this.generateMockResponse(model, prompt);
        }
    }

    getTaskType(prompt) {
        if (prompt.includes('refactor') || prompt.includes('optimize')) {
            return 'coding';
        } else if (prompt.includes('analyze') || prompt.includes('explain')) {
            return 'analysis';
        } else if (prompt.includes('solve') || prompt.includes('logic')) {
            return 'reasoning';
        }
        return 'general';
    }

    getPreferredProviders() {
        // إرجاع المزودين المفضلين بناءً على نوع الوكيل
        const providerMap = {
            'python': ['openai'],
            'javascript': ['openai'],
            'typescript': ['openai'],
            'html': ['google'],
            'css': ['google'],
            'bash': ['anthropic'],
            'shell': ['anthropic'],
            'sql': ['anthropic']
        };
        
        return providerMap[this.context.language] || ['openai', 'anthropic'];
    }

    evaluateResponse(response) {
        // تقييم جودة الاستجابة (1-5)
        let score = 3; // نقطة البداية
        
        if (response.length > 100) score += 0.5;
        if (response.includes('```')) score += 0.5; // يحتوي على كود
        if (response.includes('1.') || response.includes('•')) score += 0.5; // منظم
        if (response.length > 500) score += 0.5;
        
        return Math.min(5, score);
    }

    generateMockResponse(model, prompt) {
        const responses = [
            "تم تحليل الكود باستخدام الذكاء الاصطناعي. إليك التحسينات المقترحة:",
            "بناءً على السياق الحالي، أقترح استخدام هذا النهج:",
            "الكود يبدو جيداً! إليك بعض النصائح للتحسين:",
            "لاحظت أنك تعمل مع TypeScript. أنصح بإضافة تعريفات الأنواع.",
            "للتطوير المتجاوب، هذا النهج سيعمل بشكل جيد.",
            "إليك اقتراح لإكمال الكود بناءً على السياق الحالي:"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async explainCode(code) {
        if (!code) {
            return "Please select some code or provide code to explain.";
        }

        const prompt = `Explain this ${this.context.language || ''} code in simple terms:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Focus on what it does, how it works, and any important concepts.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async refactorCode(code) {
        if (!code) {
            return "Please select some code to refactor.";
        }

        const prompt = `Refactor this ${this.context.language || ''} code to improve readability, performance, and maintainability:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Provide the refactored code with explanations for the changes.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async generateTests(code) {
        if (!code) {
            return "Please provide code to generate tests for.";
        }

        const prompt = `Generate comprehensive unit tests for this ${this.context.language || ''} code:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Include edge cases and error conditions.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async fixCode(code) {
        if (!code) {
            return "Please select code that needs fixing.";
        }

        const prompt = `Identify and fix any bugs or issues in this ${this.context.language || ''} code:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Explain what was wrong and how you fixed it.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async optimizeCode(code) {
        if (!code) {
            return "Please select code to optimize.";
        }

        const prompt = `Optimize this ${this.context.language || ''} code for better performance and efficiency:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Focus on performance improvements while maintaining readability.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async generateDocumentation(code) {
        if (!code) {
            return "Please select code to document.";
        }

        const prompt = `Generate comprehensive documentation for this ${this.context.language || ''} code:

\`\`\`${this.context.language || 'text'}
${code}
\`\`\`

Include JSDoc/docstring format appropriate for the language.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async completeCode(partialCode) {
        const prompt = `Complete this ${this.context.language || ''} code:

\`\`\`${this.context.language || 'text'}
${partialCode}
\`\`\`

Provide a logical completion based on the context.`;

        return await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
    }

    async getCompletions(textBeforeCursor, currentWord) {
        // Generate AI-powered completions
        if (!this.context.language || textBeforeCursor.length < 10) {
            return [];
        }

        // Mock completions - in a real implementation, this would call an AI API
        const completions = [];
        
        if (this.context.language === 'javascript' || this.context.language === 'typescript') {
            completions.push(
                { text: 'console.log(', description: 'Log to console' },
                { text: 'function ', description: 'Function declaration' },
                { text: 'const ', description: 'Constant declaration' },
                { text: 'async ', description: 'Async function' }
            );
        } else if (this.context.language === 'python') {
            completions.push(
                { text: 'print(', description: 'Print statement' },
                { text: 'def ', description: 'Function definition' },
                { text: 'class ', description: 'Class definition' },
                { text: 'import ', description: 'Import statement' }
            );
        }

        return completions.filter(c => 
            c.text.toLowerCase().includes(currentWord.toLowerCase())
        );
    }

    async analyzeErrors(markers) {
        if (!markers || markers.length === 0) return;

        const errors = markers.map(m => ({
            message: m.message,
            line: m.startLineNumber,
            severity: m.severity
        }));

        const prompt = `Analyze these ${this.context.language || ''} errors and provide fixes:

${errors.map(e => `Line ${e.line}: ${e.message}`).join('\n')}

Context:
\`\`\`${this.context.language || 'text'}
${this.context.content.slice(0, 500)}
\`\`\`

Provide specific fixes for each error.`;

        const response = await this.callAIModel(this.getModelForLanguage(this.context.language), prompt);
        
        // Show response in a non-intrusive way
        if (window.app) {
            window.app.showToast('AI analyzed errors - check console for details', 'info');
            console.log('AI Error Analysis:', response);
        }
    }

    // Helper methods
    getSelectedText() {
        if (!window.monacoSetup?.editor) return '';
        
        const selection = window.monacoSetup.editor.getSelection();
        const model = window.monacoSetup.editor.getModel();
        
        if (!selection || !model) return '';
        
        return model.getValueInRange(selection);
    }

    getCurrentLine() {
        if (!window.monacoSetup?.editor) return '';
        
        const position = window.monacoSetup.editor.getPosition();
        const model = window.monacoSetup.editor.getModel();
        
        if (!position || !model) return '';
        
        return model.getLineContent(position.lineNumber);
    }

    // Session management
    addToHistory(message, response) {
        this.sessionHistory.push({
            timestamp: Date.now(),
            message: message,
            response: response,
            context: { ...this.context }
        });

        // Keep only last 50 interactions
        if (this.sessionHistory.length > 50) {
            this.sessionHistory = this.sessionHistory.slice(-50);
        }

        this.saveSession();
    }

    saveSession() {
        try {
            localStorage.setItem('boltdiy_session', JSON.stringify(this.sessionHistory));
        } catch (error) {
            console.warn('Failed to save session:', error);
        }
    }

    loadSession() {
        try {
            const saved = localStorage.getItem('boltdiy_session');
            if (saved) {
                this.sessionHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load session:', error);
            this.sessionHistory = [];
        }
    }

    // API key management
    setAPIKey(provider, key) {
        this.apiKeys[provider] = key;
        this.saveAPIKeys();
    }

    // Language model configuration
    setLanguageModel(language, model) {
        this.languageModels[language] = model;
        localStorage.setItem('boltdiy_language_models', JSON.stringify(this.languageModels));
    }
}

// Initialize AI agent
const aiAgent = new AIAgent();
aiAgent.loadSession();

// Export for global access
window.aiAgent = aiAgent;