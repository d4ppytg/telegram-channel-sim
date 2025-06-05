document.addEventListener('DOMContentLoaded', () => {
    // --- Заглушка Telegram WebApp API для отладки ---
    let tg;
    if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
        console.warn('Telegram WebApp API не загружен или недоступен. Запуск в режиме отладки с заглушкой.');
        tg = {
            ready: () => console.log('Telegram.WebApp.ready() (заглушка)'),
            expand: () => console.log('Telegram.WebApp.expand() (заглушка)'),
            initDataUnsafe: {
                user: {
                    username: 'debug_user',
                    first_name: 'Отладка',
                    photo_url: 'placeholder-avatar.png'
                }
            },
            HapticFeedback: {
                notificationOccurred: (type) => console.log(`HapticFeedback: ${type} (заглушка)`),
                impactOccurred: (type) => console.log(`HapticFeedback: ${type} (заглушка)`)
            },
            BackButton: {
                show: () => console.log('BackButton show (заглушка)'),
                hide: () => console.log('BackButton hide (заглушка)'),
                onClick: (callback) => {
                    console.log('BackButton onClick (заглушка)');
                    // В реальном приложении Telegram сам вызывает callback при нажатии
                },
                offClick: (callback) => console.log('BackButton offClick (заглушка)') // Добавлено для совместимости
            },
            close: () => console.log('Telegram.WebApp.close() (заглушка)')
        };
        window.Telegram = { WebApp: tg };
    } else {
        tg = window.Telegram.WebApp;
        console.log('Telegram WebApp API detected.');
    }

    tg.ready();
    tg.expand(); // Расширяем WebApp на весь экран

    // --- DOM Elements ---
    const preloaderScreen = document.getElementById('preloader-screen');
    const preloaderProgressBarFill = document.querySelector('.preloader-progress-bar-fill');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const mainDashboardScreen = document.getElementById('main-dashboard-screen');
    const createContentScreen = document.getElementById('create-content-screen');
    const analyticsScreen = document.getElementById('analytics-screen');
    const teamScreen = document.getElementById('team-screen');
    const monetizationScreen = document.getElementById('monetization-screen');

    // Кнопки
    const themeCards = document.querySelectorAll('.theme-card');
    const selectThemeButton = document.getElementById('select-theme-button');
    const createPostBtn = document.getElementById('create-post-btn');
    const analyticsBtn = document.getElementById('analytics-btn');
    const teamBtn = document.getElementById('team-btn');
    const monetizationBtn = document.getElementById('monetization-btn');
    const generateIdeaBtn = document.getElementById('generate-idea-btn');
    const contentTypeBtns = document.querySelectorAll('.content-type-btn');


    // Статистика на дашборде
    const energyValueEl = document.getElementById('energy-value');
    const energyMaxEl = document.getElementById('energy-max');
    const moodValueEl = document.getElementById('mood-value');
    const moodMaxEl = document.getElementById('mood-max');
    const channelNameEl = document.getElementById('channel-name');
    const subscribersValueEl = document.getElementById('subscribers-value');
    const subscribersChangeEl = document.getElementById('subscribers-change');
    const viewsValueEl = document.getElementById('views-value');
    const viewsChangeEl = document.getElementById('views-change');
    const balanceValueEl = document.getElementById('balance-value');
    const characterSprite = document.getElementById('character-sprite');
    const warningMessage = document.getElementById('warning-message');
    const warningText = document.getElementById('warning-text');

    // Статус производства поста
    const postProductionStatus = document.getElementById('post-production-status');
    const postInProductionType = document.getElementById('post-in-production-type');
    const postProductionProgressFill = document.getElementById('post-production-progress-fill');
    const postProductionTimeLeft = document.getElementById('post-production-time-left');
    const contentIdeasList = document.getElementById('content-ideas-list');

    // Модальное окно
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');
    const closeModalButton = document.querySelector('.close-modal-button');

    // --- Game State ---
    let gameState = {
        currentScreen: 'preloader-screen',
        selectedTheme: null,
        energy: 100,
        maxEnergy: 100,
        mood: 100,
        maxMood: 100,
        subscribers: 0,
        views: 0,
        balance: 0,
        channelName: "Мой Канал",
        postInProduction: null, // { type: 'post', idea: 'Gaming News', duration: 10, timeLeft: 10, startTime: Date.now() }
        gameInterval: null,
        subWaveInterval: null,
        lastSubWaveTime: Date.now(),
        initialLoadComplete: false,
        lastUpdateTime: Date.now(),
        debugMode: true // Включите для более удобной отладки
    };

    // --- Game Data (могут быть загружены с сервера) ---
    const gameData = {
        themes: {
            gaming: { name: 'Игровой Канал', channelNames: ['PixelPlay', 'GameVerse', 'LevelUp Hub'] },
            lifestyle: { name: 'Лайфстайл Блог', channelNames: ['LifeVlog', 'DailyFlow', 'UrbanVibes'] },
            tech: { name: 'Техноблог', channelNames: ['TechTrends', 'FutureGadgets', 'Digital Pulse'] }
        },
        contentTypes: {
            post: { name: 'Пост', baseDuration: 10, baseCost: 5, baseEnergy: 10 },
            video: { name: 'Видео', baseDuration: 30, baseCost: 20, baseEnergy: 30 },
            story: { name: 'Сторис', baseDuration: 5, baseCost: 2, baseEnergy: 5 },
            podcast: { name: 'Подкаст', baseDuration: 20, baseCost: 15, baseEnergy: 25 }
        },
        contentIdeas: {
            gaming: [
                { id: 'gaming-news', name: 'Игровые Новости', description: 'Обзор последних новостей в мире гейминга.', type: 'post', difficulty: 1, baseSubs: 10, baseViews: 50, energyCost: 5, timeCost: 5 },
                { id: 'game-review', name: 'Обзор новой игры', description: 'Подробный обзор популярной игры.', type: 'video', difficulty: 2, baseSubs: 50, baseViews: 200, energyCost: 20, timeCost: 20 },
                { id: 'stream-highlights', name: 'Нарезка со стрима', description: 'Лучшие моменты с недавних трансляций.', type: 'story', difficulty: 1, baseSubs: 5, baseViews: 30, energyCost: 3, timeCost: 3 },
                { id: 'esports-analysis', name: 'Анализ киберспорта', description: 'Разбор текущих турниров и команд.', type: 'podcast', difficulty: 3, baseSubs: 30, baseViews: 150, energyCost: 15, timeCost: 15 }
            ],
            lifestyle: [
                { id: 'travel-vlog', name: 'Влог о путешествии', description: 'Приключения в новом городе.', type: 'video', difficulty: 2, baseSubs: 60, baseViews: 250, energyCost: 25, timeCost: 25 },
                { id: 'fashion-haul', name: 'Обзор покупок одежды', description: 'Демонстрация последних приобретений.', type: 'post', difficulty: 1, baseSubs: 12, baseViews: 60, energyCost: 7, timeCost: 6 },
                { id: 'cooking-recipe', name: 'Рецепт дня', description: 'Простой и вкусный рецепт для дома.', type: 'story', difficulty: 1, baseSubs: 7, baseViews: 40, energyCost: 4, timeCost: 4 },
                { id: 'daily-routine', name: 'Мой день', description: 'Один день из жизни блогера.', type: 'podcast', difficulty: 2, baseSubs: 25, baseViews: 100, energyCost: 12, timeCost: 12 }
            ],
            tech: [
                { id: 'gadget-review', name: 'Обзор нового гаджета', description: 'Тест и мнение о популярном устройстве.', type: 'video', difficulty: 3, baseSubs: 70, baseViews: 300, energyCost: 30, timeCost: 30 },
                { id: 'tech-news-digest', name: 'Дайджест тех. новостей', description: 'Коротко о главном в мире технологий.', type: 'post', difficulty: 1, baseSubs: 15, baseViews: 70, energyCost: 8, timeCost: 7 },
                { id: 'quick-tips', name: 'Быстрые советы по ПО', description: 'Лайфхаки для программ.', type: 'story', difficulty: 1, baseSubs: 8, baseViews: 45, energyCost: 5, timeCost: 5 },
                { id: 'future-tech-talk', name: 'Разговор о будущем технологий', description: 'Обсуждение трендов и инноваций.', type: 'podcast', difficulty: 2, baseSubs: 35, baseViews: 180, energyCost: 18, timeCost: 18 }
            ]
        }
    };

    // --- Preloader Logic ---
    const assetsToLoad = [
        'assets/logo.png',
        'assets/theme_gaming.png',
        'assets/theme_lifestyle.png',
        'assets/theme_tech.png',
        'assets/character_idle.png',
        'assets/character_happy.png',
        'assets/character_typing.png',
        'assets/character_sleeping.png',
        // Добавьте другие важные изображения, которые должны быть загружены до старта игры
        // Например, иконки, фоны, если они не в CSS
    ];

    let assetsLoaded = 0;

    function loadAsset(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                assetsLoaded++;
                updatePreloader();
                resolve();
            };
            img.onerror = () => {
                console.error(`Ошибка загрузки: ${url}`);
                assetsLoaded++; // Продолжаем даже при ошибке, чтобы не застопорить прелоадер
                updatePreloader();
                resolve(); // Разрешаем промис, чтобы приложение не зависло
            };
            img.src = url;
        });
    }

    function updatePreloader() {
        const progress = (assetsLoaded / assetsToLoad.length) * 100;
        preloaderProgressBarFill.style.width = `${progress}%`;
        if (progress >= 100 && !gameState.initialLoadComplete) {
            // Задержка перед скрытием прелоадера, чтобы анимация была видна
            setTimeout(() => {
                gameState.initialLoadComplete = true;
                // Инициализация Telegram WebApp, если еще не сделана
                tg.ready();
                tg.expand();
                showScreen('theme-selection-screen'); // Переходим к следующему экрану
                tg.HapticFeedback.notificationOccurred('success');
            }, 500); // 0.5 секунды задержки
        }
    }

    async function initializeApp() {
        // Проверяем, есть ли сохраненное состояние
        const savedState = localStorage.getItem('socialMediaTycoonState');
        if (savedState) {
            gameState = JSON.parse(savedState);
            // Восстанавливаем состояние элементов UI
            updateUI();
            // Сразу переходим к дашборду, если игра уже начата
            showScreen('main-dashboard-screen');
            // Перезапускаем игровые циклы
            startGameLoop();
            startSubWaveInterval();
            console.log('Игра загружена из сохранения.');
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            console.log('Начинаем новую игру или загружаем ассеты.');
            // Запускаем загрузку ассетов
            Promise.all(assetsToLoad.map(loadAsset)).then(() => {
                // Все ассеты загружены, прелоадер обновлен в updatePreloader
                // Переход на следующий экран уже вызван в updatePreloader
            }).catch(error => {
                console.error('Ошибка при загрузке ассетов:', error);
                // В случае серьезной ошибки, все равно пытаемся перейти дальше
                updatePreloader();
                showScreen('theme-selection-screen');
                tg.HapticFeedback.notificationOccurred('error');
            });
        }
    }

    // --- Screen Management ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('visible');
            // Сбрасываем прокрутку, если у экрана была собственная прокрутка
            if (screen.id !== 'main-dashboard-screen') { // Дашборд всегда без прокрутки
                screen.scrollTop = 0;
            }
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('visible');
            gameState.currentScreen = screenId;
            saveGameState(); // Сохраняем текущий экран
            updateBackButton(); // Обновляем поведение кнопки "Назад"
            updateActiveActionButton(); // Обновляем активную кнопку в нижнем меню
        } else {
            console.error(`Экран с ID "${screenId}" не найден.`);
        }
    }

    function updateBackButton() {
        if (tg && tg.BackButton) {
            // Удаляем предыдущие слушатели, чтобы избежать дублирования
            tg.BackButton.offClick(handleBackButtonClick);

            if (gameState.currentScreen === 'main-dashboard-screen' || gameState.currentScreen === 'preloader-screen' || gameState.currentScreen === 'theme-selection-screen') {
                tg.BackButton.hide();
            } else {
                tg.BackButton.show();
                tg.BackButton.onClick(handleBackButtonClick);
            }
        }
    }

    function handleBackButtonClick() {
        tg.HapticFeedback.impactOccurred('light');
        if (gameState.currentScreen === 'create-content-screen' ||
            gameState.currentScreen === 'analytics-screen' ||
            gameState.currentScreen === 'team-screen' ||
            gameState.currentScreen === 'monetization-screen') {
            showScreen('main-dashboard-screen');
        } else if (gameState.currentScreen === 'modal-overlay') {
            hideModal(); // Если открыто модальное окно, сначала закрываем его
        }
        // Добавьте логику для других экранов, если они появятся
    }

    // --- Theme Selection ---
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            tg.HapticFeedback.impactOccurred('light');
            themeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.selectedTheme = card.dataset.theme;
            selectThemeButton.disabled = false;
        });
    });

    selectThemeButton.addEventListener('click', () => {
        if (gameState.selectedTheme) {
            tg.HapticFeedback.notificationOccurred('success');
            // Устанавливаем имя канала на основе выбранной темы
            const themeInfo = gameData.themes[gameState.selectedTheme];
            if (themeInfo && themeInfo.channelNames && themeInfo.channelNames.length > 0) {
                gameState.channelName = themeInfo.channelNames[Math.floor(Math.random() * themeInfo.channelNames.length)];
            } else {
                gameState.channelName = "Мой Канал"; // Запасное имя
            }
            updateUI(); // Обновляем UI с новым именем канала
            showScreen('main-dashboard-screen');
            startGameLoop(); // Запускаем основной игровой цикл
            startSubWaveInterval(); // Запускаем интервал волн подписчиков
        }
    });

    // --- Game Loop and Stats Update ---
    function updateUI() {
        energyValueEl.textContent = gameState.energy;
        energyMaxEl.textContent = gameState.maxEnergy;
        moodValueEl.textContent = gameState.mood;
        moodMaxEl.textContent = gameState.maxMood;
        channelNameEl.textContent = gameState.channelName;
        subscribersValueEl.textContent = formatNumber(gameState.subscribers);
        viewsValueEl.textContent = formatNumber(gameState.views);
        balanceValueEl.textContent = formatNumber(gameState.balance);

        // Обновление изменения подписчиков и просмотров (пока заглушка)
        // В реальной игре эти значения будут меняться динамически
        const subChange = 0; // Например, рассчитывайте из активности
        const viewChange = 0; // Например, рассчитывайте из активности
        subscribersChangeEl.textContent = (subChange >= 0 ? '+' : '') + formatNumber(subChange);
        viewsChangeEl.textContent = (viewChange >= 0 ? '+' : '') + formatNumber(viewChange);
        subscribersChangeEl.classList.toggle('up', subChange >= 0);
        subscribersChangeEl.classList.toggle('down', subChange < 0);
        viewsChangeEl.classList.toggle('up', viewChange >= 0);
        viewsChangeEl.classList.toggle('down', viewChange < 0);

        // Обновление персонажа и статуса производства
        updateCharacterSprite();
        updatePostProductionStatus();
    }

    function formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function gameTick() {
        const now = Date.now();
        const deltaTime = (now - gameState.lastUpdateTime) / 1000; // Дельта времени в секундах
        gameState.lastUpdateTime = now;

        // Обновление энергии и настроения
        // Пример: настроение медленно падает, если нет активности
        gameState.mood = Math.max(0, gameState.mood - (0.1 * deltaTime)); // Падает на 0.1 в секунду
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + (0.5 * deltaTime)); // Восстанавливается на 0.5 в секунду

        // Проверка производства поста
        if (gameState.postInProduction) {
            gameState.postInProduction.timeLeft -= deltaTime;
            if (gameState.postInProduction.timeLeft <= 0) {
                completePostProduction();
            }
        }

        updateUI(); // Обновляем UI каждый тик
        saveGameState(); // Сохраняем состояние игры
    }

    function startGameLoop() {
        if (gameState.gameInterval) {
            clearInterval(gameState.gameInterval);
        }
        gameState.gameInterval = setInterval(gameTick, 1000 / 30); // 30 тиков в секунду для плавности
    }

    // --- Subscriber Wave Logic ---
    function generateSubscribersWave() {
        const now = Date.now();
        // Генерируем новую волну подписчиков каждые 10-30 секунд
        if (now - gameState.lastSubWaveTime >= (gameState.debugMode ? 5000 : 10000 + Math.random() * 20000)) {
            const minSubs = 1 + Math.floor(gameState.subscribers / 1000); // Больше подписчиков = больше прирост
            const maxSubs = 10 + Math.floor(gameState.subscribers / 500);
            const newSubs = Math.floor(Math.random() * (maxSubs - minSubs + 1)) + minSubs;
            const newViews = newSubs * (5 + Math.random() * 10); // Просмотры в 5-15 раз больше подписчиков

            const oldSubscribers = gameState.subscribers;
            const oldViews = gameState.views;

            gameState.subscribers += newSubs;
            gameState.views += newViews;

            // Расчет дохода (простая модель: 1 рубль за 1000 просмотров)
            const income = Math.floor(newViews / 1000);
            gameState.balance += income;

            // Обновляем тренд изменения
            const subsDelta = gameState.subscribers - oldSubscribers;
            const viewsDelta = gameState.views - oldViews;

            subscribersChangeEl.textContent = (subsDelta >= 0 ? '+' : '') + formatNumber(subsDelta);
            subscribersChangeEl.classList.toggle('up', subsDelta >= 0);
            subscribersChangeEl.classList.toggle('down', subsDelta < 0);

            viewsChangeEl.textContent = (viewsDelta >= 0 ? '+' : '') + formatNumber(viewsDelta);
            viewsChangeEl.classList.toggle('up', viewsDelta >= 0);
            viewsChangeEl.classList.toggle('down', viewsDelta < 0);

            // Визуальное изменение стрелок
            subscribersChangeEl.previousElementSibling.classList.toggle('up', subsDelta >= 0);
            subscribersChangeEl.previousElementSibling.classList.toggle('down', subsDelta < 0);
            viewsChangeEl.previousElementSibling.classList.toggle('up', viewsDelta >= 0);
            viewsChangeEl.previousElementSibling.classList.toggle('down', viewsDelta < 0);

            if (subsDelta > 0) tg.HapticFeedback.notificationOccurred('success');
            if (income > 0) tg.HapticFeedback.notificationOccurred('success');

            gameState.lastSubWaveTime = now;
            updateUI();
        }
    }

    function startSubWaveInterval() {
        if (gameState.subWaveInterval) {
            clearInterval(gameState.subWaveInterval);
        }
        gameState.subWaveInterval = setInterval(generateSubscribersWave, 1000); // Проверяем каждую секунду
    }

    // --- Character & Production Status ---
    function updateCharacterSprite() {
        // Логика смены спрайтов персонажа в зависимости от состояния
        // По умолчанию персонаж бездействует
        characterSprite.src = 'assets/character_idle.png';
        characterSprite.className = 'character-sprite char-state-idle char-anim-idle-blink';

        if (gameState.postInProduction) {
            characterSprite.src = 'assets/character_typing.png';
            characterSprite.className = 'character-sprite char-state-typing';
        } else if (gameState.mood < 30) {
            // Если настроение очень низкое
            characterSprite.src = 'assets/character_sleeping.png'; // Или другой спрайт для плохого настроения
            characterSprite.className = 'character-sprite char-state-sleeping';
        } else if (gameState.subscribers > 0 && gameState.subscribers % 100 < 50 && (Date.now() % 5000 < 1000)) {
            // Простая логика для "счастливого" состояния, когда подписчики растут
            characterSprite.src = 'assets/character_happy.png';
            characterSprite.className = 'character-sprite char-state-happy';
        }
        // Если никаких активных состояний нет, возвращаемся к idle.
        // Перерисовывать src и class лучше только при изменении состояния для производительности.
    }

    function updatePostProductionStatus() {
        if (gameState.postInProduction) {
            postProductionStatus.classList.remove('hidden');
            postInProductionType.textContent = gameState.contentTypes[gameState.postInProduction.type].name;
            const progress = (1 - (gameState.postInProduction.timeLeft / gameState.postInProduction.duration)) * 100;
            postProductionProgressFill.style.width = `${Math.min(100, progress)}%`;
            postProductionTimeLeft.textContent = Math.max(0, Math.ceil(gameState.postInProduction.timeLeft));
        } else {
            postProductionStatus.classList.add('hidden');
        }
    }

    function completePostProduction() {
        if (!gameState.postInProduction) return;

        const producedContent = gameState.postInProduction.idea;
        const contentType = gameState.postInProduction.type;
        const contentInfo = gameData.contentIdeas[gameState.selectedTheme].find(idea => idea.id === producedContent.id);

        if (contentInfo) {
            // Рассчитываем прирост подписчиков и просмотров
            // В будущем здесь будет более сложная логика, учитывающая качество контента, тренды и т.д.
            const subsGained = contentInfo.baseSubs * (1 + Math.random() * 0.5);
            const viewsGained = contentInfo.baseViews * (1 + Math.random() * 0.5);

            gameState.subscribers += Math.round(subsGained);
            gameState.views += Math.round(viewsGained);
            gameState.mood = Math.min(gameState.maxMood, gameState.mood + 10); // Улучшаем настроение после публикации

            // Показываем сообщение о результате
            showModal('Контент Опубликован!', `Пост "${contentInfo.name}" принес ${Math.round(subsGained)} подписчиков и ${Math.round(viewsGained)} просмотров!`, [
                { text: 'Отлично!', action: () => hideModal() }
            ]);
            tg.HapticFeedback.notificationOccurred('success');

        } else {
            console.error('Ошибка: Контент идея не найдена для завершенного поста:', producedContent);
            showModal('Ошибка', 'Что-то пошло не так при публикации контента.', [
                { text: 'ОК', action: () => hideModal() }
            ]);
            tg.HapticFeedback.notificationOccurred('error');
        }

        gameState.postInProduction = null;
        updateUI();
        saveGameState();
    }

    // --- Create Content Screen Logic ---
    createPostBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        showScreen('create-content-screen');
        generateContentIdeas();
    });

    contentTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tg.HapticFeedback.impactOccurred('light');
            contentTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            generateContentIdeas();
        });
    });

    function generateContentIdeas() {
        contentIdeasList.innerHTML = ''; // Очищаем старые идеи
        const activeContentType = document.querySelector('.content-type-btn.active').dataset.type;
        const ideas = gameData.contentIdeas[gameState.selectedTheme]
            .filter(idea => idea.type === activeContentType);

        if (ideas.length === 0) {
            contentIdeasList.innerHTML = '<p class="placeholder-text">Нет доступных идей для данного типа контента.</p>';
            return;
        }

        ideas.forEach(idea => {
            const contentType = gameData.contentTypes[idea.type];
            const finalEnergyCost = idea.energyCost || contentType.baseEnergy;
            const finalTimeCost = idea.timeCost || contentType.baseDuration;

            const button = document.createElement('button');
            button.className = 'btn content-idea-button';
            button.dataset.ideaId = idea.id;
            button.dataset.type = idea.type;
            button.disabled = gameState.energy < finalEnergyCost || gameState.postInProduction !== null; // Отключаем, если нет энергии или пост уже делается

            let iconClass;
            switch(idea.type) {
                case 'post': iconClass = 'fas fa-pencil-alt'; break;
                case 'video': iconClass = 'fas fa-video'; break;
                case 'story': iconClass = 'fas fa-camera'; break;
                case 'podcast': iconClass = 'fas fa-microphone-alt'; break;
                default: iconClass = 'fas fa-star'; // Запасная иконка
            }

            button.innerHTML = `
                <i class="${iconClass} idea-icon"></i>
                <div class="idea-details">
                    <h3>${idea.name}</h3>
                    <p>${idea.description}</p>
                    <div>
                        <span class="idea-cost">Энергия: ${finalEnergyCost} <i class="fas fa-bolt"></i></span>
                        <span class="idea-duration">Время: ${finalTimeCost} сек <i class="fas fa-clock"></i></span>
                    </div>
                </div>
            `;
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    tg.HapticFeedback.impactOccurred('medium');
                    startContentProduction(idea, finalEnergyCost, finalTimeCost);
                }
            });
            contentIdeasList.appendChild(button);
        });

        // Обновляем состояние всех кнопок после перерисовки
        updateContentIdeaButtonsState();
    }

    function updateContentIdeaButtonsState() {
        document.querySelectorAll('.content-idea-button').forEach(button => {
            const ideaId = button.dataset.ideaId;
            const ideaType = button.dataset.type;
            const idea = gameData.contentIdeas[gameState.selectedTheme].find(i => i.id === ideaId && i.type === ideaType);

            if (idea) {
                const contentType = gameData.contentTypes[idea.type];
                const finalEnergyCost = idea.energyCost || contentType.baseEnergy;

                button.disabled = gameState.energy < finalEnergyCost || gameState.postInProduction !== null;
            }
        });
    }

    function startContentProduction(idea, energyCost, timeCost) {
        if (gameState.energy >= energyCost && !gameState.postInProduction) {
            gameState.energy -= energyCost;
            gameState.postInProduction = {
                type: idea.type,
                idea: idea,
                duration: timeCost,
                timeLeft: timeCost,
                startTime: Date.now()
            };
            showScreen('main-dashboard-screen'); // Возвращаемся на дашборд
            updateUI(); // Обновляем UI, чтобы показать статус производства
            saveGameState();
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            if (gameState.postInProduction) {
                showModal('Внимание', 'Вы уже создаете контент. Подождите завершения текущего производства.', [
                    { text: 'Понятно', action: () => hideModal() }
                ]);
                tg.HapticFeedback.notificationOccurred('error');
            } else {
                showModal('Недостаточно энергии', `Для создания "${idea.name}" требуется ${energyCost} энергии. У вас ${gameState.energy}.`, [
                    { text: 'ОК', action: () => hideModal() }
                ]);
                tg.HapticFeedback.notificationOccurred('error');
            }
        }
    }

    // --- Other Dashboard Buttons (Placeholder) ---
    analyticsBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        showScreen('analytics-screen');
    });

    teamBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        showScreen('team-screen');
    });

    monetizationBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        showScreen('monetization-screen');
    });

    function updateActiveActionButton() {
        // Убираем active со всех кнопок
        document.querySelectorAll('.action-button').forEach(btn => btn.classList.remove('active'));

        // Добавляем active к текущей кнопке
        let currentBtn;
        switch (gameState.currentScreen) {
            case 'main-dashboard-screen':
                // На дашборде ни одна кнопка не активна по умолчанию, или можно сделать "Создать Контент" активной
                break;
            case 'create-content-screen':
                currentBtn = createPostBtn;
                break;
            case 'analytics-screen':
                currentBtn = analyticsBtn;
                break;
            case 'team-screen':
                currentBtn = teamBtn;
                break;
            case 'monetization-screen':
                currentBtn = monetizationBtn;
                break;
        }
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
    }

    // --- AI Idea Generation (Placeholder) ---
    generateIdeaBtn.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('light');
        showModal('Генерация Идеи (ИИ)', 'Искусственный Интеллект генерирует уникальную идею для вашего контента. Это займет некоторое время и будет стоить X энергии.', [
            { text: 'Сгенерировать (X энергии)', action: () => {
                // Здесь будет логика генерации и списания энергии
                hideModal();
                showModal('Идея сгенерирована!', 'ИИ предложил: "Создать интерактивный VR-тур по историческим местам!" (пока заглушка).', [
                    { text: 'Отлично!', action: () => hideModal() }
                ]);
                tg.HapticFeedback.notificationOccurred('success');
            }},
            { text: 'Отмена', action: () => hideModal(), isCancel: true }
        ]);
    });

    // --- Modal Logic ---
    function showModal(title, bodyHtml, actions) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modalActions.innerHTML = ''; // Очищаем старые кнопки

        actions.forEach(action => {
            const button = document.createElement('button');
            button.classList.add('btn');
            button.textContent = action.text;
            button.addEventListener('click', () => {
                tg.HapticFeedback.impactOccurred('light');
                action.action();
            });
            if (action.isCancel) {
                // Добавляем стили для кнопки "Отмена", если это необходимо
                button.style.backgroundColor = '#666';
                button.style.boxShadow = 'none';
            }
            modalActions.appendChild(button);
        });

        modalOverlay.classList.add('visible');
        gameState.currentScreen = 'modal-overlay'; // Устанавливаем текущий экран как модальное окно
        updateBackButton(); // Обновляем кнопку "Назад" для модального окна
    }

    function hideModal() {
        modalOverlay.classList.remove('visible');
        // Возвращаем на предыдущий экран
        if (gameState.currentScreen === 'modal-overlay') {
            const previousScreenId = localStorage.getItem('socialMediaTycoonLastScreen') || 'main-dashboard-screen';
            showScreen(previousScreenId); // Возвращаемся на дашборд или предыдущий экран
        }
        updateBackButton();
    }

    closeModalButton.addEventListener('click', hideModal);

    // Закрытие модального окна по клику вне его контента (но не по самому контенту)
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideModal();
        }
    });

    // --- Save/Load Game State ---
    function saveGameState() {
        localStorage.setItem('socialMediaTycoonState', JSON.stringify(gameState));
        localStorage.setItem('socialMediaTycoonLastScreen', gameState.currentScreen); // Сохраняем последний активный экран
    }

    function loadGameState() {
        const savedState = localStorage.getItem('socialMediaTycoonState');
        if (savedState) {
            gameState = JSON.parse(savedState);
            console.log('Состояние игры загружено:', gameState);
        } else {
            console.log('Сохраненное состояние игры не найдено. Начинаем новую игру.');
        }
    }

    // --- Initial App Load ---
    // Вызываем инициализацию, которая теперь управляет прелоадером и загрузкой
    initializeApp();

    // Debug: кнопка для сброса состояния (только для отладки)
    // Добавьте эту кнопку в HTML, если хотите: <button id="reset-game-btn">Сбросить игру</button>
    // const resetGameBtn = document.getElementById('reset-game-btn');
    // if (resetGameBtn) {
    //     resetGameBtn.addEventListener('click', () => {
    //         if (confirm('Вы уверены, что хотите сбросить игру? Все данные будут потеряны.')) {
    //             localStorage.removeItem('socialMediaTycoonState');
    //             localStorage.removeItem('socialMediaTycoonLastScreen');
    //             location.reload(); // Перезагружаем страницу
    //         }
    //     });
    // }
});
