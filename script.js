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
                }
            },
            close: () => console.log('Telegram.WebApp.close() (заглушка)')
        };
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

    // Новые элементы для выбора идей контента
    const contentIdeasList = document.getElementById('content-ideas-list');

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
        selectedTheme: null, // Будет 'gaming', 'lifestyle', 'tech'
        gameStarted: false,
        lastActiveTime: Date.now(),
        postInProduction: null,
        contentQualityLevel: 1,
        log: [],
        gameVersion: '0.8.0' // Обновленная версия игры
    };

    let gameState = { ...initialGameState };

    // === НАСТРОЙКИ ИГРЫ (ОБНОВЛЕНО) ===
    const gameSettings = {
        preloaderDuration: 3000,
        cutsceneSlideDuration: 2500,
        energyRestoreRate: 1000 * 60 * 5, // 5 минут на 1 единицу энергии
        energyRestoreAmount: 1,
        maxEnergy: 100,
        // Базовые параметры для форматов, если нужны универсальные множители (влияют на базовые значения идей)
        formatModifiers: {
            text: { subscriberMultiplier: 0.8, earningsMultiplier: 0.7, durationMultiplier: 0.5, moodImpact: -5, icon: '✍️' },
            meme: { subscriberMultiplier: 1.0, earningsMultiplier: 0.9, durationMultiplier: 0.7, moodImpact: -8, icon: '😂' },
            video: { subscriberMultiplier: 1.2, earningsMultiplier: 1.1, durationMultiplier: 1.0, moodImpact: -12, icon: '🎥' }
        },
        audienceMoodImpact: {
            successfulPostBase: 10, // Базовое изменение настроения при успешном посте
            failedPost: -15 // Если решим позже добавить механику провала
        },
        upgradeCosts: {
            contentQuality: 50
        },
        upgradeBenefits: {
            contentQuality: {
                subscriberMultiplier: 1.15, // +15% подписчиков от качества
                earningsMultiplier: 1.1,   // +10% дохода от качества
                moodBonus: 5               // +5 к настроению аудитории от качества
            }
        },
        trends: [
            { name: "Вирусные Челленджи", bonus: { subscribers: 1.5, earnings: 1.2 }, types: ['meme', 'video'] },
            { name: "Глубокие Обзоры", bonus: { subscribers: 1.3, earnings: 1.4 }, types: ['video', 'text'] },
            { name: "Быстрые Новости", bonus: { subscribers: 1.2, earnings: 1.1 }, types: ['text', 'meme'] },
            { name: "Летсплеи и Стримы", bonus: { subscribers: 1.6, earnings: 1.3 }, types: ['video'] }, // Игровой
            { name: "DIY и Лайфхаки", bonus: { subscribers: 1.2, earnings: 1.1 }, types: ['video', 'text'] }, // Лайфстайл/Техно
            { name: "Путешествия и Влоги", bonus: { subscribers: 1.7, earnings: 1.5 }, types: ['video'] }, // Лайфстайл
            { name: "Распаковки", bonus: { subscribers: 1.4, earnings: 1.3 }, types: ['video'] } // Техно
        ],
        // === УНИКАЛЬНЫЕ ИДЕИ КОНТЕНТА ПО ТЕМАМ ===
        contentIdeas: {
            gaming: [
                {
                    id: 'game_review', name: 'Обзор новой игры', description: 'Подробный анализ свежего релиза.',
                    baseSubscribers: 15, baseEarnings: 30, energyCost: 20, baseDuration: 20,
                    formats: ['video', 'text'] // Список доступных форматов для этой идеи
                },
                {
                    id: 'boss_guide', name: 'Гайд по боссу', description: 'Помогите пройти сложного босса!',
                    baseSubscribers: 10, baseEarnings: 20, energyCost: 15, baseDuration: 12,
                    formats: ['video', 'text']
                },
                {
                    id: 'meme_compilation', name: 'Игровая подборка мемов', description: 'Смешные моменты и шутки из игр.',
                    baseSubscribers: 8, baseEarnings: 15, energyCost: 10, baseDuration: 8,
                    formats: ['meme']
                },
                {
                    id: 'live_stream', name: 'Прямой эфир с прохождением', description: 'Интерактивный стрим с вашей аудиторией.',
                    baseSubscribers: 20, baseEarnings: 40, energyCost: 25, baseDuration: 30, // Более долгое производство
                    formats: ['video']
                }
            ],
            lifestyle: [
                {
                    id: 'daily_vlog', name: 'Мой день из жизни', description: 'Покажите, как проходит ваш обычный день.',
                    baseSubscribers: 12, baseEarnings: 25, energyCost: 18, baseDuration: 18,
                    formats: ['video', 'text']
                },
                {
                    id: 'fashion_tips', name: 'Советы по стилю', description: 'Поделитесь модными рекомендациями.',
                    baseSubscribers: 9, baseEarnings: 18, energyCost: 12, baseDuration: 10,
                    formats: ['text', 'meme']
                },
                {
                    id: 'travel_story', name: 'Рассказ о путешествии', description: 'Поделитесь впечатлениями и советами из поездки.',
                    baseSubscribers: 18, baseEarnings: 35, energyCost: 25, baseDuration: 25,
                    formats: ['video']
                },
                {
                    id: 'cooking_recipe', name: 'Кулинарный рецепт', description: 'Приготовьте что-то вкусное для подписчиков.',
                    baseSubscribers: 10, baseEarnings: 20, energyCost: 15, baseDuration: 15,
                    formats: ['video', 'text']
                }
            ],
            tech: [
                {
                    id: 'gadget_review', name: 'Обзор нового гаджета', description: 'Всесторонний анализ новой техники.',
                    baseSubscribers: 20, baseEarnings: 40, energyCost: 25, baseDuration: 25,
                    formats: ['video', 'text']
                },
                {
                    id: 'software_guide', name: 'Гайд по ПО', description: 'Полезные советы и хитрости по использованию программ.',
                    baseSubscribers: 10, baseEarnings: 22, energyCost: 15, baseDuration: 15,
                    formats: ['text', 'video']
                },
                {
                    id: 'tech_news_digest', name: 'Дайджест тех. новостей', description: 'Коротко о главном в мире технологий.',
                    baseSubscribers: 7, baseEarnings: 12, energyCost: 8, baseDuration: 7,
                    formats: ['text', 'meme']
                },
                {
                    id: 'pc_build_guide', name: 'Сборка ПК', description: 'Пошаговый гайд по сборке компьютера.',
                    baseSubscribers: 25, baseEarnings: 50, energyCost: 30, baseDuration: 35,
                    formats: ['video']
                }
            ]
        }
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
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Уровень ${gameState.contentQualityLevel + 1}): $${upgradeCost}`;
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

        // Удаляем все классы состояний и анимаций перед добавлением нового
        characterEl.classList.remove(
            'char-state-idle', 'char-state-happy', 'char-state-typing', 'char-state-sleeping',
            'char-anim-idle-blink', 'bounce', 'typing-animation', 'fade-in-out' // Удаляем классы анимаций тоже
        );

        switch (state) {
            case 'idle':
                characterEl.classList.add('char-state-idle', 'char-anim-idle-blink');
                break;
            case 'happy':
                characterEl.classList.add('char-state-happy', 'bounce');
                if (duration === 0) { // Если не указана длительность, возвращаемся в idle через 2 секунды
                    characterStateTimeout = setTimeout(() => updateCharacterState('idle'), 2000);
                }
                break;
            case 'typing':
                characterEl.classList.add('char-state-typing', 'typing-animation');
                if (duration > 0) {
                    characterStateTimeout = setTimeout(() => updateCharacterState('idle'), duration * 1000);
                }
                break;
            case 'sleeping':
                characterEl.classList.add('char-state-sleeping', 'fade-in-out');
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
        li.textContent = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${message}`;
        li.classList.add(`log-${type}`);
        eventLogList.prepend(li); // Добавляем в начало списка

        // Ограничиваем количество записей в логе
        gameState.log.unshift({ message, type, timestamp: Date.now() }); // Добавляем в начало массива
        if (gameState.log.length > 50) {
            gameState.log.pop(); // Удаляем старейшую запись из массива
        }
        // Также удаляем старейший элемент из DOM, если их слишком много
        while (eventLogList.children.length > 50) {
            eventLogList.removeChild(eventLogList.lastChild);
        }
        saveGameState();
    }


    // === Игровые механики ===

    function generateRandomTrend() {
        const randomIndex = Math.floor(Math.random() * gameSettings.trends.length);
        currentTrend = gameSettings.trends[randomIndex];
        addLogEntry(`Новый тренд: "${currentTrend.name}"!`, 'info');
        updateUI();
        if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }

    function startTrendCycle() {
        console.log('Starting trend cycle.');
        if (trendInterval) {
            clearInterval(trendInterval);
        }
        // Меняем тренд каждые 1-3 минуты
        const trendChangeTime = (Math.random() * 2 + 1) * 60 * 1000;
        trendInterval = setInterval(generateRandomTrend, trendChangeTime);
        // Генерируем первый тренд сразу при старте цикла
        generateRandomTrend();
    }


    function restoreEnergy() {
        if (gameState.energy < gameSettings.maxEnergy) {
            gameState.energy = Math.min(gameSettings.maxEnergy, gameState.energy + gameSettings.energyRestoreAmount);
            updateUI();
        }
    }

    function startEnergyRestoreCycle() {
        console.log('Starting energy restore cycle.');
        setInterval(restoreEnergy, gameSettings.energyRestoreRate);
    }

    function calculateOfflineProgress() {
        console.log('Calculating offline progress...');
        const now = Date.now();
        const timeOffline = now - (gameState.lastActiveTime || now);
        if (timeOffline > 0) {
            const energyRestored = Math.floor(timeOffline / gameSettings.energyRestoreRate) * gameSettings.energyRestoreAmount;
            if (energyRestored > 0) {
                gameState.energy = Math.min(gameSettings.maxEnergy, gameState.energy + energyRestored);
                addLogEntry(`Восстановлено ${energyRestored} энергии пока вы отсутствовали.`, 'info');
            }
        }
        gameState.lastActiveTime = now;
        saveGameState();
    }


    // === НОВАЯ ЛОГИКА СОЗДАНИЯ ПОСТА ===
    function populateContentIdeas() {
        if (!contentIdeasList) {
            console.error('contentIdeasList element not found.');
            return;
        }
        contentIdeasList.innerHTML = ''; // Очищаем список
        const ideasForTheme = gameSettings.contentIdeas[gameState.selectedTheme];

        if (!ideasForTheme || ideasForTheme.length === 0) {
            contentIdeasList.innerHTML = '<p class="placeholder-text">Для вашей темы пока нет идей контента. Это странно!</p>';
            console.warn(`No content ideas found for theme: ${gameState.selectedTheme}`);
            return;
        }

        ideasForTheme.forEach(idea => {
            const button = document.createElement('button');
            button.className = 'content-idea-button';
            
            // Выбираем первый доступный формат для отображения его иконки и базовых затрат/длительности.
            // В будущем здесь можно добавить выбор формата.
            const defaultFormatType = idea.formats[0]; // Берем первый формат
            const formatMod = gameSettings.formatModifiers[defaultFormatType];

            // Рассчитываем отображаемые затраты и длительность с учетом формата
            const displayEnergyCost = idea.energyCost; // Энергия берется от идеи
            const displayDuration = Math.round(idea.baseDuration * formatMod.durationMultiplier);

            button.innerHTML = `
                <div class="idea-icon">${formatMod.icon}</div>
                <div class="idea-details">
                    <h3>${idea.name}</h3>
                    <p>${idea.description}</p>
                    <span class="idea-cost">Энергия: ${displayEnergyCost}⚡</span>
                    <span class="idea-duration">Длительность: ~${displayDuration}сек</span>
                </div>
            `;
            button.dataset.ideaId = idea.id;
            button.dataset.formatType = defaultFormatType; // Сохраняем выбранный формат

            // Проверяем, достаточно ли энергии для создания поста
            button.disabled = gameState.energy < displayEnergyCost;
            if (button.disabled) {
                 button.title = 'Недостаточно энергии!';
            }

            button.addEventListener('click', () => {
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                startContentProduction(idea.id, defaultFormatType); // Передаем и идею, и выбранный формат
            });
            contentIdeasList.appendChild(button);
        });
        // Добавим стили для этих кнопок в style.css
    }

    // startContentProduction теперь принимает ideaId И formatType
    function startContentProduction(ideaId, formatType) {
        console.log(`Attempting to start content production for idea: ${ideaId}, format: ${formatType}`);
        if (gameState.postInProduction) {
            addLogEntry('Нельзя создать новый пост, пока предыдущий в производстве!', 'warning');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
            return;
        }

        const idea = gameSettings.contentIdeas[gameState.selectedTheme].find(i => i.id === ideaId);
        if (!idea) {
            console.error(`Idea with ID "${ideaId}" not found for theme "${gameState.selectedTheme}".`);
            addLogEntry('Ошибка: Неизвестная идея контента.', 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }
        
        // Проверяем, поддерживает ли идея выбранный формат
        if (!idea.formats.includes(formatType)) {
            console.error(`Idea "${ideaId}" does not support format "${formatType}".`);
            addLogEntry(`Ошибка: Идея "${idea.name}" не поддерживает формат "${formatType}".`, 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        const formatMod = gameSettings.formatModifiers[formatType];
        if (!formatMod) {
            console.error(`Format modifiers for "${formatType}" not found.`);
            addLogEntry('Ошибка: Неизвестный формат контента.', 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        const energyRequired = idea.energyCost;
        if (gameState.energy < energyRequired) {
            addLogEntry('Недостаточно энергии для создания этой идеи!', 'error');
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            return;
        }

        gameState.energy -= energyRequired;
        updateUI();
        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

        // Расчет финальных значений с учетом идеи, формата и качества контента
        let productionDuration = Math.round(idea.baseDuration * formatMod.durationMultiplier);
        let finalSubscribers = Math.round(idea.baseSubscribers * formatMod.subscriberMultiplier);
        let finalEarnings = Math.round(idea.baseEarnings * formatMod.earningsMultiplier);
        let moodChange = formatMod.moodImpact; // Базовый эффект настроения от формата


        // Применяем модификаторы качества контента (если уровень > 1)
        if (gameState.contentQualityLevel > 1) {
            const qualityBenefit = gameSettings.upgradeBenefits.contentQuality;
            finalSubscribers = Math.round(finalSubscribers * qualityBenefit.subscriberMultiplier);
            finalEarnings = Math.round(finalEarnings * qualityBenefit.earningsMultiplier);
            moodChange += qualityBenefit.moodBonus;
        }

        gameState.postInProduction = {
            ideaId: idea.id,
            formatType: formatType,
            duration: productionDuration,
            timeLeft: productionDuration,
            timer: null,
            results: { // Сохраняем уже рассчитанные результаты для завершения поста
                subscribers: finalSubscribers,
                earnings: finalEarnings,
                moodChange: moodChange // Изменено на moodChange для ясности
            }
        };
        saveGameState();

        if (postTypeInProduction) postTypeInProduction.textContent = `${idea.name} (${formatType})`; // Отображаем название идеи и формат
        if (postProductionStatus) postProductionStatus.style.display = 'block';
        if (createPostButton) createPostButton.disabled = true;
        updateCharacterState('typing', productionDuration);

        const startTime = Date.now();
        gameState.postInProduction.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            gameState.postInProduction.timeLeft = Math.max(0, productionDuration - elapsed);

            if (gameState.postInProduction.timeLeft <= 0) {
                clearInterval(gameState.postInProduction.timer);
                completePost(gameState.postInProduction.ideaId, gameState.postInProduction.formatType, gameState.postInProduction.results);
            } else {
                if (postProductionTimeRemaining) postProductionTimeRemaining.textContent = gameState.postInProduction.timeLeft;
                const progress = ((productionDuration - gameState.postInProduction.timeLeft) / productionDuration) * 100;
                if (postProductionProgressFill) updateProgressBar(postProductionProgressFill, progress);
            }
        }, 1000);

        addLogEntry(`Начато создание "${idea.name}" в формате ${formatType}.`, 'info');
        if (createPostModal) hideModal(createPostModal);
    }

    // `completePost` теперь принимает ideaId, formatType, и pre-calculated results
    function completePost(ideaId, formatType, results) {
        console.log(`Completing post for idea: ${ideaId}, format: ${formatType}`);
        const idea = gameSettings.contentIdeas[gameState.selectedTheme].find(i => i.id === ideaId);
        if (!idea) {
            console.error(`Idea with ID "${ideaId}" not found during completion.`);
            addLogEntry('Ошибка: Не удалось завершить пост (идея не найдена).', 'error');
            return;
        }

        let gainedSubscribers = results.subscribers;
        let gainedEarnings = results.earnings;
        let moodChange = results.moodChange; // Используем рассчитанное изменение настроения

        // Применяем тренды
        if (currentTrend && currentTrend.types.includes(formatType)) { // Используем 'types'
            gainedSubscribers = Math.round(gainedSubscribers * currentTrend.bonus.subscribers);
            gainedEarnings = Math.round(gainedEarnings * currentTrend.bonus.earnings);
            addLogEntry(`Пост "${idea.name}" в тренде "${currentTrend.name}"! Получены бонусы.`, 'success');
        }

        // Применяем базовый бонус за успешный пост
        moodChange += gameSettings.audienceMoodImpact.successfulPostBase;

        gameState.subscribers += gainedSubscribers;
        gameState.balance += gainedEarnings;
        gameState.audienceMood = Math.max(0, Math.min(100, gameState.audienceMood + moodChange));

        addLogEntry(`"${idea.name}" (${formatType}) завершен! +${gainedSubscribers} подписчиков, +$${gainedEarnings}. Настроение: ${getMoodText(gameState.audienceMood)} (${moodChange > 0 ? '+' : ''}${moodChange}).`, 'success');
        if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
            tg.HapticFeedback.notificationOccurred('success');
        }

        gameState.postInProduction = null;
        if (postProductionStatus) postProductionStatus.style.display = 'none';
        if (createPostButton) createPostButton.disabled = false;
        updateCharacterState('happy'); // Персонаж счастлив после успешного поста

        saveGameState();
        updateUI();
    }

    function upgradeContentQuality() {
        console.log('Attempting to upgrade content quality.');
        const cost = gameSettings.upgradeCosts.contentQuality;
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.contentQualityLevel++;
            gameSettings.upgradeCosts.contentQuality = Math.round(cost * 1.5); // Увеличиваем стоимость следующего улучшения
            addLogEntry(`Качество контента улучшено до уровня ${gameState.contentQualityLevel}!`, 'success');
            if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
                tg.HapticFeedback.notificationOccurred('success');
            }
            saveGameState();
            updateUI();
        } else {
            addLogEntry('Недостаточно средств для улучшения качества контента.', 'error');
            if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
                tg.HapticFeedback.notificationOccurred('error');
            }
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
                // Сначала берем initialGameState, затем накладываем сохраненные данные.
                // Это гарантирует, что новые поля будут инициализированы, если их нет в старом сохранении.
                gameState = { ...initialGameState, ...parsedState };

                // Проверка версии для миграции
                if (parsedState.gameVersion !== initialGameState.gameVersion) {
                    console.log(`Game version mismatch. Loaded: ${parsedState.gameVersion || 'older'}, Current: ${initialGameState.gameVersion}. Applying migration logic if any.`);
                    // Пример миграции: если в старой версии не было contentQualityLevel
                    if (!parsedState.contentQualityLevel) {
                        gameState.contentQualityLevel = 1;
                        addLogEntry('Обновлены игровые данные до новой версии.', 'info');
                    }
                    // Обновляем версию игры в сохраненном состоянии до текущей
                    gameState.gameVersion = initialGameState.gameVersion;
                    saveGameState(); // Сразу сохраняем обновленное состояние
                }

                // Восстановление лога
                if (parsedState.log && Array.isArray(parsedState.log)) {
                    // Ограничиваем количество записей при загрузке, если их слишком много
                    gameState.log = parsedState.log.slice(0, 50);
                    // Добавляем записи в DOM
                    gameState.log.forEach(entry => {
                        const li = document.createElement('li');
                        // Форматируем время при отображении, если в логе только timestamp
                        const date = new Date(entry.timestamp);
                        li.textContent = `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${entry.message}`;
                        li.classList.add(`log-${entry.type}`);
                        eventLogList.prepend(li);
                    });
                }


                // Если есть пост в производстве, восстанавливаем его таймер
                if (gameState.postInProduction && gameState.postInProduction.timeLeft > 0) {
                    // Рассчитываем, сколько времени прошло с момента последнего сохранения
                    const timePassedSinceLastSave = (Date.now() - (gameState.lastActiveTime || Date.now())) / 1000;
                    gameState.postInProduction.timeLeft = Math.max(0, gameState.postInProduction.timeLeft - timePassedSinceLastSave);
                    console.log(`Post in production found. Time left: ${gameState.postInProduction.timeLeft}s`);

                    if (gameState.postInProduction.timeLeft <= 0) {
                        console.log('Post completed offline.');
                        // Убедимся, что все необходимые данные для completePost присутствуют
                        // Если в старом сохранении не было results, нужно их рассчитать или добавить дефолт
                        if (!gameState.postInProduction.results) {
                            const idea = gameSettings.contentIdeas[gameState.selectedTheme]?.find(i => i.id === gameState.postInProduction.ideaId);
                            const formatMod = gameSettings.formatModifiers[gameState.postInProduction.formatType];
                            if (idea && formatMod) {
                                let finalSubscribers = Math.round(idea.baseSubscribers * formatMod.subscriberMultiplier);
                                let finalEarnings = Math.round(idea.baseEarnings * formatMod.earningsMultiplier);
                                let moodChange = formatMod.moodImpact;
                                if (gameState.contentQualityLevel > 1) {
                                    const qualityBenefit = gameSettings.upgradeBenefits.contentQuality;
                                    finalSubscribers = Math.round(finalSubscribers * qualityBenefit.subscriberMultiplier);
                                    finalEarnings = Math.round(finalEarnings * qualityBenefit.earningsMultiplier);
                                    moodChange += qualityBenefit.moodBonus;
                                }
                                gameState.postInProduction.results = {
                                    subscribers: finalSubscribers,
                                    earnings: finalEarnings,
                                    moodChange: moodChange
                                };
                            } else {
                                console.error('Could not reconstruct post results during offline completion. Defaulting to 0.');
                                gameState.postInProduction.results = { subscribers: 0, earnings: 0, moodChange: 0 };
                            }
                        }
                        completePost(gameState.postInProduction.ideaId, gameState.postInProduction.formatType, gameState.postInProduction.results);
                    } else {
                        // Возобновляем таймер с оставшимся временем
                        startPostProductionTimer(
                            gameState.postInProduction.ideaId,
                            gameState.postInProduction.formatType,
                            gameState.postInProduction.duration, // Оригинальная длительность
                            gameState.postInProduction.results,
                            gameState.postInProduction.timeLeft
                        );
                    }
                }
                addLogEntry('Состояние игры загружено.', 'info');
                console.log('Game state loaded:', gameState);
            } else {
                console.log('No saved game state found. Starting new game.');
                addLogEntry('Начинаем новую игру (сохраненных данных нет).', 'info');
                gameState = { ...initialGameState };
            }
        } catch (e) {
            console.error('Error loading or parsing game state from Local Storage:', e);
            addLogEntry('Ошибка загрузки игры. Начинаем новую игру.', 'error');
            localStorage.removeItem('channelControlGameState'); // Очищаем битое сохранение
            gameState = { ...initialGameState };
        }
    }

    // startPostProductionTimer теперь принимает больше аргументов для корректного восстановления
    function startPostProductionTimer(ideaId, formatType, originalDuration, results, timeLeft) {
        if (!gameState.postInProduction) {
            gameState.postInProduction = {};
        }
        gameState.postInProduction.ideaId = ideaId;
        gameState.postInProduction.formatType = formatType;
        gameState.postInProduction.duration = originalDuration; // Сохраняем оригинальную длительность для расчета прогресса
        gameState.postInProduction.timeLeft = timeLeft;
        gameState.postInProduction.results = results; // Сохраняем результаты
        
        if (postTypeInProduction) {
            const idea = gameSettings.contentIdeas[gameState.selectedTheme]?.find(i => i.id === ideaId);
            postTypeInProduction.textContent = idea ? `${idea.name} (${formatType})` : 'Пост';
        }
        if (postProductionStatus) postProductionStatus.style.display = 'block';
        if (createPostButton) createPostButton.disabled = true;
        updateCharacterState('typing', timeLeft);

        // Если timeLeft уже 0 или меньше, не запускаем таймер, а сразу завершаем
        if (timeLeft <= 0) {
            completePost(ideaId, formatType, results);
            return;
        }

        const startTime = Date.now() - (originalDuration - timeLeft) * 1000; // Корректное startTime для возобновления
        gameState.postInProduction.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            gameState.postInProduction.timeLeft = Math.max(0, originalDuration - elapsed);

            if (gameState.postInProduction.timeLeft <= 0) {
                clearInterval(gameState.postInProduction.timer);
                completePost(ideaId, formatType, results); // Передаем все нужные данные
            } else {
                if (postProductionTimeRemaining) postProductionTimeRemaining.textContent = gameState.postInProduction.timeLeft;
                const progress = ((originalDuration - gameState.postInProduction.timeLeft) / originalDuration) * 100;
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
        if (tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
            tg.HapticFeedback.impactOccurred('medium');
        }
        // Показываем кнопку "Назад" Telegram при открытии модалки
        if (tg.BackButton && typeof tg.BackButton.show === 'function') {
            tg.BackButton.show();
        }

        // Если это модалка создания поста, заполняем ее идеями
        if (modalElement === createPostModal) {
            populateContentIdeas();
        }
    }

    function hideModal(modalElement) {
        if (!modalElement) {
            console.error('hideModal received a null element.');
            return;
        }
        modalElement.classList.remove('visible');
        setTimeout(() => modalElement.style.display = 'none', 300);
        if (tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
            tg.HapticFeedback.impactOccurred('light');
        }
        // Если нет других открытых модалок и мы в студии, можно скрыть BackButton
        // Или оставить ее постоянно видимой, если так задумано
        if (!isAnyModalOpen() && studioContainer && studioContainer.classList.contains('visible') && tg.BackButton && typeof tg.BackButton.hide === 'function') {
            // tg.BackButton.hide(); // можно раскомментировать, если хотите скрывать кнопку "Назад" в студии без модалок
        }
    }

    function isAnyModalOpen() {
        return (createPostModal && createPostModal.classList.contains('visible')) ||
               (upgradesModal && upgradesModal.classList.contains('visible')) ||
               (logModal && logModal.classList.contains('visible'));
    }


    // === Инициализация игры ===
    function initGame() {
        console.log('initGame started.');
        if (tg) {
            if (typeof tg.ready === 'function') tg.ready();
            if (typeof tg.expand === 'function') tg.expand();

            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                const user = tg.initDataUnsafe.user;
                if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = user.username || user.first_name || 'Дорогой Игрок';
                if (user.photo_url && userPhotoEl) {
                    userPhotoEl.src = user.photo_url;
                } else if (userPhotoEl) {
                    userPhotoEl.src = 'placeholder-avatar.png';
                }
            } else {
                console.warn('Telegram user data not available or incomplete in initDataUnsafe. Using placeholder.');
                if (telegramUsernameDisplay) telegramUsernameDisplay.textContent = 'Дорогой Игрок';
                if (userPhotoEl) userPhotoEl.src = 'placeholder-avatar.png';
            }
        } else {
            console.warn('Telegram WebApp object is not available.');
        }

        if (gameVersionEl) {
            gameVersionEl.textContent = `v${initialGameState.gameVersion}`; // Используем версию из initialGameState
        }

        loadGameState(); // Загрузка состояния игры

        if (!gameState.gameStarted) {
            console.log('Game not started yet. Showing theme selection screen.');
            showScreen(themeSelectionScreen);
            // Скрываем BackButton, если начинаем с выбора темы (там обычно нет возврата)
            if (tg && tg.BackButton && typeof tg.BackButton.hide === 'function') {
                tg.BackButton.hide();
            }
        } else {
            console.log('Game already started. Showing studio container.');
            showScreen(studioContainer);
            updateUI();
            startTrendCycle();
            startEnergyRestoreCycle();
            calculateOfflineProgress();
            // Показываем BackButton только когда мы уже в "студии" или на других основных экранах
            if (tg && tg.BackButton && typeof tg.BackButton.show === 'function') {
                tg.BackButton.show();
            }
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
            preloader.addEventListener('transitionend', () => {
                initGame();
            }, { once: true });
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
                if (tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
                    tg.HapticFeedback.impactOccurred('light');
                }
            });
        });

        if (selectThemeButton) {
            selectThemeButton.addEventListener('click', () => {
                if (gameState.selectedTheme) {
                    addLogEntry(`Выбрана тема: ${gameState.selectedTheme}.`, 'info');
                    showScreen(welcomeScreen);
                    if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
                        tg.HapticFeedback.notificationOccurred('success');
                    }
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
            if (tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
                tg.HapticFeedback.impactOccurred('medium');
            }
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
            if (tg && tg.BackButton && typeof tg.BackButton.show === 'function') {
                tg.BackButton.show(); // Показываем кнопку "Назад" при переходе в студию
            }
            return;
        }

        currentSlideIndex = 0;
        // Скрываем кнопку "Вперед, к Студии!" в начале катсцены
        if (continueToStudioButton) {
            continueToStudioButton.style.display = 'none';
            continueToStudioButton.classList.remove('visible'); // Убедиться, что класс тоже удален
        }

        showCutsceneSlide(currentSlideIndex);

        const cutsceneTimer = setInterval(() => {
            currentSlideIndex++;
            console.log(`Cutscene: advancing to slide index ${currentSlideIndex}`);
            if (currentSlideIndex < cutsceneSlides.length) {
                showCutsceneSlide(currentSlideIndex);
                // Если это последний слайд (где должна быть кнопка)
                if (currentSlideIndex === cutsceneSlides.length - 1) {
                    console.log('Cutscene: Reached last slide, showing continue button.');
                    if (continueToStudioButton) {
                        continueToStudioButton.style.display = 'block';
                        setTimeout(() => {
                            if (continueToStudioButton) continueToStudioButton.classList.add('visible');
                        }, 50);
                    }
                    clearInterval(cutsceneTimer); // Очищаем таймер, так как дошли до конца
                }
            } else {
                clearInterval(cutsceneTimer);
                console.warn('Cutscene: Timer finished, but continue button might not have appeared. Forcing display.');
                if (continueToStudioButton && continueToStudioButton.style.display === 'none') {
                     continueToStudioButton.style.display = 'block';
                     setTimeout(() => {
                        if (continueToStudioButton) continueToStudioButton.classList.add('visible');
                    }, 50);
                }
            }
        }, gameSettings.cutsceneSlideDuration);
    }

    function showCutsceneSlide(index) {
        cutsceneSlides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
        console.log(`Cutscene: Showing slide ${index + 1}/${cutsceneSlides.length}`);
    }


    // Переход в студию из катсцены
    if (continueToStudioButton) {
        continueToStudioButton.addEventListener('click', () => {
            showScreen(studioContainer);
            updateUI();
            startTrendCycle();
            startEnergyRestoreCycle();
            if (tg && tg.BackButton && typeof tg.BackButton.show === 'function') {
                tg.BackButton.show();
            }
            if (tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
                tg.HapticFeedback.impactOccurred('medium');
            }
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

    // Действие по улучшению качества контента
    if (upgradeContentQualityButton) {
        upgradeContentQualityButton.addEventListener('click', upgradeContentQuality);
    }

    // Привязываем функцию к кнопке "Назад" Telegram Web App
    if (tg.BackButton && typeof tg.BackButton.onClick === 'function') {
        tg.BackButton.onClick(() => {
            console.log('Telegram BackButton clicked.');
            // Логика закрытия модалок
            if (createPostModal && createPostModal.classList.contains('visible')) {
                hideModal(createPostModal);
                return;
            }
            if (upgradesModal && upgradesModal.classList.contains('visible')) {
                hideModal(upgradesModal);
                return;
            }
            if (logModal && logModal.classList.contains('visible')) {
                hideModal(logModal);
                return;
            }

            // Логика навигации между экранами
            if (welcomeScreen && welcomeScreen.classList.contains('visible')) {
                showScreen(themeSelectionScreen);
                // Если переходим назад к выбору темы, скрываем BackButton, т.к. там он обычно не нужен
                if (tg.BackButton && typeof tg.BackButton.hide === 'function') {
                    tg.BackButton.hide();
                }
                return;
            }
            if (cutsceneScreen && cutsceneScreen.classList.contains('visible')) {
                if (currentSlideIndex > 0) {
                    currentSlideIndex--;
                    showCutsceneSlide(currentSlideIndex);
                    // Если вернулись со "Шага 4" на "Шаг 3", скрываем кнопку "Продолжить"
                    if (continueToStudioButton) continueToStudioButton.style.display = 'none';
                } else {
                    showScreen(welcomeScreen);
                }
                return;
            }
            // Если мы в студии и нет открытых модалок
            if (studioContainer && studioContainer.classList.contains('visible')) {
                 console.log('Пользователь нажал "Назад" в студии. Ничего не происходит (или можно предложить закрыть).');
                 if (tg.HapticFeedback && typeof tg.HapticFeedback.notificationOccurred === 'function') {
                     tg.HapticFeedback.notificationOccurred('error');
                 }
                 // tg.close(); // Можно раскомментировать, если хотите, чтобы кнопка "Назад" закрывала приложение из студии
                 return;
            }

            // Если никакой активный экран или модалка не были обработаны, можно попробовать закрыть
            if (tg && typeof tg.close === 'function') {
                // tg.close();
            }
        });
    } else {
        console.warn('Telegram BackButton API not fully available or onClick not a function.');
    }


    // Сохраняем состояние при закрытии или перезагрузке
    window.addEventListener('beforeunload', saveGameState);
});
