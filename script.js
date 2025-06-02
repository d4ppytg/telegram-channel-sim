document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    const preloader = document.getElementById('preloader');
    const gameContainer = document.querySelector('.container');

    tg.ready();
    tg.expand(); // Раскрываем приложение на весь экран

    // Элементы UI
    const channelNameEl = document.getElementById('channel-name');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const engagementRateEl = document.getElementById('engagement-rate');
    const eventLogEl = document.getElementById('event-log');
    const gameVersionEl = document.getElementById('game-version'); // Для футера

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');

    // Игровые переменные (состояние)
    let gameState = {
        channelName: "Мой Супер Канал",
        subscribers: 0,
        balance: 100,
        engagementRate: 0,
        contentQualityMultiplier: 1,
        postsMade: 0,
        gameVersion: "0.2.1" // Обновим версию тут
    };

    // Загрузка сохраненного состояния
    function loadGame() {
        const savedState = localStorage.getItem('channelSimGameState_v2'); // Изменил ключ для избежания конфликтов со старой версией
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            // Объединяем сохраненное состояние с дефолтным, чтобы новые поля не пропадали
            gameState = { ...gameState, ...parsedState };
        }
        if (gameVersionEl) {
            gameVersionEl.textContent = `v${gameState.gameVersion}`;
        }
        updateUI();
        checkUpgradeButton();
    }

    // Сохранение состояния игры
    function saveGame() {
        localStorage.setItem('channelSimGameState_v2', JSON.stringify(gameState));
    }

    // Функция для добавления записи в лог
    function logEvent(message, type = 'info') { // Добавлен параметр type
        const listItem = document.createElement('li');
        listItem.textContent = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${message}`;
        
        listItem.classList.add(`log-${type}`); // Добавляем класс в зависимости от типа

        eventLogEl.prepend(listItem);
        if (eventLogEl.children.length > 20) { // Увеличил лимит лога
            eventLogEl.removeChild(eventLogEl.lastChild);
        }
    }

    // Обновление UI
    function updateUI() {
        if (channelNameEl) channelNameEl.textContent = gameState.channelName;
        if (subscribersCountEl) subscribersCountEl.textContent = gameState.subscribers;
        if (balanceCountEl) balanceCountEl.textContent = gameState.balance.toFixed(0);
        if (engagementRateEl) engagementRateEl.textContent = gameState.engagementRate.toFixed(1);
    }

    // Проверка доступности кнопки улучшения
    function checkUpgradeButton() {
        if (!upgradeContentQualityButton) return;
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance < cost) {
            upgradeContentQualityButton.disabled = true;
        } else {
            upgradeContentQualityButton.disabled = false;
        }
    }

    // Действие: Опубликовать текстовый пост
    postTextButton.addEventListener('click', () => {
        const baseSubGain = 5;
        const baseMoneyGain = 10;

        const subGain = Math.floor((Math.random() * baseSubGain + 1) * gameState.contentQualityMultiplier);
        const moneyGain = Math.floor((Math.random() * baseMoneyGain + 2) * gameState.contentQualityMultiplier);

        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        gameState.engagementRate = parseFloat(Math.min(Math.max((gameState.subscribers > 0 ? (Math.random() * 5 + 1) * gameState.contentQualityMultiplier : 0), 0), 100).toFixed(1));
        
        logEvent(`Опубликован текстовый пост! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
        updateUI();
        saveGame();
        checkUpgradeButton();
        tg.HapticFeedback.notificationOccurred('success');
    });

    // Действие: Опубликовать мем
    postMemeButton.addEventListener('click', () => {
        const baseSubGain = 10;
        const baseMoneyGain = 5;

        const subGain = Math.floor((Math.random() * baseSubGain + 3) * gameState.contentQualityMultiplier);
        const moneyGain = Math.floor((Math.random() * baseMoneyGain + 1) * gameState.contentQualityMultiplier);

        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        gameState.engagementRate = parseFloat(Math.min(Math.max((gameState.subscribers > 0 ? (Math.random() * 8 + 2) * gameState.contentQualityMultiplier : 0),0),100).toFixed(1));
        
        logEvent(`Опубликован мем! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
        updateUI();
        saveGame();
        checkUpgradeButton();
        tg.HapticFeedback.notificationOccurred('success');
    });

    // Действие: Опубликовать Видеоролик
    postVideoButton.addEventListener('click', () => {
        const baseSubGainMin = 8;
        const baseSubGainMax = 20;
        const baseMoneyGainMin = 7;
        const baseMoneyGainMax = 18;
        const baseErMin = 3;
        const baseErMax = 10;

        const subGain = Math.floor((Math.random() * (baseSubGainMax - baseSubGainMin + 1) + baseSubGainMin) * gameState.contentQualityMultiplier);
        const moneyGain = Math.floor((Math.random() * (baseMoneyGainMax - baseMoneyGainMin + 1) + baseMoneyGainMin) * gameState.contentQualityMultiplier);
        
        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        
        let newER = (Math.random() * (baseErMax - baseErMin) + baseErMin) * (gameState.contentQualityMultiplier / 1.5 + 0.5);
        if (gameState.subscribers < 100 && gameState.subscribers > 0) { // Немного реализма для ER на старте
            newER *= (gameState.subscribers / 100);
        } else if (gameState.subscribers === 0) {
            newER = 0;
        }
        gameState.engagementRate = parseFloat(Math.min(Math.max(newER, 0), 100).toFixed(1));

        logEvent(`Опубликован видеоролик! +${subGain} подписчиков, +$${moneyGain}.`, 'success');
        updateUI();
        saveGame();
        checkUpgradeButton();
        tg.HapticFeedback.notificationOccurred('success');
    });

    // Действие: Улучшить качество контента
    upgradeContentQualityButton.addEventListener('click', () => {
        const cost = parseInt(upgradeContentQualityButton.dataset.cost);
        if (gameState.balance >= cost) {
            gameState.balance -= cost;
            gameState.contentQualityMultiplier = parseFloat((gameState.contentQualityMultiplier + 0.2).toFixed(1)); // Округляем
            const newCost = Math.floor(cost * 1.5);
            upgradeContentQualityButton.dataset.cost = newCost;
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier}x.`, 'success');
            updateUI();
            saveGame();
            checkUpgradeButton();
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            logEvent("Недостаточно средств для улучшения.", 'error');
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // --- Начало основной инициализации игры ---
    loadGame(); // Загружаем игру при старте
    logEvent("Игра загружена! Добро пожаловать!", "info"); // Приветственное сообщение

    // --- Конец основной инициализации игры ---

    // Скрываем прелоадер и показываем основной контент
    setTimeout(() => {
        if (preloader) {
            preloader.classList.add('hidden');
        }
        if (gameContainer) {
            gameContainer.style.display = 'block'; // Показываем .container
            // Можно добавить класс для анимации появления .container, если нужно
            // setTimeout(() => gameContainer.classList.remove('hidden'), 50); // Убираем задержку, если display:block
        }
    }, 1000); // Задержка в 1 секунду для прелоадера, можете настроить

    // Настройка кнопки "Назад" в Telegram
    if (tg.BackButton) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            saveGame();
            logEvent("Выход из игры (прогресс сохранен).", "info");
            tg.close();
        });
    }
});
