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
    const warningMessageEl = document.getElementById('warning-message');
    const warningTextEl = document.getElementById('warning-text');

    // Персонаж
    const characterSpriteEl = document.getElementById('character-sprite');

    // Статус производства поста
    const postProductionStatusEl = document.getElementById('post-production-status');
    const postInProductionTypeEl = document.getElementById('post-in-production-type');
    const postProductionProgressFillEl = document.getElementById('post-production-progress-fill');
    const postProductionTimeLeftEl = document.getElementById('post-production-time-left');

    // Модальные окна
    const modalOverlayEl = document.getElementById('modal-overlay');
    const modalContentEl = document.getElementById('modal-content');
    const closeModalButtonEl = document.querySelector('.close-modal-button');
    const modalTitleEl = document.getElementById('modal-title');
    const modalBodyEl = document.getElementById('modal-body');
    const modalActionsEl = document.getElementById('modal-actions');

    const contentIdeasListEl = document.getElementById('content-ideas-list');


    // --- Game State (Core) ---
    const initialGameState = {
        currentScreen: 'preloader-screen',
        userName: 'Игрок',
        channelTheme: null,
        channel: {
            name: 'Мой Канал',
            subscribers: 0,
            subscribersChange: 0,
            views: 0,
            viewsChange: 0,
            balance: 0,
            level: 1, // Уровень канала
            reputation: 100 // Влияет на виральность и приход рекламодателей
        },
        energy: 100,
        maxEnergy: 100,
        mood: 100,
        maxMood: 100,
        contentQuality: 1, // Уровень улучшения качества контента
        team: [], // Массив объектов команды
        activeTrends: [], // Активные тренды
        postProduction: {
            inProgress: false,
            type: '', // Название поста
            duration: 0, // Общая длительность
            timeLeft: 0, // Оставшееся время
            progress: 0 // Прогресс в процентах
        },
        log: [], // Журнал событий
        lastTickTime: Date.now(),
        lastIdeaRefreshTime: Date.now(),
        availableContentIdeas: [], // Идеи, доступные для создания поста
        gameVersion: 'v0.1.0' // Версия игры для миграции сохранений
    };

    let gameState = JSON.parse(JSON.stringify(initialGameState)); // Глубокая копия

    // --- Game Data (Configuration) ---
    // Это только примеры, нужно будет расширить
    const gameConfig = {
        TICK_INTERVAL_MS: 1000, // Интервал обновления игры в мс
        SAVE_INTERVAL_MS: 5000, // Интервал автосохранения в мс
        ENERGY_REGEN_RATE_PER_SEC: 1,
        MOOD_DECAY_RATE_PER_SEC: 0.1,
        IDEA_REFRESH_INTERVAL_SEC: 60, // Обновление идей каждую минуту для теста
        // ... другие конфиги (роста, трендов, апгрейдов)
    };

    const themesData = {
        gaming: { name: 'Игровой Канал', icon: '🎮', contentIdeas: [] },
        lifestyle: { name: 'Лайфстайл Блог', icon: '✨', contentIdeas: [] },
        tech: { name: 'Техноблог', icon: '💻', contentIdeas: [] }
    };

    // Пример идей контента (реальные данные будут в data/content_ideas_data.js)
    const allContentIdeas = [
        { id: 'gaming_review', theme: 'gaming', name: 'Обзор новой игры', description: 'Подробный обзор свежего релиза.', energyCost: 20, duration: 15, baseSubs: 100, baseViews: 500, baseBalance: 50, icon: '🎮', formats: ['Видео', 'Текст'], minQuality: 1 },
        { id: 'gaming_memes', theme: 'gaming', name: 'Свежие игровые мемы', description: 'Сборник лучших мемов недели.', energyCost: 10, duration: 8, baseSubs: 50, baseViews: 300, baseBalance: 20, icon: '😂', formats: ['Изображение', 'Текст'], minQuality: 1 },
        { id: 'tech_review_gadget', theme: 'tech', name: 'Обзор нового гаджета', description: 'Подробный анализ смартфона/ноутбука.', energyCost: 25, duration: 20, baseSubs: 150, baseViews: 800, baseBalance: 70, icon: '📱', formats: ['Видео', 'Текст'], minQuality: 1 },
        { id: 'tech_lifehacks', theme: 'tech', name: '5 лайфхаков для ПК', description: 'Ускоряем работу компьютера.', energyCost: 15, duration: 12, baseSubs: 80, baseViews: 400, baseBalance: 30, icon: '💡', formats: ['Текст', 'Видео'], minQuality: 1 },
        { id: 'lifestyle_vlog_day', theme: 'lifestyle', name: 'Мой день влог', description: 'Покажите свой день в городе.', energyCost: 20, duration: 18, baseSubs: 120, baseViews: 600, baseBalance: 60, icon: '🚶‍♀️', formats: ['Видео'], minQuality: 1 },
        { id: 'lifestyle_food_recipe', theme: 'lifestyle', name: 'Простой рецепт ужина', description: 'Вкусное и быстрое блюдо.', energyCost: 15, duration: 10, baseSubs: 70, baseViews: 350, baseBalance: 25, icon: '🍳', formats: ['Текст', 'Видео'], minQuality: 1 },
        // ... другие идеи
    ];


    // --- Core Game Functions ---

    // Load game state from LocalStorage
    function loadGame() {
        try {
            const savedState = localStorage.getItem('socialMediaTycoonState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (parsedState.gameVersion === gameState.gameVersion) {
                    gameState = { ...initialGameState, ...parsedState };
                    console.log('Game loaded successfully.');
                    addLog('Игра загружена.', 'info');
                } else {
                    console.warn('Game version mismatch. Starting new game.');
                    addLog('Обнаружена новая версия игры. Начинаем новую игру.', 'warning');
                    // Можно реализовать логику миграции данных, если нужно
                }
            } else {
                console.log('No saved game found. Starting new game.');
                addLog('Новая игра начата.', 'info');
            }
        } catch (e) {
            console.error('Error loading game state:', e);
            addLog('Ошибка загрузки сохранения. Начинаем новую игру.', 'error');
            localStorage.removeItem('socialMediaTycoonState'); // Clear corrupted save
        }
        gameState.lastTickTime = Date.now(); // Reset last tick time on load
    }

    // Save game state to LocalStorage
    function saveGame() {
        try {
            localStorage.setItem('socialMediaTycoonState', JSON.stringify(gameState));
            console.log('Game state saved.');
        } catch (e) {
            console.error('Error saving game state:', e);
            addLog('Ошибка сохранения игры.', 'error');
        }
    }

    // Add log entry
    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        gameState.log.unshift({ timestamp, message, type }); // Add to beginning
        if (gameState.log.length > 50) { // Limit log size
            gameState.log.pop();
        }
        // В будущем здесь можно будет обновлять модалку журнала, если она открыта
    }

    // Update UI elements
    function updateUI() {
        energyValueEl.textContent = Math.floor(gameState.energy); // Округляем для отображения
        moodValueEl.textContent = Math.floor(gameState.mood);
        channelNameEl.textContent = gameState.channel.name;
        subscribersValueEl.textContent = formatNumber(gameState.channel.subscribers);
        balanceValueEl.textContent = formatNumber(gameState.channel.balance);
        viewsValueEl.textContent = formatNumber(gameState.channel.views);

        // Обновление изменения подписчиков/просмотров
        updateTrendArrow(subscribersChangeEl, gameState.channel.subscribersChange, 'subscribers');
        updateTrendArrow(viewsChangeEl, gameState.channel.viewsChange, 'views');

        // Обновление персонажа
        updateCharacterSprite();

        // Обновление статуса производства поста
        if (gameState.postProduction.inProgress) {
            postProductionStatusEl.classList.remove('hidden');
            postInProductionTypeEl.textContent = gameState.postProduction.type;
            const progress = gameState.postProduction.progress;
            postProductionProgressFillEl.style.width = `${progress}%`;
            postProductionTimeLeftEl.textContent = Math.ceil(gameState.postProduction.timeLeft);
        } else {
            postProductionStatusEl.classList.add('hidden');
        }

        // Обновление доступности кнопок (пример)
        createPostBtn.disabled = gameState.postProduction.inProgress || gameState.energy < 10; // Пример
    }

    function updateTrendArrow(element, change, type) {
        if (change > 0) {
            element.innerHTML = `<i class="fas fa-arrow-up trend-arrow up"></i><span class="trend-change">+${formatNumber(change)}</span>`;
        } else if (change < 0) {
            element.innerHTML = `<i class="fas fa-arrow-down trend-arrow down"></i><span class="trend-change">${formatNumber(change)}</span>`;
        } else {
            element.innerHTML = `<span class="trend-change">0</span>`;
        }
    }

    // Управление спрайтом персонажа
    function updateCharacterSprite() {
        let imageUrl = '';
        switch (gameState.characterState) {
            case 'idle':
                imageUrl = 'assets/character_idle.png';
                break;
            case 'typing':
                imageUrl = 'assets/character_typing.png';
                break;
            case 'happy':
                imageUrl = 'assets/character_happy.png';
                break;
            case 'sleeping':
                imageUrl = 'assets/character_sleeping.png';
                break;
            default:
                imageUrl = 'assets/character_idle.png'; // Fallback
        }
        characterSpriteEl.src = imageUrl;

        // Manage animation classes (assuming these are defined in CSS)
        // Remove all state-related classes first
        characterSpriteEl.classList.forEach(cls => {
            if (cls.startsWith('char-state-') || cls.startsWith('char-anim-')) {
                characterSpriteEl.classList.remove(cls);
            }
        });
        // Add new state class
        characterSpriteEl.classList.add(`char-state-${gameState.characterState}`);

        // Add specific animation classes if needed for idle state
        if (gameState.characterState === 'idle') {
            characterSpriteEl.classList.add('char-anim-idle-blink');
        }
    }


    // --- Screen Management ---
    function showScreen(screenElementId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('visible');
            screen.style.zIndex = '1';
        });

        const targetScreen = document.getElementById(screenElementId);
        if (targetScreen) {
            targetScreen.classList.add('visible');
            targetScreen.style.zIndex = '2';
            gameState.currentScreen = screenElementId;
            // Управление кнопкой "Назад" Telegram WebApp
            if (screenElementId !== 'main-dashboard-screen' && screenElementId !== 'preloader-screen' && screenElementId !== 'theme-selection-screen') {
                tg.BackButton.show();
                tg.BackButton.onClick(goBackToDashboard);
            } else {
                tg.BackButton.hide();
                tg.BackButton.offClick(goBackToDashboard); // Удаляем обработчик, чтобы избежать утечек
            }
        }
        saveGame();
    }

    function goBackToDashboard() {
        showScreen('main-dashboard-screen');
        tg.HapticFeedback.impactOccurred('light');
    }

    // --- Modal Management ---
    function openModal(title, bodyHtml, actionsHtml = '', allowClose = true) {
        modalTitleEl.textContent = title;
        modalBodyEl.innerHTML = bodyHtml;
        modalActionsEl.innerHTML = actionsHtml;

        if (allowClose) {
            closeModalButtonEl.style.display = 'block';
            closeModalButtonEl.onclick = closeModal;
        } else {
            closeModalButtonEl.style.display = 'none'; // Скрыть кнопку закрытия
        }

        modalOverlayEl.classList.remove('hidden');
        modalOverlayEl.classList.add('visible');
        tg.HapticFeedback.impactOccurred('light');

        // Управление кнопкой "Назад" Telegram WebApp для модалок
        tg.BackButton.show(); // Показать кнопку "Назад" в Telegram WebApp
        tg.BackButton.onClick(closeModal); // При нажатии на "Назад" закрыть модалку
    }

    function closeModal() {
        modalOverlayEl.classList.remove('visible');
        modalOverlayEl.classList.add('hidden');
        tg.HapticFeedback.impactOccurred('light');

        // Восстановить поведение кнопки "Назад" в зависимости от текущего экрана
        if (gameState.currentScreen !== 'main-dashboard-screen' && gameState.currentScreen !== 'preloader-screen' && gameState.currentScreen !== 'theme-selection-screen') {
            tg.BackButton.onClick(goBackToDashboard);
        } else {
            tg.BackButton.hide();
        }
    }

    // --- Game Loop (Tick) ---
    let gameLoopInterval;
    let saveGameInterval;

    function gameTick() {
        const now = Date.now();
        const deltaTime = (now - gameState.lastTickTime) / 1000; // Delta time in seconds
        gameState.lastTickTime = now;

        // --- Core Mechanics (Placeholder) ---
        // 1. Energy Regeneration
        if (gameState.energy < gameState.maxEnergy) {
            gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + gameConfig.ENERGY_REGEN_RATE_PER_SEC * deltaTime);
        }

        // 2. Mood Decay
        if (gameState.mood > 0 && !gameState.postProduction.inProgress) {
            gameState.mood = Math.max(0, gameState.mood - gameConfig.MOOD_DECAY_RATE_PER_SEC * deltaTime);
        }

        // 3. Post Production Progress
        if (gameState.postProduction.inProgress) {
            gameState.postProduction.timeLeft -= deltaTime;
            gameState.postProduction.progress = (1 - gameState.postProduction.timeLeft / gameState.postProduction.duration) * 100;

            if (gameState.postProduction.timeLeft <= 0) {
                completePostProduction();
            }
        }

        // 4. Trend Management (placeholder)
        // checkAndActivateTrends(); // Функция для активации/смены трендов

        // 5. Passive Growth (placeholder)
        // Здесь должна быть более сложная логика роста подписчиков и просмотров
        // gameState.channel.subscribers += Math.floor(Math.random() * 5 * deltaTime);
        // gameState.channel.views += Math.floor(Math.random() * 20 * deltaTime);
        // gameState.channel.balance += Math.floor(Math.random() * 0.1 * deltaTime);


        // 6. Idea Refresh (placeholder)
        if ((now - gameState.lastIdeaRefreshTime) / 1000 >= gameConfig.IDEA_REFRESH_INTERVAL_SEC) {
            generateContentIdeas();
        }


        updateUI(); // Update UI at the end of each tick
    }

    function startMainGameLoop() {
        if (gameLoopInterval) clearInterval(gameLoopInterval);
        if (saveGameInterval) clearInterval(saveGameInterval);

        gameLoopInterval = setInterval(gameTick, gameConfig.TICK_INTERVAL_MS);
        saveGameInterval = setInterval(saveGame, gameConfig.SAVE_INTERVAL_MS);
        addLog('Игровой цикл запущен.', 'info');
    }


    // --- Content Creation Logic (Placeholder) ---
    function generateContentIdeas() {
        if (!gameState.channelTheme) {
            console.error('Тема канала не выбрана, невозможно сгенерировать идеи.');
            contentIdeasListEl.innerHTML = '<p class="placeholder-text">Выберите тему канала, чтобы появились идеи.</p>';
            return;
        }

        // Фильтруем идеи по теме и уровню качества
        const relevantIdeas = allContentIdeas.filter(
            idea => idea.theme === gameState.channelTheme && idea.minQuality <= gameState.contentQuality
        );

        gameState.availableContentIdeas = [];
        // Добавляем до 3 случайных идей из релевантных
        const numIdeasToShow = Math.min(relevantIdeas.length, 3);
        for(let i = 0; i < numIdeasToShow; i++) {
            const randomIndex = Math.floor(Math.random() * relevantIdeas.length);
            const idea = relevantIdeas.splice(randomIndex, 1)[0]; // Удаляем, чтобы не повторялись
            gameState.availableContentIdeas.push(idea);
        }

        if (gameState.availableContentIdeas.length === 0 && allContentIdeas.length > 0) {
            // Если идей не осталось, но база не пуста, возможно, все идеи уже показаны или не соответствуют теме/качеству
            contentIdeasListEl.innerHTML = '<p class="placeholder-text">Пока нет новых идей, соответствующих вашей теме и уровню. Попробуйте сгенерировать через ИИ!</p>';
        } else if (allContentIdeas.length === 0) {
             contentIdeasListEl.innerHTML = '<p class="placeholder-text">Нет доступных идей контента в базе данных.</p>';
        }


        gameState.lastIdeaRefreshTime = Date.now();
        displayContentIdeas();
    }

    function displayContentIdeas() {
        contentIdeasListEl.innerHTML = '';
        if (gameState.availableContentIdeas.length === 0) {
            contentIdeasListEl.innerHTML = '<p class="placeholder-text">Пока нет новых идей. Попробуйте сгенерировать через ИИ!</p>';
            return;
        }

        gameState.availableContentIdeas.forEach(idea => {
            const button = document.createElement('button');
            button.className = 'btn content-idea-button';
            button.dataset.ideaId = idea.id;
            button.innerHTML = `
                <span class="idea-icon">${idea.icon || '📝'}</span>
                <div class="idea-details">
                    <h3>${idea.name}</h3>
                    <p>${idea.description}</p>
                    <span class="idea-cost">⚡ ${idea.energyCost} энергии</span>
                    <span class="idea-duration">⏱️ ${idea.duration} сек</span>
                </div>
            `;
            button.onclick = () => startPostProduction(idea);
            button.disabled = gameState.energy < idea.energyCost || gameState.postProduction.inProgress;
            contentIdeasListEl.appendChild(button);
        });
    }

    function startPostProduction(idea) {
        if (gameState.energy < idea.energyCost) {
            openModal('Недостаточно Энергии', '<p>У вас недостаточно энергии для создания этого поста.</p>', '<button class="btn" onclick="closeModal()">ОК</button>');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        if (gameState.postProduction.inProgress) {
            openModal('Внимание', '<p>Вы уже создаете другой пост. Дождитесь завершения!</p>', '<button class="btn" onclick="closeModal()">ОК</button>');
            tg.HapticFeedback.notificationOccurred('warning');
            return;
        }

        gameState.energy -= idea.energyCost;
        gameState.postProduction.inProgress = true;
        gameState.postProduction.type = idea.name;
        gameState.postProduction.duration = idea.duration; // В реальной игре будет зависеть от апгрейдов/команды
        gameState.postProduction.timeLeft = idea.duration;
        gameState.postProduction.progress = 0;
        
        // Устанавливаем персонажа в состояние "печатает"
        gameState.characterState = 'typing'; 
        updateCharacterSprite(); 

        addLog(`Начато создание контента: "${idea.name}".`, 'info');
        tg.HapticFeedback.notificationOccurred('success');
        updateUI();
        showScreen('main-dashboard-screen'); // Возвращаемся на дашборд
    }

    function completePostProduction() {
        const postIdea = allContentIdeas.find(idea => idea.name === gameState.postProduction.type);
        if (!postIdea) {
            console.error('Completed post idea not found:', gameState.postProduction.type);
            addLog('Ошибка при завершении поста: идея не найдена.', 'error');
            resetPostProduction();
            return;
        }

        // Пример расчета результатов (нужно расширить реальной механикой)
        let subsGained = postIdea.baseSubs * gameState.contentQuality;
        let viewsGained = postIdea.baseViews * gameState.contentQuality;
        let balanceGained = postIdea.baseBalance * gameState.contentQuality;

        // Влияние настроения, трендов, репутации, команды и т.д.
        subsGained *= (gameState.mood / 100);
        viewsGained *= (gameState.mood / 100);
        balanceGained *= (gameState.mood / 100);

        gameState.channel.subscribers += Math.round(subsGained);
        gameState.channel.views += Math.round(viewsGained);
        gameState.channel.balance += Math.round(balanceGained);
        gameState.channel.subscribersChange = Math.round(subsGained); // Пример изменения за "период"
        gameState.channel.viewsChange = Math.round(viewsGained);


        gameState.mood = Math.min(gameState.maxMood, gameState.mood + 10); // Повышаем настроение аудитории

        addLog(`Пост "${postIdea.name}" завершен! +${formatNumber(Math.round(subsGained))} подписчиков, +$${formatNumber(Math.round(balanceGained))}`, 'success');
        tg.HapticFeedback.notificationOccurred('success');

        resetPostProduction();
        generateContentIdeas(); // Генерируем новые идеи
        updateUI();

        openModal(
            'Контент Готов!',
            `<p>Вы выпустили "${postIdea.name}"!</p>
            <p>+${formatNumber(Math.round(subsGained))} подписчиков</p>
            <p>+${formatNumber(Math.round(viewsGained))} просмотров</p>
            <p>+${formatNumber(Math.round(balanceGained))} ₽ дохода</p>`,
            `<button class="btn" onclick="closeModal()">Отлично!</button>`
        );
    }

    function resetPostProduction() {
        gameState.postProduction.inProgress = false;
        gameState.postProduction.type = '';
        gameState.postProduction.duration = 0;
        gameState.postProduction.timeLeft = 0;
        gameState.postProduction.progress = 0;
        characterSpriteEl.classList.remove('char-state-typing'); // Сброс анимации
        gameState.characterState = 'idle'; // Возвращаем в idle
        updateCharacterSprite(); // Обновляем спрайт
    }

    // --- Handlers for main action buttons ---
    function handleCreatePostClick() {
        showScreen('create-content-screen');
        generateContentIdeas(); // Генерируем идеи при открытии
        tg.HapticFeedback.impactOccurred('light');
    }

    function handleAnalyticsClick() {
        showScreen('analytics-screen');
        tg.HapticFeedback.impactOccurred('light');
    }

    function handleTeamClick() {
        showScreen('team-screen');
        tg.HapticFeedback.impactOccurred('light');
    }

    function handleMonetizationClick() {
        showScreen('monetization-screen');
        tg.HapticFeedback.impactOccurred('light');
    }

    function handleGenerateIdeaClick() {
        // В будущем здесь можно будет использовать LLM для генерации идей
        openModal(
            'Генерация Идей ИИ',
            '<p>ИИ анализирует последние тренды... (Эта функция пока в разработке)</p>',
            '<button class="btn" onclick="closeModal()">ОК</button>'
        );
        tg.HapticFeedback.impactOccurred('medium');
    }

    function handleContentTypeClick(event) {
        contentTypeBtns.forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        // В будущем здесь можно будет фильтровать идеи по типу контента
        tg.HapticFeedback.impactOccurred('light');
    }


    // --- Theme Selection Logic ---
    let selectedThemeCard = null;
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            if (selectedThemeCard) {
                selectedThemeCard.classList.remove('selected');
            }
            card.classList.add('selected');
            selectedThemeCard = card;
            gameState.channelTheme = card.dataset.theme;
            selectThemeButton.disabled = false;
            tg.HapticFeedback.impactOccurred('light');
        });
    });

    selectThemeButton.addEventListener('click', () => {
        if (gameState.channelTheme) {
            // Устанавливаем имя канала по умолчанию на основе темы
            gameState.channel.name = themesData[gameState.channelTheme].name.toUpperCase();
            addLog(`Выбрана тема канала: "${themesData[gameState.channelTheme].name}".`, 'info');
            // В реальной игре будет приветственный экран/катсцена
            showScreen('main-dashboard-screen');
            startMainGameLoop();
            generateContentIdeas(); // Генерируем идеи после выбора темы
            tg.HapticFeedback.notificationOccurred('success');
            // Обновляем данные пользователя из Telegram (если доступны)
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                gameState.userName = tg.initDataUnsafe.user.first_name || tg.initDataUnsafe.user.username || 'Игрок';
                // userPhotoEl.src = tg.initDataUnsafe.user.photo_url || 'placeholder-avatar.png'; // если есть аватар
            }
        }
    });


    // --- Event Listeners ---
    createPostBtn.addEventListener('click', handleCreatePostClick);
    analyticsBtn.addEventListener('click', handleAnalyticsClick);
    teamBtn.addEventListener('click', handleTeamClick);
    monetizationBtn.addEventListener('click', handleMonetizationClick);
    generateIdeaBtn.addEventListener('click', handleGenerateIdeaClick);

    contentTypeBtns.forEach(btn => {
        btn.addEventListener('click', handleContentTypeClick);
    });

    closeModalButtonEl.addEventListener('click', closeModal);
    modalOverlayEl.addEventListener('click', (e) => {
        if (e.target === modalOverlayEl && modalOverlayEl.classList.contains('visible')) { // Закрыть модальное окно, если клик по оверлею
            closeModal();
        }
    });

    // --- Utility Functions ---
    function formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }

    // --- Initialization ---
    function initializeApp() {
        loadGame(); // Try to load saved game
        updateUI(); // Initial UI update

        // Preloader animation
        let preloaderProgress = 0;
        const preloaderDuration = 1500; // Total duration for preloader animation
        const intervalTime = 50; // Update every 50ms
        const increment = (100 / (preloaderDuration / intervalTime));

        const preloaderInterval = setInterval(() => {
            preloaderProgress += increment;
            if (preloaderProgress >= 100) {
                preloaderProgress = 100;
                clearInterval(preloaderInterval);
                preloaderProgressBarFill.style.width = '100%';

                setTimeout(() => {
                    preloaderScreen.classList.add('hidden');
                    // Decide which screen to show after preloader
                    if (!gameState.channelTheme) { // If theme not selected, go to theme selection
                        showScreen('theme-selection-screen');
                    } else { // Otherwise, go to dashboard
                        showScreen('main-dashboard-screen');
                        startMainGameLoop();
                        generateContentIdeas(); // Генерируем идеи, если уже на дашборде
                    }
                }, 300); // Small delay to allow fade out
            }
            preloaderProgressBarFill.style.width = `${preloaderProgress}%`;
        }, intervalTime);
    }

    initializeApp();

    // --- App Lifecycle Events (for Telegram Web App) ---
    tg.onEvent('mainButtonClicked', () => {
        saveGame();
        // Можно добавить логику для закрытия WebApp, если Main Button используется для этого
        // tg.close();
    });

    // Handle page visibility for pausing/resuming game
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(gameLoopInterval);
            clearInterval(saveGameInterval);
            saveGame(); // Save before pausing
            addLog('Игра приостановлена.', 'info');
        } else {
            loadGame(); // Load last state
            if (gameState.currentScreen === 'main-dashboard-screen') {
                startMainGameLoop();
            }
            addLog('Игра возобновлена.', 'info');
        }
    });

    window.addEventListener('beforeunload', () => {
        saveGame();
    });

});
