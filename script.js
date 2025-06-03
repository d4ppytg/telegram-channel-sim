document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: DOMContentLoaded - Script execution started (SIMPLE VERSION).");
    const tg = window.Telegram.WebApp;

    // --- Ключевые экраны ---
    const preloader = document.getElementById('preloader');
    const themeSelectionScreen = document.getElementById('theme-selection-screen');
    // Остальные экраны пока не объявляем, чтобы минимизировать точки отказа
    // const welcomeScreen = document.getElementById('welcome-screen');
    // const cutsceneScreen = document.getElementById('cutscene-screen');
    // const gameInterface = document.getElementById('game-interface');


    // --- Проверка существования ключевых элементов ---
    if (!preloader) {
        console.error("FATAL DEBUG: Preloader element with ID 'preloader' NOT FOUND!");
        alert("FATAL DEBUG: Preloader element not found! Check HTML id.");
        return; // Прекращаем выполнение, если нет прелоадера
    }
    if (!themeSelectionScreen) {
        console.error("FATAL DEBUG: Theme Selection Screen element with ID 'theme-selection-screen' NOT FOUND!");
        alert("FATAL DEBUG: Theme Selection Screen element not found! Check HTML id.");
        // Не будем прекращать выполнение, просто не сможем его показать
    }

    console.log("DEBUG: Preloader found:", preloader);
    console.log("DEBUG: ThemeSelectionScreen found:", themeSelectionScreen);

    if (tg) {
        tg.ready();
        tg.expand();
        console.log("DEBUG: Telegram WebApp SDK ready and expanded.");
    } else {
        console.error("FATAL DEBUG: Telegram WebApp SDK (tg) is not available!");
        alert("FATAL DEBUG: Telegram SDK not available!");
        // Можно не прекращать выполнение, но игра в Telegram не будет работать корректно
    }

    // --- Функция показа одного экрана (очень упрощенная) ---
    function showOnlyThisScreen(screenToShow) {
        console.log("DEBUG: showOnlyThisScreen called for:", screenToShow ? screenToShow.id : "null");
        // Сначала скрываем все потенциальные экраны
        if (preloader) { preloader.style.display = 'none'; preloader.classList.remove('visible'); }
        if (themeSelectionScreen) { themeSelectionScreen.style.display = 'none'; themeSelectionScreen.classList.remove('visible'); }
        // if (welcomeScreen) { welcomeScreen.style.display = 'none'; welcomeScreen.classList.remove('visible'); }
        // if (cutsceneScreen) { cutsceneScreen.style.display = 'none'; cutsceneScreen.classList.remove('visible'); }
        // if (gameInterface) { gameInterface.style.display = 'none'; gameInterface.classList.remove('visible'); }

        if (screenToShow) {
            screenToShow.style.display = 'flex'; // Используем flex, как в вашем CSS
            // Даем браузеру время применить display перед добавлением класса для анимации
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    screenToShow.classList.add('visible');
                    console.log(`DEBUG: ${screenToShow.id} should be visible now. display: ${getComputedStyle(screenToShow).display}, opacity: ${getComputedStyle(screenToShow).opacity}`);
                });
            });
        } else {
            console.error("DEBUG: showOnlyThisScreen called with a null element!");
        }
    }

    // --- ИНИЦИАЛИЗАЦИЯ ЗАПУСКА ---
    console.log("DEBUG: Attempting to show preloader initially...");
    if (preloader) { // Прелоадер должен быть виден по CSS по умолчанию (opacity:1, visibility:visible)
        preloader.style.display = 'flex'; // Убедимся, что он flex
        preloader.classList.add('visible'); // Убедимся, что он visible
        console.log("DEBUG: Preloader forced to be visible.");
    }


    setTimeout(() => {
        console.log("DEBUG: Preloader timeout! Attempting to hide preloader and show theme selection.");
        if (preloader) { 
            preloader.classList.remove('visible'); 
            // Даем время на анимацию исчезновения opacity
            setTimeout(() => { 
                if(preloader) preloader.style.display = 'none'; 
                console.log("DEBUG: Preloader display set to none.");
            }, 700); // Должно совпадать с transition-duration для opacity прелоадера
        } else {
            console.warn("DEBUG: Preloader was null during timeout hide.");
        }

        // Пытаемся показать экран выбора темы
        if (themeSelectionScreen) {
            console.log("DEBUG: Calling showOnlyThisScreen for themeSelectionScreen.");
            showOnlyThisScreen(themeSelectionScreen);
        } else {
            console.error("DEBUG: Cannot show themeSelectionScreen because it's null after preloader timeout!");
            alert("DEBUG ALERT: Theme Selection Screen not found after preloader!");
            // Если экран выбора темы не найден, то ничего не покажется -> черный экран
        }

    }, 2500); // Общее время показа прелоадера

    console.log("DEBUG: Initial script setup finished. Waiting for preloader timeout.");

    // ВЕСЬ ОСТАЛЬНОЙ ИГРОВОЙ КОД ПОКА ЗАКОММЕНТИРОВАН
    // Это включает:
    // - defaultGameState, gameState
    // - CHARACTER_STATES, setCharacterState
    // - setActiveGameScreen, playCutscene, showNextSlide
    // - initializeGameFlow, showWelcomeScreen, startGameplay
    // - loadGame, saveGame, logEvent, updateUI, checkUpgradeButtonStatus, updateTrendUI, generateNewTrend
    // - getThemeDisplayName, getPostTypeName
    // - Логику интерактивного монитора (showMonitorStep и все связанные обработчики)
    // - Обработчики для navButtons, upgradeContentQualityButton
    // - Модальные окна (openModal, closeModal) и их обработчики
    // - Всплывающие комментарии (showFeedback)
    // - handlePostAction и ее вызовы
    // - Обработчики для themeCards (мы их перенесем, если этот базовый тест сработает)
    // - Обработчик для startGameButton
    // - Обработчик для tg.BackButton
});
