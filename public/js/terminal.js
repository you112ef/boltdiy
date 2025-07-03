// Terminal Handler using xterm.js
class TerminalHandler {
    constructor() {
        this.terminal = null;
        this.fitAddon = null;
        this.isInitialized = false;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentLine = '';
        this.isExecuting = false;
        this.workingDirectory = '/workspace';
    }

    async init() {
        try {
            if (typeof Terminal === 'undefined' || typeof FitAddon === 'undefined') {
                console.warn('xterm.js not loaded, terminal functionality disabled');
                return;
            }

            this.setupTerminal();
            this.setupEventHandlers();
            this.loadHistory();
            this.isInitialized = true;
            
            console.log('Terminal initialized');
        } catch (error) {
            console.error('Terminal initialization failed:', error);
        }
    }

    setupTerminal() {
        const container = document.getElementById('terminal-container');
        if (!container) {
            console.warn('Terminal container not found');
            return;
        }

        // Detect mobile for terminal configuration
        const isMobile = window.innerWidth < 768;
        
        this.terminal = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: isMobile ? 12 : 14,
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selection: '#264f78',
                black: '#000000',
                red: '#f14c4c',
                green: '#23d18b',
                yellow: '#f5f543',
                blue: '#3b8eea',
                magenta: '#d670d6',
                cyan: '#29b8db',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#e5e5e5'
            },
            cols: isMobile ? 60 : 80,
            rows: isMobile ? 20 : 24,
            scrollback: 1000,
            convertEol: true,
            allowTransparency: true
        });

        this.fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(this.fitAddon);
        
        this.terminal.open(container);
        this.fitAddon.fit();

        // Welcome message
        this.terminal.writeln('Welcome to BoltDIY Terminal');
        this.terminal.writeln('Mobile-optimized command execution');
        this.terminal.writeln('Type "help" for available commands');
        this.terminal.writeln('');
        this.writePrompt();
    }

    setupEventHandlers() {
        if (!this.terminal) return;

        this.terminal.onKey(({ key, domEvent }) => {
            const ev = domEvent;
            const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

            if (ev.keyCode === 13) { // Enter
                this.handleEnter();
            } else if (ev.keyCode === 8) { // Backspace
                this.handleBackspace();
            } else if (ev.keyCode === 38) { // Up arrow
                this.handleUpArrow();
            } else if (ev.keyCode === 40) { // Down arrow
                this.handleDownArrow();
            } else if (ev.keyCode === 9) { // Tab
                ev.preventDefault();
                this.handleTab();
            } else if (ev.keyCode === 67 && ev.ctrlKey) { // Ctrl+C
                this.handleCtrlC();
            } else if (printable) {
                this.currentLine += key;
                this.terminal.write(key);
            }
        });

        // Resize handling
        window.addEventListener('resize', () => {
            this.resize();
        });

        // Mobile-specific handlers
        if (window.innerWidth < 768) {
            this.setupMobileHelpers();
        }
    }

    setupMobileHelpers() {
        // Add mobile-specific terminal helpers
        const container = document.getElementById('terminal-container');
        if (!container) return;

        // Create mobile toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'flex gap-1 p-2 bg-gray-700 border-b border-gray-600 text-xs';
        toolbar.innerHTML = `
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.insertText('cd ')">cd</button>
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.insertText('ls ')">ls</button>
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.insertText('cat ')">cat</button>
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.insertText('mkdir ')">mkdir</button>
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.handleCtrlC()">^C</button>
            <button class="px-2 py-1 bg-gray-600 rounded" onclick="terminalHandler.clear()">Clear</button>
        `;
        
        container.parentNode.insertBefore(toolbar, container);
    }

    writePrompt() {
        const prompt = `$ `;
        this.terminal.write(prompt);
    }

    handleEnter() {
        this.terminal.writeln('');
        
        if (this.currentLine.trim()) {
            this.addToHistory(this.currentLine);
            this.executeCommand(this.currentLine.trim());
        } else {
            this.writePrompt();
        }
        
        this.currentLine = '';
        this.historyIndex = -1;
    }

    handleBackspace() {
        if (this.currentLine.length > 0) {
            this.currentLine = this.currentLine.slice(0, -1);
            this.terminal.write('\b \b');
        }
    }

    handleUpArrow() {
        if (this.commandHistory.length === 0) return;
        
        if (this.historyIndex === -1) {
            this.historyIndex = this.commandHistory.length - 1;
        } else if (this.historyIndex > 0) {
            this.historyIndex--;
        }
        
        this.replaceCurrentLine(this.commandHistory[this.historyIndex]);
    }

    handleDownArrow() {
        if (this.historyIndex === -1) return;
        
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            this.replaceCurrentLine(this.commandHistory[this.historyIndex]);
        } else {
            this.historyIndex = -1;
            this.replaceCurrentLine('');
        }
    }

    handleTab() {
        // Simple tab completion for common commands
        const commands = ['help', 'clear', 'echo', 'pwd', 'ls', 'cd', 'cat', 'mkdir', 'touch', 'rm', 'cp', 'mv'];
        const matches = commands.filter(cmd => cmd.startsWith(this.currentLine));
        
        if (matches.length === 1) {
            const completion = matches[0].substring(this.currentLine.length);
            this.currentLine += completion;
            this.terminal.write(completion);
        } else if (matches.length > 1) {
            this.terminal.writeln('');
            this.terminal.writeln(matches.join('  '));
            this.writePrompt();
            this.terminal.write(this.currentLine);
        }
    }

    handleCtrlC() {
        this.terminal.writeln('^C');
        this.currentLine = '';
        this.writePrompt();
    }

    replaceCurrentLine(newLine) {
        // Clear current line
        for (let i = 0; i < this.currentLine.length; i++) {
            this.terminal.write('\b \b');
        }
        
        // Write new line
        this.currentLine = newLine;
        this.terminal.write(newLine);
    }

    async executeCommand(command) {
        this.isExecuting = true;
        
        try {
            const [cmd, ...args] = command.split(' ');
            const result = await this.processCommand(cmd.toLowerCase(), args);
            
            if (result) {
                this.terminal.writeln(result);
            }
        } catch (error) {
            this.terminal.writeln(`Error: ${error.message}`);
        } finally {
            this.isExecuting = false;
            this.writePrompt();
        }
    }

    async processCommand(cmd, args) {
        switch (cmd) {
            case 'help':
                return this.getHelpText();
            
            case 'clear':
                this.terminal.clear();
                return '';
            
            case 'echo':
                return args.join(' ');
            
            case 'pwd':
                return this.workingDirectory;
            
            case 'ls':
                return this.listFiles(args[0]);
            
            case 'cd':
                return this.changeDirectory(args[0]);
            
            case 'cat':
                return this.readFile(args[0]);
            
            case 'touch':
                return this.createFile(args[0]);
            
            case 'mkdir':
                return this.createDirectory(args[0]);
            
            case 'python':
            case 'python3':
                return this.executePython(args);
            
            case 'node':
                return this.executeNode(args);
            
            case 'npm':
                return this.executeNpm(args);
            
            case 'git':
                return this.executeGit(args);
            
            default:
                return `Command not found: ${cmd}. Type "help" for available commands.`;
        }
    }

    getHelpText() {
        return `Available commands:
  help       - Show this help message
  clear      - Clear the terminal
  echo       - Display text
  pwd        - Print working directory
  ls [dir]   - List files and directories
  cd [dir]   - Change directory
  cat [file] - Display file contents
  touch [f]  - Create empty file
  mkdir [d]  - Create directory
  python [f] - Execute Python file
  node [f]   - Execute Node.js file
  npm [cmd]  - Run npm commands
  git [cmd]  - Run git commands
  
Mobile tip: Use the toolbar buttons for quick commands`;
    }

    listFiles(directory) {
        const targetDir = directory || this.workingDirectory;
        
        if (window.app && window.app.fileSystem) {
            const files = Array.from(window.app.fileSystem.keys())
                .filter(path => path.startsWith(targetDir === '/workspace' ? '' : targetDir))
                .map(path => path.replace(targetDir === '/workspace' ? '' : targetDir + '/', ''))
                .filter(name => name && !name.includes('/'));
            
            return files.length > 0 ? files.join('\n') : 'No files found';
        }
        
        return 'src/\npackage.json\nREADME.md\nwrangler.jsonc';
    }

    changeDirectory(directory) {
        if (!directory) {
            this.workingDirectory = '/workspace';
            return '';
        }
        
        if (directory === '..') {
            const parts = this.workingDirectory.split('/');
            if (parts.length > 2) {
                this.workingDirectory = parts.slice(0, -1).join('/');
            }
            return '';
        }
        
        // Simulate directory existence
        if (directory === 'src' || directory.startsWith('/')) {
            this.workingDirectory = directory.startsWith('/') ? directory : `${this.workingDirectory}/${directory}`;
            return '';
        }
        
        return `Directory not found: ${directory}`;
    }

    readFile(filename) {
        if (!filename) {
            return 'Usage: cat <filename>';
        }
        
        if (window.app && window.app.fileSystem) {
            const file = window.app.fileSystem.get(filename);
            if (file) {
                return file.content;
            }
        }
        
        return `File not found: ${filename}`;
    }

    createFile(filename) {
        if (!filename) {
            return 'Usage: touch <filename>';
        }
        
        if (window.app && window.app.fileSystem) {
            window.app.fileSystem.set(filename, {
                content: '',
                language: 'text'
            });
            window.app.updateFileTree();
            return `Created: ${filename}`;
        }
        
        return `Created: ${filename}`;
    }

    createDirectory(dirname) {
        if (!dirname) {
            return 'Usage: mkdir <directory>';
        }
        
        return `Created directory: ${dirname}`;
    }

    async executePython(args) {
        if (args.length === 0) {
            return 'Python REPL not available. Usage: python <filename>';
        }
        
        const filename = args[0];
        const file = window.app?.fileSystem?.get(filename);
        
        if (!file) {
            return `File not found: ${filename}`;
        }
        
        // Simulate Python execution
        return `Executing Python file: ${filename}
[Simulated output - integrate with actual Python runtime]
Hello, World!`;
    }

    async executeNode(args) {
        if (args.length === 0) {
            return 'Node.js REPL not available. Usage: node <filename>';
        }
        
        const filename = args[0];
        const file = window.app?.fileSystem?.get(filename);
        
        if (!file) {
            return `File not found: ${filename}`;
        }
        
        // Simulate Node.js execution
        return `Executing Node.js file: ${filename}
[Simulated output - integrate with actual Node.js runtime]
Hello, World!`;
    }

    async executeNpm(args) {
        const command = args.join(' ');
        return `npm ${command}
[Simulated npm output - integrate with actual package manager]`;
    }

    async executeGit(args) {
        const command = args.join(' ');
        return `git ${command}
[Simulated git output - integrate with actual git commands]`;
    }

    // Utility methods
    insertText(text) {
        this.currentLine += text;
        this.terminal.write(text);
    }

    clear() {
        this.terminal.clear();
        this.writePrompt();
    }

    resize() {
        if (this.fitAddon && this.terminal) {
            setTimeout(() => {
                this.fitAddon.fit();
            }, 100);
        }
    }

    focus() {
        if (this.terminal) {
            this.terminal.focus();
        }
    }

    addToHistory(command) {
        if (command && command !== this.commandHistory[this.commandHistory.length - 1]) {
            this.commandHistory.push(command);
            
            // Keep only last 50 commands
            if (this.commandHistory.length > 50) {
                this.commandHistory = this.commandHistory.slice(-50);
            }
            
            this.saveHistory();
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('boltdiy_terminal_history', JSON.stringify(this.commandHistory));
        } catch (error) {
            console.warn('Failed to save terminal history:', error);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('boltdiy_terminal_history');
            if (saved) {
                this.commandHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load terminal history:', error);
            this.commandHistory = [];
        }
    }

    // Cleanup
    destroy() {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
        this.fitAddon = null;
    }
}

// Initialize terminal handler
const terminalHandler = new TerminalHandler();

// Auto-initialize when terminal becomes visible
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const terminalPanel = document.getElementById('terminal-panel');
            if (terminalPanel && !terminalPanel.classList.contains('hidden') && !terminalHandler.isInitialized) {
                terminalHandler.init();
            }
        }
    });
});

// Observe terminal panel for visibility changes
const terminalPanel = document.getElementById('terminal-panel');
if (terminalPanel) {
    observer.observe(terminalPanel, { attributes: true });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    terminalHandler.destroy();
});

// Export for global access
window.terminalHandler = terminalHandler;