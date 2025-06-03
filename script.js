document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, DOMContentLoaded fired."); // ОТЛАДКА
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); // Основной игровой экран
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Элементы "Студии" 
    const channelNameHeaderEl = document.getElementById('channel-name-header'); // ID из вашего HTML
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    const currentTrendDisplay = document.getElementById('current-trend-display'); // Баннер в studio-main
    const trendDescriptionEl = document.getElementById('trend-description');
    const trendBonusEl = document.getElementById('trend-bonus');
    const trendDurationEl = document.getElementById('trend-duration');

    // Тренды на мониторе (если они дублируются)
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const createPostButtonMonitor = document.getElementById('create-post-button-monitor');
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');
    
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    console.log("studioSidePanel element (global declaration):", studioSidePanel); // ОТЛАДКА

    // Модальные окна и их элементы
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки внутри МОДАЛЬНОГО ОКНА createPostModal (согласно вашему index (4).html)
    const postTextButtonModal = document.getElementById('post-text-button'); // В вашем HTML ID без "-modal"
    const postMemeButtonModal = document.getElementById('post-meme-button');   // В вашем HTML ID без "-modal"
    const postVideoButtonModal = document.getElementById('post-video-button'); // В вашем HTML ID без "-modal"
    // Кнопка внутри МОДАЛЬНОГО ОКНА upgradesModal
    const upgradeContentQualityButtonModal = document.getElementById('upgrade-content-quality'); // В вашем HTML ID без "-modal"
    
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
        gameVersion: "0.8.2_debug", // Новая версия для отладки
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) {
        if (!characterEl) return;
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

    function showScreen(screenElementToShow) {
        console.log("showScreen called for:", screenElementToShow ? screenElementToShow.id : 'null');
        const localStudioSidePanel = document.getElementById('studio-side-panel'); // Получаем здесь для надежности
        console.log("Side panel in showScreen:", localStudioSidePanel);

        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

        if (localStudioSidePanel) { // Сначала всегда скрываем боковую панель
            localStudioSidePanel.style.display = 'none';
        }

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start'; 
                 studioContainer.style.alignItems = 'stretch'; 
                 if(localStudioSidePanel) {
                    localStudioSidePanel.style.display = 'flex'; 
                 } else {
                    console.warn("Элемент #studio-side-panel не найден при попытке показать его для студии.");
                 }
            }
            // Для модальных окон (createPostModal, upgradesModal, logModal) боковая панель студии должна оставаться видимой, если студия под ними
            if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
                if(studioContainer && studioContainer.classList.contains('visible') && localStudioSidePanel){ // Если студия видима
                     localStudioSidePanel.style.display = 'flex';
                }
            }
            
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }
    
    function playCutscene() { /* ... как раньше ... */ }
    function showNextSlide() { /* ... как раньше ... */ }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.2_debug'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { /* ... как раньше ... */ }
    function showWelcomeScreen() { /* ... как раньше ... */ }
    function startGameplay() { /* ... как раньше ... */ }

    function loadGame() { /* ... как раньше, но ключ localStorage изменен ... */ }
    function saveGame() { localStorage.setItem('channelSimGameState_v0.8.2_debug', JSON.stringify(gameState)); }
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше (убедитесь, что channelNameHeaderEl есть) ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше (проверяет upgradeContentQualityButtonModal) ... */ }
    function updateTrendUI() { /* ... как раньше (обновляет и основной баннер, и на мониторе) ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... как раньше ... */ }
    function getPostTypeName(typeKey) { /* ... как раньше ... */ }

    function openModal(modalElement) { 
        // Перед открытием модалки, убедимся что студия видима под ней (если это не первый экран)
        if (studioContainer && !studioContainer.classList.contains('visible') && modalElement !== preloader && modalElement !== themeSelectionScreen && modalElement !== welcomeScreen && modalElement !== cutsceneScreen) {
            showScreen(studioContainer); // Сначала показать студию, потом модалку поверх
        }
        if (modalElement) { 
            modalElement.style.display = 'flex'; // Модалки тоже flex для центрирования содержимого
            requestAnimationFrame(() => { requestAnimationFrame(() => { modalElement.classList.add('visible'); }); });
        }
    }
    function closeModal(modalElement) { 
        if (modalElement) { 
            modalElement.classList.remove('visible'); 
            setTimeout(() => { modalElement.style.display = 'none'; }, 300); 
            // После закрытия модалки, убедимся что студия видима
            if (studioContainer) { // Проверяем, существует ли studioContainer
                 showScreen(studioContainer); 
            }
        } 
    }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { /* ... как раньше ... */ });

    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) { /* ... как раньше ... */ }

     // ИСПОЛЬЗУЕМ ID КНОПОК ИЗ HTML (без "-modal" в конце, если так в HTML)
     if(postTextButtonModal) postTextButtonModal.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButtonModal) postMemeButtonModal.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButtonModal) postVideoButtonModal.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     
     if(upgradeContentQualityButtonModal) upgradeContentQualityButtonModal.addEventListener('click', () => { /* ... как раньше, но обновляет upgradeContentQualityButtonModal.textContent ... */ });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    // ИНИЦИАЛИЗАЦИЯ
    showScreen(preloader); // Начинаем с прелоадера
    setTimeout(() => {
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); 
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как раньше ... */ }
});
