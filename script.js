document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables ---
    function getElem(id, required = true) {
        const element = document.getElementById(id);
        if (!element && required) console.error(`DEBUG FATAL: Element with ID '${id}' NOT FOUND!`);
        return element;
    }
    function querySelAll(selector, parent = document, required = true) {
        const elements = parent.querySelectorAll(selector);
        if ((!elements || elements.length === 0) && required) console.warn(`DEBUG Warning: No elements found for selector '${selector}'.`);
        return elements;
    }

    const preloader = getElem('preloader');
    const themeSelectionScreen = getElem('theme-selection-screen');
    const welcomeScreen = getElem('welcome-screen');
    const cutsceneScreen = getElem('cutscene-screen');
    const gameInterface = getElem('game-interface');
    const gameScreensContainer = getElem('game-screens-container');
    const allGameScreens = gameScreensContainer ? querySelAll('.game-screen', gameScreensContainer, false) : [];
    
    const startGameButton = getElem('start-game-button', false);
    const cutsceneSlides = cutsceneScreen ? querySelAll('.cutscene-slide', cutsceneScreen, false) : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = getElem('telegram-username-display', false);
    const userPhotoEl = getElem('user-photo', false);

    const characterEl = getElem('character-sprite', false);
    let characterStateTimeout; 

    const subscribersCountEl = getElem('subscribers-count', false);
    const balanceCountEl = getElem('balance-count', false);
    const audienceMoodDisplay = getElem('audience-mood-display', false);
    
    const channelNameOnMonitorEl = getElem('channel-name-on-monitor', false);
    const gameVersionEl = getElem('game-version', false); 
    const currentTrendDisplayMonitor = getElem('current-trend-display-monitor', false);
    const trendDescriptionMonitorEl = getElem('trend-description-monitor', false);
    
    const studioSidePanel = getElem('studio-side-panel', false); 
    const openLogButton = getElem('open-log-button', false);
    const logModal = getElem('log-modal', false);
    const closeModalButtons = querySelAll('.close-modal-button', document, false);
    const eventLogUl = getElem('event-log', false);

    const initiatePostCreationButton = getElem('initiate-post-creation-button', false);
    const monitorSteps = {
        selectType: getElem('monitor-step-select-type', false),
        selectThemeText: getElem('monitor-step-select-theme-text', false),
        qualityText: getElem('monitor-step-quality-text', false),
    };
    const monitorPostTypeButtons = monitorSteps.selectType ? querySelAll('.monitor-button', monitorSteps.selectType, false) : [];
    const effortSlider = getElem('effort-slider', false);
    const effortLevelDisplay = getElem('effort-level-display', false);
    const selectedThemeNameDisplay = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.selected-theme-name-monitor') : null;
    const monitorPublishButton = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.monitor-publish-button') : null;
    const monitorCancelButtons = querySelAll('#monitor-content-area .monitor-cancel-button', document, false);
    const monitorBackButtons = querySelAll('#monitor-content-area .monitor-back-button', document, false);
    
    const navButtons = querySelAll('.bottom-nav .nav-button', document, false);
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = upgradeContentQualityButton ? upgradeContentQualityButton.querySelector('.upgrade-cost') : null;
    
    const liveFeedbackContainer = getElem('live-feedback-container', false);

    const MAX_FEEDBACK_ITEMS = 7;
    const positiveComments = ["Круто!", "Лучший!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гений!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];
    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };
    
    let currentPostCreation = { type: null, themeId: null, effort: 2 };
    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "1.0.3_finalAttempt", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }
    tg.ready();
    tg.expand();
    console.log("DEBUG: Telegram WebApp SDK ready and expanded.");

    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }
    function showTopLevelScreen(screenElementToShow) {
        console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null_element");
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface, logModal].forEach(el => { // Добавил logModal в список скрываемых
            if (el) { el.classList.remove('visible'); el.style.display = 'none'; el.style.pointerEvents = 'none';}
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { 
                screenElementToShow.classList.add('visible'); 
                screenElementToShow.style.pointerEvents = 'auto';
                console.log(`DEBUG: ${screenElementToShow.id} class 'visible' added, display: ${getComputedStyle(screenElementToShow).display}, pointerEvents: ${getComputedStyle(screenElementToShow).pointerEvents}`);
            }); });
        } else { console.error("DEBUG: showTopLevelScreen: target element is null or undefined!");}
    }
    function setActiveGameScreen(targetScreenId) { /* ... как раньше, с console.log ... */ }
    function playCutscene() { /* ... как раньше с console.log ... */ }
    function showNextSlide() { /* ... как раньше, но в конце startGameplay() ... */ }
    
    function initializeGameFlow() { 
        console.log("DEBUG: --- initializeGameFlow START ---");
        let savedStateJson = null; let themeFromStorage = null;
        try {
            savedStateJson = localStorage.getItem('channelSimGameState_v12_finalAttempt'); 
            console.log("DEBUG: localStorage raw data:", savedStateJson);
            if (savedStateJson) { 
                const parsedState = JSON.parse(savedStateJson); 
                gameState = { ...defaultGameState, ...parsedState }; 
                themeFromStorage = gameState.theme; 
                console.log("DEBUG: Loaded game state. gameState.theme is:", themeFromStorage);
                if (themeFromStorage) { 
                    console.log("DEBUG: Theme IS PRESENT. Showing Welcome Screen.");
                    showWelcomeScreen(); return; 
                } else { console.log("DEBUG: Theme IS NULL in loaded state."); }
            } else { console.log("DEBUG: No saved state found."); }
        } catch (e) { console.error("DEBUG: Error localStorage/JSON.parse:", e); savedStateJson = null; }
        
        console.log("DEBUG: Proceeding to new game or theme selection.");
        gameState = { ...defaultGameState }; 
        console.log("DEBUG: gameState reset. theme:", gameState.theme); 
        saveGame(); 
        console.log("DEBUG: Game saved, NOW show Theme Selection.");
        showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { 
        console.log("DEBUG: --- showThemeSelectionScreen CALLED ---"); 
        if (themeSelectionScreen) { 
            console.log("DEBUG: themeSelectionScreen IS found. Calling showTopLevelScreen.");
            showTopLevelScreen(themeSelectionScreen); 
        } else { console.error("DEBUG: !!! themeSelectionScreen is NULL !!!"); }
    }
    function showWelcomeScreen() { /* ... как раньше, с console.log и showTopLevelScreen ... */ }
    function startGameplay() { /* ... как раньше, с console.log, setCharacterState и setActiveGameScreen('studioScreen') ... */ }
    function loadGame() { /* ... как раньше, с ключом v12_finalAttempt ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v12_finalAttempt', JSON.stringify(gameState)); console.log("DEBUG: Game saved."); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше ... */ }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }
    function showMonitorStep(stepElementToShow) { /* ... как раньше, с setCharacterState ... */ }
    
    // --- ОБРАБОТЧИКИ ВЫБОРА ТЕМЫ ---
    if (themeSelectionScreen) {
        console.log("DEBUG: Attaching listeners to theme cards. themeSelectionScreen is:", themeSelectionScreen);
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        console.log(`DEBUG: Found ${themeCards.length} theme cards.`);
        if (themeCards && themeCards.length > 0) {
            themeCards.forEach((card, index) => {
                console.log(`DEBUG: Adding click listener to theme card ${index + 1} (data-theme: ${card.dataset.theme})`);
                card.addEventListener('click', () => {
                    console.log(`DEBUG: Theme card CLICKED! Theme: ${card.dataset.theme}`);
                    const selectedTheme = card.dataset.theme;
                    gameState.theme = selectedTheme; gameState.audienceMood = 75;
                    switch(selectedTheme) { /* ... как раньше ... */ }
                    logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                    console.log("DEBUG: Theme selected, saving and showing welcome screen...");
                    saveGame(); showWelcomeScreen();
                });
            });
            console.log("DEBUG: Event listeners successfully ADDED to all theme cards.");
       /* --- THEME SELECTION SCREEN STYLES --- */
#theme-selection-screen.visible .theme-selection-content { 
    /* Стили для контента, когда сам экран видим */
    /* pointer-events: auto; -- УБЕРЕМ ЭТО ПОКА ОТСЮДА */
}

#theme-selection-screen .theme-selection-content { 
    /* background-color: var(--color-card-bg); -- ВРЕМЕННО СДЕЛАЕМ ПРОЗРАЧНЫМ */
    background-color: rgba(0, 255, 0, 0.1); /* Полупрозрачный зеленый для отладки */
    padding: 25px; 
    border-radius: var(--border-radius-lg); 
    /* box-shadow: 0 10px 30px rgba(0,0,0,0.4); -- ВРЕМЕННО УБЕРЕМ ТЕНЬ */
    max-width: 600px; 
    width: 90%; 
    text-align: center; 
    max-height: calc(100vh - 40px); 
    overflow-y: auto;
    box-sizing: border-box;
    pointer-events: none; /* ВАЖНО: Сам контейнер контента НЕ должен перехватывать клики */
}

/* ... (стили для h2, p, .themes-grid остаются) ... */

#theme-selection-screen .theme-card { 
    background-color: rgba(var(--color-accent-primary-rgb), 0.3); /* Явный фон для карточек */
    border: 2px solid var(--color-accent-primary) !important;  /* Явная рамка */
    padding: 15px; 
    border-radius: var(--border-radius-md); 
    cursor: pointer; 
    transition: all 0.25s ease-in-out; 
    text-align: center; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    box-shadow: 0 3px 10px rgba(0,0,0,0.2); 
    pointer-events: auto !important; /* ВАЖНО: Карточки ДОЛЖНЫ быть кликабельны */
    position: relative; /* Чтобы z-index сработал */
    z-index: 100001 !important; /* Поднять карточки НАД ВСЕМ, включая модальные окна */
}
/* ... (остальные стили для .theme-card, .theme-icon, h3, p остаются) ... */
    
    // --- ОСТАЛЬНЫЕ ОБРАБОТЧИКИ (Интерактивный монитор, Навигация, Модалки, Улучшения) ---
    if (initiatePostCreationButton) { /* ... как раньше ... */ }
    if (monitorCancelButtons) monitorCancelButtons.forEach(button => { /* ... */ });
    if (monitorBackButtons) monitorBackButtons.forEach(button => { /* ... */ });
    if (monitorPostTypeButtons) monitorPostTypeButtons.forEach(button => { /* ... */ });
    if (monitorSteps.selectThemeText) {
        const themeButtons = monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button');
        if (themeButtons) themeButtons.forEach(button => { /* ... */ });
    }
    if (effortSlider) { /* ... */ }
    if (monitorPublishButton) { /* ... */ }
    
    if (navButtons) navButtons.forEach(button => { /* ... */ });
    function openModal(modalElement) { if (modalElement) { modalElement.style.display = 'flex'; requestAnimationFrame(() => modalElement.classList.add('visible')); modalElement.style.pointerEvents = 'auto';} }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); modalElement.style.pointerEvents = 'none'; setTimeout(() => { modalElement.style.display = 'none'; }, 300); } }
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    if(closeModalButtons) closeModalButtons.forEach(button => { /* ... */ });
    function showFeedback(text, isEmoji = false, username = null) { /* ... */ }
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в предыдущем полном коде ... */ }
    // ОБРАБОТЧИКИ ДЛЯ КНОПОК СОЗДАНИЯ ПОСТА НА ЭКРАНЕ createPostScreen (если он будет использоваться)
    // Эти кнопки были в HTML для вкладки #createPostScreen, поэтому их обработчики должны быть здесь
    const postTextBtnTab = document.querySelector('#createPostScreen .content-type-button[data-post-type="text"]');
    const postMemeBtnTab = document.querySelector('#createPostScreen .content-type-button[data-post-type="meme"]');
    const postVideoBtnTab = document.querySelector('#createPostScreen .content-type-button[data-post-type="video"]');

    if(postTextBtnTab) postTextBtnTab.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5, 2, 'generic_text_theme')); // Пример усилия и темы
    else console.warn("DEBUG: postTextButton on createPostScreen TAB not found");
    if(postMemeBtnTab) postMemeBtnTab.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8, 2, 'generic_meme_theme'));
    else console.warn("DEBUG: postMemeButton on createPostScreen TAB not found");
    if(postVideoBtnTab) postVideoBtnTab.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10, 2, 'generic_video_theme'));
    else console.warn("DEBUG: postVideoButton on createPostScreen TAB not found");
    
    if(upgradeContentQualityButton) { /* ... как в предыдущем полном коде ... */ }
    
    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader...");
    if (preloader) {
        showTopLevelScreen(preloader); // Это должно сделать прелоадер видимым и активным
    } else { /* ... */ }
    
    setTimeout(() => {
        console.log("DEBUG: Preloader timeout! Hiding preloader, calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            preloader.style.pointerEvents = 'none';
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("DEBUG: Preloader display set to none.");
            }, 500); // Увеличил немного, чтобы совпадало с transition в CSS
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }

    console.log("DEBUG: Script execution finished setup.");
});
