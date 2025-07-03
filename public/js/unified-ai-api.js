// نظام API موحد للذكاء الاصطناعي - Unified AI API System
class UnifiedAIAPI {
    constructor() {
        this.providers = this.initializeProviders();
        this.apiKeys = this.loadAPIKeys();
        this.rateLimits = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    initializeProviders() {
        return {
            openai: new OpenAIProvider(),
            anthropic: new AnthropicProvider(),
            google: new GoogleProvider(),
            mistral: new MistralProvider(),
            cohere: new CohereProvider()
        };
    }

    loadAPIKeys() {
        try {
            return JSON.parse(localStorage.getItem('boltdiy_api_keys') || '{}');
        } catch {
            return {};
        }
    }

    setAPIKey(provider, key) {
        this.apiKeys[provider] = key;
        localStorage.setItem('boltdiy_api_keys', JSON.stringify(this.apiKeys));
    }

    hasAPIKey(provider) {
        return !!this.apiKeys[provider];
    }

    async generateCompletion(request) {
        const { model, messages, provider, options = {} } = request;
        
        // التحقق من وجود المفتاح
        if (!this.hasAPIKey(provider)) {
            throw new Error(`API key not found for provider: ${provider}`);
        }

        // إضافة إلى قائمة الانتظار إذا لزم الأمر
        if (this.shouldQueue(provider)) {
            return this.queueRequest(request);
        }

        try {
            // تسجيل الطلب
            this.recordRequest(provider);
            
            // استدعاء المزود
            const providerInstance = this.providers[provider];
            const response = await providerInstance.generateCompletion({
                model,
                messages,
                apiKey: this.apiKeys[provider],
                options
            });

            return this.formatResponse(response, provider, model);
        } catch (error) {
            return this.handleError(error, request);
        }
    }

    shouldQueue(provider) {
        const limit = this.getRateLimit(provider);
        const recent = this.getRecentRequests(provider);
        return recent.length >= limit.requests;
    }

    getRateLimit(provider) {
        const limits = {
            openai: { requests: 60, window: 60000 }, // 60 requests per minute
            anthropic: { requests: 50, window: 60000 },
            google: { requests: 100, window: 60000 },
            mistral: { requests: 30, window: 60000 },
            cohere: { requests: 40, window: 60000 }
        };
        return limits[provider] || { requests: 10, window: 60000 };
    }

    getRecentRequests(provider) {
        const requests = this.rateLimits.get(provider) || [];
        const now = Date.now();
        const limit = this.getRateLimit(provider);
        
        // تصفية الطلبات القديمة
        return requests.filter(timestamp => now - timestamp < limit.window);
    }

    recordRequest(provider) {
        const requests = this.getRecentRequests(provider);
        requests.push(Date.now());
        this.rateLimits.set(provider, requests);
    }

    async queueRequest(request) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0) {
            const { request, resolve, reject } = this.requestQueue.shift();
            
            try {
                if (!this.shouldQueue(request.provider)) {
                    const response = await this.generateCompletion(request);
                    resolve(response);
                } else {
                    // إعادة إضافة إلى القائمة
                    this.requestQueue.unshift({ request, resolve, reject });
                    await this.delay(1000); // انتظار ثانية
                }
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }

    async handleError(error, request, retryCount = 0) {
        console.error(`AI API Error for ${request.provider}:`, error);

        // إعادة المحاولة للأخطاء المؤقتة
        if (this.isRetryableError(error) && retryCount < this.retryConfig.maxRetries) {
            const delay = Math.min(
                this.retryConfig.baseDelay * Math.pow(2, retryCount),
                this.retryConfig.maxDelay
            );
            
            await this.delay(delay);
            return this.generateCompletion(request);
        }

        throw new Error(`AI API failed: ${error.message}`);
    }

    isRetryableError(error) {
        const retryableStatuses = [429, 500, 502, 503, 504];
        return retryableStatuses.includes(error.status) || 
               error.message.includes('rate limit') ||
               error.message.includes('timeout');
    }

    formatResponse(response, provider, model) {
        return {
            content: response.content,
            model: model,
            provider: provider,
            usage: response.usage || {},
            timestamp: Date.now(),
            metadata: {
                processingTime: response.processingTime,
                tokensUsed: response.usage?.total_tokens || 0
            }
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // تحليل الاستخدام والإحصائيات
    getUsageStats() {
        const stats = {};
        
        for (const [provider, requests] of this.rateLimits.entries()) {
            const recent = this.getRecentRequests(provider);
            stats[provider] = {
                requestsLastHour: recent.length,
                rateLimit: this.getRateLimit(provider),
                hasApiKey: this.hasAPIKey(provider)
            };
        }
        
        return stats;
    }
}

// مزودو الخدمة - Service Providers
class BaseProvider {
    constructor() {
        this.baseURL = '';
        this.defaultModel = '';
    }

    async generateCompletion(request) {
        throw new Error('generateCompletion must be implemented');
    }

    formatMessages(messages) {
        return messages;
    }

    async makeRequest(url, options) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(url, options);
            const processingTime = Date.now() - startTime;
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return { ...data, processingTime };
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }
}

// مزود OpenAI
class OpenAIProvider extends BaseProvider {
    constructor() {
        super();
        this.baseURL = 'https://api.openai.com/v1';
        this.defaultModel = 'gpt-4o';
    }

    async generateCompletion({ model, messages, apiKey, options }) {
        const url = `${this.baseURL}/chat/completions`;
        
        const requestBody = {
            model: model || this.defaultModel,
            messages: this.formatMessages(messages),
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 1,
            ...options
        };

        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage,
            processingTime: response.processingTime
        };
    }

    formatMessages(messages) {
        if (typeof messages === 'string') {
            return [{ role: 'user', content: messages }];
        }
        return messages;
    }
}

// مزود Anthropic
class AnthropicProvider extends BaseProvider {
    constructor() {
        super();
        this.baseURL = 'https://api.anthropic.com/v1';
        this.defaultModel = 'claude-3-sonnet-20240229';
    }

    async generateCompletion({ model, messages, apiKey, options }) {
        const url = `${this.baseURL}/messages`;
        
        const requestBody = {
            model: model || this.defaultModel,
            messages: this.formatMessages(messages),
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            ...options
        };

        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        return {
            content: response.content[0]?.text || '',
            usage: response.usage,
            processingTime: response.processingTime
        };
    }

    formatMessages(messages) {
        if (typeof messages === 'string') {
            return [{ role: 'user', content: messages }];
        }
        return messages;
    }
}

// مزود Google
class GoogleProvider extends BaseProvider {
    constructor() {
        super();
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
        this.defaultModel = 'gemini-pro';
    }

    async generateCompletion({ model, messages, apiKey, options }) {
        const modelName = model || this.defaultModel;
        const url = `${this.baseURL}/models/${modelName}:generateContent?key=${apiKey}`;
        
        const requestBody = {
            contents: this.formatMessages(messages),
            generationConfig: {
                maxOutputTokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
                topP: options.topP || 1
            }
        };

        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return {
            content: response.candidates[0]?.content?.parts[0]?.text || '',
            usage: response.usageMetadata || {},
            processingTime: response.processingTime
        };
    }

    formatMessages(messages) {
        if (typeof messages === 'string') {
            return [{ parts: [{ text: messages }] }];
        }
        
        return messages.map(msg => ({
            parts: [{ text: msg.content }],
            role: msg.role === 'assistant' ? 'model' : 'user'
        }));
    }
}

// مزود Mistral
class MistralProvider extends BaseProvider {
    constructor() {
        super();
        this.baseURL = 'https://api.mistral.ai/v1';
        this.defaultModel = 'mistral-large-latest';
    }

    async generateCompletion({ model, messages, apiKey, options }) {
        const url = `${this.baseURL}/chat/completions`;
        
        const requestBody = {
            model: model || this.defaultModel,
            messages: this.formatMessages(messages),
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 1
        };

        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return {
            content: response.choices[0]?.message?.content || '',
            usage: response.usage,
            processingTime: response.processingTime
        };
    }
}

// مزود Cohere
class CohereProvider extends BaseProvider {
    constructor() {
        super();
        this.baseURL = 'https://api.cohere.ai/v1';
        this.defaultModel = 'command-r-plus';
    }

    async generateCompletion({ model, messages, apiKey, options }) {
        const url = `${this.baseURL}/chat`;
        
        const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : { content: messages };
        
        const requestBody = {
            model: model || this.defaultModel,
            message: lastMessage.content,
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            p: options.topP || 1
        };

        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return {
            content: response.text || '',
            usage: response.meta || {},
            processingTime: response.processingTime
        };
    }
}

// نظام اختيار أفضل نموذج
class ModelSelector {
    constructor(unifiedAPI) {
        this.unifiedAPI = unifiedAPI;
        this.modelCapabilities = this.initializeCapabilities();
        this.performanceHistory = new Map();
    }

    initializeCapabilities() {
        return {
            'gpt-4': { 
                strengths: ['reasoning', 'complex-tasks', 'coding'], 
                cost: 'high',
                speed: 'medium'
            },
            'gpt-4o': { 
                strengths: ['multimodal', 'fast', 'coding'], 
                cost: 'medium',
                speed: 'fast'
            },
            'claude-3-opus': { 
                strengths: ['analysis', 'writing', 'reasoning'], 
                cost: 'high',
                speed: 'slow'
            },
            'claude-3-sonnet': { 
                strengths: ['balanced', 'coding', 'analysis'], 
                cost: 'medium',
                speed: 'medium'
            },
            'claude-3-haiku': { 
                strengths: ['fast', 'simple-tasks'], 
                cost: 'low',
                speed: 'fast'
            },
            'gemini-pro': { 
                strengths: ['general', 'coding'], 
                cost: 'low',
                speed: 'fast'
            },
            'gemini-pro-vision': { 
                strengths: ['vision', 'multimodal'], 
                cost: 'medium',
                speed: 'medium'
            }
        };
    }

    selectBestModel(task, constraints = {}) {
        const { 
            preferredProviders = [], 
            maxCost = 'high', 
            minSpeed = 'slow',
            requiredCapabilities = []
        } = constraints;

        let candidates = [];

        // فلترة النماذج حسب القيود
        for (const [model, capabilities] of Object.entries(this.modelCapabilities)) {
            const provider = this.getProviderForModel(model);
            
            if (preferredProviders.length > 0 && !preferredProviders.includes(provider)) {
                continue;
            }

            if (!this.unifiedAPI.hasAPIKey(provider)) {
                continue;
            }

            if (this.compareCost(capabilities.cost, maxCost) > 0) {
                continue;
            }

            if (this.compareSpeed(capabilities.speed, minSpeed) < 0) {
                continue;
            }

            if (requiredCapabilities.length > 0) {
                const hasRequired = requiredCapabilities.every(cap => 
                    capabilities.strengths.includes(cap)
                );
                if (!hasRequired) continue;
            }

            candidates.push({ model, provider, capabilities });
        }

        // ترتيب المرشحين حسب الملاءمة
        candidates.sort((a, b) => {
            const scoreA = this.calculateScore(a, task, constraints);
            const scoreB = this.calculateScore(b, task, constraints);
            return scoreB - scoreA;
        });

        return candidates[0] || null;
    }

    getProviderForModel(model) {
        const providers = {
            'gpt-4': 'openai',
            'gpt-4o': 'openai',
            'gpt-4-turbo': 'openai',
            'claude-3-opus': 'anthropic',
            'claude-3-sonnet': 'anthropic',
            'claude-3-haiku': 'anthropic',
            'gemini-pro': 'google',
            'gemini-pro-vision': 'google',
            'mistral-large': 'mistral',
            'command-r-plus': 'cohere'
        };
        return providers[model];
    }

    calculateScore(candidate, task, constraints) {
        let score = 0;
        const { model, capabilities } = candidate;

        // نقاط للقدرات المطلوبة
        if (task.type === 'coding' && capabilities.strengths.includes('coding')) {
            score += 3;
        }
        if (task.type === 'analysis' && capabilities.strengths.includes('analysis')) {
            score += 3;
        }
        if (task.type === 'reasoning' && capabilities.strengths.includes('reasoning')) {
            score += 3;
        }

        // نقاط للأداء السابق
        const performance = this.performanceHistory.get(model);
        if (performance) {
            score += performance.averageScore;
        }

        // نقاط للسرعة والتكلفة
        if (capabilities.speed === 'fast') score += 1;
        if (capabilities.cost === 'low') score += 1;

        return score;
    }

    compareCost(cost1, cost2) {
        const costOrder = { 'low': 0, 'medium': 1, 'high': 2 };
        return costOrder[cost1] - costOrder[cost2];
    }

    compareSpeed(speed1, speed2) {
        const speedOrder = { 'slow': 0, 'medium': 1, 'fast': 2 };
        return speedOrder[speed1] - speedOrder[speed2];
    }

    recordPerformance(model, score, responseTime) {
        if (!this.performanceHistory.has(model)) {
            this.performanceHistory.set(model, { scores: [], responseTimes: [] });
        }
        
        const history = this.performanceHistory.get(model);
        history.scores.push(score);
        history.responseTimes.push(responseTime);
        
        // احتفظ بآخر 100 نتيجة فقط
        if (history.scores.length > 100) {
            history.scores = history.scores.slice(-100);
            history.responseTimes = history.responseTimes.slice(-100);
        }
        
        // حساب المتوسطات
        history.averageScore = history.scores.reduce((a, b) => a + b, 0) / history.scores.length;
        history.averageResponseTime = history.responseTimes.reduce((a, b) => a + b, 0) / history.responseTimes.length;
    }
}

// تهيئة النظام الموحد
const unifiedAI = new UnifiedAIAPI();
const modelSelector = new ModelSelector(unifiedAI);

// تصدير للوصول العام
window.unifiedAI = unifiedAI;
window.modelSelector = modelSelector;