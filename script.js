// Инициализация данных канала
const channelData = {
    name: "TechTrends 2025",
    level: 3,
    balance: 8400,
    subscribers: 12345,
    views: 45789,
    engagement: 7.8,
    reputation: 85,
    team: {
        editor: { level: 2, cost: 500 },
        designer: { level: 1, cost: 300 },
        manager: { level: 1, cost: 800 }
    }
};

// DOM элементы
const elements = {
    dashboard: document.getElementById('dashboard'),
    postCreator: document.getElementById('post-creator'),
    analytics: document.getElementById('analytics'),
    createPostBtn: document.getElementById('create-post-btn'),
    analyticsBtn: document.getElementById('analytics-btn'),
    closePostCreator: document.getElementById('close-post-creator'),
    closeAnalytics: document.getElementById('close-analytics'),
    publishBtn: document.getElementById('publish-btn'),
    channelName: document.getElementById('channel-name'),
    level: document.getElementById('level'),
    balance: document.getElementById('balance'),
    subscribers: document.getElementById('subscribers'),
    views: document.getElementById('views'),
    engagement: document.getElementById('engagement'),
    notification: document.getElementById('notification'),
    topicSelect: document.getElementById('topic'),
    headlineOptions: document.querySelectorAll('.headline-option')
};

// Инициализация данных
function initData() {
    elements.channelName.textContent = channelData.name;
    elements.level.textContent = channelData.level;
    elements.balance.textContent = channelData.balance.toLocaleString();
    elements.subscribers.textContent = channelData.subscribers.toLocaleString();
    elements.views.textContent = channelData.views.toLocaleString();
    elements.engagement.textContent = channelData.engagement.toFixed(1) + '%';
    
    // Инициализация графика
    initChart();
}

// Инициализация графика роста
function initChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            datasets: [{
                label: 'Подписчики',
                data: [5000, 7500, 9200, 11000, 12300, 12345],
                borderColor: '#6a7eff',
                backgroundColor: 'rgba(106, 126, 255, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#2a2a35'
                    },
                    ticks: {
                        color: '#a0a0a0'
                    }
                },
                x: {
                    grid: {
                        color: '#2a2a35'
                    },
                    ticks: {
                        color: '#a0a0a0'
                    }
                }
            }
        }
    });
}

// Обработчики событий
elements.createPostBtn.addEventListener('click', () => {
    elements.dashboard.style.display = 'none';
    elements.postCreator.style.display = 'block';
});

elements.analyticsBtn.addEventListener('click', () => {
    elements.dashboard.style.display = 'none';
    elements.analytics.style.display = 'block';
});

elements.closePostCreator.addEventListener('click', () => {
    elements.postCreator.style.display = 'none';
    elements.dashboard.style.display = 'block';
});

elements.closeAnalytics.addEventListener('click', () => {
    elements.analytics.style.display = 'none';
    elements.dashboard.style.display = 'block';
});

// Выбор заголовка
elements.headlineOptions.forEach(option => {
    option.addEventListener('click', function() {
        // Удаляем активный класс у всех вариантов
        elements.headlineOptions.forEach(opt => opt.classList.remove('active'));
        
        // Добавляем активный класс к выбранному варианту
        this.classList.add('active');
    });
});

// Публикация поста
elements.publishBtn.addEventListener('click', function() {
    const selectedTopic = elements.topicSelect.options[elements.topicSelect.selectedIndex];
    const topicBonus = parseInt(selectedTopic.getAttribute('data-bonus'));
    const topicReputation = selectedTopic.getAttribute('data-reputation') || 0;
    
    const selectedHeadline = document.querySelector('.headline-option.active');
    if (!selectedHeadline) {
        alert('Выберите заголовок для поста!');
        return;
    }
    
    const reachBonus = parseInt(selectedHeadline.getAttribute('data-reach'));
    const trustBonus = parseInt(selectedHeadline.getAttribute('data-trust'));
    
    // Расчет эффекта от поста
    const newSubscribers = Math.floor(channelData.subscribers * (reachBonus / 1000));
    const newViews = Math.floor(newSubscribers * 3.5);
    const income = Math.floor(newViews * 0.2);
    
    // Обновление данных канала
    channelData.subscribers += newSubscribers;
    channelData.views += newViews;
    channelData.balance += income;
    channelData.reputation += parseInt(topicReputation) + trustBonus;
    
    // Обновление отображения
    elements.subscribers.textContent = channelData.subscribers.toLocaleString();
    elements.views.textContent = channelData.views.toLocaleString();
    elements.balance.textContent = channelData.balance.toLocaleString();
    
    // Показать уведомление о результате
    elements.notification.innerHTML = `🎉 Пост опубликован!<br>
        <strong>Новые подписчики:</strong> +${newSubscribers.toLocaleString()}<br>
        <strong>Новые просмотры:</strong> +${newViews.toLocaleString()}<br>
        <strong>Доход:</strong> +${income.toLocaleString()} ₽`;
    
    // Вернуться на главный экран
    elements.postCreator.style.display = 'none';
    elements.dashboard.style.display = 'block';
    
    // Обновить график
    initChart();
});

// Случайные события
function randomEvents() {
    const events = [
        { 
            message: "📈 Ваш пост попал в рекомендации! Подписчики +5%", 
            effect: () => { 
                channelData.subscribers = Math.floor(channelData.subscribers * 1.05);
                elements.subscribers.textContent = channelData.subscribers.toLocaleString();
            } 
        },
        { 
            message: "⚠️ Изменился алгоритм платформы. Охват -8%", 
            effect: () => { 
                channelData.views = Math.floor(channelData.views * 0.92);
                elements.views.textContent = channelData.views.toLocaleString();
            } 
        },
        { 
            message: "💼 Получено предложение о рекламе от TechCorp (+2000₽)", 
            effect: () => { 
                channelData.balance += 2000;
                elements.balance.textContent = channelData.balance.toLocaleString();
            } 
        }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    elements.notification.innerHTML = randomEvent.message;
    randomEvent.effect();
    
    // Повторять каждые 30-60 секунд
    setTimeout(randomEvents, Math.random() * 30000 + 30000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initData();
    
    // Запуск случайных событий
    setTimeout(randomEvents, 15000);
    
    // Инициализация кнопок выбора типа контента
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
