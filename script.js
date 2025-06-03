document.addEventListener('DOMContentLoaded', () => {
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

    // Элементы интерактивного монитора
    const monitorContentArea = document.getElementById('monitor-content-area');
    const monitorIdleContent = document.getElementById('monitor-idle-content');
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

    // Кнопки навигации
    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');

    // Кнопки улучшений (если будут на отдельном экране)
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = document.querySelector('#upgradesScreen .upgrade-cost');
    
    // Всплывающие комментарии
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
        gameVersion: "1.0.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) { /* ... как в предыдущем полном коде ... */ }
    function showTopLevelScreen(screenElementToShow) { /* ... как в предыдущем полном коде ... */ }
    function setActiveGameScreen(targetScreenId) { /* ... как в предыдущем полном коде ... */ }
    function playCutscene() { /* ... как в предыдущем полном коде ... */ }
    function showNextSlide() { /* ... как в предыдущем полном коде ... */ }
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v10_interactiveMonitor'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { logEvent("Требуется выбор тематики канала.", "info"); showTopLevelScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... как в предыдущем полном коде ... */ showTopLevelScreen(welcomeScreen); }
    function startGameplay() { 
        loadGame(); showTopLevelScreen(gameInterface); 
        setActiveGameScreen('studioScreen'); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Игра запущена! Канал: ${gameState.channelName}.`, "info");
    }
    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v10_interactiveMonitor');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v10_interactiveMonitor', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как в предыдущем полном коде ... */ }
    function updateUI() { /* ... как в предыдущем полном коде ... */ }
    function checkUpgradeButtonStatus() { /* ... как в предыдущем полном коде ... */ }
    function updateTrendUI() { /* ... как в предыдущем полном коде ... */ }
    function generateNewTrend() { /* ... как в предыдущем полном коде ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- ИНТЕРАКТИВНЫЙ МОНИТОР ---
    function showMonitorStep(stepElementToShow) {
        if (monitorIdleContent) monitorIdleContent.style.display = 'none';
        Object.values(monitorSteps).forEach(step => { if (step) step.style.display = 'none';});
        if (stepElementToShow) {
            stepElementToShow.style.display = 'flex';
            setCharacterState(CHARACTER_STATES.TYPING); 
        } else {
            if (monitorIdleContent) monitorIdleContent.style.display = 'flex';
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        }
    }
    if (initiatePostCreationButton) {
        initiatePostCreationButton.addEventListener('click', () => {
            currentPostCreation = { type: null, themeId: null, effort: effortSlider ? parseInt(effortSlider.value) : 2 };
            showMonitorStep(monitorSteps.selectType);
        });
    }
    monitorCancelButtons.forEach(button => button.addEventListener('click', () => showMonitorStep(null)));
    monitorBackButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetStepId = button.dataset.targetStepId; // Исправлено на targetStepId
            showMonitorStep(document.getElementById(targetStepId) || monitorSteps.selectType);
        });
    });
    monitorPostTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentPostCreation.type = button.dataset.postType;
            if (currentPostCreation.type === 'text') showMonitorStep(monitorSteps.selectThemeText);
            // Добавить else if для других типов и их шагов выбора тем
            else { logEvent(`Выбор темы для "${currentPostCreation.type}" еще не реализован.`, "warning"); showMonitorStep(null); }
        });
    });
    if (monitorSteps.selectThemeText) {
        monitorSteps.selectThemeText.querySelectorAll('.monitor-theme-button').forEach(button => {
            button.addEventListener('click', () => {
                currentPostCreation.themeId = button.dataset.themeId;
                if(selectedThemeNameDisplay) selectedThemeNameDisplay.textContent = button.textContent;
                showMonitorStep(monitorSteps.qualityText);
            });
        });
    }
    if (effortSlider) {
        effortSlider.addEventListener('input', () => {
            currentPostCreation.effort = parseInt(effortSlider.value);
            if (effortLevelDisplay) { const levels = ["Низкое", "Среднее", "Высокое"]; effortLevelDisplay.textContent = levels[currentPostCreation.effort - 1]; }
        });
        if (effortLevelDisplay) { const levels = ["Низкое", "Среднее", "Высокое"]; effortLevelDisplay.textContent = levels[parseInt(effortSlider.value) - 1];}
    }
    if (monitorPublishButton) {
        monitorPublishButton.addEventListener('click', () => {
            if (!currentPostCreation.type || (!currentPostCreation.themeId && currentPostCreation.type === 'text' /*и для других где есть темы*/)) {
                logEvent("Ошибка: Тип или тема поста не выбраны!", "error"); showMonitorStep(null); return;
            }
            if (currentPostCreation.type === 'text') handlePostAction('text', 1, 5, 2, 10, 1, 5, currentPostCreation.effort, currentPostCreation.themeId);
            else if (currentPostCreation.type === 'meme') handlePostAction('meme', 3, 10, 1, 5, 2, 8, currentPostCreation.effort, currentPostCreation.themeId); // Добавить themeId если для мемов будут темы
            else if (currentPostCreation.type === 'video') handlePostAction('video', 8, 20, 7, 18, 3, 10, currentPostCreation.effort, currentPostCreation.themeId); // Добавить themeId если для видео будут темы
            showMonitorStep(null);
        });
    }

    // Навигация
    navButtons.forEach(button => button.addEventListener('click', () => setActiveGameScreen(button.dataset.targetScreen)));
    // Модальное окно для лога
    function openModal(modalElement) { /* ... */ } function closeModal(modalElement) { /* ... */ }
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { /* ... */ });
    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в предыдущем полном коде ... */ }
    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в предыдущем полном коде ... */ }
    // Обработчики кнопок создания постов (теперь не нужны, т.к. логика в monitorPublishButton)
    // if(postTextButton) ... и т.д. - ЭТИ СТРОКИ УДАЛИТЬ ИЛИ ЗАКОММЕНТИРОВАТЬ
    if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как в предыдущем полном коде, но без closeModal ... */ });
    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    showTopLevelScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 
    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }
});
