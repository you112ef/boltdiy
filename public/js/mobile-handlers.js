// Mobile-specific handlers and optimizations
class MobileHandlers {
    constructor() {
        this.isMobile = window.innerWidth < 768;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isScrolling = false;
        this.swipeThreshold = 50;
    }

    init() {
        if (!this.isMobile) return;
        
        this.setupTouchEvents();
        this.setupSwipeGestures();
        this.setupKeyboardHandling();
        this.setupViewportOptimizations();
        this.setupPullToRefresh();
        
        console.log('Mobile handlers initialized');
    }

    setupTouchEvents() {
        // Prevent zoom on double tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    setupSwipeGestures() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.touchStartY || !this.touchStartX) return;
            
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const diffY = this.touchStartY - touchY;
            const diffX = this.touchStartX - touchX;

            // Detect swipe direction
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                if (Math.abs(diffX) > this.swipeThreshold) {
                    if (diffX > 0) {
                        this.handleSwipeLeft();
                    } else {
                        this.handleSwipeRight();
                    }
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            this.touchStartY = 0;
            this.touchStartX = 0;
        }, { passive: true });
    }

    handleSwipeLeft() {
        // Close sidebar on swipe left
        if (window.app) {
            window.app.closeSidebar();
        }
    }

    handleSwipeRight() {
        // Open sidebar on swipe right from left edge
        if (this.touchStartX < 50 && window.app) {
            window.app.openSidebar();
        }
    }

    setupKeyboardHandling() {
        // Handle virtual keyboard
        const viewport = document.querySelector('meta[name=viewport]');
        
        window.addEventListener('resize', () => {
            // Detect virtual keyboard
            const heightDiff = window.innerHeight - document.documentElement.clientHeight;
            
            if (heightDiff > 150) {
                // Keyboard is likely open
                document.body.classList.add('keyboard-open');
                this.adjustForKeyboard(true);
            } else {
                // Keyboard is likely closed
                document.body.classList.remove('keyboard-open');
                this.adjustForKeyboard(false);
            }
        });
    }

    adjustForKeyboard(isOpen) {
        const modals = ['search-modal', 'settings-modal', 'ocr-modal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && !modal.classList.contains('hidden')) {
                if (isOpen) {
                    modal.style.height = '70vh';
                    modal.style.top = '5vh';
                } else {
                    modal.style.height = '';
                    modal.style.top = '';
                }
            }
        });

        // Adjust terminal height
        const terminal = document.getElementById('terminal-panel');
        if (terminal && !terminal.classList.contains('hidden')) {
            if (isOpen) {
                terminal.style.height = '30vh';
            } else {
                terminal.style.height = '';
            }
        }
    }

    setupViewportOptimizations() {
        // Optimize viewport for mobile
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.updateMobileLayout();
            }, 100);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateMobileLayout();
                if (window.monacoSetup?.editor) {
                    window.monacoSetup.editor.layout();
                }
            }, 500);
        });
    }

    updateMobileLayout() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile !== this.isMobile) {
            this.isMobile = isMobile;
            
            // Update Monaco editor mobile settings
            if (window.monacoSetup?.editor) {
                window.monacoSetup.handleResize();
            }
            
            // Update terminal settings
            if (window.terminalHandler?.terminal) {
                const cols = isMobile ? 60 : 80;
                const rows = isMobile ? 20 : 24;
                window.terminalHandler.terminal.resize(cols, rows);
            }
        }
    }

    setupPullToRefresh() {
        let startY = 0;
        let isPulling = false;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            const currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 100) {
                this.showPullToRefreshIndicator();
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (isPulling) {
                const currentY = e.changedTouches[0].pageY;
                const pullDistance = currentY - startY;
                
                if (pullDistance > 100) {
                    this.handlePullToRefresh();
                }
                
                this.hidePullToRefreshIndicator();
                isPulling = false;
            }
        }, { passive: true });
    }

    showPullToRefreshIndicator() {
        let indicator = document.getElementById('pull-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-refresh-indicator';
            indicator.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm z-50';
            indicator.innerHTML = '<i class="fas fa-arrow-down mr-2"></i>Release to refresh';
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pull-refresh-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    async handlePullToRefresh() {
        if (window.app) {
            window.app.showToast('Refreshing...', 'info');
            
            // Re-index files for search
            if (window.semanticSearch) {
                for (const [filepath, file] of window.app.fileSystem.entries()) {
                    await window.semanticSearch.updateFile(filepath, file.content);
                }
            }
            
            window.app.showToast('Refreshed!', 'success');
        }
    }

    // Utility methods for mobile optimization
    optimizeForMobile() {
        // Add mobile-specific CSS classes
        document.body.classList.add('mobile-optimized');
        
        // Optimize Monaco editor for mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .monaco-editor .margin { display: none !important; }
                .monaco-editor .minimap { display: none !important; }
                .monaco-editor .decorationsOverviewRuler { display: none !important; }
                .monaco-editor .scroll-decoration { display: none !important; }
                .monaco-editor .find-widget { transform: scale(0.9); }
                .monaco-scrollable-element > .scrollbar > .slider {
                    background: rgba(255, 255, 255, 0.3) !important;
                    width: 8px !important;
                }
                
                /* Mobile keyboard adjustments */
                .keyboard-open .monaco-editor {
                    height: calc(100vh - 300px) !important;
                }
                
                /* Touch-friendly scrollbars */
                ::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }
                
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                }
                
                /* Prevent text selection on UI elements */
                .mobile-optimized button,
                .mobile-optimized .header,
                .mobile-optimized .sidebar {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                
                /* Improve touch targets */
                .mobile-optimized button {
                    min-height: 44px;
                    min-width: 44px;
                }
                
                /* Optimize modal sizes */
                .mobile-optimized .modal {
                    max-height: 90vh;
                    margin: 5vh auto;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Haptic feedback (if supported)
    vibrate(pattern = [10]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Show mobile-specific help
    showMobileHelp() {
        const helpText = `
Mobile Gestures:
• Swipe right from edge - Open sidebar
• Swipe left - Close sidebar  
• Pull down - Refresh files
• Long press - Context menu
• Pinch - Zoom (disabled)

Keyboard Shortcuts:
• Ctrl+K - Search
• Ctrl+\` - Terminal
• Esc - Close modals

Mobile Tips:
• Use toolbar buttons for quick commands
• Swipe to navigate between files
• Long press for more options
        `;
        
        if (window.app) {
            window.app.showToast('Check console for mobile help', 'info');
            console.log(helpText);
        }
    }

    // Performance monitoring
    monitorPerformance() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn(`Low FPS detected: ${fps}`);
                    this.optimizePerformance();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFPS);
        };
        
        requestAnimationFrame(checkFPS);
    }

    optimizePerformance() {
        // Disable animations if performance is poor
        document.body.classList.add('reduced-motion');
        
        // Reduce Monaco editor features
        if (window.monacoSetup?.editor) {
            window.monacoSetup.editor.updateOptions({
                smoothScrolling: false,
                cursorBlinking: 'solid',
                renderWhitespace: 'none'
            });
        }
    }
}

// Initialize mobile handlers
const mobileHandlers = new MobileHandlers();

// Auto-initialize if mobile
if (window.innerWidth < 768) {
    mobileHandlers.optimizeForMobile();
    mobileHandlers.monitorPerformance();
}

// Export for global access
window.mobileHandlers = mobileHandlers;