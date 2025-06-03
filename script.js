document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables (с проверками) ---
    function getElem(id, required = true) { /* ... как в предыдущем полном скрипте ... */ }
    function querySelAll(selector, parent = document, required = true) { /* ... как в предыдущем полном скрипте ... */ }
    // ... (ВСЕ объявления переменных для элементов DOM, как в вашем последнем script.js) ...
    // Экраны и оверлеи
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
        gameVersion: "1.0.3_finalAttempt", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }
    tg.ready();
    tg.expand();
    console.log("DEBUG: Telegram WebApp SDK ready and expanded.");

    // --- Character Animation ---
    function setCharacterState(newState, durationMs = 0) { /* ... как в предыдущем полном коде ... */ }

    // --- Screen Management ---
    function showTopLevelScreen(screenElementToShow) {
        console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null_element");
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface, logModal].forEach(el => {
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

    function setActiveGameScreen(targetScreenId) { /* ... как в предыдущем полном коде ... */ }
    function playCutscene() { /* ... как в предыдущем полном коде ... */ }
    function showNextSlide() { /* ... как в предыдущем полном коде ... */ }
    
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
    function showWelcomeScreen() { /* ... как в предыдущем полном коде ... */ }
    function startGameplay() { /* ... как в предыдущем полном коде ... */ }
    function loadGame() { /* ... как в предыдущем полном коде (с ключом v12_finalAttempt) ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v12_finalAttempt', JSON.stringify(gameState)); console.log("DEBUG: Game saved."); }
    function logEvent(message, type = 'info') { /* ... как в предыдущем полном коде ... */ }
    function updateUI() { /* ... как в предыдущем полном коде ... */ }
    function checkUpgradeButtonStatus() { /* ... как в предыдущем полном коде ... */ }
    function updateTrendUI() { /* ... как в предыдущем полном коде ... */ }
    function generateNewTrend() { /* ... как в предыдущем полном коде ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }
    function showMonitorStep(stepElementToShow) { /* ... как в предыдущем полном коде ... */ }
    
    // --- ОБРАБОТЧИКИ ВЫБОРА ТЕМЫ ---
    if (themeSelectionScreen) {
        console.log("DEBUG: Attaching listeners to theme cards. themeSelectionScreen is:", themeSelectionScreen);
        const themeCards = querySelAll('.theme-card', themeSelectionScreen, false); // Используем нашу функцию
        console.log(`DEBUG: Found ${themeCards.length} theme cards.`);
        if (themeCards && themeCards.length > 0) {
            themeCards.forEach((card, index) => {
                console.log(`DEBUG: Adding click listener to theme card ${index + 1} (data-theme: ${card.dataset.theme})`);
                card.addEventListener('click', () => { /* ... как в предыдущем полном коде ... */ });
            });
            console.log("DEBUG: Event listeners successfully ADDED to all theme cards.");
        } else { console.error("DEBUG: CRITICAL - No theme cards (.theme-card) found INSIDE #theme-selection-screen!"); }
    } else { console.error("DEBUG: CRITICAL - #theme-selection-screen element NOT FOUND for attaching listeners!");}
    
    // --- ОСТАЛЬНЫЕ ОБРАБОТЧИКИ ---
    // ... (Все остальные обработчики для интерактивного монитора, навигации, модалок, улучшений, handlePostAction, showFeedback) ...
    // ... как в ПОЛНОМ `script.js` из ответа "Версия с Усиленной Отладкой Кнопок Темы" ...
    // Убедитесь, что вызовы handlePostAction из кнопок на мониторе И из кнопок на вкладке "Создать" (если они есть) корректны.

    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader...");
    if (preloader) {
        showTopLevelScreen(preloader);
    } else { /* ... */ }
    
    setTimeout(() => {
        console.log("DEBUG: Preloader timeout! Hiding preloader, calling initializeGameFlow.");
        if (preloader) { /* ... скрыть прелоадер ... */ }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }

    console.log("DEBUG: Script execution finished setup.");
});
