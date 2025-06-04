document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

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


    // Игровое состояние
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
        console.log("Игра сохранена:", gameState);
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
        if (energyCountEl) energyCountEl.textContent = `${gameState.energy}/${gameState.maxEnergy}`; // Обновление энергии
        if (channelNameOnMonitorEl) channelNameOnMonitorEl.textContent = gameState.channelName;
        if (gameVersionEl) gameVersionEl.textContent = gameState.gameVersion || 'v0.8.0'; // Убедитесь, что gameVersion есть в defaultGameState
        
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
            if (stateClass === CHARACTER_STATES.IDLE_BLINKING) {
                // Анимация уже добавлена через класс
            }

            // Устанавливаем таймаут для возврата в IDLE после других состояний
            if (stateClass !== CHARACTER_STATES.IDLE_BLINKING) {
                clearTimeout(characterStateTimeout);
                characterStateTimeout = setTimeout(() => {
                    setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
                }, 2000); // Возврат в IDLE через 2 секунды
            }
        }
    }

    function generateNewTrend() {
        const trends = [
            { name: "Котики в космосе", duration: 60, bonus: 0.15 }, // 1 минута
            { name: "Новые мемы", duration: 120, bonus: 0.20 }, // 2 минуты
            { name: "Обзоры инди-игр", duration: 180, bonus: 0.25 } // 3 минуты
        ];
        const randomTrend = trends[Math.floor(Math.random() * trends.length)];
        gameState.currentTrend = randomTrend;
        gameState.trendExpirationTime = Date.now() + randomTrend.duration * 1000;
        logEvent(`Появился новый тренд: "${randomTrend.name}"!`, "info");
        tg.HapticFeedback.notificationOccurred('success');
    }

    // --- Game Screens & Flow ---

    // Функция для показа/скрытия экранов
    function showScreen(screenToShow) {
        console.log(`[showScreen] Attempting to show screen: ${screenToShow ? screenToShow.id || screenToShow.className : 'NULL'}`);
        const allScreens = [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal]; // Добавим модалки
        
        allScreens.forEach(el => {
            if (el) {
                el.classList.remove('visible');
                el.style.display = 'none';
                // console.log(`[showScreen] Hiding: ${el.id || el.className}`); // Опционально: для отладки
            }
        });

        if (screenToShow) {
            screenToShow.style.display = 'flex'; // Или 'block' для некоторых элементов, если они не flex-контейнеры
            // Небольшая задержка для того, чтобы `display: flex` применился до начала анимации `opacity`
            setTimeout(() => {
                screenToShow.classList.add('visible');
                console.log(`[showScreen] Showing: ${screenToShow.id || screenToShow.className}, display: ${screenToShow.style.display}, visible class: ${screenToShow.classList.contains('visible')}`);
            }, 50); // Очень короткая задержка
        } else {
            console.warn("[showScreen] screenToShow is NULL or undefined. No screen will be shown.");
        }
    }

    function initializeGameFlow() {
        console.log("initializeGameFlow called.");
        loadGame(); // Загружаем или инициализируем gameState

        if (gameState.selectedTheme) { // Если тема уже выбрана (игра уже начата)
            console.log("Game already started, showing studio.");
            showScreen(studioContainer);
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        } else { // Если тема не выбрана (новая игра)
            console.log("New game, showing theme selection screen.");
            showThemeSelectionScreen();
        }
        updateUI(); // Обновляем UI после загрузки или инициализации
        setupGameLoop(); // Запускаем игровой цикл
        setupEventHandlers(); // Настраиваем обработчики событий
    }

    function showThemeSelectionScreen() {
        showScreen(themeSelectionScreen);
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = tg.initDataUnsafe.user.username || 'Игрок';
            if (userPhotoEl) userPhotoEl.src = tg.initDataUnsafe.user.photo_url || 'placeholder-avatar.png'; // Установите фото
        } else {
            if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = 'Игрок';
        }
    }

    function showWelcomeScreen() {
        showScreen(welcomeScreen);
    }

    function playCutscene() {
        showScreen(cutsceneScreen);
        currentSlideIndex = 0;
        if (cutsceneSlides.length > 0) {
            updateCutsceneSlide();
        }
    }

    function updateCutsceneSlide() {
        cutsceneSlides.forEach((slide, index) => {
            slide.classList.remove('active');
            slide.style.display = 'none'; // Скрываем все слайды
        });

        if (currentSlideIndex < cutsceneSlides.length) {
            const activeSlide = cutsceneSlides[currentSlideIndex];
            activeSlide.style.display = 'flex'; // Показываем текущий
            setTimeout(() => {
                activeSlide.classList.add('active'); // Активируем его
            }, 50); // Небольшая задержка для плавности

            if (currentSlideIndex < cutsceneSlides.length - 1) {
                // Если это не последний слайд, автоматически переходим к следующему
                setTimeout(() => {
                    currentSlideIndex++;
                    updateCutsceneSlide();
                }, 3000); // 3 секунды на слайд
            } else {
                // Последний слайд, показываем кнопку продолжения
                if (continueToStudioButton) continueToStudioButton.style.display = 'block';
            }
        }
    }

    function showStudioScreen() {
        showScreen(studioContainer);
        setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        // Дополнительная логика для инициализации студии
        updateUI();
    }


    // --- Post Production Logic ---

    function startPostProduction(postType) {
        if (gameState.isPostProductionActive) {
            logEvent("Вы уже создаете пост!", "warning");
            tg.HapticFeedback.notificationOccurred('warning');
            return;
        }

        const energyCost = POST_ENERGY_COSTS[postType];
        if (gameState.energy < energyCost) {
            logEvent("Недостаточно энергии для создания поста!", "error");
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        gameState.energy -= energyCost;
        gameState.isPostProductionActive = true;
        gameState.currentPostProductionType = postType;
        gameState.postProductionTotalTime = POST_TIMES[postType];
        gameState.postProductionRemainingTime = POST_TIMES[postType];
        logEvent(`Начато создание ${postType === 'text' ? 'текстового поста' : postType === 'meme' ? 'мема' : 'видеоролика'}...`, "info");
        closeModal(createPostModal); // Закрываем модалку создания поста
        setCharacterState(CHARACTER_STATES.TYPING); // Персонаж начинает печатать
        updateUI(); // Обновляем UI, чтобы показать статус производства
        tg.HapticFeedback.impactOccurred('light');
    }

    function completePostProduction() {
        logEvent(`Создание ${gameState.currentPostProductionType} завершено!`, "success");
        // Здесь можно добавить логику начисления подписчиков/денег в зависимости от типа поста
        const baseSubscribers = { text: 5, meme: 10, video: 25 };
        const baseBalance = { text: 1, meme: 2, video: 5 };

        let gainedSubscribers = baseSubscribers[gameState.currentPostProductionType] * gameState.contentQuality;
        let gainedBalance = baseBalance[gameState.currentPostProductionType] * gameState.contentQuality;

        // Бонус от тренда
        if (gameState.currentTrend && gameState.trendExpirationTime > Date.now()) {
            gainedSubscribers += gainedSubscribers * gameState.currentTrend.bonus;
            gainedBalance += gainedBalance * gameState.currentTrend.bonus;
            logEvent(`+${formatNumber(gainedSubscribers.toFixed(0))} подписчиков (с бонусом тренда "${gameState.currentTrend.name}")`, "success");
            logEvent(`+$${formatNumber(gainedBalance.toFixed(0))} (с бонусом тренда "${gameState.currentTrend.name}")`, "success");
        } else {
            logEvent(`+${formatNumber(gainedSubscribers.toFixed(0))} подписчиков`, "success");
            logEvent(`+$${formatNumber(gainedBalance.toFixed(0))}`, "success");
        }

        gameState.subscribers += Math.round(gainedSubscribers);
        gameState.balance += Math.round(gainedBalance);
        
        // Влияние на настроение аудитории
        gameState.audienceMood = Math.min(100, gameState.audienceMood + 5); // Небольшое улучшение настроения
        
        // Сброс состояния производства поста
        gameState.isPostProductionActive = false;
        gameState.currentPostProductionType = null;
        gameState.postProductionRemainingTime = 0;
        gameState.postProductionTotalTime = 0;

        setCharacterState(CHARACTER_STATES.HAPPY); // Персонаж доволен
        updateUI();
        tg.HapticFeedback.notificationOccurred('success');
    }

    // --- Modal Logic ---

    function openModal(modalEl) {
        if (modalEl) {
            showScreen(modalEl); // Используем showScreen для открытия модалки, т.к. она тоже .modal-overlay
            tg.HapticFeedback.impactOccurred('medium');
        }
    }

    function closeModal(modalEl) {
        if (modalEl) {
            modalEl.classList.remove('visible');
            // После анимации скрываем через display: none
            setTimeout(() => {
                modalEl.style.display = 'none';
                // После закрытия модалки, если мы в студии, убедимся, что студия видна
                if (studioContainer && studioContainer.classList.contains('visible')) {
                    // Studio container display should already be flex from showScreen()
                    // But if it's somehow not, re-apply.
                    studioContainer.style.display = 'flex'; 
                }
            }, 300); // Соответствует длительности CSS transition
            tg.HapticFeedback.impactOccurred('light');
        }
    }


    // --- Event Handlers ---
    function setupEventHandlers() {
        // Выбор темы
        if (themeSelectionScreen) {
            themeSelectionScreen.addEventListener('click', (e) => {
                const card = e.target.closest('.theme-card');
                if (card) {
                    // Снимаем выделение со всех карт
                    themeSelectionScreen.querySelectorAll('.theme-card').forEach(c => c.style.border = '1px solid rgba(var(--color-accent-primary-rgb), 0.3)');
                    // Выделяем выбранную карту
                    card.style.border = `2px solid var(--color-accent-primary)`;
                    gameState.selectedTheme = card.dataset.theme;
                    if (selectThemeButton) selectThemeButton.disabled = false;
                    tg.HapticFeedback.impactOccurred('light');
                }
            });
        }

        if (selectThemeButton) {
            selectThemeButton.addEventListener('click', () => {
                if (gameState.selectedTheme) {
                    logEvent(`Вы выбрали тему "${gameState.selectedTheme}".`, "info");
                    saveGame();
                    showWelcomeScreen();
                    tg.HapticFeedback.notificationOccurred('success');
                } else {
                    logEvent("Пожалуйста, выберите тему.", "warning");
                    tg.HapticFeedback.notificationOccurred('warning');
                }
            });
        }

        if (startGameButton) {
            startGameButton.addEventListener('click', () => {
                showScreen(welcomeScreen); // Скроет welcomeScreen
                setTimeout(() => { playCutscene(); }, 500); // Задержка перед началом катсцены
                tg.HapticFeedback.impactOccurred('heavy');
            });
        }

        if (continueToStudioButton) {
            continueToStudioButton.addEventListener('click', () => {
                showStudioScreen();
                tg.HapticFeedback.impactOccurred('heavy');
            });
        }

        // Кнопки модальных окон
        if (createPostButton) {
            createPostButton.addEventListener('click', () => openModal(createPostModal));
        }
        if (upgradesButton) {
            upgradesButton.addEventListener('click', () => openModal(upgradesModal));
        }
        if (logButton) {
            logButton.addEventListener('click', () => openModal(logModal));
        }

        closeModalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modalId;
                const modalToClose = document.getElementById(modalId);
                closeModal(modalToClose);
            });
        });

        // Кнопки создания поста
        if (postTextButton) {
            postTextButton.addEventListener('click', () => startPostProduction('text'));
        }
        if (postMemeButton) {
            postMemeButton.addEventListener('click', () => startPostProduction('meme'));
        }
        if (postVideoButton) {
            postVideoButton.addEventListener('click', () => startPostProduction('video'));
        }

        // Кнопка улучшения качества контента
        if (upgradeContentQualityButton) {
            upgradeContentQualityButton.addEventListener('click', () => {
                const cost = parseInt(upgradeContentQualityButton.dataset.cost);
                if (gameState.balance >= cost) {
                    gameState.balance -= cost;
                    gameState.contentQuality += 0.1; // Увеличиваем качество
                    upgradeContentQualityButton.dataset.cost = cost * 2; // Увеличиваем стоимость следующего апгрейда
                    upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${formatNumber(cost * 2)})`;
                    logEvent(`Качество контента улучшено! Новое качество: ${gameState.contentQuality.toFixed(1)}`, "success");
                    tg.HapticFeedback.notificationOccurred('success');
                    updateUI();
                    saveGame();
                } else {
                    logEvent(`Недостаточно средств для улучшения качества контента. Требуется $${cost}.`, "error");
                    tg.HapticFeedback.notificationOccurred('error');
                }
            });
        }

        // Кнопка назад Telegram Web App (закомментировано для устранения проблем совместимости)
        // if (tg.BackButton) {
        //     tg.BackButton.show();
        //     tg.BackButton.onClick(() => {
        //         const visibleModal = document.querySelector('.modal-overlay.visible');
        //         if (visibleModal) { closeModal(visibleModal); }
        //         else if (studioContainer && studioContainer.classList.contains('visible')) { saveGame(); logEvent("Выход из игры (прогресс сохранен).", "info"); tg.close(); }
        //         else if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) { tg.close(); }
        //         else if (welcomeScreen && welcomeScreen.classList.contains('visible')) { tg.close(); }
        //         else if (themeSelectionScreen && themeSelectionScreen.classList.contains('visible')) { tg.close(); }
        //     });
        // }
    }

    // --- Инициализация при загрузке DOM ---
    tg.ready();
    tg.expand();
    // tg.MainButton.hide(); // Скрыть главную кнопку Telegram, если она не нужна

    console.log("DOM полностью загружен. Запускаем инициализацию.");

    // Начальный запуск прелоадера и инициализации игры
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) {
            preloader.classList.remove('visible');
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                initializeGameFlow(); // Запускаем основной поток игры после скрытия прелоадера
            }, 700); // Продолжаем задержку 700ms для анимации скрытия прелоадера
        } else {
            console.error("Preloader element not found!");
            initializeGameFlow(); // Если прелоадера нет, все равно запускаем игру
        }
    }, 2500); // Общее время, пока прелоадер виден (до начала скрытия)

}); // Конец DOMContentLoaded
