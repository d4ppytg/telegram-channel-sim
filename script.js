document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started (FINAL CLICK FIX ATTEMPT).");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables ---
    function getElem(id, required = true) { /* ... как раньше ... */ }
    function querySelAll(selector, parent = document, required = true) { /* ... как раньше ... */ }
    // ... (ВСЕ объявления переменных для элементов DOM, как в вашем последнем ПОЛНОМ script.js) ...
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
    const monitorSteps = { /* ... */ }; // Как в предыдущем коде
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
    // ... (MAX_FEEDBACK_ITEMS, комментарии, эмодзи, CHARACTER_STATES - как раньше) ...
    let currentPostCreation = { type: null, themeId: null, effort: 2 };
    let defaultGameState = {
        // ...
        gameVersion: "1.0.4_finalClickFix", 
        // ...
    };
    let gameState = { ...defaultGameState };

    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }
    tg.ready();
    tg.expand();
    console.log("DEBUG: Telegram WebApp SDK ready and expanded.");

    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }

    // --- Screen Management (КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ) ---
    function showTopLevelScreen(screenElementToShow) {
        console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null_element");
        const allScreens = [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface, logModal];

        allScreens.forEach(el => {
            if (el) {
                if (el === screenElementToShow) {
                    el.style.display = 'flex';
                    el.style.pointerEvents = 'auto'; // АКТИВНЫЙ экран ДОЛЖЕН быть кликабельным
                    // Небольшая задержка перед добавлением .visible для CSS transition
                    requestAnimationFrame(() => { el.classList.add('visible'); });
                    console.log(`DEBUG: Showing ${el.id}, pointerEvents: auto`);
                } else {
                    el.classList.remove('visible');
                    el.style.pointerEvents = 'none'; // НЕАКТИВНЫЕ экраны НЕ должны быть кликабельными
                    // Скрываем с задержкой, если был видим, чтобы анимация opacity успела
                    if (getComputedStyle(el).opacity === '1' || el.style.display !== 'none') {
                        setTimeout(() => { if(el.style.opacity !== '0') el.style.display = 'none'; }, 400); // Должно быть >= transition-duration
                    } else {
                        el.style.display = 'none';
                    }
                    // console.log(`DEBUG: Hiding ${el.id}, pointerEvents: none`);
                }
            }
        });
        if (!screenElementToShow) { console.error("DEBUG: showTopLevelScreen: target element is null!");}
    }

    function setActiveGameScreen(targetScreenId) {
        console.log("DEBUG: setActiveGameScreen called for:", targetScreenId);
        if (!allGameScreens || allGameScreens.length === 0) { console.error("allGameScreens not found!"); return; }
        
        allGameScreens.forEach(screen => {
            if (screen) {
                const isActive = screen.id === targetScreenId;
                screen.style.display = isActive ? 'flex' : 'none';
                screen.classList.toggle('active-screen', isActive);
                screen.style.pointerEvents = isActive ? 'auto' : 'none';
            }
        });
        // ... (остальная логика setActiveGameScreen как раньше) ...
    }
    
    // ... (playCutscene, showNextSlide, initializeGameFlow, showThemeSelectionScreen, showWelcomeScreen, startGameplay - как в последнем полном скрипте с отладкой) ...
    // Убедитесь, что initializeGameFlow вызывает showThemeSelectionScreen() в нужной ветке.

    function initializeGameFlow() { 
        console.log("DEBUG: --- initializeGameFlow START ---");
        let savedStateJson = null; let themeFromStorage = null;
        try {
            savedStateJson = localStorage.getItem('channelSimGameState_v13_clickable_focus'); 
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
        console.log("DEBUG: Game saved, NOW attempting to show Theme Selection Screen...");
        showThemeSelectionScreen(); // ЭТОТ ВЫЗОВ КРИТИЧЕН
    }
    
    // --- Load/Save/Log/UI Updates, Trends, Monitor Logic, Navigation, Modals, Feedback, Game Actions ---
    // ВЕСЬ ОСТАЛЬНОЙ КОД из предыдущего полного `script.js` (версия 1.0.2_debugFocus)
    // должен быть здесь без изменений, КРОМЕ:
    // - Ключ localStorage: `channelSimGameState_v13_clickable_focus`
    // - Версия игры в defaultGameState: `1.0.4_finalClickFix`
    // - Убедитесь, что все вызовы `showTopLevelScreen` и `setActiveGameScreen` корректны.
    // - Обработчики для `.theme-card` должны быть на месте и с `console.log` при клике.

    // --- ОБРАБОТЧИКИ ВЫБОРА ТЕМЫ (оставляем с усиленной отладкой) ---
    if (themeSelectionScreen) {
        // ... (код назначения обработчиков для themeCards с console.log, как в последнем вашем рабочем скрипте) ...
    } else {
        console.error("DEBUG: CRITICAL - #theme-selection-screen element NOT FOUND for attaching listeners AT SCRIPT LOAD!");
    }

    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader...");
    if (preloader) {
        showTopLevelScreen(preloader); // Показываем прелоадер ПРАВИЛЬНО
    } else { 
        console.error("DEBUG: Preloader is null, cannot show. Attempting to start game flow directly.");
        initializeGameFlow();
    }
    
    setTimeout(() => {
        console.log("DEBUG: Preloader timeout! Hiding preloader, calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            preloader.style.pointerEvents = 'none'; 
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("DEBUG: Preloader display set to none.");
            }, 500); // Соответствует transition-duration + небольшой запас
        }
        initializeGameFlow();
    }, 2500); 

    // ... (startGameButton listener, tg.BackButton listener - как были) ...

    console.log("DEBUG: Script execution finished setup.");
});
