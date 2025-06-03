document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Экраны
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container');
    
    // Элементы Welcome Screen и Cutscene
    const startGameButton = document.getElementById('start-game-button');
    const cutsceneSlides = cutsceneScreen ? cutsceneScreen.querySelectorAll('.cutscene-slide') : [];
    let currentSlideIndex = 0;
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    // Элементы "Студии"
    const channelNameOnMonitorEl = document.getElementById('channel-name-on-monitor');
    const subscribersCountEl = document.getElementById('subscribers-count'); // В хедере студии
    const balanceCountEl = document.getElementById('balance-count'); // В хедере студии
    const audienceMoodDisplay = document.getElementById('audience-mood-display'); // В хедере студии
    const gameVersionEl = document.getElementById('game-version'); // В футере студии

    // Тренды на мониторе
    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    // Кнопки в "Студии" и модальные окна
    const createPostButtonMonitor = document.getElementById('create-post-button-monitor');
    const openUpgradesButton = document.getElementById('open-upgrades-button');
    const openLogButton = document.getElementById('open-log-button');

    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    // Кнопки действий в модальном окне "Создать пост"
    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    
    // Улучшения в модальном окне
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');
    const eventLogUl = document.getElementById('event-log'); // В модальном окне лога

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал", subscribers: 0, balance: 100, engagementRate: 0, // engagementRate пока не используется в UI студии
        audienceMood: 75, contentQualityMultiplier: 1, postsMade: 0,
        gameVersion: "0.5.1", // Обновил версию
        theme: null, themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null, trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    // --- УПРАВЛЕНИЕ ЭКРАНАМИ ---
    function showScreen(screenElement) {
        // Скрываем все главные экраны/оверлеи перед показом нового
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) {
                el.classList.remove('visible');
                el.style.display = 'none';
            }
        });

        if (screenElement) {
            // Устанавливаем display flex для всех, кроме studioContainer, который может быть block или flex в зависимости от контента
            screenElement.style.display = 'flex'; 
             if (screenElement === studioContainer) {
                 studioContainer.style.flexDirection = 'column'; // Для правильного расположения хедера/мейна/футера
                 studioContainer.style.justifyContent = 'flex-start';
                 studioContainer.style.alignItems = 'stretch';
            }


            // requestAnimationFrame для более плавной анимации появления
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    screenElement.classList.add('visible');
                });
            });
        }
    }
    
    // --- ЛОГИКА CUTSCENE ---
    function playCutscene() {
        showScreen(cutsceneScreen);
        currentSlideIndex = 0;
        // Сразу показываем первый слайд, если он есть
        if (cutsceneSlides.length > 0) {
            cutsceneSlides[0].style.display = 'flex'; // Убедимся, что он display:flex
            cutsceneSlides[0].classList.add('active');
        }
        setTimeout(showNextSlide, 3000); // Запускаем смену слайдов
    }

    function showNextSlide() {
        if (currentSlideIndex < cutsceneSlides.length) {
            cutsceneSlides[currentSlideIndex].classList.remove('active');
             // Прячем предыдущий слайд после анимации исчезновения (если она есть) или сразу
            if (currentSlideIndex > 0) {
                 setTimeout(() => { // Задержка, чтобы анимация ухода успела
                    if (cutsceneSlides[currentSlideIndex - 1]) cutsceneSlides[currentSlideIndex - 1].style.display = 'none';
                 }, 500); // Должно совпадать с transition-duration слайда
            }
        }
        
        currentSlideIndex++;

        if (currentSlideIndex < cutsceneSlides.length) {
            cutsceneSlides[currentSlideIndex].style.display = 'flex';
            cutsceneSlides[currentSlideIndex].classList.add('active');
            setTimeout(showNextSlide, 3000);
        } else {
            startGameplay();
        }
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ИГРЫ ---
    function initializeGameFlow() {
        const savedState = localStorage.getItem('channelSimGameState_v5');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
            if (gameState.theme) {
                showWelcomeScreen();
                return;
            }
        }
        gameState = { ...defaultGameState };
        saveGame();
        showThemeSelectionScreen();
    }

    function showThemeSelectionScreen() { 
        logEvent("Требуется выбор тематики канала.", "info");
        showScreen(themeSelectionScreen); 
    }
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
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
    }

    // --- ЗАГРУЗКА/СОХРАНЕНИЕ/UI ---
    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v5');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
        }
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); // Обновляем все элементы UI на основе gameState
        updateTrendUI(); 
        checkUpgradeButtonStatus(); 
    }
    function saveGame() { localStorage.setItem('channelSimGameState_v5', JSON.stringify(gameState)); }
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
        // ER пока не выводим, так как нет элемента #engagement-rate на новом UI
    }
    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
    }


    // --- ТРЕНДЫ ---
    function updateTrendUI() { /* ... как раньше, но обновляет trendDescriptionMonitorEl и currentTrendDisplayMonitor ... */
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)}) Bonus x${gameState.currentTrend.bonus}, ${gameState.trendPostsRemaining} п.`;
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
        } else {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
            gameState.currentTrend = null;
        }
    }
    function generateNewTrend() { /* ... как раньше ... */
        const trendTypes = ['text', 'meme', 'video'];
        const trendTopics = { /* ... */ };
        const randomType = trendTypes[Math.floor(Math.random() * trendTypes.length)];
        const randomTopic = trendTopics[randomType][Math.floor(Math.random() * trendTopics[randomType].length)];
        gameState.currentTrend = { type: randomType, topic: randomTopic, bonus: (Math.random() * 0.5 + 1.3).toFixed(1) };
        gameState.trendPostsRemaining = Math.floor(Math.random() * 3) + 3;
        logEvent(`Новый тренд! ${randomTopic} (${getPostTypeName(randomType)}) сейчас популярны! Бонус x${gameState.currentTrend.bonus} на ${gameState.trendPostsRemaining} постов.`, 'warning');
    }
    function getThemeDisplayName(themeKey) { const names = { news: 'Новости', entertainment: 'Развлечения', education: 'Образование', tech: 'Технологии'}; return names[themeKey] || 'Неизвестная'; }
    function getPostTypeName(typeKey) { const names = { text: 'Тексты', meme: 'Мемы', video: 'Видео'}; return names[typeKey] || typeKey; }


    // --- ОБРАБОТЧИКИ МОДАЛЬНЫХ ОКОН ---
    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('visible');
            setTimeout(() => { modalElement.style.display = 'none'; }, 300);
            showScreen(studioContainer); // Возвращаемся к студии
        }
    }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.modalId;
            const modalToClose = document.getElementById(modalId);
            closeModal(modalToClose);
        });
    });

    // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ИГРЫ ---
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        // ... (логика поста как в предыдущем полном коде, с themeMod, moodMultiplier, trendBonusMultiplier, изменением настроения, отписками) ...
        const themeModKey = postType;
        const themeMod = gameState.themeModifiers[themeModKey] || 1;
        const moodMultiplier = 0.8 + (gameState.audienceMood / 100) * 0.4;
        let trendBonusMultiplier = 1;

        if (gameState.currentTrend && gameState.currentTrend.type === postType && gameState.trendPostsRemaining > 0) {
            trendBonusMultiplier = parseFloat(gameState.currentTrend.bonus);
            logEvent(`Пост "${getPostTypeName(postType)}" попал в тренд! Бонус x${trendBonusMultiplier}!`, 'info');
            gameState.audienceMood = Math.min(gameState.audienceMood + 5, 100);
        }

        const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * gameState.contentQualityMultiplier * themeMod * moodMultiplier * trendBonusMultiplier);
        const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier);

        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        
        let newER = (Math.random() * (erMax - erMin) + erMin) * (gameState.contentQualityMultiplier / 1.5 + 0.5);
        if (gameState.subscribers < 100 && gameState.subscribers > 0) newER *= (gameState.subscribers / 100);
        else if (gameState.subscribers === 0) newER = 0;
        // gameState.engagementRate = parseFloat(Math.min(Math.max(newER, 0), 100).toFixed(1)); // ER пока не отображается явно

        let moodChange = 0;
        if (subGain > 2) moodChange = Math.floor(gameState.contentQualityMultiplier * 1.5);
        else if (subGain < 0) moodChange = -5;
        gameState.audienceMood = Math.min(Math.max(gameState.audienceMood + moodChange, 0), 100);

        if (gameState.audienceMood < 30 && gameState.subscribers > 10) {
            const unsubscribeChance = (30 - gameState.audienceMood) / 30;
            if (Math.random() < unsubscribeChance * 0.05) {
                const unsubCount = Math.min(gameState.subscribers, Math.floor(Math.random() * (gameState.subscribers * 0.03) + 1));
                gameState.subscribers -= unsubCount;
                logEvent(`Аудитория недовольна! Отписалось ${unsubCount} подписчиков.`, 'error');
                gameState.audienceMood = Math.max(gameState.audienceMood - 3, 0);
            }
        }
        
        logEvent(`Опубликован ${getPostTypeName(postType)}! +${subGain} подписчиков, +$${moneyGain}.`, 'success');

        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            gameState.trendPostsRemaining--;
        }
        if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) {
            if (Math.random() < 0.20) { generateNewTrend(); }
        }
        // --- Конец логики поста ---
        updateUI(); saveGame(); checkUpgradeButtonStatus();
        tg.HapticFeedback.notificationOccurred('success');
        closeModal(createPostModal);
    }

     if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('text', 1, 5, 2, 10, 1, 5));
     if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
     if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));

     if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => {
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.contentQualityMultiplier = parseFloat((gameState.contentQualityMultiplier + 0.2).toFixed(1));
            const newCost = Math.floor(cost * 1.5);
            upgradeContentQualityButton.dataset.cost = newCost;
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
            updateUI(); saveGame(); checkUpgradeButtonStatus();
            tg.HapticFeedback.impactOccurred('medium');
            closeModal(upgradesModal); // Закрываем модалку после улучшения
        } else {
            logEvent("Недостаточно средств для улучшения.", 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
     });


    // --- ИНИЦИАЛИЗАЦИЯ И ПОРЯДОК ЗАПУСКА ---
    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme;
                gameState.theme = selectedTheme;
                gameState.audienceMood = 75;
                switch(selectedTheme) { /* ... как раньше ... */ 
                    case 'news': gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 }; gameState.channelName = "Новостной Вестник"; gameState.balance = 110; break;
                    case 'entertainment': gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 }; gameState.channelName = "Веселый Уголок"; break;
                    case 'education': gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 }; gameState.channelName = "Академия Знаний"; gameState.subscribers = 5; break;
                    case 'tech': gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 }; gameState.channelName = "Техно Гуру"; break;
                }
                logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                saveGame();
                showWelcomeScreen();
            });
        });
    }
    
    showScreen(preloader); // Начинаем с прелоадера
    setTimeout(() => {
        if (preloader) {
            preloader.classList.remove('visible');
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700); // Задержка для анимации скрытия прелоадера
        }
        initializeGameFlow();
    }, 1500); // Общее время показа прелоадера

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (welcomeScreen) {
                welcomeScreen.classList.remove('visible');
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                    playCutscene();
                }, 500); 
            }
        });
    }
    
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            const visibleModal = document.querySelector('.modal-overlay.visible');
            if (visibleModal) {
                closeModal(visibleModal);
            } else if (studioContainer && studioContainer.classList.contains('visible')) {
                saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close();
            } else if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) {
                 tg.close(); // Если на катсцене, просто закрыть
            } else if (welcomeScreen && welcomeScreen.classList.contains('visible')) {
                 tg.close();
            } else if (themeSelectionScreen && themeSelectionScreen.classList.contains('visible')) {
                 tg.close();
            } else {
                tg.close();
            }
        });
    }
});
