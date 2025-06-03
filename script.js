document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioScreenContainer = document.getElementById('studio-screen-container'); 
    
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
    
    // Кнопка для открытия лаборатории текста
    const openTextLabButton = document.getElementById('open-text-lab-button'); 
    
    // Элементы боковой панели студии
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    const openUpgradesButton = document.getElementById('open-upgrades-button'); 
    const openLogButton = document.getElementById('open-log-button'); 
    
    // Модальные окна для Улучшений и Лога
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Элементы лаборатории ТЕКСТОВОГО поста
    const textPostLabScreen = document.getElementById('text-post-lab-screen');
    const textLabStepTitleSelection = document.getElementById('text-lab-step-title-selection');
    const titleOptionsGrid = document.querySelector('#text-lab-step-title-selection .title-options-grid');
    const textLabStepWordFlow = document.getElementById('text-lab-step-word-flow');
    const wordFlowTimerDisplay = document.getElementById('word-flow-time-left');
    const wordFlowQualityScoreDisplay = document.getElementById('word-flow-quality-score');
    const wordFlowArea = document.querySelector('#text-lab-step-word-flow .word-flow-area');
    const collectedTextPreview = document.getElementById('собранный-текст-поста-в-лабе');
    const wordsCollectedCountDisplay = document.getElementById('words-collected-count');
    const textLabStepPublish = document.getElementById('text-lab-step-publish');
    const finalPostQualityDisplay = document.getElementById('final-post-quality-display');
    const publishTextPostFromLabButton = document.getElementById('publish-text-post-from-lab-button');
    const cancelTextPostLabButton = document.getElementById('cancel-text-post-lab-button');

    // Кнопки для МЕМОВ и ВИДЕО (ищем их в старой модалке, если она осталась)
    // Если модалки #create-post-modal нет, эти переменные будут null, но ошибки не будет
    const postMemeButton = document.querySelector('#create-post-modal #post-meme-button');
    const postVideoButton = document.querySelector('#create-post-modal #post-video-button');
    
    // Элементы улучшений в модалке
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
        gameVersion: "1.1.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    let currentTextLabState = { /* ... как раньше ... */ }; // Для лаборатории текста

    function setCharacterState(newState, durationMs = 0) { /* ... как раньше ... */ }

    function showScreen(screenElementToShow) {
        // Добавляем textPostLabScreen в список управляемых экранов
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioScreenContainer, textPostLabScreen, upgradesModal, logModal].forEach(el => {
            if (el && el !== screenElementToShow) { 
                el.classList.remove('visible'); el.style.display = 'none';
            }
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }
    
    function playCutscene() { /* ... как раньше ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v12'); // Новый ключ
        if (savedState) { /* ... */ }
        /* ... */ showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... */ showScreen(themeSelectionScreen); }
    function showWelcomeScreen() { /* ... */ showScreen(welcomeScreen); }
    
    function startGameplay() { 
        loadGame(); 
        showScreen(studioScreenContainer); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
        if (studioSidePanel) studioSidePanel.style.display = 'flex'; // Показываем боковую панель студии
    }

    function loadGame() { /* ... как раньше, ключ v12 ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v12', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше ... */ }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... */ }
    function getPostTypeName(typeKey) { /* ... */ }

    // Управление модальными окнами
    function openModal(modalElement) { /* ... как раньше ... */ }
    function closeModal(modalElement) { /* ... как раньше, но БЕЗ showScreen(studioScreenContainer) ... */ 
        if (modalElement) {
            modalElement.classList.remove('visible');
            setTimeout(() => { modalElement.style.display = 'none'; }, 300); 
        }
    }
    
    // Открытие лаборатории для текстового поста
    if (openTextLabButton) {
        openTextLabButton.addEventListener('click', () => {
            setCharacterState(CHARACTER_STATES.TYPING); 
            startTextPostLab();
        });
    }
    // Открытие модалок для улучшений и лога
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });


    // --- ЛОГИКА ЛАБОРАТОРИИ ТЕКСТОВОГО ПОСТА ---
    function resetTextLab() { /* ... как раньше ... */ }
    function startTextPostLab() { /* ... как раньше, вызывает showScreen(textPostLabScreen) ... */ }
    function selectTextLabTitle(titleData) { /* ... как раньше ... */ }
    function startWordFlowGame() { /* ... как раньше ... */ }
    function spawnWord() { /* ... как раньше ... */ }
    function handleWordClick(event) { /* ... как раньше ... */ }
    function endWordFlowGame() { /* ... как раньше ... */ }

    if(publishTextPostFromLabButton) {
        publishTextPostFromLabButton.addEventListener('click', () => {
            const labQualityMultiplier = 1 + (Math.max(0, currentTextLabState.qualityScore) / 50);
            handlePostAction('text', 1, 5, 2, 10, 1, 5, labQualityMultiplier, currentTextLabState.selectedTitle.text);
            showScreen(studioScreenContainer); 
            if (studioSidePanel) studioSidePanel.style.display = 'flex';
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        });
    }
    if(cancelTextPostLabButton) {
        cancelTextPostLabButton.addEventListener('click', () => {
            clearInterval(currentTextLabState.wordFlowTimeout); clearInterval(currentTextLabState.wordSpawnInterval);
            if(wordFlowArea) wordFlowArea.innerHTML = '';
            logEvent("Создание текстового поста отменено.", "info");
            showScreen(studioScreenContainer);
            if (studioSidePanel) studioSidePanel.style.display = 'flex';
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        });
    }
    // --- КОНЕЦ ЛОГИКИ ЛАБОРАТОРИИ ---


    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }

    // Действия игры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, labQualityMultiplier = 1, postTitle = "Новый пост") {
        // setCharacterState(CHARACTER_STATES.TYPING); // Уже установлено перед вызовом или в лаборатории
        // setTimeout убран, так как "работа" теперь в лаборатории или мгновенна для других типов
            
        // ... (ВСЯ логика поста: themeMod, moodMultiplier, trendBonusMultiplier, расчет subGain, moneyGain и т.д.) ...
        // Как в последнем полном коде JS, который вы мне давали (где ошибка была)
            
        logEvent(`Опубликован ${getPostTypeName(postType)}: "${postTitle}"! +${subGain} подписчиков, +$${moneyGain}.`, 'success');

        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) { gameState.trendPostsRemaining--; }
        if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { if (Math.random() < 0.20) { generateNewTrend(); }}
        
        if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); } 
        else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); }

        updateUI(); saveGame(); checkUpgradeButtonStatus();
        tg.HapticFeedback.notificationOccurred('success');
        
        const feedbackCount = Math.floor(Math.random() * 3) + 2; 
        for (let i = 0; i < feedbackCount; i++) { /* ... генерация фидбека ... */ }
            
        // closeModal(createPostModal); // НЕ закрываем здесь, так как это общая функция
                                     // Лаборатория текста закрывается сама.
                                     // Если мемы/видео будут в модалке, им нужен свой closeModal.
    }

    // Обработчики для кнопок МЕМ и ВИДЕО (если они есть в HTML и найдены)
     if(postMemeButton) { // Проверяем, что кнопка найдена
        postMemeButton.addEventListener('click', () => { 
             logEvent("Создание Мемов пока в разработке!", "warning");
             // Для теста можно вызвать handlePostAction с дефолтными параметрами
             // handlePostAction('meme', 3, 10, 1, 5, 2, 8, 1, "Смешной Мем");
             // closeModal(createPostModal); // Если бы это было в модалке createPostModal
        });
     } else {
        // console.log("Кнопка postMemeButton не найдена в DOM"); // Для отладки, если нужно
     }

     if(postVideoButton) { // Проверяем, что кнопка найдена
        postVideoButton.addEventListener('click', () => {
             logEvent("Создание Видео пока в разработке!", "warning");
             // handlePostAction('video', 8, 20, 7, 18, 3, 10, 1, "Захватывающее Видео");
             // closeModal(createPostModal); // Если бы это было в модалке createPostModal
        });
     } else {
        // console.log("Кнопка postVideoButton не найдена в DOM");
     }

     // Обработчик для кнопки Улучшения Качества (в модалке #upgrades-modal)
     if(upgradeContentQualityButton) {
        upgradeContentQualityButton.addEventListener('click', () => { 
            const cost = parseInt(upgradeContentQualityButton.dataset.cost);
            if (gameState.balance >= cost) {
                gameState.balance -= cost; 
                gameState.contentQualityMultiplier = parseFloat((gameState.contentQualityMultiplier + 0.2).toFixed(1));
                const newCost = Math.floor(cost * 1.5); 
                upgradeContentQualityButton.dataset.cost = newCost;
                if(upgradeCostSpan) upgradeCostSpan.textContent = newCost;
                else upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
                
                logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
                gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
                updateUI(); saveGame(); checkUpgradeButtonStatus();
                tg.HapticFeedback.impactOccurred('medium');
                setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
                closeModal(upgradesModal); 
            } else { 
                logEvent("Недостаточно средств для улучшения.", 'error'); 
                tg.HapticFeedback.notificationOccurred('error');
            }
        });
    }


    // --- ИНИЦИАЛИЗАЦИЯ И ПОРЯДОК ЗАПУСКА ---
    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme; 
                // ... (логика выбора темы, как раньше) ...
                saveGame(); showWelcomeScreen();
            });
        });
    }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как раньше, но closeModal теперь не вызывает showScreen ... */ }
});
