document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded - Script execution started.");
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const gameInterface = document.getElementById('game-interface');
    const gameScreensContainer = document.getElementById('game-screens-container');
    const allGameScreens = gameScreensContainer ? gameScreensContainer.querySelectorAll('.game-screen') : [];
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const gameVersionEl = document.getElementById('game-version'); 
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');
    
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    const openLogButton = document.getElementById('open-log-button');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');
    const eventLogUl = document.getElementById('event-log');

    const initiatePostCreationButton = document.getElementById('initiate-post-creation-button');
    const monitorSteps = {
        selectType: document.getElementById('monitor-step-select-type'),
        selectThemeText: document.getElementById('monitor-step-select-theme-text'),
        qualityText: document.getElementById('monitor-step-quality-text'),
    };
    const monitorPostTypeButtons = monitorSteps.selectType ? monitorSteps.selectType.querySelectorAll('.monitor-button') : [];
    const monitorThemeTextButtons = monitorSteps.selectThemeText ? monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button') : [];
    const effortSlider = document.getElementById('effort-slider');
    const effortLevelDisplay = document.getElementById('effort-level-display');
    const selectedThemeNameDisplay = document.querySelector('#monitor-step-quality-text .selected-theme-name-monitor');
    const monitorPublishButton = document.querySelector('#monitor-step-quality-text .monitor-publish-button');
    const monitorCancelButtons = document.querySelectorAll('#monitor-content-area .monitor-cancel-button');
    const monitorBackButtons = document.querySelectorAll('#monitor-content-area .monitor-back-button');
    let currentPostCreation = { type: null, themeId: null, effort: 2 };

    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = document.querySelector('#upgradesScreen .upgrade-cost');
    
    const liveFeedbackContainer = document.getElementById('live-feedback-container');
    const MAX_FEEDBACK_ITEMS = 7;
    const positiveComments = ["Круто!", "Лучший!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гений!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];

    // Проверка ключевых элементов
    if (!preloader) console.error("Preloader element not found!");
    if (!gameInterface) console.error("Game Interface element not found!");


    tg.ready();
    tg.expand();
    console.log("Telegram WebApp SDK ready and expanded.");

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "1.0.1_debug", // Обновленная версия для отладки
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

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

    function showTopLevelScreen(screenElementToShow) {
        console.log("showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null");
        const screens = [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface];
        screens.forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { 
                requestAnimationFrame(() => { 
                    screenElementToShow.classList.add('visible'); 
                    console.log(screenElementToShow.id + " should be visible now.");
                }); 
            });
        } else {
            console.error("showTopLevelScreen called with null or undefined element!");
        }
    }

    function setActiveGameScreen(targetScreenId) {
        console.log("setActiveGameScreen called for:", targetScreenId);
        if (!allGameScreens || allGameScreens.length === 0) {
            console.error("allGameScreens not found or empty!");
            return;
        }
        allGameScreens.forEach(screen => {
            if (screen) {
                const isActive = screen.id === targetScreenId;
                screen.style.display = isActive ? 'flex' : 'none';
                screen.classList.toggle('active-screen', isActive);
            }
        });
        if (navButtons) {
            navButtons.forEach(button => {
                if (button) button.classList.toggle('active', button.dataset.targetScreen === targetScreenId);
            });
        }
        if (studioSidePanel) {
            studioSidePanel.style.display = (targetScreenId === 'studioScreen') ? 'flex' : 'none';
        }
        if(gameScreensContainer) gameScreensContainer.scrollTop = 0;
        console.log("Active game screen set to:", targetScreenId);
    }
    
    function playCutscene() { 
        console.log("--- playCutscene START ---");
        showTopLevelScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides && cutsceneSlides.length > 0 && cutsceneSlides[0]) {
             cutsceneSlides[0].style.display = 'flex'; cutsceneSlides[0].classList.add('active'); 
        } else {
            console.warn("No cutscene slides found, skipping to gameplay.");
            startGameplay(); // Если слайдов нет, сразу к игре
            return;
        }
        setTimeout(showNextSlide, 3000);
    }
    function showNextSlide() { /* ... как в предыдущем полном коде ... */ }
    
    function initializeGameFlow() { 
        console.log("--- initializeGameFlow START ---");
        let savedState = null;
        try {
            savedState = localStorage.getItem('channelSimGameState_v10_interactiveMonitor'); 
            if (savedState) { 
                const parsedState = JSON.parse(savedState); 
                gameState = { ...defaultGameState, ...parsedState }; 
                console.log("Loaded game state:", gameState);
                if (gameState.theme) { 
                    console.log("Theme found, showing Welcome Screen");
                    showWelcomeScreen(); return; 
                }
            }
        } catch (e) {
            console.error("Error parsing saved state from localStorage:", e);
            // Если ошибка парсинга, сбрасываем до дефолта
            savedState = null; 
        }
        
        console.log("No valid saved state or no theme, showing Theme Selection Screen");
        gameState = { ...defaultGameState }; saveGame(); 
        showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... */ console.log("Showing Theme Selection Screen"); showTopLevelScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... */ console.log("Showing Welcome Screen"); showTopLevelScreen(welcomeScreen); }
    
    function startGameplay() { 
        console.log("--- startGameplay START ---");
        loadGame(); 
        showTopLevelScreen(gameInterface); 
        setActiveGameScreen('studioScreen'); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Игра запущена! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { /* ... */ }
    function saveGame() { /* ... */ }
    function logEvent(message, type = 'info') { /* ... */ }
    function updateUI() { /* ... */ }
    function checkUpgradeButtonStatus() { /* ... */ }
    function updateTrendUI() { /* ... */ }
    function generateNewTrend() { /* ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- ИНТЕРАКТИВНЫЙ МОНИТОР ---
    function showMonitorStep(stepElementToShow) { /* ... как в предыдущем полном коде ... */ }
    if (initiatePostCreationButton) { /* ... */ }
    if (monitorCancelButtons) monitorCancelButtons.forEach(button => { /* ... */ });
    if (monitorBackButtons) monitorBackButtons.forEach(button => { /* ... */ });
    if (monitorPostTypeButtons) monitorPostTypeButtons.forEach(button => { /* ... */ });
    if (monitorSteps.selectThemeText && monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button')) {
        monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button').forEach(button => { /* ... */ });
    }
    if (effortSlider) { /* ... */ }
    if (monitorPublishButton) { /* ... */ }
    
    // Навигация
    if (navButtons) navButtons.forEach(button => { /* ... */ });
    if (initiatePostCreationButton) {
    initiatePostCreationButton.addEventListener('click', () => {
        currentPostCreation = { type: null, themeId: null, effort: effortSlider ? parseInt(effortSlider.value) : 2 };
        showMonitorStep(monitorSteps.selectType);
    });
} else {
    console.error("Кнопка 'initiatePostCreationButton' не найдена!");
}

    // Модальное окно для лога
    function openModal(modalElement) { /* ... */ }
    function closeModal(modalElement) { /* ... */ }
    if(openLogButton) { /* ... */ }
    if(closeModalButtons) closeModalButtons.forEach(button => { /* ... */ });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... */ }

    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в предыдущем полном коде ... */ }
     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5, currentPostCreation.effort, currentPostCreation.themeId));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8, currentPostCreation.effort, currentPostCreation.themeId));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10, currentPostCreation.effort, currentPostCreation.themeId));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как в предыдущем полном коде ... */ });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("Attempting to show preloader...");
    showTopLevelScreen(preloader); // Показываем прелоадер первым

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
