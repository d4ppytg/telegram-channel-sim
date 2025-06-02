document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Элементы UI общие
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const gameContainer = document.querySelector('.container'); // Используем querySelector, т.к. он один
    
    // Элементы Welcome Screen
    const startGameButton = document.getElementById('start-game-button');
    const telegramUsernameDisplay = document.getElementById('telegram-username-display');
    const userPhotoEl = document.getElementById('user-photo');

    // Элементы UI Игры
    const channelNameEl = document.getElementById('channel-name');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const engagementRateEl = document.getElementById('engagement-rate');
    const eventLogEl = document.getElementById('event-log');
    const gameVersionEl = document.getElementById('game-version');

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');

    tg.ready();
    tg.expand();

    let defaultGameState = {
        channelName: "Мой Канал",
        subscribers: 0,
        audienceMood: 75
        balance: 100,
        engagementRate: 0,
        contentQualityMultiplier: 1,
        postsMade: 0,
        gameVersion: "0.3.1", // Обновил версию
        theme: null,
        themeModifiers: { text: 1, meme: 1, video: 1 },
    };
    let gameState = { ...defaultGameState };

    function showScreen(screenElement) {
        [preloader, themeSelectionScreen, welcomeScreen, gameContainer].forEach(el => {
            if (el) {
                el.classList.remove('visible');
                el.style.display = 'none';
            }
        });

        if (screenElement) {
            screenElement.style.display = (screenElement === gameContainer || screenElement === preloader) ? 'flex' : 'flex'; // Все оверлеи flex для центрирования
             if (screenElement === gameContainer) screenElement.style.justifyContent = 'flex-start'; // Отменяем центрирование для контейнера игры

            setTimeout(() => screenElement.classList.add('visible'), 10); // Даем время display примениться перед opacity
        }
    }
    
    function initializeGameFlow() {
        const savedState = localStorage.getItem('channelSimGameState_v3');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
            if (gameState.theme) {
                showWelcomeScreen();
                return;
            }
        }
        gameState = { ...defaultGameState };
        saveGame(); // Сохраняем дефолтное состояние (без темы), если начали с нуля
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
        showScreen(gameContainer);
        logEvent(`Игра началась! Тема канала: ${getThemeDisplayName(gameState.theme)}.`, "info");
    }

    function getThemeDisplayName(themeKey) {
        const names = { news: 'Новости', entertainment: 'Развлечения', education: 'Образование', tech: 'Технологии'};
        return names[themeKey] || 'Неизвестная';
    }

    function loadGame() {
        const savedState = localStorage.getItem('channelSimGameState_v3');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            gameState = { ...defaultGameState, ...parsedState };
        }
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        if (channelNameEl) channelNameEl.textContent = gameState.channelName || `Канал [${getThemeDisplayName(gameState.theme)}]`;
        updateUI();
        checkUpgradeButton();
    }

    function saveGame() {
        localStorage.setItem('channelSimGameState_v3', JSON.stringify(gameState));
    }

    function logEvent(message, type = 'info') {
        if (!eventLogEl) return;
        const listItem = document.createElement('li');
        listItem.textContent = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${message}`;
        listItem.className = `log-${type}`;
        eventLogEl.prepend(listItem);
        if (eventLogEl.children.length > 20) eventLogEl.removeChild(eventLogEl.lastChild);
    }

    function updateUI() {
        if (channelNameEl) channelNameEl.textContent = gameState.channelName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (engagementRateEl) engagementRateEl.textContent = gameState.engagementRate.toFixed(1);
    }

    function checkUpgradeButton() {
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        upgradeContentQualityButton.disabled = gameState.balance < cost;
    }

    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme;
                gameState.theme = selectedTheme;
                switch(selectedTheme) {
                    case 'news':
                        gameState.themeModifiers = { text: 1.2, meme: 0.8, video: 1.1 };
                        gameState.channelName = "Новостной Вестник";
                        gameState.balance = 110;
                        break;
                    case 'entertainment':
                        gameState.themeModifiers = { text: 0.9, meme: 1.5, video: 1.2 };
                        gameState.channelName = "Веселый Уголок";
                        break;
                    case 'education':
                        gameState.themeModifiers = { text: 1.3, meme: 0.7, video: 1.0 };
                        gameState.channelName = "Академия Знаний";
                        gameState.subscribers = 5;
                        break;
                    case 'tech':
                        gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 };
                        gameState.channelName = "Техно Гуру";
                        break;
                }
                logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                saveGame();
                showWelcomeScreen();
            });
        });
    }

    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax) {
        const themeModKey = postType; // 'text', 'meme', 'video'
        const themeMod = gameState.themeModifiers[themeModKey] || 1;

        const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * gameState.contentQualityMultiplier * themeMod);
        const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier);

        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        
        let newER = (Math.random() * (erMax - erMin) + erMin) * (gameState.contentQualityMultiplier / 1.5 + 0.5);
        if (gameState.subscribers < 100 && gameState.subscribers > 0) newER *= (gameState.subscribers / 100);
        else if (gameState.subscribers === 0) newER = 0;
        gameState.engagementRate = parseFloat(Math.min(Math.max(newER, 0), 100).toFixed(1));

        let postName = "";
        if (postType === "text") postName = "текстовый пост";
        else if (postType === "meme") postName = "мем";
        else if (postType === "video") postName = "видеоролик";

        logEvent(`Опубликован ${postName}! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
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
            updateUI(); saveGame(); checkUpgradeButton();
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            logEvent("Недостаточно средств для улучшения.", 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    showScreen(preloader); // Показываем прелоадер первым
    setTimeout(() => {
        if (preloader) preloader.classList.add('hidden'); // Скрываем прелоадер
        initializeGameFlow(); // Запускаем основную логику выбора экрана
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
