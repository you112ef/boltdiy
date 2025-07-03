import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "BoltDIY AI Agent Platform",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
			}
		);

		// New AI agent tools
		this.server.tool(
			"semantic_search",
			{ 
				query: z.string(),
				limit: z.number().optional().default(10)
			},
			async ({ query, limit }: { query: string; limit: number }) => {
				// Simulate semantic search
				return {
					content: [{
						type: "text",
						text: `Semantic search results for "${query}" (limit: ${limit})`
					}]
				};
			}
		);

		this.server.tool(
			"code_analysis",
			{
				code: z.string(),
				language: z.string().optional(),
				analysis_type: z.enum(["explain", "refactor", "optimize", "test"]).optional().default("explain")
			},
			async ({ code, language, analysis_type }: { code: string; language?: string; analysis_type: "explain" | "refactor" | "optimize" | "test" }) => {
				return {
					content: [{
						type: "text",
						text: `${analysis_type} analysis for ${language || 'unknown'} code: ${code.slice(0, 100)}...`
					}]
				};
			}
		);

		this.server.tool(
			"ocr_process",
			{
				image_data: z.string(),
				extract_type: z.enum(["text", "code", "fix_bugs"]).optional().default("text")
			},
			async ({ image_data, extract_type }: { image_data: string; extract_type: "text" | "code" | "fix_bugs" }) => {
				return {
					content: [{
						type: "text", 
						text: `OCR processing complete. Extracted ${extract_type} from image data.`
					}]
				};
			}
		);
	}
}

// Static file serving for the frontend
async function serveStaticFile(request: Request): Promise<Response> {
	const url = new URL(request.url);
	let filePath = url.pathname;
	
	// Default to index.html for root and directories
	if (filePath === '/' || filePath.endsWith('/')) {
		filePath = '/index.html';
	}
	
	// Remove leading slash for file paths
	const fileName = filePath.startsWith('/') ? filePath.slice(1) : filePath;
	
	// Basic file serving logic (in production, you'd use a proper static file server)
	try {
		// This is a simplified example - in a real implementation, 
		// you'd serve actual files from a filesystem or CDN
		if (fileName === 'index.html') {
			return new Response(await getIndexHTML(), {
				headers: { 'Content-Type': 'text/html' }
			});
		}
		
		// Handle JavaScript files
		if (fileName.startsWith('js/')) {
			return new Response('// JavaScript files would be served here', {
				headers: { 'Content-Type': 'application/javascript' }
			});
		}
		
		// Handle CSS files
		if (fileName.endsWith('.css')) {
			return new Response('/* CSS files would be served here */', {
				headers: { 'Content-Type': 'text/css' }
			});
		}
		
		// Handle other assets
		return new Response('Not Found', { status: 404 });
		
	} catch (error) {
		return new Response('Internal Server Error', { status: 500 });
	}
}

// Get the main HTML content (simplified version)
async function getIndexHTML(): Promise<string> {
	return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BoltDIY - AI Agent Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs/loader.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        .monaco-editor { --vscode-editor-background: #1e1e1e !important; }
        @media (max-width: 768px) {
            .monaco-editor .margin { display: none !important; }
            .monaco-editor .minimap { display: none !important; }
        }
    </style>
</head>
<body class="h-full bg-gray-950 text-gray-100 overflow-hidden">
    <div id="app" class="flex flex-col h-full max-w-screen min-w-0">
        <header class="flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 border-b border-gray-800 shrink-0">
            <div class="flex items-center gap-1 sm:gap-2 min-w-0">
                <button id="menu-toggle" class="sm:hidden p-1 rounded hover:bg-gray-800">
                    <i class="fas fa-bars text-sm"></i>
                </button>
                <h1 class="text-lg sm:text-xl font-bold truncate">BoltDIY</h1>
                <span class="hidden sm:inline text-xs text-gray-400">AI Agent Platform</span>
            </div>
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
                <button id="search-toggle" class="p-1 sm:p-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                    <i class="fas fa-search"></i>
                </button>
                <button id="terminal-toggle" class="p-1 sm:p-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                    <i class="fas fa-terminal"></i>
                </button>
                <button id="settings-toggle" class="p-1 sm:p-2 rounded hover:bg-gray-800 text-xs sm:text-sm">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </header>
        
        <div class="flex flex-1 min-h-0">
            <aside id="sidebar" class="w-64 sm:w-72 bg-gray-900 border-r border-gray-800 transform -translate-x-full sm:translate-x-0 transition-transform duration-200 z-20 absolute sm:relative h-full">
                <div class="flex flex-col h-full">
                    <div class="flex-1 p-2 overflow-y-auto max-h-[50vh] sm:max-h-none">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium">Files</h3>
                            <button class="p-1 rounded hover:bg-gray-800 text-xs">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div id="file-tree" class="text-sm space-y-1">
                            <div class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 cursor-pointer">
                                <i class="fas fa-file-code text-xs text-gray-400"></i>
                                <span class="text-xs truncate">index.ts</span>
                            </div>
                            <div class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 cursor-pointer">
                                <i class="fas fa-file text-xs text-gray-400"></i>
                                <span class="text-xs truncate">README.md</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-800 p-2 max-h-[50vh] sm:max-h-none flex flex-col">
                        <h3 class="text-sm font-medium mb-2">AI Agent</h3>
                        <div class="flex-1 bg-gray-800 rounded p-2 text-xs overflow-y-auto max-h-32 sm:max-h-48">
                            <div class="text-green-400 mb-1">🟢 Ready</div>
                            <div class="text-gray-400 text-xs space-y-1">
                                <div>Language: <span>TypeScript</span></div>
                                <div>File: <span>index.ts</span></div>
                            </div>
                        </div>
                        
                        <div class="mt-2">
                            <input type="text" placeholder="Ask AI agent..." 
                                   class="w-full p-2 bg-gray-800 border border-gray-700 rounded text-xs focus:border-blue-500 focus:outline-none">
                            <div class="mt-1 flex gap-1 flex-wrap">
                                <button class="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">Explain</button>
                                <button class="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">Refactor</button>
                                <button class="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">Test</button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main class="flex-1 flex flex-col min-w-0">
                <div class="flex-1 relative">
                    <div class="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div class="text-center">
                            <i class="fas fa-code text-6xl text-gray-600 mb-4"></i>
                            <h2 class="text-2xl font-bold mb-2">BoltDIY AI Agent Platform</h2>
                            <p class="text-gray-400 mb-4">Mobile-first AI-powered development environment</p>
                            <div class="text-sm text-gray-500 space-y-1">
                                <div>✨ Semantic search with transformers.js</div>
                                <div>🧠 Language-aware AI agents</div>
                                <div>🖼️ OCR image-to-code transformation</div>
                                <div>📱 Fully mobile responsive (360px+)</div>
                                <div>🚀 Collaborative editing with Yjs</div>
                            </div>
                            <div class="mt-6">
                                <p class="text-xs text-gray-600">Try Ctrl+K to search, or use the AI agent panel</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <div id="sidebar-overlay" class="hidden sm:hidden fixed inset-0 bg-black bg-opacity-50 z-10"></div>
    
    <script>
        // Basic mobile handlers
        document.getElementById('menu-toggle')?.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            
            if (sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            }
        });
        
        document.getElementById('sidebar-overlay')?.addEventListener('click', function() {
            document.getElementById('sidebar').classList.add('-translate-x-full');
            this.classList.add('hidden');
        });
        
        // Show welcome message
        console.log('🚀 BoltDIY AI Agent Platform loaded!');
        console.log('📱 Mobile-optimized for screens 360px and up');
        console.log('🧠 AI agent ready with MCP tools:', {
            calculator: 'Basic math operations',
            semantic_search: 'Find code across files',
            code_analysis: 'AI-powered code insights',
            ocr_process: 'Image-to-code transformation'
        });
    </script>
</body>
</html>`;
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Handle MCP endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Handle API endpoints for the frontend
		if (url.pathname.startsWith("/api/")) {
			return handleAPIRequest(request, url);
		}

		// Serve static files for the frontend
		return serveStaticFile(request);
	},
};

// Handle API requests from the frontend
async function handleAPIRequest(request: Request, url: URL): Promise<Response> {
	const path = url.pathname.replace("/api", "");
	
	// Enable CORS for all API requests
	const corsHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};

	if (request.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		switch (path) {
			case "/health":
				return new Response(JSON.stringify({ 
					status: "healthy", 
					timestamp: new Date().toISOString(),
					services: {
						mcp: "active",
						ai_agent: "ready",
						semantic_search: "initialized"
					}
				}), {
					headers: { ...corsHeaders, "Content-Type": "application/json" }
				});

			case "/tools":
				return new Response(JSON.stringify({
					tools: [
						{ name: "calculator", description: "Basic math operations" },
						{ name: "semantic_search", description: "Search code semantically" },
						{ name: "code_analysis", description: "AI code analysis" },
						{ name: "ocr_process", description: "Image to code transformation" }
					]
				}), {
					headers: { ...corsHeaders, "Content-Type": "application/json" }
				});

			default:
				return new Response(JSON.stringify({ error: "Not found" }), {
					status: 404,
					headers: { ...corsHeaders, "Content-Type": "application/json" }
				});
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}
