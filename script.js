document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started (Focus Clickable Buttons).");
    const tg = window.Telegram.WebApp;

    // --- DOM Element Variables ---
    // (Все объявления переменных для элементов DOM, как в вашем последнем полном script.js)
    // ... Я не буду их здесь дублировать для краткости, но они должны быть здесь ...
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
    const monitorSteps = { /* ... */ }; // Как в предыдущем коде
    const monitorPostTypeButtons = monitorSteps.selectType ? monitorSteps.selectType.querySelectorAll('.monitor-button') : [];
    const effortSlider = document.getElementById('effort-slider');
    const effortLevelDisplay = document.getElementById('effort-level-display');
    const selectedThemeNameDisplay = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.selected-theme-name-monitor') : null;
    const monitorPublishButton = monitorSteps.qualityText ? monitorSteps.qualityText.querySelector('.monitor-publish-button') : null;
    const monitorCancelButtons = document.querySelectorAll('#monitor-content-area .monitor-cancel-button');
    const monitorBackButtons = document.querySelectorAll('#monitor-content-area .monitor-back-button');
    
    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = upgradeContentQualityButton ? upgradeContentQualityButton.querySelector('.upgrade-cost') : null;
    
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
        gameVersion: "1.0.4_clickFixAttempt", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    if (!tg) { console.error("FATAL: Telegram WebApp SDK (tg) not loaded!"); return; }
    tg.ready();
    tg.expand();
    console.log("DEBUG: Telegram WebApp SDK ready and expanded.");

    function setCharacterState(newState, durationMs = 0) { /* ... как в последнем полном скрипте ... */ }

    // --- Screen Management (КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ) ---
    function showTopLevelScreen(screenElementToShow) {
        console.log("DEBUG: showTopLevelScreen called for:", screenElementToShow ? screenElementToShow.id : "null_element");
        const allTopLevelScreens = [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface, logModal]; // Включаем все оверлеи

        allTopLevelScreens.forEach(el => {
            if (el) {
                if (el === screenElementToShow) {
                    // Показываем целевой экран
                    el.style.display = 'flex'; // Или 'block' если нужно, но flex для центрирования
                    el.style.opacity = '0'; // Начинаем с прозрачного для анимации
                    el.style.visibility = 'visible';
                    el.style.pointerEvents = 'auto'; // Делаем активный экран кликабельным
                    requestAnimationFrame(() => {
                        el.classList.add('visible'); // Запускает CSS transition для opacity
                        console.log(`DEBUG: ${el.id} MADE VISIBLE, display: ${getComputedStyle(el).display}, opacity: ${getComputedStyle(el).opacity}, pointerEvents: ${getComputedStyle(el).pointerEvents}`);
                    });
                } else {
                    // Скрываем все остальные экраны
                    el.classList.remove('visible');
                    el.style.pointerEvents = 'none'; // Делаем неактивные экраны НЕ кликабельными
                    // Скрываем через opacity и потом display:none для плавности
                    if (getComputedStyle(el).opacity === "1") { // Если был видим
                         el.style.opacity = '0';
                         setTimeout(() => { el.style.display = 'none'; }, 400); // Время = transition-duration
                    } else {
                         el.style.display = 'none'; // Если и так был невидим, просто display:none
                    }
                }
            }
        });

        if (!screenElementToShow) {
            console.error("DEBUG: showTopLevelScreen: target element is null or undefined!");
        }
    }

    function setActiveGameScreen(targetScreenId) {
        console.log("DEBUG: setActiveGameScreen called for:", targetScreenId);
        if (!allGameScreens || allGameScreens.length === 0) { console.error("allGameScreens not found or empty!"); return; }
        
        allGameScreens.forEach(screen => {
            if (screen) {
                const isActive = screen.id === targetScreenId;
                screen.style.display = isActive ? 'flex' : 'none'; // Или 'block' для #studioScreen если нужно
                screen.classList.toggle('active-screen', isActive);
                screen.style.pointerEvents = isActive ? 'auto' : 'none'; // Управляем кликабельностью вкладок
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
        console.log("DEBUG: Active game screen set to:", targetScreenId);
    }
    
    // --- Cutscene, InitializeGameFlow, ThemeSelection, Welcome, StartGameplay ---
    // Эти функции остаются такими же, как в ПОСЛЕДНЕМ ПОЛНОМ скрипте, который я давал
    // (с console.log и правильной логикой вызовов).
    // Ключевой момент - initializeGameFlow должен вызывать showThemeSelectionScreen() ПРАВИЛЬНО.
    function playCutscene() { /* ... */ }
    function showNextSlide() { /* ... */ }
    function initializeGameFlow() { /* ... как в последнем полном скрипте с try-catch ... */ 
        console.log("DEBUG: --- initializeGameFlow START ---");
        // ... (вся логика с localStorage и вызовом showThemeSelectionScreen или showWelcomeScreen) ...
        // Убедитесь, что в конце ветки, где тема не найдена, есть:
        // console.log("DEBUG: Game saved, NOW attempting to show Theme Selection Screen...");
        // showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... как в последнем полном скрипте ... */ }
    function showWelcomeScreen() { /* ... как в последнем полном скрипте ... */ }
    function startGameplay() { /* ... как в последнем полном скрипте ... */ }

    // --- Load/Save/Log/UI Updates ---
    function loadGame() { /* ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v13_clickable_focus', JSON.stringify(gameState)); console.log("DEBUG: Game saved."); }
    function logEvent(message, type = 'info') { /* ... */ }
    function updateUI() { /* ... */ }
    function checkUpgradeButtonStatus() { /* ... */ }
    function updateTrendUI() { /* ... */ }
    function generateNewTrend() { /* ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // --- Interactive Monitor Logic ---
    function showMonitorStep(stepElementToShow) { /* ... как в последнем полном скрипте ... */ }
    // ... (Все обработчики для initiatePostCreationButton, monitorCancelButtons, и т.д. как в последнем полном скрипте) ...

    // --- Navigation & Modals ---
    // ... (Обработчики для navButtons, openModal, closeModal, openLogButton, closeModalButtons как в последнем полном скрипте) ...

    // --- Live Feedback ---
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в последнем полном скрипте ... */ }

    // --- Game Actions ---
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, effort, themeId) { /* ... как в последнем полном скрипте ... */ }
    // ... (Обработчики для кнопок создания постов на вкладке #createPostScreen, если они там остались) ...
    // ... (Обработчик для upgradeContentQualityButton) ...

    // --- ОБРАБОТЧИКИ ВЫБОРА ТЕМЫ (убедитесь, что этот блок ТОЧНО такой) ---
    if (themeSelectionScreen) {
        console.log("DEBUG: Attaching listeners to theme cards. themeSelectionScreen is:", themeSelectionScreen);
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card'); // Используем querySelectorAll на самом экране
        console.log(`DEBUG: Found ${themeCards.length} theme cards inside #theme-selection-screen.`);

        if (themeCards && themeCards.length > 0) {
            themeCards.forEach((card, index) => {
                console.log(`DEBUG: Adding click listener to theme card ${index + 1} (data-theme: ${card.dataset.theme})`);
                card.addEventListener('click', (event) => { // Добавил event
                    console.log(`DEBUG: Theme card CLICKED! Theme: ${card.dataset.theme}. Click target:`, event.target);
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
        console.error("DEBUG: CRITICAL - #theme-selection-screen element NOT FOUND for attaching listeners!");
    }
    
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
            preloader.style.pointerEvents = 'none'; // Явно отключаем клики
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("DEBUG: Preloader display set to none.");
            }, 500); // Время должно быть >= transition-duration для opacity
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    if (tg.BackButton) { /* ... как в предыдущем полном коде ... */ }

    console.log("DEBUG: Script execution finished setup.");
});
