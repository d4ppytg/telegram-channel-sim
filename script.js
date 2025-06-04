document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, DOMContentLoaded fired.");
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); 
    
    console.log("Initial elements query:");
    console.log({ preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer });


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

    // Модальные окна и их элементы
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
        gameVersion: "0.8.6_full_debug", 
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
        console.log(`[showScreen] Called for: ${screenElementToShow ? screenElementToShow.id : 'null screenElementToShow'}`);
        const localSidePanel = document.getElementById('studio-side-panel'); // Получаем здесь для актуальности
        // console.log(`[showScreen] localSidePanel found:`, !!localSidePanel);

        // Сначала СКРЫВАЕМ все главные экраны и модалки
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

        // Боковую панель скрываем по умолчанию, покажем только если активна студия
        if (localSidePanel) {
            localSidePanel.style.display = 'none';
        }

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start'; 
                 studioContainer.style.alignItems = 'stretch'; 
                 if(localSidePanel) {
                    localSidePanel.style.display = 'flex'; 
                    console.log(`[showScreen] studioSidePanel for studioContainer: display flex`);
                 } else { console.warn("[showScreen] studioSidePanel is null when trying to show for studioContainer"); }
            } else if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
                // Если это модальное окно, студия должна быть "под" ним (НЕ через showScreen)
                // и боковая панель студии тоже должна быть видима, если студия была активна
                // Важно: studioContainer должен УЖЕ БЫТЬ 'flex' и 'visible' перед открытием модалки
                if (studioContainer && studioContainer.style.display === 'flex' && localSidePanel) { 
                     localSidePanel.style.display = 'flex';
                     console.log(`[showScreen] studioSidePanel for modal: display flex`);
                } else if (studioContainer && studioContainer.style.display === 'flex' && !localSidePanel){
                     console.warn("[showScreen] studioSidePanel is null when trying to show for modal over studio");
                }
            }
            
            requestAnimationFrame(() => { 
                requestAnimationFrame(() => { 
                    screenElementToShow.classList.add('visible'); 
                    console.log(`[showScreen] Added 'visible' class to: ${screenElementToShow.id}`);
                }); 
            });
        } else {
            console.warn("[showScreen] screenElementToShow was null or undefined.");
        }
    }
    
    function playCutscene() { 
        console.log("[playCutscene] Called");
        showScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides.length > 0 && cutsceneSlides[0]) {
             cutsceneSlides[0].style.display = 'flex'; cutsceneSlides[0].classList.add('active'); 
        }
        setTimeout(showNextSlide, 3000);
    }

    function showNextSlide() {
        console.log(`[showNextSlide] currentSlideIndex: ${currentSlideIndex}`);
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
            console.log(`[showNextSlide] Showing slide: ${cutsceneSlides[currentSlideIndex].id}`);
            setTimeout(showNextSlide, 3000); 
        } else { console.log("[showNextSlide] Cutscene ended, calling startGameplay."); startGameplay(); }
    }
    
    function initializeGameFlow() { 
        console.log("[initializeGameFlow] Called");
        const savedState = localStorage.getItem('channelSimGameState_v0.8.6_full_debug'); 
        let proceedToWelcome = false;
        if (savedState) { 
            const parsedState = JSON.parse(savedState); 
            gameState = { ...defaultGameState, ...parsedState }; 
            if (gameState.theme) { proceedToWelcome = true; console.log("[initializeGameFlow] Theme found in saved state. Proceeding to welcome screen."); }
            else { gameState = { ...defaultGameState }; saveGame(); console.log("[initializeGameFlow] No theme in saved state. Resetting to default and showing theme selection.");}
        } else { gameState = { ...defaultGameState }; saveGame(); console.log("[initializeGameFlow] No saved state found. Showing theme selection.");}
        if (proceedToWelcome) { showWelcomeScreen(); } else { showThemeSelectionScreen(); }
    }

    function showThemeSelectionScreen() { 
        console.log("[showThemeSelectionScreen] Called.");
        // logEvent("Требуется выбор тематики канала.", "info"); // logEvent может быть не инициализирован здесь
        showScreen(themeSelectionScreen); 
    }
    
    function showWelcomeScreen() { 
        console.log("[showWelcomeScreen] Called.");
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
        console.log("[startGameplay] Called.");
        loadGame(); 
        showScreen(studioContainer); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v0.8.6_full_debug');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
        console.log("[loadGame] Game state loaded/initialized.");
    }
    function saveGame() { 
        localStorage.setItem('channelSimGameState_v0.8.6_full_debug', JSON.stringify(gameState)); 
        console.log("[saveGame] Game state saved.");
    }
    
    function logEvent(message, type = 'info') { /* ... как раньше ... */ }
    function updateUI() { /* ... как раньше ... */ }
    function checkUpgradeButtonStatus() { /* ... как раньше ... */ }
    function updateTrendUI() { /* ... как раньше ... */ }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... как раньше ... */ }
    function getPostTypeName(typeKey) { /* ... как раньше ... */ }

    function openModal(modalElement) { 
        console.log(`[openModal] Called for: ${modalElement ? modalElement.id : 'null'}`);
        if (studioContainer && studioContainer.style.display === 'none') {
            console.log("[openModal] Studio was hidden, showing it first.");
            showScreen(studioContainer); 
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
            console.log(`[closeModal] Closed modal: ${modalElement.id}`);
            // Убедимся, что студия и ее панель видимы, если это не один из начальных экранов
            if (studioContainer && !studioContainer.classList.contains('visible') &&
                themeSelectionScreen.style.display === 'none' && 
                welcomeScreen.style.display === 'none' && 
                cutsceneScreen.style.display === 'none' &&
                preloader.style.display === 'none' ) {
                showScreen(studioContainer); 
            } else if (studioContainer && studioContainer.classList.contains('visible')) {
                const localSidePanel = document.getElementById('studio-side-panel');
                if (localSidePanel && localSidePanel.style.display === 'none') {
                    localSidePanel.style.display = 'flex';
                }
            }
        } 
    }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { /* ... как раньше ... */ });

    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) { /* ... как раньше, но в конце closeModal(createPostModal); ... */ }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => { /* ... как раньше ... */ });

    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        console.log(`[ThemeInit] Found ${themeCards.length} theme cards.`);
        if (themeCards && themeCards.length > 0) {
            themeCards.forEach(card => {
                card.addEventListener('click', function() { 
                    console.log("Theme card clicked:", this.dataset.theme); 
                    const selectedTheme = this.dataset.theme; gameState.theme = selectedTheme; gameState.audienceMood = 75;
                    switch(selectedTheme) { /* ... как раньше ... */ }
                    logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success"); saveGame(); showWelcomeScreen(); 
                });
                console.log(`[ThemeInit] Added click listener to card: ${card.dataset.theme}`);
            });
        } else { console.error("[ThemeInit] Theme cards (.theme-card) not found!"); }
    } else { console.error("[ThemeInit] #theme-selection-screen element not found!"); }
    
    // ИНИЦИАЛИЗАЦИЯ
    console.log("[Init] Explicitly showing preloader.");
    showScreen(preloader); 
    setTimeout(() => {
        console.log("[Init] Timeout: Hiding preloader and calling initializeGameFlow.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; console.log("[Init] Preloader display set to none."); }, 400); 
        }
        initializeGameFlow();
    }, 2000); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как раньше ... */ }
});
