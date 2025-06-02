document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы UI общие
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameContainer = document.querySelector('.container');
    
    // Элементы Welcome Screen
    const startGameButton = document.getElementById('start-game-button');
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    // Элементы UI Игры
    const channelNameEl = document.getElementById('channel-name');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const engagementRateEl = document.getElementById('engagement-rate');
    const audienceMoodDisplay = document.getElementById('audience-mood-display'); // Новый
    const eventLogEl = document.getElementById('event-log');
    const gameVersionEl = document.getElementById('game-version');

    // Элементы для трендов
    const currentTrendDisplay = document.getElementById('current-trend-display');
    const trendDescriptionEl = document.getElementById('trend-description');
    const trendBonusEl = document.getElementById('trend-bonus');
    const trendDurationEl = document.getElementById('trend-duration');

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал",
        subscribers: 0,
        balance: 100,
        engagementRate: 0,
        audienceMood: 75, // Начальное настроение
        contentQualityMultiplier: 1,
        postsMade: 0,
        gameVersion: "0.4.0", // Новая версия
        theme: null,
        themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null,
        trendPostsRemaining: 0,
    };
    let gameState = { ...defaultGameState };

    function showScreen(screenElement) {
        [preloader, themeSelectionScreen, welcomeScreen, gameContainer].forEach(el => {
            if (el) {
                el.classList.remove('visible'); // Сначала убираем visible для корректной анимации
                el.style.display = 'none';
            }
        });

        if (screenElement) {
            screenElement.style.display = (screenElement === gameContainer) ? 'block' : 'flex';
            if (screenElement === gameContainer) { // Для игрового контейнера свои стили отображения
                 gameContainer.style.display = 'flex'; // Используем flex для футера внизу
                 gameContainer.style.flexDirection = 'column';
                 gameContainer.style.justifyContent = 'flex-start';
            }
            // Даем DOM обновиться перед добавлением класса для анимации
            requestAnimationFrame(() => {
                 requestAnimationFrame(() => { // Двойной requestAnimationFrame для надежности
                    screenElement.classList.add('visible');
                 });
            });
        }
    }
    
    function initializeGameFlow() {
        const savedState = localStorage.getItem('channelSimGameState_v4'); // Новый ключ
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
        loadGame(); // Загружает состояние, включая тренды
        showScreen(gameContainer);
        logEvent(`Игра началась! Тема канала: ${getThemeDisplayName(gameState.theme)}.`, "info");
        // updateTrendUI(); // Уже вызывается в loadGame
    }

    function getThemeDisplayName(themeKey) {
        const names = { news: 'Новости', entertainment: 'Развлечения', education: 'Образование', tech: 'Технологии'};
        return names[themeKey] || 'Неизвестная';
    }
     function getPostTypeName(typeKey) {
        const names = { text: 'Тексты', meme: 'Мемы', video: 'Видео'};
        return names[typeKey] || typeKey;
    }


    function loadGame() {
        const savedState = localStorage.getItem('channelSimGameState_v4');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
        }
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameEl) channelNameEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI();
        updateTrendUI(); // Важно для отображения тренда при загрузке
        checkUpgradeButton();
    }

    function saveGame() {
        localStorage.setItem('channelSimGameState_v4', JSON.stringify(gameState));
    }

    function logEvent(message, type = 'info') {
        if (!eventLogEl) return;
        const listItem = document.createElement('li');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        listItem.textContent = `[${time}] ${message}`;
        listItem.className = `log-${type}`;
        eventLogEl.prepend(listItem);
        if (eventLogEl.children.length > 20) eventLogEl.removeChild(eventLogEl.lastChild);
    }

    function updateUI() {
        if (channelNameEl) channelNameEl.textContent = gameState.channelName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (engagementRateEl) engagementRateEl.textContent = gameState.engagementRate.toFixed(1);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = gameState.audienceMood.toFixed(0); // Обновляем настроение
    }

    function checkUpgradeButton() {
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
    }

    // --- ТРЕНДЫ ---
    function generateNewTrend() {
        const trendTypes = ['text', 'meme', 'video'];
        const trendTopics = {
            text: ["Горячие новости", "Полезные советы", "Глубокий анализ"],
            meme: ["Актуальные мемы", "Классика юмора", "Животные в мемах"],
            video: ["Обзоры гаджетов", "Смешные котики", "Лайфхаки для дома"]
        };
        const randomType = trendTypes[Math.floor(Math.random() * trendTypes.length)];
        const randomTopic = trendTopics[randomType][Math.floor(Math.random() * trendTopics[randomType].length)];
        
        gameState.currentTrend = {
            type: randomType,
            topic: randomTopic,
            bonus: (Math.random() * 0.5 + 1.3).toFixed(1),
        };
        gameState.trendPostsRemaining = Math.floor(Math.random() * 3) + 3; // 3-5 постов
        logEvent(`Новый тренд! ${randomTopic} (${getPostTypeName(randomType)}) сейчас популярны! Бонус x${gameState.currentTrend.bonus} на ${gameState.trendPostsRemaining} постов.`, 'warning');
    }

    function updateTrendUI() {
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            if (trendDescriptionEl) trendDescriptionEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)})`;
            if (trendBonusEl) trendBonusEl.textContent = gameState.currentTrend.bonus;
            if (trendDurationEl) trendDurationEl.textContent = gameState.trendPostsRemaining;
            if (currentTrendDisplay) currentTrendDisplay.style.display = 'block';
        } else {
            if (currentTrendDisplay) currentTrendDisplay.style.display = 'none';
            gameState.currentTrend = null;
        }
    }


    // --- ОБРАБОТЧИКИ ---
    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme;
                gameState.theme = selectedTheme;
                gameState.audienceMood = 75; // Сброс настроения при новой игре/теме
                switch(selectedTheme) {
                    case 'news':
                        gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 };
                        gameState.channelName = "Новостной Вестник"; gameState.balance = 110;
                        break;
                    case 'entertainment':
                        gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 };
                        gameState.channelName = "Веселый Уголок";
                        break;
                    case 'education':
                        gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 };
                        gameState.channelName = "Академия Знаний"; gameState.subscribers = 5;
                        break;
                    case 'tech':
                        gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 };
                        gameState.channelName = "Техно Гуру";
                        break;
                }
                logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                saveGame(); // Сохраняем gameState с выбранной темой
                showWelcomeScreen();
            });
        });
    }

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
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
        gameState.engagementRate = parseFloat(Math.min(Math.max(newER, 0), 100).toFixed(1));

        let moodChange = 0;
        if (subGain > 2) moodChange = Math.floor(gameState.contentQualityMultiplier * 1.5); // Небольшой буст за хороший пост
        else if (subGain < 0) moodChange = -5; // Если пост вызвал отписки (пока нет такой прямой механики)
        gameState.audienceMood = Math.min(Math.max(gameState.audienceMood + moodChange, 0), 100);

        if (gameState.audienceMood < 30 && gameState.subscribers > 10) { // Условие для отписок
            const unsubscribeChance = (30 - gameState.audienceMood) / 30;
            if (Math.random() < unsubscribeChance * 0.05) { // Уменьшил шанс отписок
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
        if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { // Генерируем тренд не сразу
            if (Math.random() < 0.20) { // 20% шанс
                generateNewTrend();
            }
        }
        updateTrendUI();
        updateUI();
        saveGame();
        checkUpgradeButton();
        tg.HapticFeedback.notificationOccurred('success');
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
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100); // Небольшой бонус к настроению за улучшение
            updateUI(); saveGame(); checkUpgradeButton();
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            logEvent("Недостаточно средств для улучшения.", 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
        initializeGameFlow();
    }, 1500); 

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            if (welcomeScreen) {
                welcomeScreen.classList.remove('visible');
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                    startGameplay();
                }, 500); 
            }
        });
    }
    
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            if (gameContainer && gameContainer.classList.contains('visible')) {
                saveGame();
                logEvent("Выход из игры (прогресс сохранен).", "info");
            }
            tg.close();
        });
    }
});
