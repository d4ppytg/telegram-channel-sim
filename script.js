document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); // Наш основной игровой экран
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Элементы "Студии"
    const channelNameHeaderEl = document.getElementById('channel-name-header'); // Обновленный ID
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    // Тренды (основной баннер)
    const currentTrendDisplay = document.getElementById('current-trend-display');
    const trendDescriptionEl = document.getElementById('trend-description');
    const trendBonusEl = document.getElementById('trend-bonus');
    const trendDurationEl = document.getElementById('trend-duration');

    // Тренды на мониторе (если они дублируются или используются отдельно)
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    // Кнопки управления
    const createPostButtonMonitor = document.getElementById('create-post-button-monitor'); // Открывает модалку
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');

    // Модальные окна и их элементы
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    const postTextButtonModal = document.getElementById('post-text-button-modal');
    const postMemeButtonModal = document.getElementById('post-meme-button-modal');
    const postVideoButtonModal = document.getElementById('post-video-button-modal');
    const upgradeContentQualityButtonModal = document.getElementById('upgrade-content-quality-modal');
    const eventLogUl = document.getElementById('event-log');

    const liveFeedbackContainer = document.getElementById('live-feedback-container');
    const MAX_FEEDBACK_ITEMS = 7;
    // ... (массивы комментариев и эмодзи как раньше) ...
    const positiveComments = ["Круто!", "Лучший пост!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гениально!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.8.0_stable", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };
    function setCharacterState(newState, durationMs = 0) { /* ... как в последнем полном коде ... */ }

    // --- УПРАВЛЕНИЕ ЭКРАНАМИ ---
    function showScreen(screenElementToShow) {
        // Скрываем все полноэкранные оверлеи и основной контейнер студии
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            // Для studioContainer специфичные стили display уже есть в CSS, когда он .visible
            if (screenElementToShow === studioContainer) {
                // Дополнительные действия при показе студии, если нужны
                if(studioSidePanel) studioSidePanel.style.display = 'flex';
            } else {
                if(studioSidePanel) studioSidePanel.style.display = 'none';
            }
            
            requestAnimationFrame(() => { 
                requestAnimationFrame(() => { 
                    screenElementToShow.classList.add('visible'); 
                }); 
            });
        }
    }
    
    function playCutscene() { /* ... как раньше, в конце вызывает startGameplay() ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.0_stable'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... */ showScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... */ showScreen(welcomeScreen); }
    
    function startGameplay() { 
        loadGame(); 
        showScreen(studioContainer); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.0_stable');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v0.8.0_stable', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как в последнем полном коде ... */ }
    
    function updateUI() { 
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName; // Обновляем заголовок в хедере студии
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = gameState.channelName; // И на мониторе
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0);
        // ER не отображается в этой версии UI
        // updateTrendUI(); // Вызывается отдельно при необходимости
    }
    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButtonModal) return; // Проверяем кнопку в модалке
        const cost = parseInt(upgradeContentQualityButtonModal.dataset.cost);
        upgradeContentQualityButtonModal.disabled = gameState.balance < cost;
        // Обновление текста стоимости на кнопке, если нужно
        const costTextEl = upgradeContentQualityButtonModal.textContent.match(/\(\$([0-9]+)\)/);
        if (costTextEl) {
            upgradeContentQualityButtonModal.textContent = upgradeContentQualityButtonModal.textContent.replace(costTextEl[0], `(Стоимость: $${cost})`);
        }
    }
    function updateTrendUI() { 
        // Обновляем основной баннер тренда
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            if (trendDescriptionEl) trendDescriptionEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)})`;
            if (trendBonusEl) trendBonusEl.textContent = gameState.currentTrend.bonus;
            if (trendDurationEl) trendDurationEl.textContent = gameState.trendPostsRemaining;
            if (currentTrendDisplay) currentTrendDisplay.style.display = 'block';
            // И на мониторе (если он есть и отличается)
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)}) Bonus x${gameState.currentTrend.bonus}, ${gameState.trendPostsRemaining} п.`;
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
        } else {
            if (currentTrendDisplay) currentTrendDisplay.style.display = 'none';
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
            // gameState.currentTrend = null; // Сбрасывается при генерации нового
        }
    }
    function generateNewTrend() { /* ... как в последнем полном коде ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // Модальные окна
    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); showScreen(studioContainer); } }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в последнем полном коде ... */ }

    // Действия игры (теперь кнопки в модальных окнах)
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
            // ... (ВСЯ логика поста как в последнем полном коде) ...
            // ...
            // Генерация фидбека
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) { /* ... */ }
            
            closeModal(createPostModal); // Закрываем модалку создания поста
        }, 700); 
    }

     if(postTextButtonModal) postTextButtonModal.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButtonModal) postMemeButtonModal.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButtonModal) postVideoButtonModal.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     
     if(upgradeContentQualityButtonModal) upgradeContentQualityButtonModal.addEventListener('click', () => { 
        const cost = parseInt(upgradeContentQualityButtonModal.dataset.cost);
        if (gameState.balance >= cost) {
            // ... (логика улучшения как раньше) ...
            upgradeContentQualityButtonModal.textContent = `Улучшить качество контента (Стоимость: $${newCost})`; // Обновляем текст кнопки
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            closeModal(upgradesModal);
        } else { /* ... */ }
     });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    showScreen(preloader); // Начинаем с прелоадера
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как в последнем полном коде, но без setActiveGameScreen ... */
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            const visibleModal = document.querySelector('.modal-overlay.visible');
            if (visibleModal) { closeModal(visibleModal); }
            else if (studioContainer && studioContainer.classList.contains('visible')) { saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close(); }
            // ... (остальные else if для cutscene, welcome, theme) ...
            else { tg.close(); }
        });
    }
});
