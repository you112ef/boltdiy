// نظام إدارة الوكلاء المتقدم - Advanced Agent Management System
class AgentManager {
    constructor() {
        this.agents = new Map();
        this.activeAgent = null;
        this.modelProviders = this.initializeProviders();
        this.agentTypes = this.initializeAgentTypes();
        this.conversationHistory = new Map();
        this.contextManager = new ContextManager();
        this.isInitialized = false;
    }

    async init() {
        try {
            await this.loadAgentConfigurations();
            await this.initializeAllAgents();
            this.setupEventListeners();
            this.setupUIComponents();
            this.isInitialized = true;
            console.log('🤖 Agent Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Agent Manager:', error);
        }
    }

    initializeProviders() {
        return {
            openai: {
                models: {
                    'gpt-4': { 
                        capabilities: ['text', 'code', 'reasoning'], 
                        contextWindow: 128000,
                        specialty: 'general'
                    },
                    'gpt-4o': { 
                        capabilities: ['text', 'code', 'vision', 'audio'], 
                        contextWindow: 128000,
                        specialty: 'multimodal'
                    },
                    'gpt-4-turbo': { 
                        capabilities: ['text', 'code', 'json'], 
                        contextWindow: 128000,
                        specialty: 'fast'
                    },
                    'o1': {
                        capabilities: ['reasoning', 'complex-problems'],
                        contextWindow: 200000,
                        specialty: 'reasoning'
                    }
                },
                endpoint: 'https://api.openai.com/v1/chat/completions'
            },
            anthropic: {
                models: {
                    'claude-3-opus': { 
                        capabilities: ['text', 'code', 'reasoning', 'analysis'], 
                        contextWindow: 200000,
                        specialty: 'analysis'
                    },
                    'claude-3-sonnet': { 
                        capabilities: ['text', 'code', 'reasoning'], 
                        contextWindow: 200000,
                        specialty: 'balanced'
                    },
                    'claude-3-haiku': { 
                        capabilities: ['text', 'code'], 
                        contextWindow: 200000,
                        specialty: 'fast'
                    }
                },
                endpoint: 'https://api.anthropic.com/v1/messages'
            },
            google: {
                models: {
                    'gemini-pro': { 
                        capabilities: ['text', 'code'], 
                        contextWindow: 32000,
                        specialty: 'general'
                    },
                    'gemini-pro-vision': { 
                        capabilities: ['text', 'code', 'vision'], 
                        contextWindow: 16000,
                        specialty: 'vision'
                    },
                    'gemini-ultra': { 
                        capabilities: ['text', 'code', 'reasoning'], 
                        contextWindow: 32000,
                        specialty: 'advanced'
                    }
                },
                endpoint: 'https://generativelanguage.googleapis.com/v1/models'
            },
            mistral: {
                models: {
                    'mixtral-8x7b': { 
                        capabilities: ['text', 'code'], 
                        contextWindow: 32000,
                        specialty: 'efficiency'
                    },
                    'mistral-large': { 
                        capabilities: ['text', 'code', 'reasoning'], 
                        contextWindow: 32000,
                        specialty: 'performance'
                    }
                },
                endpoint: 'https://api.mistral.ai/v1/chat/completions'
            },
            cohere: {
                models: {
                    'command-r-plus': { 
                        capabilities: ['text', 'reasoning', 'retrieval'], 
                        contextWindow: 128000,
                        specialty: 'rag'
                    }
                },
                endpoint: 'https://api.cohere.ai/v1/chat'
            }
        };
    }

    initializeAgentTypes() {
        return {
            // وكيل البرمجة - Programming Agent
            programmer: {
                name: 'مطور البرمجيات',
                description: 'متخصص في كتابة وتحليل وتحسين الكود',
                preferredModels: ['gpt-4o', 'claude-3-opus', 'gemini-pro'],
                tools: ['code_analysis', 'refactoring', 'debugging', 'testing'],
                languages: ['javascript', 'python', 'typescript', 'java', 'cpp'],
                prompts: {
                    system: 'أنت مطور برمجيات خبير. تساعد في كتابة كود عالي الجودة وحل المشاكل البرمجية.',
                    context: 'تحليل الكود الحالي والمساعدة في التحسين والتطوير.'
                }
            },

            // وكيل التحليل - Analysis Agent  
            analyst: {
                name: 'محلل البيانات',
                description: 'متخصص في تحليل البيانات والإحصائيات',
                preferredModels: ['claude-3-opus', 'gpt-4', 'o1'],
                tools: ['data_analysis', 'visualization', 'statistics'],
                languages: ['python', 'r', 'sql'],
                prompts: {
                    system: 'أنت محلل بيانات خبير. تساعد في تحليل البيانات واستخراج الرؤى المفيدة.',
                    context: 'تحليل البيانات المتاحة وتقديم تقارير مفصلة.'
                }
            },

            // وكيل التصميم - Design Agent
            designer: {
                name: 'مصمم UI/UX',
                description: 'متخصص في تصميم واجهات المستخدم',
                preferredModels: ['gemini-pro-vision', 'gpt-4o', 'claude-3-sonnet'],
                tools: ['ui_design', 'color_analysis', 'layout_optimization'],
                languages: ['html', 'css', 'scss'],
                prompts: {
                    system: 'أنت مصمم UI/UX خبير. تساعد في إنشاء تصاميم جميلة وسهلة الاستخدام.',
                    context: 'تحسين تجربة المستخدم وتصميم واجهات متجاوبة.'
                }
            },

            // وكيل النظم - DevOps Agent
            devops: {
                name: 'مهندس DevOps',
                description: 'متخصص في النشر والبنية التحتية',
                preferredModels: ['claude-3-haiku', 'gpt-4-turbo', 'mistral-large'],
                tools: ['deployment', 'monitoring', 'automation'],
                languages: ['bash', 'yaml', 'docker'],
                prompts: {
                    system: 'أنت مهندس DevOps خبير. تساعد في أتمتة النشر وإدارة البنية التحتية.',
                    context: 'تحسين عمليات النشر وضمان الأمان والاستقرار.'
                }
            },

            // وكيل الأمان - Security Agent
            security: {
                name: 'خبير الأمان',
                description: 'متخصص في أمان التطبيقات والشبكات',
                preferredModels: ['claude-3-opus', 'gpt-4', 'o1'],
                tools: ['security_audit', 'vulnerability_scan', 'penetration_test'],
                languages: ['python', 'bash', 'javascript'],
                prompts: {
                    system: 'أنت خبير أمان معلومات. تساعد في تحديد وإصلاح الثغرات الأمنية.',
                    context: 'فحص الكود والتطبيقات للتأكد من الأمان.'
                }
            },

            // وكيل التوثيق - Documentation Agent
            documenter: {
                name: 'كاتب التوثيق',
                description: 'متخصص في كتابة الوثائق التقنية',
                preferredModels: ['gpt-4', 'claude-3-sonnet', 'command-r-plus'],
                tools: ['documentation', 'api_docs', 'tutorials'],
                languages: ['markdown', 'rst', 'html'],
                prompts: {
                    system: 'أنت كاتب توثيق تقني خبير. تساعد في إنشاء وثائق واضحة ومفيدة.',
                    context: 'كتابة وثائق شاملة للمشاريع والواجهات البرمجية.'
                }
            }
        };
    }

    async loadAgentConfigurations() {
        try {
            const savedConfigs = localStorage.getItem('boltdiy_agent_configs');
            if (savedConfigs) {
                const configs = JSON.parse(savedConfigs);
                Object.assign(this.agentTypes, configs);
            }
        } catch (error) {
            console.warn('Failed to load agent configurations:', error);
        }
    }

    async initializeAllAgents() {
        for (const [type, config] of Object.entries(this.agentTypes)) {
            const agent = new AIAgent(type, config, this);
            await agent.initialize();
            this.agents.set(type, agent);
        }
        
        // تعيين الوكيل النشط الافتراضي
        this.activeAgent = this.agents.get('programmer');
    }

    setupEventListeners() {
        // استمع لتغييرات السياق
        document.addEventListener('contextChange', (e) => {
            this.handleContextChange(e.detail);
        });

        // استمع لاستعلامات الوكيل
        document.addEventListener('agentQuery', (e) => {
            this.handleAgentQuery(e.detail);
        });

        // استمع لتبديل الوكلاء
        document.addEventListener('switchAgent', (e) => {
            this.switchAgent(e.detail.agentType);
        });
    }

    setupUIComponents() {
        this.createAgentSelector();
        this.createAgentStatus();
        this.createAgentToolbar();
        this.updateAgentPanel();
    }

    createAgentSelector() {
        const agentPanel = document.querySelector('#agent-context');
        if (!agentPanel) return;

        const selector = document.createElement('div');
        selector.className = 'mb-2';
        selector.innerHTML = `
            <label class="block text-xs mb-1">الوكيل النشط:</label>
            <select id="agent-selector" class="w-full p-1 bg-gray-700 border border-gray-600 rounded text-xs">
                ${Object.entries(this.agentTypes).map(([type, config]) => `
                    <option value="${type}">${config.name}</option>
                `).join('')}
            </select>
        `;
        
        agentPanel.appendChild(selector);
        
        document.getElementById('agent-selector').addEventListener('change', (e) => {
            this.switchAgent(e.target.value);
        });
    }

    createAgentStatus() {
        const statusEl = document.getElementById('agent-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="agent-indicator">🤖</span>
                <span class="agent-name">${this.activeAgent?.config.name || 'جاهز'}</span>
                <span class="agent-model text-xs text-gray-500 block">${this.getActiveModel()}</span>
            `;
        }
    }

    createAgentToolbar() {
        const agentInput = document.getElementById('agent-input');
        if (!agentInput) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'flex gap-1 mt-1 flex-wrap';
        toolbar.innerHTML = `
            <button class="agent-tool-btn" data-tool="analyze">تحليل</button>
            <button class="agent-tool-btn" data-tool="optimize">تحسين</button>
            <button class="agent-tool-btn" data-tool="explain">شرح</button>
            <button class="agent-tool-btn" data-tool="fix">إصلاح</button>
            <button class="agent-tool-btn" data-tool="generate">إنشاء</button>
            <button class="agent-tool-btn" data-tool="test">اختبار</button>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .agent-tool-btn {
                font-size: 10px;
                padding: 2px 6px;
                background: #4F46E5;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .agent-tool-btn:hover {
                background: #3730A3;
                transform: scale(1.05);
            }
            .agent-indicator {
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);

        agentInput.parentNode.appendChild(toolbar);

        // إضافة مستمعي الأحداث للأدوات
        toolbar.addEventListener('click', (e) => {
            if (e.target.classList.contains('agent-tool-btn')) {
                const tool = e.target.dataset.tool;
                this.executeTool(tool);
            }
        });
    }

    async switchAgent(agentType) {
        if (!this.agents.has(agentType)) {
            console.warn(`Agent type ${agentType} not found`);
            return;
        }

        this.activeAgent = this.agents.get(agentType);
        this.updateAgentPanel();
        this.contextManager.updateContext({ activeAgent: agentType });
        
        // إشعار بتبديل الوكيل
        if (window.app) {
            window.app.showToast(`تم تبديل إلى: ${this.activeAgent.config.name}`, 'info');
        }

        console.log(`🔄 Switched to agent: ${this.activeAgent.config.name}`);
    }

    updateAgentPanel() {
        if (!this.activeAgent) return;

        this.createAgentStatus();
        
        // تحديث معلومات الوكيل
        const agentContext = document.getElementById('agent-context');
        if (agentContext) {
            const infoDiv = agentContext.querySelector('.agent-info') || document.createElement('div');
            infoDiv.className = 'agent-info text-xs text-gray-400 mt-1';
            infoDiv.innerHTML = `
                <div>النوع: ${this.activeAgent.config.description}</div>
                <div>النموذج: ${this.getActiveModel()}</div>
                <div>الأدوات: ${this.activeAgent.config.tools.length}</div>
            `;
            
            if (!agentContext.querySelector('.agent-info')) {
                agentContext.appendChild(infoDiv);
            }
        }
    }

    getActiveModel() {
        if (!this.activeAgent) return 'غير محدد';
        
        const preferredModels = this.activeAgent.config.preferredModels;
        return preferredModels[0] || 'افتراضي';
    }

    async handleContextChange(context) {
        if (!this.activeAgent) return;

        // تحديث سياق الوكيل النشط
        await this.activeAgent.updateContext(context);
        
        // اختيار أفضل وكيل للسياق الحالي
        const suggestedAgent = this.suggestAgentForContext(context);
        if (suggestedAgent && suggestedAgent !== this.activeAgent.type) {
            // اقتراح تبديل الوكيل
            this.showAgentSuggestion(suggestedAgent);
        }
    }

    suggestAgentForContext(context) {
        const { language, file, content } = context;
        
        // قواعد اقتراح الوكلاء
        if (language === 'html' || language === 'css') {
            return 'designer';
        } else if (language === 'bash' || language === 'docker') {
            return 'devops';
        } else if (file && file.includes('test')) {
            return 'programmer';
        } else if (content && content.includes('security') || content.includes('auth')) {
            return 'security';
        } else if (file && file.includes('README') || file.includes('.md')) {
            return 'documenter';
        } else if (language === 'python' && content && content.includes('pandas')) {
            return 'analyst';
        }
        
        return 'programmer'; // افتراضي
    }

    showAgentSuggestion(suggestedAgentType) {
        const agent = this.agents.get(suggestedAgentType);
        if (!agent) return;

        // إظهار اقتراح بتبديل الوكيل
        const suggestion = document.createElement('div');
        suggestion.className = 'fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50 max-w-xs';
        suggestion.innerHTML = `
            <div class="text-sm mb-2">
                <i class="fas fa-lightbulb mr-1"></i>
                اقتراح: ${agent.config.name}
            </div>
            <div class="text-xs mb-2">${agent.config.description}</div>
            <div class="flex gap-2">
                <button class="bg-white text-blue-600 px-2 py-1 rounded text-xs" onclick="agentManager.acceptSuggestion('${suggestedAgentType}')">قبول</button>
                <button class="bg-transparent border border-white px-2 py-1 rounded text-xs" onclick="this.parentElement.parentElement.remove()">تجاهل</button>
            </div>
        `;
        
        document.body.appendChild(suggestion);
        
        // إزالة تلقائية بعد 10 ثوان
        setTimeout(() => {
            if (suggestion.parentElement) {
                suggestion.remove();
            }
        }, 10000);
    }

    acceptSuggestion(agentType) {
        this.switchAgent(agentType);
        // إزالة جميع الاقتراحات
        document.querySelectorAll('.fixed.bottom-20.right-4').forEach(el => el.remove());
    }

    async handleAgentQuery(queryData) {
        if (!this.activeAgent) {
            console.warn('No active agent available');
            return;
        }

        try {
            const response = await this.activeAgent.processQuery(queryData);
            return response;
        } catch (error) {
            console.error('Agent query failed:', error);
            throw error;
        }
    }

    async executeTool(toolName) {
        if (!this.activeAgent) return;

        const context = this.contextManager.getCurrentContext();
        const toolQuery = {
            tool: toolName,
            context: context,
            timestamp: Date.now()
        };

        try {
            const result = await this.activeAgent.executeTool(toolName, context);
            
            if (window.app) {
                window.app.showToast(`تم تنفيذ: ${toolName}`, 'success');
            }

            return result;
        } catch (error) {
            console.error(`Tool execution failed: ${toolName}`, error);
            if (window.app) {
                window.app.showToast(`فشل في تنفيذ: ${toolName}`, 'error');
            }
        }
    }

    // إدارة الحوارات
    saveConversation(agentType, conversation) {
        if (!this.conversationHistory.has(agentType)) {
            this.conversationHistory.set(agentType, []);
        }
        
        this.conversationHistory.get(agentType).push({
            ...conversation,
            timestamp: Date.now()
        });

        // حفظ في التخزين المحلي
        this.saveConversationsToStorage();
    }

    getConversationHistory(agentType) {
        return this.conversationHistory.get(agentType) || [];
    }

    saveConversationsToStorage() {
        try {
            const historyObj = {};
            for (const [type, history] of this.conversationHistory.entries()) {
                historyObj[type] = history.slice(-50); // احفظ آخر 50 محادثة
            }
            localStorage.setItem('boltdiy_agent_conversations', JSON.stringify(historyObj));
        } catch (error) {
            console.warn('Failed to save conversation history:', error);
        }
    }

    loadConversationsFromStorage() {
        try {
            const saved = localStorage.getItem('boltdiy_agent_conversations');
            if (saved) {
                const historyObj = JSON.parse(saved);
                for (const [type, history] of Object.entries(historyObj)) {
                    this.conversationHistory.set(type, history);
                }
            }
        } catch (error) {
            console.warn('Failed to load conversation history:', error);
        }
    }

    // إحصائيات الوكلاء
    getAgentStats() {
        const stats = {};
        for (const [type, agent] of this.agents.entries()) {
            stats[type] = {
                name: agent.config.name,
                usage: this.getConversationHistory(type).length,
                lastUsed: this.getLastUsedTime(type),
                tools: agent.config.tools.length,
                models: agent.config.preferredModels.length
            };
        }
        return stats;
    }

    getLastUsedTime(agentType) {
        const history = this.getConversationHistory(agentType);
        return history.length > 0 ? history[history.length - 1].timestamp : null;
    }

    // تصدير/استيراد إعدادات الوكلاء
    exportAgentConfigs() {
        const config = {
            agents: Object.fromEntries(this.agents.entries()),
            conversations: Object.fromEntries(this.conversationHistory.entries()),
            modelProviders: this.modelProviders,
            timestamp: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `boltdiy-agents-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    async importAgentConfigs(file) {
        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            if (config.agents) {
                Object.assign(this.agentTypes, config.agents);
            }
            
            if (config.conversations) {
                for (const [type, history] of Object.entries(config.conversations)) {
                    this.conversationHistory.set(type, history);
                }
            }
            
            await this.initializeAllAgents();
            this.saveConversationsToStorage();
            
            if (window.app) {
                window.app.showToast('تم استيراد إعدادات الوكلاء بنجاح', 'success');
            }
        } catch (error) {
            console.error('Failed to import agent configs:', error);
            if (window.app) {
                window.app.showToast('فشل في استيراد الإعدادات', 'error');
            }
        }
    }
}

// إدارة السياق المتقدمة
class ContextManager {
    constructor() {
        this.currentContext = {};
        this.contextHistory = [];
        this.watchers = new Set();
    }

    updateContext(newContext) {
        const previousContext = { ...this.currentContext };
        this.currentContext = { ...this.currentContext, ...newContext };
        
        // إضافة إلى التاريخ
        this.contextHistory.push({
            context: { ...this.currentContext },
            timestamp: Date.now()
        });

        // إشعار المراقبين
        this.notifyWatchers(this.currentContext, previousContext);
        
        // إرسال حدث
        document.dispatchEvent(new CustomEvent('contextChange', {
            detail: this.currentContext
        }));
    }

    getCurrentContext() {
        return { ...this.currentContext };
    }

    addWatcher(callback) {
        this.watchers.add(callback);
    }

    removeWatcher(callback) {
        this.watchers.delete(callback);
    }

    notifyWatchers(current, previous) {
        for (const watcher of this.watchers) {
            try {
                watcher(current, previous);
            } catch (error) {
                console.warn('Context watcher error:', error);
            }
        }
    }

    getContextHistory() {
        return [...this.contextHistory];
    }
}

// وكيل الذكاء الاصطناعي المحسن
class AIAgent {
    constructor(type, config, manager) {
        this.type = type;
        this.config = config;
        this.manager = manager;
        this.currentModel = null;
        this.context = {};
        this.tools = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        this.currentModel = this.selectBestModel();
        await this.loadTools();
        this.isInitialized = true;
        console.log(`🤖 Agent ${this.config.name} initialized with model ${this.currentModel}`);
    }

    selectBestModel() {
        const preferredModels = this.config.preferredModels;
        
        // اختيار أول نموذج متاح
        for (const modelName of preferredModels) {
            const provider = this.findProviderForModel(modelName);
            if (provider && this.hasApiKey(provider)) {
                return { name: modelName, provider };
            }
        }
        
        // استخدام نموذج افتراضي
        return { name: 'gpt-4o', provider: 'openai' };
    }

    findProviderForModel(modelName) {
        for (const [providerName, provider] of Object.entries(this.manager.modelProviders)) {
            if (provider.models[modelName]) {
                return providerName;
            }
        }
        return null;
    }

    hasApiKey(provider) {
        const apiKeys = JSON.parse(localStorage.getItem('boltdiy_api_keys') || '{}');
        return !!apiKeys[provider];
    }

    async loadTools() {
        for (const toolName of this.config.tools) {
            const tool = await this.createTool(toolName);
            this.tools.set(toolName, tool);
        }
    }

    async createTool(toolName) {
        // إنشاء الأدوات حسب النوع
        const toolFactories = {
            code_analysis: () => new CodeAnalysisTool(this),
            refactoring: () => new RefactoringTool(this),
            debugging: () => new DebuggingTool(this),
            testing: () => new TestingTool(this),
            ui_design: () => new UIDesignTool(this),
            security_audit: () => new SecurityAuditTool(this),
            documentation: () => new DocumentationTool(this),
            data_analysis: () => new DataAnalysisTool(this),
            deployment: () => new DeploymentTool(this)
        };

        const factory = toolFactories[toolName];
        return factory ? factory() : new GenericTool(toolName, this);
    }

    async updateContext(context) {
        this.context = { ...this.context, ...context };
    }

    async processQuery(queryData) {
        try {
            const { message, context, tool } = queryData;
            
            // تحديث السياق
            await this.updateContext(context);
            
            // بناء الرسالة
            const prompt = this.buildPrompt(message, context);
            
            // استدعاء النموذج
            const response = await this.callModel(prompt);
            
            // حفظ المحادثة
            this.manager.saveConversation(this.type, {
                query: message,
                response,
                context,
                model: this.currentModel.name
            });
            
            return response;
        } catch (error) {
            console.error(`Agent ${this.type} query failed:`, error);
            throw error;
        }
    }

    buildPrompt(message, context) {
        let prompt = this.config.prompts.system + '\n\n';
        
        // إضافة السياق
        if (context.file) {
            prompt += `الملف الحالي: ${context.file}\n`;
        }
        if (context.language) {
            prompt += `لغة البرمجة: ${context.language}\n`;
        }
        if (context.content) {
            prompt += `محتوى الملف:\n\`\`\`${context.language || 'text'}\n${context.content.slice(0, 2000)}\n\`\`\`\n\n`;
        }
        
        prompt += `استعلام المستخدم: ${message}`;
        
        return prompt;
    }

    async callModel(prompt) {
        const modelConfig = this.manager.modelProviders[this.currentModel.provider];
        const modelInfo = modelConfig.models[this.currentModel.name];
        
        // محاكاة استدعاء النموذج
        // في التطبيق الحقيقي، ستكون هذه استدعاءات API حقيقية
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = [
                    `تم تحليل الكود باستخدام ${this.currentModel.name}. إليك التحليل المفصل...`,
                    `بناءً على السياق الحالي، أقترح التحسينات التالية...`,
                    `تم فحص الكود وإليك النتائج والتوصيات...`,
                    `كوكيل ${this.config.name}، يمكنني مساعدتك في...`
                ];
                resolve(responses[Math.floor(Math.random() * responses.length)]);
            }, 1000 + Math.random() * 2000);
        });
    }

    async executeTool(toolName, context) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found for agent ${this.type}`);
        }
        
        return await tool.execute(context);
    }
}

// تهيئة نظام إدارة الوكلاء
const agentManager = new AgentManager();

// التهيئة التلقائية عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        agentManager.init();
    });
} else {
    agentManager.init();
}

// تصدير للوصول العام
window.agentManager = agentManager;