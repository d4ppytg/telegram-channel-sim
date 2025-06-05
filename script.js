document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы DOM ---
    const preloader = document.querySelector('.preloader');
    const preloaderProgressBarFill = document.querySelector('.preloader-progress-bar-fill');
    const studioScreen = document.getElementById('studio-screen');

    // Кнопки действий
    const createPostBtn = document.getElementById('create-post-btn');
    const upgradesBtn = document.getElementById('upgrades-btn');
    const journalBtn = document.getElementById('journal-btn');
    const settingsBtn = document.getElementById('settings-btn');

    // Элементы статистики
    const energyValue = document.getElementById('energy-value');
    const energyMax = document.getElementById('energy-max');
    const moodValue = document.getElementById('mood-value');
    const moodMax = document.getElementById('mood-max');
    const channelName = document.getElementById('channel-name');
    const subscribersValue = document.getElementById('subscribers-value');
    const balanceValue = document.getElementById('balance-value');

    // Персонаж
    const characterImg = document.getElementById('character-img');

    // Статус производства поста
    const postProductionStatus = document.getElementById('post-production-status');
    const postProductionProgressBarFill = document.querySelector('.post-production-progress-fill');

    // Модальное окно
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const closeModalButton = document.querySelector('.close-modal-button');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalActions = document.getElementById('modal-actions');

    // --- Состояние игры (пример) ---
    const gameState = {
        energy: 100,
        maxEnergy: 100,
        mood: 100,
        maxMood: 100,
        channel: {
            name: "YOUR_CHANNEL",
            subscribers: 1234567,
            balance: 123456
        },
        characterState: 'idle', // 'idle', 'typing', 'happy', 'sleeping'
        postProductionProgress: 0,
        isProducingPost: false,
        activeScreen: 'studio-screen' // Текущий видимый экран
    };

    // --- Функции обновления UI ---

    function updateStatsUI() {
        energyValue.textContent = gameState.energy;
        energyMax.textContent = gameState.maxEnergy;
        moodValue.textContent = gameState.mood;
        moodMax.textContent = gameState.maxMood;
        subscribersValue.textContent = formatNumber(gameState.channel.subscribers);
        balanceValue.textContent = formatNumber(gameState.channel.balance);
        channelName.textContent = gameState.channel.name; // Обновляем имя канала
    }

    function setCharacterState(state) {
        if (gameState.characterState === state) return; // Если состояние не изменилось
        characterImg.classList.remove(`char-state-${gameState.characterState}`); // Удаляем старый класс
        characterImg.classList.add(`char-state-${state}`); // Добавляем новый класс
        gameState.characterState = state;

        // Можно добавить/убрать анимации в зависимости от состояния
        if (state === 'idle') {
            characterImg.classList.add('char-anim-idle-blink');
        } else {
            characterImg.classList.remove('char-anim-idle-blink');
        }
    }

    function updatePostProductionUI() {
        if (gameState.isProducingPost) {
            postProductionStatus.classList.remove('hidden');
            postProductionProgressBarFill.style.width = `${gameState.postProductionProgress}%`;
        } else {
            postProductionStatus.classList.add('hidden');
            postProductionProgressBarFill.style.width = `0%`;
        }
    }

    // --- Функции для модальных окон ---
    function openModal(title, contentHtml, actionsHtml = '') {
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;
        modalActions.innerHTML = actionsHtml;
        modalOverlay.classList.add('visible');
    }

    function closeModal() {
        modalOverlay.classList.remove('visible');
    }

    // --- Переключение экранов ---
    function showScreen(screenId) {
        // Скрываем текущий активный экран
        const currentActiveScreen = document.getElementById(gameState.activeScreen);
        if (currentActiveScreen) {
            currentActiveScreen.classList.remove('visible');
        }

        // Показываем новый экран
        const newActiveScreen = document.getElementById(screenId);
        if (newActiveScreen) {
            newActiveScreen.classList.add('visible');
            gameState.activeScreen = screenId;
        }
    }

    // --- Вспомогательные функции ---
    function formatNumber(num) {
        return num.toLocaleString('ru-RU'); // Форматирование чисел для читабельности
    }

    // --- Игровая логика (примеры) ---

    // Функция для создания поста
    function createPost() {
        if (gameState.energy >= 20 && !gameState.isProducingPost) { // Примерная стоимость энергии
            gameState.energy -= 20;
            setCharacterState('typing'); // Персонаж печатает
            gameState.isProducingPost = true;
            gameState.postProductionProgress = 0;
            updateStatsUI();
            updatePostProductionUI();

            const productionInterval = setInterval(() => {
                gameState.postProductionProgress += 10; // Увеличиваем на 10% каждые 0.5 сек
                updatePostProductionUI();

                if (gameState.postProductionProgress >= 100) {
                    clearInterval(productionInterval);
                    gameState.isProducingPost = false;
                    gameState.postProductionProgress = 0;
                    setCharacterState('happy'); // Персонаж счастлив
                    setTimeout(() => setCharacterState('idle'), 1500); // Возвращается в режим ожидания через 1.5 сек

                    // Пример результатов поста
                    const newSubscribers = Math.floor(Math.random() * 10000) + 1000;
                    const income = Math.floor(Math.random() * 5000) + 500;
                    gameState.channel.subscribers += newSubscribers;
                    gameState.channel.balance += income;
                    updateStatsUI();

                    openModal(
                        'Пост Готов!',
                        `<p>Вы выпустили новый пост!</p>
                        <p>+${formatNumber(newSubscribers)} подписчиков</p>
                        <p>+${formatNumber(income)} ₽ дохода</p>`,
                        `<button class="btn" onclick="closeModal()">Отлично!</button>`
                    );
                    updatePostProductionUI(); // Скрыть прогресс-бар
                }
            }, 500); // Прогресс каждые 0.5 секунды
        } else if (gameState.isProducingPost) {
            openModal('Внимание', '<p>Вы уже создаете пост!</p>', '<button class="btn" onclick="closeModal()">ОК</button>');
        } else {
            openModal('Недостаточно Энергии', '<p>У вас недостаточно энергии для создания поста. Отдохните!</p>', '<button class="btn" onclick="closeModal()">ОК</button>');
        }
    }

    function handleUpgrades() {
        openModal(
            'Улучшения',
            `<p>Здесь будут доступны улучшения для вашего канала.</p>
             <div class="modal-item">
                <h3>Улучшить компьютер</h3>
                <p>Увеличивает скорость производства постов.</p>
                <p>Стоимость: 5000 ₽</p>
                <button class="btn">Купить</button>
            </div>
             <div class="modal-item">
                <h3>Найм копирайтера</h3>
                <p>Увеличивает прирост подписчиков.</p>
                <p>Стоимость: 10000 ₽</p>
                <button class="btn">Купить</button>
            </div>
            `,
            `<button class="btn" onclick="closeModal()">Закрыть</button>`
        );
    }

    function handleJournal() {
        openModal(
            'Журнал Событий',
            `<ul id="event-log">
                <li class="log-info">Добро пожаловать в игру!</li>
                <li class="log-success">Вы создали свой канал.</li>
                <li class="log-warning">Пользователь A начал комментировать ваш пост.</li>
                <li class="log-error">Упс! Технический сбой.</li>
            </ul>`,
            `<button class="btn" onclick="closeModal()">Закрыть</button>`
        );
    }

    function handleSettings() {
        openModal(
            'Настройки',
            `<p>Здесь будут настройки игры.</p>
             <button class="btn" onclick="alert('Звук включен/выключен')">Звук</button>
             <button class="btn" onclick="alert('Сброс игры')">Сбросить игру</button>
            `,
            `<button class="btn" onclick="closeModal()">Закрыть</button>`
        );
    }


    // --- Обработчики событий ---
    createPostBtn.addEventListener('click', createPost);
    upgradesBtn.addEventListener('click', handleUpgrades);
    journalBtn.addEventListener('click', handleJournal);
    settingsBtn.addEventListener('click', handleSettings);
    closeModalButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) { // Закрыть модальное окно, если клик по оверлею
            closeModal();
        }
    });

    // --- Инициализация при загрузке ---
    function initializeGame() {
        updateStatsUI();
        setCharacterState('idle'); // Начальное состояние персонажа
        updatePostProductionUI(); // Скрыть прогресс-бар в начале

        // Имитация загрузки прелоадера
        let loadProgress = 0;
        const loadInterval = setInterval(() => {
            loadProgress += 10;
            preloaderProgressBarFill.style.width = `${loadProgress}%`;
            if (loadProgress >= 100) {
                clearInterval(loadInterval);
                setTimeout(() => {
                    preloader.classList.add('hidden');
                    showScreen('studio-screen'); // Показываем студийный экран
                }, 500); // Задержка перед скрытием прелоадера
            }
        }, 100);
    }

    initializeGame();
});
