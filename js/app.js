// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Управление навигацией
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок и страниц
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        // Добавляем активный класс выбранной кнопке и странице
        button.classList.add('active');
        const pageId = button.dataset.page;
        document.getElementById(pageId).classList.add('active');
    });
});

// Функции для работы с местами
async function loadPlaces() {
    try {
        const { data, error } = await supabaseClient
            .from(config.places.table)
            .select('*')
            .limit(config.places.limit);
            
        if (error) throw error;
        
        const placesList = document.querySelector('.places-list');
        placesList.innerHTML = data.map(place => `
            <div class="place-card">
                ${place[config.places.fields.photo] ? 
                    `<img src="${place[config.places.fields.photo]}" alt="${place[config.places.fields.name]}" class="place-photo">` 
                    : ''}
                <div class="place-content">
                    <h3 class="place-name">${place[config.places.fields.name]}</h3>
                    <div class="place-info">
                        ${place[config.places.fields.type] ? 
                            `<span class="place-tag">${place[config.places.fields.type]}</span>` 
                            : ''}
                        ${place[config.places.fields.kitchen] ? 
                            `<span class="place-tag">${place[config.places.fields.kitchen]}</span>` 
                            : ''}
                        ${place[config.places.fields.vibe] ? 
                            `<span class="place-tag">${place[config.places.fields.vibe]}</span>` 
                            : ''}
                        ${place[config.places.fields.location] ? 
                            `<span class="place-tag">${place[config.places.fields.location]}</span>` 
                            : ''}
                    </div>
                    ${place[config.places.fields.review] ? 
                        `<p class="place-review">${place[config.places.fields.review]}</p>` 
                        : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading places:', error);
        document.querySelector('.places-list').innerHTML = `
            <div class="error-message">
                Ошибка загрузки данных. Пожалуйста, попробуйте позже.
            </div>
        `;
    }
}

// Функции для работы с маршрутами
async function loadRoutes() {
    try {
        const { data, error } = await supabaseClient
            .from(config.routes.table)
            .select('*')
            .limit(config.routes.limit);
            
        if (error) throw error;
        
        const routesContainer = document.querySelector('.routes-container');
        routesContainer.innerHTML = data.map(route => `
            <div class="route-card">
                <h3>${route.name}</h3>
                <p>${route.description}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем данные для активной страницы
    const activePage = document.querySelector('.page.active');
    if (activePage.id === 'food') {
        loadPlaces();
    } else if (activePage.id === 'routes') {
        loadRoutes();
    }
}); 