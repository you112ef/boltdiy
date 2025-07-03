// لوحة التحكم الإدارية المتقدمة - Advanced Admin Dashboard
class AdminDashboard {
    constructor() {
        this.isVisible = false;
        this.charts = new Map();
        this.updateInterval = null;
        this.refreshRate = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.createDashboard();
        this.setupEventListeners();
        this.loadData();
    }

    createDashboard() {
        // إنشاء لوحة التحكم المخفية
        const dashboard = document.createElement('div');
        dashboard.id = 'admin-dashboard';
        dashboard.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 hidden overflow-y-auto';
        dashboard.innerHTML = this.getDashboardHTML();
        document.body.appendChild(dashboard);

        // إضافة زر الوصول السريع
        const quickAccessBtn = document.createElement('button');
        quickAccessBtn.className = 'fixed bottom-4 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg z-40 hover:bg-purple-700 transition-colors';
        quickAccessBtn.innerHTML = '<i class="fas fa-chart-bar text-lg"></i>';
        quickAccessBtn.title = 'لوحة التحكم الإدارية';
        quickAccessBtn.onclick = () => this.toggle();
        document.body.appendChild(quickAccessBtn);
    }

    getDashboardHTML() {
        return `
            <div class="container mx-auto p-4 max-w-7xl">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-3xl font-bold text-white">🔧 لوحة التحكم الإدارية</h1>
                    <div class="flex gap-2">
                        <button id="refresh-dashboard" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>تحديث
                        </button>
                        <button id="export-data" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                            <i class="fas fa-download mr-2"></i>تصدير
                        </button>
                        <button id="close-dashboard" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors">
                            <i class="fas fa-times mr-2"></i>إغلاق
                        </button>
                    </div>
                </div>

                <!-- Status Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-200 text-sm">الوكلاء النشطون</p>
                                <p id="active-agents-count" class="text-2xl font-bold">0</p>
                            </div>
                            <i class="fas fa-robot text-3xl text-blue-200"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-200 text-sm">طلبات API اليوم</p>
                                <p id="api-requests-count" class="text-2xl font-bold">0</p>
                            </div>
                            <i class="fas fa-exchange-alt text-3xl text-green-200"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-200 text-sm">متوسط وقت الاستجابة</p>
                                <p id="avg-response-time" class="text-2xl font-bold">0ms</p>
                            </div>
                            <i class="fas fa-clock text-3xl text-purple-200"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-orange-200 text-sm">استهلاك التوكنز</p>
                                <p id="tokens-consumed" class="text-2xl font-bold">0</p>
                            </div>
                            <i class="fas fa-coins text-3xl text-orange-200"></i>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Agent Performance Chart -->
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-xl font-bold text-white mb-4">📊 أداء الوكلاء</h3>
                        <canvas id="agent-performance-chart" width="400" height="200"></canvas>
                    </div>

                    <!-- API Usage Chart -->
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-xl font-bold text-white mb-4">📈 استخدام API</h3>
                        <canvas id="api-usage-chart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Agents Management -->
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-xl font-bold text-white mb-4">🤖 إدارة الوكلاء</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full text-white text-sm">
                                <thead>
                                    <tr class="border-b border-gray-600">
                                        <th class="text-right py-2">الوكيل</th>
                                        <th class="text-right py-2">الحالة</th>
                                        <th class="text-right py-2">الاستخدام</th>
                                        <th class="text-right py-2">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody id="agents-table">
                                    <!-- سيتم ملؤها ديناميكياً -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- System Logs -->
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h3 class="text-xl font-bold text-white mb-4">📝 سجل النظام</h3>
                        <div id="system-logs" class="bg-gray-900 p-3 rounded max-h-64 overflow-y-auto text-xs text-gray-300 font-mono">
                            <!-- سيتم ملؤه ديناميكياً -->
                        </div>
                    </div>
                </div>

                <!-- API Configuration -->
                <div class="mt-6 bg-gray-800 p-4 rounded-lg">
                    <h3 class="text-xl font-bold text-white mb-4">⚙️ إعدادات API</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="provider-config" data-provider="openai">
                            <h4 class="text-white font-medium mb-2">OpenAI</h4>
                            <div class="flex items-center gap-2">
                                <span id="openai-status" class="w-3 h-3 rounded-full bg-red-500"></span>
                                <span class="text-sm text-gray-300">غير متصل</span>
                                <button class="test-api ml-auto text-xs bg-blue-600 px-2 py-1 rounded" data-provider="openai">اختبار</button>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                <div id="openai-requests">الطلبات: 0/60</div>
                                <div id="openai-cost">التكلفة: $0.00</div>
                            </div>
                        </div>

                        <div class="provider-config" data-provider="anthropic">
                            <h4 class="text-white font-medium mb-2">Anthropic</h4>
                            <div class="flex items-center gap-2">
                                <span id="anthropic-status" class="w-3 h-3 rounded-full bg-red-500"></span>
                                <span class="text-sm text-gray-300">غير متصل</span>
                                <button class="test-api ml-auto text-xs bg-blue-600 px-2 py-1 rounded" data-provider="anthropic">اختبار</button>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                <div id="anthropic-requests">الطلبات: 0/50</div>
                                <div id="anthropic-cost">التكلفة: $0.00</div>
                            </div>
                        </div>

                        <div class="provider-config" data-provider="google">
                            <h4 class="text-white font-medium mb-2">Google AI</h4>
                            <div class="flex items-center gap-2">
                                <span id="google-status" class="w-3 h-3 rounded-full bg-red-500"></span>
                                <span class="text-sm text-gray-300">غير متصل</span>
                                <button class="test-api ml-auto text-xs bg-blue-600 px-2 py-1 rounded" data-provider="google">اختبار</button>
                            </div>
                            <div class="text-xs text-gray-400 mt-1">
                                <div id="google-requests">الطلبات: 0/100</div>
                                <div id="google-cost">التكلفة: $0.00</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Real-time Monitoring -->
                <div class="mt-6 bg-gray-800 p-4 rounded-lg">
                    <h3 class="text-xl font-bold text-white mb-4">📡 المراقبة المباشرة</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gray-900 p-3 rounded">
                            <h4 class="text-white text-sm font-medium mb-2">حالة الخادم</h4>
                            <div id="server-status" class="text-green-400 text-xs">🟢 متصل</div>
                            <div id="server-uptime" class="text-gray-400 text-xs">وقت التشغيل: 2h 34m</div>
                        </div>
                        
                        <div class="bg-gray-900 p-3 rounded">
                            <h4 class="text-white text-sm font-medium mb-2">الذاكرة</h4>
                            <div id="memory-usage" class="text-blue-400 text-xs">الاستخدام: 45%</div>
                            <div class="w-full bg-gray-700 rounded-full h-2 mt-1">
                                <div id="memory-bar" class="bg-blue-500 h-2 rounded-full" style="width: 45%"></div>
                            </div>
                        </div>
                        
                        <div class="bg-gray-900 p-3 rounded">
                            <h4 class="text-white text-sm font-medium mb-2">الشبكة</h4>
                            <div id="network-speed" class="text-purple-400 text-xs">السرعة: 250ms</div>
                            <div id="network-status" class="text-gray-400 text-xs">مستقر</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // إغلاق لوحة التحكم
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-dashboard') {
                this.hide();
            }
            
            if (e.target.id === 'refresh-dashboard') {
                this.loadData();
            }
            
            if (e.target.id === 'export-data') {
                this.exportData();
            }
            
            if (e.target.classList.contains('test-api')) {
                const provider = e.target.dataset.provider;
                this.testAPIConnection(provider);
            }
        });

        // مفاتيح الاختصار
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D لفتح لوحة التحكم
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
            
            // Escape لإغلاق لوحة التحكم
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        const dashboard = document.getElementById('admin-dashboard');
        dashboard.classList.remove('hidden');
        this.isVisible = true;
        this.startAutoRefresh();
        this.loadData();
    }

    hide() {
        const dashboard = document.getElementById('admin-dashboard');
        dashboard.classList.add('hidden');
        this.isVisible = false;
        this.stopAutoRefresh();
    }

    startAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.loadData();
        }, this.refreshRate);
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.updateStats(),
                this.updateAgentsTable(),
                this.updateCharts(),
                this.updateAPIStatus(),
                this.updateSystemLogs(),
                this.updateSystemMonitoring()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async updateStats() {
        // إحصائيات الوكلاء
        if (window.agentManager) {
            const stats = window.agentManager.getAgentStats();
            document.getElementById('active-agents-count').textContent = Object.keys(stats).length;
        }

        // إحصائيات API
        if (window.unifiedAI) {
            const usage = window.unifiedAI.getUsageStats();
            let totalRequests = 0;
            let totalTokens = 0;
            let totalResponseTime = 0;
            let responseCount = 0;

            Object.values(usage).forEach(provider => {
                totalRequests += provider.requestsLastHour || 0;
            });

            document.getElementById('api-requests-count').textContent = totalRequests;
            document.getElementById('tokens-consumed').textContent = totalTokens.toLocaleString();
            
            const avgTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
            document.getElementById('avg-response-time').textContent = Math.round(avgTime) + 'ms';
        }
    }

    async updateAgentsTable() {
        const tbody = document.getElementById('agents-table');
        if (!tbody || !window.agentManager) return;

        const stats = window.agentManager.getAgentStats();
        tbody.innerHTML = '';

        Object.entries(stats).forEach(([type, data]) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-700';
            
            const isActive = window.agentManager.activeAgent?.type === type;
            const statusColor = isActive ? 'text-green-400' : 'text-gray-400';
            const statusText = isActive ? 'نشط' : 'خامل';
            
            row.innerHTML = `
                <td class="py-2">${data.name}</td>
                <td class="py-2 ${statusColor}">${statusText}</td>
                <td class="py-2">${data.usage || 0}</td>
                <td class="py-2">
                    <button class="text-xs bg-blue-600 px-2 py-1 rounded mr-1" onclick="adminDashboard.switchToAgent('${type}')">تفعيل</button>
                    <button class="text-xs bg-gray-600 px-2 py-1 rounded" onclick="adminDashboard.configureAgent('${type}')">إعداد</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateCharts() {
        this.updateAgentPerformanceChart();
        this.updateAPIUsageChart();
    }

    updateAgentPerformanceChart() {
        const canvas = document.getElementById('agent-performance-chart');
        if (!canvas || !window.agentManager) return;

        const ctx = canvas.getContext('2d');
        const stats = window.agentManager.getAgentStats();
        
        // بيانات وهمية للعرض التوضيحي
        const labels = Object.values(stats).map(s => s.name);
        const data = Object.values(stats).map(s => s.usage || Math.random() * 100);
        
        this.drawBarChart(ctx, labels, data, {
            title: 'استخدام الوكلاء',
            color: '#4F46E5'
        });
    }

    updateAPIUsageChart() {
        const canvas = document.getElementById('api-usage-chart');
        if (!canvas || !window.unifiedAI) return;

        const ctx = canvas.getContext('2d');
        const usage = window.unifiedAI.getUsageStats();
        
        const labels = Object.keys(usage);
        const data = Object.values(usage).map(p => p.requestsLastHour || 0);
        
        this.drawLineChart(ctx, labels, data, {
            title: 'طلبات API',
            color: '#10B981'
        });
    }

    drawBarChart(ctx, labels, data, options) {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        
        const margin = 40;
        const chartWidth = width - 2 * margin;
        const chartHeight = height - 2 * margin;
        
        const maxValue = Math.max(...data, 1);
        const barWidth = chartWidth / labels.length;
        
        // رسم الأعمدة
        data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = margin + index * barWidth + barWidth * 0.2;
            const y = height - margin - barHeight;
            
            ctx.fillStyle = options.color;
            ctx.fillRect(x, y, barWidth * 0.6, barHeight);
            
            // رسم التسميات
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + barWidth * 0.3, height - margin + 15);
            ctx.fillText(Math.round(value), x + barWidth * 0.3, y - 5);
        });
    }

    drawLineChart(ctx, labels, data, options) {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        
        const margin = 40;
        const chartWidth = width - 2 * margin;
        const chartHeight = height - 2 * margin;
        
        const maxValue = Math.max(...data, 1);
        const stepX = chartWidth / (labels.length - 1);
        
        // رسم الخط
        ctx.strokeStyle = options.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = margin + index * stepX;
            const y = height - margin - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // رسم النقاط
            ctx.fillStyle = options.color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.stroke();
        
        // رسم التسميات
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        labels.forEach((label, index) => {
            const x = margin + index * stepX;
            ctx.fillText(label, x, height - margin + 15);
        });
    }

    async updateAPIStatus() {
        const providers = ['openai', 'anthropic', 'google', 'mistral', 'cohere'];
        
        providers.forEach(provider => {
            const statusEl = document.getElementById(`${provider}-status`);
            const hasKey = window.unifiedAI?.hasAPIKey(provider);
            
            if (statusEl) {
                statusEl.className = `w-3 h-3 rounded-full ${hasKey ? 'bg-green-500' : 'bg-red-500'}`;
                statusEl.nextElementSibling.textContent = hasKey ? 'متصل' : 'غير متصل';
            }
            
            // تحديث إحصائيات الاستخدام
            if (window.unifiedAI) {
                const usage = window.unifiedAI.getUsageStats();
                const providerUsage = usage[provider];
                
                if (providerUsage) {
                    const requestsEl = document.getElementById(`${provider}-requests`);
                    if (requestsEl) {
                        requestsEl.textContent = `الطلبات: ${providerUsage.requestsLastHour}/${providerUsage.rateLimit.requests}`;
                    }
                }
            }
        });
    }

    updateSystemLogs() {
        const logsEl = document.getElementById('system-logs');
        if (!logsEl) return;

        // الحصول على السجلات من console
        const logs = this.getRecentLogs();
        logsEl.innerHTML = logs.map(log => 
            `<div class="mb-1">
                <span class="text-gray-500">[${log.time}]</span>
                <span class="${this.getLogColor(log.level)}">${log.level}:</span>
                <span>${log.message}</span>
            </div>`
        ).join('');
        
        // التمرير إلى الأسفل
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    getRecentLogs() {
        // محاكاة السجلات - في التطبيق الحقيقي، ستحصل على السجلات من النظام
        const logs = [
            { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Agent Manager initialized' },
            { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Unified AI API ready' },
            { time: new Date().toLocaleTimeString(), level: 'WARN', message: 'Rate limit approaching for OpenAI' },
            { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Semantic search completed' }
        ];
        
        return logs.slice(-10); // آخر 10 سجلات
    }

    getLogColor(level) {
        const colors = {
            'INFO': 'text-blue-400',
            'WARN': 'text-yellow-400',
            'ERROR': 'text-red-400',
            'DEBUG': 'text-gray-400'
        };
        return colors[level] || 'text-white';
    }

    updateSystemMonitoring() {
        // محاكاة مراقبة النظام
        const memoryUsage = Math.random() * 100;
        const networkSpeed = 200 + Math.random() * 100;
        
        document.getElementById('memory-usage').textContent = `الاستخدام: ${Math.round(memoryUsage)}%`;
        document.getElementById('memory-bar').style.width = `${memoryUsage}%`;
        document.getElementById('network-speed').textContent = `السرعة: ${Math.round(networkSpeed)}ms`;
        
        // تحديث وقت التشغيل
        const uptime = this.getUptime();
        document.getElementById('server-uptime').textContent = `وقت التشغيل: ${uptime}`;
    }

    getUptime() {
        const startTime = localStorage.getItem('boltdiy_start_time') || Date.now();
        const uptime = Date.now() - parseInt(startTime);
        
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    async testAPIConnection(provider) {
        const btn = document.querySelector(`[data-provider="${provider}"]`);
        const originalText = btn.textContent;
        
        btn.textContent = 'اختبار...';
        btn.disabled = true;
        
        try {
            if (window.unifiedAI && window.unifiedAI.hasAPIKey(provider)) {
                // اختبار بسيط للاتصال
                const response = await window.unifiedAI.generateCompletion({
                    provider: provider,
                    model: this.getDefaultModel(provider),
                    messages: 'Test connection',
                    options: { maxTokens: 5 }
                });
                
                btn.textContent = 'نجح ✓';
                btn.className = btn.className.replace('bg-blue-600', 'bg-green-600');
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.className = btn.className.replace('bg-green-600', 'bg-blue-600');
                    btn.disabled = false;
                }, 2000);
            } else {
                throw new Error('No API key found');
            }
        } catch (error) {
            btn.textContent = 'فشل ✗';
            btn.className = btn.className.replace('bg-blue-600', 'bg-red-600');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.className = btn.className.replace('bg-red-600', 'bg-blue-600');
                btn.disabled = false;
            }, 2000);
        }
    }

    getDefaultModel(provider) {
        const models = {
            'openai': 'gpt-4o',
            'anthropic': 'claude-3-sonnet',
            'google': 'gemini-pro',
            'mistral': 'mistral-large',
            'cohere': 'command-r-plus'
        };
        return models[provider];
    }

    switchToAgent(agentType) {
        if (window.agentManager) {
            window.agentManager.switchAgent(agentType);
            this.updateAgentsTable();
        }
    }

    configureAgent(agentType) {
        // فتح نافذة تكوين الوكيل
        alert(`تكوين الوكيل: ${agentType}\n(سيتم تنفيذ هذه الميزة لاحقاً)`);
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            stats: window.agentManager?.getAgentStats() || {},
            apiUsage: window.unifiedAI?.getUsageStats() || {},
            systemInfo: {
                uptime: this.getUptime(),
                memoryUsage: '45%',
                networkSpeed: '250ms'
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `boltdiy-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// تهيئة لوحة التحكم
const adminDashboard = new AdminDashboard();

// حفظ وقت البداية
if (!localStorage.getItem('boltdiy_start_time')) {
    localStorage.setItem('boltdiy_start_time', Date.now().toString());
}

// تصدير للوصول العام
window.adminDashboard = adminDashboard;