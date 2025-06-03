document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables (с проверками) ---
    function getElem(id, required = true, context = document) {
        const element = context.getElementById(id);
        if (!element && required) {
            console.error(`DEBUG FATAL: Element with ID '${id}' NOT FOUND!`);
        } else if (element && required) {
            // console.log(`DEBUG: Element '${id}' found.`);
        }
        return element;
    }
    function querySel(selector, parent = document, required = true) { /* ... как раньше ... */ }
    function querySelAll(selector, parent = document, required = true) { /* ... как раньше ... */ }

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
        gameVersion: "1.0.2_debugFocus", 
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
    console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null element");
    // СНАЧАЛА СКРЫВАЕМ ВСЕ
    [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface].forEach(el => {
        if (el) { 
            el.classList.remove('visible'); 
            el.style.display = 'none'; // Гарантированно скрываем
            // console.log(`DEBUG: Hiding ${el.id}`);
        }
    });
    // ПОТОМ ПОКАЗЫВАЕМ НУЖНЫЙ
    if (screenElementToShow) {
        console.log(`DEBUG: Attempting to show ${screenElementToShow.id}`);
        screenElementToShow.style.display = 'flex'; 
        requestAnimationFrame(() => { 
            requestAnimationFrame(() => { 
                screenElementToShow.classList.add('visible'); 
                console.log(`DEBUG: ${screenElementToShow.id} class 'visible' added, display is ${getComputedStyle(screenElementToShow).display}.`);
            }); 
        });
    } else { /* ... */ }
}
    function setActiveGameScreen(targetScreenId) { /* ... как раньше с console.log ... */ }
    function playCutscene() { /* ... как раньше с console.log ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        console.log("DEBUG: --- initializeGameFlow START ---");
        let savedStateJson = null; let themeFromStorage = null;
        try {
            savedStateJson = localStorage.getItem('channelSimGameState_v11_debugFocusThemeBtn'); 
            console.log("DEBUG: localStorage raw data:", savedStateJson);
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
    function showThemeSelectionScreen() { 
        console.log("DEBUG: --- showThemeSelectionScreen CALLED ---"); 
        if (themeSelectionScreen) { 
            console.log("DEBUG: themeSelectionScreen element IS found. Calling showTopLevelScreen.");
            showTopLevelScreen(themeSelectionScreen); 
        } else {
            console.error("DEBUG: !!! CANNOT SHOW Theme Selection Screen because themeSelectionScreen is NULL !!!");
        }
    }
    function showWelcomeScreen() { /* ... как раньше ... */ }
    function startGameplay() { /* ... как раньше ... */ }
    function loadGame() { /* ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v11_debugFocusThemeBtn', JSON.stringify(gameState)); console.log("DEBUG: Game saved."); }
    function logEvent(message, type = 'info') { /* ... */ }
    function updateUI() { /* ... */ }
    function checkUpgradeButtonStatus() { /* ... */ }
    function updateTrendUI() { /* ... */ }
    function generateNewTrend() { /* ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }
    function showMonitorStep(stepElementToShow) { /* ... как раньше ... */ }
    function openModal(modalElement) { /* ... */ }
    function closeModal(modalElement) { /* ... */ }
    function showFeedback(text, isEmoji = false, username = null) { /* ... */ }
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как раньше ... */ }

    // --- ОБРАБОТЧИКИ ВЫБОРА ТЕМЫ (с усиленной отладкой) ---
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
                    gameState.theme = selectedTheme; 
                    gameState.audienceMood = 75;
                    switch(selectedTheme) { 
                        case 'news': gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 }; gameState.channelName = "Новостной Вестник"; gameState.balance = 110; break;
                        case 'entertainment': gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 }; gameState.channelName = "Веселый Уголок"; break;
                        case 'education': gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 }; gameState.channelName = "Академия Знаний"; gameState.subscribers = 5; break;
                        case 'tech': gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 }; gameState.channelName = "Техно Гуру"; break;
                    }
                    logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                    console.log("DEBUG: Theme selected, saving game and showing welcome screen...");
                    saveGame(); 
                    showWelcomeScreen();
                });
            });
            console.log("DEBUG: Event listeners successfully ADDED to all theme cards.");
        } else { 
            console.error("DEBUG: CRITICAL - No theme cards (.theme-card) found INSIDE #theme-selection-screen!"); 
        }
    } else {
        console.error("DEBUG: CRITICAL - #theme-selection-screen element NOT FOUND in DOM when trying to attach listeners!");
    }
    
    // --- ОСТАЛЬНЫЕ ОБРАБОТЧИКИ (Интерактивный монитор, Навигация, Модалки, Улучшения) ---
    // ... (весь остальной код для if (initiatePostCreationButton), if (monitorCancelButtons) и т.д. как в последнем полном скрипте) ...
    // Убедитесь, что все селекторы для этих элементов (например, для кнопок на мониторе) правильные
    // и что элементы существуют в вашем HTML. Я добавил console.warn/error если они не найдены.
    
    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader...");
    if (preloader) {
        showTopLevelScreen(preloader);
    } else {
        console.error("DEBUG: Preloader is null, cannot show. Attempting to start game flow directly.");
        initializeGameFlow();
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
