document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны
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

    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    const gameVersionEl = document.getElementById('game-version');

    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const createPostButtonMonitor = document.getElementById('create-post-button-monitor');
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');

    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');
    const eventLogUl = document.getElementById('event-log');

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.7.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };
// ... (после defaultGameState) ...

const POST_THEMES = {
    text: [
        { id: 'hot_news', displayName: '🔥 Горячие Новости', baseMultiplier: 1.1 },
        { id: 'useful_tips', displayName: '💡 Полезные Советы', baseMultiplier: 1.0 },
        { id: 'deep_analysis', displayName: '🧐 Глубокий Анализ', baseMultiplier: 1.2 },
        { id: 'personal_story', displayName: '✍️ Личная История', baseMultiplier: 0.9 }
    ],
    meme: [
        { id: 'animal_memes', displayName: '😹 Мемы про Животных', baseMultiplier: 1.2 },
        { id: 'current_events', displayName: '🌍 Актуальные События', baseMultiplier: 1.1 },
        { id: 'classic_memes', displayName: '🗿 Классика Юмора', baseMultiplier: 1.0 },
        { id: 'gaming_memes', displayName: '🎮 Игровые Мемы', baseMultiplier: 1.15 }
    ],
    video: [
        { id: 'gadget_review', displayName: '📱 Обзор Гаджета', baseMultiplier: 1.2 },
        { id: 'funny_cats', displayName: '😻 Смешные Котики', baseMultiplier: 1.3 },
        { id: 'lifehacks', displayName: '🛠️ Лайфхаки', baseMultiplier: 1.1 },
        { id: 'vlog_day', displayName: '🤳 Мой День (Влог)', baseMultiplier: 0.9 }
    ]
};

let selectedPostType = null; // Будем хранить выбранный тип поста
// ...
    const CHARACTER_STATES = {
        IDLE_BLINKING: 'idle_blinking', TYPING: 'typing',
        HAPPY: 'happy', SLEEPING: 'sleeping' 
    };

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

    function showScreen(screenElement) {
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElement) {
            screenElement.style.display = 'flex'; 
            if (screenElement === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; 
                 studioContainer.style.justifyContent = 'flex-start';
                 studioContainer.style.alignItems = 'stretch';
            }
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElement.classList.add('visible'); }); });
        }
    }
    
    function playCutscene() { 
        showScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides.length > 0) { cutsceneSlides[0].style.display = 'flex'; cutsceneSlides[0].classList.add('active'); }
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
        const savedState = localStorage.getItem('channelSimGameState_v7'); 
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
        loadGame(); showScreen(studioContainer); 
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v7'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v7', JSON.stringify(gameState)); }
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
        const displayName = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = displayName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0);
        updateTrendUI();
    }
    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
    }
    function updateTrendUI() { 
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)}) Bonus x${gameState.currentTrend.bonus}, ${gameState.trendPostsRemaining} п.`;
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
        } else {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
        }
    }
    function generateNewTrend() { 
        const trendTypes = ['text', 'meme', 'video'];
        const trendTopics = { text: ["Горячие новости", "Советы", "Анализ"], meme: ["Мемы", "Юмор", "Животные"], video: ["Обзоры", "Котики", "Лайфхаки"] };
        const randomType = trendTypes[Math.floor(Math.random() * trendTypes.length)];
        const randomTopic = trendTopics[randomType][Math.floor(Math.random() * trendTopics[randomType].length)];
        gameState.currentTrend = { type: randomType, topic: randomTopic, bonus: (Math.random() * 0.5 + 1.3).toFixed(1) };
        gameState.trendPostsRemaining = Math.floor(Math.random() * 3) + 3;
        logEvent(`Новый тренд! ${randomTopic} (${getPostTypeName(randomType)}) сейчас популярны! Бонус x${gameState.currentTrend.bonus} на ${gameState.trendPostsRemaining} постов.`, 'warning');
    }
    function getThemeDisplayName(themeKey) { const n = { news: 'Новости', entertainment: 'Развлечения', education: 'Образование', tech: 'Технологии'}; return n[themeKey] || 'Неизвестная'; }
    function getPostTypeName(typeKey) { const n = { text: 'Тексты', meme: 'Мемы', video: 'Видео'}; return n[typeKey] || typeKey; }

    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); showScreen(studioContainer); } }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        setCharacterState(CHARACTER_STATES.TYPING); 
        setTimeout(() => {
            const themeModKey = postType; const themeMod = gameState.themeModifiers[themeModKey] || 1;
            const moodMultiplier = 0.8 + (gameState.audienceMood / 100) * 0.4; let trendBonusMultiplier = 1;
            if (gameState.currentTrend && gameState.currentTrend.type === postType && gameState.trendPostsRemaining > 0) { trendBonusMultiplier = parseFloat(gameState.currentTrend.bonus); gameState.audienceMood = Math.min(gameState.audienceMood + 5, 100); logEvent(`Пост "${getPostTypeName(postType)}" попал в тренд! Бонус x${trendBonusMultiplier}!`, 'info');}
            const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * gameState.contentQualityMultiplier * themeMod * moodMultiplier * trendBonusMultiplier);
            const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier);
            gameState.subscribers += subGain; gameState.balance += moneyGain; gameState.postsMade++;
            let moodChange = 0;
            if (subGain > 2) moodChange = Math.floor(gameState.contentQualityMultiplier * 1.5);
            else if (subGain < 0 && gameState.subscribers > 0) moodChange = -5; 
            gameState.audienceMood = Math.min(Math.max(gameState.audienceMood + moodChange, 0), 100);
            if (gameState.audienceMood < 30 && gameState.subscribers > 10) { const uC = (30 - gameState.audienceMood) / 30; if (Math.random() < uC * 0.05) { const unsub = Math.min(gameState.subscribers, Math.floor(Math.random()*(gameState.subscribers*0.03)+1)); gameState.subscribers -= unsub; logEvent(`Аудитория недовольна! Отписалось ${unsub} подписчиков.`, 'error'); gameState.audienceMood = Math.max(gameState.audienceMood - 3, 0);}}
            logEvent(`Опубликован ${getPostTypeName(postType)}! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
            if (gameState.currentTrend && gameState.trendPostsRemaining > 0) { gameState.trendPostsRemaining--; }
            if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { if (Math.random() < 0.20) { generateNewTrend(); }}
            
            if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); }
            else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); }

            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.notificationOccurred('success');
            closeModal(createPostModal);
        }, 700); 
    }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => {
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            gameState.balance -= cost; gameState.contentQualityMultiplier = parseFloat((gameState.contentQualityMultiplier + 0.2).toFixed(1));
            const newCost = Math.floor(cost * 1.5); upgradeContentQualityButton.dataset.cost = newCost;
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.impactOccurred('medium');
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
            closeModal(upgradesModal);
        } else { logEvent("Недостаточно средств для улучшения.", 'error'); tg.HapticFeedback.notificationOccurred('error');}
     });

    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme; gameState.theme = selectedTheme; gameState.audienceMood = 75;
                switch(selectedTheme) { 
                    case 'news': gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 }; gameState.channelName = "Новостной Вестник"; gameState.balance = 110; break;
                    case 'entertainment': gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 }; gameState.channelName = "Веселый Уголок"; break;
                    case 'education': gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 }; gameState.channelName = "Академия Знаний"; gameState.subscribers = 5; break;
                    case 'tech': gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 }; gameState.channelName = "Техно Гуру"; break;
                }
                logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success"); saveGame(); showWelcomeScreen();
            });
        });
    }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); // Общее время показа прелоадера (можно настроить)

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (welcomeScreen) {
                welcomeScreen.classList.remove('visible');
                setTimeout(() => { welcomeScreen.style.display = 'none'; playCutscene(); }, 500); 
            }
        });
    }
    
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            const visibleModal = document.querySelector('.modal-overlay.visible');
            if (visibleModal) { closeModal(visibleModal); }
            else if (studioContainer && studioContainer.classList.contains('visible')) { saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close(); }
            else if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) { tg.close(); }
            else if (welcomeScreen && welcomeScreen.classList.contains('visible')) { tg.close(); }
            else if (themeSelectionScreen && themeSelectionScreen.classList.contains('visible')) { tg.close(); }
            else { tg.close(); }
        });
    }
});
