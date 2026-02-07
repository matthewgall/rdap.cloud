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
        this.renderInitialState();
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
        const testButton = document.getElementById('testButton');
        
        if (!emailInput || !testButton) return;

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
        const apiParsed = document.getElementById('apiParsed');
        if (!apiParsed) return;

        try {
            apiParsed.innerHTML = this.buildParsedResults(data, isError);
        } catch (error) {
            console.error('Failed to render parsed response', error);
            apiParsed.innerHTML = this.renderEmptyState('We hit an error rendering this response.');
        }
    }

    renderInitialState() {
        const apiParsed = document.getElementById('apiParsed');
        if (!apiParsed) return;

        apiParsed.innerHTML = this.renderEmptyState(
            'Try a lookup like example.com, 8.8.8.8, or AS13335 to see a structured RDAP response.'
        );
    }

    buildParsedResults(data, isError) {
        if (!data || !data.results || typeof data.results !== 'object') {
            return this.renderEmptyState('Enter a target above to see the response.');
        }

        const entries = Object.entries(data.results);
        if (entries.length === 0) {
            return this.renderEmptyState('No results returned for that query.');
        }

        return entries.map(([target, result]) => {
            const success = result?.success === true;
            const message = result?.message || (success ? 'Lookup succeeded.' : 'Lookup failed.');
            const details = this.extractSummary(result?.data, result);
            const type = result?.type || details.objectClassName || 'unknown';
            const entities = this.extractEntities(result?.data);
            const nameservers = this.extractNameservers(result?.data);
            const events = this.extractEvents(result?.data);
            const notices = this.extractNotices(result?.data);
            const secureDns = this.extractSecureDns(result?.data);
            const remarks = this.extractRemarks(result?.data);
            const links = this.extractLinks(result?.data);
            const publicIds = this.extractPublicIds(result?.data);
            const conformance = this.extractConformance(result?.data);

            return `
                <article class="result-card">
                    <div class="result-header">
                        <div class="result-title">${this.escapeHtml(target)}</div>
                        <div class="result-meta">
                            <span class="result-pill ${success ? 'success' : 'error'}">${success ? 'success' : 'error'}</span>
                            ${type !== 'unknown' ? `<span class="result-pill">${this.escapeHtml(type)}</span>` : ''}
                        </div>
                    </div>
                    <div class="result-message">${this.escapeHtml(message)}</div>
                    ${this.renderSummary(details)}
                    ${this.renderEntities(entities)}
                    ${this.renderNameservers(nameservers)}
                    ${this.renderEvents(events)}
                    ${this.renderSecureDns(secureDns)}
                    ${this.renderNotices(notices)}
                    ${this.renderRemarks(remarks)}
                    ${this.renderLinks(links)}
                    ${this.renderPublicIds(publicIds)}
                    ${this.renderConformance(conformance)}
                    ${this.renderRawDetails(result?.data)}
                </article>
            `;
        }).join('');
    }

    renderEmptyState(message) {
        return `
            <div class="result-card empty-state">
                <div class="empty-state-icon">☁️</div>
                <div class="empty-state-text">${this.escapeHtml(message)}</div>
            </div>
        `;
    }

    extractSummary(data, fallback) {
        const source = data || {};
        return {
            objectClassName: source.objectClassName,
            handle: source.handle,
            name: source.name || source.ldhName || source.unicodeName,
            status: Array.isArray(source.status) ? source.status.join(', ') : source.status,
            country: source.country,
            startAddress: source.startAddress,
            endAddress: source.endAddress,
            ipVersion: source.ipVersion,
            asn: source.asn || source.autnum,
            port43: source.port43
        };
    }

    extractNameservers(data) {
        const nameservers = Array.isArray(data?.nameservers) ? data.nameservers : [];
        return nameservers
            .map((ns) => ns.ldhName || ns.unicodeName)
            .filter(Boolean);
    }

    extractEvents(data) {
        const events = Array.isArray(data?.events) ? data.events : [];
        return events.map((event) => ({
            action: event.eventAction,
            date: event.eventDate
        })).filter((event) => event.action || event.date);
    }

    extractNotices(data) {
        const notices = Array.isArray(data?.notices) ? data.notices : [];
        return notices.map((notice) => ({
            title: notice.title,
            description: Array.isArray(notice.description) ? notice.description.join(' ') : notice.description,
            link: notice.links?.[0]?.href
        })).filter((notice) => notice.title || notice.description);
    }

    extractRemarks(data) {
        const remarks = Array.isArray(data?.remarks) ? data.remarks : [];
        return remarks.map((remark) => ({
            title: remark.title,
            description: Array.isArray(remark.description) ? remark.description.join(' ') : remark.description
        })).filter((remark) => remark.title || remark.description);
    }

    extractLinks(data) {
        const links = Array.isArray(data?.links) ? data.links : [];
        return links.map((link) => ({
            href: link.href,
            rel: link.rel,
            type: link.type
        })).filter((link) => link.href);
    }

    extractPublicIds(data) {
        const publicIds = Array.isArray(data?.publicIds) ? data.publicIds : [];
        return publicIds.map((entry) => ({
            type: entry.type,
            identifier: entry.identifier
        })).filter((entry) => entry.identifier);
    }

    extractConformance(data) {
        const list = Array.isArray(data?.rdapConformance) ? data.rdapConformance : [];
        return list.filter(Boolean);
    }

    extractSecureDns(data) {
        if (!data?.secureDNS) return null;
        const dsData = Array.isArray(data.secureDNS.dsData) ? data.secureDNS.dsData : [];
        return {
            delegationSigned: data.secureDNS.delegationSigned,
            dsData: dsData.map((entry) => ({
                keyTag: entry.keyTag,
                algorithm: entry.algorithm,
                digestType: entry.digestType,
                digest: entry.digest
            }))
        };
    }

    extractEntities(data) {
        const entities = Array.isArray(data?.entities) ? data.entities : [];
        return entities.map((entity) => {
            if (!entity || typeof entity !== 'object') {
                return {
                    roles: 'Unknown',
                    handle: '',
                    details: {}
                };
            }
            const roles = Array.isArray(entity.roles) ? entity.roles.join(', ') : 'Unknown';
            const handle = entity.handle || '';
            const vcard = Array.isArray(entity.vcardArray) ? entity.vcardArray[1] : [];
            const details = this.extractVcard(vcard);
            return {
                roles,
                handle,
                details
            };
        });
    }

    extractVcard(vcardEntries) {
        const details = {};
        if (!Array.isArray(vcardEntries)) {
            return details;
        }
        vcardEntries.forEach((entry) => {
            if (!Array.isArray(entry)) return;
            const [name, , , value] = entry;
            if (!name) return;
            if (name === 'fn') details.name = value;
            if (name === 'org') details.org = Array.isArray(value) ? value.join(' ') : value;
            if (name === 'email') details.email = value;
            if (name === 'tel') details.phone = value;
            if (name === 'adr') details.address = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
        });
        return details;
    }

    renderSummary(details) {
        const fields = [
            ['Object', details.objectClassName],
            ['Name', details.name],
            ['Handle', details.handle],
            ['Status', details.status],
            ['Country', details.country],
            ['IP Version', details.ipVersion],
            ['Start', details.startAddress],
            ['End', details.endAddress],
            ['ASN', details.asn],
            ['WHOIS', details.port43]
        ].filter(([, value]) => value);

        if (fields.length === 0) return '';

        return `
            <div class="result-grid">
                ${fields.map(([label, value]) => `
                    <div class="result-field">
                        <span class="result-field-label">${this.escapeHtml(label)}</span>
                        <div class="result-field-value">${this.escapeHtml(value)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderEntities(entities) {
        if (!entities || entities.length === 0) return '';

        return `
            <details class="result-details">
                <summary>Entities (${entities.length})</summary>
                <div class="entity-list">
                    ${entities.map((entity) => `
                        <div class="entity-card">
                            <div class="entity-header">
                                <div class="entity-title">${this.escapeHtml(entity.handle || 'Entity')}</div>
                                <div class="entity-roles">${this.escapeHtml(entity.roles)}</div>
                            </div>
                            <div class="entity-details">
                                ${this.renderEntityDetail('Name', entity.details.name)}
                                ${this.renderEntityDetail('Org', entity.details.org)}
                                ${this.renderEntityDetail('Email', entity.details.email)}
                                ${this.renderEntityDetail('Phone', entity.details.phone)}
                                ${this.renderEntityDetail('Address', entity.details.address)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderNameservers(nameservers) {
        if (!nameservers || nameservers.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Nameservers (${nameservers.length})</summary>
                <div class="result-list">
                    ${nameservers.map((ns) => `<div><code>${this.escapeHtml(ns)}</code></div>`).join('')}
                </div>
            </details>
        `;
    }

    renderEvents(events) {
        if (!events || events.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Events (${events.length})</summary>
                <div class="result-list">
                    ${events.map((event) => `
                        <div>
                            <strong>${this.escapeHtml(event.action || 'event')}</strong>
                            ${event.date ? ` · ${this.escapeHtml(event.date)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderNotices(notices) {
        if (!notices || notices.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Notices (${notices.length})</summary>
                <div class="result-list">
                    ${notices.map((notice) => `
                        <div>
                            <strong>${this.escapeHtml(notice.title || 'Notice')}</strong>
                            ${notice.description ? ` · ${this.escapeHtml(notice.description)}` : ''}
                            ${notice.link ? ` · <a href="${this.escapeHtml(notice.link)}" target="_blank" rel="noopener">Link</a>` : ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderSecureDns(secureDns) {
        if (!secureDns) return '';
        const dsData = secureDns.dsData || [];

        return `
            <details class="result-section">
                <summary>DNSSEC</summary>
                <div class="result-list">
                    <div><strong>Delegation signed:</strong> ${secureDns.delegationSigned ? 'Yes' : 'No'}</div>
                    ${dsData.length > 0 ? dsData.map((entry) => `
                        <div>
                            <strong>DS</strong> · keyTag ${this.escapeHtml(entry.keyTag)} · alg ${this.escapeHtml(entry.algorithm)} · digest ${this.escapeHtml(entry.digestType)}
                            <div><code>${this.escapeHtml(entry.digest)}</code></div>
                        </div>
                    `).join('') : ''}
                </div>
            </details>
        `;
    }

    renderRemarks(remarks) {
        if (!remarks || remarks.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Remarks (${remarks.length})</summary>
                <div class="result-list">
                    ${remarks.map((remark) => `
                        <div>
                            <strong>${this.escapeHtml(remark.title || 'Remark')}</strong>
                            ${remark.description ? ` · ${this.escapeHtml(remark.description)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderLinks(links) {
        if (!links || links.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Links (${links.length})</summary>
                <div class="result-list">
                    ${links.map((link) => `
                        <div>
                            <a href="${this.escapeHtml(link.href)}" target="_blank" rel="noopener">${this.escapeHtml(link.rel || 'link')}</a>
                            ${link.type ? ` · ${this.escapeHtml(link.type)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderPublicIds(publicIds) {
        if (!publicIds || publicIds.length === 0) return '';

        return `
            <details class="result-section">
                <summary>Public IDs (${publicIds.length})</summary>
                <div class="result-list">
                    ${publicIds.map((entry) => `
                        <div>
                            <strong>${this.escapeHtml(entry.type || 'ID')}</strong>
                            ${entry.identifier ? ` · ${this.escapeHtml(entry.identifier)}` : ''}
                        </div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderConformance(conformance) {
        if (!conformance || conformance.length === 0) return '';

        return `
            <details class="result-section">
                <summary>RDAP Conformance (${conformance.length})</summary>
                <div class="result-list">
                    ${conformance.map((entry) => `
                        <div><code>${this.escapeHtml(entry)}</code></div>
                    `).join('')}
                </div>
            </details>
        `;
    }

    renderEntityDetail(label, value) {
        if (!value) return '';
        return `<div><strong>${this.escapeHtml(label)}:</strong> ${this.escapeHtml(value)}</div>`;
    }

    renderRawDetails(data) {
        if (!data || typeof data !== 'object') return '';
        const jsonPayload = JSON.stringify(data, null, 2);
        return `
            <details class="result-details">
                <summary>Raw response</summary>
                <div class="result-json">${this.escapeHtml(jsonPayload)}</div>
            </details>
        `;
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
