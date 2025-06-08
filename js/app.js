// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Инициализация компонентов
const placeDetails = new PlaceDetails();

// Хранилище геолокации
let userLocation = null;

// Функция для получения геолокации
async function getUserLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // Перезагружаем места с учетом новой геолокации
        loadPlaces();
        
        return userLocation;
    } catch (error) {
        console.error('Error getting location:', error);
        alert('Не удалось получить геолокацию. Пожалуйста, проверьте настройки разрешений.');
        return null;
    }
}

// Функция для расчета расстояния между двумя точками
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Обработчик клика по кнопке геолокации
document.getElementById('geoButton').addEventListener('click', getUserLocation);

// Инициализация Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

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
        
        console.log('Loaded places:', data);
        console.log('First place example:', data[0]);
        console.log('Photo field name:', config.places.fields.placephotos);
        
        // Сортируем места по расстоянию, если есть геолокация
        if (userLocation) {
            data.sort((a, b) => {
                const distA = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    a.location.coordinates[1],
                    a.location.coordinates[0]
                );
                const distB = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    b.location.coordinates[1],
                    b.location.coordinates[0]
                );
                return distA - distB;
            });
        }
        
        const placesList = document.querySelector('.places-list');
        placesList.innerHTML = data.map((place, index) => `
            <div class="place-card" data-place-index="${index}">
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

        // Добавляем обработчики клика
        document.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.placeIndex);
                placeDetails.show(data[index], userLocation);
            });
        });
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