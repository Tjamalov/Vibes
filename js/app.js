// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Инициализация компонентов
console.log('Initializing PlaceDetails');
const placeDetails = new PlaceDetails();
console.log('PlaceDetails instance:', placeDetails);

// Глобальные переменные
let selectedVibe = null;
let allPlaces = [];

// Запрашиваем геолокацию сразу при загрузке
getLocation();

// Функция для получения геолокации
async function getLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        window.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        // Если места уже загружены, просто обновляем сортировку и отображение
        if (allPlaces.length > 0) {
            // Сортируем места по расстоянию
            allPlaces.sort((a, b) => {
                const distA = calculateDistance(
                    window.userLocation.lat,
                    window.userLocation.lng,
                    a.location.coordinates[1],
                    a.location.coordinates[0]
                );
                const distB = calculateDistance(
                    window.userLocation.lat,
                    window.userLocation.lng,
                    b.location.coordinates[1],
                    b.location.coordinates[0]
                );
                return distA - distB;
            });
            
            // Обновляем отображение с сохранением фильтрации
            renderPlaces();
        } else {
            // Если места еще не загружены, загружаем их
            await loadPlaces();
        }
    } catch (error) {
        console.error('Error getting location:', error);
        alert('Не удалось получить ваше местоположение. Пожалуйста, проверьте настройки геолокации.');
    }
}

// Функция для расчета расстояния между двумя точками в метрах
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Возвращаем расстояние в метрах, округленное до целого
}

// Функция для форматирования расстояния
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters}м`;
    } else {
        return `${(meters/1000).toFixed(1)}км`;
    }
}

// Обработчик клика по кнопке геолокации
document.getElementById('geoButton').addEventListener('click', getLocation);

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
            .select('*');
            
        if (error) throw error;
        
        console.log('Loaded places:', data);
        console.log('First place example:', data[0]);
        
        // Сохраняем все места
        allPlaces = data;
        
        // Сортируем места по расстоянию, если есть геолокация
        if (window.userLocation) {
            allPlaces.sort((a, b) => {
                const distA = calculateDistance(
                    window.userLocation.lat,
                    window.userLocation.lng,
                    a.location.coordinates[1],
                    a.location.coordinates[0]
                );
                const distB = calculateDistance(
                    window.userLocation.lat,
                    window.userLocation.lng,
                    b.location.coordinates[1],
                    b.location.coordinates[0]
                );
                return distA - distB;
            });
        }

        // Получаем уникальные вайбы
        const vibes = [...new Set(allPlaces.map(place => place[config.places.fields.vibe]).filter(Boolean))];
        
        // Удаляем старый свитчбар, если он есть
        const oldSwitch = document.querySelector('.vibes-switch');
        if (oldSwitch) {
            oldSwitch.remove();
        }
        
        // Создаем свитчбар с вайбами
        const vibesSwitch = document.createElement('div');
        vibesSwitch.className = 'vibes-switch';
        vibesSwitch.innerHTML = vibes.map(vibe => `
            <button class="vibe-chip" data-vibe="${vibe}">${vibe}</button>
        `).join('');

        // Добавляем обработчики для чипсов
        vibesSwitch.querySelectorAll('.vibe-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const clickedVibe = chip.dataset.vibe;
                
                // Если кликнули по активному чипсу - деактивируем его
                if (selectedVibe === clickedVibe) {
                    chip.classList.remove('active');
                    selectedVibe = null;
                } else {
                    // Деактивируем предыдущий чипс
                    vibesSwitch.querySelectorAll('.vibe-chip').forEach(c => c.classList.remove('active'));
                    // Активируем новый чипс
                    chip.classList.add('active');
                    selectedVibe = clickedVibe;
                }
                
                // Обновляем отображение мест
                renderPlaces();
            });
        });

        // Вставляем свитчбар перед списком мест
        const placesList = document.querySelector('.places-list');
        placesList.parentNode.insertBefore(vibesSwitch, placesList);

        // Отображаем места
        renderPlaces();
    } catch (error) {
        console.error('Error loading places:', error);
        document.querySelector('.places-list').innerHTML = `
            <div class="error-message">
                Ошибка загрузки данных. Пожалуйста, попробуйте позже.
            </div>
        `;
    }
}

// Класс для карточки места
class PlaceCard {
    constructor(place, index, allPlaces, isDistant = false) {
        this.place = place;
        this.index = index;
        this.allPlaces = allPlaces;
        this.isDistant = isDistant;
    }

    // Формирует HTML карточки
    render() {
        let distanceTag = '';
        let distance = null;
        if (window.userLocation) {
            distance = calculateDistance(
                window.userLocation.lat,
                window.userLocation.lng,
                this.place.location.coordinates[1],
                this.place.location.coordinates[0]
            );
            distanceTag = `<span class=\"place-tag\">${formatDistance(distance)}</span>`;
        }
        const distantClass = this.isDistant ? ' distant' : '';
        return `
            <div class=\"place-card${distantClass}\" data-place-index=\"${this.index}\">
                ${this.place[config.places.fields.placephotos] ? 
                    `<img src=\"${this.place[config.places.fields.placephotos]}\" alt=\"${this.place[config.places.fields.name]}\" class=\"place-photo\">` 
                    : ''}
                <div class=\"place-content\">
                    <h3 class=\"place-name\">${this.place[config.places.fields.name]}</h3>
                    <div class=\"place-info\">
                        ${this.place[config.places.fields.type] ? 
                            `<span class=\"place-tag\">${this.place[config.places.fields.type]}</span>` 
                            : ''}
                        ${this.place[config.places.fields.kitchen] ? 
                            `<span class=\"place-tag\">${this.place[config.places.fields.kitchen]}</span>` 
                            : ''}
                        ${this.place[config.places.fields.vibe] ? 
                            `<span class=\"place-tag\" data-vibe>${this.place[config.places.fields.vibe]}</span>` 
                            : ''}
                        ${this.place[config.places.fields.location] ? 
                            `<span class=\"place-tag\">${this.place[config.places.fields.location]}</span>` 
                            : ''}
                        ${distanceTag}
                    </div>
                    ${this.place[config.places.fields.review] ? 
                        `<p class=\"place-review\">${this.place[config.places.fields.review]}</p>` 
                        : ''}
                </div>
            </div>
        `;
    }
}

// Функция для отображения мест с учетом фильтрации и расстояния
function renderPlaces() {
    console.log('renderPlaces called');
    const placesList = document.querySelector('.places-list');
    
    // Фильтруем места по выбранному вайбу
    const filteredPlaces = selectedVibe 
        ? allPlaces.filter(place => place[config.places.fields.vibe] === selectedVibe)
        : allPlaces;

    // Разделяем места по расстоянию
    const nearPlaces = [];
    const distantPlaces = [];
    filteredPlaces.forEach((place) => {
        let distance = null;
        if (window.userLocation) {
            distance = calculateDistance(
                window.userLocation.lat,
                window.userLocation.lng,
                place.location.coordinates[1],
                place.location.coordinates[0]
            );
        }
        if (distance === null || distance < 1000) {
            nearPlaces.push(place);
        } else if (distance >= 1000 && distance < 20000) {
            distantPlaces.push(place);
        }
        // места с distance >= 20000 не добавляем
    });

    // Рендерим ближние и дальние места с заголовком для дальних
    let html = nearPlaces.map((place, index) => {
        const card = new PlaceCard(place, allPlaces.indexOf(place), allPlaces, false);
        return card.render();
    }).join('');

    if (distantPlaces.length > 0) {
        html += `<div class=\"distant-divider\"></div>`;
        html += `<div class=\"distant-title\">Места дальше 1 км</div>`;
        html += distantPlaces.map((place, index) => {
            const card = new PlaceCard(place, allPlaces.indexOf(place), allPlaces, true);
            return card.render();
        }).join('');
    }

    placesList.innerHTML = html;

    // Добавляем обработчики клика
    document.querySelectorAll('.place-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const placeIndex = parseInt(card.dataset.placeIndex);
            const place = allPlaces[placeIndex];
            placeDetails.show(place);
        });
    });
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