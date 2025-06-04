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

    // НОВЫЕ ЭЛЕМЕНТЫ UI ДЛЯ ПРОГРЕССА ПОСТА И ЭНЕРГИИ
    const postProductionStatusEl = document.getElementById('post-production-status');
    const postTypeInProductionEl = document.getElementById('post-type-in-production');
    const postProductionProgressFillEl = document.getElementById('post-production-progress-fill');
    const postProductionTimeRemainingEl = document.getElementById('post-production-time-remaining');
    const energyCountEl = document.getElementById('energy-count');


    tg.ready();
    tg.expand();

    // НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ ЛОГИКИ ПОСТОВ И ЭНЕРГИИ
    let postProductionTimer;
    // let postProductionRemainingTime = 0; // Теперь хранится в gameState
    // let currentPostTypeInProduction = ''; // Теперь хранится в gameState
    // let isPostInProduction = false; // Теперь хранится в gameState

    const MAX_ENERGY = 100;
    const ENERGY_REGEN_RATE = 1; // 1 энергия в секунду
    const ENERGY_REGEN_INTERVAL = 1000; // Каждую 1 секунду
    let energyRegenTimer;

    let defaultGameState = {
        channelName: "Мой Канал",
        subscribers: 0,
        balance: 100,
        engagementRate: 0, // Устаревшее, можно удалить, если не используется
        audienceMood: 75,
        upgrades: { // Теперь улучшения в отдельном объекте для масштабируемости
            contentQuality: 0,
        },
        postsMade: 0,
        gameVersion: "0.8.0", // Обновляем версию игры
        theme: null,
        themeModifiers: { text: 1, meme: 1, video: 1 },
        currentTrend: null,
        trendPostsRemaining: 0,
        // НОВЫЕ СВОЙСТВА ДЛЯ СОЗДАНИЯ ПОСТА И ЭНЕРГИИ
        isPostInProduction: false,
        postProductionRemainingTime: 0,
        currentPostTypeInProduction: '',
        postProductionStartedTime: 0, // Добавим для расчета прогресса
        energy: MAX_ENERGY, // Начальный запас энергии
        lastEnergyRegenTime: Date.now(), // Время последней регенерации или загрузки игры
        eventLog: [], // Переносим сюда, чтобы сохранять лог
    };
    let gameState = { ...defaultGameState };

    const CHARACTER_STATES = {
        IDLE: 'idle', // Изменил имя, чтобы было проще, и соответствует CSS
        TYPING: 'typing',
        HAPPY: 'happy',
        SLEEPING: 'sleeping' 
    };

    function setCharacterState(state) {
        if (characterEl) {
            characterEl.className = 'character-sprite'; // Сброс всех состояний
            characterEl.classList.add(state); // Применяем новое состояние

            clearTimeout(characterStateTimeout); // Очищаем предыдущий таймер

            // Если состояние не 'idle' или 'typing', через некоторое время возвращаем в 'idle'
            if (state !== CHARACTER_STATES.IDLE && state !== CHARACTER_STATES.TYPING) {
                characterStateTimeout = setTimeout(() => {
                    if (characterEl.classList.contains(state)) { // Проверяем, не изменилось ли состояние пока мы ждали
                        characterEl.classList.remove(state);
                        characterEl.classList.add(CHARACTER_STATES.IDLE);
                    }
                }, 1500); // 1.5 секунды анимации действия
            }
        }
    }

    function showScreen(screenElement) {
        // Убираем все экраны
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el) { el.classList.remove('visible'); el.style.display = 'none';}
        });
        // Показываем нужный экран
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
        loadGame(); // Загружаем игру в самом начале

        // Запускаем регенерацию энергии
        energyRegenTimer = setInterval(regenerateEnergy, ENERGY_REGEN_INTERVAL);

        // Пример: обновление трендов каждые 2 минуты (если у вас уже есть эта логика)
        setInterval(generateNewTrend, 120 * 1000); // Обновляем тренд каждые 2 минуты

        // Добавляем автоматическое сохранение игры каждые 10 секунд
        setInterval(saveGame, 10000);

        // Первоначальное обновление UI
        updateUI();
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
        showScreen(studioContainer); 
        logEvent(`Студия открыта! Канал: ${gameState.channelName}.`, "info");
        setCharacterState(CHARACTER_STATES.IDLE);
    }

    function loadGame() { 
        const savedState = localStorage.getItem('channelSimGameState_v7'); 
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Используем structuredClone для глубокого копирования и инициализации новых свойств
            gameState = structuredClone({ ...defaultGameState, ...parsedState });

            // Восстановление энергии при загрузке
            // Если lastEnergyRegenTime не существует, устанавливаем его в текущее время
            if (typeof gameState.lastEnergyRegenTime === 'undefined') {
                gameState.lastEnergyRegenTime = Date.now();
            }
            regenerateEnergy(); // Вызываем один раз, чтобы восстановить пропущенную энергию

            // Если пост был в производстве при выходе, возобновляем таймер
            if (gameState.isPostInProduction && gameState.postProductionStartedTime > 0) {
                const totalDuration = getPostProductionTime(gameState.currentPostTypeInProduction);
                const elapsed = (Date.now() - gameState.postProductionStartedTime) / 1000;
                const remaining = Math.max(0, totalDuration - elapsed);

                gameState.postProductionRemainingTime = Math.ceil(remaining);

                if (gameState.postProductionRemainingTime > 0) {
                    // Запускаем таймер, если время еще есть
                    postProductionTimer = setInterval(() => {
                        gameState.postProductionRemainingTime--;
                        if (gameState.postProductionRemainingTime <= 0) {
                            clearInterval(postProductionTimer);
                            finishPostProduction();
                        }
                        updateUI();
                    }, 1000);
                } else {
                    // Если время уже истекло (например, игрок вышел, а через пару минут зашел)
                    finishPostProduction();
                }
            }

            // Восстановление лога событий
            if (gameState.eventLog && eventLogUl) {
                eventLogUl.innerHTML = ''; // Очищаем текущий лог
                gameState.eventLog.forEach(logItem => {
                    const listItem = document.createElement('li');
                    listItem.textContent = logItem.text;
                    listItem.className = `log-${logItem.type}`;
                    eventLogUl.prepend(listItem);
                });
            }

        } else {
            // Инициализация новой игры
            gameState = structuredClone(defaultGameState);
            logEvent("Добро пожаловать в игру! Создайте свой канал.", "info");
        }
        if (gameVersionEl) gameVersionEl.textContent = `v${gameState.gameVersion}`;
        updateUI(); // Обновить UI после загрузки
        updateTrendUI();
        checkUpgradeButtonStatus();
    }

    function saveGame() {
        // Ограничиваем размер лога при сохранении, чтобы не перегружать localStorage
        const logToSave = gameState.eventLog.slice(0, 30); // Сохраняем последние 30 записей
        const stateToSave = { ...gameState, eventLog: logToSave };
        localStorage.setItem('channelSimGameState_v7', JSON.stringify(stateToSave));
    }

    function logEvent(message, type = 'info') { 
        if (!eventLogUl) return;
        const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
        const fullMessage = `[${time}] ${message}`;
        
        // Добавляем в массив gameState
        gameState.eventLog.unshift({ text: fullMessage, type: type });
        // Ограничиваем размер массива
        if (gameState.eventLog.length > 30) {
            gameState.eventLog.pop(); // Удаляем самый старый элемент
        }

        // Обновляем UI лога
        const listItem = document.createElement('li');
        listItem.textContent = fullMessage;
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
        if (energyCountEl) energyCountEl.textContent = gameState.energy; // Обновляем отображение энергии
        updateTrendUI();

        // Обновление UI для создания поста
        if (gameState.isPostInProduction) {
            postProductionStatusEl.style.display = 'block';
            postTypeInProductionEl.textContent = gameState.currentPostTypeInProduction;
            // Расчет прогресса и оставшегося времени
            const elapsed = (Date.now() - gameState.postProductionStartedTime) / 1000;
            const totalDuration = getPostProductionTime(gameState.currentPostTypeInProduction);
            const remaining = Math.max(0, totalDuration - elapsed);
            const progress = (elapsed / totalDuration) * 100;

            postProductionProgressFillEl.style.width = `${Math.min(100, progress)}%`;
            postProductionTimeRemainingEl.textContent = Math.ceil(remaining);

            // Если время истекло, но пост все еще в производстве (например, после перезагрузки)
            if (remaining <= 0 && gameState.postProductionRemainingTime <= 0) { // Двойная проверка
                finishPostProduction();
            }
        } else {
            postProductionStatusEl.style.display = 'none';
        }
    }

    function checkUpgradeButtonStatus() { 
        if (!upgradeContentQualityButton) return;
        // Теперь стоимость берем из dataset, а текущий уровень из gameState.upgrades
        const currentLevel = gameState.upgrades.contentQuality;
        const baseCost = 50; // Начальная стоимость
        const cost = Math.floor(baseCost * Math.pow(2, currentLevel)); // Пример: 50, 100, 200, 400...

        upgradeContentQualityButton.dataset.cost = cost; // Обновляем data-cost
        upgradeContentQualityButton.textContent = `Улучшить качество контента (Ур. ${currentLevel + 1}): $${cost}`;
        upgradeContentQualityButton.disabled = gameState.balance < cost;
    }

    function updateTrendUI() { 
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            if (trendDescriptionMonitorEl) trendDescriptionMonitorEl.textContent = `${gameState.currentTrend.topic} (${getPostTypeName(gameState.currentTrend.type)}) Бонус x${gameState.currentTrend.bonus}, ${gameState.currentTrend.type === 'text' ? 'Текст' : (gameState.currentTrend.type === 'meme' ? 'Мем' : 'Видео')} постов: ${gameState.trendPostsRemaining}`;
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'block';
        } else {
            if (currentTrendDisplayMonitor) currentTrendDisplayMonitor.style.display = 'none';
        }
    }

    function generateNewTrend() { 
        const trendTypes = ['text', 'meme', 'video'];
        const trendTopics = {
            text: ["Горячие новости", "Советы", "Анализ", "Интервью"],
            meme: ["Мемы", "Юмор", "Животные", "Треш-контент"],
            video: ["Обзоры", "Котики", "Лайфхаки", "Пранки", "Влоги"]
        };
        const randomType = trendTypes[Math.floor(Math.random() * trendTypes.length)];
        const randomTopic = trendTopics[randomType][Math.floor(Math.random() * trendTopics[randomType].length)];
        // Бонус теперь от 1.3 до 1.8
        gameState.currentTrend = { type: randomType, topic: randomTopic, bonus: (Math.random() * 0.5 + 1.3).toFixed(1) };
        gameState.trendPostsRemaining = Math.floor(Math.random() * 3) + 3; // От 3 до 5 постов
        logEvent(`Новый тренд! ${randomTopic} (${getPostTypeName(randomType)}) сейчас популярны! Бонус x${gameState.currentTrend.bonus} на ${gameState.trendPostsRemaining} постов.`, 'warning');
        updateTrendUI(); // Обновляем UI сразу после генерации тренда
    }

    function getThemeDisplayName(themeKey) {
        const n = { news: 'Новости', entertainment: 'Развлечения', education: 'Образование', tech: 'Технологии'};
        return n[themeKey] || 'Неизвестная';
    }

    function getPostTypeName(typeKey) {
        const n = { text: 'Текстовый Пост', meme: 'Мем', video: 'Видеоролик'};
        return n[typeKey] || typeKey;
    }

    // НОВАЯ ФУНКЦИЯ: Получение времени создания поста
    function getPostProductionTime(postType) {
        switch (postType) {
            case 'Текстовый Пост': return 15; // 15 секунд
            case 'Мем': return 30; // 30 секунд
            case 'Видеоролик': return 60; // 60 секунд
            default: return 0;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Получение стоимости энергии поста
    function getPostEnergyCost(postType) {
        switch (postType) {
            case 'Текстовый Пост': return 5;
            case 'Мем': return 10;
            case 'Видеоролик': return 20;
            default: return 0;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Регенерация энергии
    function regenerateEnergy() {
        const now = Date.now();
        const timeElapsed = now - gameState.lastEnergyRegenTime;
        const energyToAdd = Math.floor(timeElapsed / ENERGY_REGEN_INTERVAL) * ENERGY_REGEN_RATE;

        if (energyToAdd > 0) {
            gameState.energy = Math.min(MAX_ENERGY, gameState.energy + energyToAdd);
            gameState.lastEnergyRegenTime = now; // Обновляем время последней регенерации
            updateUI();
            // logEvent(`Восстановлено ${energyToAdd} энергии.`, 'info'); // Можно включить для отладки
        }
        saveGame(); // Сохраняем состояние энергии
    }


    function openModal(modalElement) { if (modalElement) { showScreen(modalElement); } }
    function closeModal(modalElement) { if (modalElement) { modalElement.classList.remove('visible'); setTimeout(() => { modalElement.style.display = 'none'; }, 300); showScreen(studioContainer); } }

    if(createPostButtonMonitor) createPostButtonMonitor.addEventListener('click', () => openModal(createPostModal));
    if(openUpgradesButton) openUpgradesButton.addEventListener('click', () => openModal(upgradesModal));
    if(openLogButton) openLogButton.addEventListener('click', () => openModal(logModal));
    closeModalButtons.forEach(button => { button.addEventListener('click', () => { const modalId = button.dataset.modalId; const modalToClose = document.getElementById(modalId); closeModal(modalToClose); }); });

    // НОВАЯ ФУНКЦИЯ: Получение эффекта настроения от типа поста
    function getMoodEffectFromPostType(postType) {
        switch (postType) {
            case 'Текстовый Пост': return 1; // Небольшой положительный эффект
            case 'Мем': return 3; // Средний положительный эффект
            case 'Видеоролик': return 5; // Значительный положительный эффект
            default: return 0;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Получение базового количества подписчиков от типа поста
    function getBaseSubscribers(postType) {
        switch (postType) {
            case 'Текстовый Пост': return Math.floor(Math.random() * (5 - 1 + 1)) + 1; // от 1 до 5
            case 'Мем': return Math.floor(Math.random() * (10 - 3 + 1)) + 3; // от 3 до 10
            case 'Видеоролик': return Math.floor(Math.random() * (20 - 8 + 1)) + 8; // от 8 до 20
            default: return 0;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Получение базового дохода от типа поста
    function getBaseIncome(postType) {
        switch (postType) {
            case 'Текстовый Пост': return Math.floor(Math.random() * (10 - 2 + 1)) + 2; // от $2 до $10
            case 'Мем': return Math.floor(Math.random() * (5 - 1 + 1)) + 1; // от $1 до $5
            case 'Видеоролик': return Math.floor(Math.random() * (18 - 7 + 1)) + 7; // от $7 до $18
            default: return 0;
        }
    }

    // НОВАЯ ФУНКЦИЯ: Получение эффекта тренда
    function getTrendEffect(postType) {
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0 && getPostTypeName(gameState.currentTrend.type) === postType) {
            const bonus = parseFloat(gameState.currentTrend.bonus);
            // Возвращаем объект с эффектами, которые зависят от типа поста
            let subscribersBonus = 0;
            let incomeBonus = 0;
            let moodBonus = 0;

            switch (postType) {
                case 'Текстовый Пост':
                    subscribersBonus = Math.round(5 * (bonus - 1)); // 5 * (1.3-1) = 1.5, 5*(1.8-1)=4
                    incomeBonus = Math.round(3 * (bonus - 1));
                    moodBonus = 2;
                    break;
                case 'Мем':
                    subscribersBonus = Math.round(10 * (bonus - 1));
                    incomeBonus = Math.round(2 * (bonus - 1));
                    moodBonus = 3;
                    break;
                case 'Видеоролик':
                    subscribersBonus = Math.round(15 * (bonus - 1));
                    incomeBonus = Math.round(5 * (bonus - 1));
                    moodBonus = 4;
                    break;
            }
            return { subscribers: subscribersBonus, income: incomeBonus, mood: moodBonus };
        }
        return { subscribers: 0, income: 0, mood: 0 };
    }


    // ИЗМЕНЕНА: handlePostAction теперь только запускает производство поста
    function handlePostAction(postType) {
        if (gameState.isPostInProduction) { // Запрещаем создание нового поста, пока текущий в производстве
            logEvent('Вы уже создаете пост. Дождитесь завершения.', 'warning');
            tg.HapticFeedback.notificationOccurred('warning');
            return;
        }

        const energyCost = getPostEnergyCost(postType);
        if (gameState.energy < energyCost) {
            logEvent('Недостаточно энергии для создания поста!', 'error');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        closeModal(document.getElementById('create-post-modal')); // Закрываем модальное окно

        const productionTime = getPostProductionTime(postType);
        if (productionTime === 0) {
            logEvent('Неизвестный тип поста. Публикация отменена.', 'error');
            tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        // Вычитаем энергию сразу после начала производства
        gameState.energy -= energyCost;
        // updateUI(); // Обновляем UI, чтобы показать уменьшение энергии - будет вызвано в цикле таймера

        gameState.isPostInProduction = true;
        gameState.postProductionRemainingTime = productionTime;
        gameState.currentPostTypeInProduction = postType;
        gameState.postProductionStartedTime = Date.now(); // Запоминаем время начала

        logEvent(`Начато создание "${postType}". Стоимость: ${energyCost} энергии.`, 'info');
        tg.HapticFeedback.notificationOccurred('light');

        setCharacterState(CHARACTER_STATES.TYPING); // Устанавливаем состояние "печатает" или "работает"

        // Запускаем интервал для обновления прогресса и отсчета времени
        postProductionTimer = setInterval(() => {
            gameState.postProductionRemainingTime--;
            if (gameState.postProductionRemainingTime <= 0) {
                clearInterval(postProductionTimer);
                finishPostProduction();
            }
            updateUI(); // Обновляем UI каждую секунду для таймера и прогресс-бара
        }, 1000); // Обновляем каждую секунду
        saveGame();
    }

    // НОВАЯ ФУНКЦИЯ: Завершение производства поста
    function finishPostProduction() {
        if (!gameState.isPostInProduction) return; // Защита от повторных вызовов

        const postType = gameState.currentPostTypeInProduction;
        const moodEffect = getMoodEffectFromPostType(postType);
        const trendEffect = getTrendEffect(postType); // Получаем эффекты тренда
        const baseSubscribers = getBaseSubscribers(postType);
        const baseIncome = getBaseIncome(postType);

        // Применяем улучшения контента
        // Теперь множитель берется из gameState.upgrades.contentQuality
        const contentQualityMultiplier = 1 + (gameState.upgrades.contentQuality * 0.1); // 10% за каждый уровень
        
        let effectiveSubscribers = Math.round(baseSubscribers * contentQualityMultiplier);
        let effectiveIncome = Math.round(baseIncome * contentQualityMultiplier);

        let finalSubscribersChange = effectiveSubscribers;
        let finalIncomeChange = effectiveIncome;
        let finalMoodChange = moodEffect;

        // Применение трендов
        if (trendEffect.subscribers) {
            finalSubscribersChange += trendEffect.subscribers;
            logEvent(`Ваш пост "${postType}" в тренде! Бонус подписчиков: +${trendEffect.subscribers}.`, 'success');
        }
        if (trendEffect.income) {
            finalIncomeChange += trendEffect.income;
            logEvent(`Ваш пост "${postType}" в тренде! Бонус к доходу: +$${trendEffect.income}.`, 'success');
        }
        if (trendEffect.mood) {
            finalMoodChange += trendEffect.mood;
            logEvent(`Ваш пост "${postType}" в тренде! Настроение аудитории улучшилось!`, 'success');
        }

        // Применение случайного падения подписчиков или бонуса
        if (Math.random() < 0.15) { // 15% шанс на небольшой отток/приток
            const randomChange = Math.floor(Math.random() * (gameState.subscribers * 0.005)) + 1; // 0.5% от текущих подписчиков
            if (Math.random() < 0.5) { // 50% шанс на отток
                finalSubscribersChange -= randomChange;
                logEvent(`Небольшой отток подписчиков (${randomChange}). Аудитория меняется.`, 'warning');
            } else { // 50% шанс на приток
                finalSubscribersChange += randomChange;
                logEvent(`Небольшой приток подписчиков (+${randomChange}). Ваша аудитория растет!`, 'success');
            }
        }

        // Расчет влияния настроения аудитории
        const moodImpact = (gameState.audienceMood - 50) / 100; // -0.5 до 0.5
        finalSubscribersChange = Math.round(finalSubscribersChange * (1 + moodImpact));
        finalIncomeChange = Math.round(finalIncomeChange * (1 + moodImpact));

        // Обновляем состояние игры
        gameState.subscribers = Math.max(0, gameState.subscribers + finalSubscribersChange); // Подписчики не могут быть меньше 0
        gameState.balance += finalIncomeChange;
        gameState.audienceMood = Math.max(0, Math.min(100, gameState.audienceMood + finalMoodChange)); // Настроение от 0 до 100
        gameState.postsMade++;

        logEvent(`Опубликован "${postType}". Подписчики: ${finalSubscribersChange >= 0 ? '+' : ''}${finalSubscribersChange}, Баланс: ${finalIncomeChange >= 0 ? '+' : ''}$${finalIncomeChange}, Настроение: ${finalMoodChange >= 0 ? '+' : ''}${finalMoodChange}.`, 'success');

        // Обновляем тренд
        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) {
            gameState.trendPostsRemaining--;
        }
        // Генерация нового тренда, если текущего нет или посты закончились
        if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) {
            if (Math.random() < 0.20) { // 20% шанс на новый тренд
                generateNewTrend();
            }
        }

        // Сброс состояния производства поста
        gameState.isPostInProduction = false;
        gameState.postProductionRemainingTime = 0;
        gameState.currentPostTypeInProduction = '';
        gameState.postProductionStartedTime = 0;

        // Сброс состояния персонажа после публикации
        setCharacterState(CHARACTER_STATES.IDLE); // Возвращаем в "бездействие" после публикации

        updateUI();
        saveGame();
        tg.HapticFeedback.notificationOccurred('success'); // Вибрация при успешной публикации

        // Можно добавить логику для похвалы/наказания персонажа в зависимости от результатов
        if (finalSubscribersChange > 8) { setCharacterState(CHARACTER_STATES.HAPPY); }
        else if (finalSubscribersChange < 0) { /* setCharacterState(CHARACTER_STATES.SAD); */ } // Если есть такое состояние
    }

    if(postTextButton) postTextButton.addEventListener('click', () => handlePostAction('Текстовый Пост'));
    if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('Мем'));
    if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('Видеоролик'));

    if(upgradeContentQualityButton) upgradeContentQualityButton.addEventListener('click', () => {
        // Стоимость берется из dataset, который обновляется функцией checkUpgradeButtonStatus
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.upgrades.contentQuality++; // Увеличиваем уровень улучшения
            // contentQualityMultiplier теперь рассчитывается динамически в finishPostProduction

            logEvent(`Качество контента улучшено до уровня ${gameState.upgrades.contentQuality}!`, 'success');
            gameState.audienceMood = Math.min(gameState.audienceMood + 2, 100);
            updateUI(); // Обновляем UI, чтобы показать изменения
            saveGame(); // Сохраняем игру
            checkUpgradeButtonStatus(); // Обновляем кнопку улучшения
            tg.HapticFeedback.impactOccurred('medium');
            setCharacterState(CHARACTER_STATES.HAPPY); // Персонаж счастлив после улучшения
            closeModal(upgradesModal);
        } else {
            logEvent("Недостаточно средств для улучшения.", 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    if (themeSelectionScreen) {
        const themeCards = themeSelectionScreen.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            card.addEventListener('click', () => {
                const selectedTheme = card.dataset.theme;
                gameState.theme = selectedTheme;
                gameState.audienceMood = 75; // Начальное настроение после выбора темы

                // Модификаторы и название канала зависят от выбранной темы
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
                        gameState.subscribers = 5; // Стартовое количество подписчиков для этой темы
                        break;
                    case 'tech':
                        gameState.themeModifiers = { text: 1.1, meme: 1.0, video: 1.3 };
                        gameState.channelName = "Техно Гуру";
                        break;
                    default:
                        gameState.themeModifiers = { text: 1, meme: 1, video: 1 };
                        gameState.channelName = "Мой Канал";
                }
                logEvent(`Выбрана тема: ${getThemeDisplayName(selectedTheme)}`, "success");
                saveGame();
                showWelcomeScreen();
            });
        });
    }
    
    showScreen(preloader);
    setTimeout(() => {
        if (preloader) {
            preloader.classList.remove('visible');
            setTimeout(() => { if(preloader) preloader.style.display = 'none'; }, 700);
        }
        initializeGameFlow(); // Запуск основного игрового процесса
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
