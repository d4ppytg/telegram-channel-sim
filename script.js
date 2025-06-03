document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, DOMContentLoaded fired."); // ОТЛАДКА
// ... (начало вашего script (3).js) ...

function initializeGameFlow() { 
    console.log("[initializeGameFlow] Called"); // ОТЛАДКА
    const savedState = localStorage.getItem('channelSimGameState_v0.8.1_fix'); 
    let proceedToWelcome = false;

    if (savedState) { 
        const parsedState = JSON.parse(savedState); 
        gameState = { ...defaultGameState, ...parsedState }; 
        if (gameState.theme) { 
            console.log("[initializeGameFlow] Theme found in saved state. Proceeding to welcome screen."); // ОТЛАДКА
            proceedToWelcome = true;
        } else {
            console.log("[initializeGameFlow] No theme in saved state. Resetting to default and showing theme selection."); // ОТЛАДКА
            gameState = { ...defaultGameState }; 
            saveGame(); 
        }
    } else {
        console.log("[initializeGameFlow] No saved state found. Showing theme selection."); // ОТЛАДКА
        gameState = { ...defaultGameState }; 
        saveGame(); 
    }

    if (proceedToWelcome) {
        showWelcomeScreen();
    } else {
        showThemeSelectionScreen();
    }
}

function showThemeSelectionScreen() { 
    console.log("[showThemeSelectionScreen] Called. Attempting to show theme-selection-screen."); // ОТЛАДКА
    logEvent("Требуется выбор тематики канала.", "info"); 
    showScreen(themeSelectionScreen); 
}
    
function showWelcomeScreen() { 
    console.log("[showWelcomeScreen] Called. Attempting to show welcome-screen."); // ОТЛАДКА
    const userData = tg.initDataUnsafe?.user;
    // ... (остальная логика welcome screen) ...
    showScreen(welcomeScreen); 
}

// Ваша функция showScreen (та, что с localStudioSidePanel)
function showScreen(screenElementToShow) {
    console.log(`[showScreen] Called for: ${screenElementToShow ? screenElementToShow.id : 'null'}`);
    const localStudioSidePanel = document.getElementById('studio-side-panel'); 
    // console.log("Side panel in showScreen (start):", localStudioSidePanel ? localStudioSidePanel.style.display : 'not found'); // Можно добавить, если нужно

    [preloader, themeSelectionScreen, welcomeScreen, cutsceneScreen, studioContainer, createPostModal, upgradesModal, logModal].forEach(el => {
        if (el) { 
            el.classList.remove('visible'); 
            el.style.display = 'none';
            // console.log(`[showScreen] Hid: ${el.id}`);
        }
    });

    if (localStudioSidePanel) {
        localStudioSidePanel.style.display = 'none';
        // console.log(`[showScreen] Side panel explicitly hidden`);
    }

    if (screenElementToShow) {
        console.log(`[showScreen] Setting display 'flex' for: ${screenElementToShow.id}`);
        screenElementToShow.style.display = 'flex'; 
        if (screenElementToShow === studioContainer) {
             studioContainer.style.flexDirection = 'column'; 
             studioContainer.style.justifyContent = 'flex-start'; 
             studioContainer.style.alignItems = 'stretch'; 
             if(localStudioSidePanel) {
                localStudioSidePanel.style.display = 'flex'; 
                console.log(`[showScreen] Side panel display set to 'flex' for studioContainer`);
             }
        } else if (screenElementToShow === createPostModal || screenElementToShow === upgradesModal || screenElementToShow === logModal) {
            if (studioContainer && studioContainer.classList.contains('visible') && localStudioSidePanel) {
                 localStudioSidePanel.style.display = 'flex';
                 console.log(`[showScreen] Side panel display kept 'flex' for modal over studio`);
            }
        }
        
        requestAnimationFrame(() => { 
            requestAnimationFrame(() => { 
                screenElementToShow.classList.add('visible'); 
                console.log(`[showScreen] Added 'visible' class to: ${screenElementToShow.id}`);
            }); 
        });
    } else {
        console.warn("[showScreen] screenElementToShow is null or undefined.");
    }
}


// В самом конце файла, где инициализация:
// showScreen(preloader); // Эта строка может быть лишней, если прелоадер уже виден по умолчанию из CSS
console.log("[Init] Initial preloader should be visible from CSS.");

setTimeout(() => {
    console.log("[Init] Timeout: Hiding preloader and calling initializeGameFlow.");
    if (preloader) { 
        preloader.classList.remove('visible'); 
        setTimeout(() => { 
            if(preloader) preloader.style.display = 'none'; 
            console.log("[Init] Preloader display set to none.");
        }, 700); // Это время должно совпадать с transition-duration для opacity в CSS
    }
    initializeGameFlow();
}, 2500);
