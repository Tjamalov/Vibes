class PlaceDetails {
    constructor() {
        this.popup = document.getElementById('placePopup');
        this.popupClose = this.popup.querySelector('.popup-close');
        this.map = null;
        this.markers = [];
        this.init();
    }

    init() {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        this.popupClose.addEventListener('click', () => this.close());
        
        this.popup.addEventListener('click', (e) => {
            if (e.target === this.popup) {
                this.close();
            }
        });
    }

    show(place, userLocation) {
        this.renderContent(place);
        this.popup.classList.add('active');
        
        setTimeout(() => {
            this.initMap(place, userLocation);
        }, 100);
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
        const popupTitle = this.popup.querySelector('.popup-title');
        const popupPhoto = this.popup.querySelector('.popup-photo');
        const popupInfo = this.popup.querySelector('.popup-info');
        const popupDescription = this.popup.querySelector('.popup-description');

        popupTitle.textContent = place[config.places.fields.name];
        
        if (place[config.places.fields.placephotos]) {
            popupPhoto.style.display = 'block';
            popupPhoto.innerHTML = `
                <img src="${place[config.places.fields.placephotos]}" 
                     alt="${place[config.places.fields.name]}"
                     class="place-photo">`;
        } else {
            popupPhoto.style.display = 'none';
        }

        const tags = [];
        if (place[config.places.fields.type]) tags.push(place[config.places.fields.type]);
        if (place[config.places.fields.kitchen]) tags.push(place[config.places.fields.kitchen]);
        if (place[config.places.fields.vibe]) tags.push(place[config.places.fields.vibe]);
        if (place[config.places.fields.location]) tags.push(place[config.places.fields.location]);

        popupInfo.innerHTML = tags.map(tag => `
            <span class="place-tag">${tag}</span>
        `).join('');
        
        if (place[config.places.fields.review]) {
            popupDescription.innerHTML = `
                <div class="description-container">
                    <h3>О месте</h3>
                    <p>${place[config.places.fields.review]}</p>
                </div>`;
        }
    }

    async initMap(place) {
        if (!this.map) {
            // Получаем координаты из PostGIS location
            const coords = place.location.coordinates;
            const [placeLng, placeLat] = coords;

            console.log('Place coordinates:', { placeLng, placeLat });
            console.log('User location:', window.userLocation);

            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [placeLng, placeLat],
                zoom: 14
            });

            this.map.on('load', () => {
                // Добавляем маркер места
                new mapboxgl.Marker({
                    color: '#FF0000'
                })
                    .setLngLat([placeLng, placeLat])
                    .addTo(this.map);

                // Если есть координаты пользователя, добавляем маркер и маршрут
                if (window.userLocation && window.userLocation.lat && window.userLocation.lng) {
                    console.log('Adding user marker at:', window.userLocation);
                    
                    // Добавляем маркер пользователя
                    new mapboxgl.Marker({
                        color: '#0000FF'
                    })
                        .setLngLat([window.userLocation.lng, window.userLocation.lat])
                        .addTo(this.map);

                    // Запрашиваем маршрут
                    // Mapbox Directions API ожидает координаты в формате [lng, lat]
                    const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${window.userLocation.lng},${window.userLocation.lat};${placeLng},${placeLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

                    console.log('Requesting route:', directionsRequest);

                    fetch(directionsRequest)
                        .then(response => response.json())
                        .then(data => {
                            console.log('Route data:', data);
                            if (data.routes && data.routes.length > 0) {
                                // Добавляем маршрут на карту
                                this.map.addSource('route', {
                                    type: 'geojson',
                                    data: {
                                        type: 'Feature',
                                        properties: {},
                                        geometry: data.routes[0].geometry
                                    }
                                });

                                this.map.addLayer({
                                    id: 'route',
                                    type: 'line',
                                    source: 'route',
                                    layout: {
                                        'line-join': 'round',
                                        'line-cap': 'round'
                                    },
                                    paint: {
                                        'line-color': '#3b82f6',
                                        'line-width': 4
                                    }
                                });

                                // Подстраиваем карту под маршрут
                                const coordinates = data.routes[0].geometry.coordinates;
                                const bounds = coordinates.reduce((bounds, coord) => {
                                    return bounds.extend(coord);
                                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                                this.map.fitBounds(bounds, {
                                    padding: 50
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching route:', error);
                        });
                } else {
                    console.log('No valid user location available');
                }
            });
        } else {
            // Обновляем существующую карту
            const coords = place.location.coordinates;
            const [placeLng, placeLat] = coords;
            
            this.map.flyTo({
                center: [placeLng, placeLat],
                zoom: 14
            });
        }
    }
} 