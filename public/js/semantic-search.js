// Semantic Search Engine using Transformers.js
class SemanticSearch {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.isInitialized = false;
        this.embeddings = new Map();
        this.fileChunks = new Map();
        this.indexedFiles = new Set();
    }

    async init() {
        try {
            // Lazy load transformers
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
            
            // Initialize the embedding pipeline with mobile-optimized model
            this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true, // Use quantized model for mobile performance
                progress_callback: (data) => {
                    if (data.status === 'downloading') {
                        console.log(`Downloading model: ${(data.progress || 0).toFixed(1)}%`);
                    }
                }
            });
            
            this.isInitialized = true;
            console.log('Semantic search initialized');
            
            // Index sample files
            await this.indexSampleFiles();
            
        } catch (error) {
            console.error('Failed to initialize semantic search:', error);
            // Fallback to simple text search
            this.isInitialized = false;
        }
    }

    async indexSampleFiles() {
        const sampleFiles = {
            'src/index.ts': `import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
    server = new McpServer({
        name: "Authless Calculator",
        version: "1.0.0",
    });

    async init() {
        // Simple addition tool
        this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
            content: [{ type: "text", text: String(a + b) }],
        }));
    }
}`,
            'README.md': `# BoltDIY AI Agent Platform
## Features
- AI-powered code assistance
- Semantic search across files
- OCR for image-to-code
- Mobile-responsive design
- Collaborative editing

## Getting Started
1. Open a file from the sidebar
2. Use Ctrl+K for semantic search
3. Ask the AI agent for help`,
            'package.json': `{
    "name": "boltdiy",
    "version": "0.0.0",
    "dependencies": {
        "@modelcontextprotocol/sdk": "^1.12.1",
        "agents": "^0.0.94",
        "zod": "^3.25.51"
    }
}`
        };

        for (const [file, content] of Object.entries(sampleFiles)) {
            await this.indexFile(file, content);
        }
    }

    async indexFile(filepath, content) {
        if (this.indexedFiles.has(filepath)) {
            return; // Already indexed
        }

        try {
            // Chunk the file content for better search
            const chunks = this.chunkContent(content, 200); // 200 chars per chunk
            const fileChunks = [];

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const chunkId = `${filepath}:${i}`;
                
                if (this.isInitialized && this.embedder) {
                    // Generate embeddings
                    const embedding = await this.generateEmbedding(chunk.text);
                    this.embeddings.set(chunkId, {
                        embedding: embedding,
                        file: filepath,
                        content: chunk.text,
                        line: chunk.line,
                        score: 0
                    });
                }

                fileChunks.push({
                    id: chunkId,
                    text: chunk.text,
                    line: chunk.line
                });
            }

            this.fileChunks.set(filepath, fileChunks);
            this.indexedFiles.add(filepath);
            
        } catch (error) {
            console.warn(`Failed to index file ${filepath}:`, error);
        }
    }

    chunkContent(content, maxLength = 200) {
        const lines = content.split('\n');
        const chunks = [];
        let currentChunk = '';
        let currentLine = 1;
        let chunkStartLine = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (currentChunk.length + line.length > maxLength && currentChunk) {
                chunks.push({
                    text: currentChunk.trim(),
                    line: chunkStartLine
                });
                currentChunk = line;
                chunkStartLine = i + 1;
            } else {
                currentChunk += line + '\n';
            }
            
            currentLine = i + 1;
        }

        if (currentChunk.trim()) {
            chunks.push({
                text: currentChunk.trim(),
                line: chunkStartLine
            });
        }

        return chunks;
    }

    async generateEmbedding(text) {
        if (!this.embedder) {
            return null;
        }

        try {
            const result = await this.embedder(text, { pooling: 'mean', normalize: true });
            return Array.from(result.data);
        } catch (error) {
            console.warn('Embedding generation failed:', error);
            return null;
        }
    }

    async search(query, limit = 10) {
        if (!query || query.length < 2) {
            return [];
        }

        if (this.isInitialized && this.embedder) {
            return await this.semanticSearch(query, limit);
        } else {
            return this.fuzzySearch(query, limit);
        }
    }

    async semanticSearch(query, limit = 10) {
        try {
            // Generate query embedding
            const queryEmbedding = await this.generateEmbedding(query);
            if (!queryEmbedding) {
                return this.fuzzySearch(query, limit);
            }

            const results = [];

            // Calculate cosine similarity with all chunks
            for (const [chunkId, chunk] of this.embeddings.entries()) {
                if (chunk.embedding) {
                    const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
                    results.push({
                        ...chunk,
                        score: similarity,
                        chunkId: chunkId
                    });
                }
            }

            // Sort by similarity and take top results
            return results
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .filter(r => r.score > 0.3) // Threshold for relevance
                .map(r => ({
                    file: r.file,
                    content: r.content,
                    line: r.line,
                    score: r.score
                }));

        } catch (error) {
            console.warn('Semantic search failed:', error);
            return this.fuzzySearch(query, limit);
        }
    }

    fuzzySearch(query, limit = 10) {
        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);

        for (const [filepath, chunks] of this.fileChunks.entries()) {
            for (const chunk of chunks) {
                const contentLower = chunk.text.toLowerCase();
                let score = 0;

                // Exact phrase match
                if (contentLower.includes(queryLower)) {
                    score += 1.0;
                }

                // Word matches
                for (const word of queryWords) {
                    if (contentLower.includes(word)) {
                        score += 0.3;
                    }
                }

                // Fuzzy matching for typos
                score += this.fuzzyMatch(queryLower, contentLower) * 0.2;

                if (score > 0) {
                    results.push({
                        file: filepath,
                        content: chunk.text,
                        line: chunk.line,
                        score: Math.min(score, 1.0)
                    });
                }
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    fuzzyMatch(pattern, text) {
        const patternLength = pattern.length;
        const textLength = text.length;
        
        if (patternLength === 0) return 1.0;
        if (textLength === 0) return 0.0;
        
        let matches = 0;
        let patternIndex = 0;
        
        for (let i = 0; i < textLength && patternIndex < patternLength; i++) {
            if (text[i] === pattern[patternIndex]) {
                matches++;
                patternIndex++;
            }
        }
        
        return matches / patternLength;
    }

    cosineSimilarity(a, b) {
        if (a.length !== b.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async findSymbol(symbol) {
        // Find function/class/variable definitions
        const queries = [
            `function ${symbol}`,
            `class ${symbol}`,
            `const ${symbol}`,
            `let ${symbol}`,
            `var ${symbol}`,
            `def ${symbol}`,
            `${symbol} =`
        ];

        const results = [];
        for (const query of queries) {
            const searchResults = await this.search(query, 5);
            results.push(...searchResults);
        }

        // Deduplicate and sort
        const uniqueResults = results.reduce((acc, current) => {
            const key = `${current.file}:${current.line}`;
            if (!acc.find(r => `${r.file}:${r.line}` === key)) {
                acc.push(current);
            }
            return acc;
        }, []);

        return uniqueResults.sort((a, b) => b.score - a.score);
    }

    async findUsages(symbol) {
        // Find where symbol is used
        const results = await this.search(symbol, 20);
        return results.filter(r => 
            r.content.includes(symbol) && 
            !r.content.includes(`function ${symbol}`) &&
            !r.content.includes(`class ${symbol}`)
        );
    }

    // Update file in search index
    async updateFile(filepath, content) {
        // Remove old entries
        if (this.indexedFiles.has(filepath)) {
            const oldChunks = this.fileChunks.get(filepath) || [];
            for (const chunk of oldChunks) {
                this.embeddings.delete(chunk.id);
            }
        }

        // Re-index with new content
        this.indexedFiles.delete(filepath);
        await this.indexFile(filepath, content);
    }

    // Remove file from search index
    removeFile(filepath) {
        if (this.indexedFiles.has(filepath)) {
            const chunks = this.fileChunks.get(filepath) || [];
            for (const chunk of chunks) {
                this.embeddings.delete(chunk.id);
            }
            this.fileChunks.delete(filepath);
            this.indexedFiles.delete(filepath);
        }
    }

    // Get search suggestions
    getSuggestions(query) {
        if (query.length < 2) return [];
        
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        for (const [filepath, chunks] of this.fileChunks.entries()) {
            for (const chunk of chunks) {
                const words = chunk.text.match(/\b\w+\b/g) || [];
                for (const word of words) {
                    if (word.toLowerCase().startsWith(queryLower) && word.length > 2) {
                        suggestions.add(word);
                    }
                }
            }
        }
        
        return Array.from(suggestions).slice(0, 10);
    }

    // Statistics
    getStats() {
        return {
            totalFiles: this.indexedFiles.size,
            totalChunks: this.embeddings.size,
            isSemanticEnabled: this.isInitialized,
            modelLoaded: !!this.embedder
        };
    }
}

// Initialize semantic search
const semanticSearch = new SemanticSearch();

// Auto-initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        semanticSearch.init();
    });
} else {
    semanticSearch.init();
}

// Export for global access
window.semanticSearch = semanticSearch;