// Semantic Search Handler for BoltDIY Platform
// AI-powered intelligent code search

class SemanticSearch {
    constructor() {
        this.isInitialized = false;
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.currentResults = [];
        this.searchSuggestions = [
            'component state management',
            'async function error handling', 
            'responsive CSS layout',
            'API integration pattern',
            'database query optimization',
            'authentication middleware',
            'form validation logic',
            'routing configuration'
        ];
    }

    initialize() {
        console.log('🔍 Initializing Semantic Search...');
        this.buildSearchIndex();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ Semantic Search initialized');
    }

    buildSearchIndex() {
        if (!window.app?.fileSystem) {
            console.warn('File system not available for search indexing');
            return;
        }

        console.log('📚 Building search index...');
        
        for (const [filepath, file] of window.app.fileSystem.entries()) {
            this.indexFile(filepath, file);
        }
        
        console.log(`📊 Indexed ${this.searchIndex.size} files`);
    }

    indexFile(filepath, file) {
        const content = file.content || '';
        const language = file.language || 'text';
        
        // Extract searchable terms
        const terms = this.extractTerms(content, language);
        const symbols = this.extractSymbols(content, language);
        const imports = this.extractImports(content, language);
        const comments = this.extractComments(content, language);
        
        this.searchIndex.set(filepath, {
            content,
            language,
            terms,
            symbols,
            imports,
            comments,
            wordCount: content.split(/\s+/).length,
            lineCount: content.split('\n').length,
            lastModified: Date.now()
        });
    }

    extractTerms(content, language) {
        // Extract meaningful terms based on language
        const terms = new Set();
        
        // Common programming terms
        const patterns = {
            functions: /(?:function|def|const|let|var)\s+(\w+)/gi,
            classes: /class\s+(\w+)/gi,
            variables: /(?:const|let|var)\s+(\w+)/gi,
            properties: /\.(\w+)/gi,
            methods: /(\w+)\s*\(/gi,
            keywords: /\b(async|await|return|if|else|for|while|try|catch|finally|import|export)\b/gi
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    terms.add(match[1].toLowerCase());
                }
            }
        }

        return Array.from(terms);
    }

    extractSymbols(content, language) {
        const symbols = [];
        
        // Language-specific symbol extraction
        switch (language) {
            case 'javascript':
            case 'typescript':
                // Functions, classes, constants
                const jsPatterns = [
                    /(?:function|const|let|var)\s+(\w+)/g,
                    /class\s+(\w+)/g,
                    /(\w+)\s*:/g, // Object properties
                    /\.(\w+)\s*=/g // Property assignments
                ];
                
                jsPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        symbols.push({
                            name: match[1],
                            type: 'symbol',
                            line: content.substring(0, match.index).split('\n').length
                        });
                    }
                });
                break;
                
            case 'python':
                // Python functions, classes, variables
                const pyPatterns = [
                    /def\s+(\w+)/g,
                    /class\s+(\w+)/g,
                    /(\w+)\s*=/g
                ];
                
                pyPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        symbols.push({
                            name: match[1],
                            type: 'symbol',
                            line: content.substring(0, match.index).split('\n').length
                        });
                    }
                });
                break;
        }
        
        return symbols;
    }

    extractImports(content, language) {
        const imports = [];
        
        const importPatterns = {
            javascript: [
                /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
                /require\(['"]([^'"]+)['"]\)/g
            ],
            python: [
                /from\s+(\w+)\s+import/g,
                /import\s+(\w+)/g
            ]
        };
        
        const patterns = importPatterns[language] || [];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        });
        
        return imports;
    }

    extractComments(content, language) {
        const comments = [];
        
        const commentPatterns = {
            javascript: [/\/\/\s*(.+)/g, /\/\*\s*([\s\S]*?)\s*\*\//g],
            python: [/#\s*(.+)/g, /'''\s*([\s\S]*?)\s*'''/g],
            html: [/<!--\s*([\s\S]*?)\s*-->/g],
            css: [/\/\*\s*([\s\S]*?)\s*\*\//g]
        };
        
        const patterns = commentPatterns[language] || [];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                comments.push(match[1].trim());
            }
        });
        
        return comments;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        // Search suggestions
        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        // Enter key search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(e.target.value);
            }
        });
    }

    async performSearch(query) {
        if (!query.trim()) {
            this.clearResults();
            return;
        }

        console.log(`🔍 Searching for: "${query}"`);
        
        // Add to search history
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10); // Keep last 10
        }

        try {
            // Perform different types of searches
            const results = await Promise.all([
                this.exactSearch(query),
                this.fuzzySearch(query),
                this.semanticSearch(query),
                this.aiEnhancedSearch(query)
            ]);

            // Merge and rank results
            const mergedResults = this.mergeResults(results);
            this.currentResults = mergedResults;
            
            this.displayResults(mergedResults);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        }
    }

    exactSearch(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [filepath, data] of this.searchIndex.entries()) {
            const content = data.content.toLowerCase();
            const lines = data.content.split('\n');
            
            // Exact matches in content
            lines.forEach((line, index) => {
                if (line.toLowerCase().includes(queryLower)) {
                    results.push({
                        file: filepath,
                        line: index + 1,
                        content: line.trim(),
                        score: 1.0,
                        type: 'exact',
                        language: data.language
                    });
                }
            });
            
            // Exact matches in symbols
            data.symbols.forEach(symbol => {
                if (symbol.name.toLowerCase().includes(queryLower)) {
                    results.push({
                        file: filepath,
                        line: symbol.line,
                        content: `Symbol: ${symbol.name}`,
                        score: 0.9,
                        type: 'symbol',
                        language: data.language
                    });
                }
            });
        }
        
        return results;
    }

    fuzzySearch(query) {
        const results = [];
        const queryTerms = query.toLowerCase().split(/\s+/);
        
        for (const [filepath, data] of this.searchIndex.entries()) {
            let score = 0;
            
            // Check terms
            queryTerms.forEach(term => {
                if (data.terms.some(t => t.includes(term))) {
                    score += 0.7;
                }
                
                if (data.imports.some(imp => imp.toLowerCase().includes(term))) {
                    score += 0.6;
                }
                
                if (data.comments.some(comment => comment.toLowerCase().includes(term))) {
                    score += 0.5;
                }
            });
            
            if (score > 0) {
                results.push({
                    file: filepath,
                    line: 1,
                    content: `File: ${filepath}`,
                    score: Math.min(score / queryTerms.length, 1.0),
                    type: 'fuzzy',
                    language: data.language
                });
            }
        }
        
        return results;
    }

    async semanticSearch(query) {
        // Semantic search using AI if available
        if (!window.aiAgent) {
            return [];
        }

        try {
            const prompt = `Given the search query "${query}", suggest relevant programming concepts, functions, patterns, or file types that might be related. Return as comma-separated terms.`;
            
            const response = await window.aiAgent.processMessage(prompt);
            const semanticTerms = response.split(',').map(term => term.trim().toLowerCase());
            
            const results = [];
            
            for (const [filepath, data] of this.searchIndex.entries()) {
                let score = 0;
                
                semanticTerms.forEach(term => {
                    if (data.terms.some(t => t.includes(term))) {
                        score += 0.4;
                    }
                    
                    if (data.content.toLowerCase().includes(term)) {
                        score += 0.3;
                    }
                });
                
                if (score > 0) {
                    results.push({
                        file: filepath,
                        line: 1,
                        content: `Semantic match: ${filepath}`,
                        score: Math.min(score, 0.8),
                        type: 'semantic',
                        language: data.language
                    });
                }
            }
            
            return results;
        } catch (error) {
            console.warn('Semantic search failed:', error);
            return [];
        }
    }

    async aiEnhancedSearch(query) {
        // AI-enhanced search for complex queries
        if (!window.aiAgent) {
            return [];
        }

        try {
            const fileList = Array.from(this.searchIndex.keys()).join('\n');
            const prompt = `Based on the search query "${query}", which of these files are most likely to contain relevant code or information? 

Files:
${fileList}

Return the top 3 most relevant files with brief explanations.`;

            const response = await window.aiAgent.processMessage(prompt);
            
            // Parse AI response for file recommendations
            const results = [];
            const fileMatches = response.match(/[\w\/-]+\.\w+/g) || [];
            
            fileMatches.forEach((filename, index) => {
                if (this.searchIndex.has(filename)) {
                    results.push({
                        file: filename,
                        line: 1,
                        content: `AI recommended: ${filename}`,
                        score: 0.6 - (index * 0.1),
                        type: 'ai',
                        language: this.searchIndex.get(filename).language
                    });
                }
            });
            
            return results;
        } catch (error) {
            console.warn('AI-enhanced search failed:', error);
            return [];
        }
    }

    mergeResults(resultArrays) {
        const merged = [];
        const fileScores = new Map();
        
        // Flatten all results
        resultArrays.forEach(results => {
            results.forEach(result => {
                merged.push(result);
                
                // Track file scores for deduplication
                const key = `${result.file}:${result.line}`;
                const existing = fileScores.get(key) || 0;
                fileScores.set(key, Math.max(existing, result.score));
            });
        });
        
        // Remove duplicates and apply bonus scoring
        const unique = [];
        const seen = new Set();
        
        merged.forEach(result => {
            const key = `${result.file}:${result.line}`;
            if (!seen.has(key)) {
                seen.add(key);
                
                // Boost score for multiple search types
                const typeBonus = merged.filter(r => r.file === result.file).length * 0.1;
                result.score = Math.min(result.score + typeBonus, 1.0);
                
                unique.push(result);
            }
        });
        
        // Sort by score
        return unique.sort((a, b) => b.score - a.score).slice(0, 20);
    }

    displayResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-400 text-4xl mb-4">🔍</div>
                    <h3 class="text-lg font-semibold text-gray-300 mb-2">No results found</h3>
                    <p class="text-gray-500 text-sm">Try different keywords or check spelling</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="mb-4">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-400">Found ${results.length} results</span>
                    <div class="flex gap-2">
                        <button onclick="semanticSearch.sortResults('score')" 
                                class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded">
                            Sort by Relevance
                        </button>
                        <button onclick="semanticSearch.sortResults('file')" 
                                class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded">
                            Sort by File
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="space-y-2">
                ${results.map(result => this.renderResult(result)).join('')}
            </div>
        `;
    }

    renderResult(result) {
        const typeColors = {
            exact: 'bg-green-600',
            fuzzy: 'bg-blue-600',
            semantic: 'bg-purple-600',
            symbol: 'bg-yellow-600',
            ai: 'bg-pink-600'
        };

        const color = typeColors[result.type] || 'bg-gray-600';
        const percentage = Math.round(result.score * 100);

        return `
            <div class="border border-gray-600 rounded p-3 hover:bg-gray-800 cursor-pointer transition-colors" 
                 onclick="semanticSearch.openResult('${result.file}', ${result.line})">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-blue-400">${result.file}</span>
                        <span class="px-2 py-1 ${color} text-white text-xs rounded">${result.type}</span>
                        <span class="text-xs text-gray-400">${result.language}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400">${percentage}%</span>
                        <div class="w-12 h-2 bg-gray-700 rounded">
                            <div class="h-full bg-blue-500 rounded" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="text-sm text-gray-300 line-clamp-2">${result.content}</div>
                ${result.line > 1 ? `<div class="text-xs text-gray-500 mt-1">Line ${result.line}</div>` : ''}
            </div>
        `;
    }

    openResult(filepath, line = 1) {
        if (window.app) {
            window.app.openFile(filepath, line);
            window.app.closeModal('search-modal');
        }
    }

    sortResults(criteria) {
        if (criteria === 'score') {
            this.currentResults.sort((a, b) => b.score - a.score);
        } else if (criteria === 'file') {
            this.currentResults.sort((a, b) => a.file.localeCompare(b.file));
        }
        
        this.displayResults(this.currentResults);
    }

    showSearchSuggestions() {
        const container = document.getElementById('search-results');
        if (!container) return;

        const recentSearches = this.searchHistory.slice(0, 5);
        
        container.innerHTML = `
            <div class="space-y-4">
                ${recentSearches.length > 0 ? `
                    <div>
                        <h3 class="text-sm font-semibold text-gray-300 mb-2">Recent Searches</h3>
                        <div class="flex flex-wrap gap-2">
                            ${recentSearches.map(search => `
                                <button onclick="semanticSearch.fillSearch('${search}')" 
                                        class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors">
                                    ${search}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div>
                    <h3 class="text-sm font-semibold text-gray-300 mb-2">Suggested Searches</h3>
                    <div class="grid grid-cols-2 gap-2">
                        ${this.searchSuggestions.map(suggestion => `
                            <button onclick="semanticSearch.fillSearch('${suggestion}')" 
                                    class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-xs rounded text-left transition-colors">
                                ${suggestion}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    fillSearch(query) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = query;
            searchInput.focus();
            this.performSearch(query);
        }
    }

    clearResults() {
        const container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = '';
        }
    }

    showError(message) {
        const container = document.getElementById('search-results');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-400 text-4xl mb-4">⚠️</div>
                    <h3 class="text-lg font-semibold text-red-400 mb-2">Search Error</h3>
                    <p class="text-gray-400 text-sm">${message}</p>
                </div>
            `;
        }
    }

    // Re-index when files change
    updateIndex(filepath, file) {
        if (file) {
            this.indexFile(filepath, file);
        } else {
            this.searchIndex.delete(filepath);
        }
    }

    getStats() {
        return {
            indexedFiles: this.searchIndex.size,
            totalTerms: Array.from(this.searchIndex.values()).reduce((sum, data) => sum + data.terms.length, 0),
            searchHistory: this.searchHistory.length
        };
    }
}

// Initialize Semantic Search
window.semanticSearch = new SemanticSearch();

console.log('🔍 Semantic Search loaded');