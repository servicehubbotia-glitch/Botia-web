(function () {
    'use strict';

    const WORKER_URL = 'https://botia-web.servicehub-botia.workers.dev';

    let currentLang = 'en';
    let chatTranslations = {};
    let pageSuggestions = {};
    let conversation = [];

    let container, chatWindow, toggleBtn, messagesEl, inputEl, sendBtn, closeBtn;
    let isOpen = false;

    // ============ IDIOMA ============
    function getCurrentLanguage() {
        const params = new URLSearchParams(window.location.search).get('lang');
        const supported = [
            'en','es','fr','de','it','pt','nl',
            'ru','zh','ar','tr','ro','pl','id'
        ];

        if (params && supported.includes(params)) return params;

        const saved = localStorage.getItem('botia-lang');
        if (saved && supported.includes(saved)) return saved;

        const lang =
            (navigator.language || 'en')
                .split('-')[0]
                .toLowerCase();

        return supported.includes(lang) ? lang : 'en';
    }

    function t(key) {
        return chatTranslations[key] || key;
    }

    // ============ CONTEXTO DE PÁGINA ============
    function getPageContext() {
        const params = new URLSearchParams(window.location.search);
        const pathname = window.location.pathname;
        const moduleName =
            document.body?.dataset?.botiaModule || '';

        const context = {
            page: moduleName || pathname,
            language: currentLang,
            url: window.location.href,
            title:
                document.querySelector('main h1, h1')?.textContent?.trim() ||
                document.title ||
                ''
        };

        if (pathname.startsWith('/regulatory/')) {
            context.page = 'regulatory';

            const ingredientFromUrl =
                params.get('ingredient');

            const ingredientFilter =
                document.getElementById('filter-substance');

            const ingredientFromFilter =
                ingredientFilter?.value || '';

            const ingredient =
                ingredientFromFilter || ingredientFromUrl;

            if (ingredient) {
                context.ingredient = ingredient;

                const selectedOption =
                    ingredientFilter?.options?.[
                        ingredientFilter.selectedIndex
                    ];

                if (
                    selectedOption?.textContent?.trim()
                ) {
                    context.ingredient_name =
                        selectedOption.textContent.trim();
                }
            }

            return context;
        }

        const ingredientMatch =
            pathname.match(
                /\/ingredients\/([^/]+)\.html$/i
            );

        if (ingredientMatch) {
            context.page = 'ingredient';
            context.ingredient =
                decodeURIComponent(
                    ingredientMatch[1]
                );

            const ingredientName =
                document
                    .getElementById('name')
                    ?.textContent
                    ?.trim();

            if (ingredientName) {
                context.ingredient_name =
                    ingredientName;
            }
        }

        return context;
    }

    function getPageText() {
        // Preferimos <main>: evita menú, footer y el propio chat.
        const source =
            document.querySelector('main') ||
            document.body;

        if (!source) return '';

        const clone = source.cloneNode(true);

        // Quitamos elementos que no son contenido informativo.
        clone
            .querySelectorAll(
                [
                    'script',
                    'style',
                    'noscript',
                    'svg',
                    'nav',
                    'footer',
                    'form',
                    'button',
                    'select',
                    'input',
                    'textarea',
                    '[aria-hidden="true"]'
                ].join(',')
            )
            .forEach(el => el.remove());

        const text =
            (clone.innerText || clone.textContent || '')
                .replace(/\u00a0/g, ' ')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n[ \t]+/g, '\n')
                .replace(/[ \t]{2,}/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

        // Límite suficientemente amplio para una página BOTIA.
        // Si una página futura supera esto, después pasaremos a troceado.
        return text.slice(0, 30000);
    }

    function buildWorkerContext() {
        return {
            ...getPageContext(),
            content: getPageText()
        };
    }

    // ============ TRADUCCIONES ============
    async function loadChatTranslations(lang) {
        try {
            const r = await fetch(
                '/i18n/' + lang + '/chat.json',
                { cache: 'no-store' }
            );

            if (!r.ok) {
                throw new Error('not found');
            }

            const data = await r.json();

            chatTranslations = data.ui || {};
            pageSuggestions =
                data.pageSuggestions || {};
        } catch (e) {
            try {
                const r2 = await fetch(
                    '/i18n/en/chat.json',
                    { cache: 'no-store' }
                );

                const data2 = await r2.json();

                chatTranslations =
                    data2.ui || {};

                pageSuggestions =
                    data2.pageSuggestions || {};
            } catch (e2) {
                chatTranslations = {};
                pageSuggestions = {};
            }
        }
    }

    // ============ PREGUNTAS SUGERIDAS ============
    function getPageSuggestions() {
        const context = getPageContext();
        const suggestions =
            pageSuggestions[context.page];

        return Array.isArray(suggestions)
            ? suggestions.slice(0, 3)
            : [];
    }

    function removePageSuggestions() {
        const old =
            messagesEl?.querySelector(
                '[data-page-suggestions]'
            );

        if (old) old.remove();
    }

    function showPageSuggestions() {
        const suggestions =
            getPageSuggestions();

        if (!suggestions.length) return;

        removePageSuggestions();

        const wrapper =
            document.createElement('div');

        wrapper.setAttribute(
            'data-page-suggestions',
            'true'
        );

        wrapper.style.cssText =
            'align-self:stretch;' +
            'background:rgba(255,255,255,0.04);' +
            'border:1px solid rgba(190,122,72,0.18);' +
            'border-radius:20px;' +
            'padding:0.9rem 1rem;';

        const title =
            document.createElement('div');

        title.textContent =
            t('suggestionsTitle') ||
            'Questions about this page';

        title.style.cssText =
            'color:#ffd8bd;' +
            'font-size:0.88rem;' +
            'font-weight:600;' +
            'margin-bottom:10px;';

        wrapper.appendChild(title);

        const list =
            document.createElement('div');

        list.style.cssText =
            'display:flex;' +
            'flex-direction:column;' +
            'gap:8px;';

        suggestions.forEach(
            function (question) {
                const btn =
                    document.createElement(
                        'button'
                    );

                btn.type = 'button';
                btn.className =
                    'botia-page-suggestion';

                btn.textContent = question;

                btn.style.cssText =
                    'width:100%;' +
                    'text-align:left;' +
                    'background:rgba(255,255,255,0.05);' +
                    'border:1px solid rgba(230,160,107,0.32);' +
                    'border-radius:14px;' +
                    'padding:0.7rem 0.85rem;' +
                    'color:#f2e4dc;' +
                    'cursor:pointer;' +
                    'font-family:inherit;' +
                    'font-size:0.9rem;' +
                    'line-height:1.35;';

                // No envía nada.
                // Solo coloca la sugerencia en el campo.
                btn.addEventListener(
                    'click',
                    function () {
                        inputEl.value =
                            question;

                        inputEl.focus();
                    }
                );

                list.appendChild(btn);
            }
        );

        wrapper.appendChild(list);
        messagesEl.appendChild(wrapper);

        messagesEl.scrollTop =
            messagesEl.scrollHeight;
    }

    // ============ ROBOT ============
    function getRobotSrc() {
        return getPageSuggestions().length
            ? '/botia/assets/robot/question.png'
            : '/botia/assets/robot/welcome.png';
    }

    function refreshContextualUi() {
        const robotImg =
            document.getElementById(
                'botia-robot-img'
            );

        if (robotImg) {
            robotImg.src = getRobotSrc();
        }

        if (inputEl) {
            inputEl.placeholder =
                t('pagePlaceholder') ||
                'Ask about this page…';
        }

        if (isOpen) {
            removePageSuggestions();

            if (
                getPageSuggestions().length
            ) {
                showPageSuggestions();
            }
        }
    }

    // ============ DOM ============
    function appendMessage(role, text) {
        const div =
            document.createElement('div');

        const base =
            'max-width:88%;' +
            'padding:0.7rem 1rem;' +
            'border-radius:20px;' +
            'font-size:0.93rem;' +
            'line-height:1.45;' +
            'word-break:break-word;';

        if (role === 'user') {
            div.style.cssText =
                base +
                'align-self:flex-end;' +
                'background:#e6a06b;' +
                'color:#100707;' +
                'border-bottom-right-radius:6px;';

            div.textContent = text;
        } else {
            div.style.cssText =
                base +
                'align-self:flex-start;' +
                'background:rgba(255,255,255,0.06);' +
                'color:#f2e4dc;' +
                'border:1px solid rgba(255,255,255,0.08);' +
                'border-bottom-left-radius:6px;';

            div.textContent = text;
        }

        messagesEl.appendChild(div);

        messagesEl.scrollTop =
            messagesEl.scrollHeight;

        return div;
    }

    function appendTyping() {
        const div =
            document.createElement('div');

        div.id = 'botia-typing';

        div.style.cssText =
            'align-self:flex-start;' +
            'background:rgba(255,255,255,0.06);' +
            'padding:0.7rem 1rem;' +
            'border-radius:20px;' +
            'border-bottom-left-radius:6px;';

        div.innerHTML =
            '<span style="display:inline-flex;gap:4px;">' +
            '<span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s infinite both;"></span>' +
            '<span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s 0.2s infinite both;"></span>' +
            '<span style="width:8px;height:8px;background:#c0a08c;border-radius:50%;display:inline-block;animation:botia-typing 1.4s 0.4s infinite both;"></span>' +
            '</span>';

        messagesEl.appendChild(div);

        messagesEl.scrollTop =
            messagesEl.scrollHeight;
    }

    function removeTyping() {
        const el =
            document.getElementById(
                'botia-typing'
            );

        if (el) el.remove();
    }

    // ============ IA ============
    async function sendToAI(message) {
        appendMessage('user', message);

        conversation.push({
            role: 'user',
            content: message
        });

        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;

        appendTyping();

        try {
            const response =
                await fetch(WORKER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        language: currentLang,
                        context:
                            buildWorkerContext(),
                        messages:
                            conversation.slice(-8)
                    })
                });

            removeTyping();

            if (!response.ok) {
                throw new Error(
                    'Worker error ' +
                    response.status
                );
            }

            const data =
                await response.json();

            const reply =
                data?.choices?.[0]
                    ?.message?.content ||
                t('connectionError') ||
                'No response.';

            appendMessage(
                'bot',
                reply
            );

            conversation.push({
                role: 'assistant',
                content: reply
            });

            if (window.botiaTalk) {
                window.botiaTalk();
            }
        } catch (err) {
            removeTyping();

            appendMessage(
                'bot',
                t('connectionError') ||
                'Connection error.'
            );
        }

        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
    }

    function handleSend() {
        const msg =
            inputEl.value.trim();

        if (!msg) return;

        sendToAI(msg);
    }

    // ============ CREAR ELEMENTOS ============
    function createElements() {
        container =
            document.createElement('div');

        container.id =
            'botia-chat-container';

        container.style.cssText =
            'position:fixed;' +
            'bottom:28px;' +
            'right:28px;' +
            'z-index:9999;' +
            'display:flex;' +
            'flex-direction:column;' +
            'align-items:flex-end;';

        chatWindow =
            document.createElement('div');

        chatWindow.id =
            'botia-chat-window';

        chatWindow.style.cssText =
            'display:none;' +
            'width:380px;' +
            'height:520px;' +
            'background:rgba(16,7,7,0.97);' +
            'border:1px solid rgba(190,122,72,0.3);' +
            'border-radius:28px;' +
            'overflow:hidden;' +
            'flex-direction:column;' +
            'box-shadow:0 20px 60px rgba(0,0,0,0.5);' +
            'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
            'margin-bottom:16px;';

        const header =
            document.createElement('div');

        header.style.cssText =
            'background:linear-gradient(135deg,#100707 0%,#241010 48%,#080505 100%);' +
            'padding:1rem 1.5rem;' +
            'border-bottom:1px solid rgba(190,122,72,0.2);' +
            'display:flex;' +
            'justify-content:space-between;' +
            'align-items:center;' +
            'flex-shrink:0;';

        const title =
            document.createElement('h3');

        title.style.cssText =
            'font-weight:500;' +
            'font-size:1.1rem;' +
            'color:#f2e4dc;' +
            'margin:0;';

        title.innerHTML =
            '<span style="color:#e6a06b;">BOTIA</span> · ' +
            '<span id="botia-chat-title">' +
            (t('title') || 'Assistant') +
            '</span>';

        header.appendChild(title);

        closeBtn =
            document.createElement('button');

        closeBtn.style.cssText =
            'background:transparent;' +
            'border:none;' +
            'color:#c0a08c;' +
            'font-size:1.4rem;' +
            'cursor:pointer;' +
            'padding:0 4px;' +
            'line-height:1;';

        closeBtn.textContent = '✕';

        header.appendChild(closeBtn);
        chatWindow.appendChild(header);

        messagesEl =
            document.createElement('div');

        messagesEl.id =
            'botia-messages';

        messagesEl.style.cssText =
            'flex:1;' +
            'padding:1rem 1.2rem;' +
            'overflow-y:auto;' +
            'display:flex;' +
            'flex-direction:column;' +
            'gap:0.6rem;' +
            'background:rgba(0,0,0,0.2);';

        chatWindow.appendChild(
            messagesEl
        );

        const footer =
            document.createElement('div');

        footer.style.cssText =
            'padding:0.7rem 1rem 1rem;' +
            'background:rgba(0,0,0,0.25);' +
            'border-top:1px solid rgba(190,122,72,0.15);' +
            'display:flex;' +
            'gap:0.5rem;' +
            'flex-shrink:0;';

        inputEl =
            document.createElement('input');

        inputEl.type = 'text';

        inputEl.placeholder =
            t('pagePlaceholder') ||
            'Ask about this page…';

        inputEl.style.cssText =
            'flex:1;' +
            'padding:0.7rem 1rem;' +
            'border-radius:60px;' +
            'border:1px solid rgba(190,122,72,0.42);' +
            'background:rgba(255,255,255,0.07);' +
            'color:#f2e4dc;' +
            'font-family:inherit;' +
            'font-size:0.95rem;' +
            'outline:none;';

        footer.appendChild(inputEl);

        sendBtn =
            document.createElement('button');

        sendBtn.textContent =
            t('sendButton') ||
            'Send';

        sendBtn.style.cssText =
            'background:#e6a06b;' +
            'border:none;' +
            'border-radius:60px;' +
            'padding:0 1.2rem;' +
            'font-weight:600;' +
            'color:#100707;' +
            'cursor:pointer;' +
            'font-size:0.9rem;' +
            'font-family:inherit;';

        footer.appendChild(sendBtn);
        chatWindow.appendChild(footer);

        toggleBtn =
            document.createElement('button');

        toggleBtn.id =
            'botia-toggle-btn';

        toggleBtn.setAttribute(
            'aria-label',
            t('openChatLabel') ||
            'Open BOTIA chat'
        );

        toggleBtn.style.cssText =
            'background:transparent;' +
            'border:none;' +
            'cursor:pointer;' +
            'padding:0;';

        toggleBtn.innerHTML =
            '<div class="botia-robot-wrap" style="position:relative;width:132px;height:132px;">' +
            '<img src="' +
            getRobotSrc() +
            '" alt="BOTIA" id="botia-robot-img" style="width:132px;height:132px;object-fit:contain;display:block;filter:drop-shadow(0 8px 30px rgba(230,160,107,0.5));transition:transform 0.3s ease;">' +
            '</div>';

        container.appendChild(
            chatWindow
        );

        container.appendChild(
            toggleBtn
        );

        document.body.appendChild(
            container
        );
    }

    // ============ OPEN / CLOSE ============
    function openChat() {
        chatWindow.style.display =
            'flex';

        isOpen = true;

        if (
            messagesEl.children.length === 0 &&
            getPageSuggestions().length
        ) {
            showPageSuggestions();
        }

        inputEl.focus();
    }

    function closeChat() {
        chatWindow.style.display =
            'none';

        isOpen = false;
    }

    // ============ EVENTOS ============
    function attachEvents() {
        toggleBtn.addEventListener(
            'click',
            function () {
                if (isOpen) {
                    closeChat();
                } else {
                    openChat();
                }
            }
        );

        closeBtn.addEventListener(
            'click',
            closeChat
        );

        sendBtn.addEventListener(
            'click',
            handleSend
        );

        inputEl.addEventListener(
            'keydown',
            function (e) {
                if (e.key === 'Enter') {
                    handleSend();
                }
            }
        );

        const robotImg =
            document.getElementById(
                'botia-robot-img'
            );

        if (robotImg) {
            toggleBtn.addEventListener(
                'mouseenter',
                function () {
                    robotImg.style.transform =
                        'scale(1.08) rotate(-3deg)';
                }
            );

            toggleBtn.addEventListener(
                'mouseleave',
                function () {
                    robotImg.style.transform =
                        'scale(1) rotate(0deg)';
                }
            );
        }

        window.botiaTalk =
            function () {
                const currentRobot =
                    document.getElementById(
                        'botia-robot-img'
                    );

                if (currentRobot) {
                    currentRobot.style.transform =
                        'scale(1.15) rotate(5deg)';

                    setTimeout(
                        function () {
                            currentRobot.style.transform =
                                'scale(1) rotate(0deg)';
                        },
                        300
                    );
                }
            };

        window.addEventListener(
            'storage',
            function (e) {
                if (
                    e.key !== 'botia-lang' ||
                    !e.newValue
                ) {
                    return;
                }

                const nextLang =
                    getCurrentLanguage();

                if (
                    nextLang === currentLang
                ) {
                    return;
                }

                currentLang =
                    nextLang;

                loadChatTranslations(
                    currentLang
                ).then(function () {
                    const titleEl =
                        document.getElementById(
                            'botia-chat-title'
                        );

                    if (titleEl) {
                        titleEl.textContent =
                            t('title') ||
                            'Assistant';
                    }

                    sendBtn.textContent =
                        t('sendButton') ||
                        'Send';

                    toggleBtn.setAttribute(
                        'aria-label',
                        t('openChatLabel') ||
                        'Open BOTIA chat'
                    );

                    refreshContextualUi();
                });
            }
        );
    }

    // ============ ESTILOS ============
    function addStyles() {
        const style =
            document.createElement('style');

        style.textContent = [
            '@keyframes botia-typing { 0%,80%,100%{transform:scale(0.4);opacity:0.4} 40%{transform:scale(1);opacity:1} }',
            '@keyframes botia-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }',
            '#botia-toggle-btn { animation:botia-float 3s ease-in-out infinite !important; }',
            '#botia-messages::-webkit-scrollbar { width:4px; }',
            '#botia-messages::-webkit-scrollbar-thumb { background:rgba(190,122,72,0.3);border-radius:12px; }',
            '@media (max-width:540px) {',
            '  #botia-chat-window { width:92vw !important;height:460px !important; }',
            '  #botia-chat-container { right:12px !important;bottom:12px !important; }',
            '  #botia-toggle-btn .botia-robot-wrap { width:120px !important;height:120px !important; }',
            '  #botia-toggle-btn img { width:120px !important;height:120px !important; }',
            '}'
        ].join('');

        document.head.appendChild(
            style
        );
    }

    // ============ INIT ============
    async function initChat() {
        currentLang =
            getCurrentLanguage();

        await loadChatTranslations(
            currentLang
        );

        addStyles();
        createElements();
        attachEvents();

        // No auto-open.
    }

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            initChat
        );
    } else {
        initChat();
    }
})();
