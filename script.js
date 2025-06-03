document.addEventListener('DOMContentLoaded', () => {
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
    const positiveComments = ["Круто!", "Лучший пост!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гениально!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.8.1_fix", 
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

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ showScreen
    function showScreen(screenElementToShow) {
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { 
                el.classList.remove('visible'); 
                el.style.display = 'none';
            }
        });

        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            if (screenElementToShow === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start'; 
                 studioContainer.style.alignItems = 'stretch'; 
                 if(studioSidePanel) { // Проверка, что элемент найден
                    studioSidePanel.style.display = 'flex'; 
                 } else {
                    console.warn("Элемент #studio-side-panel не найден в DOM для показа");
                 }
            } else { 
                 if(studioSidePanel) { // Проверка
                    studioSidePanel.style.display = 'none'; 
                 }
            }
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
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
        const savedState = localStorage.getItem('channelSimGameState_v0.8.1_fix'); 
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
        const savedState = localStorage.getItem('channelSimGameState_v0.8.1_fix');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`; // Используем channelNameHeaderEl
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v0.8.1_fix', JSON.stringify(gameState)); }
    
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
        if (channelNameHeaderEl) channelNameHeaderEl.textContent = gameState.channelName;
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = gameState.channelName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0);
        updateTrendUI(); // Вызываем здесь, чтобы тренд на мониторе тоже обновлялся
    }

    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButtonModal) return; // Проверяем кнопку в модалке
        const cost = parseInt(upgradeContentQualityButtonModal.dataset.cost);
        upgradeContentQualityButtonModal.disabled = gameState.balance < cost;
        // Обновление текста стоимости на кнопке (если у вас там есть span для цены)
        // const costEl = upgradeContentQualityButtonModal.querySelector('.upgrade-cost');
        // if(costEl) costEl.textContent = cost;
        // Если нет span, то текст обновляется при покупке
    }

    function updateTrendUI() { 
        const displayActive = gameState.currentTrend && gameState.trendPostsRemaining > 0;
        if (currentTrendDisplay) currentTrendDisplay.style.display = displayActive ? 'block' : 'none';
        if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = displayActive ? 'block' : 'none';

        if (displayActive) {
            const trendText = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)})`;
            const bonusText = `Бонус x${gameState.currentTrend.bonus}, ${gameState.trendPostsRemaining} п.`;
            if (trendDescriptionEl) trendDescriptionEl.textContent = trendText;
            if (trendBonusEl) trendBonusEl.textContent = gameState.currentTrend.bonus; // Если есть отдельный span для бонуса
            if (trendDurationEl) trendDurationEl.textContent = gameState.trendPostsRemaining; // Если есть отдельный span для длительности
            
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = `${trendText} ${bonusText}`;
        } else {
            // gameState.currentTrend = null; // Не здесь, а при генерации/завершении
        }
    }
    function generateNewTrend() { /* ... как раньше ... */ }
    function getThemeDisplayName(themeKey) { /* ... как раньше ... */ }
    function getPostTypeName(typeKey) { /* ... как раньше ... */ }

    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); showScreen(studioContainer); } }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    function showFeedback(text, isEmoji = false, username = null) { /* ... как раньше ... */ }

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
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
            updateUI(); saveGame(); checkUpgradeButtonStatus(); // checkUpgradeButtonStatus вместо checkUpgradeButton
            tg.HapticFeedback.notificationOccurred('success');
            
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) { setTimeout(() => { const rU = `User${Math.floor(Math.random()*1000)}`; if(Math.random()<0.3){showFeedback(reactionEmojis[Math.floor(Math.random()*reactionEmojis.length)],true,rU);}else{let cA;if(gameState.audienceMood>70&&subGain>5)cA=positiveComments;else if(gameState.audienceMood<40||subGain<1)cA=negativeComments;else cA=neutralComments;showFeedback(cA[Math.floor(Math.random()*cA.length)],false,rU);}},i*(Math.random()*500+300));}
            closeModal(createPostModal);
        }, 700); 
    }

     if(postTextButtonModal) postTextButtonModal.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButtonModal) postMemeButtonModal.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButtonModal) postVideoButtonModal.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     
     if(upgradeContentQualityButtonModal) upgradeContentQualityButtonModal.addEventListener('click', () => { 
        const cost = parseInt(upgradeContentQualityButtonModal.dataset.cost);
        if (gameState.balance >= cost) {
            gameState.balance -= cost; gameState.contentQualityMultiplier = parseFloat((gameState.contentQualityMultiplier + 0.2).toFixed(1));
            const newCost = Math.floor(cost * 1.5); 
            upgradeContentQualityButtonModal.dataset.cost = newCost; // Обновляем data-атрибут
            // Обновляем текст кнопки, если есть span для цены, или весь текст
            const costTextEl = upgradeContentQualityButtonModal.querySelector('.upgrade-cost'); // Если у вас был span с таким классом
            if (costTextEl) {
                costTextEl.textContent = newCost;
            } else {
                 upgradeContentQualityButtonModal.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            }
            
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.impactOccurred('medium');
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            closeModal(upgradesModal);
        } else { logEvent("Недостаточно средств для улучшения.", 'error'); tg.HapticFeedback.notificationOccurred('error');}
     });

    if (themeSelectionScreen) { /* ... обработчики выбора темы как раньше ... */ }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { /* ... как раньше, вызывает playCutscene() ... */ }
    
    if (tg.BackButton) { /* ... как в предыдущем полном коде (для версии 0.8.0_stable) ... */ }
});
