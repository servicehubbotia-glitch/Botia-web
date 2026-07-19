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
    //  PREGUNTAS DEL QUIZ (16 preguntas gancho)
    // ============================================================
    const QUIZ_QUESTIONS = [
        {
            id: 1,
            en: 'That appetizing red color in your gummy candies or strawberry yogurt? It\'s made by crushing thousands of insects. It\'s called Carmine or Cochineal. Dare to look for E-120 on your label?',
            es: '¿Ese color rojo tan apetecible de tus gominolas o yogur de fresa se fabrica machacando miles de insectos? Se llama Carmín o Cochinilla. ¿Te atreves a buscar el E-120 en tu etiqueta?',
            link: 'https://www.botia-safefood.com/ingredients/carmine.html'
        },
        {
            id: 2,
            en: 'Do you know why bagged grated cheese never sticks together? Because they add cellulose powder — literally refined wood fiber. Are you eating cheese or sawdust?',
            es: '¿Sabes por qué el queso rallado en bolsa nunca se pega? Porque le añaden celulosa en polvo — literalmente fibra de madera refinada. ¿Estás comiendo queso o serrín?',
            link: 'https://www.botia-safefood.com/ingredients/e472.html'
        },
        {
            id: 3,
            en: 'Why do supermarket apples shine so much? They\'re coated with shellac (E-904), a wax secreted by Asian beetles. Fancy a bite?',
            es: '¿Por qué las manzanas del súper brillan tanto? Las bañan en goma laca (E-904), una cera que secretan los escarabajos asiáticos. ¿Te apetece un bocado?',
            link: 'https://www.botia-safefood.com/ingredients/shellac.html'
        },
        {
            id: 4,
            en: 'What has more sugar: a can of soda or four tablespoons of condensed milk? They\'re almost tied! But condensed milk hides the sugar under a "healthy dairy" label.',
            es: '¿Qué tiene más azúcar: una lata de refresco o cuatro cucharadas de leche condensada? ¡Están casi empatadas! Pero la leche condensada camufla el azúcar bajo etiqueta de "lácteo saludable".',
            link: 'https://www.botia-safefood.com/ingredients/free_sugars.html'
        },
        {
            id: 5,
            en: 'Do you think jarred fried tomato is just tomato and oil? In most brands, the second most abundant ingredient is sugar. Are you dressing your pasta or pouring syrup?',
            es: '¿Crees que el tomate frito de bote es solo tomate y aceite? En la mayoría de marcas, el segundo ingrediente con más cantidad es el azúcar. ¿Estás aliñando tu pasta o echándole sirope?',
            link: 'https://www.botia-safefood.com/ingredients/glucose_syrup.html'
        },
        {
            id: 6,
            en: 'You see a "0% fat" yogurt. Sounds good, right? What do they replace that fat with so it still tastes good? With tons of sugar or modified starch.',
            es: 'Ves un yogur "0% materia grasa". Suena bien, ¿verdad? ¿Con qué sustituyen esa grasa para que siga estando rico? Con toneladas de azúcar o almidón modificado.',
            link: 'https://www.botia-safefood.com/ingredients/maltodextrin.html'
        },
        {
            id: 7,
            en: 'Is your bread truly whole grain or is it white bread "painted"? Many brands use white flour and add bran to make it look brown. Do you know how to spot it on the label?',
            es: '¿Tu pan es verdaderamente integral o es pan blanco "pintado"? Muchas marcas usan harina blanca y le añaden salvado para que parezca marrón. ¿Sabes cómo pillarlo en la etiqueta?',
            link: 'https://www.botia-safefood.com/ingredients/free_sugars.html'
        },
        {
            id: 8,
            en: 'Did you know that white chocolate contains absolutely no real cocoa? It\'s just cocoa butter, milk, and sugar. Should it still be called chocolate?',
            es: '¿Sabías que el chocolate blanco no contiene ni un solo gramo de cacao real? Es solo manteca de cacao, leche y azúcar. ¿Debería seguir llamándose chocolate?',
            link: 'https://www.botia-safefood.com/ingredients/free_sugars.html'
        },
        {
            id: 9,
            en: 'Why does "100% natural" juice from a carton taste the same all year round? Because they store it for up to a year without oxygen and then add "flavor packs" to make it smell like orange again.',
            es: '¿Por qué un zumo "100% natural" de brik sabe igual todo el año? Porque lo almacenan hasta un año sin oxígeno y luego le añaden "packs de sabor" artificiales para que vuelva a oler a naranja.',
            link: 'https://www.botia-safefood.com/ingredients/natural_flavourings.html'
        },
        {
            id: 10,
            en: 'You see "with natural flavors" on some lemon cookies. The law allows that flavor to come from a fungus or tree bark, not from a real lemon. Does it taste like fruit or lab?',
            es: 'Ves "con aromas naturales" en unas galletas de limón. La ley permite que ese aroma venga de un hongo o de la corteza de un árbol, no de un limón real. ¿Te sabe a fruta o a laboratorio?',
            link: 'https://www.botia-safefood.com/ingredients/natural_flavourings.html'
        },
        {
            id: 11,
            en: 'Do you buy brown sugar because it\'s more natural? 90% of supermarket brown sugar is white refined sugar with molasses injected to color it brown. Are you paying more for coloring?',
            es: '¿Compras azúcar moreno porque es más natural? El 90% del azúcar moreno del súper es azúcar blanco refinado al que le han inyectado melaza para pintarlo de marrón. ¿Estás pagando más por colorante?',
            link: 'https://www.botia-safefood.com/ingredients/free_sugars.html'
        },
        {
            id: 12,
            en: 'How can a cured meat say "no artificial preservatives" and last a month? They use celery extract, rich in natural nitrates that turn into the same nitrites the industry wants to hide.',
            es: '¿Cómo puede un embutido decir "sin conservantes artificiales" y durar un mes? Usan extracto de apio, rico en nitratos naturales que se convierten exactamente en los mismos nitritos que la industria quiere ocultar.',
            link: 'https://www.botia-safefood.com/ingredients/natural_flavourings.html'
        },
        {
            id: 13,
            en: 'Almost all canned goods have a plastic lining that releases BPA — an endocrine disruptor that mimics your estrogens. Do you know which brands already use BPA-free cans?',
            es: 'Casi todas las latas de conserva llevan una capa de plástico interior que libera BPA — un disruptor endocrino que imita a tus estrógenos. ¿Sabes qué marcas ya usan latas libres de BPA?',
            link: 'https://www.botia-safefood.com/ingredients/bpa.html'
        },
        {
            id: 14,
            en: 'Do you microwave your Tupperware because it says "microwave safe"? That only means the plastic won\'t melt, but it still releases phthalates directly into your food.',
            es: '¿Calientas el táper en el microondas porque pone "apto para microondas"? Eso solo significa que el plástico no se derrite, pero sigue liberando ftalatos directamente en tu comida.',
            link: 'https://www.botia-safefood.com/ingredients/phthalates.html'
        },
        {
            id: 15,
            en: 'Plastic chemicals love fat. If you store cheese or meat wrapped in plastic wrap, the migration of toxins is much greater than if you store vegetables.',
            es: 'Los químicos del plástico adoran la grasa. Si guardas queso o carne envuelto en film transparente, la migración de toxinas es mucho mayor que si guardas verdura.',
            link: 'https://www.botia-safefood.com/ingredients/packaging-migrants.html'
        },
        {
            id: 16,
            en: 'Do you leave your plastic water bottle in the sun in the car? Heat degrades PET and releases antimony and microplastics into the water you later drink.',
            es: '¿Dejas la botella de agua de plástico al sol en el coche? El calor degrada el PET y libera antimonio y microplásticos en el agua que luego te bebes.',
            link: 'https://www.botia-safefood.com/ingredients/endocrine-disruptors.html'
        }
    ];

    // ============================================================
    //  ESTADO DEL CHAT
    // ============================================================
    let currentLang = 'en';
    let conversationCount = 0;
    let quizIndex = 0;
    let quizOrder = [];

    // ============================================================
    //  FUNCIONES DE IDIOMA
    // ============================================================
    function getCurrentLanguage() {
        const savedLang = localStorage.getItem('botia-lang');
        if (savedLang) return savedLang;
        const browserLang = navigator.language || navigator.languages?.[0] || 'en';
        const langCode = browserLang.split('-')[0].toLowerCase();
        const supported = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ar', 'hi', 'ko'];
        return supported.includes(langCode) ? langCode : 'en';
    }

    currentLang = getCurrentLanguage();

    // ============================================================
    //  TRADUCCIONES UI
    // ============================================================
    const UI_TRANSLATIONS = {
        'en': {
            title: 'BOTIA Assistant',
            placeholder: 'Ask or type "next"…',
            send: 'Send',
            welcome: '👋 Hi! I\'m the BOTIA assistant. I\'ll ask you some food facts. You can also ask me anything about ingredients, labels, or additives.',
            nextBtn: 'Next question',
            discoverBtn: 'Discover on BOTIA',
            limit: 'You\'ve used your 3 free questions. For unlimited queries, download the BOTIA app.',
            limitBtn: 'Go to BOTIA',
            error: 'Sorry, there was a problem.',
            connectionError: 'Connection error. Please check your network.',
            quizDone: '🎉 You\'ve seen all 16 questions! You can now ask me anything about food ingredients and additives.',
            noMoreQuestions: 'No more questions! Ask me anything.'
        },
        'es': {
            title: 'Asistente BOTIA',
            placeholder: 'Pregunta o escribe "siguiente"…',
            send: 'Enviar',
            welcome: '👋 ¡Hola! Soy el asistente de BOTIA. Te haré algunas preguntas sobre comida. También puedes preguntarme sobre ingredientes, etiquetas o aditivos.',
            nextBtn: 'Siguiente pregunta',
            discoverBtn: 'Descúbrelo en BOTIA',
            limit: 'Has usado tus 3 preguntas gratuitas. Para consultas ilimitadas, descarga la app BOTIA.',
            limitBtn: 'Ir a BOTIA',
            error: 'Lo siento, hubo un problema.',
            connectionError: 'Error de conexión. Comprueba tu red.',
            quizDone: '🎉 ¡Has visto las 16 preguntas! Ahora puedes preguntarme cualquier cosa sobre ingredientes y aditivos alimentarios.',
            noMoreQuestions: '¡No hay más preguntas! Pregúntame lo que quieras.'
        },
        'fr': {
            title: 'Assistant BOTIA',
            placeholder: 'Posez une question ou tapez "suivant"…',
            send: 'Envoyer',
            welcome: '👋 Bonjour ! Je suis l\'assistant BOTIA. Je vais vous poser quelques questions sur l\'alimentation. Vous pouvez aussi me demander des informations sur les ingrédients, les étiquettes ou les additifs.',
            nextBtn: 'Question suivante',
            discoverBtn: 'Découvrir sur BOTIA',
            limit: 'Vous avez utilisé vos 3 questions gratuites. Pour des requêtes illimitées, téléchargez l\'application BOTIA.',
            limitBtn: 'Aller à BOTIA',
            error: 'Désolé, un problème est survenu.',
            connectionError: 'Erreur de connexion. Vérifiez votre réseau.',
            quizDone: '🎉 Vous avez vu les 16 questions ! Vous pouvez maintenant me demander tout ce que vous voulez sur les ingrédients et additifs alimentaires.',
            noMoreQuestions: 'Plus de questions ! Posez-moi ce que vous voulez.'
        },
        'de': {
            title: 'BOTIA Assistent',
            placeholder: 'Stelle eine Frage oder tippe "weiter"…',
            send: 'Senden',
            welcome: '👋 Hallo! Ich bin der BOTIA-Assistent. Ich werde dir ein paar Fragen über Essen stellen. Du kannst mich auch alles über Zutaten, Etiketten oder Zusatzstoffe fragen.',
            nextBtn: 'Nächste Frage',
            discoverBtn: 'Entdecke auf BOTIA',
            limit: 'Du hast deine 3 kostenlosen Fragen verwendet. Für unbegrenzte Fragen lade die BOTIA-App herunter.',
            limitBtn: 'Zu BOTIA',
            error: 'Entschuldigung, es gab ein Problem.',
            connectionError: 'Verbindungsfehler. Bitte überprüfe dein Netzwerk.',
            quizDone: '🎉 Du hast alle 16 Fragen gesehen! Du kannst mich jetzt alles über Lebensmittelzutaten und Zusatzstoffe fragen.',
            noMoreQuestions: 'Keine Fragen mehr! Frag mich alles.'
        },
        'it': {
            title: 'Assistente BOTIA',
            placeholder: 'Fai una domanda o scrivi "prossimo"…',
            send: 'Invia',
            welcome: '👋 Ciao! Sono l\'assistente BOTIA. Ti farò alcune domande sul cibo. Puoi anche chiedermi informazioni su ingredienti, etichette o additivi.',
            nextBtn: 'Prossima domanda',
            discoverBtn: 'Scopri su BOTIA',
            limit: 'Hai usato le tue 3 domande gratuite. Per domande illimitate, scarica l\'app BOTIA.',
            limitBtn: 'Vai a BOTIA',
            error: 'Spiacenti, c\'è stato un problema.',
            connectionError: 'Errore di connessione. Controlla la tua rete.',
            quizDone: '🎉 Hai visto tutte le 16 domande! Ora puoi chiedermi qualsiasi cosa su ingredienti e additivi alimentari.',
            noMoreQuestions: 'Nessuna altra domanda! Chiedimi quello che vuoi.'
        },
        'pt': {
            title: 'Assistente BOTIA',
            placeholder: 'Faça uma pergunta ou diga "próximo"…',
            send: 'Enviar',
            welcome: '👋 Olá! Sou o assistente BOTIA. Vou fazer algumas perguntas sobre comida. Também podes perguntar-me sobre ingredientes, rótulos ou aditivos.',
            nextBtn: 'Próxima pergunta',
            discoverBtn: 'Descubra no BOTIA',
            limit: 'Usaste as tuas 3 perguntas gratuitas. Para perguntas ilimitadas, descarrega a app BOTIA.',
            limitBtn: 'Ir para BOTIA',
            error: 'Desculpe, houve um problema.',
            connectionError: 'Erro de ligação. Verifica a tua rede.',
            quizDone: '🎉 Viste todas as 16 perguntas! Agora podes perguntar-me qualquer coisa sobre ingredientes e aditivos alimentares.',
            noMoreQuestions: 'Sem mais perguntas! Pergunta-me o que quiseres.'
        }
    };

    function t(key) {
        const keys = key.split('.');
        let value = UI_TRANSLATIONS[currentLang];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
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
        if (quizIndex >= QUIZ_QUESTIONS.length) {
            return null;
        }
        return QUIZ_QUESTIONS[quizOrder[quizIndex]];
    }

    function getQuestionText(q) {
        return q[currentLang] || q.en || 'Question not available';
    }

    function getQuestionLink(q) {
        return q.link || '#';
    }

    function getQuizProgress() {
        return `${Math.min(quizIndex + 1, QUIZ_QUESTIONS.length)} / ${QUIZ_QUESTIONS.length}`;
    }

    function isQuizComplete() {
        return quizIndex >= QUIZ_QUESTIONS.length - 1;
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
            quizOrder = data.quizOrder || shuffleArray(QUIZ_QUESTIONS.map((_, i) => i));
        } else {
            quizOrder = shuffleArray(QUIZ_QUESTIONS.map((_, i) => i));
        }
    } catch (e) {
        quizOrder = shuffleArray(QUIZ_QUESTIONS.map((_, i) => i));
        conversationCount = 0;
    }
    // ============================================================
    //  CREAR ELEMENTOS DEL CHAT
    // ============================================================
    const container = document.createElement('div');
    container.id = 'chat-container';
    container.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;';

    const chatWindow = document.createElement('div');
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

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'chatToggle';
    toggleBtn.setAttribute('aria-label', 'Abrir chat');
    toggleBtn.style.cssText = 'width:62px;height:62px;border-radius:50%;background:#e6a06b;border:none;box-shadow:0 8px 24px rgba(230,160,107,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#100707;padding:0;transition:transform 0.2s;';
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" style="fill:currentColor;"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.93 1.52 5.57 3.87 7.16L4.5 21.5l4.04-1.88C9.64 20.16 10.8 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2zm0 16c-1.1 0-2.16-.22-3.13-.6l-2.5 1.17 1.17-2.42C6.2 15.2 5.5 13.2 5.5 11c0-3.86 3.14-7 6.5-7s6.5 3.14 6.5 7-2.64 7-6.5 7z"/></svg>`;

    container.appendChild(chatWindow);
    container.appendChild(toggleBtn);
    document.body.appendChild(container);

    const messagesEl = document.getElementById('chatMessages');
    const inputEl = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');
    const closeBtn = document.getElementById('chatClose');
    const quizProgress = document.getElementById('quizProgress');

    let isOpen = false;

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
        quizProgress.textContent = getQuizProgress();
    }

    // ============================================================
    //  MOSTRAR PREGUNTA DEL QUIZ
    // ============================================================
    function showQuizQuestion() {
        const q = getCurrentQuestion();
        if (!q) {
            appendMessage('bot', t('quizDone'));
            updateQuizProgress();
            return;
        }

        const questionText = getQuestionText(q);
        const link = getQuestionLink(q);
        
        const html = `
            <div style="margin-bottom:8px;">${questionText}</div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                <a href="${link}" target="_blank" rel="noopener" style="background:#e6a06b;border:none;border-radius:60px;padding:0.4rem 1.2rem;font-weight:600;color:#100707;text-decoration:none;font-size:0.8rem;display:inline-block;">🔍 ${t('discoverBtn')}</a>
                <button onclick="window.dispatchEvent(new CustomEvent('nextQuiz'))" style="background:transparent;border:1px solid #e6a06b;border-radius:60px;padding:0.4rem 1.2rem;font-weight:500;color:#e6a06b;cursor:pointer;font-size:0.8rem;font-family:inherit;">➡️ ${t('nextBtn')}</button>
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
            appendMessage('bot', t('limit'));
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
            
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
                count: conversationCount,
                quizIndex: quizIndex,
                quizOrder: quizOrder
            }));
            
            if (conversationCount >= MAX_QUESTIONS) {
                appendMessage('bot', t('limit'));
            }
        } catch (err) {
            removeTyping();
            console.error('Error:', err);
            appendMessage('bot', t('connectionError'));
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

        // Detectar "siguiente" o "next"
        const nextWords = ['siguiente', 'next', 'nächste', 'suivant', 'prossimo', 'próximo', 'weiter'];
        if (nextWords.includes(message.toLowerCase())) {
            if (isQuizComplete()) {
                appendMessage('bot', t('noMoreQuestions'));
                inputEl.value = '';
                return;
            }
            // Avanzar a la siguiente pregunta
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

        // Si no es "siguiente", enviar a la IA
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
            // Mostrar primera pregunta si no hay mensajes
            if (messagesEl.children.length === 0) {
                appendMessage('bot', t('welcome'));
                setTimeout(showQuizQuestion, 500);
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

    // Evento para el botón "Siguiente" desde el mensaje
    document.addEventListener('nextQuiz', () => {
        if (isQuizComplete()) {
            appendMessage('bot', t('noMoreQuestions'));
            return;
        }
        quizIndex++;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ 
            count: conversationCount,
            quizIndex: quizIndex,
            quizOrder: quizOrder
        }));
        showQuizQuestion();
    });

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
            sendBtn.textContent = t('send');
        }
    };

    // ============================================================
    //  ESTILOS GLOBALES
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
            #chat-window { width: 92vw !important; height: 420px !important; right: 0 !important; }
            #chat-container { right: 16px !important; bottom: 16px !important; }
            #chatToggle { width: 56px !important; height: 56px !important; }
            #chatToggle svg { width: 28px !important; height: 28px !important; }
        }
    `;
    document.head.appendChild(style);

    // ============================================================
    //  INICIO
    // ============================================================
    console.log('🤖 BOTIA Chat v2.0 cargado');
    console.log(`🌍 Idioma: ${currentLang}`);
    console.log(`📊 Progreso: ${getQuizProgress()}`);
    console.log(`🔗 Worker: ${WORKER_URL}`);

})();

