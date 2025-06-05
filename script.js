document.addEventListener('DOMContentLoaded', () => {
    // --- Заглушка Telegram WebApp API для отладки ---\
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
                offClick: (callback) => console.log('BackButton offClick (заглушка)')
            }
        };
    } else {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand(); // Расширяем приложение на весь экран
        tg.BackButton.onClick(() => {
            // В зависимости от текущего экрана, можно вернуться назад или закрыть приложение
            if (gameState.currentScreen !== 'main-dashboard-screen') {
                showScreen('main-dashboard-screen');
                tg.BackButton.hide();
            } else {
                tg.close();
            }
        });
        tg.BackButton.hide(); // Скрываем кнопку назад по умолчанию
    }

    // --- Глобальное состояние игры ---\
    let gameState = {
        currentScreen: 'preloader-screen',
        user: {
            username: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : 'Unknown',
            firstName: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name : 'Пользователь',
            photoUrl: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.photo_url : 'assets/placeholder-avatar.png'
        },
        stats: {
            subscribers: 0,
            money: 0,
            incomePerClick: 1, // Доход за клик
            incomePerSecond: 0, // Доход в секунду (от пассивных источников)
            energy: 100, // Энергия для кликов
            maxEnergy: 100,
            energyRechargeRate: 1, // Скорость восстановления энергии в секунду
            views: 0,
            likes: 0,
            reposts: 0,
            comments: 0
        },
        channel: {
            theme: '',
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            prestigeLevel: 0
        },
        upgrades: {}, // Здесь будут храниться купленные апгрейды
        items: {}, // Купленные предметы
        achievements: {} // Достижения
    };

    // --- Элементы UI ---
    const preloaderScreen = document.getElementById('preloader-screen');
    const preloaderProgressBarFill = document.querySelector('.preloader-progress-bar-fill');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    const mainDashboardScreen = document.getElementById('main-dashboard-screen');
    const clickerScreen = document.getElementById('clicker-screen');
    const subscribersDisplay = document.getElementById('subscribers-display');
    const moneyDisplay = document.getElementById('money-display');
    const incomePerSecondDisplay = document.getElementById('income-per-second-display');
    const incomePerClickDisplay = document.getElementById('income-per-click-display');
    const energyDisplay = document.getElementById('energy-display');
    const levelDisplay = document.getElementById('level-display');
    const xpDisplay = document.getElementById('xp-display');
    const xpProgressBarFill = document.getElementById('xp-progress-bar-fill');
    const clickerButton = document.getElementById('clicker-button');
    const userNameDisplay = document.getElementById('user-name');
    const userAvatarDisplay = document.getElementById('user-avatar');

    // Модальное окно
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = document.querySelector('.close-modal-button');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');

    // --- Функции UI ---\
    function showScreen(screenId, hideBackButton = false) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('visible');
        });
        document.getElementById(screenId).classList.add('visible');
        gameState.currentScreen = screenId;
        saveGameState(); // Сохраняем текущий экран при смене

        if (tg.BackButton) {
            if (screenId !== 'main-dashboard-screen' && !hideBackButton) {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }
    }

    function updateUI() {
        // Убедитесь, что все числовые значения корректно отображаются
        subscribersDisplay.textContent = formatNumber(gameState.stats.subscribers);
        moneyDisplay.textContent = formatMoney(gameState.stats.money);
        incomePerSecondDisplay.textContent = formatMoney(gameState.stats.incomePerSecond);
        incomePerClickDisplay.textContent = formatMoney(gameState.stats.incomePerClick);
        energyDisplay.textContent = `${Math.floor(gameState.stats.energy)} / ${gameState.stats.maxEnergy}`; // Энергия может быть дробной, но отображаем целую
        levelDisplay.textContent = gameState.channel.level;
        xpDisplay.textContent = `${Math.floor(gameState.channel.experience)} / ${gameState.channel.experienceToNextLevel} XP`; // Опыт тоже округляем
        xpProgressBarFill.style.width = `${(gameState.channel.experience / gameState.channel.experienceToNextLevel) * 100}%`;

        userNameDisplay.textContent = gameState.user.firstName;
        userAvatarDisplay.src = gameState.user.photoUrl;

        // Обновление состояния кнопки кликера
        if (gameState.stats.energy <= 0) {
            clickerButton.classList.add('disabled');
            clickerButton.disabled = true;
        } else {
            clickerButton.classList.remove('disabled');
            clickerButton.disabled = false;
        }
    }

    function formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(0); // Целые числа для подписчиков
    }

    function formatMoney(num) {
        // Округляем до 2 знаков после запятой для денег
        return num.toFixed(2) + ' ₽';
    }


    function showModal(title, contentHtml, actions = []) {
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;
        modalActions.innerHTML = ''; // Очищаем предыдущие кнопки

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `btn ${action.className || ''}`;
            button.textContent = action.text;
            button.onclick = action.onClick;
            modalActions.appendChild(button);
        });

        modalOverlay.classList.remove('hidden');
        // Добавляем эффект пульсации на кнопки модального окна
        modalActions.querySelectorAll('.btn').forEach(btn => {
            btn.style.animation = 'pulse-pink 0.8s infinite alternate';
        });

        // Добавляем обработчик для закрытия по клику вне модального окна
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        };
    }

    function hideModal() {
        modalOverlay.classList.add('hidden');
        modalOverlay.onclick = null; // Удаляем обработчик
        // Удаляем анимацию пульсации
        modalActions.querySelectorAll('.btn').forEach(btn => {
            btn.style.animation = '';
        });
    }

    closeModalButton.addEventListener('click', hideModal);

    // --- Игровая логика ---\

    // Функция для получения случайного числа в заданном диапазоне
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Клик по кнопке "Снимать видео"
    clickerButton.addEventListener('click', () => {
        if (gameState.stats.energy <= 0) {
            tg.HapticFeedback.notificationOccurred('error');
            showModal('Нет энергии', 'У вас недостаточно энергии, чтобы снять видео. Подождите, пока энергия восстановится, или используйте бустеры.', [
                { text: 'ОК', onClick: hideModal }
            ]);
            return;
        }

        // Уменьшаем энергию, гарантируя, что она не станет отрицательной
        gameState.stats.energy = Math.max(0, gameState.stats.energy - 1);
        tg.HapticFeedback.impactOccurred('light');

        // Увеличиваем деньги и подписчиков на основе incomePerClick
        gameState.stats.money += gameState.stats.incomePerClick;
        // Добавляем случайное количество подписчиков за клик
        gameState.stats.subscribers += getRandomInt(1, 5); // Пример: от 1 до 5 подписчиков за клик

        // Добавляем опыт за клик (например, 1 XP за клик)
        gainExperience(1);

        updateUI();
        saveGameState();
    });

    // Пассивный доход и восстановление энергии (каждую секунду)
    setInterval(() => {
        // Восстановление энергии
        if (gameState.stats.energy < gameState.stats.maxEnergy) {
            gameState.stats.energy = Math.min(gameState.stats.maxEnergy, gameState.stats.energy + gameState.stats.energyRechargeRate);
        }

        // Пассивный доход
        gameState.stats.money += gameState.stats.incomePerSecond;

        updateUI();
        saveGameState(); // Сохраняем состояние каждую секунду
    }, 1000);

    // Система опыта и уровней
    function gainExperience(amount) {
        gameState.channel.experience += amount;
        if (gameState.channel.experience >= gameState.channel.experienceToNextLevel) {
            levelUp();
        }
    }

    function levelUp() {
        gameState.channel.level++;
        gameState.channel.experience = gameState.channel.experience - gameState.channel.experienceToNextLevel; // Оставшийся опыт
        gameState.channel.experienceToNextLevel = Math.floor(gameState.channel.experienceToNextLevel * 1.5); // Увеличиваем требуемый опыт
        // При повышении уровня можно давать бонусы, например, увеличить доход за клик
        gameState.stats.incomePerClick = parseFloat((gameState.stats.incomePerClick * 1.1).toFixed(2)); // Увеличиваем доход за клик на 10%
        gameState.stats.maxEnergy += 10; // Увеличиваем максимальную энергию
        gameState.stats.energy = gameState.stats.maxEnergy; // Полное восстановление энергии при уровне
        tg.HapticFeedback.notificationOccurred('success');
        showModal('Повышение уровня!', `Поздравляем! Ваш канал достиг уровня ${gameState.channel.level}!`, [
            { text: 'Отлично!', onClick: hideModal }
        ]);
        updateUI();
        saveGameState();
    }


    // --- Выбор темы канала ---\
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            // Удаляем активный класс со всех карточек
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
            // Добавляем активный класс к выбранной карточке
            card.classList.add('active');
            // Сохраняем выбранную тему
            gameState.channel.theme = card.dataset.theme;
            tg.HapticFeedback.impactOccurred('light');
        });
    });

    // Кнопка "Начать игру" после выбора темы
    document.getElementById('start-game-button').addEventListener('click', () => {
        if (gameState.channel.theme) {
            showScreen('main-dashboard-screen');
            tg.HapticFeedback.notificationOccurred('success');
            updateUI(); // Обновляем UI после выбора темы
            saveGameState(); // Сохраняем выбранную тему
        } else {
            tg.HapticFeedback.notificationOccurred('error');
            showModal('Ошибка', 'Пожалуйста, выберите тему канала перед началом игры.', [
                { text: 'Понятно', onClick: hideModal }
            ]);
        }
    });


    // --- Переходы между экранами ---\
    document.getElementById('go-to-clicker').addEventListener('click', () => {
        showScreen('clicker-screen');
        tg.HapticFeedback.impactOccurred('light');
    });
    document.getElementById('go-to-upgrades').addEventListener('click', () => {
        showScreen('upgrades-screen');
        tg.HapticFeedback.impactOccurred('light');
        renderUpgrades(); // Отображаем апгрейды при переходе
    });
    document.getElementById('go-to-analytics').addEventListener('click', () => {
        showScreen('analytics-screen');
        tg.HapticFeedback.impactOccurred('light');
    });
    document.getElementById('go-to-team').addEventListener('click', () => {
        showScreen('team-screen');
        tg.HapticFeedback.impactOccurred('light');
    });
    document.getElementById('go-to-monetization').addEventListener('click', () => {
        showScreen('monetization-screen');
        tg.HapticFeedback.impactOccurred('light');
    });
    document.getElementById('go-to-main-dashboard-from-clicker').addEventListener('click', () => {
        showScreen('main-dashboard-screen');
        tg.HapticFeedback.impactOccurred('light');
    });
    // Добавляем обработчики для кнопок "Назад" на других экранах
    document.querySelectorAll('.screen .btn').forEach(button => {
        if (button.textContent === 'Назад' && button.onclick === null) { // Проверяем, что нет onclick, чтобы не дублировать
            button.addEventListener('click', () => {
                showScreen('main-dashboard-screen');
                tg.HapticFeedback.impactOccurred('light');
            });
        }
    });

    // --- Система апгрейдов ---\
    const upgradesData = [
        {
            id: 'auto-clicker-1',
            name: 'Нанять помощника',
            description: 'Получайте 100 подписчиков в секунду и 10 ₽ в секунду.',
            cost: 1000,
            type: 'passive_income',
            subscribersPerSecond: 100,
            moneyPerSecond: 10,
            level: 1, // Уровень апгрейда
            maxLevel: 1, // Максимальный уровень
            image: 'assets/upgrades/auto-clicker.png' // Путь к изображению
        },
        {
            id: 'energy-booster-1',
            name: 'Энергетический напиток',
            description: 'Увеличивает максимальную энергию на 50 единиц.',
            cost: 500,
            type: 'energy_boost',
            energyBoost: 50,
            level: 1,
            maxLevel: 1,
            image: 'assets/upgrades/energy-booster.png'
        },
        {
            id: 'income-booster-1',
            name: 'Курсы по монтажу',
            description: 'Увеличивает доход за клик на 50%.',
            cost: 2000,
            type: 'click_income_multiplier',
            multiplier: 0.5, // 50%
            level: 1,
            maxLevel: 1,
            image: 'assets/upgrades/income-booster.png'
        },
        {
            id: 'recharge-booster-1',
            name: 'Кофемашина',
            description: 'Увеличивает скорость восстановления энергии на 2 в секунду.',
            cost: 750,
            type: 'energy_recharge_boost',
            rechargeRateBoost: 2,
            level: 1,
            maxLevel: 1,
            image: 'assets/upgrades/recharge-booster.png'
        }
        // Добавьте больше апгрейдов здесь
    ];

    function renderUpgrades() {
        const upgradesGrid = document.getElementById('upgrades-grid');
        if (!upgradesGrid) return;
        upgradesGrid.innerHTML = ''; // Очищаем сетку апгрейдов

        upgradesData.forEach(upgrade => {
            const hasUpgrade = gameState.upgrades[upgrade.id] && gameState.upgrades[upgrade.id].level >= upgrade.maxLevel;
            const card = document.createElement('div');
            card.className = `upgrade-card ${hasUpgrade ? 'purchased' : ''}`;
            card.innerHTML = `
                <img src="${upgrade.image}" alt="${upgrade.name}" class="upgrade-icon">
                <h3>${upgrade.name}</h3>
                <p>${upgrade.description}</p>
                <p>Цена: ${formatMoney(upgrade.cost)}</p>
                ${hasUpgrade ? '<button class="btn btn-purchased" disabled>Куплено</button>' : '<button class="btn buy-upgrade-btn" data-upgrade-id="' + upgrade.id + '">Купить</button>'}
            `;
            upgradesGrid.appendChild(card);
        });

        // Добавляем обработчики событий для кнопок "Купить"
        document.querySelectorAll('.buy-upgrade-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const upgradeId = event.target.dataset.upgradeId;
                buyUpgrade(upgradeId);
            });
        });
    }

    function buyUpgrade(upgradeId) {
        const upgrade = upgradesData.find(u => u.id === upgradeId);
        if (!upgrade) return;

        if (gameState.stats.money >= upgrade.cost) {
            // Проверяем, был ли уже куплен этот апгрейд (если maxLevel = 1)
            if (gameState.upgrades[upgradeId] && gameState.upgrades[upgradeId].level >= upgrade.maxLevel) {
                tg.HapticFeedback.notificationOccurred('error');
                showModal('Уже куплено', `Вы уже купили ${upgrade.name}.`, [
                    { text: 'ОК', onClick: hideModal }
                ]);
                return;
            }

            // Уменьшаем деньги
            gameState.stats.money -= upgrade.cost;
            tg.HapticFeedback.notificationOccurred('success');

            // Применяем эффект апгрейда
            if (upgrade.type === 'passive_income') {
                gameState.stats.subscribers += upgrade.subscribersPerSecond; // Добавляем сразу подписчиков
                gameState.stats.incomePerSecond += upgrade.moneyPerSecond;
            } else if (upgrade.type === 'energy_boost') {
                gameState.stats.maxEnergy += upgrade.energyBoost;
                gameState.stats.energy = gameState.stats.maxEnergy; // Восстанавливаем энергию до максимума
            } else if (upgrade.type === 'click_income_multiplier') {
                gameState.stats.incomePerClick = parseFloat((gameState.stats.incomePerClick * (1 + upgrade.multiplier)).toFixed(2));
            } else if (upgrade.type === 'energy_recharge_boost') {
                gameState.stats.energyRechargeRate += upgrade.rechargeRateBoost;
            }

            // Записываем информацию о купленном апгрейде в gameState
            if (!gameState.upgrades[upgradeId]) {
                gameState.upgrades[upgradeId] = { level: 0 };
            }
            gameState.upgrades[upgradeId].level++;


            showModal('Покупка совершена!', `Вы успешно купили: ${upgrade.name}!`, [
                { text: 'Отлично!', onClick: hideModal, className: 'btn-confirm' }
            ]);

            updateUI();
            saveGameState();
            renderUpgrades(); // Перерисовываем апгрейды, чтобы обновить кнопки
        } else {
            tg.HapticFeedback.notificationOccurred('error');
            showModal('Недостаточно средств', `У вас недостаточно средств для покупки ${upgrade.name}. Необходимо: ${formatMoney(upgrade.cost)}.`, [
                { text: 'ОК', onClick: hideModal, className: 'btn-cancel' }
            ]);
        }
    }


    // --- Preloader Logic ---\
    function initializeApp() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += getRandomInt(5, 15); // Имитация загрузки
            if (progress > 100) progress = 100;
            preloaderProgressBarFill.style.width = `${progress}%`;

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadGameState(); // Загружаем состояние после завершения прелоадера

                    // Проверяем, если пользователь впервые, показываем выбор темы
                    if (!gameState.channel.theme) {
                        showScreen('theme-selection-screen', true); // hideBackButton = true для первого экрана
                    } else {
                        // Если игра уже начата, переходим на последний сохраненный экран или на дашборд
                        const lastScreen = localStorage.getItem('socialMediaTycoonLastScreen');
                        if (lastScreen && lastScreen !== 'preloader-screen' && lastScreen !== 'theme-selection-screen') {
                            showScreen(lastScreen);
                        } else {
                            showScreen('main-dashboard-screen');
                        }
                    }
                    updateUI(); // Обновляем UI после загрузки состояния
                }, 500); // Небольшая задержка перед скрытием прелоадера
            }
        }, 150); // Интервал обновления прогресса
    }

    // --- Save/Load Game State ---\
    function saveGameState() {
        // Убедитесь, что все числовые значения сохраняются как числа
        gameState.stats.subscribers = parseFloat(gameState.stats.subscribers.toFixed(2));
        gameState.stats.money = parseFloat(gameState.stats.money.toFixed(2));
        gameState.stats.incomePerClick = parseFloat(gameState.stats.incomePerClick.toFixed(2));
        gameState.stats.incomePerSecond = parseFloat(gameState.stats.incomePerSecond.toFixed(2));
        gameState.stats.energy = parseFloat(gameState.stats.energy.toFixed(2));
        gameState.stats.maxEnergy = parseFloat(gameState.stats.maxEnergy.toFixed(2));
        gameState.stats.energyRechargeRate = parseFloat(gameState.stats.energyRechargeRate.toFixed(2));
        gameState.channel.experience = parseFloat(gameState.channel.experience.toFixed(2));
        gameState.channel.experienceToNextLevel = parseFloat(gameState.channel.experienceToNextLevel.toFixed(2));

        localStorage.setItem('socialMediaTycoonState', JSON.stringify(gameState));
        localStorage.setItem('socialMediaTycoonLastScreen', gameState.currentScreen); // Сохраняем последний активный экран
    }

    function loadGameState() {
        const savedState = localStorage.getItem('socialMediaTycoonState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            // Преобразование всех числовых полей обратно в числа, если они были сохранены как строки
            // Это может быть избыточно, если `toFixed` и `parseFloat` используются корректно при сохранении
            // Но для надежности можно пройтись по всем числовым полям.
            // Например:
            loadedState.stats.subscribers = parseFloat(loadedState.stats.subscribers) || 0;
            loadedState.stats.money = parseFloat(loadedState.stats.money) || 0;
            loadedState.stats.incomePerClick = parseFloat(loadedState.stats.incomePerClick) || 1;
            loadedState.stats.incomePerSecond = parseFloat(loadedState.stats.incomePerSecond) || 0;
            loadedState.stats.energy = parseFloat(loadedState.stats.energy) || 100;
            loadedState.stats.maxEnergy = parseFloat(loadedState.stats.maxEnergy) || 100;
            loadedState.stats.energyRechargeRate = parseFloat(loadedState.stats.energyRechargeRate) || 1;
            loadedState.channel.level = parseFloat(loadedState.channel.level) || 1;
            loadedState.channel.experience = parseFloat(loadedState.channel.experience) || 0;
            loadedState.channel.experienceToNextLevel = parseFloat(loadedState.channel.experienceToNextLevel) || 100;

            gameState = loadedState;
            console.log('Состояние игры загружено:', gameState);
        } else {
            console.log('Сохраненное состояние игры не найдено. Начинаем новую игру.');
            // Инициализируем user данные, так как они могли не быть установлены при первом запуске
            gameState.user = {
                username: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.username : 'Unknown',
                firstName: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name : 'Пользователь',
                photoUrl: tg.initDataUnsafe.user ? tg.initDataUnsafe.user.photo_url : 'assets/placeholder-avatar.png'
            };
        }
    }

    // --- Initial App Load ---\
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
    //             window.location.reload(); // Перезагружаем страницу
    //         }
    //     });
    // }
});
