document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container');
    
    // Новый экран создания поста и его шаги
    const createPostScreen = document.getElementById('createPostScreen');
    const createPostMainTitleEl = document.getElementById('create-post-main-title');
    const step1SelectType = document.getElementById('step1-select-type');
    const contentTypeCardsContainer = document.querySelector('#createPostScreen .content-type-cards-container');
    const step2SelectTheme = document.getElementById('step2-select-theme');
    const selectedPostTypeNameEl = document.getElementById('selected-post-type-name');
    const themesForSelectionGridEl = document.getElementById('themes-for-selection-grid');
    const backToTypeSelectionStepButton = document.getElementById('back-to-type-selection-step');
    const step3ConfigurePost = document.getElementById('step3-configure-post'); // Пока не используется активно
    const publishPostButton = document.getElementById('publish-post-button'); // Для Шага 3
    const backToThemeSelectionStepButton = document.getElementById('back-to-theme-selection-step'); // Для Шага 3
    const closeCreatePostScreenButton = document.getElementById('close-create-post-screen');
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const createPostButtonMonitor = document.getElementById('create-post-button-monitor');
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');

    // Модальные окна (кроме create-post-modal, которое мы заменили экраном)
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки действий теперь не нужны глобально, они будут внутри их контекста
    // const postTextButton = document.getElementById('post-text-button'); // УДАЛЕНО
    // const postMemeButton = document.getElementById('post-meme-button'); // УДАЛЕНО
    // const postVideoButton = document.getElementById('post-video-button'); // УДАЛЕНО
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality'); // Внутри upgradesModal
    const eventLogUl = document.getElementById('event-log');

    const liveFeedbackContainer = document.getElementById('live-feedback-container');
    const MAX_FEEDBACK_ITEMS = 7;
    const positiveComments = ["Круто!", "Лучший пост!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гениально!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "1.0.0_new_create", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const POST_THEMES = {
        text: [ { id: 'hot_news', displayName: '🔥 Горячие Новости', baseMultiplier: 1.1 }, { id: 'useful_tips', displayName: '💡 Полезные Советы', baseMultiplier: 1.0 }, { id: 'deep_analysis', displayName: '🧐 Глубокий Анализ', baseMultiplier: 1.2 }, { id: 'personal_story', displayName: '✍️ Личная История', baseMultiplier: 0.9 } ],
        meme: [ { id: 'animal_memes', displayName: '😹 Мемы про Животных', baseMultiplier: 1.2 }, { id: 'current_events', displayName: '🌍 Актуальные События', baseMultiplier: 1.1 }, { id: 'classic_memes', displayName: '🗿 Классика Юмора', baseMultiplier: 1.0 }, { id: 'gaming_memes', displayName: '🎮 Игровые Мемы', baseMultiplier: 1.15 } ],
        video: [ { id: 'gadget_review', displayName: '📱 Обзор Гаджета', baseMultiplier: 1.2 }, { id: 'funny_cats', displayName: '😻 Смешные Котики', baseMultiplier: 1.3 }, { id: 'lifehacks', displayName: '🛠️ Лайфхаки', baseMultiplier: 1.1 }, { id: 'vlog_day', displayName: '🤳 Мой День (Влог)', baseMultiplier: 0.9 } ]
    };
    let currentSelectedPostType = null;
    let currentSelectedThemeId = null;

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };
    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }

    function showScreen(screenElementToShow) {
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostScreen, upgradesModal, logModal].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start';
                 studioContainer.style.alignItems = 'stretch';
                 if(studioSidePanel) studioSidePanel.style.display = 'flex';
            } else if (screenElementToShow !== createPostScreen && screenElementToShow !== themeSelectionScreen && screenElementToShow !== welcomeScreen && screenElementToShow !== cutsceneScreen) { // Для модалок не скрываем боковую панель
                 if(studioSidePanel) studioSidePanel.style.display = 'flex'; // Оставляем видимой, если это модалка поверх студии
            } else {
                 if(studioSidePanel) studioSidePanel.style.display = 'none';
            }
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }
    
    function playCutscene() { /* ... как раньше, в конце вызывает startGameplay() ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v1.0.0_tabs'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { logEvent("Требуется выбор тематики канала.", "info"); showScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... как раньше ... */ showScreen(welcomeScreen); }
    
    function startGameplay() { 
        loadGame(); 
        showScreen(studioContainer); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v1.0.0_tabs');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v1.0.0_tabs', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    
    function updateUI() { 
        const displayName = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = displayName; // Обновляем заголовок в хедере студии
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = displayName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0);
        updateTrendUI();
    }
    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
        const costEl = upgradeContentQualityButton.querySelector('.upgrade-cost');
        if(costEl) costEl.textContent = cost;
    }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- Логика нового экрана Создания Поста ---
    function showCreationStep(stepToShow) {
        [step1SelectType, step2SelectTheme, step3ConfigurePost].forEach(step => {
            if (step) step.style.display = 'none';
        });
        if (stepToShow) {
            stepToShow.style.display = 'block';
        }
    }

    function populateAndShowThemeStep(postType) {
        if (!themesForSelectionGridEl || !selectedPostTypeNameEl || !createPostMainTitleEl) return;
        currentSelectedPostType = postType;
        themesForSelectionGridEl.innerHTML = '';
        const themesForType = POST_THEMES[postType] || [];
        if (themesForType.length === 0) {
            logEvent(`Нет тем для типа поста: ${postType}`, 'error');
            triggerPostPublication(); // Публикуем с "общей" темой, если нет конкретных
            return;
        }
        themesForType.forEach(theme => {
            const themeCard = document.createElement('div');
            themeCard.classList.add('theme-select-button-card');
            themeCard.innerHTML = `<h4>${theme.displayName}</h4><span class="theme-interest">Интерес: ${Math.floor(theme.baseMultiplier * 80 + Math.random()*20)}%</span>`;
            themeCard.dataset.themeId = theme.id;
            themeCard.addEventListener('click', () => {
                currentSelectedThemeId = theme.id;
                logEvent(`Выбрана тема "${theme.displayName}" для ${getPostTypeName(currentSelectedPostType)}`, 'info');
                triggerPostPublication(); 
            });
            themesForSelectionGridEl.appendChild(themeCard);
        });
        if(selectedPostTypeNameEl) selectedPostTypeNameEl.textContent = getPostTypeName(postType).toLowerCase();
        if(createPostMainTitleEl) createPostMainTitleEl.textContent = `Выберите Тему`;
        showCreationStep(step2SelectTheme);
    }

    function triggerPostPublication() {
        if (!currentSelectedPostType) { // Тема может быть не выбрана, если для типа нет тем
            logEvent("Тип поста не выбран для публикации!", "error");
            showCreationStep(step1SelectType); 
            if(createPostMainTitleEl) createPostMainTitleEl.textContent = "Создание Нового Поста";
            return;
        }
        let params;
        if (currentSelectedPostType === 'text') params = ['text', 1, 5, 2, 10, 1, 5];
        else if (currentSelectedPostType === 'meme') params = ['meme', 3, 10, 1, 5, 2, 8];
        else if (currentSelectedPostType === 'video') params = ['video', 8, 20, 7, 18, 3, 10];
        else { logEvent("Неизвестный тип поста для публикации", "error"); return; }

        handlePostAction(params[0], currentSelectedThemeId, params[1], params[2], params[3], params[4], params[5], params[6]);
        currentSelectedPostType = null; currentSelectedThemeId = null;
        // Возвращаемся в студию, экран создания сам сбросится при следующем открытии
    }

    const contentTypeCardElements = document.querySelectorAll('#createPostScreen .content-type-card');
    if (contentTypeCardElements) {
        contentTypeCardElements.forEach(card => {
            card.addEventListener('click', () => {
                const postType = card.dataset.postType;
                populateAndShowThemeStep(postType);
            });
        });
    }

    if (backToTypeSelectionStepButton) {
        backToTypeSelectionStepButton.addEventListener('click', () => {
            showCreationStep(step1SelectType);
            if(createPostMainTitleEl) createPostMainTitleEl.textContent = "Создание Нового Поста";
            currentSelectedPostType = null; currentSelectedThemeId = null;
        });
    }
    if (closeCreatePostScreenButton) { // Кнопка "Отмена" на экране создания поста
        closeCreatePostScreenButton.addEventListener('click', () => {
            showScreen(studioContainer);
            showCreationStep(step1SelectType); // Сброс на первый шаг
            if(createPostMainTitleEl) createPostMainTitleEl.textContent = "Создание Нового Поста";
            currentSelectedPostType = null; currentSelectedThemeId = null;
        });
    }


    // Модальные окна (кроме create-post)
    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); showScreen(studioContainer); } }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => {
        showScreen(createPostScreen); // Показываем новый экран создания поста
        showCreationStep(step1SelectType); // Убедимся, что показан первый шаг
        if(createPostMainTitleEl) createPostMainTitleEl.textContent = "Создание Нового Поста";
        currentSelectedPostType = null;
        currentSelectedThemeId = null;
    });
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в предыдущем полном коде ... */ }

    // Действия игры
    function handlePostAction(postType, themeId, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) { // Добавлен themeId
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
            const themeData = POST_THEMES[postType]?.find(t => t.id === themeId);
            const themeName = themeData ? themeData.displayName : "Общая тема"; 
            const themePostMultiplier = themeData ? themeData.baseMultiplier : 1; 

            const themeModKey = postType; const themeMod = gameState.themeModifiers[themeModKey] || 1;
            const moodMultiplier = 0.8 + (gameState.audienceMood / 100) * 0.4; let trendBonusMultiplier = 1;
            if (gameState.currentTrend && gameState.currentTrend.type === postType && gameState.trendPostsRemaining > 0) { 
                trendBonusMultiplier = parseFloat(gameState.currentTrend.bonus); 
                gameState.audienceMood = Math.min(gameState.audienceMood + 5, 100); 
                logEvent(`Пост "${getPostTypeName(postType)}" на тему "${themeName}" попал в тренд! Бонус x${trendBonusMultiplier}!`, 'info');
            }
            
            let finalSubGainMultiplier = gameState.contentQualityMultiplier * themeMod * moodMultiplier * trendBonusMultiplier * themePostMultiplier;
            const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * finalSubGainMultiplier);
            const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier * themePostMultiplier); // Тема влияет и на деньги

            gameState.subscribers += subGain; gameState.balance += moneyGain; gameState.postsMade++;
            let moodChange = 0; if (subGain > 2) moodChange = Math.floor(gameState.contentQualityMultiplier * 1.5); else if (subGain < 0 && gameState.subscribers > 0) moodChange = -5; gameState.audienceMood = Math.min(Math.max(gameState.audienceMood + moodChange, 0), 100);
            if (gameState.audienceMood < 30 && gameState.subscribers > 10) { const uC = (30 - gameState.audienceMood) / 30; if (Math.random() < uC * 0.05) { const unsub = Math.min(gameState.subscribers, Math.floor(Math.random()*(gameState.subscribers*0.03)+1)); gameState.subscribers -= unsub; logEvent(`Аудитория недовольна! Отписалось ${unsub} подписчиков.`, 'error'); gameState.audienceMood = Math.max(gameState.audienceMood - 3, 0);}}
            logEvent(`Пост "${getPostTypeName(postType)}" на тему "${themeName}" опубликован! +${subGain} п., +$${moneyGain}.`, 'success');
            if (gameState.currentTrend && gameState.trendPostsRemaining > 0) { gameState.trendPostsRemaining--; }
            if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { if (Math.random() < 0.20) { generateNewTrend(); }}
            
            if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); } else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); }
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.notificationOccurred('success');
            
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) { setTimeout(() => { const rU = `User${Math.floor(Math.random()*1000)}`; if(Math.random()<0.3){showFeedback(reactionEmojis[Math.floor(Math.random()*reactionEmojis.length)],true,rU);}else{let cA;if(gameState.audienceMood>70&&subGain>5)cA=positiveComments;else if(gameState.audienceMood<40||subGain<1)cA=negativeComments;else cA=neutralComments;showFeedback(cA[Math.floor(Math.random()*cA.length)],false,rU);}},i*(Math.random()*500+300));}
            
            showScreen(studioContainer); // Возвращаемся в студию
        }, 700); 
    }
     
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как раньше, но closeModal(upgradesModal) в конце ... */ });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }
});
