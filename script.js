document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables ---
    // Screens & Overlays
    const preloader = document.getElementById('preloader');
   const themeSelectionScreen = document.getElementById('theme-selection-screen');
// Добавьте сразу после этого:
if (!themeSelectionScreen) {
    console.error("FATAL ERROR: themeSelectionScreen element NOT FOUND in DOM!");
} else {
    console.log("themeSelectionScreen element found:", themeSelectionScreen);
}
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const gameInterface = document.getElementById('game-interface');
    const gameScreensContainer = document.getElementById('game-screens-container');
    const allGameScreens = gameScreensContainer ? gameScreensContainer.querySelectorAll('.game-screen') : [];
    
    // Welcome & Cutscene Elements
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    // Character
    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Game Header Stats
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    
    // Studio Screen Elements
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const gameVersionEl = document.getElementById('game-version'); 
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    const openLogButton = document.getElementById('open-log-button');
    
    // Interactive Monitor Elements
    const initiatePostCreationButton = document.getElementById('initiate-post-creation-button');
    const monitorSteps = {
        selectType: document.getElementById('monitor-step-select-type'),
        selectThemeText: document.getElementById('monitor-step-select-theme-text'),
        qualityText: document.getElementById('monitor-step-quality-text'),
    };
    const monitorPostTypeButtons = monitorSteps.selectType ? monitorSteps.selectType.querySelectorAll('.monitor-button') : [];
    // const monitorThemeTextButtons = monitorSteps.selectThemeText ? monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button') : []; // Будет определен позже, если monitorSteps.selectThemeText существует
    const effortSlider = document.getElementById('effort-slider');
    const effortLevelDisplay = document.getElementById('effort-level-display');
    const selectedThemeNameDisplay = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.selected-theme-name-monitor') : null;
    const monitorPublishButton = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.monitor-publish-button') : null;
    const monitorCancelButtons = document.querySelectorAll('#monitor-content-area .monitor-cancel-button');
    const monitorBackButtons = document.querySelectorAll('#monitor-content-area .monitor-back-button');
    
    // Navigation & Other UI
    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = upgradeContentQualityButton ? upgradeContentQualityButton.querySelector('.upgrade-cost') : null;
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');
    const eventLogUl = document.getElementById('event-log');
    const liveFeedbackContainer = document.getElementById('live-feedback-container');

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
        gameVersion: "1.0.1_debug", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    // --- Initial Checks ---
    if (!preloader) console.error("FATAL: Preloader element not found!");
    if (!gameInterface) console.error("FATAL: Game Interface element not found!");
    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }

    tg.ready();
    tg.expand();
    console.log("Telegram WebApp SDK ready and expanded.");

    // --- Character Animation ---
    function setCharacterState(newState, durationMs = 0) {
        if (!characterEl) { console.warn("characterEl not found in setCharacterState"); return; }
        clearTimeout(characterStateTimeout);
        characterEl.className = ''; 
        switch (newState) {
            case CHARACTER_STATES.IDLE_BLINKING: characterEl.classList.add('char-anim-idle-blink'); break;
            case CHARACTER_STATES.TYPING: characterEl.classList.add('char-state-typing'); break;
            case CHARACTER_STATES.HAPPY:
                characterEl.classList.add('char-state-happy');
                if (durationMs > 0) {
                    characterStateTimeout = setTimeout(() => setCharacterState(CHARACTER_STATES.IDLE_BLINKING), durationMs);
                }
                break;
            case CHARACTER_STATES.SLEEPING: characterEl.classList.add('char-state-sleeping'); break;
            default: characterEl.classList.add('char-anim-idle-blink'); break;
        }
    }

    // --- Screen Management ---
    function showTopLevelScreen(screenElementToShow) {
        console.log("showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null element");
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); console.log(screenElementToShow.id + " class 'visible' added.");}); });
        } else {
            console.error("showTopLevelScreen: target element is null or undefined!");
        }
    }

    function setActiveGameScreen(targetScreenId) {
        console.log("setActiveGameScreen called for:", targetScreenId);
        if (!allGameScreens || allGameScreens.length === 0) { console.error("allGameScreens not found or empty!"); return; }
        allGameScreens.forEach(screen => {
            if (screen) {
                const isActive = screen.id === targetScreenId;
                screen.style.display = isActive ? 'flex' : 'none'; // Keep flex for consistency
                screen.classList.toggle('active-screen', isActive);
            }
        });
        if (navButtons) {
            navButtons.forEach(button => {
                if (button) button.classList.toggle('active', button.dataset.targetScreen === targetScreenId);
            });
        }
        if (studioSidePanel) studioSidePanel.style.display = (targetScreenId === 'studioScreen') ? 'flex' : 'none';
        if(gameScreensContainer) gameScreensContainer.scrollTop = 0;
        console.log("Active game screen set to:", targetScreenId);
    }
    
    // --- Cutscene Logic ---
    function playCutscene() { /* ... как в предыдущем полном коде ... */ }
    function showNextSlide() { /* ... как в предыдущем полном коде ... */ }
    
    // --- Game Flow & State Management ---
   function initializeGameFlow() { 
    console.log("--- initializeGameFlow START ---");
    let savedStateJson = null;
    let themeFromStorage = null; // Переменная для отладки

    try {
        savedStateJson = localStorage.getItem('channelSimGameState_v10_interactiveMonitor'); 
        console.log("localStorage raw data:", savedStateJson); // << НОВЫЙ ЛОГ

        if (savedStateJson) { 
            const parsedState = JSON.parse(savedStateJson); 
            gameState = { ...defaultGameState, ...parsedState }; 
            themeFromStorage = gameState.theme; // Сохраняем значение темы из хранилища
            console.log("Loaded game state. gameState.theme is:", themeFromStorage); // << НОВЫЙ ЛОГ
            
            if (themeFromStorage) { // Проверяем именно то, что достали из хранилища
                console.log("Theme IS PRESENT in loaded state. Showing Welcome Screen.");
                showWelcomeScreen(); 
                return; 
            } else {
                console.log("Theme IS NULL or UNDEFINED in loaded state."); // << НОВЫЙ ЛОГ
            }
        } else {
             console.log("No saved state found in localStorage.");
        }
    } catch (e) {
        console.error("Error during localStorage getItem or JSON.parse:", e);
        savedStateJson = null; 
    }
    
    console.log("Proceeding to new game setup / theme selection.");
    gameState = { ...defaultGameState }; 
    console.log("gameState reset to default. gameState.theme is now:", gameState.theme); // << НОВЫЙ ЛОГ
    saveGame(); 
    showThemeSelectionScreen(); 
}
    function showThemeSelectionScreen() { /* ... */ }
    function showWelcomeScreen() { /* ... */ }
    function startGameplay() { /* ... */ }
    function loadGame() { /* ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v10_interactiveMonitor', JSON.stringify(gameState)); console.log("Game saved."); }
    function logEvent(message, type = 'info') { /* ... */ }
    function updateUI() { /* ... */ }
    function checkUpgradeButtonStatus() { /* ... */ }
    function updateTrendUI() { /* ... */ }
    function generateNewTrend() { /* ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- Interactive Monitor Logic ---
    function showMonitorStep(stepElementToShow) {
        const monitorIdleContent = document.getElementById('monitor-idle-content'); // Re-fetch in case of dynamic changes
        if (monitorIdleContent) monitorIdleContent.style.display = 'none';
        
        const stepsArray = monitorSteps ? Object.values(monitorSteps) : [];
        stepsArray.forEach(step => { if (step) step.style.display = 'none';});
        
        if (stepElementToShow) {
            stepElementToShow.style.display = 'flex';
            setCharacterState(CHARACTER_STATES.TYPING); 
        } else {
            if (monitorIdleContent) monitorIdleContent.style.display = 'flex'; // Changed to flex
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        }
    }

    if (initiatePostCreationButton) {
        initiatePostCreationButton.addEventListener('click', () => {
            currentPostCreation = { type: null, themeId: null, effort: effortSlider ? parseInt(effortSlider.value) : 2 };
            showMonitorStep(monitorSteps.selectType);
        });
    } else { console.error("'initiatePostCreationButton' not found!"); }

    if (monitorCancelButtons) monitorCancelButtons.forEach(button => button.addEventListener('click', () => showMonitorStep(null)));
    if (monitorBackButtons) monitorBackButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetStepId = button.dataset.targetStepId;
            showMonitorStep(document.getElementById(targetStepId) || monitorSteps.selectType);
        });
    });

    if (monitorPostTypeButtons) monitorPostTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentPostCreation.type = button.dataset.postType;
            if (currentPostCreation.type === 'text' && monitorSteps.selectThemeText) showMonitorStep(monitorSteps.selectThemeText);
            else { logEvent(`Выбор темы для "${currentPostCreation.type}" не реализован.`, "warning"); showMonitorStep(null); }
        });
    });

    if (monitorSteps.selectThemeText) {
        const themeButtons = monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button');
        if (themeButtons) themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentPostCreation.themeId = button.dataset.themeId;
                if(selectedThemeNameDisplay) selectedThemeNameDisplay.textContent = button.textContent;
                if (monitorSteps.qualityText) showMonitorStep(monitorSteps.qualityText);
                else console.error("monitorSteps.qualityText not found for theme selection next step");
            });
        });
    }

    if (effortSlider) {
        effortSlider.addEventListener('input', () => {
            currentPostCreation.effort = parseInt(effortSlider.value);
            if (effortLevelDisplay) { const levels = ["Низкое", "Среднее", "Высокое"]; effortLevelDisplay.textContent = levels[currentPostCreation.effort - 1]; }
        });
        if (effortLevelDisplay && effortSlider) { const levels = ["Низкое", "Среднее", "Высокое"]; effortLevelDisplay.textContent = levels[parseInt(effortSlider.value) - 1];}
    }

    if (monitorPublishButton) {
        monitorPublishButton.addEventListener('click', () => {
            if (!currentPostCreation.type || (!currentPostCreation.themeId && currentPostCreation.type === 'text')) {
                logEvent("Ошибка: Тип или тема поста не выбраны!", "error"); showMonitorStep(null); return;
            }
            // Определяем параметры для handlePostAction
            let params = [];
            if (currentPostCreation.type === 'text') params = ['text', 1, 5, 2, 10, 1, 5];
            else if (currentPostCreation.type === 'meme') params = ['meme', 3, 10, 1, 5, 2, 8];
            else if (currentPostCreation.type === 'video') params = ['video', 8, 20, 7, 18, 3, 10];
            
            if (params.length > 0) {
                handlePostAction(...params, currentPostCreation.effort, currentPostCreation.themeId);
            }
            showMonitorStep(null);
        });
    } else { console.warn("monitorPublishButton not found"); }
    
    // --- Navigation & Modals ---
    if (navButtons) navButtons.forEach(button => { /* ... */ });
    function openModal(modalElement) { /* ... */ }
    function closeModal(modalElement) { /* ... */ }
    if(openLogButton) { /* ... */ }
    if(closeModalButtons) closeModalButtons.forEach(button => { /* ... */ });

    // --- Live Feedback ---
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в предыдущем полном коде ... */ }

    // --- Game Actions ---
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в предыдущем полном коде ... */ }
    // Удалены обработчики для старых кнопок postTextButton, postMemeButton, postVideoButton, т.к. они теперь часть интерактивного монитора
    if(upgradeContentQualityButton) { /* ... как в предыдущем полном коде ... */ }
    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    // --- INITIALIZATION ---
    console.log("Attempting to show preloader...");
    showTopLevelScreen(preloader); 

    setTimeout(() => {
        console.log("Preloader timeout! Hiding preloader, calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("Preloader display set to none.");
            }, 700); 
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }

    console.log("Script execution finished setup.");
});
