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
    console.log("Start Game Button element (global):", startGameButton);

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
        gameVersion: "0.8.10_start_btn_fix", 
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
        // console.log(`[showScreen] Called for: ${screenElementToShow ? screenElementToShow.id : 'null screenElementToShow'}`);
        const localSidePanel = document.getElementById('studio-side-panel'); 
        // console.log(`[showScreen] localSidePanel found:`, !!localSidePanel);

        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

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
                 } else { console.warn("[showScreen] studioSidePanel is null when trying to show for studioContainer"); }
            } else if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
                if (studioContainer && studioContainer.style.display === 'flex' && localSidePanel) { 
                     localSidePanel.style.display = 'flex';
                }
            }
            
            requestAnimationFrame(() => { 
                requestAnimationFrame(() => { 
                    screenElementToShow.classList.add('visible'); 
                    // console.log(`[showScreen] Added 'visible' class to: ${screenElementToShow.id}`);
                }); 
            });
        } else {
            // console.warn("[showScreen] screenElementToShow was null or undefined.");
        }
    }
    
    function playCutscene() { 
        console.log("[playCutscene] Called.");
        showScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides.length > 0 && cutsceneSlides[0]) {
             cutsceneSlides[0].style.display = 'flex'; cutsceneSlides[0].classList.add('active'); 
        }
        setTimeout(showNextSlide, 3000);
    }

    function showNextSlide() {
        // console.log(`[showNextSlide] currentSlideIndex: ${currentSlideIndex}`);
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
            // console.log(`[showNextSlide] Showing slide: ${cutsceneSlides[currentSlideIndex].id}`);
            setTimeout(showNextSlide, 3000); 
        } else { console.log("[showNextSlide] Cutscene ended, calling startGameplay."); startGameplay(); }
    }
    
    function initializeGameFlow() { 
        console.log("[initializeGameFlow] Called");
        const savedState = localStorage.getItem('channelSimGameState_v0.8.10_start_btn_fix'); 
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
        // logEvent("Требуется выбор тематики канала.", "info"); 
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
        const savedState = localStorage.getItem('channelSimGameState_v0.8.10_start_btn_fix');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
        console.log("[loadGame] Game state loaded/initialized.");
    }
    function saveGame() { 
        localStorage.setItem('channelSimGameState_v0.8.10_start_btn_fix', JSON.stringify(gameState)); 
        console.log("[saveGame] Game state saved.");
    }
    
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

    if (themeSelectionScreen) { /* ... обработчики выбора темы как было ... */ }
    
    // --- ОБРАБОТЧИК ДЛЯ КНОПКИ "НАЧАТЬ ИГРУ!" ---
    if (startGameButton) {
        console.log("[Init] Adding click listener to startGameButton.");
        startGameButton.addEventListener('click', () => {
            console.log("[startGameButton] Clicked!");
            if (welcomeScreen && welcomeScreen.classList.contains('visible')) {
                console.log("[startGameButton] Hiding welcomeScreen and calling playCutscene.");
                welcomeScreen.classList.remove('visible');
                setTimeout(() => { 
                    if(welcomeScreen) welcomeScreen.style.display = 'none'; 
                    playCutscene(); 
                }, 500); // Время на анимацию скрытия welcomeScreen (должно совпадать с transition-duration в CSS)
            } else {
                console.error("[startGameButton] welcomeScreen element not found or not visible!", welcomeScreen);
            }
        });
    } else {
        console.error("[Init] startGameButton element NOT FOUND! Check ID 'start-game-button' in HTML.");
    }
    
    if (tg.BackButton) { /* ... как было ... */ }

    // --- ИНИЦИАЛИЗАЦИЯ ---
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
});
