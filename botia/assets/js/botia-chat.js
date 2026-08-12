(function () {
    'use strict';

    const WORKER_URL = 'https://botia-web.servicehub-botia.workers.dev';
    const MAX_FREE_QUESTIONS = 3;
    const STORAGE_KEY = 'botia_chat_session';

    let currentLang = 'en';
    let freeQuestionsUsed = 0;
    let quizIndex = 0;
    let quizOrder = [];
    let chatTranslations = {};
    let quizQuestions = [];

    let container, chatWindow, toggleBtn, messagesEl, inputEl, sendBtn, closeBtn;
    let isOpen = false;

    // ============ IDIOMA ============
    function getCurrentLanguage() {
        const params = new URLSearchParams(window.location.search).get('lang');
        const supported = ['en','es','fr','de','it','pt','nl','ru','zh','ar','tr','ro','pl','id'];
        if (params && supported.includes(params)) return params;
        const saved = localStorage.getItem('botia-lang');
        if (saved && supported.includes(saved)) return saved;
        const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
        return supported.includes(lang) ? lang : 'en';
    }

    function t(key) {
        return chatTranslations[key] || key;
    }

    // ============ TRADUCCIONES ============
    async function loadChatTranslations(lang) {
        try {
            const r = await fetch('/i18n/' + lang + '/chat.json');
            if (!r.ok) throw new Error('not found');
            const data = await r.json();
            chatTranslations = data.ui || {};
            quizQuestions = data.questions || [];
        } catch (e) {
            try {
                const r2 = await fetch('/i18n/en/chat.json');
                const data2 = await r2.json();
                chatTranslations = data2.ui || {};
                quizQuestions = data2.questions || [];
            } catch (e2) {
                chatTranslations = {};
                quizQuestions = [];
            }
        }
    }

    // ============ QUIZ ============
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function getCurrentQuestion() {
        if (!quizQuestions.length) return null;
        if (!quizOrder.length) quizOrder = shuffle(quizQuestions.map(function(_, i) { return i; }));
        if (quizIndex >= quizOrder.length) {
            quizOrder = shuffle(quizQuestions.map(function(_, i) { return i; }));
            quizIndex = 0;
        }
        return quizQuestions[quizOrder[quizIndex]];
    }

    // ============ PERSISTENCIA ============
    function saveSession() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                freeQuestionsUsed: freeQuestionsUsed,
                quizIndex: quizIndex,
                quizOrder: quizOrder
            }));
        } catch(e) {}
    }

    function loadSession() {
        try {
            const s = sessionStorage.getItem(STORAGE_KEY);
            if (s) {
                const d = JSON.parse(s);
                freeQuestionsUsed = d.freeQuestionsUsed || 0;
                quizIndex = d.quizIndex || 0;
                quizOrder = Array.isArray(d.quizOrder) ? d.quizOrder : [];
            }
        } catch(e) {
            freeQuestionsUsed = 0;
            quizIndex = 0;
            quizOrder = [];
        }
    }

    // ============ DOM ============
    function appendMessage(role, text) {
        const div = document.createElement('div');
        const base = 'max-width:88%;padding:0.7rem 1rem;border-radius:20px;font-size:0.93rem;line-height:1.45;word-break:break-word;';
        if (role === 'user') {
            div.style.cssText = base + 'align-self:flex-end;background:#e6a06b;color:#100707;border-bottom-right-radius:6px;';
            div.textContent = text;
        } else {
            div.style.cssText = base + 'align-self:flex-start;background:rgba(255,255,255,0.06);color:#f2e4dc;border:1px solid rgba(255,255,255,0.08);border-bottom-left-radius:6px;';
            // Convertir enlaces en elementos <a> clickeables
            const partes = text.split(/(https?:\/\/[^\s]+)/g);
            partes.forEach(function(p) {
                if (/^https?:\/\//.test(p)) {
                    const a = document.createElement('a');
                    a.href = p;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.textContent = p;
                    a.style.cssText = 'color:#e6a06b;text-decoration:underline;word-break:break-all;';
                    div.appendChild(a);
                } else {
                    div.appendChild(document.createTextNode(p));
                }
            });
        }
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function appendTyping() {
        const div = document.createElement('div');
        div.id = 'botia-typing';
        div.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.06);padding:0.7rem 1rem;border-radius:20px;border-bottom-left-radius:6px;';
        div.innerHTML = '<span style="display:inline-flex;gap:4px;"><span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s infinite both;"></span><span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s 0.2s infinite both;"></span><span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s 0.4s infinite both;"></span></span>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function removeTyping() {
        const el = document.getElementById('botia-typing');
        if (el) el.remove();
    }

    // ============ QUIZ UI ============
    function showQuizQuestion() {
        if (!quizQuestions.length) return;

        const q = getCurrentQuestion();
        if (!q) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-quiz-msg', 'true');
        wrapper.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.06);color:#f2e4dc;border:1px solid rgba(255,255,255,0.08);border-bottom-left-radius:6px;max-width:88%;padding:0.8rem 1rem;border-radius:20px;font-size:0.93rem;line-height:1.5;word-break:break-word;';

        const textDiv = document.createElement('div');
        textDiv.textContent = q.text || '';
        textDiv.style.cssText = 'font-weight:600;color:#ffd8bd;margin-bottom:8px;';
        wrapper.appendChild(textDiv);

        if (q.answer) {
            const answerDiv = document.createElement('div');
            answerDiv.textContent = q.answer;
            answerDiv.style.cssText = 'color:#c0a08c;font-size:0.88rem;line-height:1.5;';
            wrapper.appendChild(answerDiv);
        }

        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;';

        const discoverBtn = document.createElement('a');
        discoverBtn.href = q.link || '#';
        discoverBtn.target = '_blank';
        discoverBtn.rel = 'noopener';
        discoverBtn.textContent = t('discoverButton') || 'Discover on BOTIA';
        discoverBtn.style.cssText = 'background:#e6a06b;border-radius:60px;padding:0.4rem 1.2rem;font-weight:600;color:#100707;text-decoration:none;display:inline-block;font-size:0.85rem;';
        btns.appendChild(discoverBtn);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = t('nextButton') || 'Next question';
        nextBtn.style.cssText = 'background:transparent;border:1px solid #e6a06b;border-radius:60px;padding:0.4rem 1.2rem;font-weight:600;color:#e6a06b;cursor:pointer;font-size:0.85rem;font-family:inherit;';
        nextBtn.addEventListener('click', function() {
            advanceQuiz();
        });
        btns.appendChild(nextBtn);

        wrapper.appendChild(btns);

        messagesEl.appendChild(wrapper);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function advanceQuiz() {
        const quizMsgs = messagesEl.querySelectorAll('[data-quiz-msg]');
        quizMsgs.forEach(function(el) { el.remove(); });

        quizIndex++;
        saveSession();
        showQuizQuestion();
    }

    // ============ IA ============
    async function sendToAI(message) {
        if (freeQuestionsUsed >= MAX_FREE_QUESTIONS) {
            appendMessage('bot', t('limitMessage') || "You've used your 3 free questions.");
            return;
        }

        appendMessage('user', message);
        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;

        appendTyping();

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: message }], language: currentLang })
            });

            removeTyping();

            if (!response.ok) throw new Error('Worker error');
            const data = await response.json();
            const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || 'No response.';
            appendMessage('bot', reply);
            freeQuestionsUsed++;
            if (window.botiaTalk) window.botiaTalk();
            saveSession();

            if (freeQuestionsUsed >= MAX_FREE_QUESTIONS) {
                appendMessage('bot', t('limitMessage') || "You've used your 3 free questions.");
            }
        } catch (err) {
            removeTyping();
            appendMessage('bot', t('connectionError') || 'Connection error.');
        }

        inputEl.disabled = false;
        sendBtn.disabled = false;
        if (freeQuestionsUsed < MAX_FREE_QUESTIONS) inputEl.focus();
    }

    function handleSend() {
        const msg = inputEl.value.trim();
        if (!msg) return;
        const nextWords = ['siguiente', 'next', 'nächste', 'suivant', 'prossimo', 'próximo', 'weiter', 'next question', 'siguiente pregunta', 'volgende', 'следующий', 'sonraki', 'următorul', 'następne', 'selanjutnya', 'التالي', '下一个'];
        if (nextWords.includes(msg.toLowerCase())) {
            advanceQuiz();
            inputEl.value = '';
            return;
        }
        sendToAI(msg);
    }

    // ============ CREAR ELEMENTOS ============
    function createElements() {
        container = document.createElement('div');
        container.id = 'botia-chat-container';
        container.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;';

        chatWindow = document.createElement('div');
        chatWindow.id = 'botia-chat-window';
        chatWindow.style.cssText = 'display:none;width:380px;height:520px;background:rgba(16,7,7,0.97);border:1px solid rgba(190,122,72,0.3);border-radius:28px;overflow:hidden;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin-bottom:16px;';

        const header = document.createElement('div');
        header.style.cssText = 'background:linear-gradient(135deg,#100707 0%,#241010 48%,#080505 100%);padding:1rem 1.5rem;border-bottom:1px solid rgba(190,122,72,0.2);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;';

        const title = document.createElement('h3');
        title.style.cssText = 'font-weight:500;font-size:1.1rem;color:#f2e4dc;margin:0;';
        title.innerHTML = '🤖 <span style="color:#e6a06b;">BOTIA</span> · <span id="botia-chat-title">' + t('title') + '</span>';
        header.appendChild(title);

        closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'background:transparent;border:none;color:#c0a08c;font-size:1.4rem;cursor:pointer;padding:0 4px;line-height:1;';
        closeBtn.textContent = '✕';
        header.appendChild(closeBtn);

        chatWindow.appendChild(header);

        messagesEl = document.createElement('div');
        messagesEl.id = 'botia-messages';
        messagesEl.style.cssText = 'flex:1;padding:1rem 1.2rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.6rem;background:rgba(0,0,0,0.2);';
        chatWindow.appendChild(messagesEl);

        const footer = document.createElement('div');
        footer.style.cssText = 'padding:0.7rem 1rem 1rem;background:rgba(0,0,0,0.25);border-top:1px solid rgba(190,122,72,0.15);display:flex;gap:0.5rem;flex-shrink:0;';

        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.placeholder = t('placeholder') || "Ask or type 'next'…";
        inputEl.style.cssText = 'flex:1;padding:0.7rem 1rem;border-radius:60px;border:1px solid rgba(190,122,72,0.42);background:rgba(255,255,255,0.07);color:#f2e4dc;font-family:inherit;font-size:0.95rem;outline:none;';
        footer.appendChild(inputEl);

        sendBtn = document.createElement('button');
        sendBtn.textContent = t('sendButton') || 'Send';
        sendBtn.style.cssText = 'background:#e6a06b;border:none;border-radius:60px;padding:0 1.2rem;font-weight:600;color:#100707;cursor:pointer;font-size:0.9rem;font-family:inherit;';
        footer.appendChild(sendBtn);

        chatWindow.appendChild(footer);

        toggleBtn = document.createElement('button');
        toggleBtn.id = 'botia-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'Open BOTIA chat');
        toggleBtn.style.cssText = 'background:transparent;border:none;cursor:pointer;padding:0;';
        toggleBtn.innerHTML = '<div style="position:relative;width:100px;height:100px;"><div id="botia-notification" style="position:absolute;top:-10px;right:-10px;min-width:28px;height:28px;background:#ff4444;border-radius:50%;border:3px solid #100707;display:none;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;padding:0 6px;z-index:10;">1</div><img src="/botia/assets/robot.png" alt="BOTIA" id="botia-robot-img" style="width:100px;height:100px;object-fit:contain;display:block;filter:drop-shadow(0 8px 30px rgba(230,160,107,0.5));transition:transform 0.3s ease;"></div>';

        container.appendChild(chatWindow);
        container.appendChild(toggleBtn);
        document.body.appendChild(container);
    }

    // ============ OPEN / CLOSE ============
    function openChat() {
        chatWindow.style.display = 'flex';
        isOpen = true;
        if (window.clearBotiaNotification) window.clearBotiaNotification();

        if (messagesEl.children.length === 0) {
            appendMessage('bot', t('welcome') || "👋 Hi! I'm the BOTIA assistant.");
            setTimeout(showQuizQuestion, 600);
        }

        if (freeQuestionsUsed < MAX_FREE_QUESTIONS) inputEl.focus();
    }

    function closeChat() {
        chatWindow.style.display = 'none';
        isOpen = false;
    }

    // ============ EVENTOS ============
    function attachEvents() {
        toggleBtn.addEventListener('click', function() {
            if (isOpen) closeChat(); else openChat();
        });

        closeBtn.addEventListener('click', closeChat);
        sendBtn.addEventListener('click', handleSend);
        inputEl.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') handleSend();
        });

        const robotImg = document.getElementById('botia-robot-img');
        const notif = document.getElementById('botia-notification');

        if (robotImg) {
            toggleBtn.addEventListener('mouseenter', function() { robotImg.style.transform = 'scale(1.08) rotate(-3deg)'; });
            toggleBtn.addEventListener('mouseleave', function() { robotImg.style.transform = 'scale(1) rotate(0deg)'; });
        }

        window.botiaTalk = function() {
            if (robotImg) {
                robotImg.style.transform = 'scale(1.15) rotate(5deg)';
                setTimeout(function() { robotImg.style.transform = 'scale(1) rotate(0deg)'; }, 300);
            }
        };

        window.showBotiaNotification = function(count) {
            if (notif) { notif.style.display = 'flex'; notif.textContent = count > 9 ? '9+' : count; }
        };

        window.clearBotiaNotification = function() {
            if (notif) notif.style.display = 'none';
        };

        window.addEventListener('storage', function(e) {
            if (e.key === 'botia-lang' && e.newValue && e.newValue !== currentLang) {
                currentLang = e.newValue;
                loadChatTranslations(currentLang).then(function() {
                    const titleEl = document.getElementById('botia-chat-title');
                    if (titleEl) titleEl.textContent = t('title');
                    inputEl.placeholder = t('placeholder');
                    sendBtn.textContent = t('sendButton');
                });
            }
        });
    }

    // ============ ESTILOS ============
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = [
            '@keyframes botia-typing { 0%,80%,100%{transform:scale(0.4);opacity:0.4} 40%{transform:scale(1);opacity:1} }',
            '@keyframes botia-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }',
            '@keyframes botia-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }',
            '#botia-toggle-btn { animation: botia-float 3s ease-in-out infinite !important; }',
            '#botia-notification { animation: botia-pulse 1.5s ease-in-out infinite !important; }',
            '#botia-messages::-webkit-scrollbar { width:4px; }',
            '#botia-messages::-webkit-scrollbar-thumb { background:rgba(190,122,72,0.3);border-radius:12px; }',
            '@media (max-width:540px) {',
            '  #botia-chat-window { width:92vw !important; height:460px !important; }',
            '  #botia-chat-container { right:12px !important; bottom:12px !important; }',
            '  #botia-toggle-btn img { width:120px !important; height:120px !important; }',
            '}'
        ].join('');
        document.head.appendChild(style);
    }

    // ============ INIT ============
    async function initChat() {
        currentLang = getCurrentLanguage();
        await loadChatTranslations(currentLang);
        loadSession();

        if (quizQuestions.length > 0 && quizOrder.length === 0) {
            quizOrder = shuffle(quizQuestions.map(function(_, i) { return i; }));
            saveSession();
        }

        addStyles();
        createElements();
        attachEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChat);
    } else {
        initChat();
    }

})();
