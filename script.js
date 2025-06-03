// Полный script.js из предыдущего ответа (версия 1.0.0) 
// + следующие ИЗМЕНЕНИЯ и ДОБАВЛЕНИЯ:

document.addEventListener('DOMContentLoaded', () => {
    // ... (все существующие const для элементов UI, tg, defaultGameState, CHARACTER_STATES) ...
    // Обновляем версию в defaultGameState
    // defaultGameState.gameVersion = "1.1.0";
    // Обновляем ключ localStorage в initializeGameFlow, loadGame, saveGame на 'channelSimGameState_v12'

    // === НОВЫЕ ЭЛЕМЕНТЫ И ПЕРЕМЕННЫЕ ДЛЯ ЛАБОРАТОРИИ ТЕКСТА ===
    const openTextLabButton = document.getElementById('open-text-lab-button');
    const textPostLabScreen = document.getElementById('text-post-lab-screen');
    
    const textLabStepTitleSelection = document.getElementById('text-lab-step-title-selection');
    const titleOptionsGrid = document.querySelector('#text-lab-step-title-selection .title-options-grid');
    
    const textLabStepWordFlow = document.getElementById('text-lab-step-word-flow');
    const wordFlowTimerDisplay = document.getElementById('word-flow-time-left');
    const wordFlowQualityScoreDisplay = document.getElementById('word-flow-quality-score');
    const wordFlowArea = document.querySelector('#text-lab-step-word-flow .word-flow-area');
    const collectedTextPreview = document.getElementById('собранный-текст-поста-в-лабе');
    const wordsCollectedCountDisplay = document.getElementById('words-collected-count');

    const textLabStepPublish = document.getElementById('text-lab-step-publish');
    const finalPostQualityDisplay = document.getElementById('final-post-quality-display');
    const publishTextPostFromLabButton = document.getElementById('publish-text-post-from-lab-button');
    const cancelTextPostLabButton = document.getElementById('cancel-text-post-lab-button');

    let currentTextLabState = {
        selectedTitle: null,
        collectedWords: [],
        qualityScore: 0,
        wordFlowInterval: null,
        wordFlowTimeout: null,
        wordSpawnInterval: null,
    };

    const TEXT_POST_TITLES = [ // Примеры заголовков
        { id: 1, text: "Секреты Успеха: Как Набрать Миллион Подписчиков", baseQuality: 10, difficulty: 1},
        { id: 2, text: "ШОК! Вы не поверите, что случилось дальше...", baseQuality: 15, difficulty: 1.2},
        { id: 3, text: "Глубокий Анализ Рынка Котиков в Telegram", baseQuality: 8, difficulty: 0.8},
        { id: 4, text: "Мой Топ-5 Лайфхаков для Продуктивности", baseQuality: 12, difficulty: 1.1},
    ];
    const GOOD_WORDS = ["отлично", "супер", "важно", "интересно", "полезно", "круто", "эксклюзив", "невероятно", "эффективно", "успех", "рост", "тренд"];
    const BAD_WORDS = ["скучно", "вода", "бред", "ужасно", "плохо", "непонятно", "ошибка", "кринж", "фейк", "спам", "баян"];


    // --- МОДИФИЦИРОВАННАЯ ЛОГИКА УПРАВЛЕНИЯ ЭКРАНАМИ ---
    function showScreen(screenElementToShow) {
        // Добавляем textPostLabScreen в список
        [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioScreenContainer, textPostLabScreen, createPostModal, upgradesModal, logModal].forEach(el => {
            if (el && el !== screenElementToShow) { 
                el.classList.remove('visible'); el.style.display = 'none';
            }
        });
        if (screenElementToShow) {
            screenElementToShow.style.display = 'flex'; 
            requestAnimationFrame(() => { requestAnimationFrame(() => { screenElementToShow.classList.add('visible'); }); });
        }
    }

    // --- ЛОГИКА ЛАБОРАТОРИИ ТЕКСТОВОГО ПОСТА ---
    function resetTextLab() {
        currentTextLabState = { selectedTitle: null, collectedWords: [], qualityScore: 0, wordFlowInterval: null, wordFlowTimeout: null, wordSpawnInterval: null };
        if(titleOptionsGrid) titleOptionsGrid.innerHTML = '';
        if(wordFlowArea) wordFlowArea.innerHTML = '';
        if(collectedTextPreview) collectedTextPreview.innerHTML = '';
        if(wordsCollectedCountDisplay) wordsCollectedCountDisplay.textContent = '0';
        if(wordFlowQualityScoreDisplay) wordFlowQualityScoreDisplay.textContent = '0';
        if(textLabStepTitleSelection) textLabStepTitleSelection.style.display = 'block';
        if(textLabStepWordFlow) textLabStepWordFlow.style.display = 'none';
        if(textLabStepPublish) textLabStepPublish.style.display = 'none';
    }

    function startTextPostLab() {
        resetTextLab();
        // Заполняем опции заголовков
        if (titleOptionsGrid) {
            // Выбираем 3 случайных уникальных заголовка
            const shuffledTitles = [...TEXT_POST_TITLES].sort(() => 0.5 - Math.random());
            const selectedTitles = shuffledTitles.slice(0, 3);

            selectedTitles.forEach(title => {
                const button = document.createElement('button');
                button.classList.add('title-option-button');
                button.textContent = title.text;
                button.dataset.titleId = title.id;
                button.dataset.baseQuality = title.baseQuality;
                button.addEventListener('click', () => selectTextLabTitle(title));
                titleOptionsGrid.appendChild(button);
            });
        }
        showScreen(textPostLabScreen);
    }

    function selectTextLabTitle(titleData) {
        currentTextLabState.selectedTitle = titleData;
        logEvent(`Выбран заголовок: "${titleData.text}"`, "info");
        if(textLabStepTitleSelection) textLabStepTitleSelection.style.display = 'none';
        if(textLabStepWordFlow) textLabStepWordFlow.style.display = 'block';
        startWordFlowGame();
    }

    function startWordFlowGame() {
        currentTextLabState.collectedWords = [];
        currentTextLabState.qualityScore = 0;
        if(collectedTextPreview) collectedTextPreview.innerHTML = '';
        if(wordsCollectedCountDisplay) wordsCollectedCountDisplay.textContent = '0';
        if(wordFlowQualityScoreDisplay) wordFlowQualityScoreDisplay.textContent = '0';

        let timeLeft = 30;
        if(wordFlowTimerDisplay) wordFlowTimerDisplay.textContent = timeLeft;

        // Таймер игры
        currentTextLabState.wordFlowTimeout = setInterval(() => {
            timeLeft--;
            if(wordFlowTimerDisplay) wordFlowTimerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                endWordFlowGame();
            }
        }, 1000);

        // Генерация слов
        currentTextLabState.wordSpawnInterval = setInterval(spawnWord, 1200); // Каждые 1.2 секунды новое слово
    }

    function spawnWord() {
        if (!wordFlowArea || document.hidden) return; // Не спавним, если вкладка не активна или нет области

        const wordEl = document.createElement('span');
        wordEl.classList.add('clickable-word');
        
        const isGood = Math.random() > 0.35; // 65% шанс хорошего слова
        wordEl.textContent = isGood ? GOOD_WORDS[Math.floor(Math.random() * GOOD_WORDS.length)] : BAD_WORDS[Math.floor(Math.random() * BAD_WORDS.length)];
        wordEl.dataset.type = isGood ? 'good' : 'bad';
        wordEl.classList.add(isGood ? 'good-word' : 'bad-word');

        // Случайное позиционирование внутри wordFlowArea
        const areaRect = wordFlowArea.getBoundingClientRect();
        wordEl.style.left = Math.random() * (areaRect.width - 80) + 'px'; // -80 чтобы не у края
        wordEl.style.top = Math.random() * (areaRect.height - 30) + 'px'; // -30 чтобы не у края

        // Анимация появления (можно сделать через CSS класс)
        requestAnimationFrame(() => {
            wordEl.style.opacity = '1';
            wordEl.style.transform = 'translateY(0)';
        });

        wordEl.addEventListener('click', handleWordClick);
        wordFlowArea.appendChild(wordEl);

        // Удаляем слово через некоторое время, если на него не кликнули
        setTimeout(() => {
            if (wordEl.parentNode) { // Если слово еще не удалено кликом
                wordEl.style.opacity = '0';
                setTimeout(() => wordEl.remove(), 300);
            }
        }, 3000 + Math.random() * 2000); // Слово висит 3-5 секунд
    }

    function handleWordClick(event) {
        const wordEl = event.target;
        if (wordEl.classList.contains('collected')) return;

        wordEl.classList.add('collected'); // Помечаем как собранное/обработанное
        
        if (wordEl.dataset.type === 'good') {
            currentTextLabState.collectedWords.push(wordEl.textContent);
            currentTextLabState.qualityScore += 5; // +5 за хорошее слово
            if(collectedTextPreview) collectedTextPreview.textContent = currentTextLabState.collectedWords.join(' ') + (currentTextLabState.collectedWords.length > 0 ? '. ' : '');
            if(wordsCollectedCountDisplay) wordsCollectedCountDisplay.textContent = currentTextLabState.collectedWords.length;
            if(wordFlowQualityScoreDisplay) wordFlowQualityScoreDisplay.textContent = currentTextLabState.qualityScore;
             tg.HapticFeedback.impactOccurred('light');
        } else {
            currentTextLabState.qualityScore -= 3; // -3 за плохое
            if(wordFlowQualityScoreDisplay) wordFlowQualityScoreDisplay.textContent = currentTextLabState.qualityScore;
            tg.HapticFeedback.notificationOccurred('error');
        }
        wordEl.remove(); // Удаляем слово после клика
    }

    function endWordFlowGame() {
        clearInterval(currentTextLabState.wordFlowTimeout);
        clearInterval(currentTextLabState.wordSpawnInterval);
        if(wordFlowArea) wordFlowArea.innerHTML = ''; // Очищаем область от оставшихся слов
        
        logEvent(`Мини-игра "Поток слов" завершена. Качество: ${currentTextLabState.qualityScore}`, "info");
        if(textLabStepWordFlow) textLabStepWordFlow.style.display = 'none';
        if(textLabStepPublish) textLabStepPublish.style.display = 'block';
        if(finalPostQualityDisplay) finalPostQualityDisplay.textContent = currentTextLabState.qualityScore;
    }

    if(publishTextPostFromLabButton) {
        publishTextPostFromLabButton.addEventListener('click', () => {
            // Здесь мы вызываем handlePostAction, передавая тип 'text' и результат мини-игры
            // Базовые параметры для текстового поста можно взять из старого handlePostAction
            // или определить новые, которые будут модифицироваться качеством из лабы.
            
            // Пример: качество из лабы влияет на множитель подписчиков
            const labQualityMultiplier = 1 + (Math.max(0, currentTextLabState.qualityScore) / 50); // Пример: каждые 50 очков = +100%

            // Вызываем основную функцию поста, но передаем ей labQualityMultiplier
            // Для этого нужно будет немного изменить handlePostAction
            handlePostAction('text', 1, 5, 2, 10, 1, 5, labQualityMultiplier, currentTextLabState.selectedTitle.text);
            
            showScreen(studioScreenContainer); // Возвращаемся в студию
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        });
    }
    if(cancelTextPostLabButton) {
        cancelTextPostLabButton.addEventListener('click', () => {
            clearInterval(currentTextLabState.wordFlowTimeout);
            clearInterval(currentTextLabState.wordSpawnInterval);
            if(wordFlowArea) wordFlowArea.innerHTML = '';
            logEvent("Создание текстового поста отменено.", "info");
            showScreen(studioScreenContainer);
            setCharacterState(CHARACTER_STATES.IDLE_BLINKING);
        });
    }
    
    // Открываем лабораторию текстового поста
    if (openTextLabButton) {
        openTextLabButton.addEventListener('click', () => {
            setCharacterState(CHARACTER_STATES.TYPING); // Персонаж начинает "думать/работать"
            startTextPostLab();
        });
    }

    // --- МОДИФИЦИРОВАННЫЙ handlePostAction ---
    // Добавляем labQualityMultiplier и postTitle как параметры
    function handlePostAction(postType, baseSubMin, baseSubMax, baseMoneyMin, baseMoneyMax, erMin, erMax, labQualityMultiplier = 1, postTitle = "Новый пост") {
        // setCharacterState(CHARACTER_STATES.TYPING); // Уже установлено перед открытием лабы или модалки
        
        // Убираем setTimeout отсюда, так как "работа" происходит в лаборатории
        // setTimeout(() => { ... }, 700); 

        const themeModKey = postType; 
        const themeMod = gameState.themeModifiers[themeModKey] || 1;
        const moodMultiplier = 0.8 + (gameState.audienceMood / 100) * 0.4; 
        let trendBonusMultiplier = 1;

        if (gameState.currentTrend && gameState.currentTrend.type === postType && gameState.trendPostsRemaining > 0) { 
            trendBonusMultiplier = parseFloat(gameState.currentTrend.bonus); 
            gameState.audienceMood = Math.min(gameState.audienceMood + 5, 100); 
            logEvent(`Пост "${postTitle}" (${getPostTypeName(postType)}) попал в тренд! Бонус x${trendBonusMultiplier}!`, 'info');
        }

        // Используем labQualityMultiplier
        const subGain = Math.floor((Math.random() * (baseSubMax - baseSubMin + 1) + baseSubMin) * gameState.contentQualityMultiplier * themeMod * moodMultiplier * trendBonusMultiplier * labQualityMultiplier);
        const moneyGain = Math.floor((Math.random() * (baseMoneyMax - baseMoneyMin + 1) + baseMoneyMin) * gameState.contentQualityMultiplier * labQualityMultiplier); // Деньги тоже могут зависеть от качества
        
        // ... (остальная логика поста: подписчики, баланс, посты, настроение, отписки, лог поста) ...
        // Как в предыдущей версии, но используем postTitle в логе
        logEvent(`Опубликован ${getPostTypeName(postType)}: "${postTitle}"! +${subGain} подписчиков, +$${moneyGain}.`, 'success');

        if (gameState.currentTrend && gameState.trendPostsRemaining > 0) { gameState.trendPostsRemaining--; }
        if ((!gameState.currentTrend || gameState.trendPostsRemaining <= 0) && gameState.postsMade > 2) { if (Math.random() < 0.20) { generateNewTrend(); }}
        
        if (subGain > 8) { setCharacterState(CHARACTER_STATES.HAPPY, 3000); } 
        else { setCharacterState(CHARACTER_STATES.IDLE_BLINKING); } // Возвращаем в idle после "работы" в лабе

        updateUI(); saveGame(); checkUpgradeButtonStatus();
        tg.HapticFeedback.notificationOccurred('success');
        
        // Генерация фидбека
        const feedbackCount = Math.floor(Math.random() * 3) + 2; 
        for (let i = 0; i < feedbackCount; i++) { /* ... как раньше ... */ }
        
        // closeModal(createPostModal); // Эта модалка больше не используется для текстовых постов
    }
    
    // Старые кнопки для мемов и видео пока могут открывать старую простую модалку (если она есть) или их тоже нужно переделать на лаборатории
    // Если вы удалили createPostModal, то эти кнопки пока не будут работать
    // if(postMemeButton) postMemeButton.addEventListener('click', () => handlePostAction('meme', 3, 10, 1, 5, 2, 8));
    // if(postVideoButton) postVideoButton.addEventListener('click', () => handlePostAction('video', 8, 20, 7, 18, 3, 10));
    // Для простоты, пока оставим их без действия, или можно временно вызывать handlePostAction с дефолтным качеством
     if(postMemeButton) postMemeButton.addEventListener('click', () => { 
         logEvent("Лаборатория для Мемов еще не готова!", "warning");
         // handlePostAction('meme', 3, 10, 1, 5, 2, 8, 1, "Прикольный Мем"); // Вызов с дефолтным качеством
     });
     if(postVideoButton) postVideoButton.addEventListener('click', () => {
         logEvent("Лаборатория для Видео еще не готова!", "warning");
         // handlePostAction('video', 8, 20, 7, 18, 3, 10, 1, "Новое Видео"); // Вызов с дефолтным качеством
     });


    // ... (весь остальной код: initializeGameFlow, управление модалками улучшений/лога, обработчики кнопок и т.д. как в версии 1.0.0) ...
    // Убедитесь, что вызовы closeModal теперь не ссылаются на createPostModal, если он удален.
});
