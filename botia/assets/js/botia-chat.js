// ============================================================
//  BOTIA CHAT - Versión Frontend
//  Conecta con tu Worker de Cloudflare
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  CONFIGURACIÓN
    // ============================================================
    // ⚠️ IMPORTANTE: Cambia esta URL por la de tu Worker
    const WORKER_URL = 'https://botia-web.servicehub-botia.workers.dev';
    const MAX_QUESTIONS = 3;
    const STORAGE_KEY = 'botia_chat_session';

    // ============================================================
    //  DETECCIÓN DE IDIOMA
    // ============================================================
    function getCurrentLanguage() {
        // Intentar leer de tu localStorage (selector de idiomas de BOTIA)
        const savedLang = localStorage.getItem('botia-lang');
        if (savedLang) return savedLang;

        // Detectar del navegador
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        const supported = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ar', 'hi', 'ko'];
        return supported.includes(langCode) ? langCode : 'en';
    }

    let currentLang = getCurrentLanguage();

    // ============================================================
    //  TRADUCCIONES (UI del chat)
    // ============================================================
    // Estas traducciones son SOLO para la interfaz (botones, placeholders)
    // Las respuestas del bot las traduce la IA automáticamente
    const UI_TRANSLATIONS = {
        'en': {
            title: 'chat',
            placeholder: 'Ask a question…',
            send: 'Send',
            welcome: '👋 Hello! I\'m the BOTIA assistant. Ask me about ingredients, labels, or food additives.',
            limit: 'You\'ve used your 3 free questions. For unlimited queries, download the BOTIA app.',
            limitBtn: 'Go to BOTIA',
            offTopic: 'I can only help with questions about food ingredients and labels.',
            error: 'Sorry, there was a problem with the service. Please try again later.',
            connectionError: 'Connection error. Please check your network.'
        },
        'es': {
            title: 'chat',
            placeholder: 'Escribe tu pregunta…',
            send: 'Enviar',
            welcome: '👋 ¡Hola! Soy el asistente de BOTIA. Pregúntame sobre ingredientes, etiquetas o aditivos alimentarios.',
            limit: 'Has usado tus 3 preguntas gratuitas. Para consultas ilimitadas, descarga la app BOTIA.',
            limitBtn: 'Ir a BOTIA',
            offTopic: 'Solo puedo ayudarte con preguntas sobre ingredientes y etiquetas alimentarias.',
            error: 'Lo siento, hubo un problema con el servicio. Intenta de nuevo más tarde.',
            connectionError: 'Error de conexión. Comprueba tu red.'
        },
        'fr': {
            title: 'chat',
            placeholder: 'Posez une question…',
            send: 'Envoyer',
            welcome: '👋 Bonjour ! Je suis l\'assistant BOTIA. Posez-moi des questions sur les ingrédients, les étiquettes ou les additifs alimentaires.',
            limit: 'Vous avez utilisé vos 3 questions gratuites. Pour des requêtes illimitées, téléchargez l\'application BOTIA.',
            limitBtn: 'Aller à BOTIA',
            offTopic: 'Je ne peux vous aider qu\'avec des questions sur les ingrédients et étiquettes alimentaires.',
            error: 'Désolé, un problème est survenu avec le service. Veuillez réessayer plus tard.',
            connectionError: 'Erreur de connexion. Vérifiez votre réseau.'
        },
        'de': {
            title: 'Chat',
            placeholder: 'Stelle eine Frage…',
            send: 'Senden',
            welcome: '👋 Hallo! Ich bin der BOTIA-Assistent. Frag mich nach Zutaten, Etiketten oder Lebensmittelzusatzstoffen.',
            limit: 'Du hast deine 3 kostenlosen Fragen verwendet. Für unbegrenzte Fragen lade die BOTIA-App herunter.',
            limitBtn: 'Zu BOTIA',
            offTopic: 'Ich kann nur bei Fragen zu Lebensmittelzutaten und Etiketten helfen.',
            error: 'Entschuldigung, es gab ein Problem mit dem Dienst. Bitte versuche es später erneut.',
            connectionError: 'Verbindungsfehler. Bitte überprüfe dein Netzwerk.'
        },
        'it': {
            title: 'chat',
            placeholder: 'Fai una domanda…',
            send: 'Invia',
            welcome: '👋 Ciao! Sono l\'assistente BOTIA. Chiedimi informazioni su ingredienti, etichette o additivi alimentari.',
            limit: 'Hai usato le tue 3 domande gratuite. Per domande illimitate, scarica l\'app BOTIA.',
            limitBtn: 'Vai a BOTIA',
            offTopic: 'Posso aiutarti solo con domande su ingredienti ed etichette alimentari.',
            error: 'Spiacenti, si è verificato un problema con il servizio. Riprova più tardi.',
            connectionError: 'Errore di connessione. Controlla la tua rete.'
        },
        'pt': {
            title: 'chat',
            placeholder: 'Faça uma pergunta…',
            send: 'Enviar',
            welcome: '👋 Olá! Sou o assistente BOTIA. Pergunte-me sobre ingredientes, rótulos ou aditivos alimentares.',
            limit: 'Você usou suas 3 perguntas gratuitas. Para consultas ilimitadas, baixe o aplicativo BOTIA.',
            limitBtn: 'Ir para BOTIA',
            offTopic: 'Só posso ajudar com perguntas sobre ingredientes e rótulos alimentares.',
            error: 'Desculpe, houve um problema com o serviço. Tente novamente mais tarde.',
            connectionError: 'Erro de conexão. Verifique sua rede.'
        }
    };

    function t(key) {
        const keys = key.split('.');
        let value = UI_TRANSLATIONS[currentLang];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback a inglés
                let fallback = UI_TRANSLATIONS['en'];
                for (const fk of keys) {
                    fallback = fallback?.[fk];
                }
                return fallback || key;
            }
        }
        return value || key;
    }

    // ============================================================
    //  INICIALIZAR SESIÓN
    // ============================================================
    let conversationCount = 0;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            conversationCount = data.count || 0;
        }
    } catch (e) {
        conversationCount = 0;
    }

    // ============================================================
    //  CREAR ELEMENTOS DEL CHAT
    // ============================================================
    // Contenedor principal
    const container = document.createElement('div');
    container.id = 'chat-container';
    container.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    `;

    // Ventana del chat
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chat-window';
    chatWindow.style.cssText = `
        display: none;
        width: 350px;
        height: 450px;
        background: rgba(16, 7, 7, 0.94);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(190, 122, 72, 0.3);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.8);
        flex-direction: column;
        margin-bottom: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    chatWindow.innerHTML = `
        <div class="chat-header" style="background: linear-gradient(135deg, #100707 0%, #241010 48%, #080505 100%); padding: 1rem 1.5rem; border-bottom: 1px solid rgba(190,122,72,0.2); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-weight: 500; font-size: 1.1rem; color: #f2e4dc; margin: 0;">🤖 <span style="color: #e6a06b;">BOTIA</span> · <span id="chatTitle">${t('title')}</span></h3>
            <span style="font-size: 0.65rem; background: rgba(230,160,107,0.15); color: #c0a08c; padding: 0.2rem 0.6rem; border-radius: 20px; border: 1px solid rgba(190,122,72,0.2); letter-spacing: 0.5px;">🔒 local</span>
            <button id="chatClose" style="background: transparent; border: none; color: #c0a08c; font-size: 1.4rem; cursor: pointer; padding: 0 4px; line-height: 1;">✕</button>
        </div>
        <div id="chatMessages" style="flex: 1; padding: 1rem 1.2rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; background: rgba(0,0,0,0.2); color: #f2e4dc;"></div>
        <div style="padding: 0.7rem 1rem 1rem; background: rgba(0,0,0,0.25); border-top: 1px solid rgba(190,122,72,0.15); display: flex; gap: 0.5rem;">
            <input id="chatInput" type="text" placeholder="${t('placeholder')}" autocomplete="off" style="flex: 1; padding: 0.7rem 1rem; border-radius: 60px; border: 1px solid rgba(190,122,72,0.42); background: rgba(255,255,255,0.04); color: #f2e4dc; font-size: 0.95rem; outline: none; font-family: inherit;" />
            <button id="chatSend" style="background: #e6a06b; border: none; border-radius: 60px; padding: 0 1.2rem; font-weight: 600; color: #100707; cursor: pointer; font-size: 0.9rem; font-family: inherit; white-space: nowrap;">${t('send')}</button>
        </div>
    `;

    // Botón flotante
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'chatToggle';
    toggleBtn.setAttribute('aria-label', 'Abrir chat');
    toggleBtn.style.cssText = `
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: #e6a06b;
        border: none;
        box-shadow: 0 8px 24px rgba(230,160,107,0.35);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        color: #100707;
        padding: 0;
    `;
    toggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" style="fill: currentColor;">
            <path d="M12 2C6.48 2 2 6.04 2 11c0 2.93 1.52 5.57 3.87 7.16L4.5 21.5l4.04-1.88C9.64 20.16 10.8 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2zm0 16c-1.1 0-2.16-.22-3.13-.6l-2.5 1.17 1.17-2.42C6.2 15.2 5.5 13.2 5.5 11c0-3.86 3.14-7 6.5-7s6.5 3.14 6.5 7-2.64 7-6.5 7z"/>
        </svg>
    `;

    container.appendChild(chatWindow);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);

    // ============================================================
    //  REFERENCIAS
    // ============================================================
    const messagesEl = document.getElementById('chatMessages');
    const inputEl = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');
    const closeBtn = document.getElementById('chatClose');

    // ============================================================
    //  FUNCIONES DEL CHAT
    // ============================================================
    function appendMessage(role, text, isTyping = false) {
        const div = document.createElement('div');
        div.style.cssText = `
            max-width: 88%;
            padding: 0.7rem 1rem;
            border-radius: 20px;
            font-size: 0.93rem;
            line-height: 1.45;
            word-break: break-word;
            animation: fadeUp 0.2s ease;
            ${role === 'user' 
                ? 'align-self: flex-end; background: #e6a06b; color: #100707; border-bottom-right-radius: 6px;' 
                : 'align-self: flex-start; background: rgba(255,255,255,0.06); color: #f2e4dc; border-bottom-left-radius: 6px;'
            }
        `;
        
        if (isTyping) {
            div.innerHTML = `<span style="display:inline-flex;gap:4px;align-items:center;"><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;"></span><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;animation-delay:0.2s;"></span><span style="display:inline-block;width:8px;height:8px;background:#c0a08c;border-radius:50%;animation:typing 1.4s infinite both;animation-delay:0.4s;"></span></span>`;
            div.id = 'typing-indicator';
        } else if (role === 'bot' && typeof text === 'string') {
            const linkified = text.replace(
                /(https?:\/\/[^\s]+)/g,
                '<a href="$1" target="_blank" rel="noopener" style="color:#e6a06b;text-decoration:underline;text-underline-offset:2px;">$1</a>'
            );
            div.innerHTML = linkified;
        } else {
            div.textContent = text;
        }
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function removeTypingIndicator() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    function appendLimitMessage() {
        const div = document.createElement('div');
        div.style.cssText = `
            align-self: center;
            background: rgba(230,160,107,0.1);
            border: 1px solid rgba(230,160,107,0.2);
            color: #f2e4dc;
            text-align: center;
            max-width: 95%;
            border-radius: 24px;
            padding: 1rem 1.2rem;
        `;
        div.innerHTML = `
            <div>${t('limit')}</div>
            <a href="https://www.botia-safefood.com" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;background:#e6a06b;color:#100707;padding:0.4rem 1.6rem;border-radius:60px;font-weight:600;margin-top:0.6rem;">${t('limitBtn')}</a>
        `;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addWelcome() {
        if (messagesEl.children.length === 0) {
            appendMessage('bot', t('welcome'));
            if (conversationCount >= MAX_QUESTIONS) {
                appendLimitMessage();
                inputEl.disabled = true;
                sendBtn.disabled = true;
            }
        }
    }

    // ============================================================
    //  ENVIAR MENSAJE
    // ============================================================
    async function handleSend() {
        const message = inputEl.value.trim();
        if (!message) return;
        
        if (conversationCount >= MAX_QUESTIONS) {
            appendMessage('bot', t('limit'));
            appendLimitMessage();
            inputEl.value = '';
            return;
        }

        appendMessage('user', message);
        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;

        appendMessage('bot', '', true);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: message }
                    ],
                    language: currentLang
                })
            });

            removeTypingIndicator();

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Worker error:', errorData);
                appendMessage('bot', t('error'));
            } else {
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content || 'No pude obtener una respuesta.';
                appendMessage('bot', reply);
                conversationCount++;
                
                try {
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count: conversationCount }));
                } catch (e) {}
                
                if (conversationCount >= MAX_QUESTIONS) {
                    appendLimitMessage();
                    inputEl.disabled = true;
                    sendBtn.disabled = true;
                }
            }
        } catch (err) {
            removeTypingIndicator();
            console.error('Error en chat:', err);
            appendMessage('bot', t('connectionError'));
        }

        inputEl.disabled = false;
        sendBtn.disabled = false;
        if (conversationCount < MAX_QUESTIONS) {
            inputEl.focus();
        }
    }

    // ============================================================
    //  EVENTOS
    // ============================================================
    let isOpen = false;

    toggleBtn.addEventListener('click', () => {
        if (isOpen) {
            chatWindow.style.display = 'none';
            isOpen = false;
        } else {
            chatWindow.style.display = 'flex';
            isOpen = true;
            addWelcome();
            if (conversationCount < MAX_QUESTIONS) {
                inputEl.focus();
            }
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
    //  DETECTAR CAMBIOS DE IDIOMA EN LOCALSTORAGE
    // ============================================================
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'botia-lang' && value !== currentLang) {
            currentLang = value;
            // Actualizar textos de la UI
            document.getElementById('chatTitle').textContent = t('title');
            inputEl.placeholder = t('placeholder');
            sendBtn.textContent = t('send');
            // Si el chat está vacío, actualizar bienvenida
            if (messagesEl.children.length === 0) {
                addWelcome();
            }
        }
    };

    // ============================================================
    //  ESTILOS GLOBALES (animaciones)
    // ============================================================
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
        @media (max-width: 540px) {
            #chat-window {
                width: 92vw !important;
                height: 420px !important;
                right: 0 !important;
            }
            #chat-container {
                right: 16px !important;
                bottom: 16px !important;
            }
            #chatToggle {
                width: 56px !important;
                height: 56px !important;
            }
            #chatToggle svg {
                width: 28px !important;
                height: 28px !important;
            }
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    //  INICIO
    // ============================================================
    console.log('🤖 BOTIA Chat cargado correctamente');
    console.log(`🌍 Idioma: ${currentLang}`);
    console.log(`📊 Preguntas usadas: ${conversationCount}/${MAX_QUESTIONS}`);
    console.log(`🔗 Worker: ${WORKER_URL}`);

})();