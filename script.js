document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Script execution started.');

    // === Заглушка Telegram WebApp API для отладки ===
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
                    photo_url: 'placeholder-avatar.png' // Используем placeholder
                }
            },
            HapticFeedback: {
                notificationOccurred: (type) => console.log(`HapticFeedback: ${type} (заглушка)`),
                impactOccurred: (type) => console.log(`HapticFeedback: ${type} (заглушка)`)
            },
            BackButton: {
                show: () => console.log('BackButton show (заглушка)'),
                onClick: (callback) => console.log('BackButton onClick (заглушка)')
            },
            close: () => console.log('Telegram.WebApp.close() (заглушка)')
        };
        // Присваиваем заглушку глобально, чтобы другой код мог ее использовать
        window.Telegram = { WebApp: tg };
    } else {
        tg = window.Telegram.WebApp;
        console.log('Telegram WebApp API detected.');
    }

    // === Элементы DOM ===
    // Экраны
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container');

    // Кнопки
    const startGameButton = document.getElementById('start-game-button');
    const selectThemeButton = document.getElementById('select-theme-button');
    const continueToStudioButton = document.getElementById('continue-to-studio-button');
    const createPostButton = document.getElementById('create-post-button');
    const upgradesButton = document.getElementById('upgrades-button');
    const logButton = document.getElementById('log-button');

    // Модальные окна и их кнопки
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button');

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');

    // Элементы UI
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
    const energyCountEl = document.getElementById('energy-count');

    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');

    const postProductionStatus = document.getElementById('post-production-status');
    const postTypeInProduction = document.getElementById('post-type-in-production');
    const postProductionProgressFill = document.getElementById('post-production-progress-fill');
    const postProductionTimeRemaining = document.getElementById('post-production-time-remaining');

    const eventLogList = document.getElementById('event-log');

    // === Переменные состояния игры ===
    const initialGameState = {
        subscribers: 0,
        balance: 0,
        audienceMood: 100,
        energy: 100,
        selectedTheme: null,
        gameStarted: false,
        lastActiveTime: Date.now(),
        postInProduction: null,
        contentQualityLevel: 1,
        log: [],
        gameVersion: '0.8.0' // Добавляем версию для более контролируемых обновлений
    };

    let gameState = { ...initialGameState }; // Используем spread для копирования начального состояния

    const gameSettings = {
        preloaderDuration: 3000,
        cutsceneSlideDuration: 2500,
        energyRestoreRate: 1000 * 60 * 5, // 5 минут на 1 единицу энергии
        energyRestoreAmount: 1,
        maxEnergy: 100,
        basePostProductionTime: {
            text: 5,
            meme: 8,
            video: 15
        },
        basePostEarnings: {
            text: 5,
            meme: 10,
            video: 25
        },
        basePostSubscribers: {
            text: 2,
            meme: 5,
            video: 10
        },
        audienceMoodImpact: {
            text: -5,
            meme: -8,
            video: -12,
            successfulPost: 10,
            failedPost: -15
        },
        upgradeCosts: {
            contentQuality: 50
        },
        upgradeBenefits: {
            contentQuality: {
                subscriberMultiplier: 1.15,
                earningsMultiplier: 1.1,
                moodBonus: 5
            }
        },
        trends: [
            { name: "Вирусные Челленджи", bonus: { subscribers: 1.5, earnings: 1.2 }, type: ['meme', 'video'] },
            { name: "Глубокие Обзоры", bonus: { subscribers: 1.3, earnings: 1.4 }, type: ['video', 'text'] },
            { name: "Быстрые Новости", bonus: { subscribers: 1.2, earnings: 1.1 }, type: ['text', 'meme'] }
        ]
    };
    let currentTrend = null;
    let trendInterval;


    // === Функции управления UI ===

    function showScreen(screenElement) {
        console.log(`Attempting to show screen: ${screenElement ? screenElement.id : 'null'}`);
        // Скрываем все экраны
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer].forEach(screen => {
            if (screen) {
                screen.classList.remove('visible');
                screen.style.display = 'none';
            }
        });
        // Показываем нужный
        if (screenElement) {
            screenElement.style.display = 'flex';
            setTimeout(() => screenElement.classList.add('visible'), 10);
            console.log(`Screen '${screenElement.id}' set to visible.`);
        } else {
            console.error('showScreen received a null element to display.');
        }
    }

    function updateProgressBar(element, progress) {
        if (element) {
            element.style.width = `${progress}%`;
        }
    }

    function updateUI() {
        if (subscribersCountEl) subscribersCountEl.textContent = formatNumber(gameState.subscribers);
        if (balanceCountEl) balanceCountEl.textContent = formatNumber(gameState.balance);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = getMoodText(gameState.audienceMood);
        if (energyCountEl) energyCountEl.textContent = gameState.energy;

        // Обновление состояния кнопки улучшения
        const upgradeCost = gameSettings.upgradeCosts.contentQuality;
        if (upgradeContentQualityButton) {
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${upgradeCost})`;
            upgradeContentQualityButton.disabled = gameState.balance < upgradeCost;
        }

        // Обновление отображения тренда
        if (currentTrend && studioContainer.classList.contains('visible')) {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = currentTrend.name;
        } else {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
        }

        updateCharacterState();
    }

    function getMoodText(mood) {
        if (mood >= 90) return 'Отличное';
        if (mood >= 70) return 'Хорошее';
        if (mood >= 40) return 'Нормальное';
        if (mood >= 20) return 'Низкое';
        return 'Критическое';
    }

    function updateCharacterState(state = 'idle', duration = 0) {
        if (!characterEl) {
            console.warn('Character element not found for state update.');
            return;
        }
        if (characterStateTimeout) {
            clearTimeout(characterStateTimeout);
        }

        characterEl.classList.remove('char-state-idle', 'char-state-happy', 'char-state-typing', 'char-state-sleeping', 'char-anim-idle-blink');

        switch (state) {
            case 'idle':
                characterEl.classList.add('char-state-idle', 'char-anim-idle-blink');
                break;
            case 'happy':
                characterEl.classList.add('char-state-happy');
                if (duration === 0) {
                    characterStateTimeout = setTimeout(() => updateCharacterState('idle'), 2000);
                }
                break;
            case 'typing':
                characterEl.classList.add('char-state-typing');
                if (duration > 0) {
                    characterStateTimeout = setTimeout(() => updateCharacterState('idle'), duration * 1000);
                }
                break;
            case 'sleeping':
                characterEl.classList.add('char-state-sleeping');
                break;
            default:
                characterEl.classList.add('char-state-idle', 'char-anim-idle-blink');
                break;
        }
    }

    function addLogEntry(message, type = 'info') {
        if (!eventLogList) {
            console.warn('Event log list element not found, cannot add log entry:', message);
            return;
        }
        const li = document.createElement('li');
        li.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        li.classList.add(`log-${type}`);
        eventLogList.prepend(li);
        gameState.log.push({ message, type, timestamp: Date.now() });
        if (gameState.log.length > 50) {
            gameState.log.shift();
            if (eventLogList.children.length > 50) {
                eventLogList.removeChild(eventLogList.lastChild);
            }
        }
        saveGameState();
    }


    // === Игровые механики ===

    function generateRandomTrend() {
        const randomIndex = Math.floor(Math.random() * gameSettings.trends.length);
        currentTrend = gameSettings.trends[randomIndex];
        addLogEntry(`Новый тренд: "${currentTrend.name}"!`, 'info');
        updateUI();
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    }

    function startTrendCycle() {
        console.log('Starting trend cycle.');
        if (trendInterval) {
            clearInterval(trendInterval);
        }
        generateRandomTrend();
        const trendChangeTime = (Math.random() * 2 + 1) * 60 * 1000;
        trendInterval = setInterval(generateRandomTrend, trendChangeTime);
    }


    function restoreEnergy() {
        if (gameState.energy < gameSettings.maxEnergy) {
            gameState.energy = Math.min(gameSettings.maxEnergy, gameState.energy + gameSettings.energyRestoreAmount);
            updateUI();
            // console.log(`Energy restored to: ${gameState.energy}`); // Для дебага
        }
    }

    function startEnergyRestoreCycle() {
        console.log('Starting energy restore cycle.');
        setInterval(restoreEnergy, gameSettings.energyRestoreRate);
    }

    function calculateOfflineProgress() {
        console.log('Calculating offline progress...');
        const now = Date.now();
        const timeOffline = now - (gameState.lastActiveTime || now); // Если lastActiveTime нет, используем now
        if (timeOffline > 0) {
            const energyRestored = Math.floor(timeOffline / gameSettings.energyRestoreRate) * gameSettings.energyRestoreAmount;
            gameState.energy = Math.min(gameSettings.maxEnergy, gameState.energy + energyRestored);
            if (energyRestored > 0) {
                addLogEntry(`Восстановлено ${energyRestored} энергии пока вы отсутствовали.`, 'info');
            }
        }
        gameState.lastActiveTime = now;
        saveGameState();
    }


    function createPost(type) {
        console.log(`Attempting to create post of type: ${type}`);
        if (gameState.postInProduction) {
            addLogEntry('Нельзя создать новый пост, пока предыдущий в производстве!', 'warning');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
            return;
        }
        if (gameState.energy < 10) {
            addLogEntry('Недостаточно энергии для создания поста!', 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        const baseDuration = gameSettings.basePostProductionTime[type];
        const productionDuration = baseDuration;

        gameState.energy -= 10;
        updateUI();
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

        gameState.postInProduction = {
            type: type,
            duration: productionDuration,
            timeLeft: productionDuration,
            timer: null
        };
        saveGameState();

        if (postTypeInProduction) postTypeInProduction.textContent = getPostTypeName(type);
        if (postProductionStatus) postProductionStatus.style.display = 'block';
        if (createPostButton) createPostButton.disabled = true;
        updateCharacterState('typing', productionDuration);

        const startTime = Date.now();
        gameState.postInProduction.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            gameState.postInProduction.timeLeft = productionDuration - elapsed;

            if (gameState.postInProduction.timeLeft <= 0) {
                clearInterval(gameState.postInProduction.timer);
                completePost(type);
            } else {
                if (postProductionTimeRemaining) postProductionTimeRemaining.textContent = gameState.postInProduction.timeLeft;
                const progress = ((productionDuration - gameState.postInProduction.timeLeft) / productionDuration) * 100;
                if (postProductionProgressFill) updateProgressBar(postProductionProgressFill, progress);
            }
        }, 1000);

        addLogEntry(`Начато создание "${getPostTypeName(type)}".`, 'info');
        if (createPostModal) hideModal(createPostModal);
    }

    function completePost(type) {
        console.log(`Completing post of type: ${type}`);
        const baseSubscribers = gameSettings.basePostSubscribers[type];
        const baseEarnings = gameSettings.basePostEarnings[type];
        let moodImpact = gameSettings.audienceMoodImpact[type];

        let gainedSubscribers = baseSubscribers;
        let gainedEarnings = baseEarnings;

        if (gameState.contentQualityLevel > 1) {
            gainedSubscribers *= gameSettings.upgradeBenefits.contentQuality.subscriberMultiplier;
            gainedEarnings *= gameSettings.upgradeBenefits.contentQuality.earningsMultiplier;
            moodImpact += gameSettings.upgradeBenefits.contentQuality.moodBonus;
        }

        if (currentTrend && currentTrend.type.includes(type)) {
            gainedSubscribers *= currentTrend.bonus.subscribers;
            gainedEarnings *= currentTrend.bonus.earnings;
            addLogEntry(`Пост в тренде "${currentTrend.name}"! Получены бонусы.`, 'success');
        }

        gainedSubscribers = Math.round(gainedSubscribers);
        gainedEarnings = Math.round(gainedEarnings);

        gameState.subscribers += gainedSubscribers;
        gameState.balance += gainedEarnings;
        gameState.audienceMood = Math.max(0, Math.min(100, gameState.audienceMood + moodImpact + gameSettings.audienceMoodImpact.successfulPost));

        addLogEntry(`Пост "${getPostTypeName(type)}" завершен! +${gainedSubscribers} подписчиков, +$${gainedEarnings}.`, 'success');
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        gameState.postInProduction = null;
        if (postProductionStatus) postProductionStatus.style.display = 'none';
        if (createPostButton) createPostButton.disabled = false;
        updateCharacterState('happy');

        saveGameState();
        updateUI();
    }

    function getPostTypeName(type) {
        switch (type) {
            case 'text': return 'Текстового поста';
            case 'meme': return 'Мема';
            case 'video': return 'Видеоролика';
            default: return 'неизвестного поста';
        }
    }


    function upgradeContentQuality() {
        console.log('Attempting to upgrade content quality.');
        const cost = gameSettings.upgradeCosts.contentQuality;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.contentQualityLevel++;
            gameSettings.upgradeCosts.contentQuality = Math.round(cost * 1.5);
            addLogEntry(`Качество контента улучшено до уровня ${gameState.contentQualityLevel}!`, 'success');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            saveGameState();
            updateUI();
        } else {
            addLogEntry('Недостаточно средств для улучшения качества контента.', 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        }
    }

    // === Утилиты ===
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num;
    }

    // === Функции сохранения/загрузки ===
    function saveGameState() {
        try {
            const stateToSave = JSON.stringify(gameState);
            localStorage.setItem('channelControlGameState', stateToSave);
            console.log('Game state saved successfully.');
        } catch (e) {
            console.error('Error saving game state to Local Storage:', e);
            addLogEntry('Ошибка сохранения игры. Возможно, хранилище заполнено.', 'error');
        }
    }

    function loadGameState() {
        console.log('Attempting to load game state...');
        try {
            const savedState = localStorage.getItem('channelControlGameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);

                // **ВНИМАНИЕ: ЛОГИКА МИГРАЦИИ И СОХРАНЕНИЯ ЦЕЛОСТНОСТИ СОСТОЯНИЯ**
                // Проходимся по initialGameState, чтобы убедиться, что все ожидаемые поля есть
                // и добавляем их, если они отсутствуют в загруженном состоянии.
                // Это также поможет при обновлении версии игры.
                gameState = { ...initialGameState, ...parsedState };

                // Обновляем версию игры, если она не соответствует текущей
                if (parsedState.gameVersion !== initialGameState.gameVersion) {
                    console.log(`Game version mismatch. Loaded: ${parsedState.gameVersion}, Current: ${initialGameState.gameVersion}. Applying migration logic if any.`);
                    // Здесь можно добавить логику миграции данных между версиями, если потребуется
                    // Например: if (parsedState.gameVersion === '0.7.0') { gameState.newField = defaultValue; }
                    gameState.gameVersion = initialGameState.gameVersion; // Обновляем версию до текущей
                    saveGameState(); // Сохраняем обновленное состояние
                }

                // Если есть пост в производстве, восстанавливаем его таймер
                if (gameState.postInProduction && gameState.postInProduction.timeLeft > 0) {
                    const timePassedSinceLastSave = (Date.now() - (gameState.lastActiveTime || Date.now())) / 1000;
                    gameState.postInProduction.timeLeft = Math.max(0, gameState.postInProduction.timeLeft - timePassedSinceLastSave);
                    console.log(`Post in production found. Time left: ${gameState.postInProduction.timeLeft}s`);
                    if (gameState.postInProduction.timeLeft <= 0) {
                        console.log('Post completed offline.');
                        completePost(gameState.postInProduction.type);
                    } else {
                        startPostProductionTimer(gameState.postInProduction.type, gameState.postInProduction.timeLeft);
                    }
                }
                addLogEntry('Состояние игры загружено.', 'info');
                console.log('Game state loaded:', gameState);
            } else {
                console.log('No saved game state found. Starting new game.');
                addLogEntry('Начинаем новую игру (сохраненных данных нет).', 'info');
                gameState = { ...initialGameState }; // Сбрасываем к начальному
            }
        } catch (e) {
            console.error('Error loading or parsing game state from Local Storage:', e);
            addLogEntry('Ошибка загрузки игры. Начинаем новую игру.', 'error');
            localStorage.removeItem('channelControlGameState'); // Удаляем поврежденные данные
            gameState = { ...initialGameState }; // Сбрасываем к начальному
        }
    }

    function startPostProductionTimer(type, timeLeft) {
        if (!gameState.postInProduction) {
            gameState.postInProduction = {}; // Инициализируем, если по какой-то причине null
        }
        gameState.postInProduction.type = type;
        gameState.postInProduction.timeLeft = timeLeft;
        gameState.postInProduction.duration = timeLeft;
        if (postTypeInProduction) postTypeInProduction.textContent = getPostTypeName(type);
        if (postProductionStatus) postProductionStatus.style.display = 'block';
        if (createPostButton) createPostButton.disabled = true;
        updateCharacterState('typing', timeLeft);

        const startTime = Date.now() - (gameState.postInProduction.duration - gameState.postInProduction.timeLeft) * 1000;
        gameState.postInProduction.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            gameState.postInProduction.timeLeft = Math.max(0, gameState.postInProduction.duration - elapsed);

            if (gameState.postInProduction.timeLeft <= 0) {
                clearInterval(gameState.postInProduction.timer);
                completePost(type);
            } else {
                if (postProductionTimeRemaining) postProductionTimeRemaining.textContent = gameState.postInProduction.timeLeft;
                const progress = ((gameState.postInProduction.duration - gameState.postInProduction.timeLeft) / gameState.postInProduction.duration) * 100;
                if (postProductionProgressFill) updateProgressBar(postProductionProgressFill, progress);
            }
        }, 1000);
    }

    // === Управление модальными окнами ===
    function showModal(modalElement) {
        if (!modalElement) {
            console.error('showModal received a null element.');
            return;
        }
        modalElement.style.display = 'flex';
        setTimeout(() => modalElement.classList.add('visible'), 10);
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    }

    function hideModal(modalElement) {
        if (!modalElement) {
            console.error('hideModal received a null element.');
            return;
        }
        modalElement.classList.remove('visible');
        setTimeout(() => modalElement.style.display = 'none', 300);
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }


    // === Инициализация игры ===
    function initGame() {
        console.log('initGame started.');
        if (tg) {
            if (typeof tg.ready === 'function') tg.ready();
            if (typeof tg.expand === 'function') tg.expand();
            if (tg.BackButton && typeof tg.BackButton.show === 'function') tg.BackButton.show();

            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const user = tg.initDataUnsafe.user;
                if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = user.username || user.first_name || 'Дорогой Игрок';
                if (user.photo_url && userPhotoEl) {
                    userPhotoEl.src = user.photo_url;
                } else if (userPhotoEl) {
                    userPhotoEl.src = 'placeholder-avatar.png';
                }
            } else {
                console.warn('Telegram user data not available or incomplete in initDataUnsafe.');
                if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = 'Дорогой Игрок';
                if (userPhotoEl) userPhotoEl.src = 'placeholder-avatar.png';
            }
        } else {
            console.warn('Telegram WebApp object is not available.');
        }


        if (gameVersionEl) {
            gameVersionEl.textContent = `v${gameState.gameVersion}`;
        }

        loadGameState(); // Попытка загрузить состояние игры

        if (!gameState.gameStarted) {
            console.log('Game not started yet. Showing theme selection screen.');
            showScreen(themeSelectionScreen);
        } else {
            console.log('Game already started. Showing studio container.');
            showScreen(studioContainer);
            updateUI();
            startTrendCycle();
            startEnergyRestoreCycle();
            calculateOfflineProgress();
        }
        console.log('initGame finished.');
    }

    // === Обработчики событий ===

    // Обработчик для прелоадера
    const preloaderFill = document.querySelector('.preloader-progress-bar-fill');
    if (preloaderFill && preloader) {
        console.log('Preloader elements found. Starting preloader animation.');
        setTimeout(() => {
            updateProgressBar(preloaderFill, 100);
        }, 100);
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Убедимся, что preloader полностью скрыт перед инициализацией
            preloader.addEventListener('transitionend', () => {
                initGame();
            }, { once: true }); // Запускаем initGame только один раз после завершения анимации
        }, gameSettings.preloaderDuration);
    } else {
        console.warn('Preloader elements not found or preloader is null. Initializing game immediately.');
        initGame();
    }


    // Выбор темы
    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                themeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                gameState.selectedTheme = card.dataset.theme;
                if (selectThemeButton) selectThemeButton.disabled = false;
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            });
        });

        if (selectThemeButton) {
            selectThemeButton.addEventListener('click', () => {
                if (gameState.selectedTheme) {
                    addLogEntry(`Выбрана тема: ${gameState.selectedTheme}.`, 'info');
                    showScreen(welcomeScreen);
                    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                }
            });
        }
    }

    // Начало игры после экрана приветствия
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            gameState.gameStarted = true;
            saveGameState();
            showScreen(cutsceneScreen);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            startCutscene();
        });
    }

    // Управление катсценой
    function startCutscene() {
        console.log('Starting cutscene...');
        if (cutsceneSlides.length === 0) {
            console.warn('Cutscene slides not found, skipping cutscene.');
            showScreen(studioContainer);
            updateUI();
            startTrendCycle();
            startEnergyRestoreCycle();
            return;
        }

        currentSlideIndex = 0;
        showCutsceneSlide(currentSlideIndex);

        const cutsceneTimer = setInterval(() => {
            currentSlideIndex++;
            if (currentSlideIndex < cutsceneSlides.length - 1) {
                showCutsceneSlide(currentSlideIndex);
            } else {
                clearInterval(cutsceneTimer);
            }
        }, gameSettings.cutsceneSlideDuration);
    }

    function showCutsceneSlide(index) {
        cutsceneSlides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
    }

    // Переход в студию из катсцены
    if (continueToStudioButton) {
        continueToStudioButton.addEventListener('click', () => {
            showScreen(studioContainer);
            updateUI();
            startTrendCycle();
            startEnergyRestoreCycle();
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        });
    }

    // Открытие модалок
    if (createPostButton) {
        createPostButton.addEventListener('click', () => showModal(createPostModal));
    }
    if (upgradesButton) {
        upgradesButton.addEventListener('click', () => showModal(upgradesModal));
    }
    if (logButton) {
        logButton.addEventListener('click', () => showModal(logModal));
    }

    // Закрытие модалок
    closeModalButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.dataset.modalId;
            const modalToClose = document.getElementById(modalId);
            if (modalToClose) {
                hideModal(modalToClose);
            }
        });
    });

    // Действия по созданию поста
    if (postTextButton) {
        postTextButton.addEventListener('click', () => createPost('text'));
    }
    if (postMemeButton) {
        postMemeButton.addEventListener('click', () => createPost('meme'));
    }
    if (postVideoButton) {
        postVideoButton.addEventListener('click', () => createPost('video'));
    }

    // Действие по улучшению качества контента
    if (upgradeContentQualityButton) {
        upgradeContentQualityButton.addEventListener('click', upgradeContentQuality);
    }

    // Привязываем функцию к кнопке "Назад" Telegram Web App
    if (tg.BackButton && typeof tg.BackButton.onClick === 'function') {
        tg.BackButton.onClick(() => {
            console.log('Telegram BackButton clicked.');
            if (createPostModal && createPostModal.classList.contains('visible')) {
                hideModal(createPostModal);
            } else if (upgradesModal && upgradesModal.classList.contains('visible')) {
                hideModal(upgradesModal);
            } else if (logModal && logModal.classList.contains('visible')) {
                hideModal(logModal);
            }
            else if (welcomeScreen && welcomeScreen.classList.contains('visible')) {
                showScreen(themeSelectionScreen);
            }
            else if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) {
                if (currentSlideIndex > 0) {
                    currentSlideIndex--;
                    showCutsceneSlide(currentSlideIndex);
                } else {
                    showScreen(welcomeScreen);
                }
            }
            else if (studioContainer && studioContainer.classList.contains('visible')) {
                 console.log('Пользователь нажал "Назад" в студии. Ничего не происходит.');
                 if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            }
        });
    } else {
        console.warn('Telegram BackButton API not fully available or onClick not a function.');
    }


    // Сохраняем состояние при закрытии или перезагрузке
    window.addEventListener('beforeunload', saveGameState);
});
