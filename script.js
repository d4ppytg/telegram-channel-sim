// САМЫЙ ВЕРХ ФАЙЛА script.js
console.log("TEST SCRIPT: File script.js loaded and parsing starts NOW.");
alert("TEST SCRIPT: script.js loaded!");

document.addEventListener('DOMContentLoaded', () => {
    console.log("TEST SCRIPT: DOMContentLoaded event FIRED!");
    alert("TEST SCRIPT: DOMContentLoaded FIRED!");

    const preloader = document.getElementById('preloader');
    console.log("TEST SCRIPT: Preloader element:", preloader);

    if (preloader) {
        preloader.style.display = 'flex'; // Принудительно показываем прелоадер
        preloader.style.opacity = '1';
        preloader.style.visibility = 'visible';
        preloader.style.pointerEvents = 'auto';
        preloader.classList.add('visible'); // Добавляем класс, если он используется для анимации
        console.log("TEST SCRIPT: Preloader should be visible now.");
        alert("TEST SCRIPT: Preloader should be visible. Check the screen!");
    } else {
        console.error("TEST SCRIPT: Preloader element NOT FOUND in DOM!");
        alert("TEST SCRIPT: Preloader not found!");
    }

    // БОЛЬШЕ НИКАКОГО КОДА ПОСЛЕ ЭТОГО В ЭТОМ ТЕСТЕ
});

console.log("TEST SCRIPT: End of script.js file reached (after DOMContentLoaded setup).");
alert("TEST SCRIPT: End of script.js file reached!");
