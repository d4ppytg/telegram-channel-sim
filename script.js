document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, DOMContentLoaded fired.");
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); 
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Элементы "Студии" 
    const channelNameHeaderEl = document.getElementById('channel-name-header'); 
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    // Тренды (основной баннер в .studio-main, если он есть в вашем HTML от 0.8.0)
    // Если его нет, эти переменные будут null, и updateTrendUI не будет пытаться их обновить.
    const currentTrendDisplay = document.getElementById('current-trend-display');
    const trendDescriptionEl = document.getElementById('trend-description');
    const trendBonusEl = document.getElementById('trend-bonus');
    const trendDurationEl = document.getElementById('trend-duration');

    // Тренды на мониторе (эти ID у вас есть в HTML)
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const createPostButtonMonitor = document.getElementById('create-post-button-monitor'); // Кнопка на мониторе
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');
    
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    console.log("studioSidePanel element (global declaration):", studioSidePanel);

    // Модальные окна и их элементы
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки внутри МОДАЛЬНОГО ОКНА createPostModal (согласно вашему index (4).html)
    const postTextButton = document.getElementById('post-text-button'); 
    const postMemeButton = document.getElementById('post-meme-button');   
    const postVideoButton = document.getElementById('post-video-button'); 
    // Кнопка внутри МОДАЛЬНОГО ОКНА upgradesModal
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
        gameVersion: "0.8.5_modal_fix", 
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
        console.log(`[showScreen] Called for: ${screenElementToShow ? screenElementToShow.id : 'null'}`);
        const localSidePanel = document.getElementById('studio-side-panel'); 
        console.log("Side panel in showScreen (start):", localSidePanel ? "found" : "NOT FOUND");

        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

        if (localSidePanel) { 
            localSidePanel.style.display = 'none'; // Скрываем по умолчанию
        }

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start'; 
                 studioContainer.style.alignItems = 'stretch'; 
                 if(localSidePanel) {
                    localSidePanel.style.display = 'flex'; 
                 }
            } else if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
                // Если это модальное окно, студия должна быть "под" ним (но НЕ видима через showScreen)
                // А боковая панель студии должна оставаться видимой, если студия была активна
                if (studioContainer && studioContainer.style.display === 'flex' && localSidePanel) { // Проверяем, была ли студия видима
                     localSidePanel.style.display = 'flex';
                }
            }
            
            requestAnimationFrame(() => { 
                requestAnimationFrame(() => { 
                    screenElementToShow.classList.add('visible'); 
                }); 
            });
        }
    }
    
    function playCutscene() { 
        showScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides.length > 0 && cutsceneSlides[0]) {
             cutsceneSlides[0].style.display = 'flex'; cutsceneSlides[0].classList.add('active'); 
        }
        setTimeout(showNextSlide, 3000);
    }

    function showNextSlide() {
        if (currentSlideIndex < cutsceneSlides.length && cutsceneSlides[currentSlideIndex]) { 
            cutsceneSlides[currentSlideIndex].classList.remove('active');
            if (currentSlideIndex > 0 && cutsceneSlides[currentSlideIndex - 1]) { 
                setTimeout(() => { if (cutsceneSlides[currentSlideIndex - 1]) cutsceneSlides[currentSlideIndex - 1].style.display = 'none'; }, 500); 
            }
        }
        currentSlideIndex++;
        if (currentSlideIndex < cutsceneSlides.length && cutsceneSlides[currentSlideIndex]) { 
            cutsceneSlides[currentSlideIndex].style.display = 'flex'; 
            cutsceneSlides[currentSlideIndex].classList.add('active'); 
            setTimeout(showNextSlide, 3000); 
        } else { startGameplay(); }
    }
    
    function initializeGameFlow() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.5_modal_fix'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }

    function showThemeSelectionScreen() { logEvent("Требуется выбор тематики канала.", "info"); showScreen(themeSelectionScreen); }
    
    function showWelcomeScreen() { 
        const userData = tg.initDataUnsafe?.user;
        if (userData) {
            if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = userData.username ? `@${userData.username}` : (userData.first_name || 'Игрок');
            if (userPhotoEl && userData.photo_url) userPhotoEl.src = userData.photo_url;
            else if (userPhotoEl) userPhotoEl.src = 'placeholder-avatar.png';
        } else {
            if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = 'Гость';
            if (userPhotoEl) userPhotoEl.src = 'placeholder-avatar.png';
        }
        showScreen(welcomeScreen); 
    }

    function startGameplay() { 
        loadGame(); 
        showScreen(studioContainer); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.5_modal_fix');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v0.8.5_modal_fix', JSON.stringify(gameState)); }
    
    function logEvent(message, type = 'info') { 
        if (!eventLogUl) return;
        const listItem = document.createElement('li');
        const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
        listItem.textContent = `[${time}] ${message}`;
        listItem.className = `log-${type}`;
        eventLogUl.prepend(listItem);
        if (eventLogUl.children.length > 30) eventLogUl.removeChild(eventLogUl.lastChild);
     }
    
    function updateUI() { 
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName; // Для хедера студии
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = gameState.channelName; // Для монитора
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0);
        updateTrendUI();
    }

    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return; // Используем глобальную, т.к. ID в HTML теперь без -modal
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
        upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${cost})`;
    }

    function updateTrendUI() { 
        const displayActive = gameState.currentTrend && gameState.trendPostsRemaining > 0;
        // Обновляем основной баннер тренда (если он есть в HTML)
        if (currentTrendDisplay) {
            currentTrendDisplay.style.display = displayActive ? 'block' : 'none';
            if (displayActive) {
                if (trendDescriptionEl) trendDescriptionEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)})`;
                if (trendBonusEl) trendBonusEl.textContent = gameState.currentTrend.bonus;
                if (trendDurationEl) trendDurationEl.textContent = gameState.trendPostsRemaining;
            }
        }
        // Обновляем тренд на мониторе
        if (currentTrendDisplayMonitor) {
             currentTrendDisplayMonitor.style.display = displayActive ? 'block' : 'none';
            if (displayActive && trendDescriptionMonitorEl) {
                trendDescriptionMonitorEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)}) Bonus x${gameState.currentTrend.bonus}, ${gameState.trendPostsRemaining} п.`;
            }
        }
        if (!displayActive) {
            // gameState.currentTrend = null; // Сбрасываем только если он закончился, не здесь
        }
    }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... как раньше ... */ }
    function getPostTypeName(typeKey) { /* ... как раньше ... */ }

    function openModal(modalElement) { 
        // Перед открытием модалки, студия должна быть видима (но не через showScreen, чтобы не скрыть другие модалки)
        if (studioContainer && studioContainer.style.display === 'none') {
            studioContainer.style.display = 'flex';
            studioContainer.classList.add('visible');
        }
        if (modalElement) { 
            modalElement.style.display = 'flex'; 
            requestAnimationFrame(() => requestAnimationFrame(() => modalElement.classList.add('visible'))); 
        }
    }
    function closeModal(modalElement) { 
        if (modalElement) { 
            modalElement.classList.remove('visible'); 
            setTimeout(() => { modalElement.style.display = 'none'; }, 300); 
            // После закрытия модалки, студия должна оставаться видимой
            if (studioContainer && !studioContainer.classList.contains('visible')) {
                 showScreen(studioContainer); // Убедимся, что студия видима, если другие экраны были поверх
            }
        } 
    }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) { /* ... как раньше, но в конце closeModal(createPostModal); ... */ }

     // Используем ID кнопок из HTML (без "-modal", как в вашем index (4).html)
     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { 
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            // ... (логика улучшения как раньше) ...
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            closeModal(upgradesModal);
        } else { /* ... */ }
     });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    // ИНИЦИАЛИЗАЦИЯ
    console.log("[Init] Showing preloader explicitly.");
    showScreen(preloader); // Явно показываем прелоадер
    setTimeout(() => {
        console.log("[Init] Timeout: Hiding preloader and calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; console.log("[Init] Preloader display set to none."); }, 700); 
        }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как в предыдущем ответе, где мы откатывались ... */ }
});
