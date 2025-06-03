document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    
    const gameInterface = document.getElementById('game-interface'); // Главный игровой интерфейс
    const gameScreensContainer = document.getElementById('game-screens-container');
    const allGameScreens = gameScreensContainer ? gameScreensContainer.querySelectorAll('.game-screen') : [];
    const studioScreen = document.getElementById('studioScreen');
    const createPostScreen = document.getElementById('createPostScreen');
    const upgradesScreen = document.getElementById('upgradesScreen');
    const rankingsScreen = document.getElementById('rankingsScreen');
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    // Кнопки навигации и управления
    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');
    const goToCreatePostTabButton = document.getElementById('go-to-create-post-tab'); // Кнопка на мониторе
    
    const studioSidePanel = document.getElementById('studio-side-panel');
    const openLogButton = document.getElementById('open-log-button'); // В боковой панели
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки создания постов (теперь на экране createPostScreen)
    const postTextButton = document.querySelector('#createPostScreen #post-text-button');
    const postMemeButton = document.querySelector('#createPostScreen #post-meme-button');
    const postVideoButton = document.querySelector('#createPostScreen #post-video-button');
    
    // Улучшения (теперь на экране upgradesScreen)
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = document.querySelector('#upgradesScreen #upgrade-content-quality .upgrade-cost'); // Для обновления цены
    
    const eventLogUl = document.getElementById('event-log'); // В модальном окне лога

    // Всплывающие комментарии
    const liveFeedbackContainer = document.getElementById('live-feedback-container');
    const MAX_FEEDBACK_ITEMS = 7;
    const positiveComments = ["Круто!", "Лучший пост!", "Огонь 🔥", "Люблю этот канал!", "Подписался!", "👍👍👍"];
    const neutralComments = ["Интересно.", "Хм, неплохо.", "Пойдет.", "Норм.", "🤔"];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял юмора."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀'];


    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.8.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) { /* ... как в предыдущем полном коде ... */ }

    function showTopLevelScreen(screenElement) { // Для прелоадера, выбора темы, велкома, катсцены, gameInterface
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElement) {
            screenElement.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElement.classList.add('visible'); }); });
        }
    }

    function setActiveGameScreen(targetScreenId) {
        allGameScreens.forEach(screen => {
            if (screen.id === targetScreenId) {
                screen.style.display = 'flex'; // или 'block' в зависимости от верстки экрана
                requestAnimationFrame(() => screen.classList.add('active-screen'));
                if (screen.id === 'studioScreen' && studioSidePanel) studioSidePanel.style.display = 'flex';
                else if (studioSidePanel) studioSidePanel.style.display = 'none';

            } else {
                screen.classList.remove('active-screen');
                screen.style.display = 'none';
            }
        });
        navButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.targetScreen === targetScreenId);
        });
        // Скролл наверх при смене вкладки
        if(gameScreensContainer) gameScreensContainer.scrollTop = 0;
    }
    
    function playCutscene() { /* ... */ showTopLevelScreen(cutsceneScreen); /* ... */ }
    function showNextSlide() { /* ... как раньше, но в конце вызывает startGameplay() ... */ }
    function initializeGameFlow() { /* ... как раньше, но использует showTopLevelScreen ... */
        const savedState = localStorage.getItem('channelSimGameState_v8'); // Новый ключ
        if (savedState) { /* ... */ if (gameState.theme) { showWelcomeScreen(); return; } }
        /* ... */ showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... */ showTopLevelScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... */ showTopLevelScreen(welcomeScreen); }
    function startGameplay() { 
        loadGame(); 
        showTopLevelScreen(gameInterface); // Показываем весь игровой интерфейс
        setActiveGameScreen('studioScreen'); // Делаем студию активной по умолчанию
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Игра запущена! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { /* ... как раньше, ключ v8 ... */
        const savedState = localStorage.getItem('channelSimGameState_v8');
        if (savedState) { /* ... */ }
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v8', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
        if (upgradeCostSpan) upgradeCostSpan.textContent = cost; // Обновляем текст цены
    }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // Навигация по нижнему меню
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveGameScreen(button.dataset.targetScreen);
        });
    });
    if(goToCreatePostTabButton) goToCreatePostTabButton.addEventListener('click', () => setActiveGameScreen('createPostScreen'));


    // Модальное окно для лога
    function openModal(modalElement) { if (modalElement) { modalElement.style.display = 'flex'; requestAnimationFrame(() => modalElement.classList.add('visible')); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); } }
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });


    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как в предыдущем полном коде ... */ }

    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
            // ... (ВСЯ логика поста: themeMod, moodMultiplier, trendBonusMultiplier, расчет subGain, moneyGain, ER, moodChange, отписки) ...
            // Как в предыдущем полном коде script.js
            const themeModKey = postType; const themeMod = gameState.themeModifiers[themeModKey] || 1;
            const moodMultiplier = 0.8 + (gameState.audienceMood / 100) * 0.4; let trendBonusMultiplier = 1;
            if (gameState.currentTrend && gameState.currentTrend.type === postType && gameState.trendPostsRemaining > 0) { trendBonusMultiplier = parseFloat(gameState.currentTrend.bonus); gameState.audienceMood = Math.min(gameState.audienceMood + 5, 100); logEvent(`Пост "${getPostTypeName(postType)}" попал в тренд! Бонус x${trendBonusMultiplier}!`, 'info');}
            const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * gameState.contentQualityMultiplier * themeMod * moodMultiplier * trendBonusMultiplier);
            const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier);
            gameState.subscribers += subGain; gameState.balance += moneyGain; gameState.postsMade++;
            let moodChange = 0; if (subGain > 2) moodChange = Math.floor(gameState.contentQualityMultiplier * 1.5); else if (subGain < 0 && gameState.subscribers > 0) moodChange = -5; gameState.audienceMood = Math.min(Math.max(gameState.audienceMood + moodChange, 0), 100);
            if (gameState.audienceMood < 30 && gameState.subscribers > 10) { const uC = (30 - gameState.audienceMood) / 30; if (Math.random() < uC * 0.05) { const unsub = Math.min(gameState.subscribers, Math.floor(Math.random()*(gameState.subscribers*0.03)+1)); gameState.subscribers -= unsub; logEvent(`Аудитория недовольна! Отписалось ${unsub} подписчиков.`, 'error'); gameState.audienceMood = Math.max(gameState.audienceMood - 3, 0);}}
            logEvent(`Опубликован ${getPostTypeName(postType)}! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
            if (gameState.currentTrend && gameState.trendPostsRemaining > 0) { gameState.trendPostsRemaining--; }
            if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { if (Math.random() < 0.20) { generateNewTrend(); }}
            
            if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); } else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); }
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.notificationOccurred('success');
            
            // Генерация фидбека
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) {
                setTimeout(() => { 
                    const randomUser = `User${Math.floor(Math.random() * 1000)}`;
                    if (Math.random() < 0.3) { showFeedback(reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)], true, randomUser); } 
                    else { let commentArray; if (gameState.audienceMood > 70 && subGain > 5) commentArray = positiveComments; else if (gameState.audienceMood < 40 || subGain < 1) commentArray = negativeComments; else commentArray = neutralComments; showFeedback(commentArray[Math.floor(Math.random() * commentArray.length)], false, randomUser); }
                }, i * (Math.random() * 500 + 300)); 
            }
            setActiveGameScreen('studioScreen'); // Возвращаемся на главный экран студии после поста
        }, 700); 
    }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как раньше, но без closeModal ... */ 
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            /* ... */
            upgradeContentQualityButton.querySelector('.upgrade-cost').textContent = newCost; // Обновляем текст цены на кнопке
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            // Можно не закрывать экран улучшений автоматически
        } /* ... */
     });

    if (themeSelectionScreen) { /* ... как раньше ... */ }
    
    showTopLevelScreen(preloader); // Показываем прелоадер первым
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как раньше, но теперь проверяет модальное окно лога или закрывает игру */
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            if (logModal && logModal.classList.contains('visible')) { closeModal(logModal); }
            else if (gameInterface && gameInterface.classList.contains('visible')) { saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close(); }
            // Добавить условия для cutsceneScreen, welcomeScreen, themeSelectionScreen, если нужно
            else { tg.close(); }
        });
    }
});
