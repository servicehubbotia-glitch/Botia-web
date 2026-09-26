(function () {
    'use strict';

    const WORKER_URL = 'https://botia-web.servicehub-botia.workers.dev';

    let currentLang = 'en';
    let chatTranslations = {};
    let pageSuggestions = {};
    let conversation = [];

    let container, chatWindow, toggleBtn, messagesEl, inputEl, sendBtn, closeBtn;
    let isOpen = false;
    let robotStateTimer = null;

    // ============================================================
    // IDIOMA
    // ============================================================

    function getCurrentLanguage() {
        const params = new URLSearchParams(window.location.search).get('lang');

        const supported = [
            'en','es','fr','de','it','pt','nl',
            'ru','zh','ar','tr','ro','pl','id'
        ];

        if (params && supported.includes(params)) {
            return params;
        }

        const saved = localStorage.getItem('botia-lang');

        if (saved && supported.includes(saved)) {
            return saved;
        }

        const lang =
            (navigator.language || 'en')
                .split('-')[0]
                .toLowerCase();

        return supported.includes(lang)
            ? lang
            : 'en';
    }

    function t(key) {
        return chatTranslations[key] || key;
    }

    // ============================================================
    // CONTEXTO DE PÁGINA
    // ============================================================

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
                ingredientFromFilter ||
                ingredientFromUrl;

            if (ingredient) {
                context.ingredient =
                    ingredient;

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
        const source =
            document.querySelector('main') ||
            document.body;

        if (!source) {
            return '';
        }

        const clone =
            source.cloneNode(true);

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
                    '[aria-hidden="true"]',
                    '#botia-chat-container'
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

        return text.slice(0, 30000);
    }

    function buildWorkerContext() {
        return {
            ...getPageContext(),
            content: getPageText()
        };
    }

    // ============================================================
    // TRADUCCIONES
    // ============================================================

    async function loadChatTranslations(lang) {
        try {
            const response = await fetch(
                '/i18n/' + lang + '/chat.json',
                { cache: 'no-store' }
            );

            if (!response.ok) {
                throw new Error('chat translation not found');
            }

            const data =
                await response.json();

            chatTranslations =
                data.ui || {};

            pageSuggestions =
                data.pageSuggestions || {};
        } catch (error) {
            try {
                const fallback = await fetch(
                    '/i18n/en/chat.json',
                    { cache: 'no-store' }
                );

                const data =
                    await fallback.json();

                chatTranslations =
                    data.ui || {};

                pageSuggestions =
                    data.pageSuggestions || {};
            } catch (_) {
                chatTranslations = {};
                pageSuggestions = {};
            }
        }
    }

    // ============================================================
    // PREGUNTAS SUGERIDAS
    // ============================================================

    const SUGGESTION_TEMPLATES = {
        en: {
            ingredient: [
                'What is {subject}?',
                'Why does BOTIA flag {subject}?',
                'What can and can’t BOTIA know about {subject} from the label?'
            ],
            page: [
                'What is this page about?',
                'What are the key points on this page?',
                'What can BOTIA tell me about this topic?'
            ]
        },

        es: {
            ingredient: [
                '¿Qué es {subject}?',
                '¿Por qué BOTIA señala {subject}?',
                '¿Qué puede y qué no puede saber BOTIA sobre {subject} a partir de la etiqueta?'
            ],
            page: [
                '¿De qué trata esta página?',
                '¿Cuáles son los puntos clave de esta página?',
                '¿Qué puede explicarme BOTIA sobre este tema?'
            ]
        },

        fr: {
            ingredient: [
                'Qu’est-ce que {subject} ?',
                'Pourquoi BOTIA signale-t-il {subject} ?',
                'Que peut et ne peut pas savoir BOTIA sur {subject} à partir de l’étiquette ?'
            ],
            page: [
                'De quoi parle cette page ?',
                'Quels sont les points clés de cette page ?',
                'Que peut m’expliquer BOTIA sur ce sujet ?'
            ]
        },

        de: {
            ingredient: [
                'Was ist {subject}?',
                'Warum kennzeichnet BOTIA {subject}?',
                'Was kann BOTIA anhand des Etiketts über {subject} wissen und was nicht?'
            ],
            page: [
                'Worum geht es auf dieser Seite?',
                'Was sind die wichtigsten Punkte dieser Seite?',
                'Was kann BOTIA mir zu diesem Thema erklären?'
            ]
        },

        it: {
            ingredient: [
                'Che cos’è {subject}?',
                'Perché BOTIA segnala {subject}?',
                'Che cosa può e non può sapere BOTIA su {subject} dall’etichetta?'
            ],
            page: [
                'Di che cosa parla questa pagina?',
                'Quali sono i punti chiave di questa pagina?',
                'Che cosa può spiegarmi BOTIA su questo argomento?'
            ]
        },

        pt: {
            ingredient: [
                'O que é {subject}?',
                'Porque é que a BOTIA assinala {subject}?',
                'O que é que a BOTIA pode e não pode saber sobre {subject} a partir do rótulo?'
            ],
            page: [
                'De que trata esta página?',
                'Quais são os pontos principais desta página?',
                'O que é que a BOTIA me pode explicar sobre este tema?'
            ]
        },

        nl: {
            ingredient: [
                'Wat is {subject}?',
                'Waarom markeert BOTIA {subject}?',
                'Wat kan BOTIA op basis van het etiket wel en niet weten over {subject}?'
            ],
            page: [
                'Waar gaat deze pagina over?',
                'Wat zijn de belangrijkste punten op deze pagina?',
                'Wat kan BOTIA mij over dit onderwerp uitleggen?'
            ]
        },

        ru: {
            ingredient: [
                'Что такое {subject}?',
                'Почему BOTIA отмечает {subject}?',
                'Что BOTIA может и чего не может определить о {subject} по этикетке?'
            ],
            page: [
                'О чём эта страница?',
                'Каковы основные моменты этой страницы?',
                'Что BOTIA может объяснить мне по этой теме?'
            ]
        },

        zh: {
            ingredient: [
                '{subject}是什么？',
                '为什么 BOTIA 会标记{subject}？',
                '仅根据标签，BOTIA 对{subject}能知道什么、不能知道什么？'
            ],
            page: [
                '这个页面讲的是什么？',
                '这个页面的重点是什么？',
                'BOTIA 可以向我解释这个主题的哪些内容？'
            ]
        },

        ar: {
            ingredient: [
                'ما هو {subject}؟',
                'لماذا تشير BOTIA إلى {subject}؟',
                'ما الذي يمكن لـ BOTIA معرفته وما الذي لا يمكنها معرفته عن {subject} من الملصق؟'
            ],
            page: [
                'عن ماذا تتحدث هذه الصفحة؟',
                'ما النقاط الرئيسية في هذه الصفحة؟',
                'ماذا يمكن لـ BOTIA أن تشرح لي عن هذا الموضوع؟'
            ]
        },

        tr: {
            ingredient: [
                '{subject} nedir?',
                'BOTIA neden {subject} öğesini işaretliyor?',
                'BOTIA etiketten {subject} hakkında neleri bilebilir ve neleri bilemez?'
            ],
            page: [
                'Bu sayfa ne hakkında?',
                'Bu sayfadaki temel noktalar nelerdir?',
                'BOTIA bu konu hakkında bana ne açıklayabilir?'
            ]
        },

        ro: {
            ingredient: [
                'Ce este {subject}?',
                'De ce semnalează BOTIA {subject}?',
                'Ce poate și ce nu poate afla BOTIA despre {subject} din etichetă?'
            ],
            page: [
                'Despre ce este această pagină?',
                'Care sunt punctele principale ale acestei pagini?',
                'Ce îmi poate explica BOTIA despre acest subiect?'
            ]
        },

        pl: {
            ingredient: [
                'Czym jest {subject}?',
                'Dlaczego BOTIA oznacza {subject}?',
                'Co BOTIA może, a czego nie może ustalić o {subject} na podstawie etykiety?'
            ],
            page: [
                'O czym jest ta strona?',
                'Jakie są najważniejsze informacje na tej stronie?',
                'Co BOTIA może mi wyjaśnić na ten temat?'
            ]
        },

        id: {
            ingredient: [
                'Apa itu {subject}?',
                'Mengapa BOTIA menandai {subject}?',
                'Apa yang dapat dan tidak dapat diketahui BOTIA tentang {subject} dari label?'
            ],
            page: [
                'Halaman ini membahas apa?',
                'Apa poin-poin utama di halaman ini?',
                'Apa yang dapat dijelaskan BOTIA tentang topik ini?'
            ]
        }
    };

    function fillSubject(template, subject) {
        return String(template || '')
            .replace(/\{subject\}/g, subject);
    }

    function getGeneratedSuggestions() {
        const context =
            getPageContext();

        const templates =
            SUGGESTION_TEMPLATES[currentLang] ||
            SUGGESTION_TEMPLATES.en;

        if (context.page === 'ingredient') {
            const subject =
                context.ingredient_name ||
                context.ingredient ||
                context.title ||
                '';

            return templates.ingredient.map(
                template =>
                    fillSubject(template, subject)
            );
        }

        return templates.page.slice();
    }

    async function getPageSuggestions() {
        try {
            await window.BOTIA?.init?.();
        } catch (error) {
            console.warn(
                'BOTIA Chat: page translations not ready.',
                error
            );
        }

        const context =
            getPageContext();

        if (context.page === 'ingredient') {
            const translationData =
                window.BOTIA
                    ?.translationData
                    ?.() || {};

            const robotQuestions =
                Array.isArray(
                    translationData.robot_questions
                )
                    ? translationData
                        .robot_questions
                        .filter(
                            question =>
                                typeof question === 'string' &&
                                question.trim()
                        )
                    : [];

            if (robotQuestions.length) {
                return robotQuestions.slice(0, 3);
            }
        }

        const explicit =
            pageSuggestions[context.page];

        if (
            Array.isArray(explicit) &&
            explicit.length
        ) {
            return explicit.slice(0, 3);
        }

        return getGeneratedSuggestions()
            .slice(0, 3);
    }

    function removePageSuggestions() {
        const old =
            messagesEl?.querySelector(
                '[data-page-suggestions]'
            );

        if (old) {
            old.remove();
        }
    }

    async function showPageSuggestions() {
        const suggestions =
            await getPageSuggestions();

        if (!suggestions.length) {
            return;
        }

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
                    document.createElement('button');

                btn.type = 'button';
                btn.className =
                    'botia-page-suggestion';

                btn.textContent =
                    question;

                btn.style.cssText =
                    'width:100%;' +
                    'text-align:start;' +
                    'background:rgba(255,255,255,0.05);' +
                    'border:1px solid rgba(230,160,107,0.32);' +
                    'border-radius:14px;' +
                    'padding:0.7rem 0.85rem;' +
                    'color:#f2e4dc;' +
                    'cursor:pointer;' +
                    'font-family:inherit;' +
                    'font-size:0.9rem;' +
                    'line-height:1.35;';

                btn.addEventListener(
                    'click',
                    function () {
                        inputEl.value =
                            question;

                        setRobotState(
                            'pointing',
                            700
                        );

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

    // ============================================================
    // COMPORTAMIENTO DEL ROBOT
    // ============================================================

    const ROBOT_ASSETS = {
        question:
            '/botia/assets/robot/question.png',

        pointing:
            '/botia/assets/robot/pointing.png',

        magnifier:
            '/botia/assets/robot/magnifier.png',

        positive:
            '/botia/assets/robot/positive.png',

        alarmed:
            '/botia/assets/robot/alarmed.png'
    };

    function getRobotImg() {
        return document.getElementById(
            'botia-robot-img'
        );
    }

    function setRobotState(
        state = 'question',
        restoreAfter = 0
    ) {
        const robotImg =
            getRobotImg();

        if (!robotImg) {
            return;
        }

        if (robotStateTimer) {
            clearTimeout(
                robotStateTimer
            );

            robotStateTimer = null;
        }

        robotImg.src =
            ROBOT_ASSETS[state] ||
            ROBOT_ASSETS.question;

        robotImg.dataset.state =
            state;

        if (restoreAfter > 0) {
            robotStateTimer =
                setTimeout(
                    function () {
                        setRobotState(
                            'question'
                        );
                    },
                    restoreAfter
                );
        }
    }

    function refreshContextualUi() {
        setRobotState('question');

        if (inputEl) {
            inputEl.placeholder =
                t('pagePlaceholder') ||
                'Ask about this page…';
        }

        if (chatWindow) {
            chatWindow.dir =
                currentLang === 'ar'
                    ? 'rtl'
                    : 'ltr';
        }

        if (
            isOpen &&
            conversation.length === 0
        ) {
            showPageSuggestions();
        }
    }

    // ============================================================
    // MENSAJES
    // ============================================================

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

            div.textContent =
                text;
        } else {
            div.style.cssText =
                base +
                'align-self:flex-start;' +
                'background:rgba(255,255,255,0.06);' +
                'color:#f2e4dc;' +
                'border:1px solid rgba(255,255,255,0.08);' +
                'border-bottom-left-radius:6px;';

            div.textContent =
                text;
        }

        messagesEl.appendChild(div);

        messagesEl.scrollTop =
            messagesEl.scrollHeight;

        return div;
    }

    function appendTyping() {
        const div =
            document.createElement('div');

        div.id =
            'botia-typing';

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

        if (el) {
            el.remove();
        }
    }

    // ============================================================
    // IA
    // ============================================================

    async function sendToAI(message) {
        removePageSuggestions();

        appendMessage(
            'user',
            message
        );

        conversation.push({
            role: 'user',
            content: message
        });

        inputEl.value = '';
        inputEl.disabled = true;
        sendBtn.disabled = true;

        setRobotState(
            'magnifier'
        );

        appendTyping();

        try {
            const response =
                await fetch(
                    WORKER_URL,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                language:
                                    currentLang,

                                context:
                                    buildWorkerContext(),

                                messages:
                                    conversation.slice(
                                        -8
                                    )
                            })
                    }
                );

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
                    ?.message
                    ?.content ||
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

            setRobotState(
                'positive',
                900
            );

        } catch (error) {
            removeTyping();

            appendMessage(
                'bot',
                t('connectionError') ||
                'Connection error.'
            );

            setRobotState(
                'alarmed',
                1400
            );
        }

        inputEl.disabled =
            false;

        sendBtn.disabled =
            false;

        inputEl.focus();
    }

    function handleSend() {
        const msg =
            inputEl.value.trim();

        if (!msg) {
            return;
        }

        sendToAI(msg);
    }

    // ============================================================
    // CREAR ELEMENTOS
    // ============================================================

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

        chatWindow.dir =
            currentLang === 'ar'
                ? 'rtl'
                : 'ltr';

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

        chatWindow.setAttribute(
            'role',
            'dialog'
        );

        chatWindow.setAttribute(
            'aria-label',
            t('title') ||
            'BOTIA Assistant'
        );

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
            document.createElement(
                'button'
            );

        closeBtn.style.cssText =
            'background:transparent;' +
            'border:none;' +
            'color:#c0a08c;' +
            'font-size:1.4rem;' +
            'cursor:pointer;' +
            'padding:0 4px;' +
            'line-height:1;';

        closeBtn.textContent =
            '✕';

        closeBtn.setAttribute(
            'aria-label',
            'Close'
        );

        header.appendChild(
            closeBtn
        );

        chatWindow.appendChild(
            header
        );

        messagesEl =
            document.createElement(
                'div'
            );

        messagesEl.id =
            'botia-messages';

        messagesEl.setAttribute(
            'aria-live',
            'polite'
        );

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
            document.createElement(
                'input'
            );

        inputEl.type =
            'text';

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

        footer.appendChild(
            inputEl
        );

        sendBtn =
            document.createElement(
                'button'
            );

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

        footer.appendChild(
            sendBtn
        );

        chatWindow.appendChild(
            footer
        );

        toggleBtn =
            document.createElement(
                'button'
            );

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
            ROBOT_ASSETS.question +
            '" alt="BOTIA" id="botia-robot-img" data-state="question" style="width:132px;height:132px;object-fit:contain;display:block;filter:drop-shadow(0 8px 30px rgba(230,160,107,0.5));transition:transform 0.3s ease;">' +
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

    // ============================================================
    // OPEN / CLOSE
    // ============================================================

    function openChat() {
        chatWindow.style.display =
            'flex';

        isOpen = true;

        toggleBtn.classList.add(
            'is-open'
        );

        setRobotState(
            'question'
        );

        if (
            conversation.length === 0
        ) {
            showPageSuggestions();
        }

        inputEl.focus();
    }

    function closeChat() {
        chatWindow.style.display =
            'none';

        isOpen = false;

        toggleBtn.classList.remove(
            'is-open'
        );

        setRobotState(
            'question'
        );
    }

    // ============================================================
    // EVENTOS
    // ============================================================

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
            function (event) {
                if (
                    event.key ===
                    'Enter'
                ) {
                    handleSend();
                }
            }
        );

        document.addEventListener(
            'keydown',
            function (event) {
                if (
                    event.key ===
                    'Escape' &&
                    isOpen
                ) {
                    closeChat();
                }
            }
        );

        const robotImg =
            getRobotImg();

        if (robotImg) {
            toggleBtn.addEventListener(
                'mouseenter',
                function () {
                    if (!isOpen) {
                        robotImg.style.transform =
                            'scale(1.06)';
                    }
                }
            );

            toggleBtn.addEventListener(
                'mouseleave',
                function () {
                    robotImg.style.transform =
                        'scale(1)';
                }
            );
        }

        window.addEventListener(
            'storage',
            function (event) {
                if (
                    event.key !==
                        'botia-lang' ||
                    !event.newValue
                ) {
                    return;
                }

                const nextLang =
                    getCurrentLanguage();

                if (
                    nextLang ===
                    currentLang
                ) {
                    return;
                }

                currentLang =
                    nextLang;

                loadChatTranslations(
                    currentLang
                ).then(
                    refreshContextualUi
                );
            }
        );
    }

    // ============================================================
    // ESTILOS
    // ============================================================

    function addStyles() {
        const style =
            document.createElement(
                'style'
            );

        style.textContent = [
            '@keyframes botia-typing { 0%,80%,100%{transform:scale(0.4);opacity:0.4} 40%{transform:scale(1);opacity:1} }',

            '@keyframes botia-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }',

            '#botia-toggle-btn:not(.is-open) { animation:botia-float 3.8s ease-in-out infinite !important; }',

            '#botia-toggle-btn.is-open { animation:none !important; }',

            '#botia-messages::-webkit-scrollbar { width:4px; }',

            '#botia-messages::-webkit-scrollbar-thumb { background:rgba(190,122,72,0.3);border-radius:12px; }',

            '.botia-page-suggestion:hover { background:rgba(230,160,107,0.11) !important; }',

            '@media (prefers-reduced-motion: reduce) { #botia-toggle-btn { animation:none !important; } }',

            '@media (max-width:540px) {',

            '  #botia-chat-window { width:92vw !important;height:460px !important; }',

            '  #botia-chat-container { right:12px !important;bottom:12px !important; }',

            '  #botia-toggle-btn .botia-robot-wrap { width:112px !important;height:112px !important; }',

            '  #botia-toggle-btn img { width:112px !important;height:112px !important; }',

            '}'
        ].join('');

        document.head.appendChild(
            style
        );
    }

    // ============================================================
    // INIT
    // ============================================================

    async function initChat() {
        currentLang =
            getCurrentLanguage();

        await loadChatTranslations(
            currentLang
        );

        addStyles();
        createElements();
        attachEvents();

        // Nunca auto-open.
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

