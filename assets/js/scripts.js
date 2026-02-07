// Modern JavaScript for rdap.cloud

class RdapCloudApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupThemeToggle();
        this.setupMobileMenu();
        this.setupAPITesting();
        this.setupSmoothScrolling();
        this.setupCurrentYear();
        this.setupExampleButtons();
    }

    // Theme Management
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle?.querySelector('.theme-toggle-icon');
        
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('.theme-toggle-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    // Mobile Menu
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.querySelector('.nav-links');

        mobileMenuToggle?.addEventListener('click', () => {
            navLinks?.classList.toggle('show');
            mobileMenuToggle.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks?.classList.remove('show');
                mobileMenuToggle?.classList.remove('active');
            });
        });
    }

    // API Testing
    setupAPITesting() {
        const emailInput = document.getElementById('lookupInput');
        const testButton = document.getElementById('testButton');
        const apiResponse = document.getElementById('apiResponse');
        const currentEndpoint = document.getElementById('currentEndpoint');

        testButton?.addEventListener('click', () => {
            this.testAPI();
        });

        emailInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.testAPI();
            }
        });

        emailInput?.addEventListener('input', (e) => {
            this.updateEndpoint(e.target.value);
        });
    }

    updateEndpoint(input) {
        const currentEndpoint = document.getElementById('currentEndpoint');
        if (!currentEndpoint) return;

        if (input.trim()) {
            currentEndpoint.textContent = `GET /api/v1/${input}`;
        } else {
            currentEndpoint.textContent = 'GET /api/v1/[subject]';
        }
    }

    async testAPI() {
        const emailInput = document.getElementById('lookupInput');
        const apiResponse = document.getElementById('apiResponse');
        const testButton = document.getElementById('testButton');
        
        if (!emailInput || !apiResponse || !testButton) return;

        const input = emailInput.value.trim();
        if (!input) {
            this.showAPIResponse({ error: 'Please enter an email or domain' }, true);
            return;
        }

        // Show loading state with spinner
        testButton.innerHTML = '<span class="spinner"></span>Looking up...';
        testButton.disabled = true;

        try {
            const url = `/api/v1/${input}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.showAPIResponse(data, !response.ok);
        } catch (error) {
            this.showAPIResponse({ error: 'Network error occurred' }, true);
        } finally {
            testButton.innerHTML = 'Run Lookup';
            testButton.disabled = false;
        }
    }

    showAPIResponse(data, isError = false) {
        const apiResponse = document.getElementById('apiResponse');
        if (!apiResponse) return;

        const formattedData = JSON.stringify(data, null, 2);
        const statusClass = isError ? 'error' : 'success';
        
        apiResponse.innerHTML = `<pre><code class="${statusClass}">${formattedData}</code></pre>`;
    }

    // Example Buttons
    setupExampleButtons() {
        document.querySelectorAll('.example-btn').forEach(button => {
            button.addEventListener('click', () => {
                const query = button.getAttribute('data-query');
                const emailInput = document.getElementById('lookupInput');
                if (emailInput && query) {
                    emailInput.value = query;
                    this.updateEndpoint(query);
                    this.testAPI();
                }
            });
        });
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed nav
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Set Current Year
    setupCurrentYear() {
        const currentYearElement = document.getElementById('currentYear');
        if (currentYearElement) {
            currentYearElement.textContent = new Date().getFullYear();
        }
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Navigation Effects
function setupNavigationEffects() {
    const nav = document.querySelector('.nav-modern');
    let lastScrollY = window.scrollY;

    const handleScroll = debounce(() => {
        const currentScrollY = window.scrollY;
        
        // Add background when scrolled
        if (currentScrollY > 50) {
            nav?.classList.add('scrolled');
        } else {
            nav?.classList.remove('scrolled');
        }

        // Hide/show nav on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            nav?.style.setProperty('transform', 'translateY(-100%)');
        } else {
            nav?.style.setProperty('transform', 'translateY(0)');
        }

        lastScrollY = currentScrollY;
    }, 10);

    window.addEventListener('scroll', handleScroll);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RdapCloudApp();
    setupNavigationEffects();
});

// Add some fun Easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code: ↑↑↓↓←→←→BA
    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    
    if (!window.konamiProgress) window.konamiProgress = 0;
    
    if (e.code === konamiCode[window.konamiProgress]) {
        window.konamiProgress++;
        if (window.konamiProgress === konamiCode.length) {
            document.body.style.filter = 'hue-rotate(180deg)';
            setTimeout(() => {
                document.body.style.filter = '';
                window.konamiProgress = 0;
            }, 3000);
        }
    } else {
        window.konamiProgress = 0;
    }
});
