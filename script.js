document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны и оверлеи
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    
    const gameInterface = document.getElementById('game-interface'); // Главный игровой интерфейс
    const gameScreensContainer = document.getElementById('game-screens-container'); // Контейнер для вкладок
    const allGameScreens = gameScreensContainer ? gameScreensContainer.querySelectorAll('.game-screen') : [];
    // Конкретные экраны-вкладки
    const studioScreen = document.getElementById('studioScreen');
    // const createPostScreen = document.getElementById('createPostScreen'); // Уже есть в allGameScreens
    // const upgradesScreen = document.getElementById('upgradesScreen'); // Уже есть в allGameScreens
    // const rankingsScreen = document.getElementById('rankingsScreen'); // Уже есть в allGameScreens
    
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    const characterEl = document.getElementById('character-sprite');
    let characterStateTimeout; 

    // Элементы хедера, который теперь общий для game-interface
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const audienceMoodDisplay = document.getElementById('audience-mood-display');
    
    // Элементы вкладки "Студия"
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const gameVersionEl = document.getElementById('game-version'); 
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');
    const goToCreatePostTabButton = document.getElementById('go-to-create-post-tab'); 
    const studioSidePanel = document.getElementById('studio-side-panel'); 
    const openLogButton = document.getElementById('open-log-button');
    
    // Элементы вкладки "Создать"
    const postTextButton = document.querySelector('#createPostScreen #post-text-button');
    const postMemeButton = document.querySelector('#createPostScreen #post-meme-button');
    const postVideoButton = document.querySelector('#createPostScreen #post-video-button');
    
    // Элементы вкладки "Улучшения"
    const upgradeContentQualityButton = document.querySelector('#upgradesScreen #upgrade-content-quality');
    const upgradeCostSpan = document.querySelector('#upgradesScreen .upgrade-cost'); // Более точный селектор
    
    // Общие модальные окна и их элементы
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');
    const eventLogUl = document.getElementById('event-log');

    // Всплывающие комментарии
    const liveFeedbackContainer = document.getElementById('live-feedback-container');
    const MAX_FEEDBACK_ITEMS = 7;
    const positiveComments = ["Круто!", "Лучший пост!", "Огонь 🔥", "Люблю!", "Подписка!", "👍👍👍", "Гениально!"];
    const neutralComments = ["Интересно.", "Неплохо.", "Пойдет.", "Норм.", "🤔", "Ок."];
    const negativeComments = ["Что это?", "Скучно.", "Отписка.", "👎", "Не понял.", "Ужас."];
    const reactionEmojis = ['❤️', '😂', '🎉', '🤯', '👀', '💯'];

    const navButtons = document.querySelectorAll('.bottom-nav .nav-button');

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0,
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.9.0", 
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = { IDLE_BLINKING: 'idle_blinking', TYPING: 'typing', HAPPY: 'happy', SLEEPING: 'sleeping' };

    function setCharacterState(newState, durationMs = 0) {
        if (!characterEl) return;
        clearTimeout(characterStateTimeout);
        characterEl.className = ''; // Сбрасываем все классы
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

    function showTopLevelScreen(screenElementToShow) {
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, gameInterface].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }

    function setActiveGameScreen(targetScreenId) {
        allGameScreens.forEach(screen => {
            const isActive = screen.id === targetScreenId;
            screen.style.display = isActive ? 'flex' : 'none';
            screen.classList.toggle('active-screen', isActive);
        });
        navButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.targetScreen === targetScreenId);
        });
        if (studioSidePanel) {
            studioSidePanel.style.display = (targetScreenId === 'studioScreen') ? 'flex' : 'none';
        }
        if(gameScreensContainer) gameScreensContainer.scrollTop = 0;
    }
    
    function playCutscene() { 
        showTopLevelScreen(cutsceneScreen); currentSlideIndex = 0;
        if (cutsceneSlides.length > 0 && cutsceneSlides[0]) { // Проверка на существование
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
        const savedState = localStorage.getItem('channelSimGameState_v9'); 
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState }; if (gameState.theme) { showWelcomeScreen(); return; } }
        gameState = { ...defaultGameState }; saveGame(); showThemeSelectionScreen();
    }
    function showThemeSelectionScreen() { logEvent("Требуется выбор тематики канала.", "info"); showTopLevelScreen(themeSelectionScreen); }
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
        showTopLevelScreen(welcomeScreen); 
    }
    function startGameplay() { 
        loadGame(); 
        showTopLevelScreen(gameInterface); 
        setActiveGameScreen('studioScreen'); 
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        logEvent(`Игра запущена! Канал: ${gameState.channelName}.`, "info");
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v9');
        if (savedState) { const parsedState = JSON.parse(savedState); gameState = { ...defaultGameState, ...parsedState };}
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); updateTrendUI(); checkUpgradeButtonStatus();
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v9', JSON.stringify(gameState)); }
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
        if (upgradeCostSpan) upgradeCostSpan.textContent = cost;
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

    // Навигация
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveGameScreen(button.dataset.targetScreen);
        });
    });
    if(goToCreatePostTabButton) goToCreatePostTabButton.addEventListener('click', () => {
        setActiveGameScreen('createPostScreen');
    });

    // Модальное окно для лога
    function openModal(modalElement) { if (modalElement) { modalElement.style.display = 'flex'; requestAnimationFrame(() => modalElement.classList.add('visible')); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); } }
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    // Всплывающие комментарии
    function showFeedback(text, isEmoji = false, username = null) {
        if (!liveFeedbackContainer) return;
        const feedbackEl = document.createElement('div');
        feedbackEl.classList.add('feedback-item');
        let content = '';
        if (username) {
            const userSpan = document.createElement('span');
            userSpan.classList.add('username'); userSpan.textContent = `@${username}:`;
            feedbackEl.appendChild(userSpan);
        }
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        if (isEmoji) textSpan.classList.add('emoji');
        feedbackEl.appendChild(textSpan);
        liveFeedbackContainer.appendChild(feedbackEl);
        if (liveFeedbackContainer.children.length > MAX_FEEDBACK_ITEMS) liveFeedbackContainer.firstChild.remove();
        setTimeout(() => {
            feedbackEl.classList.add('fade-out');
            setTimeout(() => { if (feedbackEl.parentNode) feedbackEl.remove(); }, 500);
        }, 4000 + Math.random() * 2000);
    }

    // Действия игры
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
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.notificationOccurred('success');
            
            const feedbackCount = Math.floor(Math.random() * 3) + 2; 
            for (let i = 0; i < feedbackCount; i++) { setTimeout(() => { const rU = `User${Math.floor(Math.random()*1000)}`; if(Math.random()<0.3){showFeedback(reactionEmojis[Math.floor(Math.random()*reactionEmojis.length)],true,rU);}else{let cA;if(gameState.audienceMood>70&&subGain>5)cA=positiveComments;else if(gameState.audienceMood<40||subGain<1)cA=negativeComments;else cA=neutralComments;showFeedback(cA[Math.floor(Math.random()*cA.length)],false,rU);}},i*(Math.random()*500+300));}
            setActiveGameScreen('studioScreen'); 
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
            // Обновляем текст на самой кнопке (если она одна) или в карточке улучшения
            const buttonTextContainer = upgradeContentQualityButton.querySelector('h4') ? upgradeContentQualityButton.parentNode.querySelector('h4') : upgradeContentQualityButton; // Адаптируемся
            if(upgradeContentQualityButton.querySelector('.upgrade-cost')) upgradeContentQualityButton.querySelector('.upgrade-cost').textContent = newCost;
            else upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`; // Fallback
            
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.impactOccurred('medium');
            setCharacterState(CHARACTER_STATES.HAPPY, 1500); 
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
    
    showTopLevelScreen(preloader);
    setTimeout(() => {
        if (preloader) { preloader.classList.remove('visible'); setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); }
        initializeGameFlow();
    }, 2500); 

    if (startGameButton) { startGameButton.addEventListener('click', () => { if (welcomeScreen) { welcomeScreen.classList.remove('visible'); setTimeout(() => { welcomeScreen.style.display = 'none'; playCutscene(); }, 500); }});}
    
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            const visibleModal = logModal && logModal.classList.contains('visible') ? logModal : null; // Проверяем только модалку лога
            if (visibleModal) { closeModal(visibleModal); }
            else if (gameInterface && gameInterface.classList.contains('visible')) { 
                // Если мы не на главном экране "Студия", то сначала возвращаемся на него
                const currentActiveScreen = document.querySelector('.game-screen.active-screen');
                if (currentActiveScreen && currentActiveScreen.id !== 'studioScreen') {
                    setActiveGameScreen('studioScreen');
                } else { // Если мы уже на экране студии, то сохраняем и выходим
                    saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close();
                }
            }
            else if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) { tg.close(); }
            else if (welcomeScreen && welcomeScreen.classList.contains('visible')) { tg.close(); }
            else if (themeSelectionScreen && themeSelectionScreen.classList.contains('visible')) { tg.close(); }
            else { tg.close(); }
        });
    }
});
