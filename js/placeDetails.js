class PlaceDetails {
    constructor() {
        this.popup = document.getElementById('placePopup');
        this.popupClose = this.popup.querySelector('.popup-close');
        this.map = null;
        this.markers = [];
        
        this.init();
    }

    init() {
        // Инициализация Mapbox
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        // Обработчик закрытия попапа
        this.popupClose.addEventListener('click', () => this.close());
        
        // Закрытие по клику вне попапа
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.close();
            }
        });
    }

    show(place, userLocation) {
        this.renderContent(place);
        this.initMap(place, userLocation);
        this.popup.classList.add('active');
    }

    close() {
        this.popup.classList.remove('active');
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
    }

    renderContent(place) {
        console.log('Rendering place details:', place);
        console.log('Photo URL:', place[config.places.fields.placephotos]);
        
        const popupTitle = this.popup.querySelector('.popup-title');
        const popupPhoto = this.popup.querySelector('.popup-photo');
        const popupInfo = this.popup.querySelector('.popup-info');
        const popupDescription = this.popup.querySelector('.popup-description');

        // Заполняем данные
        popupTitle.textContent = place[config.places.fields.name];
        
        // Фото
        if (place[config.places.fields.placephotos]) {
            console.log('Setting photo:', place[config.places.fields.placephotos]);
            popupPhoto.style.display = 'block';
            popupPhoto.innerHTML = `
                <img src="${place[config.places.fields.placephotos]}" 
                     alt="${place[config.places.fields.name]}"
                     class="place-photo">`;
        } else {
            console.log('No photo available');
            popupPhoto.style.display = 'none';
        }

        // Теги
        const tags = [];
        if (place[config.places.fields.type]) tags.push(place[config.places.fields.type]);
        if (place[config.places.fields.kitchen]) tags.push(place[config.places.fields.kitchen]);
        if (place[config.places.fields.vibe]) tags.push(place[config.places.fields.vibe]);
        if (place[config.places.fields.location]) tags.push(place[config.places.fields.location]);

        popupInfo.innerHTML = tags.map(tag => `
            <span class="place-tag">${tag}</span>
        `).join('');
        
        // Описание
        if (place[config.places.fields.review]) {
            popupDescription.innerHTML = `
                <div class="description-container">
                    <h3>О месте</h3>
                    <p>${place[config.places.fields.review]}</p>
                </div>`;
        }
    }

    initMap(place, userLocation) {
        console.log('Initializing map for place:', place);
        console.log('User location:', userLocation);
        
        // Получаем координаты места
        const placeCoords = place.location.coordinates;
        console.log('Place coordinates:', placeCoords);
        
        // Определяем центр карты
        let center = [placeCoords[0], placeCoords[1]];
        let bounds = null;
        
        // Если есть геолокация пользователя, центрируем карту между двумя точками
        if (userLocation) {
            bounds = new mapboxgl.LngLatBounds(
                [placeCoords[0], placeCoords[1]],
                [userLocation.lng, userLocation.lat]
            );
            console.log('Map bounds:', bounds);
        }

        // Даем время на отрисовку контейнера
        setTimeout(() => {
            // Инициализируем карту
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: center,
                zoom: 12,
                interactive: true
            });

            console.log('Map container size:', this.map.getContainer().offsetWidth, 'x', this.map.getContainer().offsetHeight);

            // Добавляем маркер места
            const placeMarker = new mapboxgl.Marker({
                color: '#FF0000',
                scale: 1.2
            })
                .setLngLat([placeCoords[0], placeCoords[1]])
                .addTo(this.map);
            this.markers.push(placeMarker);

            // Если есть геолокация пользователя, добавляем его маркер
            if (userLocation) {
                const userMarker = new mapboxgl.Marker({
                    color: '#0000FF',
                    scale: 1.2
                })
                    .setLngLat([userLocation.lng, userLocation.lat])
                    .addTo(this.map);
                this.markers.push(userMarker);

                // Устанавливаем границы карты
                this.map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15,
                    duration: 1000
                });
            }
        }, 100);
    }
} 