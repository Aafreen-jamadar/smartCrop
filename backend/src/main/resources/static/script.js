// Hosted (Render etc.) or opened via Spring Boot on :8080 -> same origin.
// Opened from VS Code Live Server / file:// -> talk to the local Spring Boot backend.
const API_BASE_URL = (location.protocol.startsWith('http') && (location.port === '8080' || location.port === '' || location.port === '80' || location.port === '443'))
    ? location.origin + '/'
    : 'http://localhost:8080/';
const API_PATHS = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    recommendation: '/api/crops/recommand'
};

document.addEventListener('DOMContentLoaded', () => {
    initAuthModal();
    initializeApp();
    setupEventListeners();
    showLoggedUser();
    startLoadingAnimation();
});

window.addEventListener('storage', handleStorageChange);

function initializeApp() {

    setTimeout(() => {
        hideLoadingScreen();
    }, 2000);


    initializeFormIndicators();


    setupIntersectionObserver();


    initializeSmoothScrolling();
}


function startLoadingAnimation() {
    const progressBar = document.querySelector('.loading-progress');
    if (progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = progress + '%';
        }, 100);
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function openNav() {
    const navOverlay = document.getElementById('navOverlay');
    if (navOverlay) {
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeNav() {
    const navOverlay = document.getElementById('navOverlay');
    if (navOverlay) {
        navOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}


function openLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLogin() {
    showLoginError('');
    if (authMode !== 'login') {
        setAuthMode('login');
    }
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}






// Small message that appears top-right and disappears by itself (replaces alert())
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Error line shown inside the login popup itself
function showLoginError(message) {
    const form = document.getElementById('loginForm');
    if (!form) {
        return;
    }
    let box = document.getElementById('loginError');
    if (!box) {
        box = document.createElement('div');
        box.id = 'loginError';
        box.className = 'login-error';
        form.insertBefore(box, form.firstChild);
    }
    box.textContent = message || '';
    box.style.display = message ? 'block' : 'none';
}

// ---------------------------------------------------------------------------
// Login / Sign up: one popup, two modes
// ---------------------------------------------------------------------------
let authMode = 'login';

function initAuthModal() {
    const form = document.getElementById('loginForm');
    const footer = document.querySelector('#loginModal .modal-footer');
    const passwordInput = document.getElementById('login-password');
    if (!form || !footer || !passwordInput) {
        return;
    }

    // "Confirm password" field - only shown while signing up
    const passwordGroup = passwordInput.closest('.form-group');
    if (passwordGroup && !document.getElementById('signup-confirm')) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.id = 'signupConfirmGroup';
        group.style.display = 'none';
        group.innerHTML = `
            <label for="signup-confirm">Confirm Password</label>
            <input type="password" id="signup-confirm" name="confirm" autocomplete="new-password" disabled>`;
        passwordGroup.insertAdjacentElement('afterend', group);
    }

    footer.innerHTML = '<p><span id="authSwitchText"></span> <a href="#" id="authSwitchLink"></a></p>' +
        '<p id="demoLoginRow">Just looking around? <a href="#" id="demoLoginLink">Use the demo account</a></p>';
    document.getElementById('demoLoginLink').addEventListener('click', (event) => {
        event.preventDefault();
        setAuthMode('login');
        document.getElementById('login-username').value = 'demo';
        passwordInput.value = 'demo123';
        form.requestSubmit();
    });
    document.getElementById('authSwitchLink').addEventListener('click', (event) => {
        event.preventDefault();
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
    });

    setAuthMode('login');
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === 'signup';

    const title = document.querySelector('#loginModal .modal-header h3');
    const submit = document.querySelector('#loginModal .login-btn');
    const confirmGroup = document.getElementById('signupConfirmGroup');
    const confirmInput = document.getElementById('signup-confirm');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');
    const password = document.getElementById('login-password');
    const demoRow = document.getElementById('demoLoginRow');

    if (demoRow) demoRow.style.display = signup ? 'none' : '';
    if (title) title.textContent = signup ? 'Create your SmartCrop account' : 'Login to SmartCrop';
    if (submit) submit.textContent = signup ? 'Sign up' : 'Login';
    if (switchText) switchText.textContent = signup ? 'Already have an account?' : "Don't have an account?";
    if (switchLink) switchLink.textContent = signup ? 'Login' : 'Sign up';
    if (confirmGroup) confirmGroup.style.display = signup ? '' : 'none';
    if (confirmInput) {
        confirmInput.disabled = !signup;     // a hidden required field would block the form
        confirmInput.required = signup;
        confirmInput.value = '';
    }
    if (password) {
        password.value = '';
        password.autocomplete = signup ? 'new-password' : 'current-password';
    }
    showLoginError('');
}

// POST /api/auth/register  -> account is created and you are logged in straight away
async function doRegister() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const submitBtn = document.querySelector('#loginModal .login-btn');

    if (username.length < 3) {
        showLoginError('Username must be at least 3 characters');
        return;
    }
    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters');
        return;
    }
    if (password !== confirm) {
        showLoginError('Passwords do not match');
        return;
    }
    showLoginError('');

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(new URL(API_PATHS.register, API_BASE_URL), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.status === 'error') {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        const name = result.username || username;
        localStorage.setItem('loggedUser', name);
        if (result.token) {
            localStorage.setItem('authToken', result.token);
        }
        document.getElementById('login-password').value = '';
        showLoggedUser();
        closeLogin();
        showToast(`Account created. Welcome, ${name}!`, 'success');
    } catch (error) {
        console.error('Error during sign up:', error);
        showLoginError(error instanceof TypeError
            ? 'Cannot reach the server. Start the Spring Boot backend (' + API_BASE_URL + ') and try again.'
            : error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Login function to send data to Spring Boot backend
async function doLogin() {
    if (authMode === 'signup') {
        return doRegister();
    }
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const loginBtn = document.querySelector('#loginModal .login-btn');

    if (!usernameInput || !passwordInput) {
        console.error('Login form inputs are missing from the DOM.');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Validation
    if (!username || !password) {
        showLoginError("Please enter both username and password");
        return;
    }
    showLoginError('');

    // Disable button and show loading state
    const originalBtnText = loginBtn ? loginBtn.innerHTML : '';
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
    }

    const loginUrl = new URL(API_PATHS.login, API_BASE_URL);

    try {
        // Prepare request body
        const requestData = {
            username: username,
            password: password
        };

        // Send POST request to Spring Boot backend
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        const status = typeof result.status === 'string' ? result.status.toLowerCase() : 'success';
        if (result.status && status !== 'success') {
            throw new Error(result.message || "Login failed");
        }

        const resolvedUsername = result.username || username;
        if (!resolvedUsername) {
            throw new Error("Login response did not include a username.");
        }

        // Save username in browser localStorage
        localStorage.setItem("loggedUser", resolvedUsername);
        if (result.token) {
            localStorage.setItem("authToken", result.token);
        }
        
        // Clear password field for security
        passwordInput.value = "";
        
        // Update UI to show logged-in user
        showLoggedUser();
        
        closeLogin();
        showToast(result.message || "Login Successful!", 'success');

    } catch (error) {
        console.error("Error during login:", error);
        showLoginError(error instanceof TypeError
            ? "Cannot reach the server. Start the Spring Boot backend (" + API_BASE_URL + ") and try again."
            : error.message);
    } finally {
        // Restore button state
        if (loginBtn) {
            loginBtn.innerHTML = originalBtnText;
            loginBtn.disabled = false;
        }
    }
}

// call this after successful login (doLogin)
function showLoggedUser() {
    const username = getLoggedInUser();
    const loginButtons = document.querySelectorAll('.btn-login');
    loginButtons.forEach(btn => {
        if (username) {
            btn.textContent = username;
            btn.classList.add('logged');
            // Change click to open profile or logout
            btn.onclick = () => { 
                if (confirm('Do you want to logout?')) {
                    localStorage.removeItem('loggedUser');
                    localStorage.removeItem('authToken');
                    showLoggedUser();
                }
            };
        } else {
            btn.textContent = 'Login';
            btn.classList.remove('logged');
            btn.onclick = openLogin;
        }
    });

    enforceFormAccess();
    updateCtaState();
}

function getLoggedInUser() {
    return localStorage.getItem('loggedUser');
}

function isUserLoggedIn() {
    return Boolean(getLoggedInUser());
}

function handleStorageChange(event) {
    if (event.key === 'loggedUser') {
        showLoggedUser();
    }
}


function openDemo() {
    const modal = document.getElementById('demoModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDemo() {
    const modal = document.getElementById('demoModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function showFertilizerDetails(nutrient) {
    const modal = document.getElementById('fertilizerModal');
    const title = document.getElementById('fertilizerModalTitle');
    const content = document.getElementById('fertilizerModalContent');

    if (modal && title && content) {
        const fertilizerData = getFertilizerData(nutrient);
        title.textContent = fertilizerData.title;
        content.innerHTML = fertilizerData.content;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeFertilizerModal() {
    const modal = document.getElementById('fertilizerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}


function getFertilizerData(nutrient) {
    const data = {
        nitrogen: {
            title: 'Nitrogen (N) Fertilizer Guide',
            content: `
                <div class="fertilizer-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-leaf"></i> Benefits</h4>
                        <ul>
                            <li>Promotes vigorous vegetative growth</li>
                            <li>Essential for chlorophyll production</li>
                            <li>Improves protein content in crops</li>
                            <li>Enhances overall plant health</li>
                        </ul>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-flask"></i> Recommended Sources</h4>
                        <div class="source-grid">
                            <div class="source-item">
                                <strong>Urea (46-0-0)</strong>
                                <p>Most common nitrogen fertilizer, cost-effective</p>
                            </div>
                            <div class="source-item">
                                <strong>Ammonium Nitrate (34-0-0)</strong>
                                <p>Quick-release, good for immediate needs</p>
                            </div>
                            <div class="source-item">
                                <strong>Organic Compost</strong>
                                <p>Slow-release, improves soil structure</p>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-calendar"></i> Application Timing</h4>
                        <p>Apply during active growth periods, typically in spring and early summer. Avoid application during drought or extreme heat.</p>
                    </div>
                </div>
            `
        },
        phosphorus: {
            title: 'Phosphorus (P) Fertilizer Guide',
            content: `
                <div class="fertilizer-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-seedling"></i> Benefits</h4>
                        <ul>
                            <li>Promotes root development</li>
                            <li>Essential for flowering and fruiting</li>
                            <li>Improves energy transfer in plants</li>
                            <li>Enhances seed formation</li>
                        </ul>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-flask"></i> Recommended Sources</h4>
                        <div class="source-grid">
                            <div class="source-item">
                                <strong>DAP (18-46-0)</strong>
                                <p>Diammonium phosphate, high phosphorus content</p>
                            </div>
                            <div class="source-item">
                                <strong>Superphosphate (0-20-0)</strong>
                                <p>Single superphosphate, good for most crops</p>
                            </div>
                            <div class="source-item">
                                <strong>Bone Meal</strong>
                                <p>Organic source, slow-release phosphorus</p>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-calendar"></i> Application Timing</h4>
                        <p>Best applied at planting time or early in the growing season. Phosphorus moves slowly in soil, so placement near roots is important.</p>
                    </div>
                </div>
            `
        },
        potassium: {
            title: 'Potassium (K) Fertilizer Guide',
            content: `
                <div class="fertilizer-details">
                    <div class="detail-section">
                        <h4><i class="fas fa-apple-alt"></i> Benefits</h4>
                        <ul>
                            <li>Improves fruit quality and size</li>
                            <li>Enhances disease resistance</li>
                            <li>Regulates water movement in plants</li>
                            <li>Improves drought tolerance</li>
                        </ul>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-flask"></i> Recommended Sources</h4>
                        <div class="source-grid">
                            <div class="source-item">
                                <strong>MOP (0-0-60)</strong>
                                <p>Muriate of potash, most common potassium source</p>
                            </div>
                            <div class="source-item">
                                <strong>SOP (0-0-50)</strong>
                                <p>Sulfate of potash, chloride-free option</p>
                            </div>
                            <div class="source-item">
                                <strong>Wood Ash</strong>
                                <p>Organic source, also provides other nutrients</p>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h4><i class="fas fa-calendar"></i> Application Timing</h4>
                        <p>Apply during the growing season, especially before flowering and fruiting. Can be applied in fall for next season's crops.</p>
                    </div>
                </div>
            `
        }
    };

    return data[nutrient] || { title: 'Fertilizer Guide', content: '<p>Information not available.</p>' };
}

// Form functionality
function initializeFormIndicators() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', updateIndicator);
        input.addEventListener('focus', highlightIndicator);
        input.addEventListener('blur', unhighlightIndicator);
    });
}

function updateIndicator(event) {
    const input = event.target;
    const value = parseFloat(input.value) || 0;
    const max = parseFloat(input.max) || 200;
    const percentage = Math.min((value / max) * 100, 100);

    const indicator = input.parentElement.querySelector('.indicator-fill, .ph-fill');
    if (indicator) {
        indicator.style.width = percentage + '%';
    }

    // Update pH indicator color
    if (input.id === 'ph') {
        updatePHIndicatorColor(value);
    }
}

function updatePHIndicatorColor(ph) {
    const phFill = document.querySelector('.ph-fill');
    if (phFill) {
        let color = '#ef4444';
        if (ph > 6 && ph < 8) color = '#10b981';
        else if (ph >= 8) color = '#06b6d4';

        phFill.style.background = color;
    }
}

function highlightIndicator(event) {
    const indicator = event.target.parentElement.querySelector('.indicator-bar, .ph-bar');
    if (indicator) {
        indicator.style.transform = 'scaleY(1.5)';
        indicator.style.transition = 'transform 0.2s ease';
    }
}

function unhighlightIndicator(event) {
    const indicator = event.target.parentElement.querySelector('.indicator-bar, .ph-bar');
    if (indicator) {
        indicator.style.transform = 'scaleY(1)';
    }
}


function setupEventListeners() {

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            doLogin();
        });
    }

    const cropForm = document.getElementById('cropForm');
    if (cropForm) {
        cropForm.addEventListener('submit', handleFormSubmission);
    }



    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });


    document.addEventListener('click', handleOutsideClick);


    document.addEventListener('keydown', handleEscapeKey);


    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', handleAnchorClick);
    });

    const getRecBtn = document.getElementById('getRecBtn');
    if (getRecBtn) {
        getRecBtn.addEventListener('click', requireLoginForNavigation);
    }
}
// //////////////////////////
// ---------------------------------------------------------------------------
// Talking to the Spring Boot backend
// ---------------------------------------------------------------------------
function parseFloatSafe(value, fieldName) {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || value === '' || value === null || value === undefined) {
        throw new Error(`${fieldName} is required and must be a valid number`);
    }
    return parsed;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

function toTitleCase(text) {
    const s = String(text || '');
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatPercent(probability) {
    return typeof probability === 'number' ? Math.round(probability * 100) + '%' : '-';
}

// Crop / fertilizer forms need a logged-in user (the backend checks the token as well)
function requireLogin() {
    if (isUserLoggedIn() && localStorage.getItem('authToken')) {
        return true;
    }
    showToast('Please login first to get recommendations', 'error');
    openLogin();
    return false;
}

// POST JSON to the backend with the saved JWT, return the parsed JSON or throw a readable Error
async function callBackend(path, payload) {
    const url = new URL(path, API_BASE_URL);
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    let response;
    try {
        response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    } catch (networkError) {
        const err = new Error('Cannot reach the Spring Boot backend at ' + API_BASE_URL +
            ' - start the Spring Boot app in STS first.');
        err.network = true;
        throw err;
    }

    const result = await response.json().catch(() => ({}));

    if (response.status === 401) {
        const err = new Error(result.message || 'Your session expired. Please login again.');
        err.unauthorized = true;
        throw err;
    }
    if (!response.ok || result.status === 'error') {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    return result;
}

function handleApiError(error) {
    console.error('Backend error:', error);
    if (error.unauthorized) {
        localStorage.removeItem('loggedUser');
        localStorage.removeItem('authToken');
        showLoggedUser();
        showToast('Your session expired. Please login again.', 'error');
        openLogin();
        return;
    }
    showToast(error.message, 'error');
}

// ---------------------------------------------------------------------------
// Crop recommendation
// ---------------------------------------------------------------------------
async function handleFormSubmission(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    if (!requireLogin()) {
        return;
    }

    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    submitBtn.disabled = true;

    try {
        // Same field names as CropRequest in the Spring Boot backend
        const requestData = {
            n: parseFloatSafe(data.nitrogen, 'Nitrogen'),
            p: parseFloatSafe(data.phosphorus, 'Phosphorus'),
            k: parseFloatSafe(data.potassium, 'Potassium'),
            temperature: parseFloatSafe(data.temperature, 'Temperature'),
            humidity: parseFloatSafe(data.humidity, 'Humidity'),
            ph: parseFloatSafe(data.ph, 'pH'),
            rainfall: parseFloatSafe(data.rainfall, 'Rainfall')
        };

        const result = await callBackend(API_PATHS.recommendation, requestData);

        displayAPIRecommendation(result, data);
    } catch (error) {
        handleApiError(error);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function buildAlternativesHtml(title, alternatives, titleCase = false) {
    if (!alternatives || !alternatives.length) {
        return '';
    }
    const items = alternatives.map(a => `
        <div class="alt-item">
            <span class="alt-name">${escapeHtml(titleCase ? toTitleCase(a.name) : a.name)}</span>
            <span class="alt-percent">${formatPercent(a.probability)}</span>
        </div>`).join('');
    return `<div class="alt-section"><h5><i class="fas fa-list-ol"></i> ${escapeHtml(title)}</h5>${items}</div>`;
}

function buildConfidenceHtml(confidence) {
    if (typeof confidence !== 'number') {
        return '';
    }
    const pct = Math.round(confidence * 100);
    return `
        <div class="confidence">
            <div class="confidence-label"><span>Model confidence</span><span>${pct}%</span></div>
            <div class="confidence-track"><div class="confidence-fill" style="width:${pct}%"></div></div>
        </div>`;
}

// Display the crop result sent by Spring Boot: { crop, season, confidence, alternatives, message }
function displayAPIRecommendation(result, data) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsContent = document.getElementById('resultsContent');

    if (!resultsContainer || !resultsContent) {
        console.error("Results container elements not found");
        return;
    }

    const cropDisplayName = escapeHtml(toTitleCase(result.crop || 'Unknown'));
    const seasonHtml = result.season
        ? `<div class="season-badge"><i class="fas fa-calendar-alt"></i> Best season: ${escapeHtml(result.season)}</div>`
        : '';

    resultsContent.innerHTML = `
        <div class="recommendation-result">
            <div class="result-header">
                <i class="fas fa-check-circle" style="color: var(--success); font-size: 48px; margin-bottom: 16px;"></i>
                <h3>Recommended Crop: <strong style="color: var(--accent);">${cropDisplayName}</strong></h3>
                <p class="result-subtitle">AI-based crop recommendation based on your farm parameters</p>
                ${seasonHtml}
                ${buildConfidenceHtml(result.confidence)}
            </div>

            ${buildAlternativesHtml('Other suitable crops', result.alternatives, true)}

            <div class="input-summary">
                <h5><i class="fas fa-chart-line"></i> Your Input Parameters</h5>
                <div class="parameters-grid">
                    <div class="parameter-item">
                        <span class="param-label">Nitrogen (N)</span>
                        <span class="param-value">${escapeHtml(data.nitrogen)} ppm</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Phosphorus (P)</span>
                        <span class="param-value">${escapeHtml(data.phosphorus)} ppm</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Potassium (K)</span>
                        <span class="param-value">${escapeHtml(data.potassium)} ppm</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Soil pH</span>
                        <span class="param-value">${escapeHtml(data.ph)}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Temperature</span>
                        <span class="param-value">${escapeHtml(data.temperature)} °C</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Humidity</span>
                        <span class="param-value">${escapeHtml(data.humidity)} %</span>
                    </div>
                    <div class="parameter-item">
                        <span class="param-label">Expected Rainfall</span>
                        <span class="param-value">${escapeHtml(data.rainfall)} mm</span>
                    </div>
                </div>
            </div>

            <div class="success-message">
                <p><i class="fas fa-check-circle"></i> Prediction completed successfully!</p>
            </div>
        </div>
    `;

    resultsContainer.style.display = "block";
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function enforceFormAccess() {
    const forms = document.querySelectorAll('[data-auth-guard="true"]');
    if (!forms.length) {
        return;
    }

    const loggedIn = isUserLoggedIn();
    forms.forEach(form => {
        const container = form.closest('.form-container') || form.parentElement;
        if (!container) {
            return;
        }

        const guardNotice = ensureAuthGuardOverlay(container);
        const interactiveElements = form.querySelectorAll('input, select, textarea, button');
        interactiveElements.forEach(element => {
            element.disabled = !loggedIn;
        });

        form.classList.toggle('locked', !loggedIn);
        if (guardNotice) {
            guardNotice.classList.toggle('visible', !loggedIn);
        }
    });
}

function ensureAuthGuardOverlay(container) {
    if (!container) {
        return null;
    }

    if (!container.classList.contains('guard-enabled')) {
        container.classList.add('guard-enabled');
    }

    let guardNotice = container.querySelector('.auth-guard-notice');
    if (!guardNotice) {
        guardNotice = document.createElement('div');
        guardNotice.className = 'auth-guard-notice';
        guardNotice.innerHTML = `
            <div class="auth-guard-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h4>Login required</h4>
            <p>Sign in to unlock personalized crop recommendations for your farm.</p>
            <button type="button" class="guard-action">
                <i class="fas fa-sign-in-alt"></i>
                Login to continue
            </button>
        `;
        container.appendChild(guardNotice);

        const guardButton = guardNotice.querySelector('.guard-action');
        if (guardButton) {
            guardButton.addEventListener('click', () => {
                closeNav();
                openLogin();
            });
        }
    }

    return guardNotice;
}

function updateCtaState() {
    const getRecBtn = document.getElementById('getRecBtn');
    if (getRecBtn) {
        const loggedIn = isUserLoggedIn();
        getRecBtn.classList.toggle('cta-locked', !loggedIn);
        getRecBtn.setAttribute('aria-disabled', (!loggedIn).toString());
    }
}

function requireLoginForNavigation(event) {
    if (isUserLoggedIn()) {
        return;
    }

    event.preventDefault();
    openLogin();
}










    // async function handleFormSubmission(event) {
    //     event.preventDefault();

    //     const formData = new FormData(event.target);
    //     const data = Object.fromEntries(formData.entries());

    //     const submitBtn = event.target.querySelector('.submit-btn');
    //     const originalText = submitBtn.innerHTML;
    //     submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    //     submitBtn.disabled = true;


    //     const apiUrl = "http://127.0.0.1:5001/predict";

    //     try {

    //         function parseFloatSafe(value, fieldName) {
    //             const parsed = parseFloat(value);
    //             if (isNaN(parsed) || value === '' || value === null || value === undefined) {
    //                 throw new Error(${fieldName} is required and must be a valid number);
    //             }
    //             return parsed;
    //         }


    //         const requestData = {
    //             N: parseFloatSafe(data.nitrogen, 'Nitrogen'),
    //             P: parseFloatSafe(data.phosphorus, 'Phosphorus'),
    //             K: parseFloatSafe(data.potassium, 'Potassium'),
    //             temperature: parseFloatSafe(data.temperature, 'Temperature'),
    //             humidity: parseFloatSafe(data.humidity, 'Humidity'),
    //             ph: parseFloatSafe(data.ph, 'pH'),
    //             rainfall: parseFloatSafe(data.rainfall, 'Rainfall')
    //         };

    //         const response = await fetch(apiUrl, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "Accept": "application/json"
    //             },
    //             body: JSON.stringify(requestData)
    //         });

    //         if (!response.ok) {
    //             throw new Error(HTTP error! status: ${response.status});
    //         }


    //         const result = await response.json();

    //         if (result.status === "error") {
    //             throw new Error(result.message || "Prediction error");
    //         }

    //         const cropName = result.crop || "Unknown";


    //         displayAPIRecommendation(cropName, data);

    //     } catch (error) {
    //         console.error("Error calling Flask API:", error);
    //         alert("❌ Server not reachable! Make sure Flask API is running on http://127.0.0.1:5001\n\nError: " + error.message);
    //     }

    //     submitBtn.innerHTML = originalText;
    //     submitBtn.disabled = false;
    // }





    function closeResults(containerId = 'resultsContainer') {
        const resultsContainer = document.getElementById(containerId);
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }


    function handleNavClick(event) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        event.target.classList.add('active');
    }

    function handleAnchorClick(event) {
        const href = event.target.getAttribute('href');
        if (href && href.startsWith('#')) {
            event.preventDefault();
            const target = href.length > 1 ? document.querySelector(href) : null;
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }

    function handleOutsideClick(event) {
        if (event.target.classList.contains('modal')) {
            const modal = event.target;
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        if (event.target.classList.contains('nav-overlay')) {
            closeNav();
        }
    }

    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
            closeNav();
        }
    }


    function initializeSmoothScrolling() {

        const style = document.createElement('style');
        style.textContent = `
        html {
            scroll-behavior: smooth;
        }
    `;
        document.head.appendChild(style);
    }


    function setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);


        const animateElements = document.querySelectorAll('.step, .feature, .fertilizer-card');
        animateElements.forEach(el => {
            observer.observe(el);
        });
    }


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

    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }


    const debouncedResize = debounce(() => {

        console.log('Window resized');
    }, 250);

    window.addEventListener('resize', debouncedResize);

    const dynamicStyles = `
    .confidence { margin: 16px auto 0; max-width: 320px; }
    .confidence-label { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); font-weight: 600; margin-bottom: 6px; }
    .confidence-track { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
    .confidence-fill { height: 100%; background: var(--gradient); border-radius: 4px; }
    .season-badge { display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 600; color: var(--accent); background: rgba(15, 118, 110, 0.1); padding: 4px 12px; border-radius: 999px; }
    .toast-container { position: fixed; top: 20px; right: 20px; z-index: 3000; display: flex; flex-direction: column; gap: 10px; }
    .toast { min-width: 240px; max-width: 360px; padding: 12px 16px; border-radius: 10px; color: #fff; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2); animation: slideInUp 0.3s ease-out; transition: opacity 0.3s ease; }
    .toast-success { background: var(--success); }
    .toast-error { background: var(--error); }
    .toast-info { background: var(--accent); }
    .toast.hide { opacity: 0; }
    .login-error { display: none; background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--error); color: #b91c1c; padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; }
    .alt-section { margin-top: 24px; }
    .alt-section h5 { display: flex; align-items: center; gap: 8px; color: var(--accent-dark); margin-bottom: 8px; font-size: 18px; }
    .alt-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .alt-name { font-weight: 600; color: var(--accent-dark); }
    .alt-percent { font-size: 13px; color: var(--muted); font-weight: 600; }
    .warning-box { margin-top: 16px; padding: 12px 16px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--warning); border-radius: 8px; font-size: 14px; color: #92400e; }
    .recommendation-result {
        padding: 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .result-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 2px solid #f3f4f6;
    }
    
    .result-header h3 {
        margin: 16px 0 8px 0;
        color: var(--accent-dark);
        font-size: 24px;
    }
    
    .result-subtitle {
        color: var(--muted);
        font-size: 14px;
        margin: 0;
    }
    
    .input-summary {
        margin-top: 24px;
    }
    
    .input-summary h5 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--accent-dark);
        margin-bottom: 16px;
        font-size: 18px;
    }
    
    .parameters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
    }
    
    .parameter-item {
        background: #f8fafb;
        padding: 12px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .param-label {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
    }
    
    .param-value {
        font-size: 16px;
        font-weight: 600;
        color: var(--accent-dark);
    }
    
    .success-message {
        margin-top: 24px;
        padding: 16px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
        border-left: 4px solid var(--success);
        text-align: center;
    }
    
    .success-message p {
        margin: 0;
        color: var(--success);
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    
    .fertilizer-details {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
    
    .detail-section h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--accent-dark);
        margin-bottom: 12px;
        font-size: 16px;
    }
    
    .detail-section ul {
        list-style: none;
        padding: 0;
    }
    
    .detail-section li {
        padding: 8px 0;
        border-bottom: 1px solid #f3f4f6;
        position: relative;
        padding-left: 20px;
    }
    
    .detail-section li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--success);
        font-weight: bold;
    }
    
    .source-grid {
        display: grid;
        gap: 16px;
    }
    
    .source-item {
        background: #f8fafb;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--accent);
    }
    
    .source-item strong {
        display: block;
        color: var(--accent-dark);
        margin-bottom: 4px;
    }
    
    .source-item p {
        color: var(--muted);
        font-size: 14px;
        margin: 0;
    }
    
    .recommendations-grid {
        display: grid;
        gap: 32px;
    }
    
    .crops-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 16px;
    }
    
    .crop-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
    }
    
    .crop-card:hover {
        transform: translateY(-4px);
    }
    
    .crop-image {
        position: relative;
        height: 120px;
        overflow: hidden;
    }
    
    .crop-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .suitability-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--success);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .crop-info {
        padding: 12px;
    }
    
    .crop-info h6 {
        margin: 0 0 8px 0;
        color: var(--accent-dark);
        font-size: 16px;
    }
    
    .crop-details {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    
    .yield, .season {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
    }
    
    .yield.high {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
    }
    
    .yield.medium {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
    }
    
    .season {
        background: rgba(15, 118, 110, 0.1);
        color: var(--accent);
    }
    
    .fertilizers-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
    }
    
    .fertilizer-item {
        background: white;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--accent);
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    
    .fertilizer-name {
        font-weight: 600;
        color: var(--accent-dark);
        margin-bottom: 4px;
    }
    
    .fertilizer-details {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: var(--muted);
    }
    
    .analysis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-top: 16px;
    }
    
    .analysis-item {
        background: white;
        padding: 12px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    
    .analysis-item .label {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
    }
    
    .analysis-item .value {
        font-size: 16px;
        font-weight: 600;
        color: var(--accent-dark);
    }
    
    .animate-in {
        animation: slideInUp 0.6s ease-out forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;


    const styleSheet = document.createElement('style');
    styleSheet.textContent = dynamicStyles;
    document.head.appendChild(styleSheet);


    window.openNav = openNav;
    window.closeNav = closeNav;
    window.openLogin = openLogin;
    window.closeLogin = closeLogin;
    window.doLogin = doLogin;
    window.openDemo = openDemo;
    window.closeDemo = closeDemo;
    window.showFertilizerDetails = showFertilizerDetails;
    window.closeFertilizerModal = closeFertilizerModal;
    window.closeResults = closeResults;