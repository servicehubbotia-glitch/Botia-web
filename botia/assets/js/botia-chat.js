// ============================================================
//  BOTIA CHAT v2.0 - Modo Quiz + Chat Libre
//  El bot lanza preguntas y el usuario puede preguntar
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  CONFIGURACIÓN
    // ============================================================
    const WORKER_URL = 'https://botia-web.servicehub-botia.workers.dev';
    const MAX_QUESTIONS = 3;
    const STORAGE_KEY = 'botia_chat_session';

    // ============================================================
    //  ESTADO DEL CHAT
    // ============================================================
    let currentLang = 'en';
    let conversationCount = 0;
    let quizIndex = 0;
    let quizOrder = [];
    let chatTranslations = null;
    let quizQuestions = [];

    // ============================================================
    //  FUNCIONES DE IDIOMA
    // ============================================================
    function getCurrentLanguage() {
        const savedLang = localStorage.getItem('botia-lang');
        if (savedLang) return savedLang;
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        const langCode = browserLang.split('-')[0].toLowerCase();
        const supported = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ar', 'hi', 'ko', 'tr', 'ro', 'pl', 'id'];
        return supported.includes(langCode) ? langCode : 'en';
    }

    // ============================================================
    //  CARGAR TRADUCCIONES DESDE JSON
    // ============================================================
    async function loadChatTranslations(lang) {
        try {
            const response = await fetch(`/i18n/${lang}/chat.json`);
            if (!response.ok) throw new Error('JSON not found');
            const data = await response.json();
            chatTranslations = data.ui || {};
            quizQuestions = data.questions || [];
            return true;
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar ${lang}, usando inglés como fallback`);
            try {
                const fallbackResponse = await fetch('/i18n/en/chat.json');
                const fallbackData = await fallbackResponse.json();
                chatTranslations = fallbackData.ui || {};
                quizQuestions = fallbackData.questions || [];
                return true;
            } catch (e) {
                console.error('❌ Error cargando traducciones:', e);
                chatTranslations = {};
                quizQuestions = [];
                return false;
            }
        }
    }

    function t(key) {
        if (!chatTranslations) return key;
        return chatTranslations[key] || key;
    }

    // ============================================================
    //  FUNCIONES DEL QUIZ
    // ============================================================
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function getCurrentQuestion() {
        if (!quizQuestions || quizQuestions.length === 0) return null;
        if (quizIndex >= quizQuestions.length) return null;
        return quizQuestions[quizOrder[quizIndex]];
    }

    function getQuestionText(q) {
        return q?.text || 'Question not available';
    }

    function getQuestionLink(q) {
        return q?.link || '#';
    }

    function getQuizProgress() {
        if (!quizQuestions || quizQuestions.length === 0) return '0 / 0';
        return `${Math.min(quizIndex + 1, quizQuestions.length)} / ${quizQuestions.length}`;
    }

    function isQuizComplete() {
        if (!quizQuestions || quizQuestions.length === 0) return true;
        return quizIndex >= quizQuestions.length;
    }

    // ============================================================
    //  INICIALIZAR SESIÓN
    // ============================================================
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            conversationCount = data.count || 0;
            quizIndex = data.quizIndex || 0;
            quizOrder = data.quizOrder || [];
        }
    } catch (e) {
        conversationCount = 0;
        quizIndex = 0;
        quizOrder = [];
    }

    // ============================================================
    //  CREAR ELEMENTOS DEL CHAT
    // ============================================================
    let container, chatWindow, toggleBtn, messagesEl, inputEl, sendBtn, closeBtn, quizProgress;
    let isOpen = false;

    function createChatElements() {
        container = document.createElement('div');
        container.id = 'chat-container';
        container.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;';

        chatWindow = document.createElement('div');
        chatWindow.id = 'chat-window';
        chatWindow.style.cssText = 'display:none;width:380px;height:520px;background:rgba(16,7,7,0.94);backdrop-filter:blur(12px);border:1px solid rgba(190,122,72,0.3);border-radius:28px;overflow:hidden;box-shadow:0 24px 48px -12px rgba(0,0,0,0.8);flex-direction:column;margin-bottom:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
        chatWindow.innerHTML = `
            <div style="background:linear-gradient(135deg,#100707 0%,#241010 48%,#080505 100%);padding:1rem 1.5rem;border-bottom:1px solid rgba(190,122,72,0.2);display:flex;justify-content:space-between;align-items:center;">
                <h3 style="font-weight:500;font-size:1.1rem;color:#f2e4dc;margin:0;">🤖 <span style="color:#e6a06b;">BOTIA</span> · <span id="chatTitle">${t('title')}</span></h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span id="quizProgress" style="font-size:0.65rem;background:rgba(230,160,107,0.15);color:#c0a08c;padding:0.2rem 0.6rem;border-radius:20px;border:1px solid rgba(190,122,72,0.2);letter-spacing:0.5px;">${getQuizProgress()}</span>
                    <button id="chatClose" style="background:transparent;border:none;color:#c0a08c;font-size:1.4rem;cursor:pointer;padding:0 4px;">✕</button>
                </div>
            </div>
            <div id="chatMessages" style="flex:1;padding:1rem 1.2rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.6rem;background:rgba(0,0,0,0.2);color:#f2e4dc;"></div>
            <div style="padding:0.7rem 1rem 1rem;background:rgba(0,0,0,0.25);border-top:1px solid rgba(190,122,72,0.15);display:flex;gap:0.5rem;">
                <input id="chatInput" type="text" placeholder="${t('placeholder')}" style="flex:1;padding:0.7rem 1rem;border-radius:60px;border:1px solid rgba(190,122,72,0.42);background:rgba(255,255,255,0.04);color:#f2e4dc;font-size:0.95rem;outline:none;font-family:inherit;" />
                <button id="chatSend" style="background:#e6a06b;border:none;border-radius:60px;padding:0 1.2rem;font-weight:600;color:#100707;cursor:pointer;font-size:0.9rem;font-family:inherit;">${t('send')}</button>
            </div>
        `;

        toggleBtn = document.createElement('button');
        toggleBtn.id = 'chatToggle';
        toggleBtn.setAttribute('aria-label', 'Abrir chat');
        toggleBtn.style.cssText = `
            position: relative;
            width: auto;
            height: auto;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 0;
            animation: float 3s ease-in-out infinite;
            transition: transform 0.3s ease;
        `;
        toggleBtn.innerHTML = `
            <div style="position:relative;width:100px;height:100px;">
                <div id="botiaNotification" style="
                    position:absolute;
                    top:-10px;
                    right:-10px;
                    min-width:28px;
                    height:28px;
                    background:#ff4444;
                    border-radius:50%;
                    border:3px solid #100707;
                    display:none;
                    align-items:center;
                    justify-content:center;
                    font-size:14px;
                    font-weight:800;
                    color:white;
                    padding:0 6px;
                    z-index:10;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                    animation:pulse-notification 1.5s ease-in-out infinite;
                    box-shadow:0 4px 12px rgba(255,68,68,0.4);
                ">1</div>
                <img src="/botia/assets/robot.png" 
                     alt="BOTIA Robot" 
                     id="robotImage"
                     style="
                         width:100px;
                         height:100px;
                         object-fit:contain;
                         display:block;
                         filter:drop-shadow(0 8px 30px rgba(230,160,107,0.5));
                         transition:transform 0.3s ease;
                     " />
            </div>
        `;

        container.appendChild(chatWindow);
        container.appendChild(toggleBtn);
        document.body.appendChild(container);

        messagesEl = document.getElementById('chatMessages');
        inputEl = document.getElementById('chatInput');
        sendBtn = document.getElementById('chatSend');
        closeBtn = document.getElementById('chatClose');
        quizProgress = document.getElementById('quizProgress');

        // ============================================================
        //  FUNCIONES DEL CHAT
        // ============================================================
        function appendMessage(role, text, isHTML = false) {
            const div = document.createElement('div');
            div.style.cssText = `max-width:88%;padding:0.7rem 1rem;border-radius:20px;font-size:0.93rem;line-height:1.45;word-break:break-word;animation:fadeUp 0.2s ease;${role === 'user' ? 'align-self:flex-end;background:#e6a06b;color:#100707;border-bottom-right-radius:6px;' : 'align-self:flex-start;background:rgba(255,255,255,0.06);color:#f2e4dc;border-bottom-left-radius:6px;'}`;
            if (isHTML) {
                div.innerHTML = text;
            } else {
                const linkified = text.replace(
                    /(https?:\/\/[^\s]+)/g,
                    '<a href="$1" target="_blank" rel="noopener" style="color:#e6a06b;text-decoration:underline;text-underline-offset:2px;">$1</a>'
                );
                div.innerHTML = linkified;
            }
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return div;
        }

        function appendTyping() {
            const div = document.createElement('div');
            div.id = 'typing-indicator';
            div.style.cssText = 'align-self:flex-start;background:rgba(255,255,255,0.06);color:#f2e4dc;padding:0.7rem 1rem;border-radius:20px;border-bottom-left-radius:6px;';
            div.innerHTML = `<span style="display:inline-flex;gap:4px;align-items:center;"><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;"></span><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;animation-delay:0.2s;"></span><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;animation-delay:0.4s;"></span></span>`;
            messagesEl.appendChild(div);
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return div;
        }

        function removeTyping() {
            const typing = document.getElementById('typing-indicator');
            if (typing) typing.remove();
        }

        function updateQuizProgress() {
            if (quizProgress) {
                quizProgress.textContent = getQuizProgress();
            }
        }

        // ============================================================
        //  MOSTRAR PREGUNTA DEL QUIZ (VERSIÓN CORREGIDA - SIN SOBRESCRITURA)
        // ============================================================
        function showQuizQuestion() {
            console.log(`📊 showQuizQuestion - quizIndex actual: ${quizIndex}`);
            console.log(`📊 Total preguntas: ${quizQuestions.length}`);
            
            const q = getCurrentQuestion();
            if (!q) {
                appendMessage('bot', t('quizDone') || '🎉 You\'ve seen all questions!');
                updateQuizProgress();
                return;
            }

            const questionText = getQuestionText(q);
            const link = getQuestionLink(q);
            
            const html = `
                <div style="margin-bottom:8px;" data-quiz-id="${q.id || 'unknown'}">
                    <div>${questionText}</div>
                    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                        <a href="${link}" target="_blank" rel="noopener" style="background:#e6a06b;border:none;border-radius:60px;padding:0.4rem 1.2rem;font-weight:600;color:#100707;text-decoration:none;font-size:0.8rem;display:inline-block;">🔍 ${t('discoverBtn') || 'Discover on BOTIA'}</a>
                        <button onclick="window.dispatchEvent(new CustomEvent('nextQuiz'))" style="background:transparent;border:1px solid #e6a06b;border-radius:60px;padding:0.4rem 1.2rem;font-weight:500;color:#e6a06b;cursor:pointer;font-size:0.8rem;font-family:inherit;">➡️ ${t('nextButton') || 'Next question'}</button>
                    </div>
                    <div style="font-size:0.65rem;color:#8a8a8a;margin-top:4px;text-align:right;">${getQuizProgress()}</div>
                </div>
            `;
            
            appendMessage('bot', html, true);
            updateQuizProgress();
        }

        // ============================================================
        //  ENVIAR MENSAJE A LA IA
        // ============================================================
        async function sendToAI(message) {
            if (conversationCount >= MAX_QUESTIONS) {
                appendMessage('bot', t('limitMessage') || 'You\'ve used your 3 free questions.');
                return;
            }

            appendMessage('user', message);
            inputEl.value = '';
            inputEl.disabled = true;
            sendBtn.disabled = true;

            const typing = appendTyping();

            try {
                const response = await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'user', content: message }], 
                        language: currentLang 
                    })
                });

                removeTyping();

                if (!response.ok) throw new Error('Worker error');
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content || 'No pude obtener una respuesta.';
                appendMessage('bot', reply);
                conversationCount++;
                
                if (window.botiaTalk) window.botiaTalk();
                
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                    count: conversationCount,
                    quizIndex: quizIndex,
                    quizOrder: quizOrder
                }));
                
                if (conversationCount >= MAX_QUESTIONS) {
                    appendMessage('bot', t('limitMessage') || 'You\'ve used your 3 free questions.');
                }
            } catch (err) {
                removeTyping();
                console.error('Error:', err);
                appendMessage('bot', t('connectionError') || 'Connection error. Please check your network.');
            }

            inputEl.disabled = false;
            sendBtn.disabled = false;
            if (conversationCount < MAX_QUESTIONS) inputEl.focus();
        }

        // ============================================================
        //  MANEJAR ENVÍO DE MENSAJE
        // ============================================================
        function handleSend() {
            const message = inputEl.value.trim();
            if (!message) return;

            const nextWords = ['siguiente', 'next', 'nächste', 'suivant', 'prossimo', 'próximo', 'weiter', 'next question', 'siguiente pregunta'];
            if (nextWords.includes(message.toLowerCase())) {
                if (isQuizComplete()) {
                    appendMessage('bot', t('noMoreQuestions') || 'No more questions!');
                    inputEl.value = '';
                    return;
                }
                quizIndex++;
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                    count: conversationCount,
                    quizIndex: quizIndex,
                    quizOrder: quizOrder
                }));
                showQuizQuestion();
                inputEl.value = '';
                return;
            }

            sendToAI(message);
        }

        // ============================================================
        //  EVENTOS
        // ============================================================
        toggleBtn.addEventListener('click', () => {
            if (isOpen) {
                chatWindow.style.display = 'none';
                isOpen = false;
            } else {
                chatWindow.style.display = 'flex';
                isOpen = true;
                
                if (window.clearBotiaNotification) window.clearBotiaNotification();
                
                if (messagesEl.children.length === 0) {
                    appendMessage('bot', t('welcome') || '👋 Hi! I\'m the BOTIA assistant.');
                    setTimeout(showQuizQuestion, 500);
                } else {
                    updateQuizProgress();
                }
                if (conversationCount < MAX_QUESTIONS) inputEl.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            chatWindow.style.display = 'none';
            isOpen = false;
        });

        sendBtn.addEventListener('click', handleSend);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });

        // ============================================================
        //  EVENTO NEXTQUIZ (VERSIÓN DEFINITIVA)
        // ============================================================
        document.addEventListener('nextQuiz', () => {
            console.log('🔄 Avanzando a la siguiente pregunta...');
            console.log(`   quizIndex ANTES: ${quizIndex}`);
            console.log(`   Total preguntas: ${quizQuestions.length}`);
            
            // Verificar si hay más preguntas
            if (quizIndex + 1 >= quizQuestions.length) {
                appendMessage('bot', t('noMoreQuestions') || 'No more questions!');
                updateQuizProgress();
                return;
            }
            
            // Avanzar
            quizIndex = quizIndex + 1;
            console.log(`   quizIndex DESPUÉS: ${quizIndex}`);
            
            // Guardar en sessionStorage
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                    count: conversationCount,
                    quizIndex: quizIndex,
                    quizOrder: quizOrder
                }));
                console.log('   ✅ Guardado en sessionStorage');
            } catch (e) {
                console.warn('   ⚠️ Error guardando en sessionStorage:', e);
            }
            
            // Mostrar la siguiente pregunta
            showQuizQuestion();
        });

        // ============================================================
        //  INTERACCIONES DEL ROBOT
        // ============================================================
        setTimeout(() => {
            const robotImage = document.getElementById('robotImage');
            const notification = document.getElementById('botiaNotification');

            if (robotImage) {
                toggleBtn.addEventListener('mouseenter', () => {
                    robotImage.style.transform = 'scale(1.08) rotate(-3deg)';
                });
                toggleBtn.addEventListener('mouseleave', () => {
                    robotImage.style.transform = 'scale(1) rotate(0deg)';
                });
                toggleBtn.addEventListener('click', () => {
                    robotImage.style.transform = 'scale(0.85)';
                    setTimeout(() => {
                        robotImage.style.transform = 'scale(1)';
                    }, 200);
                });
            }

            window.botiaTalk = function() {
                if (robotImage) {
                    robotImage.style.transform = 'scale(1.15) rotate(5deg)';
                    setTimeout(() => {
                        robotImage.style.transform = 'scale(1) rotate(0deg)';
                    }, 300);
                }
            };

            window.showBotiaNotification = function(count) {
                if (notification) {
                    notification.style.display = 'flex';
                    notification.textContent = count > 9 ? '9+' : count;
                }
            };

            window.clearBotiaNotification = function() {
                if (notification) {
                    notification.style.display = 'none';
                }
            };
        }, 100);

        // ============================================================
        //  DETECTAR CAMBIOS DE IDIOMA
        // ============================================================
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'botia-lang' && value !== currentLang) {
                currentLang = value;
                document.getElementById('chatTitle').textContent = t('title');
                inputEl.placeholder = t('placeholder');
                sendBtn.textContent = t('sendButton');
                loadChatTranslations(currentLang).then(() => {
                    // Actualizar mensajes existentes? Solo si es necesario
                });
            }
        };

        // ============================================================
        //  INICIO
        // ============================================================
        console.log('🤖 BOTIA Chat v2.0 cargado');
        console.log(`🌍 Idioma: ${currentLang}`);
        console.log(`📊 Progreso: ${getQuizProgress()}`);
        console.log(`🔗 Worker: ${WORKER_URL}`);
    }

    // ============================================================
    //  INICIALIZACIÓN PRINCIPAL
    // ============================================================
    async function initChat() {
        currentLang = getCurrentLanguage();
        await loadChatTranslations(currentLang);
        
        if (quizQuestions.length > 0 && quizOrder.length === 0) {
            quizOrder = shuffleArray(quizQuestions.map((_, i) => i));
        }
        
        createChatElements();
    }

    // Estilos globales
    const style = document.createElement('style');
    style.textContent = `
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
        }
        @keyframes pulse-notification {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        #chatToggle {
            position: relative;
            width: auto !important;
            height: auto !important;
            background: transparent !important;
            border: none !important;
            cursor: pointer !important;
            padding: 0 !important;
            animation: float 3s ease-in-out infinite !important;
            transition: transform 0.3s ease !important;
            z-index: 1000 !important;
        }
        #chatToggle div {
            width: 100px !important;
            height: 100px !important;
            position: relative !important;
        }
        #chatToggle img {
            width: 100px !important;
            height: 100px !important;
            object-fit: contain !important;
            display: block !important;
            filter: drop-shadow(0 8px 30px rgba(230, 160, 107, 0.5)) !important;
            transition: transform 0.3s ease !important;
        }
        #chatToggle img:hover {
            transform: scale(1.1) rotate(-3deg) !important;
            filter: drop-shadow(0 12px 40px rgba(230, 160, 107, 0.7)) !important;
        }
        #botiaNotification {
            position: absolute !important;
            top: -10px !important;
            right: -10px !important;
            min-width: 28px !important;
            height: 28px !important;
            background: #ff4444 !important;
            border-radius: 50% !important;
            border: 3px solid #100707 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            color: white !important;
            padding: 0 6px !important;
            z-index: 10 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            animation: pulse-notification 1.5s ease-in-out infinite !important;
            box-shadow: 0 4px 12px rgba(255, 68, 68, 0.4) !important;
        }
        @media (max-width: 768px) {
            #chatToggle div { width: 130px !important; height: 130px !important; }
            #chatToggle img { width: 130px !important; height: 130px !important; }
            #botiaNotification { min-width: 34px !important; height: 34px !important; font-size: 16px !important; top: -12px !important; right: -12px !important; }
        }
        @media (max-width: 540px) {
            #chatToggle div { width: 120px !important; height: 120px !important; }
            #chatToggle img { width: 120px !important; height: 120px !important; }
            #botiaNotification { min-width: 30px !important; height: 30px !important; font-size: 14px !important; top: -10px !important; right: -10px !important; }
            #chat-window { width: 92vw !important; height: 420px !important; right: 0 !important; }
            #chat-container { right: 12px !important; bottom: 12px !important; }
        }
    `;
    document.head.appendChild(style);

    // Iniciar
    initChat();

})();
