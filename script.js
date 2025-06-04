document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, DOMContentLoaded fired.");
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); 
    
    console.log("Preloader found:", !!preloader);
    console.log("ThemeSelectionScreen found:", !!themeSelectionScreen);
    console.log("WelcomeScreen found:", !!welcomeScreen);
    console.log("CutsceneScreen found:", !!cutsceneScreen);
    console.log("StudioContainer found:", !!studioContainer);

    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    const channelNameHeaderEl = document.getElementById('channel-name-header'); 
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    const currentTrendDisplay = document.getElementById('current-trend-display');
    const trendDescriptionEl = document.getElementById('trend-description');
    const trendBonusEl = document.getElementById('trend-bonus');
    const trendDurationEl = document.getElementById('trend-duration');

    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const createPostButtonMonitor = document.getElementById('create-post-button-monitor');
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');
    
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    console.log("studioSidePanel element (global declaration):", studioSidePanel);

    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    const postTextButton = document.getElementById('post-text-button'); 
    const postMemeButton = document.getElementById('post-meme-button');   
    const postVideoButton = document.getElementById('post-video-button'); 
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality'); 
    
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
        gameVersion: "0.8.4_click_fix", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) { /* ... как было ... */ }

    function showScreen(screenElementToShow) {
        console.log(`[showScreen] Attempting to show: ${screenElementToShow ? screenElementToShow.id : 'null'}`);
        const localSidePanel = document.getElementById('studio-side-panel'); 

        // Сначала СКРЫВАЕМ все экраны
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.style.display = 'none'; // Убираем display:flex по умолчанию
                el.classList.remove('visible'); 
                // console.log(`[showScreen] Hid: ${el.id}`);
            }
        });

        if (localSidePanel) { localSidePanel.style.display = 'none'; }

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; // Устанавливаем display
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; studioContainer.style.justifyContent = 'flex-start'; studioContainer.style.alignItems = 'stretch'; 
                 if(localSidePanel) { localSidePanel.style.display = 'flex'; }
            } else if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
                if (studioContainer && studioContainer.style.display === 'flex' && localSidePanel) {
                     localSidePanel.style.display = 'flex';
                }
            }
            
            // Даем браузеру время применить display:flex перед анимацией opacity
            requestAnimationFrame(() => { 
                screenElementToShow.classList.add('visible'); 
                console.log(`[showScreen] Added 'visible' class to: ${screenElementToShow.id}`);
            });
        } else {
            console.warn("[showScreen] screenElementToShow is null or undefined.");
        }
    }
    
    function playCutscene() { /* ... как было ... */ }
    function showNextSlide() { /* ... как было ... */ }
    
    function initializeGameFlow() { 
        console.log("[initializeGameFlow] Called");
        const savedState = localStorage.getItem('channelSimGameState_v0.8.4_click_fix'); 
        let proceedToWelcome = false;
        if (savedState) { 
            const parsedState = JSON.parse(savedState); 
            gameState = { ...defaultGameState, ...parsedState }; 
            if (gameState.theme) { proceedToWelcome = true; console.log("[initializeGameFlow] Theme found. To Welcome.");}
            else { gameState = { ...defaultGameState }; saveGame(); console.log("[initializeGameFlow] No theme. To ThemeSelect.");}
        } else { gameState = { ...defaultGameState }; saveGame(); console.log("[initializeGameFlow] No saved. To ThemeSelect.");}
        if (proceedToWelcome) { showWelcomeScreen(); } else { showThemeSelectionScreen(); }
    }

    function showThemeSelectionScreen() { 
        console.log("[showThemeSelectionScreen] Called.");
        logEvent("Требуется выбор тематики канала.", "info"); 
        showScreen(themeSelectionScreen); 
    }
    
    function showWelcomeScreen() { 
        console.log("[showWelcomeScreen] Called.");
        // ... (логика userData как была) ...
        showScreen(welcomeScreen); 
    }

    function startGameplay() { /* ... как было ... */ }
    function loadGame() { /* ... как было, но с новым ключом localStorage ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v0.8.4_click_fix', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как было ... */ }
    function updateUI() { /* ... как было ... */ }
    function checkUpgradeButtonStatus() { /* ... как было ... */ }
    function updateTrendUI() { /* ... как было ... */ }
    function generateNewTrend() { /* ... как было ... */ }
    function getThemeDisplayName(themeKey) { /* ... как было ... */ }
    function getPostTypeName(typeKey) { /* ... как было ... */ }

    function openModal(modalElement) { /* ... как было ... */ }
    function closeModal(modalElement) { /* ... как было ... */ }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { /* ... как было ... */ });

    function showFeedback(text, isEmoji = false, username = null) { /* ... как было ... */ }
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) { /* ... как было ... */ }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как было ... */ });

    // ОБРАБОТЧИКИ ДЛЯ КАРТОЧЕК ТЕМ
    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        console.log(`[ThemeInit] Found ${themeCards.length} theme cards.`); // ОТЛАДКА

        if (themeCards && themeCards.length > 0) {
            themeCards.forEach(card => {
                // Удаляем старые обработчики, если они были (на всякий случай, хотя не должно быть)
                // card.removeEventListener('click', handleThemeCardClick); // Потребуется именованная функция
                // Проще не удалять, если код выполняется один раз при DOMContentLoaded

                card.addEventListener('click', function() { // Используем function, чтобы this указывал на card
                    console.log("Theme card clicked:", this.dataset.theme); // ОТЛАДКА
                    
                    const selectedTheme = this.dataset.theme; 
                    gameState.theme = selectedTheme; 
                    gameState.audienceMood = 75;
                    
                    switch(selectedTheme) { 
                        case 'news': gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 }; gameState.channelName = "Новостной Вестник"; gameState.balance = 110; break;
                        case 'entertainment': gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 }; gameState.channelName = "Веселый Уголок"; break;
                        case 'education': gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 }; gameState.channelName = "Академия Знаний"; gameState.subscribers = 5; break;
                        case 'tech': gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 }; gameState.channelName = "Техно Гуру"; break;
                    }
                    logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success"); 
                    saveGame(); 
                    showWelcomeScreen(); 
                });
                console.log(`[ThemeInit] Added click listener to card: ${card.dataset.theme}`); // ОТЛАДКА
            });
        } else {
            console.error("[ThemeInit] Theme cards (.theme-card) not found inside #theme-selection-screen!");
        }
    } else {
        console.error("[ThemeInit] #theme-selection-screen element not found!");
    }
    
    // ИНИЦИАЛИЗАЦИЯ
    console.log("[Init] Showing preloader explicitly.");
    showScreen(preloader); 
    setTimeout(() => {
        console.log("[Init] Timeout: Hiding preloader and calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; console.log("[Init] Preloader display set to none."); }, 400); // Уменьшил задержку, т.к. transition 0.4s
        }
        initializeGameFlow();
    }, 2000); // Уменьшил общее время прелоадера для теста

    if (startGameButton) { /* ... как было ... */ }
    if (tg.BackButton) { /* ... как было ... */ }
});
