document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables (с проверками) ---
    function getElem(id, required = true) {
        const element = document.getElementById(id);
        if (!element && required) {
            console.error(`FATAL ERROR: Element with ID '${id}' NOT FOUND in DOM!`);
        } else if (element && required) {
            // console.log(`Element '${id}' found.`); // Можно раскомментировать для детальной проверки
        }
        return element;
    }

    function querySel(selector, parent = document, required = true) {
        const element = parent.querySelector(selector);
        if (!element && required) {
            console.error(`FATAL ERROR: Element with selector '${selector}' NOT FOUND!`);
        } else if (element && required) {
            // console.log(`Element '${selector}' found.`);
        }
        return element;
    }
    
    function querySelAll(selector, parent = document, required = true) {
        const elements = parent.querySelectorAll(selector);
        if ((!elements || elements.length === 0) && required) {
            console.warn(`Warning: No elements found for selector '${selector}'.`);
        } else if (elements && elements.length > 0 && required) {
            // console.log(`${elements.length} elements for '${selector}' found.`);
        }
        return elements;
    }

    // Screens & Overlays
    const preloader = getElem('preloader');
    const themeSelectionScreen = getElem('theme-selection-screen');
    const welcomeScreen = getElem('welcome-screen');
    const cutsceneScreen = getElem('cutscene-screen');
    const gameInterface = getElem('game-interface');
    const gameScreensContainer = getElem('game-screens-container');
    const allGameScreens = gameScreensContainer ? querySelAll('.game-screen', gameScreensContainer, false) : [];
    
    const startGameButton = getElem('start-game-button', false); // Может не быть на всех этапах
    const cutsceneSlides = cutsceneScreen ? querySelAll('.cutscene-slide', cutsceneScreen, false) : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = getElem('telegram-username-display', false);
    const userPhotoEl = getElem('user-photo', false);

    const characterEl = getElem('character-sprite', false); // На studioScreen
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
    const monitorThemeTextButtons = monitorSteps.selectThemeText ? querySelAll('.monitor-theme-button', monitorSteps.selectThemeText, false) : [];
    const effortSlider = getElem('effort-slider', false);
    const effortLevelDisplay = getElem('effort-level-display', false);
    const selectedThemeNameDisplay = monitorSteps.qualityText ? querySel('.selected-theme-name-monitor', monitorSteps.qualityText, false) : null;
    const monitorPublishButton = monitorSteps.qualityText ? querySel('.monitor-publish-button', monitorSteps.qualityText, false) : null;
    const monitorCancelButtons = querySelAll('#monitor-content-area .monitor-cancel-button', document, false);
    const monitorBackButtons = querySelAll('#monitor-content-area .monitor-back-button', document, false);
    
    const navButtons = querySelAll('.bottom-nav .nav-button', document, false);
    const upgradeContentQualityButton = querySel('#upgradesScreen #upgrade-content-quality', document, false);
    const upgradeCostSpan = upgradeContentQualityButton ? querySel('.upgrade-cost', upgradeContentQualityButton, false) : null;
    
    const liveFeedbackContainer = getElem('live-feedback-container', false);

    // --- Game State & Constants ---
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
        gameVersion: "1.0.1_debugFull", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    // --- Initial Checks ---
    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }
    tg.ready();
    tg.expand();
    console.log("DEBUG: Telegram WebApp SDK ready and expanded.");

    // --- Character Animation ---
    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }

    // --- Screen Management ---
    function showTopLevelScreen(screenElementToShow) {
        console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null element");
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { 
                screenElementToShow.classList.add('visible'); 
                console.log(`DEBUG: ${screenElementToShow.id} class 'visible' added, display is ${getComputedStyle(screenElementToShow).display}.`);
            }); });
        } else {
            console.error("DEBUG: showTopLevelScreen: target element is null or undefined!");
        }
    }

    function setActiveGameScreen(targetScreenId) { /* ... как раньше, с console.log ... */ }
    function playCutscene() { /* ... как раньше, с console.log ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        console.log("DEBUG: --- initializeGameFlow START ---");
        let savedStateJson = null; let themeFromStorage = null;
        try {
            savedStateJson = localStorage.getItem('channelSimGameState_v11_debug'); 
            console.log("DEBUG: localStorage raw data for 'channelSimGameState_v11_debug':", savedStateJson);
            if (savedStateJson) { 
                const parsedState = JSON.parse(savedStateJson); 
                gameState = { ...defaultGameState, ...parsedState }; 
                themeFromStorage = gameState.theme; 
                console.log("DEBUG: Loaded game state. gameState.theme is:", themeFromStorage);
                if (themeFromStorage) { 
                    console.log("DEBUG: Theme IS PRESENT in loaded state. Showing Welcome Screen.");
                    showWelcomeScreen(); return; 
                } else { console.log("DEBUG: Theme IS NULL or UNDEFINED in loaded state."); }
            } else { console.log("DEBUG: No saved state found in localStorage."); }
        } catch (e) { console.error("DEBUG: Error during localStorage getItem or JSON.parse:", e); savedStateJson = null; }
        
        console.log("DEBUG: Proceeding to new game setup / theme selection.");
        gameState = { ...defaultGameState }; 
        console.log("DEBUG: gameState reset to default. gameState.theme is now:", gameState.theme); 
        saveGame(); 
        console.log("DEBUG: Game saved, NOW attempting to show Theme Selection Screen...");
        showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { console.log("DEBUG: --- showThemeSelectionScreen CALLED ---"); console.log("DEBUG: LOG (from showThemeSelectionScreen): Требуется выбор тематики канала."); if (themeSelectionScreen) { showTopLevelScreen(themeSelectionScreen); } else { console.error("DEBUG: !!! CANNOT SHOW Theme Selection Screen because themeSelectionScreen is NULL !!!"); }}
    function showWelcomeScreen() { console.log("DEBUG: --- showWelcomeScreen CALLED ---"); /* ... остальная логика ... */ showTopLevelScreen(welcomeScreen); }
    function startGameplay() { console.log("DEBUG: --- startGameplay START ---"); /* ... остальная логика ... */ }

    function loadGame() { /* ... как раньше, с ключом v11_debug ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v11_debug', JSON.stringify(gameState)); console.log("DEBUG: Game saved."); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше ... */ }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- ИНТЕРАКТИВНЫЙ МОНИТОР ---
    function showMonitorStep(stepElementToShow) { /* ... как в предыдущем полном коде ... */ }
    if (initiatePostCreationButton) { /* ... */ } else { console.warn("DEBUG: initiatePostCreationButton not found for event listener."); }
    if (monitorCancelButtons) monitorCancelButtons.forEach(button => { /* ... */ });
    if (monitorBackButtons) monitorBackButtons.forEach(button => { /* ... */ });
    if (monitorPostTypeButtons) monitorPostTypeButtons.forEach(button => { /* ... */ });
    if (monitorSteps.selectThemeText && monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button')) {
        monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button').forEach(button => { /* ... */ });
    }
    if (effortSlider) { /* ... */ }
    if (monitorPublishButton) { /* ... */ } else { console.warn("DEBUG: monitorPublishButton not found for event listener.");}
    
    // Навигация
    if (navButtons) navButtons.forEach(button => { /* ... */ });
    // Модальное окно для лога
    function openModal(modalElement) { /* ... */ }
    function closeModal(modalElement) { /* ... */ }
    if(openLogButton) { /* ... */ }
    if(closeModalButtons) closeModalButtons.forEach(button => { /* ... */ });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... */ }

    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в предыдущем полном коде ... */ }
    const postTextBtnCreateScreen = document.querySelector('#createPostScreen #post-text-button');
    const postMemeBtnCreateScreen = document.querySelector('#createPostScreen #post-meme-button');
    const postVideoBtnCreateScreen = document.querySelector('#createPostScreen #post-video-button');

    if(postTextBtnCreateScreen) postTextBtnCreateScreen.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5, currentPostCreation.effort, currentPostCreation.themeId));
    else console.warn("DEBUG: postTextButton on createPostScreen not found");

    if(postMemeBtnCreateScreen) postMemeBtnCreateScreen.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8, currentPostCreation.effort, currentPostCreation.themeId));
    else console.warn("DEBUG: postMemeButton on createPostScreen not found");

    if(postVideoBtnCreateScreen) postVideoBtnCreateScreen.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10, currentPostCreation.effort, currentPostCreation.themeId));
    else console.warn("DEBUG: postVideoButton on createPostScreen not found");
    
    if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как в предыдущем полном коде ... */ });

    if (themeSelectionScreen) {
        const themeCards = querySelAll('.theme-card', themeSelectionScreen, false);
        if (themeCards && themeCards.length > 0) {
            themeCards.forEach(card => { card.addEventListener('click', () => { /* ... как раньше ... */ }); });
        } else { console.warn("DEBUG: No theme cards found on themeSelectionScreen."); }
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader...");
    if (preloader) {
        showTopLevelScreen(preloader);
    } else {
        console.error("DEBUG: Preloader is null, cannot show. Attempting to start game flow directly.");
        initializeGameFlow(); // Если прелоадера нет, пытаемся запустить игру
    }
    

    setTimeout(() => {
        console.log("DEBUG: Preloader timeout! Hiding preloader, calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("DEBUG: Preloader display set to none.");
            }, 700); 
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }

    console.log("DEBUG: Script execution finished setup.");
});
