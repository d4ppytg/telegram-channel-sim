document.addEventListener('DOMContentLoaded', () => {
    // === Заглушка Telegram WebApp API для отладки ===
    if (typeof window.Telegram === 'undefined' || typeof window.Telegram.WebApp === 'undefined') {
        console.warn('Telegram WebApp API не загружен или недоступен. Запуск в режиме отладки с заглушкой.');
        window.Telegram = {
            WebApp: {
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
            }
        };
    }
    const tg = window.Telegram.WebApp;

    // === Элементы DOM ===
    // Экраны
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cutsceneScreen = document.getElementById('cutscene-screen');
    const studioContainer = document.querySelector('.studio-container'); // Используем querySelector для класса

    // Кнопки
    const startGameButton = document.getElementById('start-game-button');
    const selectThemeButton = document.getElementById('select-theme-button'); // Кнопка для выбора темы
    const continueToStudioButton = document.getElementById('continue-to-studio-button'); // Кнопка после катсцены
    const createPostButton = document.getElementById('create-post-button');
    const upgradesButton = document.getElementById('upgrades-button');
    const logButton = document.getElementById('log-button');

    // Модальные окна и их кнопки
    const createPostModal = document.getElementById('create-post-modal');
    const upgradesModal = document.getElementById('upgrades-modal');
    const logModal = document.getElementById('log-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal-button'); // Все кнопки закрытия модалок

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

    const currentTrendDisplayMonitor = document.getElementById('current-trend-display-monitor');
    const trendDescriptionMonitorEl = document.getElementById('trend-description-monitor');
    const eventLogUl = document.getElementById('event-log');

    // Новые элементы для энергии и производства поста
    const energyCountEl = document.getElementById('energy-count');
    const postProductionStatusEl = document.getElementById('post-production-status');
    const postTypeInProductionEl = document.getElementById('post-type-in-production');
    const postProductionProgressFillEl = document.getElementById('post-production-progress-fill');
    const postProductionTimeRemainingEl = document.getElementById('post-production-time-remaining');


    // === Игровое состояние ===
    let gameState = {};
    const defaultGameState = {
        subscribers: 0,
        balance: 0,
        audienceMood: 50, // 0-100, 50 - нормальное
        lastTick: Date.now(),
        channelName: "Мой Канал",
        selectedTheme: null,
        contentQuality: 1, // Базовое качество контента
        currentTrend: null,
        trendExpirationTime: 0,
        eventLog: [], // Массив для хранения событий
        energy: 100, // Начальное значение энергии
        maxEnergy: 100, // Максимальное значение энергии
        energyRegenRate: 1, // Единиц энергии в секунду
        isPostProductionActive: false,
        currentPostProductionType: null,
        postProductionRemainingTime: 0,
        postProductionTotalTime: 0,
        gameVersion: 'v0.8.0' // Добавлено для отображения
    };

    // Константы игры
    const GAME_LOOP_INTERVAL = 1000; // 1 секунда
    const POST_TIMES = {
        text: 5,
        meme: 10,
        video: 20
    };
    const POST_ENERGY_COSTS = {
        text: 10,
        meme: 20,
        video: 40
    };
    const CHARACTER_STATES = {
        IDLE_BLINKING: 'char-anim-idle-blink', // Класс для анимации мигания
        TYPING: 'char-state-typing',
        HAPPY: 'char-state-happy',
        SLEEPING: 'char-state-sleeping' // Добавим, если будет
    };

    // --- Core Game Logic ---

    function saveGame() {
        localStorage.setItem('channelSimGameState_v7', JSON.stringify(gameState));
        // console.log("Игра сохранена:", gameState); // Отключено для уменьшения спама в консоли
    }

    function loadGame() {
        const savedState = localStorage.getItem('channelSimGameState_v7');
        if (savedState) {
            try {
                gameState = JSON.parse(savedState);
                console.log("Загружено состояние игры:", gameState);
                // Если нет каких-то полей из defaultGameState, добавляем их
                for (const key in defaultGameState) {
                    if (gameState[key] === undefined) {
                        gameState[key] = defaultGameState[key];
                    }
                }
                // Также убедимся, что energy не превышает maxEnergy
                if (gameState.energy > gameState.maxEnergy) {
                    gameState.energy = gameState.maxEnergy;
                }
            } catch (e) {
                console.error("Ошибка при загрузке состояния игры из localStorage:", e);
                logEvent("Ошибка загрузки сохранения. Начинаем новую игру.", "error");
                gameState = { ...defaultGameState };
                localStorage.removeItem('channelSimGameState_v7');
            }
        } else {
            gameState = { ...defaultGameState };
            console.log("Нет сохраненных данных. Инициализировано новое состояние:", gameState);
        }
    }

    function updateUI() {
        if (subscribersCountEl) subscribersCountEl.textContent = formatNumber(gameState.subscribers);
        if (balanceCountEl) balanceCountEl.textContent = formatNumber(gameState.balance);
        if (audienceMoodDisplay) audienceMoodDisplay.textContent = getMoodText(gameState.audienceMood);
        if (energyCountEl) energyCountEl.textContent = `<span class="math-inline">\{Math\.floor\(gameState\.energy\)\}/</span>{gameState.maxEnergy}`; // Обновление энергии
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = gameState.channelName;
        if (gameVersionEl) gameVersionEl.textContent = gameState.gameVersion; // Теперь всегда есть в defaultGameState
        
        // Обновление тренда
        if (gameState.currentTrend && gameState.trendExpirationTime > Date.now()) {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = gameState.currentTrend.name;
        } else {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
        }

        // Обновление статуса производства поста
        if (postProductionStatusEl && postProductionProgressFillEl && postProductionTimeRemainingEl) {
            if (gameState.isPostProductionActive) {
                postProductionStatusEl.style.display = 'block';
                postTypeInProductionEl.textContent = gameState.currentPostProductionType || 'контента';
                const progress = ((gameState.postProductionTotalTime - gameState.postProductionRemainingTime) / gameState.postProductionTotalTime) * 100;
                postProductionProgressFillEl.style.width = `${progress}%`;
                postProductionTimeRemainingEl.textContent = Math.ceil(gameState.postProductionRemainingTime);
                
                // Скрываем кнопку "Создать пост"
                if (createPostButton) createPostButton.style.display = 'none';
            } else {
                postProductionStatusEl.style.display = 'none';
                // Показываем кнопку "Создать пост"
                if (createPostButton) createPostButton.style.display = 'block';
            }
        }
        
        updateLogDisplay(); // Обновляем журнал событий
    }

    function gameTick() {
        const now = Date.now();
        const deltaTime = (now - gameState.lastTick) / 1000; // Время в секундах с последнего тика
        gameState.lastTick = now;

        // Генерация энергии
        gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + gameState.energyRegenRate * deltaTime);

        // Управление производством поста
        if (gameState.isPostProductionActive) {
            gameState.postProductionRemainingTime -= deltaTime;
            if (gameState.postProductionRemainingTime <= 0) {
                gameState.isPostProductionActive = false;
                completePostProduction();
            }
        }

        // Обновление тренда
        if (gameState.currentTrend && gameState.trendExpirationTime <= now) {
            logEvent(`Тренд "${gameState.currentTrend.name}" закончился.`, "info");
            gameState.currentTrend = null;
        } else if (!gameState.currentTrend && Math.random() < 0.005) { // Шанс появления нового тренда (0.5% каждый тик)
            generateNewTrend();
        }

        updateUI(); // Обновляем UI каждый тик
        saveGame(); // Сохраняем игру каждый тик
    }

    function setupGameLoop() {
        setInterval(gameTick, GAME_LOOP_INTERVAL);
    }

    function logEvent(message, type = "info") {
        const timestamp = new Date().toLocaleTimeString();
        gameState.eventLog.unshift({ message: `[${timestamp}] ${message}`, type: type }); // Добавляем в начало
        if (gameState.eventLog.length > 50) { // Ограничиваем размер лога
            gameState.eventLog.pop();
        }
        updateLogDisplay();
    }

    function updateLogDisplay() {
        if (eventLogUl) {
            eventLogUl.innerHTML = '';
            gameState.eventLog.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = entry.message;
                li.classList.add(`log-${entry.type}`);
                eventLogUl.appendChild(li);
            });
        }
    }

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function getMoodText(mood) {
        if (mood >= 80) return "Отличное";
        if (mood >= 60) return "Хорошее";
        if (mood >= 40) return "Нормальное";
        if (mood >= 20) return "Плохое";
        return "Ужасное";
    }

    function setCharacterState(stateClass) {
        if (characterEl) {
            // Удаляем все классы состояний и анимаций
            characterEl.className = ''; 
            // Добавляем новый класс состояния
            characterEl.classList.add(stateClass);

            // Если это IDLE, запускаем анимацию мигания
            if (stateClass === CHARACTER_STATES.IDLE_BLINKING
