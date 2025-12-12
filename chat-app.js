// ========================================
// Firebase Configuration
// ========================================
// ⚠️ แทนที่ด้วย Firebase Config ของคุณ
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// ========================================
// Global Variables
// ========================================
let currentSessionId = null;
let messages = [];
let sessions = [];
let userSubscription = null;
let appConfig = null;
let isLoading = false;

// ========================================
// DOM Elements
// ========================================
const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    messagesContainer: document.getElementById('messagesContainer'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    menuBtn: document.getElementById('menuBtn'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    sessionsList: document.getElementById('sessionsList'),
    sessionTitle: document.getElementById('sessionTitle'),
    quotaBadge: document.getElementById('quotaBadge'),
    quotaBtn: document.getElementById('quotaBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    micBtn: document.getElementById('micBtn'),
    toastContainer: document.getElementById('toastContainer')
};

// ========================================
// Configuration
// ========================================
const CONFIG = {
    FREE_LIMIT: 10,
    MAX_MESSAGE_LENGTH: 2000,
    STORAGE_KEYS: {
        CURRENT_SESSION: 'current_session_id',
        SESSIONS: 'chat_sessions',
        MESSAGES_PREFIX: 'chat_messages_'
    }
};

// ========================================
// Initialization
// ========================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const user = await checkAuth();
        
        if (!user) {
            // Redirect to login page
            window.location.href = 'login.html';
            return;
        }

        // Load user data
        await loadUserData();
        await loadAppConfig();
        
        // Load sessions
        await loadSessions();
        
        // Load or create session
        const savedSessionId = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_SESSION);
        if (savedSessionId) {
            await loadSession(savedSessionId);
        } else {
            createNewSession();
        }

        // Hide loading screen
        elements.loadingScreen.style.display = 'none';

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('เกิดข้อผิดพลาดในการโหลด', 'error');
        elements.loadingScreen.style.display = 'none';
    }
});

// ========================================
// Authentication
// ========================================
function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            resolve(user);
        });
    });
}

async function loadUserData() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        
        if (doc.exists) {
            userSubscription = doc.data();
            updateQuotaDisplay();
        } else {
            // Create new user
            userSubscription = {
                userId: user.uid,
                email: user.email,
                subscriptionType: 'free',
                dailyQuestionCount: 0,
                lastQuestionDate: new Date().toISOString().split('T')[0],
                totalQuestionsAsked: 0
            };
            
            await db.collection('users').doc(user.uid).set(userSubscription);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadAppConfig() {
    try {
        const doc = await db.collection('config').doc('app_settings').get();
        appConfig = doc.exists ? doc.data() : { freeQuestionLimit: CONFIG.FREE_LIMIT };
    } catch (error) {
        console.error('Error loading app config:', error);
        appConfig = { freeQuestionLimit: CONFIG.FREE_LIMIT };
    }
}

// ========================================
// Session Management
// ========================================
function createNewSession() {
    const sessionId = Date.now().toString();
    const newSession = {
        id: sessionId,
        title: 'New Chat',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        messageCount: 0,
        preview: null
    };

    currentSessionId = sessionId;
    messages = [];
    sessions.unshift(newSession);

    saveSessionToStorage(newSession);
    saveSessions();
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_SESSION, sessionId);

    updateSessionTitle('New Chat');
    renderMessages();
    renderSessions();
}

async function loadSession(sessionId) {
    currentSessionId = sessionId;
    
    // Load messages from localStorage
    const savedMessages = localStorage.getItem(CONFIG.STORAGE_KEYS.MESSAGES_PREFIX + sessionId);
    messages = savedMessages ? JSON.parse(savedMessages) : [];

    // Update UI
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
        updateSessionTitle(session.title);
    }

    renderMessages();
}

function saveSessionToStorage(session) {
    const key = CONFIG.STORAGE_KEYS.MESSAGES_PREFIX + session.id;
    localStorage.setItem(key, JSON.stringify(messages));
}

function saveSessions() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

async function loadSessions() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSIONS);
    sessions = saved ? JSON.parse(saved) : [];
    renderSessions();
}

function deleteSession(sessionId) {
    // Remove from array
    sessions = sessions.filter(s => s.id !== sessionId);
    
    // Remove from storage
    localStorage.removeItem(CONFIG.STORAGE_KEYS.MESSAGES_PREFIX + sessionId);
    saveSessions();
    
    // If current session, create new one
    if (currentSessionId === sessionId) {
        createNewSession();
    }
    
    renderSessions();
}

// ========================================
// Message Handling
// ========================================
async function sendMessage() {
    const text = elements.messageInput.value.trim();
    
    if (!text || isLoading) return;
    
    // Check quota
    if (!canAskQuestion()) {
        showLimitDialog();
        return;
    }

    // Check length
    if (text.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showToast('ข้อความยาวเกินไป', 'error');
        return;
    }

    // Add user message
    const userMessage = {
        id: Date.now().toString(),
        text: text,
        isUser: true,
        timestamp: Date.now()
    };
    
    messages.push(userMessage);
    elements.messageInput.value = '';
    elements.sendBtn.disabled = true;
    
    renderMessages();
    scrollToBottom();

    // Show typing indicator
    showTypingIndicator();
    isLoading = true;

    try {
        // Call Cloud Function
        const response = await callGeminiAPI(text);
        
        // Remove typing indicator
        hideTypingIndicator();

        if (response) {
            // Add bot message
            const botMessage = {
                id: (Date.now() + 1).toString(),
                text: response,
                isUser: false,
                timestamp: Date.now()
            };
            
            messages.push(botMessage);
            
            // Update session
            await updateSession(text, response);
            
            // Increment question count
            await incrementQuestionCount();
            
            renderMessages();
            scrollToBottom();
            
            // Text to speech (optional)
            // speakText(response);
        }

    } catch (error) {
        hideTypingIndicator();
        console.error('Error sending message:', error);
        showToast('เกิดข้อผิดพลาดในการส่งข้อความ', 'error');
    } finally {
        isLoading = false;
    }
}

async function callGeminiAPI(text) {
    try {
        const result = await functions.httpsCallable('getGeminiResponse')({
            text: text
        });
        
        return result.data.text || 'ไม่สามารถรับคำตอบได้';
    } catch (error) {
        console.error('Gemini API Error:', error);
        
        if (error.code === 'unauthenticated') {
            showToast('กรุณาเข้าสู่ระบบใหม่', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            throw error;
        }
    }
}

async function updateSession(userText, botResponse) {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    // Generate title from first message
    if (session.messageCount === 0) {
        const title = userText.substring(0, 30) + (userText.length > 30 ? '...' : '');
        session.title = title;
        updateSessionTitle(title);
    }

    session.messageCount = messages.length;
    session.lastUpdated = Date.now();
    session.preview = botResponse.substring(0, 50) + '...';

    saveSessionToStorage(session);
    saveSessions();
    renderSessions();
}

async function incrementQuestionCount() {
    const user = auth.currentUser;
    if (!user || !userSubscription) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userSubscription.lastQuestionDate !== today;

    userSubscription.dailyQuestionCount = isNewDay ? 1 : userSubscription.dailyQuestionCount + 1;
    userSubscription.lastQuestionDate = today;
    userSubscription.totalQuestionsAsked = (userSubscription.totalQuestionsAsked || 0) + 1;

    await db.collection('users').doc(user.uid).update({
        dailyQuestionCount: userSubscription.dailyQuestionCount,
        lastQuestionDate: today,
        totalQuestionsAsked: userSubscription.totalQuestionsAsked
    });

    updateQuotaDisplay();
}

// ========================================
// UI Rendering
// ========================================
function renderMessages() {
    // Hide welcome screen if messages exist
    if (messages.length > 0) {
        elements.welcomeScreen.style.display = 'none';
    } else {
        elements.welcomeScreen.style.display = 'flex';
        return;
    }

    // Clear container (except welcome screen)
    const messagesOnly = elements.messagesContainer.querySelectorAll('.message, .typing-indicator');
    messagesOnly.forEach(el => el.remove());

    // Render messages
    messages.forEach(msg => {
        const messageEl = createMessageElement(msg);
        elements.messagesContainer.appendChild(messageEl);
    });
}

function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.isUser ? 'user' : 'bot'}`;
    div.dataset.id = message.id;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (message.isUser) {
        content.textContent = message.text;
    } else {
        // Render markdown for bot messages
        content.innerHTML = marked.parse(message.text);
        content.classList.add('markdown-body');
    }

    bubble.appendChild(content);

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = formatTime(message.timestamp);
    bubble.appendChild(timestamp);

    // Add actions for bot messages
    if (!message.isUser) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        actions.innerHTML = `
            <button class="message-action-btn" onclick="copyMessage('${message.id}')">
                <i class="fas fa-copy"></i>
            </button>
            <button class="message-action-btn" onclick="speakMessage('${message.id}')">
                <i class="fas fa-volume-up"></i>
            </button>
        `;
        
        bubble.appendChild(actions);
    }

    div.appendChild(bubble);
    return div;
}

function renderSessions() {
    elements.sessionsList.innerHTML = '';

    if (sessions.length === 0) {
        elements.sessionsList.innerHTML = '<p style="text-align: center; color: #999;">ยังไม่มีแชท</p>';
        return;
    }

    sessions.forEach(session => {
        const div = document.createElement('div');
        div.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <strong>${session.title}</strong>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">
                        ${session.preview || 'ยังไม่มีข้อความ'}
                    </div>
                    <div style="font-size: 0.75rem; color: #999; margin-top: 5px;">
                        ${formatDate(session.lastUpdated)}
                    </div>
                </div>
                <button onclick="deleteSession('${session.id}')" style="background: none; border: none; color: #999; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        div.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                loadSession(session.id);
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_SESSION, session.id);
                closeSidebar();
            }
        });

        elements.sessionsList.appendChild(div);
    });
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typingIndicator';
    
    indicator.innerHTML = `
        <div class="message-bubble">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    elements.messagesContainer.appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// ========================================
// Quota & Subscription
// ========================================
function canAskQuestion() {
    if (!userSubscription || !appConfig) return false;

    // Premium users can ask unlimited
    if (userSubscription.subscriptionType === 'premium') {
        return true;
    }

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userSubscription.lastQuestionDate !== today;

    // Reset on new day
    if (isNewDay) return true;

    // Check limit
    return userSubscription.dailyQuestionCount < appConfig.freeQuestionLimit;
}

function getRemainingQuestions() {
    if (!userSubscription || !appConfig) return 0;

    if (userSubscription.subscriptionType === 'premium') {
        return -1; // Unlimited
    }

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userSubscription.lastQuestionDate !== today;

    if (isNewDay) return appConfig.freeQuestionLimit;

    const remaining = appConfig.freeQuestionLimit - userSubscription.dailyQuestionCount;
    return Math.max(0, remaining);
}

function updateQuotaDisplay() {
    const remaining = getRemainingQuestions();
    
    if (remaining === -1) {
        elements.quotaBadge.textContent = '∞';
        elements.quotaBadge.style.background = '#4CAF50';
    } else {
        elements.quotaBadge.textContent = remaining;
        elements.quotaBadge.style.background = remaining > 0 ? '#4CAF50' : '#f5576c';
    }
}

function showLimitDialog() {
    const message = `คุณถามครบ ${appConfig.freeQuestionLimit} คำถามต่อวันแล้ว\n\nอัพเกรดเป็น Premium เพื่อถามได้ไม่จำกัด!`;
    
    if (confirm(message)) {
        window.location.href = 'subscription.html';
    }
}

// ========================================
// Helper Functions
// ========================================
function updateSessionTitle(title) {
    elements.sessionTitle.textContent = title;
}

function scrollToBottom() {
    setTimeout(() => {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }, 100);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
    
    const color = type === 'error' ? '#f5576c' : 
                  type === 'success' ? '#4CAF50' : '#40C4FF';
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="color: ${color}; margin-right: 10px;"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openSidebar() {
    elements.sidebar.classList.add('active');
    elements.overlay.classList.add('active');
}

function closeSidebar() {
    elements.sidebar.classList.remove('active');
    elements.overlay.classList.remove('active');
}

// ========================================
// Message Actions
// ========================================
window.copyMessage = function(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (message) {
        navigator.clipboard.writeText(message.text);
        showToast('คัดลอกแล้ว', 'success');
    }
};

window.speakMessage = function(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (message && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = 'th-TH';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
};

window.deleteSession = function(sessionId) {
    if (confirm('ต้องการลบแชทนี้?')) {
        deleteSession(sessionId);
    }
};

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
    // Input
    elements.messageInput.addEventListener('input', () => {
        const text = elements.messageInput.value.trim();
        elements.sendBtn.disabled = !text || isLoading;
        
        // Auto resize textarea
        elements.messageInput.style.height = 'auto';
        elements.messageInput.style.height = elements.messageInput.scrollHeight + 'px';
    });

    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Buttons
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.menuBtn.addEventListener('click', openSidebar);
    elements.closeSidebarBtn.addEventListener('click', closeSidebar);
    elements.overlay.addEventListener('click', closeSidebar);
    elements.newChatBtn.addEventListener('click', () => {
        createNewSession();
        closeSidebar();
    });

    elements.quotaBtn.addEventListener('click', () => {
        const remaining = getRemainingQuestions();
        const message = remaining === -1 ? 
            'คุณเป็นสมาชิก Premium สามารถถามได้ไม่จำกัด! 🌟' :
            `คุณสามารถถามได้อีก ${remaining} คำถามวันนี้\n\nรีเซ็ตทุกวันเวลา 00:00 น.`;
        
        alert(message);
    });

    elements.settingsBtn.addEventListener('click', () => {
        window.location.href = 'settings.html';
    });

    // Suggested questions
    document.querySelectorAll('.suggested-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
            elements.messageInput.value = question;
            elements.sendBtn.disabled = false;
            sendMessage();
        });
    });
}

// ========================================
// PWA Install Prompt
// ========================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button/banner if needed
    console.log('PWA can be installed');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    showToast('ติดตั้งแอปสำเร็จ!', 'success');
});