document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioScreenContainer = document.getElementById('studio-screen-container'); // Главный игровой контейнер
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Элементы "Студии"
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version'); 
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');
    
    // Кнопки управления из студии
    const createPostButtonMonitor = document.getElementById('create-post-button-monitor'); // Открывает модалку
    const openUpgradesButton = document.getElementById('open-upgrades-button'); // Открывает модалку
    const openLogButton = document.getElementById('open-log-button'); // Открывает модалку
    
    // Модальные окна
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки действий в модальных окнах
    const postTextButton = document.querySelector('#create-post-modal #post-text-button');
    const postMemeButton = document.querySelector('#create-post-modal #post-meme-button');
    const postVideoButton = document.querySelector('#create-post-modal #post-video-button');
    const upgradeContentQualityButton = document.querySelector('#upgrades-modal #upgrade-content-quality');
    const upgradeCostSpan = document.querySelector('#upgrades-modal .upgrade-cost');
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
        gameVersion: "1.0.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }

    function showScreen(screenElementToShow) { // Управляет только полноэкранными оверлеями и главным экраном студии
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioScreenContainer].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
         // Модальные окна управляются отдельно
        [createPostModal, upgradesModal, logModal].forEach(modal => {
            if (modal && modal !== screenElementToShow) { // Не скрываем, если это сама модалка
                 modal.classList.remove('visible'); modal.style.display = 'none';
            }
        });

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }
    
    function playCutscene() { /* ... как раньше, в конце вызывает startGameplay() ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v11'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { logEvent("Требуется выбор тематики канала.", "info"); showScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... как раньше, с получением данных ТГ и вызовом showScreen ... */ }
    
    function startGameplay() { 
        loadGame(); 
        showScreen(studioScreenContainer); // Показываем контейнер студии
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v11');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v11', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше ... */ }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // Управление модальными окнами
    function openModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'flex';
            requestAnimationFrame(() => { requestAnimationFrame(() => { modalElement.classList.add('visible'); }); });
        }
    }
    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('visible');
            setTimeout(() => { modalElement.style.display = 'none'; }, 300); // Время CSS-анимации .modal-overlay
        }
    }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }

    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
            // ... (ВСЯ логика поста как раньше: themeMod, moodMultiplier, trendBonusMultiplier, расчет subGain, moneyGain, ER, moodChange, отписки, logEvent для поста) ...
            // ... генерация фидбека ...
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) { /* ... */ }
            
            // Реакция персонажа (уже есть в коде выше, который вы не просили менять)
            if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); } 
            else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); }

            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.notificationOccurred('success');
            closeModal(createPostModal); // Закрываем модальное окно создания поста
        }, 700); 
    }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { 
        // ... (логика улучшения как раньше) ...
        if (gameState.balance >= cost) { 
            /* ... */ 
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            closeModal(upgradesModal); // Закрываем модальное окно улучшений
        } /* ... */
     });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше, но вызывают showWelcomeScreen() ... */ }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            const visibleModal = document.querySelector('.modal-overlay.visible');
            if (visibleModal) { closeModal(visibleModal); }
            else if (studioScreenContainer && studioScreenContainer.classList.contains('visible')) { 
                saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close(); 
            }
            // ... (условия для cutsceneScreen, welcomeScreen, themeSelectionScreen) ...
            else { tg.close(); }
        });
    }
});
