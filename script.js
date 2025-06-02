document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово
    tg.expand(); // Раскрываем приложение на весь экран

    // Элементы UI
    const channelNameEl = document.getElementById('channel-name');
    const subscribersCountEl = document.getElementById('subscribers-count');
    const balanceCountEl = document.getElementById('balance-count');
    const engagementRateEl = document.getElementById('engagement-rate');
    const eventLogEl = document.getElementById('event-log');

    const postTextButton = document.getElementById('post-text-button');
    const postMemeButton = document.getElementById('post-meme-button');
    const postVideoButton = document.getElementById('post-video-button');
    const upgradeContentQualityButton = document.getElementById('upgrade-content-quality');
const baseSubGainMin = 8;
    const baseSubGainMax = 20;
    const baseMoneyGainMin = 7;
    const baseMoneyGainMax = 18;
    const baseErMin = 3; // в процентах
    const baseErMax = 10; // в процентах

    // Расчет с учетом случайности и множителя качества
    const subGain = Math.floor((Math.random() * (baseSubGainMax - baseSubGainMin + 1) + baseSubGainMin) * gameState.contentQualityMultiplier);
    const moneyGain = Math.floor((Math.random() * (baseMoneyGainMax - baseMoneyGainMin + 1) + baseMoneyGainMin) * gameState.contentQualityMultiplier);
    
    gameState.subscribers += subGain;
    gameState.balance += moneyGain;
    gameState.postsMade++;
    // ER рассчитываем немного по-другому для разнообразия, но тоже с множителем
    let newER = (Math.random() * (baseErMax - baseErMin) + baseErMin) * (gameState.contentQualityMultiplier / 1.5 + 0.5); // Множитель качества влияет, но чуть слабее чем на текст/мемы
    newER = Math.min(Math.max(newER, 0), 100); // Ограничиваем ER от 0 до 100

    // Можно сделать ER более зависимым от текущего количества подписчиков для реализма
    // Например, если подписчиков мало, то и абсолютный ER от поста будет ниже
    if (gameState.subscribers < 100) {
        newER *= (gameState.subscribers / 100);
    }
    
    gameState.engagementRate = parseFloat(newER.toFixed(1));


    logEvent(`Опубликован видеоролик! +${subGain} подписчиков, +$${moneyGain}. ER: ${gameState.engagementRate}%`);
    updateUI();
    saveGame();
    checkUpgradeButton(); // Проверяем доступность улучшений, т.к. баланс мог измениться
    tg.HapticFeedback.notificationOccurred('success');
});

    // Игровые переменные (состояние)
    let gameState = {
        channelName: "Мой Супер Канал",
        subscribers: 0,
        balance: 100,
        engagementRate: 0,
        contentQualityMultiplier: 1, // Множитель качества контента
        postsMade: 0
    };

    // Загрузка сохраненного состояния (если есть)
    function loadGame() {
        const savedState = localStorage.getItem('channelSimGameState');
        if (savedState) {
            gameState = JSON.parse(savedState);
        }
        updateUI();
        checkUpgradeButton();
    }

    // Сохранение состояния игры
    function saveGame() {
        localStorage.setItem('channelSimGameState', JSON.stringify(gameState));
    }

    // Функция для добавления записи в лог
    function logEvent(message) {
        const listItem = document.createElement('li');
        listItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        eventLogEl.prepend(listItem); // Добавляем в начало
        if (eventLogEl.children.length > 10) { // Ограничиваем размер лога
            eventLogEl.removeChild(eventLogEl.lastChild);
        }
    }

    // Обновление UI
    function updateUI() {
        channelNameEl.textContent = gameState.channelName;
        subscribersCountEl.textContent = gameState.subscribers;
        balanceCountEl.textContent = gameState.balance.toFixed(0);
        engagementRateEl.textContent = gameState.engagementRate.toFixed(1);
    }

    // Проверка доступности кнопки улучшения
    function checkUpgradeButton() {
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
        gameState.engagementRate = (gameState.subscribers > 0 ? (Math.random() * 5 + 1) * gameState.contentQualityMultiplier : 0);
        if (gameState.engagementRate > 100) gameState.engagementRate = 100; // Не больше 100%


        logEvent(`Опубликован текстовый пост! +${subGain} подписчиков, +$${moneyGain}.`);
        updateUI();
        saveGame();
        checkUpgradeButton();
        tg.HapticFeedback.notificationOccurred('success'); // Виброотклик
    });

    // Действие: Опубликовать мем (простая версия)
    postMemeButton.addEventListener('click', () => {
        const baseSubGain = 10; // Мемы более виральны
        const baseMoneyGain = 5; // Но меньше доход

        const subGain = Math.floor((Math.random() * baseSubGain + 3) * gameState.contentQualityMultiplier);
        const moneyGain = Math.floor((Math.random() * baseMoneyGain + 1) * gameState.contentQualityMultiplier);

        gameState.subscribers += subGain;
        gameState.balance += moneyGain;
        gameState.postsMade++;
        gameState.engagementRate = (gameState.subscribers > 0 ? (Math.random() * 8 + 2) * gameState.contentQualityMultiplier : 0);
        if (gameState.engagementRate > 100) gameState.engagementRate = 100;


        logEvent(`Опубликован мем! +${subGain} подписчиков, +$${moneyGain}.`);
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
            gameState.contentQualityMultiplier += 0.2;
            const newCost = Math.floor(cost * 1.5); // Увеличиваем стоимость следующего апгрейда
            upgradeContentQualityButton.dataset.cost = newCost;
            upgradeContentQualityButton.textContent = `Улучшить качество контента (Стоимость: $${newCost})`;
            logEvent(`Качество контента улучшено! Множитель: ${gameState.contentQualityMultiplier.toFixed(1)}x.`);
            updateUI();
            saveGame();
            checkUpgradeButton();
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            logEvent("Недостаточно средств для улучшения.");
            tg.HapticFeedback.notificationOccurred('error');
        }
    });

    // Первоначальная загрузка и настройка
    loadGame(); // Загружаем игру при старте

    // Пример использования MainButton (главная кнопка Telegram внизу)
    // tg.MainButton.setText("Сохранить и выйти");
    // tg.MainButton.show();
    // tg.MainButton.onClick(() => {
    //     saveGame();
    //     logEvent("Игра сохранена!");
    //     tg.close(); // Закрыть Mini App
    // });

    // Настройка кнопки "Назад" в Telegram
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        // Тут можно добавить диалог подтверждения, если нужно
        saveGame();
        logEvent("Выход из игры (прогресс сохранен).");
        tg.close();
    });
});
