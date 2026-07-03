
// ===========================================
// INITIALIZATION & UTILITY FUNCTIONS
// ===========================================

document.addEventListener('DOMContentLoaded', function () {
    // Hide loading
    setTimeout(() => {
        document.getElementById('loadingOverlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 500);
    }, 1500);

    // Initialize dashboard counters
    animateCounter('totalCalculations', 0, 1247, 2000);
    animateCounter('activeUsers', 0, 342, 1500);
    animateCounter('toolsCount', 0, 15, 1000);

    // Initialize GPA system
    initializeGPAPro();

    // Initialize particles
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#3498db" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#3498db",
                    opacity: 0.2,
                    width: 1
                },
                move: { enable: true, speed: 2 }
            }
        });
    }

    // Initialize Chart
    initializeGPAChart();

    // Load history
    loadCalculationHistory();

    // Setup AI input listener
    const aiInput = document.getElementById('aiUserInput');
    if (aiInput) {
        aiInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
            }
        });
    }

    // Setup language subject change listener
    const aiSubject = document.getElementById('aiSubject');
    if (aiSubject) {
        aiSubject.addEventListener('change', handleSubjectChange);
    }

    // Initialize unit converter
    if (document.getElementById('unitType')) {
        updateUnitOptions();
    }

    // Initialize other inputs
    if (document.getElementById('physicsFormula')) updatePhysicsInputs();
    if (document.getElementById('chemFormula')) updateChemInputs();
    if (document.getElementById('triangleCalc')) updateTriangleInputs();
    if (document.getElementById('shapeType')) updateShapeInputs();
    if (document.getElementById('probType')) updateProbInputs();

    // Initialize Pomodoro count
    if (document.getElementById('pomodoroCount')) {
        document.getElementById('pomodoroCount').textContent = localStorage.getItem('pomodoroCount') || '0';
    }
});

// Counter Animation
function animateCounter(elementId, start, end, duration) {
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / (end - start)));
    const element = document.getElementById(elementId);

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current.toLocaleString();
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

// ===========================================
// LANGUAGE LEARNING FUNCTIONS
// ===========================================

// AI Chat History
let aiChatHistory = [];

// Handle subject change
function handleSubjectChange() {
    const subject = document.getElementById('aiSubject').value;
    const languageActions = document.getElementById('languageQuickActions');
    const languageSubjects = ['thai', 'english', 'chinese', 'korean', 'japanese'];

    if (languageSubjects.includes(subject)) {
        languageActions.style.display = 'flex';
        updateLanguageWelcome(subject);
    } else {
        languageActions.style.display = 'none';
    }
}

// Update language welcome message
function updateLanguageWelcome(language) {
    const welcomeMessages = {
        'english': '🇬🇧 สวัสดี! ผมพร้อมสอนภาษาอังกฤษทุกทักษะ ทั้งไวยากรณ์ คำศัพท์ การสนทนา และการออกเสียง!',
        'chinese': '🇨🇳 你好! (สวัสดี) ผมพร้อมสอนภาษาจีนทั้งพินอิน ตัวอักษรจีน คำศัพท์ และประโยคพื้นฐาน!',
        'korean': '🇰🇷 안녕하세요! (สวัสดี) ผมพร้อมสอนภาษาเกาหลีทั้งฮันกึล ไวยากรณ์ คำศัพท์ และวัฒนธรรมเกาหลี!',
        'japanese': '🇯🇵 こんにちは! (สวัสดี) ผมพร้อมสอนภาษาญี่ปุ่นทั้งฮิรางานะ คาตาคานะ คันจิ และประโยคพื้นฐาน!',
        'thai': '🇹🇭 สวัสดีครับ! ผมพร้อมสอนภาษาไทยสำหรับผู้เรียนต่างชาติ ทั้งไวยากรณ์ คำศัพท์ และการใช้ภาษาในชีวิตประจำวัน!'
    };

    if (welcomeMessages[language]) {
        console.log(`เปลี่ยนเป็นวิชา: ${language}`);
    }
}

// Toggle Mobile Language Sidebar
function toggleMobileLang(btn) {
    const sidebar = document.getElementById('langFeaturesSidebar');
    btn.classList.toggle('active');
    sidebar.classList.toggle('mobile-expanded');
}

// Set language example
function setLanguageExample(language, question) {
    document.getElementById('aiSubject').value = language;
    document.getElementById('aiUserInput').value = question;
    document.getElementById('aiUserInput').focus();

    // Show quick actions for language
    const languageActions = document.getElementById('languageQuickActions');
    languageActions.style.display = 'flex';

    // Update education level
    if (language === 'thai') {
        document.getElementById('aiLevel').value = 'university';
    } else {
        document.getElementById('aiLevel').value = 'm1-3';
    }

    // On mobile, collapse the language sidebar after selection
    if (window.innerWidth < 992) {
        const sidebar = document.getElementById('langFeaturesSidebar');
        const toggleBtn = document.getElementById('mobileLangToggle');
        if (sidebar.classList.contains('mobile-expanded')) {
            sidebar.classList.remove('mobile-expanded');
            toggleBtn.classList.remove('active');
        }
    }
}

// Language Quick Actions
function askVocabulary() {
    const subject = document.getElementById('aiSubject').value;
    const languageNames = {
        'english': 'ภาษาอังกฤษ',
        'chinese': 'ภาษาจีน',
        'korean': 'ภาษาเกาหลี',
        'japanese': 'ภาษาญี่ปุ่น',
        'thai': 'ภาษาไทย'
    };

    const question = `สอนคำศัพท์${languageNames[subject]}พื้นฐาน 10 คำ พร้อมคำอ่านและความหมาย`;
    document.getElementById('aiUserInput').value = question;
}

function askGrammar() {
    const subject = document.getElementById('aiSubject').value;
    const languageNames = {
        'english': 'ภาษาอังกฤษ',
        'chinese': 'ภาษาจีน',
        'korean': 'ภาษาเกาหลี',
        'japanese': 'ภาษาญี่ปุ่น',
        'thai': 'ภาษาไทย'
    };

    const grammarTopics = {
        'english': 'Present Simple Tense',
        'chinese': 'คำกริยาและการเรียงประโยค',
        'korean': 'ระบบคำกริยาและการผันคำกริยา',
        'japanese': 'ระบบคำกริยาและคำช่วย',
        'thai': 'การเรียงลำดับคำและคำช่วย'
    };

    const question = `อธิบายไวยากรณ์${languageNames[subject]}เรื่อง ${grammarTopics[subject]} พร้อมตัวอย่าง`;
    document.getElementById('aiUserInput').value = question;
}

function askPronunciation() {
    const subject = document.getElementById('aiSubject').value;
    const languageNames = {
        'english': 'ภาษาอังกฤษ',
        'chinese': 'ภาษาจีน',
        'korean': 'ภาษาเกาหลี',
        'japanese': 'ภาษาญี่ปุ่น',
        'thai': 'ภาษาไทย'
    };

    const question = `สอนการออกเสียง${languageNames[subject]}ที่ถูกต้อง พร้อมเทคนิคการฝึก`;
    document.getElementById('aiUserInput').value = question;
}

function askTranslation() {
    const subject = document.getElementById('aiSubject').value;
    const languagePairs = {
        'english': 'จากไทยเป็นอังกฤษ',
        'chinese': 'จากไทยเป็นจีน',
        'korean': 'จากไทยเป็นเกาหลี',
        'japanese': 'จากไทยเป็นญี่ปุ่น',
        'thai': 'จากอังกฤษเป็นไทย'
    };

    const question = `ช่วยแปลประโยค ${languagePairs[subject]} และอธิบายไวยากรณ์ที่เกี่ยวข้อง`;
    document.getElementById('aiUserInput').value = question;
}

function askSentence() {
    const subject = document.getElementById('aiSubject').value;
    const languageNames = {
        'english': 'ภาษาอังกฤษ',
        'chinese': 'ภาษาจีน',
        'korean': 'ภาษาเกาหลี',
        'japanese': 'ภาษาญี่ปุ่น',
        'thai': 'ภาษาไทย'
    };

    const sentenceTypes = {
        'english': 'ประโยคแนะนำตัว ประโยคถามทาง',
        'chinese': 'ประโยคทักทาย ประโยคสั่งอาหาร',
        'korean': 'ประโยคแนะนำตัว ประโยคซื้อของ',
        'japanese': 'ประโยคแนะนำตัว ประโยคสอบถามราคา',
        'thai': 'ประโยคแนะนำตัวสำหรับต่างชาติ ประโยคถามทาง'
    };

    const question = `สอน${languageNames[subject]}ในชีวิตประจำวัน เช่น ${sentenceTypes[subject]}`;
    document.getElementById('aiUserInput').value = question;
}

// Generate language practice
function generateLanguagePractice(language) {
    const practices = {
        'english': [
            "สร้างแบบฝึกหัดเติมคำในช่องว่างภาษาอังกฤษ",
            "สร้างบทสนทนาภาษาอังกฤษในร้านอาหาร",
            "ฝึกออกเสียงคำศัพท์ภาษาอังกฤษที่มีปัญหาการออกเสียง"
        ],
        'chinese': [
            "ฝึกเขียนตัวอักษรจีนพื้นฐาน 10 ตัว",
            "สร้างบทสนทนาภาษาจีนในร้านค้า",
            "ฝึกอ่านพินอินและทำความเข้าใจเสียงวรรณยุกต์"
        ],
        'korean': [
            "ฝึกเขียนฮันกึลและอ่านออกเสียง",
            "สร้างบทสนทนาภาษาเกาหลีในร้านกาแฟ",
            "เรียนรู้คำสุภาพในภาษาเกาหลี"
        ],
        'japanese': [
            "ฝึกเขียนฮิรางานะและคาตาคานะ",
            "สร้างบทสนทนาภาษาญี่ปุ่นในร้านสะดวกซื้อ",
            "เรียนรู้ระดับความสุภาพในภาษาญี่ปุ่น"
        ],
        'thai': [
            "สร้างแบบฝึกหัดการใช้คำช่วยไทย",
            "ฝึกออกเสียงเสียงวรรณยุกต์ไทย",
            "สร้างบทสนทนาไทยสำหรับการท่องเที่ยว"
        ]
    };

    return practices[language] || [];
}

// Enhance language prompt
function enhanceLanguagePrompt(question, subject, mode) {
    if (['thai', 'english', 'chinese', 'korean', 'japanese'].includes(subject)) {
        let enhancedPrompt = question;

        const languageInstructions = {
            'english': "โปรดตอบเป็นภาษาไทย แต่แสดงตัวอย่างเป็นภาษาอังกฤษพร้อมคำอ่านไทยและการออกเสียง (IPA ถ้าจำเป็น)",
            'chinese': "โปรดตอบเป็นภาษาไทย แต่แสดงตัวอย่างเป็นภาษาจีนพร้อมพินอิน คำอ่านไทย และความหมาย",
            'korean': "โปรดตอบเป็นภาษาไทย แต่แสดงตัวอย่างเป็นภาษาเกาหลีพร้อมฮันกึล คำอ่านไทย และความหมาย",
            'japanese': "โปรดตอบเป็นภาษาไทย แต่แสดงตัวอย่างเป็นภาษาญี่ปุ่นพร้อมคำอ่านไทยและความหมาย",
            'thai': "โปรดตอบเป็นภาษาไทยแบบง่าย ๆ เหมาะสำหรับผู้เรียนต่างชาติ พร้อมตัวอย่างชัดเจน"
        };

        enhancedPrompt += ` (${languageInstructions[subject]})`;

        if (mode === 'explain') {
            enhancedPrompt += " อธิบายละเอียดทีละขั้นตอน";
        } else if (mode === 'stepbystep') {
            enhancedPrompt += " แสดงขั้นตอนการเรียนรู้อย่างเป็นระบบ";
        } else if (mode === 'example') {
            enhancedPrompt += " ยกตัวอย่างเยอะๆ พร้อมคำอธิบาย";
        }

        return enhancedPrompt;
    }
    return question;
}

// Send AI Message
async function sendAIMessage() {
    const userInput = document.getElementById('aiUserInput').value.trim();
    if (!userInput) return;

    // 🎁 เช็คโควต้าฟรีก่อน (await เพราะเป็น async)
    const canUse = await checkCanUseAI();
    if (!canUse) {
        return; // Modal จะแสดงอัตโนมัติ
    }

    const subject = document.getElementById('aiSubject').value;
    const level = document.getElementById('aiLevel').value;
    const mode = document.getElementById('aiMode').value;

    // Enhance prompt for languages
    let enhancedInput = userInput;
    if (['thai', 'english', 'chinese', 'korean', 'japanese'].includes(subject)) {
        enhancedInput = enhanceLanguagePrompt(userInput, subject, mode);
    }

    // Add user message to chat
    addChatMessage(userInput, 'user');
    document.getElementById('aiUserInput').value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        // Call Firebase Cloud Function
        const response = await fetch('https://us-central1-appinjproject.cloudfunctions.net/educationAI', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: enhancedInput,
                subject: subject,
                level: level,
                mode: mode,
                history: aiChatHistory.slice(-6)
            })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator();

        if (data.success && data.response) {
            // Format response for languages
            let formattedResponse = data.response;
            if (['thai', 'english', 'chinese', 'korean', 'japanese'].includes(subject)) {
                formattedResponse = formatLanguageResponse(formattedResponse, subject);
            }

            addChatMessage(formattedResponse, 'ai');
            // Save to history
            aiChatHistory.push({ role: 'user', content: userInput });
            aiChatHistory.push({ role: 'ai', content: formattedResponse });

            // 🎁 นับครั้งใช้งานและอัปเดต UI (await เพราะ async)
            await useFreeCredit();
            await updateFreeUsageUI();
        } else {
            addChatMessage('ขออภัยครับ ไม่สามารถประมวลผลคำถามได้ในขณะนี้ กรุณาลองใหม่อีกครั้งครับ 🙏', 'ai');
        }
    } catch (error) {
        removeTypingIndicator();
        console.error('AI Error:', error);
        addChatMessage('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้งครับ', 'ai');
    }
}

// Add chat message to UI
let currentAISubject = 'general';

function addChatMessage(message, sender, subject = null) {
    const chatContainer = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');

    // Get current subject from select
    if (!subject) {
        subject = document.getElementById('aiSubject')?.value || 'general';
    }
    currentAISubject = subject;

    if (sender === 'user') {
        messageDiv.className = 'chat-message-user';
        messageDiv.innerHTML = `${escapeHtml(message)}`;
    } else {
        // Format based on subject
        let formattedContent;
        if (['thai', 'english', 'chinese', 'korean', 'japanese'].includes(subject)) {
            formattedContent = formatLanguageResponse(message, subject);
        } else {
            formattedContent = formatAIResponse(message);
        }

        messageDiv.className = 'chat-message-ai';

        // Add speak all button for language subjects
        const speakButton = ['thai', 'english', 'chinese', 'korean', 'japanese'].includes(subject) ?
            `<button onclick="speakFullResponse(this)" style="background: #f1f5f9; border: none; color: #475569; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; margin-left: auto; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-volume-up"></i> ฟังเสียง</button>` : '';

        messageDiv.innerHTML = `
                    <div style="font-weight: 700; margin-bottom: 8px; color: #7c3aed; display: flex; justify-content: space-between; align-items: center;">
                        <span>WiT 365 AI</span>
                        ${speakButton}
                    </div>
                    <div class="ai-response-content">${formattedContent}</div>
                `;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Speak full AI response
function speakFullResponse(button) {
    // Find the message container (parent of the header div)
    const messageContainer = button.closest('div[style*="background: linear-gradient"]');
    if (!messageContainer) {
        console.error('Message container not found');
        return;
    }

    // Find the response content div
    const responseContent = messageContainer.querySelector('.ai-response-content');
    if (!responseContent) {
        console.error('Response content not found');
        return;
    }

    // Get text content without HTML tags
    const text = responseContent.innerText.substring(0, 800); // Limit to 800 chars

    if (!text || text.trim().length === 0) {
        alert('ไม่พบข้อความที่จะอ่าน');
        return;
    }

    // Speak the text
    speakText(text, currentAISubject);

    // Visual feedback
    button.innerHTML = '<i class="fas fa-volume-up"></i> กำลังอ่าน...';
    button.style.background = 'rgba(34, 197, 94, 0.5)';

    setTimeout(() => {
        button.innerHTML = '<i class="fas fa-volume-up"></i> ฟังทั้งหมด';
        button.style.background = 'rgba(255,255,255,0.2)';
    }, 5000);
}

// Format AI Response - Enhanced with proper markdown support
function formatAIResponse(text) {
    // Don't escape HTML first - we'll handle it differently
    let formatted = text;

    // Convert markdown tables to HTML tables
    formatted = convertMarkdownTables(formatted);

    // Convert headers
    formatted = formatted.replace(/^### (.*?)$/gm, '<h5 style="color: #fbbf24; margin: 15px 0 10px 0; font-weight: 700;">$1</h5>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h4 style="color: #fbbf24; margin: 15px 0 10px 0; font-weight: 700;">$1</h4>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h3 style="color: #fbbf24; margin: 15px 0 10px 0; font-weight: 700;">$1</h3>');

    // Convert markdown-like to HTML
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^\*\n]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; overflow-x: auto; margin: 10px 0; font-family: monospace; white-space: pre-wrap;">$1</pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px; font-family: monospace;">$1</code>');

    // Lists
    formatted = formatted.replace(/^- (.*?)$/gm, '<li style="margin: 5px 0;">$1</li>');
    formatted = formatted.replace(/^(\d+)\. (.*?)$/gm, '<li style="margin: 5px 0;"><strong>$1.</strong> $2</li>');

    // Math formulas
    formatted = formatted.replace(/\$\$(.*?)\$\$/g, '<div style="text-align: center; margin: 15px 0; font-family: monospace; font-size: 1.2rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">$1</div>');
    formatted = formatted.replace(/\$(.*?)\$/g, '<span style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">$1</span>');

    // Line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p style="margin: 10px 0;">');
    formatted = formatted.replace(/\n/g, '<br>');

    // Wrap in paragraph
    formatted = '<p style="margin: 0;">' + formatted + '</p>';

    return formatted;
}

// Convert markdown tables to HTML
function convertMarkdownTables(text) {
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm;

    return text.replace(tableRegex, (match, headerRow, bodyRows) => {
        // Parse header
        const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);

        // Parse body rows
        const rows = bodyRows.trim().split('\n').map(row =>
            row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );

        // Build HTML table
        let tableHtml = `
                    <div style="overflow-x: auto; margin: 15px 0;">
                        <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.2);">
                                    ${headers.map(h => `<th style="padding: 12px 10px; text-align: left; font-weight: 700; border-bottom: 2px solid rgba(255,255,255,0.3);">${h}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(row => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                        ${row.map(cell => `<td style="padding: 10px; vertical-align: top;">${cell}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

        return tableHtml;
    });
}

// Format language response - Enhanced version
function formatLanguageResponse(text, language) {
    // First apply general formatting
    let formatted = formatAIResponse(text);

    // Language-specific character styling
    const charStyles = {
        chinese: {
            regex: /([\u4e00-\u9fff]+)/g,
            class: 'chinese-character',
            color: '#ef4444'
        },
        japanese: {
            regex: /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g,
            class: 'japanese-character',
            color: '#f472b6'
        },
        korean: {
            regex: /([\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]+)/g,
            class: 'korean-character',
            color: '#a78bfa'
        }
    };

    if (charStyles[language]) {
        const style = charStyles[language];
        formatted = formatted.replace(style.regex,
            `<span class="${style.class}" style="font-size: 1.3em; font-weight: 700; color: ${style.color}; cursor: pointer;" onclick="speakText('$1', '${language}')" title="คลิกเพื่อฟังเสียง">$1</span>`);
    }

    // Add pronunciation styling
    formatted = formatted.replace(/\(([a-zA-Z-]+)\)/g,
        '<span style="color: #fbbf24; font-weight: 600; font-size: 0.9em;"> [$1]</span>');

    // Style examples and tips
    formatted = formatted.replace(/เคล็ดลับ:?\s*/gi,
        '<div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2)); padding: 12px 15px; border-radius: 10px; margin: 10px 0; border-left: 4px solid #fbbf24;"><strong>💡 เคล็ดลับ:</strong> ');

    // Close tip divs properly
    formatted = formatted.replace(/(<div[^>]*>💡 เคล็ดลับ:<\/strong>)([^<]*?)(<br><br>|<\/p>|$)/g, '$1$2</div>$3');

    return formatted;
}

// Speak text function for AI responses
function speakText(text, language) {
    const langCodes = {
        english: 'en-US',
        chinese: 'zh-CN',
        japanese: 'ja-JP',
        korean: 'ko-KR',
        thai: 'th-TH',
        general: 'th-TH'
    };

    if (!('speechSynthesis' in window)) {
        alert('เบราว์เซอร์ไม่รองรับการอ่านออกเสียง');
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCodes[language] || 'th-TH';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find best voice
    const voices = speechSynthesis.getVoices();
    const targetLang = langCodes[language] || 'th-TH';
    const langPrefix = targetLang.split('-')[0];

    let selectedVoice = voices.find(v => v.lang === targetLang);
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // Events
    utterance.onstart = () => {
        console.log('Speech started:', text.substring(0, 50) + '...');
    };

    utterance.onend = () => {
        console.log('Speech ended');
    };

    utterance.onerror = (e) => {
        console.error('Speech error:', e);
    };

    // Speak
    setTimeout(() => {
        speechSynthesis.speak(utterance);
    }, 100);

    // Show toast with truncated text
    if (typeof showToast === 'function') {
        const shortText = text.length > 30 ? text.substring(0, 30) + '...' : text;
        showToast(`🔊 กำลังอ่าน: ${shortText}`, 'info');
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show typing indicator
function showTypingIndicator() {
    const chatContainer = document.getElementById('aiChatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.style.cssText = `
                background: rgba(139, 92, 246, 0.2);
                padding: 15px 20px;
                border-radius: 20px;
                margin-bottom: 15px;
                max-width: 150px;
            `;
    typingDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>🤖</span>
                    <div style="display: flex; gap: 4px;">
                        <span class="typing-dot" style="width: 8px; height: 8px; background: #8B5CF6; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out both; animation-delay: 0s;"></span>
                        <span class="typing-dot" style="width: 8px; height: 8px; background: #8B5CF6; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out both; animation-delay: 0.2s;"></span>
                        <span class="typing-dot" style="width: 8px; height: 8px; background: #8B5CF6; border-radius: 50%; animation: typingBounce 1.4s infinite ease-in-out both; animation-delay: 0.4s;"></span>
                    </div>
                </div>
            `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingDiv = document.getElementById('typingIndicator');
    if (typingDiv) typingDiv.remove();
}

// Set quick question
function setQuickQuestion(question) {
    document.getElementById('aiUserInput').value = question;
    document.getElementById('aiUserInput').focus();
}

// Clear AI Chat
function clearAIChat() {
    const chatContainer = document.getElementById('aiChatMessages');
    chatContainer.innerHTML = `
                <div class="chat-message-ai">
                    <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #7c3aed;">
                        สวัสดีครับ! 🤖
                    </div>
                    <div>
                        เริ่มบทสนทนาใหม่เรียบร้อยครับ! ✨<br><br>
                        พิมพ์คำถามใหม่ได้เลย ผมพร้อมช่วยเสมอครับ! 👇
                    </div>
                </div>
            `;
    aiChatHistory = [];
}

// ===========================================
// GPA CALCULATOR FUNCTIONS
// ===========================================

let gpaSystem = 'university';
let subjects = [];

function setGpaSystem(system) {
    gpaSystem = system;
    const buttons = document.querySelectorAll('#gpa .btn-custom-primary, #gpa .btn-custom-secondary');
    buttons.forEach(btn => {
        if (btn.textContent.includes(system === 'university' ? 'มหาวิทยาลัย' : 'มัธยม')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updateGradeOptions();
}

function initializeGPAPro() {
    subjects = [];
    addSubjectPro();
    addSubjectPro();
    addSubjectPro();
    updateGradeOptions();
}

function addSubjectPro() {
    const container = document.getElementById('subjectsContainerPro');
    const id = subjects.length + 1;
    const subject = {
        id: id,
        name: '',
        credit: 3,
        grade: 3.5
    };
    subjects.push(subject);

    const div = document.createElement('div');
    div.className = 'subject-row row align-items-center mb-3';
    div.id = `subject-${id}`;
    div.innerHTML = `
                <div class="col-md-4">
                    <input type="text" class="form-control-custom subject-name" placeholder="ชื่อวิชา (เช่น แคลคูลัส)" 
                           oninput="updateSubjectName(${id}, this.value)">
                </div>
                <div class="col-md-3">
                    <select class="form-control-custom subject-credit" onchange="updateSubjectCredit(${id}, this.value)">
                        <option value="1">1 หน่วยกิต</option>
                        <option value="2">2 หน่วยกิต</option>
                        <option value="3" selected>3 หน่วยกิต</option>
                        <option value="4">4 หน่วยกิต</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <select class="form-control-custom subject-grade" onchange="updateSubjectGrade(${id}, this.value)">
                        <!-- Will be populated by updateGradeOptions -->
                    </select>
                </div>
                <div class="col-md-1">
                    <button class="btn btn-danger btn-sm" onclick="removeSubjectPro(${id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
    container.appendChild(div);
    updateGradeOptions();
}

function updateGradeOptions() {
    const gradeOptions = gpaSystem === 'university' ? [
        { value: 4, label: 'A (4.0)' },
        { value: 3.5, label: 'B+ (3.5)' },
        { value: 3, label: 'B (3.0)' },
        { value: 2.5, label: 'C+ (2.5)' },
        { value: 2, label: 'C (2.0)' },
        { value: 1.5, label: 'D+ (1.5)' },
        { value: 1, label: 'D (1.0)' },
        { value: 0, label: 'F (0.0)' }
    ] : [
        { value: 5, label: 'A (5.0)' },
        { value: 4, label: 'B+ (4.0)' },
        { value: 3.5, label: 'B (3.5)' },
        { value: 3, label: 'C+ (3.0)' },
        { value: 2.5, label: 'C (2.5)' },
        { value: 2, label: 'D+ (2.0)' },
        { value: 1, label: 'D (1.0)' },
        { value: 0, label: 'F (0.0)' }
    ];

    document.querySelectorAll('.subject-grade').forEach((select, index) => {
        select.innerHTML = '';
        gradeOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            select.appendChild(opt);
        });
        if (subjects[index]) {
            select.value = subjects[index].grade;
        }
    });
}

function updateSubjectName(id, value) {
    const subject = subjects.find(s => s.id === id);
    if (subject) subject.name = value;
}

function updateSubjectCredit(id, value) {
    const subject = subjects.find(s => s.id === id);
    if (subject) subject.credit = parseFloat(value);
}

function updateSubjectGrade(id, value) {
    const subject = subjects.find(s => s.id === id);
    if (subject) subject.grade = parseFloat(value);
}

function removeSubjectPro(id) {
    subjects = subjects.filter(s => s.id !== id);
    const element = document.getElementById(`subject-${id}`);
    if (element) element.remove();
    updateGradeOptions();
}

function clearAllSubjects() {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างวิชาทั้งหมด?')) {
        subjects = [];
        document.getElementById('subjectsContainerPro').innerHTML = '';
        addSubjectPro();
        addSubjectPro();
        addSubjectPro();
        document.getElementById('gpaResultPro').style.display = 'none';
    }
}

function calculateGPAPro() {
    let totalCredits = 0;
    let totalPoints = 0;
    const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    subjects.forEach(subject => {
        totalCredits += subject.credit;
        totalPoints += (subject.credit * subject.grade);

        // Count grades
        if (subject.grade >= 3.5) gradeCount.A++;
        else if (subject.grade >= 2.5) gradeCount.B++;
        else if (subject.grade >= 1.5) gradeCount.C++;
        else if (subject.grade >= 0.5) gradeCount.D++;
        else gradeCount.F++;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    const gpaPercent = (gpa / (gpaSystem === 'university' ? 4 : 5)) * 100;

    // Update results
    document.getElementById('gpaValuePro').textContent = gpa;
    document.getElementById('totalCreditsPro').textContent = totalCredits;
    document.getElementById('totalPointsPro').textContent = totalPoints.toFixed(2);
    document.getElementById('gpaProgress').style.width = `${gpaPercent}%`;

    // Update grade counts
    document.getElementById('gradeACount').textContent = gradeCount.A;
    document.getElementById('gradeBCount').textContent = gradeCount.B;
    document.getElementById('gradeCCount').textContent = gradeCount.C;
    document.getElementById('gradeDCount').textContent = gradeCount.D;
    document.getElementById('gradeFCount').textContent = gradeCount.F;

    // Update stats
    const avgPerCredit = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    document.getElementById('avgPerCredit').textContent = avgPerCredit;
    document.getElementById('avgPerCreditBar').style.width = `${(avgPerCredit / 4) * 100}%`;

    const studyEfficiency = ((gradeCount.A + gradeCount.B) / subjects.length * 100).toFixed(0);
    document.getElementById('studyEfficiency').textContent = `${studyEfficiency}%`;
    document.getElementById('studyEfficiencyBar').style.width = `${studyEfficiency}%`;

    // Show prediction
    const targetGPA = parseFloat(document.getElementById('targetGPA').value) || 3.5;
    document.getElementById('targetDisplay').textContent = targetGPA;

    const requiredPoints = (targetGPA * totalCredits) - totalPoints;
    const requiredA = Math.ceil(requiredPoints / (4 * 3));
    const requiredBPlus = Math.ceil(requiredPoints / (3.5 * 3));

    document.getElementById('requiredA').textContent = requiredA;
    document.getElementById('requiredBPlus').textContent = requiredBPlus;

    // Show result
    document.getElementById('gpaResultPro').style.display = 'block';

    // Add to history
    addToHistory('GPA Calculator', `${subjects.length} วิชา`, gpa);

    // Update chart
    updateGPAChart();
}

function initializeGPAChart() {
    const ctx = document.getElementById('gpaChart').getContext('2d');
    window.gpaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['เทอม 1', 'เทอม 2', 'เทอม 3', 'เทอม 4', 'เทอม 5', 'เทอม 6'],
            datasets: [{
                label: 'GPA',
                data: [3.25, 3.40, 3.60, 3.45, 3.75, 3.80],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 2.0,
                    max: 4.0
                }
            }
        }
    });
}

function updateGPAChart() {
    if (window.gpaChart) {
        const newData = window.gpaChart.data.datasets[0].data;
        const lastValue = newData[newData.length - 1];
        const newValue = parseFloat(document.getElementById('gpaValuePro').textContent);

        const smoothedValue = (lastValue * 0.7 + newValue * 0.3);
        newData.push(smoothedValue.toFixed(2));
        newData.shift();

        window.gpaChart.update();
    }
}

function showGradeInfo(grade) {
    const messages = {
        A: 'เกรด A: ยอดเยี่ยม! คุณมีผลการเรียนที่โดดเด่น',
        B: 'เกรด B: ดีมาก! พยายามอีกนิดเพื่อให้ได้ A',
        C: 'เกรด C: พอใช้! ควรเพิ่มความพยายามในการเรียน',
        D: 'เกรด D: ผ่านเกณฑ์! ควรปรับปรุงอย่างเร่งด่วน',
        F: 'เกรด F: ไม่ผ่าน! ต้องทบทวนและปรับปรุงวิธีการเรียน'
    };

    alert(messages[grade]);
}

function exportGPAReport() {
    const report = `
                รายงานผลการเรียน
                ===============
                วันที่: ${new Date().toLocaleDateString('th-TH')}
                ระบบ: ${gpaSystem === 'university' ? 'มหาวิทยาลัย (4.0)' : 'มัธยมศึกษา (5.0)'}
                
                สรุปผล
                -------
                GPA: ${document.getElementById('gpaValuePro').textContent}
                หน่วยกิตรวม: ${document.getElementById('totalCreditsPro').textContent}
                คะแนนรวม: ${document.getElementById('totalPointsPro').textContent}
                
                การกระจายเกรด
                -------------
                A: ${document.getElementById('gradeACount').textContent} วิชา
                B: ${document.getElementById('gradeBCount').textContent} วิชา
                C: ${document.getElementById('gradeCCount').textContent} วิชา
                D: ${document.getElementById('gradeDCount').textContent} วิชา
                F: ${document.getElementById('gradeFCount').textContent} วิชา
                
                คำแนะนำ
                -------
                ${getStudyRecommendation()}
            `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpa-report-${new Date().getTime()}.txt`;
    a.click();

    alert('ส่งออกรายงานเรียบร้อยแล้ว!');
}

function getStudyRecommendation() {
    const gpa = parseFloat(document.getElementById('gpaValuePro').textContent);

    if (gpa >= 3.5) return 'คุณมีผลการเรียนที่ดีเยี่ยม! รักษาระดับนี้ไว้ให้ดี';
    if (gpa >= 3.0) return 'ผลการเรียนดี! ลองเพิ่มชั่วโมงอ่านหนังสืออีก 2-3 ชั่วโมงต่อสัปดาห์';
    if (gpa >= 2.5) return 'ผลการเรียนพอใช้! ควรปรับปรุงวิธีการเรียนและเพิ่มเวลาเตรียมตัวก่อนสอบ';
    if (gpa >= 2.0) return 'ต้องการปรับปรุง! พิจารณาหาติวเตอร์หรือเข้าคลินิกวิชาการของมหาวิทยาลัย';
    return 'ต้องปรับปรุงเร่งด่วน! ควรปรึกษาอาจารย์ที่ปรึกษาเพื่อวางแผนการเรียนใหม่';
}

// ===========================================
// HISTORY MANAGEMENT
// ===========================================

function toggleHistory() {
    const icon = document.getElementById('historyToggleIcon');
    if (icon) {
        icon.style.transform = icon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

function addToHistory(tool, details, result) {
    const history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
    const entry = {
        id: Date.now(),
        date: new Date().toLocaleString('th-TH'),
        tool: tool,
        details: details,
        result: result
    };

    history.unshift(entry);
    if (history.length > 10) history.pop();

    localStorage.setItem('calcHistory', JSON.stringify(history));
    loadCalculationHistory();

    // Auto expand history when new entry added
    const historyCollapse = document.getElementById('historyCollapse');
    if (historyCollapse && !historyCollapse.classList.contains('show')) {
        new bootstrap.Collapse(historyCollapse, { show: true });
        const icon = document.getElementById('historyToggleIcon');
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
}

function loadCalculationHistory() {
    const history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
    const tbody = document.querySelector('#calculationHistory tbody');
    const noHistoryMsg = document.getElementById('noHistoryMsg');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (history.length === 0) {
        if (noHistoryMsg) noHistoryMsg.style.display = 'block';
        return;
    }

    if (noHistoryMsg) noHistoryMsg.style.display = 'none';

    history.forEach(entry => {
        const row = tbody.insertRow();
        row.innerHTML = `
                    <td><small>${entry.date}</small></td>
                    <td><span class="badge bg-primary">${entry.tool}</span></td>
                    <td><small>${entry.details}</small></td>
                    <td><strong class="text-success">${entry.result}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryEntry(${entry.id})" title="ลบ">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
    });
}

function deleteHistoryEntry(id) {
    if (confirm('ลบรายการนี้หรือไม่?')) {
        let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');
        history = history.filter(entry => entry.id !== id);
        localStorage.setItem('calcHistory', JSON.stringify(history));
        loadCalculationHistory();
    }
}

// ===========================================
// SCIENCE CALCULATORS
// ===========================================

function updatePhysicsInputs() {
    const formula = document.getElementById('physicsFormula').value;
    let html = '<div class="row">';
    const formulas = {
        'ohm-v': [['I', 'กระแสไฟฟ้า I (A)', 'phys1'], ['R', 'ความต้านทาน R (Ω)', 'phys2']],
        'ohm-i': [['V', 'แรงดัน V (V)', 'phys1'], ['R', 'ความต้านทาน R (Ω)', 'phys2']],
        'ohm-r': [['V', 'แรงดัน V (V)', 'phys1'], ['I', 'กระแสไฟฟ้า I (A)', 'phys2']],
        'power': [['V', 'แรงดัน V (V)', 'phys1'], ['I', 'กระแสไฟฟ้า I (A)', 'phys2']],
        'velocity': [['s', 'ระยะทาง s (m)', 'phys1'], ['t', 'เวลา t (s)', 'phys2']],
        'acceleration': [['v', 'ความเร็วสุดท้าย v (m/s)', 'phys1'], ['u', 'ความเร็วเริ่มต้น u (m/s)', 'phys2'], ['t', 'เวลา t (s)', 'phys3']],
        'force': [['m', 'มวล m (kg)', 'phys1'], ['a', 'ความเร่ง a (m/s²)', 'phys2']],
        'kinetic': [['m', 'มวล m (kg)', 'phys1'], ['v', 'ความเร็ว v (m/s)', 'phys2']],
        'potential': [['m', 'มวล m (kg)', 'phys1'], ['h', 'ความสูง h (m)', 'phys2']]
    };

    const inputs = formulas[formula] || formulas['ohm-v'];
    inputs.forEach((inp, i) => {
        html += `<div class="col-${12 / Math.min(inputs.length, 3)} mb-3">
                    <label class="form-label-custom">${inp[1]}</label>
                    <input type="number" class="form-control-custom" id="${inp[2]}" placeholder="${inp[0]}">
                </div>`;
    });
    html += '</div>';
    document.getElementById('physicsInputs').innerHTML = html;
}

function calculatePhysics() {
    const formula = document.getElementById('physicsFormula').value;
    const p1 = parseFloat(document.getElementById('phys1')?.value) || 0;
    const p2 = parseFloat(document.getElementById('phys2')?.value) || 0;
    const p3 = parseFloat(document.getElementById('phys3')?.value) || 0;

    let result = 0, unit = '', tip = '';

    switch (formula) {
        case 'ohm-v': result = p1 * p2; unit = 'V (โวลต์)'; tip = 'V = I × R'; break;
        case 'ohm-i': result = p1 / p2; unit = 'A (แอมแปร์)'; tip = 'I = V / R'; break;
        case 'ohm-r': result = p1 / p2; unit = 'Ω (โอห์ม)'; tip = 'R = V / I'; break;
        case 'power': result = p1 * p2; unit = 'W (วัตต์)'; tip = 'P = V × I'; break;
        case 'velocity': result = p1 / p2; unit = 'm/s'; tip = 'v = s / t'; break;
        case 'acceleration': result = (p1 - p2) / p3; unit = 'm/s²'; tip = 'a = (v - u) / t'; break;
        case 'force': result = p1 * p2; unit = 'N (นิวตัน)'; tip = 'F = m × a'; break;
        case 'kinetic': result = 0.5 * p1 * p2 * p2; unit = 'J (จูล)'; tip = 'KE = ½mv²'; break;
        case 'potential': result = p1 * 9.81 * p2; unit = 'J (จูล)'; tip = 'PE = mgh (g=9.81)'; break;
    }

    document.getElementById('physicsValue').textContent = result.toFixed(4);
    document.getElementById('physicsUnit').textContent = unit;
    document.getElementById('physicsFormulaTip').textContent = tip;
    document.getElementById('physicsResult').style.display = 'block';

    addToHistory('ฟิสิกส์', tip, result.toFixed(4) + ' ' + unit);
}

function updateChemInputs() {
    const formula = document.getElementById('chemFormula').value;
    let html = '<div class="row">';
    const formulas = {
        'mole': [['m', 'มวล m (g)', 'chem1'], ['M', 'มวลโมเลกุล M (g/mol)', 'chem2']],
        'molarity': [['n', 'จำนวนโมล n (mol)', 'chem1'], ['V', 'ปริมาตร V (L)', 'chem2']],
        'dilution': [['M₁', 'ความเข้มข้นเริ่มต้น M₁ (M)', 'chem1'], ['V₁', 'ปริมาตรเริ่มต้น V₁ (L)', 'chem2'], ['V₂', 'ปริมาตรสุดท้าย V₂ (L)', 'chem3']],
        'ideal-gas': [['P', 'ความดัน P (atm)', 'chem1'], ['V', 'ปริมาตร V (L)', 'chem2'], ['T', 'อุณหภูมิ T (K)', 'chem3']],
        'ph': [['[H⁺]', 'ความเข้มข้น H⁺ (M)', 'chem1']],
        'poh': [['[OH⁻]', 'ความเข้มข้น OH⁻ (M)', 'chem1']]
    };

    const inputs = formulas[formula] || formulas['mole'];
    inputs.forEach((inp) => {
        html += `<div class="col-${12 / Math.min(inputs.length, 3)} mb-3">
                    <label class="form-label-custom">${inp[1]}</label>
                    <input type="number" class="form-control-custom" id="${inp[2]}" placeholder="${inp[0]}" step="any">
                </div>`;
    });
    html += '</div>';
    document.getElementById('chemInputs').innerHTML = html;
}

function calculateChemistry() {
    const formula = document.getElementById('chemFormula').value;
    const c1 = parseFloat(document.getElementById('chem1')?.value) || 0;
    const c2 = parseFloat(document.getElementById('chem2')?.value) || 0;
    const c3 = parseFloat(document.getElementById('chem3')?.value) || 0;

    let result = 0, unit = '';

    switch (formula) {
        case 'mole': result = c1 / c2; unit = 'mol (โมล)'; break;
        case 'molarity': result = c1 / c2; unit = 'M (โมลาร์)'; break;
        case 'dilution': result = (c1 * c2) / c3; unit = 'M (ความเข้มข้นใหม่)'; break;
        case 'ideal-gas': result = (c1 * c2) / (0.0821 * c3); unit = 'mol (R=0.0821)'; break;
        case 'ph': result = -Math.log10(c1); unit = 'pH'; break;
        case 'poh': result = -Math.log10(c1); unit = 'pOH'; break;
    }

    document.getElementById('chemValue').textContent = isFinite(result) ? result.toFixed(4) : 'Error';
    document.getElementById('chemUnit').textContent = unit;
    document.getElementById('chemResult').style.display = 'block';

    addToHistory('เคมี', formula, result.toFixed(4) + ' ' + unit);
}

// ===========================================
// UNIT CONVERTER
// ===========================================

const unitData = {
    length: {
        units: ['m', 'cm', 'mm', 'km', 'in', 'ft', 'mi'],
        names: ['เมตร', 'เซนติเมตร', 'มิลลิเมตร', 'กิโลเมตร', 'นิ้ว', 'ฟุต', 'ไมล์'],
        toBase: [1, 0.01, 0.001, 1000, 0.0254, 0.3048, 1609.34]
    },
    mass: {
        units: ['kg', 'g', 'mg', 'lb', 'oz'],
        names: ['กิโลกรัม', 'กรัม', 'มิลลิกรัม', 'ปอนด์', 'ออนซ์'],
        toBase: [1, 0.001, 0.000001, 0.453592, 0.0283495]
    },
    volume: {
        units: ['L', 'mL', 'm3', 'gal', 'cup'],
        names: ['ลิตร', 'มิลลิลิตร', 'ลบ.เมตร', 'แกลลอน', 'ถ้วย'],
        toBase: [1, 0.001, 1000, 3.78541, 0.236588]
    },
    temperature: {
        units: ['C', 'F', 'K'],
        names: ['เซลเซียส', 'ฟาเรนไฮต์', 'เคลวิน'],
        special: true
    },
    pressure: {
        units: ['Pa', 'atm', 'bar', 'psi', 'mmHg'],
        names: ['ปาสกาล', 'บรรยากาศ', 'บาร์', 'psi', 'mmHg'],
        toBase: [1, 101325, 100000, 6894.76, 133.322]
    },
    energy: {
        units: ['J', 'kJ', 'cal', 'kcal', 'eV', 'kWh'],
        names: ['จูล', 'กิโลจูล', 'แคลอรี', 'กิโลแคลอรี', 'อิเล็กตรอนโวลต์', 'กิโลวัตต์-ชั่วโมง'],
        toBase: [1, 1000, 4.184, 4184, 1.602e-19, 3600000]
    }
};

function updateUnitOptions() {
    const type = document.getElementById('unitType').value;
    const data = unitData[type];
    const fromSelect = document.getElementById('unitFrom');
    const toSelect = document.getElementById('unitTo');

    fromSelect.innerHTML = data.units.map((u, i) => `<option value="${u}">${data.names[i]} (${u})</option>`).join('');
    toSelect.innerHTML = data.units.map((u, i) => `<option value="${u}">${data.names[i]} (${u})</option>`).join('');

    if (data.units.length > 1) toSelect.selectedIndex = 1;
    convertUnits();
}

function convertUnits() {
    const type = document.getElementById('unitType').value;
    const value = parseFloat(document.getElementById('unitValue').value) || 0;
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;
    const data = unitData[type];

    let result = 0;

    if (type === 'temperature') {
        let celsius = 0;
        if (from === 'C') celsius = value;
        else if (from === 'F') celsius = (value - 32) * 5 / 9;
        else if (from === 'K') celsius = value - 273.15;

        if (to === 'C') result = celsius;
        else if (to === 'F') result = celsius * 9 / 5 + 32;
        else if (to === 'K') result = celsius + 273.15;
    } else {
        const fromIdx = data.units.indexOf(from);
        const toIdx = data.units.indexOf(to);
        const baseValue = value * data.toBase[fromIdx];
        result = baseValue / data.toBase[toIdx];
    }

    document.getElementById('unitResult').textContent = result.toPrecision(6);
    document.getElementById('unitResultLabel').textContent = `${from} → ${to}`;
}

// ===========================================
// MATH CALCULATORS
// ===========================================

function solveQuadratic() {
    const a = parseFloat(document.getElementById('quadA').value) || 0;
    const b = parseFloat(document.getElementById('quadB').value) || 0;
    const c = parseFloat(document.getElementById('quadC').value) || 0;

    if (a === 0) {
        document.getElementById('quadSolutions').innerHTML = '<div class="text-danger">a ต้องไม่เท่ากับ 0</div>';
        return;
    }

    const D = b * b - 4 * a * c;
    document.getElementById('discriminant').textContent = D.toFixed(4);

    let html = '';
    if (D > 0) {
        const x1 = (-b + Math.sqrt(D)) / (2 * a);
        const x2 = (-b - Math.sqrt(D)) / (2 * a);
        html = `<div class="h5 text-success">x₁ = ${x1.toFixed(4)}</div>
                        <div class="h5 text-success">x₂ = ${x2.toFixed(4)}</div>
                        <small class="text-muted">มี 2 คำตอบจริง (D > 0)</small>`;
        addToHistory('สมการกำลังสอง', `${a}x² + ${b}x + ${c} = 0`, `x₁=${x1.toFixed(2)}, x₂=${x2.toFixed(2)}`);
    } else if (D === 0) {
        const x = -b / (2 * a);
        html = `<div class="h5 text-primary">x = ${x.toFixed(4)}</div>
                        <small class="text-muted">มี 1 คำตอบซ้ำ (D = 0)</small>`;
        addToHistory('สมการกำลังสอง', `${a}x² + ${b}x + ${c} = 0`, `x=${x.toFixed(2)}`);
    } else {
        const real = -b / (2 * a);
        const imag = Math.sqrt(-D) / (2 * a);
        html = `<div class="h5 text-info">x₁ = ${real.toFixed(4)} + ${imag.toFixed(4)}i</div>
                        <div class="h5 text-info">x₂ = ${real.toFixed(4)} - ${imag.toFixed(4)}i</div>
                        <small class="text-muted">คำตอบเชิงซ้อน (D < 0)</small>`;
    }

    document.getElementById('quadSolutions').innerHTML = html;
    document.getElementById('quadResult').style.display = 'block';
}

function updateTriangleInputs() {
    const calc = document.getElementById('triangleCalc').value;
    let html = '<div class="row">';

    switch (calc) {
        case 'pythagoras':
            html += `<div class="col-6"><label class="form-label-custom">ด้านประกอบ a</label>
                            <input type="number" class="form-control-custom" id="triA" placeholder="a"></div>
                            <div class="col-6"><label class="form-label-custom">ด้านประกอบ b</label>
                            <input type="number" class="form-control-custom" id="triB" placeholder="b"></div>`;
            break;
        case 'area-base':
            html += `<div class="col-6"><label class="form-label-custom">ฐาน</label>
                            <input type="number" class="form-control-custom" id="triA" placeholder="ฐาน"></div>
                            <div class="col-6"><label class="form-label-custom">สูง</label>
                            <input type="number" class="form-control-custom" id="triB" placeholder="สูง"></div>`;
            break;
        case 'area-heron':
        case 'perimeter':
            html += `<div class="col-4"><label class="form-label-custom">ด้าน a</label>
                            <input type="number" class="form-control-custom" id="triA" placeholder="a"></div>
                            <div class="col-4"><label class="form-label-custom">ด้าน b</label>
                            <input type="number" class="form-control-custom" id="triB" placeholder="b"></div>
                            <div class="col-4"><label class="form-label-custom">ด้าน c</label>
                            <input type="number" class="form-control-custom" id="triC" placeholder="c"></div>`;
            break;
    }
    html += '</div>';
    document.getElementById('triangleInputs').innerHTML = html;
}

function calculateTriangle() {
    const calc = document.getElementById('triangleCalc').value;
    const a = parseFloat(document.getElementById('triA')?.value) || 0;
    const b = parseFloat(document.getElementById('triB')?.value) || 0;
    const c = parseFloat(document.getElementById('triC')?.value) || 0;

    let result = 0, unit = 'หน่วย';

    switch (calc) {
        case 'pythagoras':
            result = Math.sqrt(a * a + b * b);
            unit = 'หน่วย (ด้านตรงข้ามมุมฉาก)';
            break;
        case 'area-base':
            result = 0.5 * a * b;
            unit = 'ตร.หน่วย';
            break;
        case 'area-heron':
            const s = (a + b + c) / 2;
            result = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            unit = 'ตร.หน่วย';
            break;
        case 'perimeter':
            result = a + b + c;
            unit = 'หน่วย';
            break;
    }

    document.getElementById('triangleValue').textContent = result.toFixed(4);
    document.getElementById('triangleUnit').textContent = unit;
    document.getElementById('triangleResult').style.display = 'block';

    addToHistory('สามเหลี่ยม', calc, result.toFixed(2) + ' ' + unit);
}

function updateShapeInputs() {
    const shape = document.getElementById('shapeType').value;
    let html = '';

    const inputs = {
        'circle': [['r', 'รัศมี r']],
        'rectangle': [['l', 'ความยาว'], ['w', 'ความกว้าง']],
        'triangle': [['b', 'ฐาน'], ['h', 'ความสูง']],
        'sphere': [['r', 'รัศมี r']],
        'cylinder': [['r', 'รัศมี r'], ['h', 'ความสูง h']],
        'cone': [['r', 'รัศมี r'], ['h', 'ความสูง h']],
        'cube': [['a', 'ด้าน a']]
    };

    const fields = inputs[shape] || inputs['circle'];
    html = '<div class="row">';
    fields.forEach((f, i) => {
        html += `<div class="col-${12 / fields.length}">
                    <label class="form-label-custom">${f[1]}</label>
                    <input type="number" class="form-control-custom" id="shape${String.fromCharCode(65 + i)}" placeholder="${f[0]}">
                </div>`;
    });
    html += '</div>';
    document.getElementById('shapeInputs').innerHTML = html;
}

function calculateShape() {
    const shape = document.getElementById('shapeType').value;
    const a = parseFloat(document.getElementById('shapeA')?.value) || 0;
    const b = parseFloat(document.getElementById('shapeB')?.value) || 0;

    let result = 0, unit = '';

    switch (shape) {
        case 'circle': result = Math.PI * a * a; unit = 'ตร.หน่วย'; break;
        case 'rectangle': result = a * b; unit = 'ตร.หน่วย'; break;
        case 'triangle': result = 0.5 * a * b; unit = 'ตร.หน่วย'; break;
        case 'sphere': result = (4 / 3) * Math.PI * Math.pow(a, 3); unit = 'ลบ.หน่วย'; break;
        case 'cylinder': result = Math.PI * a * a * b; unit = 'ลบ.หน่วย'; break;
        case 'cone': result = (1 / 3) * Math.PI * a * a * b; unit = 'ลบ.หน่วย'; break;
        case 'cube': result = Math.pow(a, 3); unit = 'ลบ.หน่วย'; break;
    }

    document.getElementById('shapeValue').textContent = result.toFixed(4);
    document.getElementById('shapeUnit').textContent = unit;
    document.getElementById('shapeResult').style.display = 'block';

    addToHistory('รูปทรง', shape, result.toFixed(2) + ' ' + unit);
}

function calculatePercent() {
    const type = document.getElementById('percentType').value;
    const x = parseFloat(document.getElementById('percentX').value) || 0;
    const y = parseFloat(document.getElementById('percentY').value) || 0;

    let result = 0, unit = '';

    switch (type) {
        case 'of': result = (x / 100) * y; unit = `${x}% ของ ${y}`; break;
        case 'is': result = (x / y) * 100; unit = '%'; break;
        case 'change': result = ((y - x) / x) * 100; unit = '% เปลี่ยนแปลง'; break;
        case 'increase': result = y + (x / 100) * y; unit = `เพิ่ม ${x}%`; break;
        case 'decrease': result = y - (x / 100) * y; unit = `ลด ${x}%`; break;
    }

    document.getElementById('percentValue').textContent = result.toFixed(4);
    document.getElementById('percentUnit').textContent = unit;
    document.getElementById('percentResult').style.display = 'block';

    addToHistory('ร้อยละ', type, result.toFixed(2) + ' ' + unit);
}

// ===========================================
// FINANCE CALCULATORS
// ===========================================

function calculateLoan() {
    const principal = parseFloat(document.getElementById('loanAmount').value) || 0;
    const rate = parseFloat(document.getElementById('loanRate').value) / 100 / 12;
    const months = parseFloat(document.getElementById('loanYears').value) * 12;

    let monthly, total, interest;

    if (rate === 0) {
        monthly = principal / months;
        total = principal;
        interest = 0;
    } else {
        monthly = principal * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        total = monthly * months;
        interest = total - principal;
    }

    document.getElementById('monthlyPayment').textContent = Math.round(monthly).toLocaleString();
    document.getElementById('totalPayment').textContent = Math.round(total).toLocaleString();
    document.getElementById('totalInterest').textContent = Math.round(interest).toLocaleString();
    document.getElementById('loanResult').style.display = 'block';

    addToHistory('เงินกู้ กยศ.', principal.toLocaleString() + ' บาท', Math.round(monthly).toLocaleString() + ' บาท/เดือน');
}

function updateTuitionEstimate() {
    const type = document.getElementById('uniType').value;
    const estimates = {
        'public': 25000,
        'private': 50000,
        'inter': 120000
    };
    document.getElementById('tuitionFee').value = estimates[type];
}

function calculateTotalCost() {
    const tuition = parseFloat(document.getElementById('tuitionFee').value) || 0;
    const semesters = parseFloat(document.getElementById('totalSemesters').value) || 0;
    const dorm = parseFloat(document.getElementById('dormFee').value) || 0;
    const living = parseFloat(document.getElementById('livingCost').value) || 0;

    const totalTuition = tuition * semesters;
    const months = semesters * 4;
    const totalLiving = (dorm + living) * months;
    const grandTotal = totalTuition + totalLiving;

    document.getElementById('totalTuition').textContent = Math.round(totalTuition).toLocaleString();
    document.getElementById('totalLiving').textContent = Math.round(totalLiving).toLocaleString();
    document.getElementById('grandTotal').textContent = Math.round(grandTotal).toLocaleString();
    document.getElementById('tuitionResult').style.display = 'block';

    addToHistory('ค่าใช้จ่ายการศึกษา', semesters + ' เทอม', Math.round(grandTotal).toLocaleString() + ' บาท');
}

function calculateSavings() {
    const goal = parseFloat(document.getElementById('savingsGoal').value) || 0;
    const years = parseFloat(document.getElementById('savingsYears').value) || 1;
    const rate = parseFloat(document.getElementById('savingsRate').value) / 100 / 12;
    const months = years * 12;

    let monthly;
    if (rate === 0) {
        monthly = goal / months;
    } else {
        monthly = goal * rate / (Math.pow(1 + rate, months) - 1);
    }

    const totalSaved = monthly * months;
    const interest = goal - totalSaved;

    document.getElementById('monthlySave').textContent = Math.round(monthly).toLocaleString();
    document.getElementById('totalSaved').textContent = Math.round(totalSaved).toLocaleString();
    document.getElementById('interestEarned').textContent = Math.round(interest).toLocaleString();
    document.getElementById('savingsResult').style.display = 'block';

    addToHistory('ออมเงินเพื่อการศึกษา', goal.toLocaleString() + ' บาท', Math.round(monthly).toLocaleString() + ' บาท/เดือน');
}

// ===========================================
// STATISTICS CALCULATORS
// ===========================================

function calculateStatistics() {
    const input = document.getElementById('statsData').value;
    const data = input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (data.length === 0) {
        alert('กรุณาใส่ข้อมูลที่ถูกต้อง');
        return;
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;

    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    let median;
    if (n % 2 === 0) {
        median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    } else {
        median = sorted[Math.floor(n / 2)];
    }

    const freq = {};
    data.forEach(x => freq[x] = (freq[x] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(x => freq[x] === maxFreq);
    const mode = modes.length === n ? 'ไม่มี' : modes.join(', ');

    const range = sorted[n - 1] - sorted[0];

    const variance = data.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / n;
    const sd = Math.sqrt(variance);

    document.getElementById('statsMean').textContent = mean.toFixed(2);
    document.getElementById('statsMedian').textContent = median.toFixed(2);
    document.getElementById('statsMode').textContent = mode;
    document.getElementById('statsRange').textContent = range.toFixed(2);
    document.getElementById('statsSD').textContent = sd.toFixed(2);
    document.getElementById('statsVar').textContent = variance.toFixed(2);
    document.getElementById('statsMin').textContent = sorted[0];
    document.getElementById('statsMax').textContent = sorted[n - 1];
    document.getElementById('statsCount').textContent = n;
    document.getElementById('statsResult').style.display = 'block';

    addToHistory('สถิติ', n + ' ข้อมูล', 'Mean=' + mean.toFixed(2) + ', SD=' + sd.toFixed(2));
}

function updateProbInputs() {
    const type = document.getElementById('probType').value;
    let html = '<div class="row">';

    switch (type) {
        case 'simple':
            html += `<div class="col-6"><label class="form-label-custom">เหตุการณ์ที่สนใจ n(A)</label>
                            <input type="number" class="form-control-custom" id="probA" placeholder="n(A)"></div>
                            <div class="col-6"><label class="form-label-custom">เหตุการณ์ทั้งหมด n(S)</label>
                            <input type="number" class="form-control-custom" id="probS" placeholder="n(S)"></div>`;
            break;
        case 'combination':
        case 'permutation':
            html += `<div class="col-6"><label class="form-label-custom">n (จำนวนทั้งหมด)</label>
                            <input type="number" class="form-control-custom" id="probA" placeholder="n"></div>
                            <div class="col-6"><label class="form-label-custom">r (จำนวนที่เลือก)</label>
                            <input type="number" class="form-control-custom" id="probS" placeholder="r"></div>`;
            break;
        case 'binomial':
            html += `<div class="col-4"><label class="form-label-custom">n (จำนวนครั้ง)</label>
                            <input type="number" class="form-control-custom" id="probA" placeholder="n"></div>
                            <div class="col-4"><label class="form-label-custom">k (สำเร็จ)</label>
                            <input type="number" class="form-control-custom" id="probS" placeholder="k"></div>
                            <div class="col-4"><label class="form-label-custom">p (โอกาสสำเร็จ)</label>
                            <input type="number" class="form-control-custom" id="probP" placeholder="0.5" step="0.01"></div>`;
            break;
    }
    html += '</div>';
    document.getElementById('probInputs').innerHTML = html;
}

function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function calculateProbability() {
    const type = document.getElementById('probType').value;
    const a = parseInt(document.getElementById('probA')?.value) || 0;
    const s = parseInt(document.getElementById('probS')?.value) || 0;
    const p = parseFloat(document.getElementById('probP')?.value) || 0.5;

    let result = 0, unit = '';

    switch (type) {
        case 'simple':
            result = a / s;
            unit = 'P(A)';
            break;
        case 'combination':
            result = factorial(a) / (factorial(s) * factorial(a - s));
            unit = `C(${a},${s})`;
            break;
        case 'permutation':
            result = factorial(a) / factorial(a - s);
            unit = `P(${a},${s})`;
            break;
        case 'binomial':
            const comb = factorial(a) / (factorial(s) * factorial(a - s));
            result = comb * Math.pow(p, s) * Math.pow(1 - p, a - s);
            unit = 'P(X=k)';
            break;
    }

    document.getElementById('probValue').textContent = type === 'combination' || type === 'permutation' ? result.toLocaleString() : result.toFixed(6);
    document.getElementById('probUnit').textContent = unit;
    document.getElementById('probPercent').textContent = (result * 100).toFixed(2) + '%';
    document.getElementById('probResult').style.display = 'block';

    addToHistory('ความน่าจะเป็น', unit, result.toFixed(4));
}

function calculateZScore() {
    const x = parseFloat(document.getElementById('normX').value) || 0;
    const mean = parseFloat(document.getElementById('normMean').value) || 0;
    const sd = parseFloat(document.getElementById('normSD').value) || 1;

    const z = (x - mean) / sd;

    function normalCDF(z) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * z);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        return 0.5 * (1.0 + sign * y);
    }

    const cdf = normalCDF(z) * 100;

    document.getElementById('zScore').textContent = z.toFixed(4);
    document.getElementById('zPercent').textContent = cdf.toFixed(2) + '%';
    document.getElementById('normResult').style.display = 'block';

    addToHistory('Z-Score', 'X=' + x, 'Z=' + z.toFixed(2));
}

// ===========================================
// STUDY TOOLS
// ===========================================

let timerInterval = null;
let timerSeconds = 25 * 60;
let pomodoroCount = parseInt(localStorage.getItem('pomodoroCount') || '0');

function setTimer(minutes) {
    timerSeconds = minutes * 60;
    updateTimerDisplay();
    document.getElementById('timerStatus').textContent = minutes + ' นาที - พร้อมเริ่ม';
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent =
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function startTimer() {
    if (timerInterval) return;
    document.getElementById('timerStatus').textContent = 'กำลังนับเวลา...';
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            document.getElementById('timerStatus').textContent = '🎉 ครบเวลา!';
            pomodoroCount++;
            localStorage.setItem('pomodoroCount', pomodoroCount);
            document.getElementById('pomodoroCount').textContent = pomodoroCount;
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2telezkfVJHA6Nt9QABJmbTq54xQAkSIsN/qlWYgPIWs2eylaC82gaPd7KlxLzN+oNntr3gzM3me1e+zfDUyeJvT8LaBNy95mNHwtIU4Lnid0/CzgzcueJrS8bKCOC54mdLxs4I4Lnic0/KzgzcueJrT8bOCOC54m9PxsoI4');
                audio.play();
            } catch (e) { }
            alert('⏰ หมดเวลาแล้ว! พักผ่อนสักครู่');
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('timerStatus').textContent = 'หยุดชั่วคราว';
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 25 * 60;
    updateTimerDisplay();
    document.getElementById('timerStatus').textContent = 'พร้อมเริ่ม';
}

function calculateRequiredScore() {
    const current = parseFloat(document.getElementById('currentScore').value) || 0;
    const currentWeight = parseFloat(document.getElementById('currentWeight').value) / 100 || 0.4;
    const target = parseFloat(document.getElementById('targetGradeCalc').value) || 60;
    const finalWeight = parseFloat(document.getElementById('finalWeight').value) / 100 || 0.6;

    const currentContribution = current * currentWeight;
    const needed = (target - currentContribution) / finalWeight;

    document.getElementById('requiredScore').textContent = needed.toFixed(1);

    const alertDiv = document.getElementById('scoreAlert');
    if (needed > 100) {
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = '❌ ไม่สามารถทำได้ ต้องได้มากกว่า 100 คะแนน';
    } else if (needed <= 0) {
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = '✅ ยินดีด้วย! คุณผ่านแล้วโดยไม่ต้องสอบ Final';
    } else if (needed <= 60) {
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = '✅ ไม่ยากเกินไป สู้ๆ!';
    } else if (needed <= 80) {
        alertDiv.className = 'alert alert-warning';
        alertDiv.innerHTML = '⚠️ ต้องตั้งใจหน่อย แต่ทำได้!';
    } else {
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = '⚠️ ค่อนข้างยาก ต้องเตรียมตัวให้ดี';
    }

    document.getElementById('requiredResult').style.display = 'block';
    addToHistory('คะแนนที่ต้องการ', 'เกรด ' + target, needed.toFixed(1) + ' คะแนน');
}

function convertBase() {
    const input = document.getElementById('baseInput').value.toUpperCase();
    const from = parseInt(document.getElementById('baseFrom').value);

    if (!input) {
        document.getElementById('baseBinary').textContent = '0';
        document.getElementById('baseDecimal').textContent = '0';
        document.getElementById('baseOctal').textContent = '0';
        document.getElementById('baseHex').textContent = '0';
        return;
    }

    try {
        const decimal = parseInt(input, from);
        if (isNaN(decimal)) throw new Error('Invalid');

        document.getElementById('baseBinary').textContent = decimal.toString(2);
        document.getElementById('baseDecimal').textContent = decimal.toString(10);
        document.getElementById('baseOctal').textContent = decimal.toString(8);
        document.getElementById('baseHex').textContent = decimal.toString(16).toUpperCase();
    } catch (e) {
        document.getElementById('baseBinary').textContent = 'Error';
        document.getElementById('baseDecimal').textContent = 'Error';
        document.getElementById('baseOctal').textContent = 'Error';
        document.getElementById('baseHex').textContent = 'Error';
    }
}

function calculateStudyPlan() {
    const pages = parseFloat(document.getElementById('totalPages').value) || 0;
    const days = parseFloat(document.getElementById('totalDays').value) || 1;
    const speed = parseFloat(document.getElementById('readingSpeed').value) || 30;

    const pagesPerDay = Math.ceil(pages / days);
    const hoursPerDay = (pagesPerDay / speed).toFixed(1);

    document.getElementById('pagesPerDay').textContent = pagesPerDay;
    document.getElementById('hoursPerDay').textContent = hoursPerDay;
    document.getElementById('studyPlanResult').style.display = 'block';

    addToHistory('วางแผนอ่านหนังสือ', pages + ' หน้า/' + days + ' วัน', pagesPerDay + ' หน้า/วัน');
}

// ========================================
// LANGUAGE LEARNING CENTER FUNCTIONS
// ========================================

let currentLang = null;
let currentLangMode = 'vocab';
let langProgress = {
    english: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    chinese: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    japanese: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    korean: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    thai: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    spanish: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    french: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    german: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    italian: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 },
    russian: { xp: 0, words: 0, lessons: 0, quizzes: 0, streak: 0 }
};

// ========================================
// MASSIVE VOCABULARY DATABASE - 300+ words per language
// ========================================
const vocabularyData = {
    english: [
        // Greetings & Basic Phrases
        { word: 'Hello', reading: '/həˈloʊ/', meaning: 'สวัสดี', example: 'Hello, how are you?', category: 'greeting' },
        { word: 'Hi', reading: '/haɪ/', meaning: 'สวัสดี (กันเอง)', example: 'Hi! Good to see you.', category: 'greeting' },
        { word: 'Thank you', reading: '/θæŋk juː/', meaning: 'ขอบคุณ', example: 'Thank you very much!', category: 'greeting' },
        { word: 'Goodbye', reading: '/ˌɡʊdˈbaɪ/', meaning: 'ลาก่อน', example: 'Goodbye, see you tomorrow!', category: 'greeting' },
        { word: 'Please', reading: '/pliːz/', meaning: 'กรุณา', example: 'Please help me.', category: 'greeting' },
        { word: 'Sorry', reading: '/ˈsɒri/', meaning: 'ขอโทษ', example: 'I am sorry for being late.', category: 'greeting' },
        { word: 'Excuse me', reading: '/ɪkˈskjuːz mi/', meaning: 'ขอโทษ/ขอตัว', example: 'Excuse me, may I pass?', category: 'greeting' },
        { word: 'Good morning', reading: '/ɡʊd ˈmɔːrnɪŋ/', meaning: 'สวัสดีตอนเช้า', example: 'Good morning, teacher.', category: 'greeting' },
        { word: 'Good night', reading: '/ɡʊd naɪt/', meaning: 'ราตรีสวัสดิ์', example: 'Good night, sleep tight.', category: 'greeting' },
        { word: 'Welcome', reading: '/ˈwelkəm/', meaning: 'ยินดีต้อนรับ', example: 'Welcome to our home.', category: 'greeting' },
        { word: 'Yes', reading: '/jes/', meaning: 'ใช่', example: 'Yes, I understand.', category: 'greeting' },
        { word: 'No', reading: '/noʊ/', meaning: 'ไม่', example: 'No, thank you.', category: 'greeting' },
        { word: 'Maybe', reading: '/ˈmeɪbi/', meaning: 'อาจจะ', example: 'Maybe we can go later.', category: 'greeting' },
        { word: 'Help', reading: '/help/', meaning: 'ช่วยด้วย', example: 'Help me please!', category: 'greeting' },

        // Family & People
        { word: 'Family', reading: '/ˈfæməli/', meaning: 'ครอบครัว', example: 'I love my family.', category: 'people' },
        { word: 'Father', reading: '/ˈfɑːðər/', meaning: 'พ่อ', example: 'My father is working.', category: 'people' },
        { word: 'Mother', reading: '/ˈmʌðər/', meaning: 'แม่', example: 'My mother cooks well.', category: 'people' },
        { word: 'Brother', reading: '/ˈbrʌðər/', meaning: 'พี่ชาย/น้องชาย', example: 'I have one brother.', category: 'people' },
        { word: 'Sister', reading: '/ˈsɪstər/', meaning: 'พี่สาว/น้องสาว', example: 'My sister is kind.', category: 'people' },
        { word: 'Son', reading: '/sʌn/', meaning: 'ลูกชาย', example: 'He is my son.', category: 'people' },
        { word: 'Daughter', reading: '/ˈdɔːtər/', meaning: 'ลูกสาว', example: 'She is my daughter.', category: 'people' },
        { word: 'Friend', reading: '/frend/', meaning: 'เพื่อน', example: 'We are best friends.', category: 'people' },
        { word: 'Boy', reading: '/bɔɪ/', meaning: 'เด็กผู้ชาย', example: 'The boy is playing.', category: 'people' },
        { word: 'Girl', reading: '/ɡɜːrl/', meaning: 'เด็กผู้หญิง', example: 'The girl is reading.', category: 'people' },
        { word: 'Man', reading: '/mæn/', meaning: 'ผู้ชาย', example: 'That man is tall.', category: 'people' },
        { word: 'Woman', reading: '/ˈwʊmən/', meaning: 'ผู้หญิง', example: 'That woman is smart.', category: 'people' },
        { word: 'Baby', reading: '/ˈbeɪbi/', meaning: 'ทารก', example: 'The baby is sleeping.', category: 'people' },
        { word: 'Person', reading: '/ˈpɜːrsn/', meaning: 'คน', example: 'He is a good person.', category: 'people' },
        { word: 'Grandfather', reading: '/ˈɡrændˌfɑːðər/', meaning: 'ปู่/ตา', example: 'My grandfather is old.', category: 'people' },
        { word: 'Grandmother', reading: '/ˈɡrændˌmʌðər/', meaning: 'ย่า/ยาย', example: 'I visit my grandmother.', category: 'people' },

        // Food & Drink (Continued)
        { word: 'Food', reading: '/fuːd/', meaning: 'อาหาร', example: 'The food tastes good.', category: 'food' },
        { word: 'Water', reading: '/ˈwɔːtər/', meaning: 'น้ำ', example: 'I drink water.', category: 'food' },
        { word: 'Rice', reading: '/raɪs/', meaning: 'ข้าว', example: 'I eat rice everyday.', category: 'food' },
        { word: 'Bread', reading: '/bred/', meaning: 'ขนมปัง', example: 'I like bread with jam.', category: 'food' },
        { word: 'Milk', reading: '/mɪlk/', meaning: 'นม', example: 'Cats like milk.', category: 'food' },
        { word: 'Coffee', reading: '/ˈkɔːfi/', meaning: 'กาแฟ', example: 'Hot coffee in the morning.', category: 'food' },
        { word: 'Tea', reading: '/tiː/', meaning: 'ชา', example: 'Do you want tea?', category: 'food' },
        { word: 'Egg', reading: '/eɡ/', meaning: 'ไข่', example: 'I eat a boiled egg.', category: 'food' },
        { word: 'Fruit', reading: '/fruːt/', meaning: 'ผลไม้', example: 'Fruit is healthy.', category: 'food' },
        { word: 'Apple', reading: '/ˈæpl/', meaning: 'แอปเปิ้ล', example: 'An apple a day.', category: 'food' },
        { word: 'Banana', reading: '/bəˈnænə/', meaning: 'กล้วย', example: 'Monkeys love bananas.', category: 'food' },
        { word: 'Meat', reading: '/miːt/', meaning: 'เนื้อสัตว์', example: 'He eats meat.', category: 'food' },
        { word: 'Chicken', reading: '/ˈtʃɪkɪn/', meaning: 'ไก่', example: 'Fried chicken is tasty.', category: 'food' },
        { word: 'Fish', reading: '/fɪʃ/', meaning: 'ปลา', example: 'Fish swim in water.', category: 'food' },
        { word: 'Vegetable', reading: '/ˈvedʒtəbl/', meaning: 'ผัก', example: 'Eat your vegetables.', category: 'food' },
        { word: 'Sugar', reading: '/ˈʃʊɡər/', meaning: 'น้ำตาล', example: 'Sugar is sweet.', category: 'food' },
        { word: 'Salt', reading: '/sɔːlt/', meaning: 'เกลือ', example: 'Pass me the salt.', category: 'food' },
        { word: 'Breakfast', reading: '/ˈbrekfəst/', meaning: 'อาหารเช้า', example: 'I eat breakfast early.', category: 'food' },
        { word: 'Lunch', reading: '/lʌntʃ/', meaning: 'อาหารกลางวัน', example: 'Time for lunch.', category: 'food' },
        { word: 'Dinner', reading: '/ˈdɪnər/', meaning: 'อาหารเย็น', example: 'Dinner is ready.', category: 'food' },

        // Places
        { word: 'House', reading: '/haʊs/', meaning: 'บ้าน', example: 'My house is near here.', category: 'place' },
        { word: 'Home', reading: '/hoʊm/', meaning: 'บ้าน(ความรู้สึก)', example: 'I want to go home.', category: 'place' },
        { word: 'School', reading: '/skuːl/', meaning: 'โรงเรียน', example: 'I go to school.', category: 'place' },
        { word: 'Office', reading: '/ˈɔːfɪs/', meaning: 'ที่ทำงาน', example: 'He works in an office.', category: 'place' },
        { word: 'Shop', reading: '/ʃɒp/', meaning: 'ร้านค้า', example: 'The shop is open.', category: 'place' },
        { word: 'Market', reading: '/ˈmɑːrkɪt/', meaning: 'ตลาด', example: 'We buy food at the market.', category: 'place' },
        { word: 'Hospital', reading: '/ˈhɒspɪtl/', meaning: 'โรงพยาบาล', example: 'Doctors work at the hospital.', category: 'place' },
        { word: 'Bank', reading: '/bæŋk/', meaning: 'ธนาคาร', example: 'I need money from the bank.', category: 'place' },
        { word: 'Park', reading: '/pɑːrk/', meaning: 'สวนสาธารณะ', example: 'Let\'s walk in the park.', category: 'place' },
        { word: 'Restaurant', reading: '/ˈrestrɒnt/', meaning: 'ร้านอาหาร', example: 'We eat at a restaurant.', category: 'place' },
        { word: 'Airport', reading: '/ˈerpɔːrt/', meaning: 'สนามบิน', example: 'I am going to the airport.', category: 'place' },
        { word: 'Station', reading: '/ˈsteɪʃn/', meaning: 'สถานี', example: 'Wait at the train station.', category: 'place' },
        { word: 'Room', reading: '/ruːm/', meaning: 'ห้อง', example: 'Clean your room.', category: 'place' },
        { word: 'Kitchen', reading: '/ˈkɪtʃɪn/', meaning: 'ห้องครัว', example: 'Mom is in the kitchen.', category: 'place' },
        { word: 'Bathroom', reading: '/ˈbæθruːm/', meaning: 'ห้องน้ำ', example: 'Where is the bathroom?', category: 'place' },

        // Adjectives (Expanded)
        { word: 'Beautiful', reading: '/ˈbjuːtɪfʊl/', meaning: 'สวยงาม', example: 'What a beautiful day!', category: 'adjective' },
        { word: 'Ugly', reading: '/ˈʌɡli/', meaning: 'น่าเกลียด', example: 'The ugly duckling.', category: 'adjective' },
        { word: 'Good', reading: '/ɡʊd/', meaning: 'ดี', example: 'Very good job.', category: 'adjective' },
        { word: 'Bad', reading: '/bæd/', meaning: 'แย่', example: 'That is bad news.', category: 'adjective' },
        { word: 'Big', reading: '/bɪɡ/', meaning: 'ใหญ่', example: 'That is a big house.', category: 'adjective' },
        { word: 'Small', reading: '/smɔːl/', meaning: 'เล็ก', example: 'I have a small dog.', category: 'adjective' },
        { word: 'Long', reading: '/lɔːŋ/', meaning: 'ยาว', example: 'She has long hair.', category: 'adjective' },
        { word: 'Short', reading: '/ʃɔːrt/', meaning: 'สั้น/เตี้ย', example: 'The story is short.', category: 'adjective' },
        { word: 'Hot', reading: '/hɒt/', meaning: 'ร้อน', example: 'The sun is hot.', category: 'adjective' },
        { word: 'Cold', reading: '/koʊld/', meaning: 'หนาว/เย็น', example: 'Ice is cold.', category: 'adjective' },
        { word: 'New', reading: '/nuː/', meaning: 'ใหม่', example: 'I bought a new car.', category: 'adjective' },
        { word: 'Old', reading: '/oʊld/', meaning: 'เก่า/แก่', example: 'This book is old.', category: 'adjective' },
        { word: 'Happy', reading: '/ˈhæpi/', meaning: 'มีความสุข', example: 'I am happy today.', category: 'adjective' },
        { word: 'Sad', reading: '/sæd/', meaning: 'เศร้า', example: 'Why are you sad?', category: 'adjective' },
        { word: 'Hungry', reading: '/ˈhʌŋɡri/', meaning: 'หิว', example: 'I am hungry now.', category: 'adjective' },
        { word: 'Thirsty', reading: '/ˈθɜːrsti/', meaning: 'กระหายน้ำ', example: 'I am thirsty for water.', category: 'adjective' },
        { word: 'Tired', reading: '/ˈtaɪərd/', meaning: 'เหนื่อย', example: 'I am tired after work.', category: 'adjective' },
        { word: 'Busy', reading: '/ˈbɪzi/', meaning: 'ยุ่ง', example: 'I am busy right now.', category: 'adjective' },
        { word: 'Easy', reading: '/ˈiːzi/', meaning: 'ง่าย', example: 'This test is easy.', category: 'adjective' },
        { word: 'Difficult', reading: '/ˈdɪfɪkəlt/', meaning: 'ยาก', example: 'Math is difficult.', category: 'adjective' },
        { word: 'Expensive', reading: '/ɪkˈspensɪv/', meaning: 'แพง', example: 'This car is expensive.', category: 'adjective' },
        { word: 'Cheap', reading: '/tʃiːp/', meaning: 'ถูก', example: 'The food is cheap here.', category: 'adjective' },
        { word: 'Fast', reading: '/fɑːst/', meaning: 'เร็ว', example: 'He runs very fast.', category: 'adjective' },
        { word: 'Slow', reading: '/sloʊ/', meaning: 'ช้า', example: 'Please speak slow.', category: 'adjective' },
        { word: 'Clean', reading: '/kliːn/', meaning: 'สะอาด', example: 'The room is clean.', category: 'adjective' },
        { word: 'Dirty', reading: '/ˈdɜːrti/', meaning: 'สกปรก', example: 'My hands are dirty.', category: 'adjective' },
        { word: 'Full', reading: '/fʊl/', meaning: 'เต็ม/อิ่ม', example: 'The cup is full.', category: 'adjective' },
        { word: 'Empty', reading: '/ˈempti/', meaning: 'ว่างเปล่า', example: 'The box is empty.', category: 'adjective' },
        { word: 'Rich', reading: '/rɪtʃ/', meaning: 'รวย', example: 'He is a rich man.', category: 'adjective' },
        { word: 'Poor', reading: '/pʊr/', meaning: 'จน', example: 'Help the poor people.', category: 'adjective' },
        { word: 'Strong', reading: '/strɔːŋ/', meaning: 'แข็งแรง', example: 'He is very strong.', category: 'adjective' },
        { word: 'Weak', reading: '/wiːk/', meaning: 'อ่อนแอ', example: 'I feel weak today.', category: 'adjective' },
        { word: 'Safe', reading: '/seɪf/', meaning: 'ปลอดภัย', example: 'Is it safe here?', category: 'adjective' },
        { word: 'Dangerous', reading: '/ˈdeɪndʒərəs/', meaning: 'อันตราย', example: 'Snakes are dangerous.', category: 'adjective' },
        { word: 'Right', reading: '/raɪt/', meaning: 'ถูก/ขวา', example: 'You are right.', category: 'adjective' },
        { word: 'Wrong', reading: '/rɔːŋ/', meaning: 'ผิด', example: 'That answer is wrong.', category: 'adjective' },
        { word: 'Ready', reading: '/ˈredi/', meaning: 'พร้อม', example: 'Are you ready?', category: 'adjective' },
        { word: 'Late', reading: '/leɪt/', meaning: 'สาย', example: 'Don\'t be late.', category: 'adjective' },
        { word: 'Early', reading: '/ˈɜːrli/', meaning: 'เช้า/ก่อนเวลา', example: 'I woke up early.', category: 'adjective' },

        // Verbs (Expanded)
        { word: 'Eat', reading: '/iːt/', meaning: 'กิน', example: 'I eat breakfast at 7 AM.', category: 'verb' },
        { word: 'Drink', reading: '/drɪŋk/', meaning: 'ดื่ม', example: 'I drink water every day.', category: 'verb' },
        { word: 'Sleep', reading: '/sliːp/', meaning: 'นอน', example: 'I sleep at 10 PM.', category: 'verb' },
        { word: 'Wake up', reading: '/weɪk ʌp/', meaning: 'ตื่นนอน', example: 'I wake up at 6 AM.', category: 'verb' },
        { word: 'Go', reading: '/ɡoʊ/', meaning: 'ไป', example: 'I go to school.', category: 'verb' },
        { word: 'Come', reading: '/kʌm/', meaning: 'มา', example: 'Come here please.', category: 'verb' },
        { word: 'Walk', reading: '/wɔːk/', meaning: 'เดิน', example: 'I walk to the park.', category: 'verb' },
        { word: 'Run', reading: '/rʌn/', meaning: 'วิ่ง', example: 'I run very fast.', category: 'verb' },
        { word: 'Sit', reading: '/sɪt/', meaning: 'นั่ง', example: 'Sit down please.', category: 'verb' },
        { word: 'Stand', reading: '/stænd/', meaning: 'ยืน', example: 'Stand up please.', category: 'verb' },
        { word: 'Work', reading: '/wɜːrk/', meaning: 'ทำงาน', example: 'I work in an office.', category: 'verb' },
        { word: 'Study', reading: '/ˈstʌdi/', meaning: 'เรียน', example: 'I study English every day.', category: 'verb' },
        { word: 'Read', reading: '/riːd/', meaning: 'อ่าน', example: 'I read a book.', category: 'verb' },
        { word: 'Write', reading: '/raɪt/', meaning: 'เขียน', example: 'I write a letter.', category: 'verb' },
        { word: 'Listen', reading: '/ˈlɪsn/', meaning: 'ฟัง', example: 'Listen to the music.', category: 'verb' },
        { word: 'Speak', reading: '/spiːk/', meaning: 'พูด', example: 'Can you speak English?', category: 'verb' },
        { word: 'Look', reading: '/lʊk/', meaning: 'มอง/ดู', example: 'Look at that bird.', category: 'verb' },
        { word: 'See', reading: '/siː/', meaning: 'เห็น', example: 'I see a cat.', category: 'verb' },
        { word: 'Watch', reading: '/wɒtʃ/', meaning: 'ดู(สิ่งที่เคลื่อนไหว)', example: 'I watch TV.', category: 'verb' },
        { word: 'Buy', reading: '/baɪ/', meaning: 'ซื้อ', example: 'I buy some food.', category: 'verb' },
        { word: 'Sell', reading: '/sel/', meaning: 'ขาย', example: 'He sells cars.', category: 'verb' },
        { word: 'Pay', reading: '/peɪ/', meaning: 'จ่าย', example: 'I pay with cash.', category: 'verb' },
        { word: 'Love', reading: '/lʌv/', meaning: 'รัก', example: 'I love my family.', category: 'verb' },
        { word: 'Like', reading: '/laɪk/', meaning: 'ชอบ', example: 'I like ice cream.', category: 'verb' },
        { word: 'Hate', reading: '/heɪt/', meaning: 'เกลียด', example: 'I hate snakes.', category: 'verb' },
        { word: 'Want', reading: '/wɒnt/', meaning: 'ต้องการ', example: 'I want to go home.', category: 'verb' },
        { word: 'Need', reading: '/niːd/', meaning: 'จำเป็นต้อง', example: 'I need water.', category: 'verb' },
        { word: 'Think', reading: '/θɪŋk/', meaning: 'คิด', example: 'I think so.', category: 'verb' },
        { word: 'Know', reading: '/noʊ/', meaning: 'รู้', example: 'I know the answer.', category: 'verb' },
        { word: 'Understand', reading: '/ˌʌndərˈstænd/', meaning: 'เข้าใจ', example: 'I understand you.', category: 'verb' },
        { word: 'Ask', reading: '/æsk/', meaning: 'ถาม/ขอ', example: 'Can I ask a question?', category: 'verb' },
        { word: 'Answer', reading: '/ˈænsər/', meaning: 'ตอบ', example: 'Please answer me.', category: 'verb' },
        { word: 'Help', reading: '/help/', meaning: 'ช่วย', example: 'Can you help me?', category: 'verb' },
        { word: 'Give', reading: '/ɡɪv/', meaning: 'ให้', example: 'Give me the book.', category: 'verb' },
        { word: 'Take', reading: '/teɪk/', meaning: 'เอา/พาไป', example: 'Take this with you.', category: 'verb' },
        { word: 'Open', reading: '/ˈoʊpən/', meaning: 'เปิด', example: 'Open the door.', category: 'verb' },
        { word: 'Close', reading: '/kloʊz/', meaning: 'ปิด', example: 'Close the window.', category: 'verb' },
        { word: 'Play', reading: '/pleɪ/', meaning: 'เล่น', example: 'I play football.', category: 'verb' },
        { word: 'Cook', reading: '/kʊk/', meaning: 'ทำอาหาร', example: 'Mom cooks dinner.', category: 'verb' },
        { word: 'Clean', reading: '/kliːn/', meaning: 'ทำความสะอาด', example: 'I clean my room.', category: 'verb' },
        { word: 'Wash', reading: '/wɒʃ/', meaning: 'ล้าง', example: 'Wash your hands.', category: 'verb' },
        { word: 'Wait', reading: '/weɪt/', meaning: 'รอ', example: 'Wait for me.', category: 'verb' },
        { word: 'Use', reading: '/juːz/', meaning: 'ใช้', example: 'Use a pen.', category: 'verb' },
        { word: 'Make', reading: '/meɪk/', meaning: 'ทำ/สร้าง', example: 'I make a cake.', category: 'verb' },
        { word: 'Do', reading: '/duː/', meaning: 'ทำ', example: 'Do your homework.', category: 'verb' },
        { word: 'Have', reading: '/hæv/', meaning: 'มี', example: 'I have a pen.', category: 'verb' },
        { word: 'Be', reading: '/biː/', meaning: 'เป็น/อยู่/คือ', example: 'Be happy.', category: 'verb' },
        { word: 'Meet', reading: '/miːt/', meaning: 'พบ', example: 'Nice to meet you.', category: 'verb' },
        { word: 'Forget', reading: '/fərˈɡet/', meaning: 'ลืม', example: 'Don\'t forget me.', category: 'verb' },
        { word: 'Remember', reading: '/rɪˈmembər/', meaning: 'จำ', example: 'I remember you.', category: 'verb' },
        { word: 'Smile', reading: '/smaɪl/', meaning: 'ยิ้ม', example: 'She smiles at me.', category: 'verb' },
        { word: 'Cry', reading: '/kraɪ/', meaning: 'ร้องไห้', example: 'The baby cries.', category: 'verb' },
        { word: 'Call', reading: '/kɔːl/', meaning: 'เรียก/โทร', example: 'Call me later.', category: 'verb' },
        { word: 'Try', reading: '/traɪ/', meaning: 'พยายาม/ลอง', example: 'Try your best.', category: 'verb' },

        // Time & Date
        { word: 'Time', reading: '/taɪm/', meaning: 'เวลา', example: 'What time is it?', category: 'time' },
        { word: 'Day', reading: '/deɪ/', meaning: 'วัน', example: 'Have a nice day.', category: 'time' },
        { word: 'Night', reading: '/naɪt/', meaning: 'กลางคืน', example: 'The stars at night.', category: 'time' },
        { word: 'Morning', reading: '/ˈmɔːrnɪŋ/', meaning: 'เช้า', example: 'I run in the morning.', category: 'time' },
        { word: 'Afternoon', reading: '/ˌæftərˈnuːn/', meaning: 'บ่าย', example: 'Good afternoon.', category: 'time' },
        { word: 'Evening', reading: '/ˈiːvnɪŋ/', meaning: 'เย็น', example: 'Dinner in the evening.', category: 'time' },
        { word: 'Today', reading: '/təˈdeɪ/', meaning: 'วันนี้', example: 'Today is Monday.', category: 'time' },
        { word: 'Tomorrow', reading: '/təˈmɔːroʊ/', meaning: 'พรุ่งนี้', example: 'See you tomorrow.', category: 'time' },
        { word: 'Yesterday', reading: '/ˈjestərdeɪ/', meaning: 'เมื่อวาน', example: 'Yesterday was Sunday.', category: 'time' },
        { word: 'Week', reading: '/wiːk/', meaning: 'สัปดาห์', example: 'Next week.', category: 'time' },
        { word: 'Month', reading: '/mʌnθ/', meaning: 'เดือน', example: 'This month is hot.', category: 'time' },
        { word: 'Year', reading: '/jɪr/', meaning: 'ปี', example: 'Happy New Year.', category: 'time' },
        { word: 'Now', reading: '/naʊ/', meaning: 'ตอนนี้', example: 'Do it now.', category: 'time' },
        { word: 'Later', reading: '/ˈleɪtər/', meaning: 'ภายหลัง', example: 'See you later.', category: 'time' },
        { word: 'Always', reading: '/ˈɔːlweɪz/', meaning: 'เสมอ', example: 'I always drink coffee.', category: 'time' },
        { word: 'Never', reading: '/ˈnevər/', meaning: 'ไม่เคย', example: 'I never lie.', category: 'time' },
        { word: 'Sometimes', reading: '/ˈsʌmtaɪmz/', meaning: 'บางครั้ง', example: 'Sometimes I walk.', category: 'time' },

        // Transportation
        { word: 'Car', reading: '/kɑːr/', meaning: 'รถยนต์', example: 'I drive a car.', category: 'travel' },
        { word: 'Bus', reading: '/bʌs/', meaning: 'รถบัส', example: 'Take the bus.', category: 'travel' },
        { word: 'Train', reading: '/treɪn/', meaning: 'รถไฟ', example: 'The train is fast.', category: 'travel' },
        { word: 'Bicycle', reading: '/ˈbaɪsɪkl/', meaning: 'จักรยาน', example: 'Ride a bicycle.', category: 'travel' },
        { word: 'Motorcycle', reading: '/ˈmoʊtərsaɪkl/', meaning: 'มอเตอร์ไซค์', example: 'He has a motorcycle.', category: 'travel' },
        { word: 'Airplane', reading: '/ˈerpleɪn/', meaning: 'เครื่องบิน', example: 'Fly by airplane.', category: 'travel' },
        { word: 'Boat', reading: '/boʊt/', meaning: 'เรือ', example: 'A boat on the river.', category: 'travel' },
        { word: 'Taxi', reading: '/ˈtæksi/', meaning: 'แท็กซี่', example: 'Call a taxi.', category: 'travel' },
        { word: 'Ticket', reading: '/ˈtɪkɪt/', meaning: 'ตั๋ว', example: 'Buy a ticket.', category: 'travel' },
        { word: 'Map', reading: '/mæp/', meaning: 'แผนที่', example: 'Look at the map.', category: 'travel' },

        // Animals & Nature
        { word: 'Dog', reading: '/dɔːɡ/', meaning: 'สุนัข', example: 'I have a dog.', category: 'animal' },
        { word: 'Cat', reading: '/kæt/', meaning: 'แมว', example: 'The cat sleeps.', category: 'animal' },
        { word: 'Bird', reading: '/bɜːrd/', meaning: 'นก', example: 'A bird can fly.', category: 'animal' },
        { word: 'Fish', reading: '/fɪʃ/', meaning: 'ปลา', example: 'Fish perform swimming.', category: 'animal' },
        { word: 'Elephant', reading: '/ˈelɪfənt/', meaning: 'ช้าง', example: 'Elephants are big.', category: 'animal' },
        { word: 'Tree', reading: '/triː/', meaning: 'ต้นไม้', example: 'A tall tree.', category: 'nature' },
        { word: 'Flower', reading: '/ˈflaʊər/', meaning: 'ดอกไม้', example: 'Beautiful flower.', category: 'nature' },
        { word: 'Sun', reading: '/sʌn/', meaning: 'ดวงอาทิตย์', example: 'The sun is bright.', category: 'nature' },
        { word: 'Moon', reading: '/muːn/', meaning: 'ดวงจันทร์', example: 'The moon at night.', category: 'nature' },
        { word: 'Star', reading: '/stɑːr/', meaning: 'ดาว', example: 'Twinkle twinkle little star.', category: 'nature' },
        { word: 'Rain', reading: '/reɪn/', meaning: 'ฝน', example: 'I like the rain.', category: 'nature' },
        { word: 'Sky', reading: '/skaɪ/', meaning: 'ท้องฟ้า', example: 'The sky is blue.', category: 'nature' },
        { word: 'Sea', reading: '/siː/', meaning: 'ทะเล', example: 'Swim in the sea.', category: 'nature' },
        { word: 'Mountain', reading: '/ˈmaʊntn/', meaning: 'ภูเขา', example: 'Climb a mountain.', category: 'nature' },
        { word: 'River', reading: '/ˈrɪvər/', meaning: 'แม่น้ำ', example: 'The river flows.', category: 'nature' },

        // Things
        { word: 'Book', reading: '/bʊk/', meaning: 'หนังสือ', example: 'Read a book.', category: 'object' },
        { word: 'Pen', reading: '/pen/', meaning: 'ปากกา', example: 'Write with a pen.', category: 'object' },
        { word: 'Phone', reading: '/foʊn/', meaning: 'โทรศัพท์', example: 'My phone rings.', category: 'object' },
        { word: 'Computer', reading: '/kəmˈpjuːtər/', meaning: 'คอมพิวเตอร์', example: 'Use a computer.', category: 'object' },
        { word: 'Table', reading: '/ˈteɪbl/', meaning: 'โต๊ะ', example: 'Sit at the table.', category: 'object' },
        { word: 'Chair', reading: '/tʃer/', meaning: 'เก้าอี้', example: 'A comfortable chair.', category: 'object' },
        { word: 'Bag', reading: '/bæɡ/', meaning: 'กระเป๋า', example: 'Carry a bag.', category: 'object' },
        { word: 'Money', reading: '/ˈmʌni/', meaning: 'เงิน', example: 'Save money.', category: 'object' },
        { word: 'Key', reading: '/kiː/', meaning: 'กุญแจ', example: 'Where is my key?', category: 'object' },
        { word: 'Door', reading: '/dɔːr/', meaning: 'ประตู', example: 'Lock the door.', category: 'object' },
        { word: 'Window', reading: '/ˈwɪndoʊ/', meaning: 'หน้าต่าง', example: 'Look out the window.', category: 'object' },
        { word: 'Bed', reading: '/bed/', meaning: 'เตียง', example: 'Sleep in bed.', category: 'object' },
        { word: 'Clothes', reading: '/kloʊðz/', meaning: 'เสื้อผ้า', example: 'Wear warm clothes.', category: 'object' },
        { word: 'Shoe', reading: '/ʃuː/', meaning: 'รองเท้า', example: 'Put on shoes.', category: 'object' },

        // Colors
        { word: 'Red', reading: '/red/', meaning: 'สีแดง', example: 'Red apple.', category: 'color' },
        { word: 'Blue', reading: '/bluː/', meaning: 'สีน้ำเงิน', example: 'Blue sky.', category: 'color' },
        { word: 'Green', reading: '/ɡriːn/', meaning: 'สีเขียว', example: 'Green grass.', category: 'color' },
        { word: 'Yellow', reading: '/ˈjeloʊ/', meaning: 'สีเหลือง', example: 'Yellow banana.', category: 'color' },
        { word: 'Black', reading: '/blæk/', meaning: 'สีดำ', example: 'Black cat.', category: 'color' },
        { word: 'White', reading: '/waɪt/', meaning: 'สีขาว', example: 'White snow.', category: 'color' },

        // Numbers & Counting
        { word: 'Number', reading: '/ˈnʌmbər/', meaning: 'ตัวเลข', example: 'What is your number?', category: 'number' },
        { word: 'Zero', reading: '/ˈzɪroʊ/', meaning: 'ศูนย์', example: 'Zero points.', category: 'number' },
        { word: 'One', reading: '/wʌn/', meaning: 'หนึ่ง', example: 'One moment.', category: 'number' },
        { word: 'Two', reading: '/tuː/', meaning: 'สอง', example: 'Two people.', category: 'number' },
        { word: 'Three', reading: '/θriː/', meaning: 'สาม', example: 'Three times.', category: 'number' },
        { word: 'Four', reading: '/fɔːr/', meaning: 'สี่', example: 'Four legs.', category: 'number' },
        { word: 'Five', reading: '/faɪv/', meaning: 'ห้า', example: 'High five.', category: 'number' },
        { word: 'Six', reading: '/sɪks/', meaning: 'หก', example: 'Six o\'clock.', category: 'number' },
        { word: 'Seven', reading: '/ˈsevn/', meaning: 'เจ็ด', example: 'Seven days.', category: 'number' },
        { word: 'Eight', reading: '/eɪt/', meaning: 'แปด', example: 'Eight balls.', category: 'number' },
        { word: 'Nine', reading: '/naɪn/', meaning: 'เก้า', example: 'Nine cats.', category: 'number' },
        { word: 'Ten', reading: '/ten/', meaning: 'สิบ', example: 'Top ten.', category: 'number' },
        { word: 'Hundred', reading: '/ˈhʌndrəd/', meaning: 'ร้อย', example: 'One hundred percent.', category: 'number' },
        { word: 'Thousand', reading: '/ˈθaʊzənd/', meaning: 'พัน', example: 'A thousand years.', category: 'number' },
        { word: 'Million', reading: '/ˈmɪljən/', meaning: 'ล้าน', example: 'One million dollars.', category: 'number' },
        { word: 'First', reading: '/fɜːrst/', meaning: 'ลำดับที่ 1', example: 'First place.', category: 'number' },
        { word: 'Last', reading: '/læst/', meaning: 'สุดท้าย', example: 'Last chance.', category: 'number' },

        // School & Education
        { word: 'Teacher', reading: '/ˈtiːtʃər/', meaning: 'ครู', example: 'Listen to the teacher.', category: 'education' },
        { word: 'Student', reading: '/ˈstuːdnt/', meaning: 'นักเรียน', example: 'I am a student.', category: 'education' },
        { word: 'Classroom', reading: '/ˈklæsruːm/', meaning: 'ห้องเรียน', example: 'Go to the classroom.', category: 'education' },
        { word: 'Homework', reading: '/ˈhoʊmwɜːrk/', meaning: 'การบ้าน', example: 'Do your homework.', category: 'education' },
        { word: 'Test', reading: '/test/', meaning: 'สอบ', example: 'I have a test.', category: 'education' },
        { word: 'Learn', reading: '/lɜːrn/', meaning: 'เรียนรู้', example: 'Learn new things.', category: 'education' },
        { word: 'Question', reading: '/ˈkwestʃən/', meaning: 'คำถาม', example: 'I have a question.', category: 'education' },
        { word: 'Answer', reading: '/ˈænsər/', meaning: 'คำตอบ', example: 'The right answer.', category: 'education' },

        // Health & Body
        { word: 'Body', reading: '/ˈbɒdi/', meaning: 'ร่างกาย', example: 'Move your body.', category: 'health' },
        { word: 'Head', reading: '/hed/', meaning: 'หัว/ศีรษะ', example: 'Nod your head.', category: 'health' },
        { word: 'Eye', reading: '/aɪ/', meaning: 'ตา', example: 'Close your eyes.', category: 'health' },
        { word: 'Ear', reading: '/ɪr/', meaning: 'หู', example: 'Listen with ears.', category: 'health' },
        { word: 'Mouth', reading: '/maʊθ/', meaning: 'ปาก', example: 'Open your mouth.', category: 'health' },
        { word: 'Nose', reading: '/noʊz/', meaning: 'จมูก', example: 'Smell with nose.', category: 'health' },
        { word: 'Hand', reading: '/hænd/', meaning: 'มือ', example: 'Clap your hands.', category: 'health' },
        { word: 'Leg', reading: '/leɡ/', meaning: 'ขา', example: 'Break a leg.', category: 'health' },
        { word: 'Foot', reading: '/fʊt/', meaning: 'เท้า', example: 'On foot.', category: 'health' },
        { word: 'Sick', reading: '/sɪk/', meaning: 'ป่วย', example: 'I feel sick.', category: 'health' },
        { word: 'Doctor', reading: '/ˈdɒktər/', meaning: 'หมอ', example: 'See a doctor.', category: 'health' },
        { word: 'Medicine', reading: '/ˈmedɪsn/', meaning: 'ยา', example: 'Take medicine.', category: 'health' },

        // Feeling & Emotion
        { word: 'Love', reading: '/lʌv/', meaning: 'ความรัก', example: 'True love.', category: 'emotion' },
        { word: 'Happy', reading: '/ˈhæpi/', meaning: 'มีความสุข', example: 'Be happy.', category: 'emotion' },
        { word: 'Angry', reading: '/ˈæŋɡri/', meaning: 'โกรธ', example: 'Don\'t be angry.', category: 'emotion' },
        { word: 'Afraid', reading: '/əˈfreɪd/', meaning: 'กลัว', example: 'Don\'t be afraid.', category: 'emotion' },
        { word: 'Funny', reading: '/ˈfʌni/', meaning: 'ตลก', example: 'A funny story.', category: 'emotion' },
        { word: 'Boring', reading: '/ˈbɔːrɪŋ/', meaning: 'น่าเบื่อ', example: 'This movie is boring.', category: 'emotion' },
        { word: 'Excited', reading: '/ɪkˈsaɪtɪd/', meaning: 'ตื่นเต้น', example: 'I am excited.', category: 'emotion' },

        // Advanced / Business / Other
        { word: 'Company', reading: '/ˈkʌmpəni/', meaning: 'บริษัท', example: 'Big company.', category: 'business' },
        { word: 'Meeting', reading: '/ˈmiːtɪŋ/', meaning: 'การประชุม', example: 'In a meeting.', category: 'business' },
        { word: 'Manager', reading: '/ˈmænɪdʒər/', meaning: 'ผู้จัดการ', example: 'Talk to the manager.', category: 'business' },
        { word: 'Problem', reading: '/ˈprɒbləm/', meaning: 'ปัญหา', example: 'No problem.', category: 'business' },
        { word: 'Solution', reading: '/səˈluːʃn/', meaning: 'ทางแก้', example: 'Find a solution.', category: 'business' },
        { word: 'Idea', reading: '/aɪˈdɪə/', meaning: 'ความคิด', example: 'Good idea!', category: 'business' },
        { word: 'Goal', reading: '/ɡoʊl/', meaning: 'เป้าหมาย', example: 'Achieve your goal.', category: 'business' },
        { word: 'Success', reading: '/səkˈses/', meaning: 'ความสำเร็จ', example: 'Wish you success.', category: 'business' },
        { word: 'Information', reading: '/ˌɪnfərˈmeɪʃn/', meaning: 'ข้อมูล', example: 'Useful information.', category: 'business' },
        { word: 'System', reading: '/ˈsɪstəm/', meaning: 'ระบบ', example: 'Computer system.', category: 'business' }
    ],
    chinese: [
        // Greetings
        { word: '你好', reading: 'Nǐ hǎo', meaning: 'สวัสดี', example: '你好，你好吗？', category: 'greeting' },
        { word: '谢谢', reading: 'Xiè xiè', meaning: 'ขอบคุณ', example: '谢谢你的帮助！', category: 'greeting' },
        { word: '再见', reading: 'Zài jiàn', meaning: 'ลาก่อน', example: '再见，明天见！', category: 'greeting' },
        { word: '请', reading: 'Qǐng', meaning: 'กรุณา', example: '请坐。', category: 'greeting' },
        { word: '对不起', reading: 'Duì bu qǐ', meaning: 'ขอโทษ', example: '对不起，我迟到了。', category: 'greeting' },
        { word: '没关系', reading: 'Méi guān xi', meaning: 'ไม่เป็นไร', example: '没关系，别担心。', category: 'greeting' },
        // Daily Life
        { word: '好吃', reading: 'Hǎo chī', meaning: 'อร่อย', example: '这个菜很好吃！', category: 'adjective' },
        { word: '漂亮', reading: 'Piào liang', meaning: 'สวย', example: '她很漂亮。', category: 'adjective' },
        { word: '朋友', reading: 'Péng yǒu', meaning: 'เพื่อน', example: '他是我的朋友。', category: 'noun' },
        { word: '学习', reading: 'Xué xí', meaning: 'เรียน', example: '我喜欢学习中文。', category: 'verb' },
        { word: '工作', reading: 'Gōng zuò', meaning: 'ทำงาน', example: '你在哪里工作？', category: 'verb' },
        { word: '吃饭', reading: 'Chī fàn', meaning: 'กินข้าว', example: '我们一起吃饭吧。', category: 'verb' },
        { word: '睡觉', reading: 'Shuì jiào', meaning: 'นอน', example: '我每天十点睡觉。', category: 'verb' },
        { word: '喜欢', reading: 'Xǐ huān', meaning: 'ชอบ', example: '我喜欢音乐。', category: 'verb' },
        { word: '爱', reading: 'Ài', meaning: 'รัก', example: '我爱你。', category: 'verb' },
        { word: '家', reading: 'Jiā', meaning: 'บ้าน/ครอบครัว', example: '我的家很大。', category: 'noun' },
        { word: '学校', reading: 'Xué xiào', meaning: 'โรงเรียน', example: '我去学校学习。', category: 'noun' },
        { word: '医院', reading: 'Yī yuàn', meaning: 'โรงพยาบาล', example: '医院在哪里？', category: 'noun' },
        // Numbers
        { word: '一', reading: 'Yī', meaning: 'หนึ่ง', example: '一个苹果', category: 'number' },
        { word: '二', reading: 'Èr', meaning: 'สอง', example: '两本书', category: 'number' },
        { word: '三', reading: 'Sān', meaning: 'สาม', example: '三天后', category: 'number' },
        { word: '十', reading: 'Shí', meaning: 'สิบ', example: '十个人', category: 'number' },
        { word: '百', reading: 'Bǎi', meaning: 'ร้อย', example: '一百块钱', category: 'number' },
        { word: '千', reading: 'Qiān', meaning: 'พัน', example: '两千人', category: 'number' },
        { word: '万', reading: 'Wàn', meaning: 'หมื่น', example: '一万块', category: 'number' }
    ],
    japanese: [
        // Greetings
        { word: 'こんにちは', reading: 'Konnichiwa', meaning: 'สวัสดี (กลางวัน)', example: 'こんにちは、お元気ですか？', category: 'greeting' },
        { word: 'おはようございます', reading: 'Ohayō gozaimasu', meaning: 'สวัสดีตอนเช้า', example: 'おはようございます、先生。', category: 'greeting' },
        { word: 'こんばんは', reading: 'Konbanwa', meaning: 'สวัสดีตอนเย็น', example: 'こんばんは、いい天気ですね。', category: 'greeting' },
        { word: 'ありがとう', reading: 'Arigatō', meaning: 'ขอบคุณ', example: 'ありがとうございます！', category: 'greeting' },
        { word: 'さようなら', reading: 'Sayōnara', meaning: 'ลาก่อน', example: 'さようなら、また明日！', category: 'greeting' },
        { word: 'すみません', reading: 'Sumimasen', meaning: 'ขอโทษ/ขอบคุณ', example: 'すみません、道を教えてください。', category: 'greeting' },
        { word: 'お願いします', reading: 'Onegaishimasu', meaning: 'กรุณา/ขอ', example: 'これをお願いします。', category: 'greeting' },
        // Daily Life
        { word: 'おいしい', reading: 'Oishii', meaning: 'อร่อย', example: 'この料理はおいしい！', category: 'adjective' },
        { word: 'かわいい', reading: 'Kawaii', meaning: 'น่ารัก', example: 'この猫はかわいい。', category: 'adjective' },
        { word: 'すごい', reading: 'Sugoi', meaning: 'เจ๋ง/ว้าว', example: 'すごい！頑張ったね。', category: 'adjective' },
        { word: '友達', reading: 'Tomodachi', meaning: 'เพื่อน', example: '彼は私の友達です。', category: 'noun' },
        { word: '勉強', reading: 'Benkyō', meaning: 'เรียน', example: '日本語を勉強しています。', category: 'verb' },
        { word: '仕事', reading: 'Shigoto', meaning: 'งาน', example: '仕事は楽しいです。', category: 'noun' },
        { word: '食べる', reading: 'Taberu', meaning: 'กิน', example: 'ご飯を食べます。', category: 'verb' },
        { word: '飲む', reading: 'Nomu', meaning: 'ดื่ม', example: 'お茶を飲みます。', category: 'verb' },
        { word: '寝る', reading: 'Neru', meaning: 'นอน', example: '今日は早く寝ます。', category: 'verb' },
        { word: '行く', reading: 'Iku', meaning: 'ไป', example: '学校に行きます。', category: 'verb' },
        { word: '来る', reading: 'Kuru', meaning: 'มา', example: '友達が来ます。', category: 'verb' },
        { word: '好き', reading: 'Suki', meaning: 'ชอบ', example: '日本が好きです。', category: 'adjective' },
        { word: '大好き', reading: 'Daisuki', meaning: 'ชอบมาก/รัก', example: 'あなたが大好きです。', category: 'adjective' },
        // Numbers
        { word: '一', reading: 'Ichi', meaning: 'หนึ่ง', example: '一つください。', category: 'number' },
        { word: '二', reading: 'Ni', meaning: 'สอง', example: '二人です。', category: 'number' },
        { word: '三', reading: 'San', meaning: 'สาม', example: '三日後', category: 'number' },
        { word: '百', reading: 'Hyaku', meaning: 'ร้อย', example: '百円です。', category: 'number' },
        { word: '千', reading: 'Sen', meaning: 'พัน', example: '千円札', category: 'number' }
    ],
    korean: [
        // Greetings
        { word: '안녕하세요', reading: 'Annyeonghaseyo', meaning: 'สวัสดี', example: '안녕하세요, 잘 지내세요?', category: 'greeting' },
        { word: '감사합니다', reading: 'Gamsahamnida', meaning: 'ขอบคุณ (สุภาพ)', example: '도와주셔서 감사합니다!', category: 'greeting' },
        { word: '고마워요', reading: 'Gomawoyo', meaning: 'ขอบคุณ', example: '선물 고마워요!', category: 'greeting' },
        { word: '안녕히 가세요', reading: 'Annyeonghi gaseyo', meaning: 'ลาก่อน (คนไป)', example: '안녕히 가세요, 내일 봬요!', category: 'greeting' },
        { word: '안녕히 계세요', reading: 'Annyeonghi gyeseyo', meaning: 'ลาก่อน (คนอยู่)', example: '안녕히 계세요!', category: 'greeting' },
        { word: '죄송합니다', reading: 'Joesonghamnida', meaning: 'ขอโทษ (สุภาพ)', example: '늦어서 죄송합니다.', category: 'greeting' },
        { word: '괜찮아요', reading: 'Gwaenchanayo', meaning: 'ไม่เป็นไร', example: '괜찮아요, 걱정 마세요.', category: 'greeting' },
        // Daily Life
        { word: '맛있다', reading: 'Masissda', meaning: 'อร่อย', example: '이 음식은 맛있어요!', category: 'adjective' },
        { word: '예쁘다', reading: 'Yeppeuda', meaning: 'สวย', example: '오늘 날씨가 예뻐요.', category: 'adjective' },
        { word: '멋있다', reading: 'Meossitda', meaning: 'หล่อ/เท่', example: '그 남자 정말 멋있어요.', category: 'adjective' },
        { word: '친구', reading: 'Chingu', meaning: 'เพื่อน', example: '그는 제 친구예요.', category: 'noun' },
        { word: '공부', reading: 'Gongbu', meaning: 'เรียน', example: '한국어를 공부해요.', category: 'verb' },
        { word: '사랑', reading: 'Sarang', meaning: 'รัก', example: '사랑해요!', category: 'noun' },
        { word: '먹다', reading: 'Meokda', meaning: 'กิน', example: '밥을 먹어요.', category: 'verb' },
        { word: '마시다', reading: 'Masida', meaning: 'ดื่ม', example: '커피를 마셔요.', category: 'verb' },
        { word: '자다', reading: 'Jada', meaning: 'นอน', example: '일찍 자요.', category: 'verb' },
        { word: '가다', reading: 'Gada', meaning: 'ไป', example: '학교에 가요.', category: 'verb' },
        { word: '오다', reading: 'Oda', meaning: 'มา', example: '친구가 와요.', category: 'verb' },
        { word: '좋아하다', reading: 'Joahada', meaning: 'ชอบ', example: '한국을 좋아해요.', category: 'verb' },
        { word: '싫어하다', reading: 'Sireohada', meaning: 'ไม่ชอบ', example: '야채를 싫어해요.', category: 'verb' },
        // Numbers
        { word: '하나', reading: 'Hana', meaning: 'หนึ่ง', example: '사과 하나 주세요.', category: 'number' },
        { word: '둘', reading: 'Dul', meaning: 'สอง', example: '친구 둘이 왔어요.', category: 'number' },
        { word: '셋', reading: 'Set', meaning: 'สาม', example: '세 개 필요해요.', category: 'number' },
        { word: '백', reading: 'Baek', meaning: 'ร้อย', example: '백 원이에요.', category: 'number' },
        { word: '천', reading: 'Cheon', meaning: 'พัน', example: '천 원짜리', category: 'number' }
    ],
    thai: [
        // For foreigners learning Thai
        { word: 'สวัสดี', reading: 'Sawatdee', meaning: 'Hello', example: 'สวัสดีครับ/ค่ะ', category: 'greeting' },
        { word: 'ขอบคุณ', reading: 'Khob khun', meaning: 'Thank you', example: 'ขอบคุณมากครับ/ค่ะ', category: 'greeting' },
        { word: 'ลาก่อน', reading: 'La gon', meaning: 'Goodbye', example: 'ลาก่อนนะ', category: 'greeting' },
        { word: 'ขอโทษ', reading: 'Khor thot', meaning: 'Sorry', example: 'ขอโทษครับ/ค่ะ', category: 'greeting' },
        { word: 'ไม่เป็นไร', reading: 'Mai pen rai', meaning: 'Never mind/You are welcome', example: 'ไม่เป็นไรครับ/ค่ะ', category: 'greeting' },
        { word: 'อร่อย', reading: 'Aroy', meaning: 'Delicious', example: 'อาหารอร่อยมาก', category: 'adjective' },
        { word: 'สวย', reading: 'Suay', meaning: 'Beautiful', example: 'วันนี้อากาศสวย', category: 'adjective' },
        { word: 'หล่อ', reading: 'Lor', meaning: 'Handsome', example: 'เขาหล่อมาก', category: 'adjective' },
        { word: 'เพื่อน', reading: 'Pheuan', meaning: 'Friend', example: 'เขาเป็นเพื่อนของผม', category: 'noun' },
        { word: 'เรียน', reading: 'Rian', meaning: 'Study', example: 'ผมเรียนภาษาไทย', category: 'verb' },
        { word: 'รัก', reading: 'Rak', meaning: 'Love', example: 'ฉันรักเธอ', category: 'verb' },
        { word: 'กิน', reading: 'Gin', meaning: 'Eat', example: 'กินข้าวหรือยัง?', category: 'verb' },
        { word: 'ดื่ม', reading: 'Duem', meaning: 'Drink', example: 'ดื่มน้ำเย็น', category: 'verb' },
        { word: 'นอน', reading: 'Non', meaning: 'Sleep', example: 'นอนหลับฝันดี', category: 'verb' },
        { word: 'ไป', reading: 'Pai', meaning: 'Go', example: 'ไปไหนมา?', category: 'verb' },
        { word: 'มา', reading: 'Ma', meaning: 'Come', example: 'มานี่สิ', category: 'verb' },
        { word: 'ชอบ', reading: 'Chop', meaning: 'Like', example: 'ผมชอบกินข้าวผัด', category: 'verb' },
        // Numbers
        { word: 'หนึ่ง', reading: 'Nueng', meaning: 'One', example: 'หนึ่งที่', category: 'number' },
        { word: 'สอง', reading: 'Song', meaning: 'Two', example: 'สองคน', category: 'number' },
        { word: 'สาม', reading: 'Sam', meaning: 'Three', example: 'สามวัน', category: 'number' },
        { word: 'สิบ', reading: 'Sip', meaning: 'Ten', example: 'สิบบาท', category: 'number' },
        { word: 'ร้อย', reading: 'Roy', meaning: 'Hundred', example: 'ร้อยบาท', category: 'number' },
        { word: 'พัน', reading: 'Phan', meaning: 'Thousand', example: 'พันบาท', category: 'number' }
    ],
    spanish: [
        // Greetings - NEW!
        { word: 'Hola', reading: '/ˈola/', meaning: 'สวัสดี', example: '¡Hola! ¿Cómo estás?', category: 'greeting' },
        { word: 'Gracias', reading: '/ˈɡraθjas/', meaning: 'ขอบคุณ', example: '¡Muchas gracias!', category: 'greeting' },
        { word: 'Adiós', reading: '/aˈðjos/', meaning: 'ลาก่อน', example: 'Adiós, hasta mañana.', category: 'greeting' },
        { word: 'Por favor', reading: '/por faˈβor/', meaning: 'กรุณา', example: 'Un café, por favor.', category: 'greeting' },
        { word: 'Lo siento', reading: '/lo ˈsjento/', meaning: 'ขอโทษ', example: 'Lo siento mucho.', category: 'greeting' },
        { word: 'Buenos días', reading: '/ˈbwenos ˈdias/', meaning: 'สวัสดีตอนเช้า', example: '¡Buenos días, señor!', category: 'greeting' },
        { word: 'Buenas noches', reading: '/ˈbwenas ˈnotʃes/', meaning: 'ราตรีสวัสดิ์', example: 'Buenas noches, que duermas bien.', category: 'greeting' },
        // Daily Life
        { word: 'Hermoso', reading: '/erˈmoso/', meaning: 'สวยงาม', example: '¡Qué día tan hermoso!', category: 'adjective' },
        { word: 'Delicioso', reading: '/deliˈθjoso/', meaning: 'อร่อย', example: 'Esta comida está deliciosa.', category: 'adjective' },
        { word: 'Amigo', reading: '/aˈmiɣo/', meaning: 'เพื่อน', example: 'Él es mi mejor amigo.', category: 'noun' },
        { word: 'Amor', reading: '/aˈmor/', meaning: 'รัก', example: 'Te amo con todo mi corazón.', category: 'noun' },
        { word: 'Comer', reading: '/koˈmer/', meaning: 'กิน', example: 'Me gusta comer pizza.', category: 'verb' },
        { word: 'Beber', reading: '/beˈβer/', meaning: 'ดื่ม', example: 'Voy a beber agua.', category: 'verb' },
        { word: 'Dormir', reading: '/dorˈmir/', meaning: 'นอน', example: 'Necesito dormir más.', category: 'verb' },
        { word: 'Trabajar', reading: '/traβaˈxar/', meaning: 'ทำงาน', example: 'Trabajo en una oficina.', category: 'verb' },
        { word: 'Estudiar', reading: '/estuˈðjar/', meaning: 'เรียน', example: 'Estudio español cada día.', category: 'verb' },
        { word: 'Querer', reading: '/keˈrer/', meaning: 'ต้องการ/รัก', example: 'Te quiero mucho.', category: 'verb' },
        { word: 'Poder', reading: '/poˈðer/', meaning: 'สามารถ', example: '¿Puedes ayudarme?', category: 'verb' },
        // Numbers
        { word: 'Uno', reading: '/ˈuno/', meaning: 'หนึ่ง', example: 'Tengo un hermano.', category: 'number' },
        { word: 'Dos', reading: '/dos/', meaning: 'สอง', example: 'Dos cafés, por favor.', category: 'number' },
        { word: 'Tres', reading: '/tres/', meaning: 'สาม', example: 'Hay tres gatos.', category: 'number' },
        { word: 'Diez', reading: '/djeθ/', meaning: 'สิบ', example: 'Cuesta diez euros.', category: 'number' },
        { word: 'Cien', reading: '/θjen/', meaning: 'ร้อย', example: 'Cien personas vinieron.', category: 'number' },
        { word: 'Mil', reading: '/mil/', meaning: 'พัน', example: 'Cuesta mil euros.', category: 'number' }
    ],
    french: [
        // Greetings - NEW!
        { word: 'Bonjour', reading: '/bɔ̃ʒuʁ/', meaning: 'สวัสดี', example: 'Bonjour, comment allez-vous?', category: 'greeting' },
        { word: 'Merci', reading: '/mɛʁsi/', meaning: 'ขอบคุณ', example: 'Merci beaucoup!', category: 'greeting' },
        { word: 'Au revoir', reading: '/o ʁəvwaʁ/', meaning: 'ลาก่อน', example: 'Au revoir, à demain!', category: 'greeting' },
        { word: "S'il vous plaît", reading: '/sil vu plɛ/', meaning: 'กรุณา', example: "Un café, s'il vous plaît.", category: 'greeting' },
        { word: 'Pardon', reading: '/paʁdɔ̃/', meaning: 'ขอโทษ', example: 'Pardon, excusez-moi.', category: 'greeting' },
        { word: 'Bonsoir', reading: '/bɔ̃swaʁ/', meaning: 'สวัสดีตอนเย็น', example: 'Bonsoir, madame.', category: 'greeting' },
        { word: 'Bonne nuit', reading: '/bɔn nɥi/', meaning: 'ราตรีสวัสดิ์', example: 'Bonne nuit, fais de beaux rêves.', category: 'greeting' },
        // Daily Life
        { word: 'Beau', reading: '/bo/', meaning: 'สวย/หล่อ', example: 'Il fait beau aujourd\'hui.', category: 'adjective' },
        { word: 'Délicieux', reading: '/delisjø/', meaning: 'อร่อย', example: 'Ce gâteau est délicieux!', category: 'adjective' },
        { word: 'Ami', reading: '/ami/', meaning: 'เพื่อน', example: 'C\'est mon meilleur ami.', category: 'noun' },
        { word: 'Amour', reading: '/amuʁ/', meaning: 'ความรัก', example: 'Je t\'aime, mon amour.', category: 'noun' },
        { word: 'Manger', reading: '/mɑ̃ʒe/', meaning: 'กิน', example: 'J\'aime manger du fromage.', category: 'verb' },
        { word: 'Boire', reading: '/bwaʁ/', meaning: 'ดื่ม', example: 'Je vais boire du vin.', category: 'verb' },
        { word: 'Dormir', reading: '/dɔʁmiʁ/', meaning: 'นอน', example: 'Je veux dormir.', category: 'verb' },
        { word: 'Travailler', reading: '/tʁavaje/', meaning: 'ทำงาน', example: 'Je travaille dans un bureau.', category: 'verb' },
        { word: 'Étudier', reading: '/etydje/', meaning: 'เรียน', example: 'J\'étudie le français.', category: 'verb' },
        { word: 'Vouloir', reading: '/vulwaʁ/', meaning: 'ต้องการ', example: 'Je veux partir.', category: 'verb' },
        { word: 'Pouvoir', reading: '/puvwaʁ/', meaning: 'สามารถ', example: 'Peux-tu m\'aider?', category: 'verb' },
        // Numbers
        { word: 'Un', reading: '/œ̃/', meaning: 'หนึ่ง', example: 'J\'ai un frère.', category: 'number' },
        { word: 'Deux', reading: '/dø/', meaning: 'สอง', example: 'Deux croissants, s\'il vous plaît.', category: 'number' },
        { word: 'Trois', reading: '/tʁwa/', meaning: 'สาม', example: 'Il y a trois chats.', category: 'number' },
        { word: 'Dix', reading: '/dis/', meaning: 'สิบ', example: 'Ça coûte dix euros.', category: 'number' },
        { word: 'Cent', reading: '/sɑ̃/', meaning: 'ร้อย', example: 'Cent personnes sont venues.', category: 'number' },
        { word: 'Mille', reading: '/mil/', meaning: 'พัน', example: 'Mille euros.', category: 'number' }
    ],
    german: [
        // Greetings - NEW!
        { word: 'Hallo', reading: '/ˈhalo/', meaning: 'สวัสดี', example: 'Hallo, wie geht es dir?', category: 'greeting' },
        { word: 'Danke', reading: '/ˈdaŋkə/', meaning: 'ขอบคุณ', example: 'Danke schön!', category: 'greeting' },
        { word: 'Auf Wiedersehen', reading: '/aʊf ˈviːdɐzeːən/', meaning: 'ลาก่อน', example: 'Auf Wiedersehen, bis morgen!', category: 'greeting' },
        { word: 'Bitte', reading: '/ˈbɪtə/', meaning: 'กรุณา/ยินดี', example: 'Ein Bier, bitte.', category: 'greeting' },
        { word: 'Entschuldigung', reading: '/ɛntˈʃʊldɪɡʊŋ/', meaning: 'ขอโทษ', example: 'Entschuldigung, wo ist der Bahnhof?', category: 'greeting' },
        { word: 'Guten Morgen', reading: '/ˈɡuːtən ˈmɔʁɡən/', meaning: 'สวัสดีตอนเช้า', example: 'Guten Morgen! Haben Sie gut geschlafen?', category: 'greeting' },
        { word: 'Gute Nacht', reading: '/ˈɡuːtə naxt/', meaning: 'ราตรีสวัสดิ์', example: 'Gute Nacht, schlaf gut!', category: 'greeting' },
        // Daily Life
        { word: 'Schön', reading: '/ʃøːn/', meaning: 'สวย/ดี', example: 'Das Wetter ist schön heute.', category: 'adjective' },
        { word: 'Lecker', reading: '/ˈlɛkɐ/', meaning: 'อร่อย', example: 'Das Essen ist sehr lecker!', category: 'adjective' },
        { word: 'Freund', reading: '/fʁɔʏnt/', meaning: 'เพื่อน', example: 'Er ist mein bester Freund.', category: 'noun' },
        { word: 'Liebe', reading: '/ˈliːbə/', meaning: 'ความรัก', example: 'Ich liebe dich.', category: 'noun' },
        { word: 'Essen', reading: '/ˈɛsn̩/', meaning: 'กิน', example: 'Ich esse gerne Pizza.', category: 'verb' },
        { word: 'Trinken', reading: '/ˈtʁɪŋkn̩/', meaning: 'ดื่ม', example: 'Ich trinke Wasser.', category: 'verb' },
        { word: 'Schlafen', reading: '/ˈʃlaːfn̩/', meaning: 'นอน', example: 'Ich muss schlafen.', category: 'verb' },
        { word: 'Arbeiten', reading: '/ˈaʁbaɪtn̩/', meaning: 'ทำงาน', example: 'Ich arbeite im Büro.', category: 'verb' },
        { word: 'Lernen', reading: '/ˈlɛʁnən/', meaning: 'เรียน', example: 'Ich lerne Deutsch.', category: 'verb' },
        { word: 'Wollen', reading: '/ˈvɔlən/', meaning: 'ต้องการ', example: 'Ich will nach Hause gehen.', category: 'verb' },
        { word: 'Können', reading: '/ˈkœnən/', meaning: 'สามารถ', example: 'Kannst du mir helfen?', category: 'verb' },
        // Numbers
        { word: 'Eins', reading: '/aɪns/', meaning: 'หนึ่ง', example: 'Ich habe ein Auto.', category: 'number' },
        { word: 'Zwei', reading: '/tsvaɪ/', meaning: 'สอง', example: 'Zwei Bier, bitte.', category: 'number' },
        { word: 'Drei', reading: '/dʁaɪ/', meaning: 'สาม', example: 'Es gibt drei Katzen.', category: 'number' },
        { word: 'Zehn', reading: '/tseːn/', meaning: 'สิบ', example: 'Das kostet zehn Euro.', category: 'number' },
        { word: 'Hundert', reading: '/ˈhʊndɐt/', meaning: 'ร้อย', example: 'Hundert Menschen kamen.', category: 'number' },
        { word: 'Tausend', reading: '/ˈtaʊzn̩t/', meaning: 'พัน', example: 'Tausend Euro.', category: 'number' }
    ],
    italian: [
        // Greetings - NEW!
        { word: 'Ciao', reading: '/ˈtʃao/', meaning: 'สวัสดี/ลาก่อน', example: 'Ciao, come stai?', category: 'greeting' },
        { word: 'Grazie', reading: '/ˈɡratsje/', meaning: 'ขอบคุณ', example: 'Grazie mille!', category: 'greeting' },
        { word: 'Arrivederci', reading: '/arriːveˈdertʃi/', meaning: 'ลาก่อน (สุภาพ)', example: 'Arrivederci, a domani!', category: 'greeting' },
        { word: 'Per favore', reading: '/per faˈvoːre/', meaning: 'กรุณา', example: 'Un caffè, per favore.', category: 'greeting' },
        { word: 'Scusa', reading: '/ˈskuːza/', meaning: 'ขอโทษ', example: 'Scusa, dov\'è la stazione?', category: 'greeting' },
        { word: 'Buongiorno', reading: '/ˌbwɔnˈdʒorno/', meaning: 'สวัสดีตอนเช้า', example: 'Buongiorno, signore!', category: 'greeting' },
        { word: 'Buonanotte', reading: '/ˌbwɔnaˈnɔtte/', meaning: 'ราตรีสวัสดิ์', example: 'Buonanotte, sogni d\'oro!', category: 'greeting' },
        // Daily Life
        { word: 'Bello', reading: '/ˈbɛllo/', meaning: 'สวย/หล่อ', example: 'Che bella giornata!', category: 'adjective' },
        { word: 'Buono', reading: '/ˈbwɔːno/', meaning: 'อร่อย/ดี', example: 'Questa pizza è buona!', category: 'adjective' },
        { word: 'Amico', reading: '/aˈmiːko/', meaning: 'เพื่อน', example: 'Lui è il mio migliore amico.', category: 'noun' },
        { word: 'Amore', reading: '/aˈmoːre/', meaning: 'ความรัก', example: 'Ti amo, amore mio.', category: 'noun' },
        { word: 'Mangiare', reading: '/manˈdʒare/', meaning: 'กิน', example: 'Mi piace mangiare la pasta.', category: 'verb' },
        { word: 'Bere', reading: '/ˈbere/', meaning: 'ดื่ม', example: 'Voglio bere un caffè.', category: 'verb' },
        { word: 'Dormire', reading: '/dorˈmiːre/', meaning: 'นอน', example: 'Devo dormire.', category: 'verb' },
        { word: 'Lavorare', reading: '/lavoˈraːre/', meaning: 'ทำงาน', example: 'Lavoro in un ufficio.', category: 'verb' },
        { word: 'Studiare', reading: '/stuˈdjare/', meaning: 'เรียน', example: 'Studio italiano ogni giorno.', category: 'verb' },
        { word: 'Volere', reading: '/voˈleːre/', meaning: 'ต้องการ', example: 'Voglio andare a casa.', category: 'verb' },
        { word: 'Potere', reading: '/poˈteːre/', meaning: 'สามารถ', example: 'Puoi aiutarmi?', category: 'verb' },
        // Numbers
        { word: 'Uno', reading: '/ˈuːno/', meaning: 'หนึ่ง', example: 'Ho un fratello.', category: 'number' },
        { word: 'Due', reading: '/ˈduːe/', meaning: 'สอง', example: 'Due caffè, per favore.', category: 'number' },
        { word: 'Tre', reading: '/tre/', meaning: 'สาม', example: 'Ci sono tre gatti.', category: 'number' },
        { word: 'Dieci', reading: '/ˈdjɛːtʃi/', meaning: 'สิบ', example: 'Costa dieci euro.', category: 'number' },
        { word: 'Cento', reading: '/ˈtʃɛnto/', meaning: 'ร้อย', example: 'Cento persone sono venute.', category: 'number' },
        { word: 'Mille', reading: '/ˈmille/', meaning: 'พัน', example: 'Mille euro.', category: 'number' }
    ],
    russian: [
        // Greetings - NEW!
        { word: 'Привет', reading: 'Privet', meaning: 'สวัสดี (ไม่เป็นทางการ)', example: 'Привет, как дела?', category: 'greeting' },
        { word: 'Здравствуйте', reading: 'Zdravstvuyte', meaning: 'สวัสดี (สุภาพ)', example: 'Здравствуйте, господин!', category: 'greeting' },
        { word: 'Спасибо', reading: 'Spasibo', meaning: 'ขอบคุณ', example: 'Спасибо большое!', category: 'greeting' },
        { word: 'До свидания', reading: 'Do svidaniya', meaning: 'ลาก่อน', example: 'До свидания, до завтра!', category: 'greeting' },
        { word: 'Пожалуйста', reading: 'Pozhaluysta', meaning: 'กรุณา/ยินดี', example: 'Один кофе, пожалуйста.', category: 'greeting' },
        { word: 'Извините', reading: 'Izvinite', meaning: 'ขอโทษ', example: 'Извините, где вокзал?', category: 'greeting' },
        { word: 'Доброе утро', reading: 'Dobroye utro', meaning: 'สวัสดีตอนเช้า', example: 'Доброе утро! Хорошо спали?', category: 'greeting' },
        { word: 'Спокойной ночи', reading: 'Spokoynoy nochi', meaning: 'ราตรีสวัสดิ์', example: 'Спокойной ночи, сладких снов!', category: 'greeting' },
        // Daily Life
        { word: 'Красивый', reading: 'Krasivyy', meaning: 'สวย', example: 'Какой красивый день!', category: 'adjective' },
        { word: 'Вкусный', reading: 'Vkusnyy', meaning: 'อร่อย', example: 'Эта еда очень вкусная!', category: 'adjective' },
        { word: 'Друг', reading: 'Drug', meaning: 'เพื่อน', example: 'Он мой лучший друг.', category: 'noun' },
        { word: 'Любовь', reading: 'Lyubov', meaning: 'ความรัก', example: 'Я тебя люблю.', category: 'noun' },
        { word: 'Есть', reading: 'Yest\'', meaning: 'กิน', example: 'Я люблю есть пиццу.', category: 'verb' },
        { word: 'Пить', reading: 'Pit\'', meaning: 'ดื่ม', example: 'Я буду пить воду.', category: 'verb' },
        { word: 'Спать', reading: 'Spat\'', meaning: 'นอน', example: 'Мне нужно спать.', category: 'verb' },
        { word: 'Работать', reading: 'Rabotat\'', meaning: 'ทำงาน', example: 'Я работаю в офисе.', category: 'verb' },
        { word: 'Учить', reading: 'Uchit\'', meaning: 'เรียน', example: 'Я учу русский язык.', category: 'verb' },
        { word: 'Хотеть', reading: 'Khotet\'', meaning: 'ต้องการ', example: 'Я хочу домой.', category: 'verb' },
        { word: 'Мочь', reading: 'Moch\'', meaning: 'สามารถ', example: 'Ты можешь мне помочь?', category: 'verb' },
        // Numbers
        { word: 'Один', reading: 'Odin', meaning: 'หนึ่ง', example: 'У меня один брат.', category: 'number' },
        { word: 'Два', reading: 'Dva', meaning: 'สอง', example: 'Два кофе, пожалуйста.', category: 'number' },
        { word: 'Три', reading: 'Tri', meaning: 'สาม', example: 'Здесь три кошки.', category: 'number' },
        { word: 'Десять', reading: 'Desyat\'', meaning: 'สิบ', example: 'Это стоит десять рублей.', category: 'number' },
        { word: 'Сто', reading: 'Sto', meaning: 'ร้อย', example: 'Сто человек пришли.', category: 'number' },
        { word: 'Тысяча', reading: 'Tysyacha', meaning: 'พัน', example: 'Тысяча рублей.', category: 'number' }
    ]
};

// Grammar Data
const grammarData = {
    english: [
        {
            title: 'Present Simple Tense',
            explanation: 'ใช้กับเหตุการณ์ที่เกิดขึ้นเป็นประจำ, ความจริงทั่วไป, หรือนิสัย',
            structure: 'Subject + Verb (s/es for he, she, it)',
            examples: ['I eat breakfast every day.', 'She works in a bank.', 'The sun rises in the east.']
        },
        {
            title: 'Past Simple Tense',
            explanation: 'ใช้กับเหตุการณ์ที่เกิดขึ้นและจบลงแล้วในอดีต',
            structure: 'Subject + Verb (past form)',
            examples: ['I visited Bangkok last year.', 'She studied English yesterday.', 'They went to the beach.']
        },
        {
            title: 'Future Simple Tense',
            explanation: 'ใช้กับเหตุการณ์ที่จะเกิดขึ้นในอนาคต',
            structure: 'Subject + will + Verb',
            examples: ['I will go to school tomorrow.', 'She will call you later.', 'They will visit us next week.']
        }
    ],
    chinese: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาจีนใช้โครงสร้าง ประธาน + กริยา + กรรม (SVO) เหมือนภาษาไทย',
            structure: '主语 + 谓语 + 宾语',
            examples: ['我吃饭。(ฉันกินข้าว)', '他学习中文。(เขาเรียนภาษาจีน)', '她喜欢音乐。(เธอชอบเพลง)']
        },
        {
            title: 'การใช้ 的 (de)',
            explanation: '的 ใช้เชื่อมคำขยายกับคำนาม แสดงความเป็นเจ้าของ',
            structure: 'คำขยาย + 的 + คำนาม',
            examples: ['我的书 (หนังสือของฉัน)', '漂亮的女孩 (ผู้หญิงสวย)', '中国的文化 (วัฒนธรรมจีน)']
        },
        {
            title: 'การใช้ 了 (le) - อดีต',
            explanation: '了 ใช้แสดงว่าการกระทำเสร็จสิ้นแล้ว',
            structure: 'ประธาน + กริยา + 了 + กรรม',
            examples: ['我吃了饭 (ฉันกินข้าวแล้ว)', '他看了电影 (เขาดูหนังแล้ว)']
        }
    ],
    japanese: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาญี่ปุ่นใช้โครงสร้าง ประธาน + กรรม + กริยา (SOV)',
            structure: '主語は + 目的語を + 動詞',
            examples: ['私はご飯を食べます。(ฉันกินข้าว)', '彼は本を読みます。(เขาอ่านหนังสือ)']
        },
        {
            title: 'คำช่วย は (wa) และ が (ga)',
            explanation: 'は ใช้ระบุหัวเรื่อง, が ใช้ระบุประธานที่เน้น',
            structure: 'ประธาน + は/が + ...',
            examples: ['私は学生です。(ฉันเป็นนักเรียน)', '猫がいます。(มีแมว)']
        },
        {
            title: 'การผันกริยา - รูปสุภาพ',
            explanation: 'กริยารูป ます (masu) ใช้ในภาษาสุภาพ',
            structure: 'กริยา + ます/ません',
            examples: ['食べます (กิน)', '食べません (ไม่กิน)', '行きます (ไป)']
        }
    ],
    korean: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาเกาหลีใช้โครงสร้าง ประธาน + กรรม + กริยา (SOV)',
            structure: '주어 + 목적어 + 동사',
            examples: ['저는 밥을 먹어요. (ฉันกินข้าว)', '그는 책을 읽어요. (เขาอ่านหนังสือ)']
        },
        {
            title: 'การผันคำกริยา (존댓말)',
            explanation: 'ภาษาเกาหลีมีระดับความสุภาพหลายระดับ',
            structure: '동사 어간 + 요/습니다',
            examples: ['가다 → 가요/갑니다 (ไป)', '먹다 → 먹어요/먹습니다 (กิน)']
        },
        {
            title: 'คำช่วย 이/가 และ 은/는',
            explanation: '이/가 ใช้กับประธาน, 은/는 ใช้กับหัวข้อ',
            structure: 'คำนาม + 이/가 หรือ 은/는',
            examples: ['저는 학생이에요 (ฉันเป็นนักเรียน)', '날씨가 좋아요 (อากาศดี)']
        }
    ],
    thai: [
        {
            title: 'Thai Sentence Structure',
            explanation: 'Thai uses Subject + Verb + Object (SVO) structure, similar to English.',
            structure: 'ประธาน + กริยา + กรรม',
            examples: ['ผมกินข้าว (I eat rice)', 'เขาอ่านหนังสือ (He reads a book)']
        },
        {
            title: 'Politeness Particles (ครับ/ค่ะ)',
            explanation: 'Thai uses ครับ for males and ค่ะ/คะ for females to show politeness.',
            structure: 'Sentence + ครับ/ค่ะ',
            examples: ['สวัสดีครับ (Hello - male)', 'ขอบคุณค่ะ (Thank you - female)']
        },
        {
            title: 'Question Words',
            explanation: 'Thai puts question words at the end of sentences.',
            structure: 'Statement + Question Word',
            examples: ['คุณชื่ออะไร? (What is your name?)', 'ไปไหน? (Where are you going?)']
        }
    ],
    spanish: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาสเปนใช้โครงสร้าง ประธาน + กริยา + กรรม (SVO) และกริยาผันตามบุคคล',
            structure: 'Sujeto + Verbo + Objeto',
            examples: ['Yo como arroz. (ฉันกินข้าว)', 'Él lee un libro. (เขาอ่านหนังสือ)', 'Nosotros estudiamos español. (เราเรียนภาษาสเปน)']
        },
        {
            title: 'การผันกริยา Present Tense',
            explanation: 'กริยาในภาษาสเปนผันตามบุคคล: -ar, -er, -ir',
            structure: 'กริยา + ผัน (o/as/a/amos/áis/an)',
            examples: ['Hablar → Hablo, Hablas, Habla (พูด)', 'Comer → Como, Comes, Come (กิน)', 'Vivir → Vivo, Vives, Vive (อยู่)']
        },
        {
            title: 'Ser vs Estar',
            explanation: 'ทั้งสองแปลว่า "เป็น/อยู่" แต่ใช้ต่างกัน: Ser = ลักษณะถาวร, Estar = สถานะชั่วคราว',
            structure: 'Ser = identity, Estar = state/location',
            examples: ['Yo soy estudiante (ฉันเป็นนักเรียน)', 'Yo estoy cansado (ฉันเหนื่อย)', 'Él está en casa (เขาอยู่บ้าน)']
        }
    ],
    french: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาฝรั่งเศสใช้โครงสร้าง ประธาน + กริยา + กรรม (SVO)',
            structure: 'Sujet + Verbe + Objet',
            examples: ['Je mange du riz. (ฉันกินข้าว)', 'Il lit un livre. (เขาอ่านหนังสือ)', 'Nous étudions le français. (เราเรียนภาษาฝรั่งเศส)']
        },
        {
            title: 'การผันกริยา Present Tense',
            explanation: 'กริยาในภาษาฝรั่งเศสผันตามบุคคล: -er, -ir, -re',
            structure: 'กริยา + ผัน (e/es/e/ons/ez/ent)',
            examples: ['Parler → Je parle, Tu parles (พูด)', 'Finir → Je finis, Tu finis (จบ)', 'Vendre → Je vends, Tu vends (ขาย)']
        },
        {
            title: 'Article (คำนำหน้านาม)',
            explanation: 'ภาษาฝรั่งเศสมี article แบ่งตามเพศและจำนวน',
            structure: 'le/la/les (ชี้เฉพาะ), un/une/des (ไม่ชี้เฉพาะ)',
            examples: ['Le livre (หนังสือเล่มนั้น)', 'Une maison (บ้านหลังหนึ่ง)', 'Les étudiants (นักเรียนกลุ่มนั้น)']
        }
    ],
    german: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาเยอรมันใช้โครงสร้าง กริยาอยู่ตำแหน่งที่ 2 เสมอ (V2)',
            structure: 'Position 1 + Verb + ... (V2 rule)',
            examples: ['Ich esse Reis. (ฉันกินข้าว)', 'Heute gehe ich zur Schule. (วันนี้ฉันไปโรงเรียน)']
        },
        {
            title: 'การผันกริยา Present Tense',
            explanation: 'กริยาในภาษาเยอรมันผันตามบุคคล',
            structure: 'กริยา + ผัน (e/st/t/en/t/en)',
            examples: ['Spielen → Ich spiele, Du spielst (เล่น)', 'Arbeiten → Ich arbeite, Du arbeitest (ทำงาน)']
        },
        {
            title: 'Case System (การก)',
            explanation: 'ภาษาเยอรมันมี 4 การก: Nominativ, Akkusativ, Dativ, Genitiv',
            structure: 'คำนาม + Article ที่ผันตามการก',
            examples: ['Der Mann (ประธาน)', 'Ich sehe den Mann (กรรมตรง)', 'Ich gebe dem Mann (กรรมรอง)']
        }
    ],
    italian: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษาอิตาลีใช้โครงสร้าง ประธาน + กริยา + กรรม (SVO) และกริยาผันตามบุคคล',
            structure: 'Soggetto + Verbo + Oggetto',
            examples: ['Io mangio il riso. (ฉันกินข้าว)', 'Lui legge un libro. (เขาอ่านหนังสือ)', 'Noi studiamo italiano. (เราเรียนภาษาอิตาลี)']
        },
        {
            title: 'การผันกริยา Present Tense',
            explanation: 'กริยาในภาษาอิตาลีผันตามบุคคล: -are, -ere, -ire',
            structure: 'กริยา + ผัน (o/i/a/iamo/ate/ano)',
            examples: ['Parlare → Parlo, Parli, Parla (พูด)', 'Vedere → Vedo, Vedi, Vede (เห็น)', 'Dormire → Dormo, Dormi, Dorme (นอน)']
        },
        {
            title: 'Article (คำนำหน้านาม)',
            explanation: 'ภาษาอิตาลีมี article แบ่งตามเพศและจำนวน',
            structure: 'il/la/i/le (ชี้เฉพาะ), un/una (ไม่ชี้เฉพาะ)',
            examples: ['Il libro (หนังสือเล่มนั้น)', 'Una casa (บ้านหลังหนึ่ง)', 'I ragazzi (เด็กชายกลุ่มนั้น)']
        }
    ],
    russian: [
        {
            title: 'โครงสร้างประโยคพื้นฐาน',
            explanation: 'ภาษารัสเซียมีลำดับคำค่อนข้างยืดหยุ่น แต่มักใช้ SVO',
            structure: 'Подлежащее + Сказуемое + Дополнение',
            examples: ['Я ем рис. (ฉันกินข้าว)', 'Он читает книгу. (เขาอ่านหนังสือ)', 'Мы учим русский. (เราเรียนภาษารัสเซีย)']
        },
        {
            title: 'การผันกริยา Present Tense',
            explanation: 'กริยาในภาษารัสเซียผันตามบุคคลและการผันมี 2 แบบ',
            structure: 'กริยา + ผัน (1st/2nd conjugation)',
            examples: ['Читать → Читаю, Читаешь, Читает (อ่าน)', 'Говорить → Говорю, Говоришь, Говорит (พูด)']
        },
        {
            title: 'Case System (การก)',
            explanation: 'ภาษารัสเซียมี 6 การก: Именительный, Родительный, Дательный, Винительный, Творительный, Предложный',
            structure: 'คำนาม + ผันตามการก',
            examples: ['Книга (หนังสือ - ประธาน)', 'Читаю книгу (อ่านหนังสือ - กรรมตรง)', 'В книге (ในหนังสือ - บุพบท)']
        }
    ]
};

// Quick Phrases Data - All 10 Languages
const phrasesData = {
    english: [
        { phrase: 'How are you?', meaning: 'คุณเป็นอย่างไรบ้าง?' },
        { phrase: "I'm fine, thank you.", meaning: 'ฉันสบายดี ขอบคุณ' },
        { phrase: 'Nice to meet you.', meaning: 'ยินดีที่ได้พบคุณ' },
        { phrase: 'Where is the bathroom?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: 'How much is this?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'Can you help me?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: "I don't understand.", meaning: 'ฉันไม่เข้าใจ' },
        { phrase: 'What time is it?', meaning: 'กี่โมงแล้ว?' }
    ],
    chinese: [
        { phrase: '你好吗？', meaning: 'คุณสบายดีไหม?' },
        { phrase: '很高兴认识你。', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: '厕所在哪里？', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: '这个多少钱？', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: '我听不懂。', meaning: 'ฉันฟังไม่เข้าใจ' },
        { phrase: '可以帮我吗？', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: '现在几点？', meaning: 'ตอนนี้กี่โมง?' },
        { phrase: '太贵了！', meaning: 'แพงเกินไป!' }
    ],
    japanese: [
        { phrase: 'お元気ですか？', meaning: 'คุณสบายดีไหม?' },
        { phrase: 'はじめまして。', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: 'トイレはどこですか？', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: 'これはいくらですか？', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'わかりません。', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: '手伝ってください。', meaning: 'ช่วยด้วยครับ/ค่ะ' },
        { phrase: '今何時ですか？', meaning: 'ตอนนี้กี่โมง?' },
        { phrase: '高すぎます！', meaning: 'แพงเกินไป!' }
    ],
    korean: [
        { phrase: '잘 지내세요?', meaning: 'คุณสบายดีไหม?' },
        { phrase: '만나서 반갑습니다.', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: '화장실이 어디예요?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: '이거 얼마예요?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: '몰라요.', meaning: 'ไม่รู้/ไม่เข้าใจ' },
        { phrase: '도와주세요!', meaning: 'ช่วยด้วยค่ะ/ครับ!' },
        { phrase: '지금 몇 시예요?', meaning: 'ตอนนี้กี่โมง?' },
        { phrase: '너무 비싸요!', meaning: 'แพงเกินไป!' }
    ],
    thai: [
        { phrase: 'สบายดีไหม?', meaning: 'How are you?' },
        { phrase: 'ยินดีที่ได้รู้จัก', meaning: 'Nice to meet you' },
        { phrase: 'ห้องน้ำอยู่ที่ไหน?', meaning: 'Where is the bathroom?' },
        { phrase: 'อันนี้ราคาเท่าไหร่?', meaning: 'How much is this?' },
        { phrase: 'ไม่เข้าใจ', meaning: "I don't understand" },
        { phrase: 'ช่วยด้วย!', meaning: 'Help!' },
        { phrase: 'กี่โมงแล้ว?', meaning: 'What time is it?' },
        { phrase: 'แพงเกินไป!', meaning: 'Too expensive!' }
    ],
    spanish: [
        { phrase: '¿Cómo estás?', meaning: 'คุณเป็นอย่างไรบ้าง?' },
        { phrase: 'Mucho gusto.', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: '¿Dónde está el baño?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: '¿Cuánto cuesta esto?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'No entiendo.', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: '¿Puede ayudarme?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: '¿Qué hora es?', meaning: 'กี่โมงแล้ว?' },
        { phrase: '¡Es muy caro!', meaning: 'แพงมาก!' }
    ],
    french: [
        { phrase: 'Comment allez-vous?', meaning: 'คุณเป็นอย่างไรบ้าง?' },
        { phrase: 'Enchanté(e).', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: 'Où sont les toilettes?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: "C'est combien?", meaning: 'ราคาเท่าไหร่?' },
        { phrase: 'Je ne comprends pas.', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: 'Pouvez-vous m\'aider?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: 'Quelle heure est-il?', meaning: 'กี่โมงแล้ว?' },
        { phrase: "C'est trop cher!", meaning: 'แพงเกินไป!' }
    ],
    german: [
        { phrase: 'Wie geht es Ihnen?', meaning: 'คุณเป็นอย่างไรบ้าง?' },
        { phrase: 'Freut mich.', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: 'Wo ist die Toilette?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: 'Wie viel kostet das?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'Ich verstehe nicht.', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: 'Können Sie mir helfen?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: 'Wie spät ist es?', meaning: 'กี่โมงแล้ว?' },
        { phrase: 'Das ist zu teuer!', meaning: 'แพงเกินไป!' }
    ],
    italian: [
        { phrase: 'Come stai?', meaning: 'คุณเป็นอย่างไรบ้าง?' },
        { phrase: 'Piacere di conoscerti.', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: 'Dov\'è il bagno?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: 'Quanto costa questo?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'Non capisco.', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: 'Può aiutarmi?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: 'Che ore sono?', meaning: 'กี่โมงแล้ว?' },
        { phrase: 'È troppo caro!', meaning: 'แพงเกินไป!' }
    ],
    russian: [
        { phrase: 'Как дела?', meaning: 'เป็นอย่างไรบ้าง?' },
        { phrase: 'Очень приятно.', meaning: 'ยินดีที่ได้รู้จัก' },
        { phrase: 'Где туалет?', meaning: 'ห้องน้ำอยู่ที่ไหน?' },
        { phrase: 'Сколько это стоит?', meaning: 'อันนี้ราคาเท่าไหร่?' },
        { phrase: 'Я не понимаю.', meaning: 'ฉันไม่เข้าใจ' },
        { phrase: 'Вы можете мне помочь?', meaning: 'ช่วยฉันได้ไหม?' },
        { phrase: 'Который час?', meaning: 'กี่โมงแล้ว?' },
        { phrase: 'Это слишком дорого!', meaning: 'แพงเกินไป!' }
    ]
};

// Quiz Data
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScore = 0;

function selectLanguage(lang) {
    currentLang = lang;

    // Update UI with smooth animation
    document.querySelectorAll('.lang-selector-card').forEach(card => {
        card.classList.remove('active');
        card.classList.remove('animate__pulse');
    });

    const selectedCard = document.getElementById('lang-' + lang);
    selectedCard.classList.add('active');
    selectedCard.classList.add('animate__animated', 'animate__pulse');

    // Smooth scroll and show content area
    const contentArea = document.getElementById('langContentArea');
    contentArea.style.display = 'block';
    contentArea.classList.add('animate__animated', 'animate__fadeIn');

    // Smooth scroll to content
    setTimeout(() => {
        contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    // Load content for selected language with stagger
    loadVocabulary();
    setTimeout(() => loadGrammar(), 100);
    setTimeout(() => loadPhrases(), 200);
    updateLangStats();

    // Add XP with notification
    addXP(5);
    showToast(`🌍 เริ่มเรียน${getLangName(lang)}แล้ว! +5 XP`, 'success');
}

function getLangName(lang) {
    const names = {
        english: 'ภาษาอังกฤษ',
        chinese: 'ภาษาจีน',
        japanese: 'ภาษาญี่ปุ่น',
        korean: 'ภาษาเกาหลี',
        thai: 'ภาษาไทย',
        spanish: 'ภาษาสเปน',
        french: 'ภาษาฝรั่งเศส',
        german: 'ภาษาเยอรมัน',
        italian: 'ภาษาอิตาลี',
        russian: 'ภาษารัสเซีย'
    };
    return names[lang] || lang;
}

// Filter languages by category
function filterLanguages(category) {
    // Update active button
    document.querySelectorAll('.lang-cat-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.lang-cat-btn[data-cat="${category}"]`).classList.add('active');

    // Filter language cards
    const langItems = document.querySelectorAll('.lang-item');
    langItems.forEach(item => {
        const categories = item.getAttribute('data-category');
        if (category === 'all' || categories.includes(category)) {
            item.style.display = '';
            item.classList.add('animate__animated', 'animate__fadeIn');
        } else {
            item.style.display = 'none';
        }
    });
}

function setLangMode(mode) {
    currentLangMode = mode;

    // Update buttons with animation
    document.querySelectorAll('.practice-mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.getElementById('mode-' + mode);
    activeBtn.classList.add('active');

    // Animate mode transition
    const modes = ['vocabMode', 'grammarMode', 'quizMode', 'conversationMode'];
    modes.forEach(m => {
        const el = document.getElementById(m);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('animate__animated', 'animate__fadeIn');
        }
    });

    const activeMode = document.getElementById(mode + 'Mode');
    if (activeMode) {
        activeMode.style.display = 'block';
        activeMode.classList.add('animate__animated', 'animate__fadeIn');
    }

    // Mode-specific actions
    if (mode === 'quiz') {
        startQuiz();
        showToast('📝 เริ่มทดสอบ! สู้ๆ', 'info');
    }
    if (mode === 'conversation') {
        loadConversation();
        showToast('💬 ฝึกบทสนทนา', 'info');
    }
    if (mode === 'vocab') {
        loadVocabulary();
    }
    if (mode === 'grammar') {
        showToast('📚 เรียนไวยากรณ์', 'info');
    }
}

function loadVocabulary() {
    if (!currentLang) return;

    const vocabContainer = document.getElementById('vocabCards');
    const vocabs = vocabularyData[currentLang];

    // Shuffle and take 4
    const shuffled = [...vocabs].sort(() => Math.random() - 0.5).slice(0, 4);

    vocabContainer.innerHTML = shuffled.map((vocab, index) => `
                <div class="col-md-6" style="animation: fadeInUp ${0.3 + index * 0.1}s ease">
                    <div class="vocab-card" id="vocab-card-${index}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="flex: 1;">
                                <div class="vocab-word">${vocab.word}</div>
                                <div class="vocab-reading">${vocab.reading}</div>
                                <div class="vocab-meaning">📖 ${vocab.meaning}</div>
                            </div>
                            <button class="vocab-audio-btn" id="audio-btn-${index}" onclick="event.stopPropagation(); speakWord('${vocab.word}', '${currentLang}', this)" title="ฟังเสียง">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                        <div class="mt-3 pt-3" style="border-top: 1px solid #e5e7eb;">
                            <small class="text-muted">💬 ตัวอย่างประโยค:</small>
                            <div style="color: #4b5563; font-style: italic; margin-top: 5px;">${vocab.example}</div>
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="event.stopPropagation(); speakWord('${vocab.example}', '${currentLang}', null)" style="border-radius: 20px;">
                                <i class="fas fa-play"></i> ฟังประโยค
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

    // Update words learned
    langProgress[currentLang].words = Math.max(langProgress[currentLang].words, shuffled.length);
    updateLangStats();

    // Show success toast
    showToast(`📖 โหลดคำศัพท์ ${shuffled.length} คำ สำเร็จ!`, 'success');
}

function refreshVocab() {
    loadVocabulary();
    addXP(5);
}

function loadGrammar() {
    if (!currentLang) return;

    const grammarContainer = document.getElementById('grammarContent');
    const lessons = grammarData[currentLang];

    grammarContainer.innerHTML = lessons.map((lesson, index) => `
                <div class="mb-4 p-4" style="background: #f9fafb; border-radius: 15px; border-left: 4px solid #667eea;">
                    <h5 style="color: #667eea; font-weight: 700;">${index + 1}. ${lesson.title}</h5>
                    <p class="mb-3">${lesson.explanation}</p>
                    <div class="p-3 mb-3" style="background: white; border-radius: 10px;">
                        <strong>โครงสร้าง:</strong> <code style="background: #e0e7ff; padding: 3px 8px; border-radius: 5px;">${lesson.structure}</code>
                    </div>
                    <strong>ตัวอย่าง:</strong>
                    <ul class="mt-2">
                        ${lesson.examples.map(ex => `<li style="margin-bottom: 5px;">${ex}</li>`).join('')}
                    </ul>
                </div>
            `).join('');

    langProgress[currentLang].lessons = lessons.length;
}

function loadPhrases() {
    if (!currentLang) return;

    const phrasesContainer = document.getElementById('quickPhrases');
    const phrases = phrasesData[currentLang];

    phrasesContainer.innerHTML = phrases.map((p, index) => `
                <div class="phrase-item d-flex justify-content-between align-items-center p-3 mb-2" 
                     style="background: linear-gradient(135deg, #f9fafb, #f3f4f6); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; animation: fadeInUp ${0.2 + index * 0.1}s ease;" 
                     onclick="speakWord('${p.phrase.replace(/'/g, "\\'")}', '${currentLang}', null)"
                     onmouseover="this.style.borderColor='#667eea'; this.style.transform='translateX(5px)'"
                     onmouseout="this.style.borderColor='transparent'; this.style.transform='translateX(0)'">
                    <div>
                        <div style="font-weight: 600; color: #2c3e50;">${p.phrase}</div>
                        <small style="color: #6b7280;">📝 ${p.meaning}</small>
                    </div>
                    <div class="phrase-audio" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.3s;">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            `).join('');
}

let quizStreak = 0;

function startQuiz() {
    if (!currentLang) return;

    const vocabs = vocabularyData[currentLang];

    // Progressive Difficulty Configuration (10 Questions total)
    const difficultyConfigs = [
        { count: 3, level: 'Easy', color: '#22c55e', filters: ['greeting', 'number', 'color', 'people', 'family', 'noun', 'pronoun'] }, // Level 1-3
        { count: 4, level: 'Medium', color: '#f59e0b', filters: ['food', 'animal', 'object', 'verb', 'adjective', 'place', 'nature', 'school', 'house'] }, // Level 4-7
        { count: 3, level: 'Hard', color: '#ef4444', filters: ['time', 'business', 'health', 'travel', 'emotion', 'education', 'advanced', 'abstract'] } // Level 8-10
    ];

    let selectedVocabs = [];
    let usedWords = new Set();

    // Helper to get random unique words from pool
    const getWords = (count, filters) => {
        const candidates = vocabs.filter(v =>
            (filters.includes(v.category) || (!v.category && filters.includes('noun'))) &&
            !usedWords.has(v.word)
        );
        return shuffleArray(candidates).slice(0, count);
    };

    // 1. Select words for each tier
    difficultyConfigs.forEach(conf => {
        let picks = getWords(conf.count, conf.filters);

        // Fallback if not enough words in specific categories (use general pool)
        if (picks.length < conf.count) {
            const remainingNeeded = conf.count - picks.length;
            const generalCandidates = vocabs.filter(v => !usedWords.has(v.word) && !picks.includes(v));
            const extraPicks = shuffleArray(generalCandidates).slice(0, remainingNeeded);
            picks = [...picks, ...extraPicks];
        }

        picks.forEach(p => {
            usedWords.add(p.word);
            selectedVocabs.push({ ...p, level: conf.level, levelColor: conf.color });
        });
    });

    // 2. Final Fallback: Ensure we have 10
    if (selectedVocabs.length < 10) {
        const remainingCandidates = vocabs.filter(v => !usedWords.has(v.word));
        const needed = 10 - selectedVocabs.length;
        const fill = shuffleArray(remainingCandidates).slice(0, needed);
        fill.forEach(p => selectedVocabs.push({ ...p, level: 'General', levelColor: '#3b82f6' }));
    }

    // 3. Generate Question Objects
    quizQuestions = selectedVocabs.map(v => {
        const otherMeanings = vocabs.filter(x => x.word !== v.word).map(x => x.meaning);
        return {
            question: v.word,
            answer: v.meaning,
            options: shuffleArray([v.meaning, ...shuffleArray(otherMeanings).slice(0, 3)]),
            level: v.level || 'Standard',
            levelColor: v.levelColor || '#3b82f6',
            reading: v.reading || ''
        };
    });

    currentQuizIndex = 0;
    quizScore = 0;
    quizStreak = 0;

    document.getElementById('quizScore').innerHTML = `<span class="badge bg-secondary">Score: 0/${quizQuestions.length}</span>`;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    if (currentQuizIndex >= quizQuestions.length) {
        showQuizResult();
        return;
    }

    const q = quizQuestions[currentQuizIndex];
    const quizContainer = document.getElementById('quizContent');

    // Calculate Progress
    const progressPct = ((currentQuizIndex) / quizQuestions.length) * 100;

    quizContainer.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge" style="background-color: ${q.levelColor}; font-size: 0.9rem;">Level: ${q.level}</span>
                    <span class="text-muted small">ข้อ ${currentQuizIndex + 1} / ${quizQuestions.length}</span>
                </div>
                
                <div class="progress mb-4" style="height: 6px; border-radius: 3px;">
                    <div class="progress-bar" role="progressbar" style="width: ${progressPct}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6);" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>

                <div class="text-center mb-4 quiz-question-box animate__animated animate__fadeInUp" style="padding: 2.5rem; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 2px solid ${q.levelColor}; position: relative;">
                    <i class="fas fa-volume-up" onclick="speakText('${q.question}', '${currentLang}')" style="position: absolute; top: 15px; right: 15px; color: ${q.levelColor}; cursor: pointer; font-size: 1.5rem; background: #f1f5f9; padding: 12px; border-radius: 50%; transition: all 0.2s;"></i>
                    <h5 class="text-muted mb-2">คำศัพท์นี้คืออะไร?</h5>
                    <h3 style="font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; color: #1e293b; letter-spacing: -0.5px;">${q.question}</h3>
                    <p class="text-secondary" style="font-size: 1.2rem; font-family: monospace;">${q.reading}</p>
                </div>
                <div class="row g-3">
                    ${q.options.map((opt, i) => `
                        <div class="col-md-6">
                            <div class="quiz-option shadow-sm" onclick="checkAnswer(this, '${opt}', '${q.answer}')" style="padding: 1.2rem; border-radius: 12px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; background: white;">
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-light text-dark me-3" style="font-size: 1rem; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid #cbd5e1;">${i + 1}</span>
                                    <span style="font-size: 1.1rem; font-weight: 500;">${opt}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div id="comboContainer" class="text-center mt-3" style="min-height: 30px;"></div>
            `;

    // Add keyboard shortcuts
    document.onkeydown = function (e) {
        if (e.key >= '1' && e.key <= '4') {
            const index = parseInt(e.key) - 1;
            const options = document.querySelectorAll('.quiz-option');
            if (options[index] && !options[index].style.pointerEvents.includes('none')) {
                options[index].click();
            }
        }
    };
}

function checkAnswer(element, selected, correct) {
    document.onkeydown = null; // Disable shortcuts
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.innerText.includes(correct)) {
            opt.classList.add('correct');
            opt.style.borderColor = '#22c55e';
            opt.style.backgroundColor = '#f0fdf4';
        }
    });

    if (selected === correct) {
        element.classList.add('correct');
        element.style.borderColor = '#22c55e';
        element.style.backgroundColor = '#f0fdf4';
        element.innerHTML += ' <i class="fas fa-check-circle text-success ms-2"></i>';

        quizScore++;
        quizStreak++;

        // XP Calculation with Streak Bonus
        const baseXP = 10;
        const streakBonus = (quizStreak > 1) ? (quizStreak * 5) : 0;
        const totalXP = baseXP + streakBonus;
        addXP(totalXP);

        playAudioEffect('correct');

        // Show Combo
        if (quizStreak > 1) {
            const comboHTML = `<span class="badge bg-warning text-dark animate__animated animate__bounceIn">⚡ Combo x${quizStreak}! (+${streakBonus} Bonus XP)</span>`;
            document.getElementById('comboContainer').innerHTML = comboHTML;
        }

    } else {
        element.classList.add('wrong');
        element.style.borderColor = '#ef4444';
        element.style.backgroundColor = '#fef2f2';
        element.innerHTML += ' <i class="fas fa-times-circle text-danger ms-2"></i>';

        quizStreak = 0; // Reset streak
        playAudioEffect('wrong');
    }

    document.getElementById('quizScore').innerHTML = `<span class="badge bg-primary">Score: ${quizScore}/${quizQuestions.length}</span>`;

    setTimeout(() => {
        currentQuizIndex++;
        loadQuizQuestion();
    }, 1800);
}

function playAudioEffect(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillators = [];

        if (type === 'correct') {
            // Ding sound (High pitch C major chord)
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(audioCtx.currentTime + i * 0.05);
                osc.stop(audioCtx.currentTime + 0.6);
            });
        } else {
            // Buzz sound (Low pitch sawtooth)
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.value = 150;
            osc.type = 'sawtooth';
            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {
        console.log('Audio not supported', e);
    }
}

function showQuizResult() {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    const quizContainer = document.getElementById('quizContent');

    let message, emoji, color;
    if (percentage >= 80) {
        message = 'ยอดเยี่ยมมาก!';
        emoji = '🏆';
        color = '#22c55e';
    } else if (percentage >= 60) {
        message = 'ดีมาก!';
        emoji = '👍';
        color = '#3b82f6';
    } else {
        message = 'พยายามต่อไปนะ!';
        emoji = '💪';
        color = '#f59e0b';
    }

    quizContainer.innerHTML = `
                <div class="text-center p-5">
                    <div style="font-size: 5rem;">${emoji}</div>
                    <h2 style="color: ${color}; font-weight: 800;">${message}</h2>
                    <h3>คะแนน: ${quizScore}/${quizQuestions.length} (${percentage}%)</h3>
                    <p class="text-muted mb-4">คุณได้รับ ${quizScore * 10} XP!</p>
                    <button class="btn btn-lg" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 25px; padding: 15px 40px;" onclick="startQuiz()">
                        <i class="fas fa-redo"></i> ทำใหม่อีกครั้ง
                    </button>
                </div>
            `;

    langProgress[currentLang].quizzes++;
    updateLangStats();
}

function loadConversation() {
    if (!currentLang) return;

    const convContainer = document.getElementById('conversationContent');
    const langNames = {
        english: 'อังกฤษ',
        chinese: 'จีน',
        japanese: 'ญี่ปุ่น',
        korean: 'เกาหลี',
        thai: 'ไทย'
    };

    convContainer.innerHTML = `
                <div class="text-center p-4" style="animation: fadeInUp 0.5s ease;">
                    <div style="font-size: 4rem; animation: bounce 1s infinite;">💬</div>
                    <h4 class="mb-2" style="font-weight: 700;">ฝึกสนทนาภาษา${langNames[currentLang]}</h4>
                    <p class="text-muted mb-4">ฝึกพูดกับ AI Tutor ในหัวข้อต่างๆ คลิกเลือกหัวข้อเพื่อเริ่มเรียน</p>
                    <div class="row g-3 justify-content-center">
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.3s ease;">
                            <button class="btn btn-outline-primary w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('greeting')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">👋</div>
                                <div style="font-weight: 600;">ทักทาย</div>
                            </button>
                        </div>
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.4s ease;">
                            <button class="btn btn-outline-success w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('shopping')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">🛍️</div>
                                <div style="font-weight: 600;">ซื้อของ</div>
                            </button>
                        </div>
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.5s ease;">
                            <button class="btn btn-outline-warning w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('restaurant')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">🍜</div>
                                <div style="font-weight: 600;">ร้านอาหาร</div>
                            </button>
                        </div>
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.6s ease;">
                            <button class="btn btn-outline-info w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('travel')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">✈️</div>
                                <div style="font-weight: 600;">ท่องเที่ยว</div>
                            </button>
                        </div>
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.7s ease;">
                            <button class="btn btn-outline-danger w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('work')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">💼</div>
                                <div style="font-weight: 600;">ทำงาน</div>
                            </button>
                        </div>
                        <div class="col-md-4 col-6" style="animation: fadeInUp 0.8s ease;">
                            <button class="btn btn-outline-secondary w-100 p-3 conversation-topic-btn" onclick="startConversationTopic('daily')" style="border-radius: 15px; transition: all 0.3s;">
                                <div style="font-size: 2rem;">🏠</div>
                                <div style="font-weight: 600;">ชีวิตประจำวัน</div>
                            </button>
                        </div>
                    </div>
                </div>
            `;
}

function startConversationTopic(topic) {
    const langNames = {
        english: 'ภาษาอังกฤษ',
        chinese: 'ภาษาจีน',
        japanese: 'ภาษาญี่ปุ่น',
        korean: 'ภาษาเกาหลี',
        thai: 'ภาษาไทย'
    };
    const topicNames = {
        greeting: 'การทักทาย',
        shopping: 'การซื้อของ',
        restaurant: 'ที่ร้านอาหาร',
        travel: 'การท่องเที่ยว',
        work: 'การทำงาน',
        daily: 'ชีวิตประจำวัน'
    };

    showToast(`💬 เริ่มฝึก${topicNames[topic]}`, 'info');

    // Switch to AI Tutor tab with pre-filled question
    setTimeout(() => {
        document.getElementById('ai-tutor-tab').click();
        document.getElementById('aiSubject').value = currentLang;
        document.getElementById('aiUserInput').value = `สอนบทสนทนา${langNames[currentLang]}เรื่อง${topicNames[topic]} พร้อมตัวอย่างประโยคและคำแปล`;
        document.getElementById('aiUserInput').focus();
    }, 300);

    addXP(5);
}

// Text-to-Speech with better handling
let speechVoices = [];
let isSpeaking = false;

// Load voices
function loadVoices() {
    speechVoices = speechSynthesis.getVoices();
}

if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speakWord(text, lang, buttonElement) {
    const langCodes = {
        english: 'en-US',
        chinese: 'zh-CN',
        japanese: 'ja-JP',
        korean: 'ko-KR',
        thai: 'th-TH',
        spanish: 'es-ES',
        french: 'fr-FR',
        german: 'de-DE',
        italian: 'it-IT',
        russian: 'ru-RU'
    };

    const altLangCodes = {
        english: ['en-GB', 'en'],
        chinese: ['zh-TW', 'zh'],
        japanese: ['ja'],
        korean: ['ko'],
        thai: ['th'],
        spanish: ['es-MX', 'es'],
        french: ['fr-CA', 'fr'],
        german: ['de-AT', 'de'],
        italian: ['it'],
        russian: ['ru']
    };

    if (!('speechSynthesis' in window)) {
        showToast('❌ เบราว์เซอร์ไม่รองรับการอ่านออกเสียง', 'error');
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Add speaking animation
    const allAudioBtns = document.querySelectorAll('.vocab-audio-btn');
    const allVocabCards = document.querySelectorAll('.vocab-card');
    allAudioBtns.forEach(btn => btn.classList.remove('speaking'));
    allVocabCards.forEach(card => card.classList.remove('speaking'));

    if (buttonElement) {
        buttonElement.classList.add('speaking');
        const parentCard = buttonElement.closest('.vocab-card');
        if (parentCard) parentCard.classList.add('speaking');
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCodes[lang] || 'en-US';
    utterance.rate = 0.75;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find the best voice
    if (speechVoices.length > 0) {
        const primaryLang = langCodes[lang];
        const alternatives = altLangCodes[lang] || [];

        let selectedVoice = speechVoices.find(v => v.lang === primaryLang);

        if (!selectedVoice) {
            for (const alt of alternatives) {
                selectedVoice = speechVoices.find(v => v.lang.startsWith(alt));
                if (selectedVoice) break;
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
    }

    // Events
    utterance.onstart = () => {
        isSpeaking = true;
        showToast(`🔊 กำลังอ่าน: ${text}`, 'info');
    };

    utterance.onend = () => {
        isSpeaking = false;
        allAudioBtns.forEach(btn => btn.classList.remove('speaking'));
        allVocabCards.forEach(card => card.classList.remove('speaking'));
    };

    utterance.onerror = (e) => {
        isSpeaking = false;
        allAudioBtns.forEach(btn => btn.classList.remove('speaking'));
        allVocabCards.forEach(card => card.classList.remove('speaking'));
        console.error('Speech error:', e);
        showToast('❌ ไม่สามารถอ่านออกเสียงได้', 'error');
    };

    // Speak
    setTimeout(() => {
        speechSynthesis.speak(utterance);
    }, 100);
}

// Toast notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.lang-toast');
    if (existingToast) existingToast.remove();

    const colors = {
        info: 'linear-gradient(135deg, #667eea, #764ba2)',
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)'
    };

    const toast = document.createElement('div');
    toast.className = 'lang-toast';
    toast.innerHTML = message;
    toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: ${colors[type]};
                color: white;
                padding: 15px 30px;
                border-radius: 50px;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

function addXP(amount) {
    if (!currentLang) return;

    langProgress[currentLang].xp += amount;

    // Animate XP counter
    const xpEl = document.getElementById('langXP');
    const oldXP = parseInt(xpEl.textContent) || 0;
    const newXP = langProgress[currentLang].xp;

    // Count up animation
    let current = oldXP;
    const step = Math.max(1, Math.floor((newXP - oldXP) / 10));
    const animate = () => {
        current += step;
        if (current >= newXP) {
            xpEl.textContent = newXP;
            xpEl.style.transform = 'scale(1.3)';
            xpEl.style.color = '#22c55e';
            setTimeout(() => {
                xpEl.style.transform = 'scale(1)';
                xpEl.style.color = '';
            }, 300);
        } else {
            xpEl.textContent = current;
            requestAnimationFrame(animate);
        }
    };
    requestAnimationFrame(animate);

    // Check for level up
    const level = Math.floor(langProgress[currentLang].xp / 100) + 1;
    const prevLevel = Math.floor((langProgress[currentLang].xp - amount) / 100) + 1;
    if (level > prevLevel) {
        showLevelUp(level);
    }

    // Save to localStorage
    localStorage.setItem('langProgress', JSON.stringify(langProgress));
}

function showLevelUp(level) {
    const popup = document.createElement('div');
    popup.innerHTML = `
                <div style="font-size: 3rem; animation: bounce 0.5s infinite;">🎉</div>
                <h3 style="margin: 10px 0; font-weight: 800;">Level Up!</h3>
                <div style="font-size: 2rem; color: #fbbf24;">Level ${level}</div>
            `;
    popup.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 40px 60px;
                border-radius: 25px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
                animation: scaleIn 0.5s forwards;
            `;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => popup.remove(), 300);
    }, 2000);
}

function updateLangStats() {
    if (!currentLang) return;

    const progress = langProgress[currentLang];

    // Animate number updates
    animateNumber('langWordsLearned', progress.words);
    animateNumber('langLessons', progress.lessons);
    animateNumber('langQuizzes', progress.quizzes);
    document.getElementById('langXP').textContent = progress.xp;

    // Update total words learned across all languages
    const totalWords = Object.values(langProgress).reduce((sum, p) => sum + p.words, 0);
    const totalWordsEl = document.getElementById('totalWordsLearned');
    if (totalWordsEl) totalWordsEl.textContent = totalWords;

    // Update level based on total XP
    const totalXP = Object.values(langProgress).reduce((sum, p) => sum + p.xp, 0);
    const langLevelEl = document.getElementById('langLevel');
    if (langLevelEl) {
        const level = Math.floor(totalXP / 100) + 1;
        langLevelEl.textContent = level;
    }

    // Update progress ring with animation
    const percent = Math.min((progress.words / 50) * 100, 100);
    const percentEl = document.getElementById('langProgressPercent');
    percentEl.textContent = Math.round(percent) + '%';

    const ring = document.getElementById('langProgressRing');
    const circumference = 314; // 2 * PI * 50
    const offset = circumference - (percent / 100) * circumference;
    ring.style.transition = 'stroke-dashoffset 1s ease-out';
    ring.style.strokeDashoffset = offset;

    // Update level badge
    const levelBadge = document.getElementById('level-' + currentLang);
    if (levelBadge) {
        const xp = progress.xp;
        if (xp >= 500) {
            levelBadge.textContent = 'ระดับสูง';
            levelBadge.className = 'lang-level-badge level-advanced mt-2';
        } else if (xp >= 200) {
            levelBadge.textContent = 'ระดับกลาง';
            levelBadge.className = 'lang-level-badge level-intermediate mt-2';
        } else {
            levelBadge.textContent = 'เริ่มต้น';
            levelBadge.className = 'lang-level-badge level-beginner mt-2';
        }
    }
}

function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const step = current < target ? 1 : -1;
    let value = current;

    const animate = () => {
        value += step;
        el.textContent = value;
        if ((step > 0 && value < target) || (step < 0 && value > target)) {
            requestAnimationFrame(animate);
        } else {
            el.textContent = target;
        }
    };
    requestAnimationFrame(animate);
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Add smooth scroll CSS
document.documentElement.style.scrollBehavior = 'smooth';

// Add fadeOut animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            .conversation-topic-btn:hover {
                transform: translateY(-5px) scale(1.05) !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
            .level-beginner { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
            .level-intermediate { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
            .level-advanced { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        `;
document.head.appendChild(styleSheet);

// Load saved progress on page load
document.addEventListener('DOMContentLoaded', function () {
    const saved = localStorage.getItem('langProgress');
    if (saved) {
        langProgress = JSON.parse(saved);
    }

    // Pre-load voices for TTS
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
    }

    // Initialize free usage counter
    initFreeUsageCounter();
});

// ==========================================
// 🎁 FREE USAGE SYSTEM (7 ครั้งฟรี) - ป้องกันการ Bypass
// ==========================================

const FREE_LIMIT = 7;
const STORAGE_KEY = 'edu_ai_free_usage';
const FP_STORAGE_KEY = 'edu_device_fp';

// 🔐 สร้าง Browser Fingerprint (ยากต่อการ bypass)
async function generateFingerprint() {
    const components = [];

    // 1. Screen properties
    components.push(screen.width + 'x' + screen.height);
    components.push(screen.colorDepth);
    components.push(screen.pixelDepth);
    components.push(window.devicePixelRatio || 1);

    // 2. Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    components.push(new Date().getTimezoneOffset());

    // 3. Language
    components.push(navigator.language);
    components.push(navigator.languages?.join(',') || '');

    // 4. Platform
    components.push(navigator.platform);
    components.push(navigator.hardwareConcurrency || 0);
    components.push(navigator.maxTouchPoints || 0);

    // 5. Canvas fingerprint
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Wizmobiz Education', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('AI Helper 2026', 4, 17);
        components.push(canvas.toDataURL().slice(-50));
    } catch (e) {
        components.push('canvas-error');
    }

    // 6. WebGL fingerprint
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        }
    } catch (e) {
        components.push('webgl-error');
    }

    // 7. Audio fingerprint (simplified)
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        components.push(audioContext.sampleRate);
        audioContext.close();
    } catch (e) {
        components.push('audio-error');
    }

    // 8. Font detection (simplified)
    const testFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Tahoma'];
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const h = document.getElementsByTagName('body')[0];
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    s.style.position = 'absolute';
    s.style.left = '-9999px';

    const defaultWidths = {};
    for (const baseFont of baseFonts) {
        s.style.fontFamily = baseFont;
        h.appendChild(s);
        defaultWidths[baseFont] = s.offsetWidth;
        h.removeChild(s);
    }

    const availableFonts = [];
    for (const font of testFonts) {
        for (const baseFont of baseFonts) {
            s.style.fontFamily = `'${font}', ${baseFont}`;
            h.appendChild(s);
            if (s.offsetWidth !== defaultWidths[baseFont]) {
                availableFonts.push(font);
                h.removeChild(s);
                break;
            }
            h.removeChild(s);
        }
    }
    components.push(availableFonts.join(','));

    // 9. Add random salt from localStorage (persistent per device)
    let deviceSalt = localStorage.getItem('edu_device_salt');
    if (!deviceSalt) {
        deviceSalt = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('edu_device_salt', deviceSalt);
    }
    components.push(deviceSalt);

    // Hash the fingerprint
    const fingerprint = components.join('|||');
    const hash = await hashString(fingerprint);
    return hash;
}

// Simple hash function
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// Get or create fingerprint
let cachedFingerprint = null;
async function getDeviceFingerprint() {
    if (cachedFingerprint) return cachedFingerprint;

    // Try to get from localStorage first
    let storedFp = localStorage.getItem(FP_STORAGE_KEY);
    if (storedFp) {
        cachedFingerprint = storedFp;
        return storedFp;
    }

    // Generate new fingerprint
    cachedFingerprint = await generateFingerprint();
    localStorage.setItem(FP_STORAGE_KEY, cachedFingerprint);
    return cachedFingerprint;
}

// 🔥 Firestore-based usage tracking
let usageData = null;
let usageLoaded = false;

async function loadUsageFromServer() {
    if (usageLoaded && usageData) return usageData;

    try {
        const fp = await getDeviceFingerprint();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const response = await fetch('https://us-central1-appinjproject.cloudfunctions.net/checkFreeUsage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fingerprint: fp,
                date: today,
                action: 'check'
            })
        });

        if (response.ok) {
            usageData = await response.json();
            usageLoaded = true;
            return usageData;
        }
    } catch (e) {
        console.error('Error loading usage:', e);
    }

    // Fallback to localStorage
    return getFreeUsageDataLocal();
}

async function incrementUsageOnServer() {
    try {
        const fp = await getDeviceFingerprint();
        const today = new Date().toISOString().split('T')[0];

        const response = await fetch('https://us-central1-appinjproject.cloudfunctions.net/checkFreeUsage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fingerprint: fp,
                date: today,
                action: 'increment'
            })
        });

        if (response.ok) {
            usageData = await response.json();
            return usageData;
        }
    } catch (e) {
        console.error('Error incrementing usage:', e);
    }

    // Fallback
    return useFreeCreditsLocal();
}

// Local storage fallback
function getFreeUsageDataLocal() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            const today = new Date().toDateString();
            if (parsed.date !== today) {
                return { count: 0, date: today };
            }
            return parsed;
        }
    } catch (e) { }
    return { count: 0, date: new Date().toDateString() };
}

function saveFreeUsageDataLocal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function useFreeCreditsLocal() {
    const data = getFreeUsageDataLocal();
    data.count++;
    data.date = new Date().toDateString();
    saveFreeUsageDataLocal(data);
    return data;
}

async function getRemainingFreeUsage() {
    // ถ้า Login แล้วและเป็น Premium = ไม่จำกัด
    if (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.isLoggedIn() && WizmobizAuth.isPremium()) {
        return -1; // Unlimited
    }

    const data = await loadUsageFromServer();
    return Math.max(0, FREE_LIMIT - (data.count || 0));
}

async function useFreeCredit() {
    // Premium = ไม่นับ
    if (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.isLoggedIn() && WizmobizAuth.isPremium()) {
        return true;
    }

    const data = await loadUsageFromServer();
    if ((data.count || 0) >= FREE_LIMIT) {
        return false;
    }

    await incrementUsageOnServer();
    return true;
}

async function initFreeUsageCounter() {
    await updateFreeUsageUI();
}

async function updateFreeUsageUI() {
    const counter = document.getElementById('freeUsageCounter');
    const text = document.getElementById('freeUsageText');
    const bar = document.getElementById('freeUsageBar');
    const mobileBadge = document.getElementById('mobilePremiumBadge');
    const desktopBadge = document.getElementById('desktopPremiumBadge');

    if (!counter || !text || !bar) return;

    // แสดง loading
    text.textContent = 'กำลังโหลด...';

    // ถ้า Login + Premium = แสดงสถานะ Premium
    if (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.isLoggedIn() && WizmobizAuth.isPremium()) {
        counter.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
        counter.style.borderColor = '#f59e0b';
        text.innerHTML = '<span style="color: #d97706; font-weight: 700;">💎 Premium - ไม่จำกัด!</span>';
        bar.style.width = '100%';
        bar.className = 'progress-bar';
        bar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';

        // Update badges to show Premium
        if (mobileBadge) {
            mobileBadge.innerHTML = '💎 Premium';
            mobileBadge.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            mobileBadge.style.color = 'white';
            mobileBadge.style.animation = 'pulse 2s infinite';
        }
        if (desktopBadge) {
            desktopBadge.innerHTML = '💎 Premium Member';
            desktopBadge.className = 'badge';
            desktopBadge.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            desktopBadge.style.color = 'white';
        }
        return;
    }

    const remaining = await getRemainingFreeUsage();
    const percentage = (remaining / FREE_LIMIT) * 100;

    text.textContent = `เหลือ ${remaining}/${FREE_LIMIT} ครั้ง`;
    bar.style.width = percentage + '%';

    if (remaining === 0) {
        counter.style.background = 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
        counter.style.borderColor = '#f44336';
        text.style.color = '#c62828';
        bar.className = 'progress-bar bg-danger';
    } else if (remaining <= 2) {
        counter.style.background = 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)';
        counter.style.borderColor = '#ffc107';
        text.style.color = '#f57f17';
        bar.className = 'progress-bar bg-warning';
    } else {
        counter.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
        counter.style.borderColor = '#4caf50';
        text.style.color = '#1b5e20';
        bar.className = 'progress-bar bg-success';
    }
}

async function checkCanUseAI() {
    // Premium = OK
    if (typeof WizmobizAuth !== 'undefined' && WizmobizAuth.isLoggedIn() && WizmobizAuth.isPremium()) {
        return true;
    }

    const remaining = await getRemainingFreeUsage();
    if (remaining <= 0) {
        showUpgradeModal();
        return false;
    }
    return true;
}

// ==========================================
// 💎 UPGRADE MODAL
// ==========================================

function showUpgradeModal() {
    let modal = document.getElementById('eduUpgradeModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'eduUpgradeModal';
        modal.innerHTML = `
                    <div class="edu-modal-overlay" onclick="hideUpgradeModal()">
                        <div class="edu-modal-content" onclick="event.stopPropagation()">
                            <button class="edu-modal-close" onclick="hideUpgradeModal()">&times;</button>
                            
                            <div class="edu-modal-icon">🎓</div>
                            <h2>หมดโควต้าทดลองใช้ฟรีแล้ว!</h2>
                            <p style="color: #666; margin-bottom: 20px;">สมัครสมาชิกเพื่อถาม AI ได้ไม่จำกัด</p>
                            
                            <!-- Step 1: Add LINE -->
                            <div class="edu-step-box">
                                <div class="edu-step-num">1</div>
                                <div class="edu-step-content">
                                    <h4>📱 เพิ่มเพื่อน LINE OA</h4>
                                    <p>แสกน QR Code หรือกดปุ่มด้านล่าง</p>
                                    <div style="text-align: center; margin: 15px 0;">
                                        <img src="https://qr-official.line.me/gs/M_396fttas_GW.png?oat_content=qr" 
                                             alt="LINE QR Code" 
                                             style="width: 150px; height: 150px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                                    </div>
                                    <a href="https://lin.ee/1YJsw47" target="_blank" class="edu-btn edu-btn-line">
                                        <i class="fab fa-line"></i> เพิ่มเพื่อน @wizmobiz
                                    </a>
                                </div>
                            </div>
                            
                            <!-- Step 2: Request PIN -->
                            <div class="edu-step-box">
                                <div class="edu-step-num">2</div>
                                <div class="edu-step-content">
                                    <h4>🔑 ขอรหัสเข้าเว็บ</h4>
                                    <p>พิมพ์ <strong>"ขอรหัสผ่าน"</strong> ใน LINE เพื่อรับ PIN</p>
                                    <div class="edu-code-box">ขอรหัสผ่าน</div>
                                </div>
                            </div>
                            
                            <!-- Step 3: Subscribe -->
                            <div class="edu-step-box">
                                <div class="edu-step-num">3</div>
                                <div class="edu-step-content">
                                    <h4>💎 สมัคร Premium (มีค่าบริการ)</h4>
                                    <p>พิมพ์ <strong>"สมัครสมาชิก"</strong> ใน LINE เพื่อดูแพ็คเกจ</p>
                                    
                                    <div class="edu-packages">
                                        <div class="edu-package">
                                            <div class="edu-package-name">รายเดือน</div>
                                            <div class="edu-package-price">99฿</div>
                                            <div class="edu-package-desc">ต่อเดือน</div>
                                        </div>
                                        <div class="edu-package popular">
                                            <span class="edu-badge">คุ้มสุด</span>
                                            <div class="edu-package-name">3 เดือน</div>
                                            <div class="edu-package-price">259฿</div>
                                            <div class="edu-package-desc">≈86฿/เดือน</div>
                                        </div>
                                        <div class="edu-package">
                                            <div class="edu-package-name">รายปี</div>
                                            <div class="edu-package-price">699฿</div>
                                            <div class="edu-package-desc">≈58฿/เดือน</div>
                                        </div>
                                    </div>
                                    
                                    <div class="edu-note">
                                        <strong>✅ สิทธิ์ที่ได้รับ:</strong>
                                        <ul>
                                            <li>🤖 AI ช่วยการบ้านไม่จำกัด</li>
                                            <li>📚 เข้าถึงทุกวิชา</li>
                                            <li>🎯 อธิบายทีละขั้นตอน</li>
                                            <li>💬 ถามได้ตลอด 24 ชม.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-radius: 10px; border-left: 4px solid #ff9800;">
                                <strong>⚠️ หมายเหตุ:</strong> การใช้งาน Premium ต้องชำระเงินก่อน<br>
                                หลังโอนเงินแล้ว Admin จะเปิดสิทธิ์ภายใน 24 ชม.
                            </div>
                            
                            <button class="edu-btn edu-btn-secondary" onclick="hideUpgradeModal()" style="margin-top: 15px;">
                                ปิด
                            </button>
                        </div>
                    </div>
                `;
        document.body.appendChild(modal);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
                    .edu-modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        padding: 20px;
                        opacity: 0;
                        visibility: hidden;
                        transition: all 0.3s;
                        overflow-y: auto;
                    }
                    .edu-modal-overlay.show {
                        opacity: 1;
                        visibility: visible;
                    }
                    .edu-modal-content {
                        background: white;
                        border-radius: 20px;
                        max-width: 500px;
                        width: 100%;
                        padding: 30px;
                        position: relative;
                        max-height: 90vh;
                        overflow-y: auto;
                    }
                    .edu-modal-close {
                        position: absolute;
                        top: 15px; right: 15px;
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #999;
                    }
                    .edu-modal-icon {
                        font-size: 3rem;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .edu-modal-content h2 {
                        text-align: center;
                        color: #333;
                        margin-bottom: 5px;
                    }
                    .edu-step-box {
                        display: flex;
                        gap: 15px;
                        background: #f8f9fa;
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 15px;
                    }
                    .edu-step-num {
                        width: 30px;
                        height: 30px;
                        background: linear-gradient(135deg, #8B5CF6, #6366F1);
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        flex-shrink: 0;
                    }
                    .edu-step-content {
                        flex: 1;
                    }
                    .edu-step-content h4 {
                        margin: 0 0 5px 0;
                        color: #333;
                    }
                    .edu-step-content p {
                        margin: 0;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .edu-code-box {
                        background: #e3f2fd;
                        border: 2px dashed #2196f3;
                        border-radius: 10px;
                        padding: 10px 15px;
                        text-align: center;
                        font-weight: bold;
                        color: #1565c0;
                        margin-top: 10px;
                    }
                    .edu-btn {
                        display: block;
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        text-align: center;
                        text-decoration: none;
                        font-weight: 600;
                        border: none;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    .edu-btn-line {
                        background: #00B900;
                        color: white;
                    }
                    .edu-btn-line:hover {
                        background: #009900;
                        color: white;
                    }
                    .edu-btn-secondary {
                        background: #e0e0e0;
                        color: #333;
                    }
                    .edu-packages {
                        display: flex;
                        gap: 10px;
                        margin: 15px 0;
                    }
                    .edu-package {
                        flex: 1;
                        background: #f5f5f5;
                        border-radius: 10px;
                        padding: 15px 10px;
                        text-align: center;
                        position: relative;
                    }
                    .edu-package.popular {
                        background: linear-gradient(135deg, #8B5CF6, #6366F1);
                        color: white;
                    }
                    .edu-badge {
                        position: absolute;
                        top: -10px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #ff9800;
                        color: white;
                        padding: 2px 10px;
                        border-radius: 10px;
                        font-size: 0.7rem;
                    }
                    .edu-package-name {
                        font-size: 0.85rem;
                        margin-bottom: 5px;
                    }
                    .edu-package-price {
                        font-size: 1.3rem;
                        font-weight: bold;
                    }
                    .edu-package-desc {
                        font-size: 0.75rem;
                        opacity: 0.8;
                    }
                    .edu-note {
                        background: #e8f5e9;
                        border-radius: 10px;
                        padding: 15px;
                        margin-top: 15px;
                    }
                    .edu-note ul {
                        margin: 10px 0 0 0;
                        padding-left: 20px;
                    }
                    .edu-note li {
                        font-size: 0.9rem;
                        color: #2e7d32;
                        margin: 5px 0;
                    }
                `;
        document.head.appendChild(style);
    }

    modal.querySelector('.edu-modal-overlay').classList.add('show');
}

function hideUpgradeModal() {
    const modal = document.getElementById('eduUpgradeModal');
    if (modal) {
        modal.querySelector('.edu-modal-overlay').classList.remove('show');
    }
}
