document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api/airports';

  
    const loader = document.getElementById('loader');
    const centerUserLocationButton = document.getElementById('center-user-location');
    const themeToggleButton = document.getElementById('theme-toggle');
    const toggleSidebarButton = document.getElementById('toggle-sidebar');
    const toggleManageButton = document.getElementById('toggle-manage');
    const sidebar = document.querySelector('.sidebar');
    const searchView = document.getElementById('search-view');
    const manageView = document.getElementById('manage-view');
    let airportsCache = [];
    let isManageViewActive = false;

  
    const createAirportForm = document.getElementById('create-airport-form');
    const createResultDiv = document.getElementById('create-result');
    const searchManageForm = document.getElementById('search-manage-form');
    const manageAirportDetailsDiv = document.getElementById('manage-airport-details');
    const updateAirportForm = document.getElementById('update-airport-form');
    const manageResultDiv = document.getElementById('manage-result');
    const deleteAirportButton = document.getElementById('delete-airport');


    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: ['#ff00ff', '#00ffcc', '#ffd700'] },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: '#00ffcc', opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out' }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });


    const map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 19,
        worldCopyJump: false,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = L.markerClusterGroup();
    map.addLayer(markers);

    const airportInfoDiv = document.getElementById('airport-info');
    const popularAirportsList = document.getElementById('popular-airports-list');
    const nearbyForm = document.getElementById('nearby-form');
    const nearbyAirportsList = document.getElementById('nearby-airports-list');
    const searchAirportForm = document.getElementById('search-airport-form');


    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        themeToggleButton.innerHTML = document.body.classList.contains('dark-theme') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });


    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.toggle('visible');
    });

 
    toggleManageButton.addEventListener('click', () => {
        isManageViewActive = !isManageViewActive;
        if (isManageViewActive) {
            searchView.style.display = 'none';
            manageView.style.display = 'block';
            toggleManageButton.title = 'Volver a Búsqueda';
            toggleManageButton.innerHTML = '<i class="fas fa-search"></i>';
        } else {
            searchView.style.display = 'block';
            manageView.style.display = 'none';
            toggleManageButton.title = 'Gestionar Aeropuertos';
            toggleManageButton.innerHTML = '<i class="fas fa-cogs"></i>';
        }
    });


    async function fetchAndDisplayAllAirports() {
        try {
            const response = await fetch(`${API_BASE_URL}/`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const airports = await response.json();
            airportsCache = airports;

            markers.clearLayers();

            airports.forEach(airport => {
                if (airport.latitude != null && airport.longitude != null) {
                    const marker = L.marker([airport.latitude, airport.longitude]);
                    marker.on('click', () => {
                        fetchAndShowAirportDetails(airport.iata_code);
                        map.setView([airport.latitude, airport.longitude], 10);
                        marker.bindPopup(`
                            <h3>${airport.name} (${airport.iata_code})</h3>
                            <p><strong>Ciudad:</strong> ${airport.city}</p>
                            <p><strong>País:</strong> ${airport.country}</p>
                            <p><strong>Latitud:</strong> ${airport.latitude.toFixed(4)}</p>
                            <p><strong>Longitud:</strong> ${airport.longitude.toFixed(4)}</p>
                        `).openPopup();
                    });
                    markers.addLayer(marker);
                }
            });

            loader.classList.add('hidden');
        } catch (error) {
            console.error("Error fetching all airports:", error);
            airportInfoDiv.innerHTML = `<p style="color:#ffd700;">Error al cargar aeropuertos: ${error.message}</p>`;
            loader.classList.add('hidden');
        }
    }


    async function fetchAndShowAirportDetails(iataCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/${iataCode}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const airport = await response.json();

            airportInfoDiv.innerHTML = `
                <h3>${airport.name} (${airport.iata_code})</h3>
                <p><strong>Ciudad:</strong> ${airport.city}</p>
                <p><strong>País:</strong> ${airport.country}</p>
                <p><strong>Latitud:</strong> ${airport.latitude.toFixed(4)}</p>
                <p><strong>Longitud:</strong> ${airport.longitude.toFixed(4)}</p>
                ${airport.altitude ? `<p><strong>Altitud:</strong> ${airport.altitude}m</p>` : ''}
                ${airport.timezone ? `<p><strong>Zona Horaria:</strong> ${airport.timezone}</p>` : ''}
            `;
            fetchPopularAirports();
            map.setView([airport.latitude, airport.longitude], 10);
        } catch (error) {
            console.error(`Error fetching details for ${iataCode}:`, error);
            airportInfoDiv.innerHTML = `<p style="color:#ffd700;">Error al encontrar el aeropuerto: ${error.message}</p>`;
        }
    }

    searchAirportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const searchName = document.getElementById('name-search').value.toLowerCase();

        if (!searchName) {
            alert('Por favor, ingresa el nombre del aeropuerto.');
            return;
        }

        const foundAirport = airportsCache.find(airport =>
            airport.name.toLowerCase().includes(searchName)
        );

        if (foundAirport) {
            fetchAndShowAirportDetails(foundAirport.iata_code);
        } else {
            alert('No se encontró un aeropuerto con ese nombre.');
            airportInfoDiv.innerHTML = `<p style="color:#ffd700;">No se encontró un aeropuerto de ese nombre.</p>`;
        }
    });


    async function fetchPopularAirports() {
        try {
            const response = await fetch(`${API_BASE_URL}/popular/stats?limit=5`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const popular = await response.json();

            popularAirportsList.innerHTML = '';
            if (popular.length === 0) {
                popularAirportsList.innerHTML = '<li>No hay datos de popularidad aún.</li>';
            } else {
                popular.forEach(airport => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas fa-plane-departure"></i> ${airport.name} (${airport.iata_code}) - ${airport.visits} visitas`;
                    li.onclick = () => fetchAndShowAirportDetails(airport.iata_code);
                    popularAirportsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Error al cargar aeropuertos populares:", error);
            popularAirportsList.innerHTML = '<li>Error al cargar populares.</li>';
        }
    }


    nearbyForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const lat = document.getElementById('lat').value;
        const lng = document.getElementById('lng').value;
        const radius = document.getElementById('radius').value;

        if (!lat || !lng || !radius) {
            alert('Por favor, completa latitud, longitud y radio.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/nearby/query?lat=${lat}&lng=${lng}&radius=${radius}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const nearby = await response.json();

            nearbyAirportsList.innerHTML = '';
            if (nearby.length === 0) {
                nearbyAirportsList.innerHTML = '<li>No se encontraron aeropuertos cercanos.</li>';
            } else {
                nearby.forEach(airport => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fas fa-map-pin"></i> ${airport.name} (${airport.iata_code}) - ${airport.distance_km} km
                                    <br><small>(${airport.city}, ${airport.country})</small>`;
                    li.onclick = () => {
                        fetchAndShowAirportDetails(airport.iata_code);
                        map.setView([airport.latitude, airport.longitude], 10);
                    };
                    nearbyAirportsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Error al buscar aeropuertos cercanos:", error);
            nearbyAirportsList.innerHTML = '<li>Error al buscar aeropuertos cercanos.</li>';
        }
    });

    centerUserLocationButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                map.setView([position.coords.latitude, position.coords.longitude], 10);
                document.getElementById('lat').value = position.coords.latitude.toFixed(4);
                document.getElementById('lng').value = position.coords.longitude.toFixed(4);
            }, () => {
                alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la geolocalización.');
            });
        } else {
            alert('Tu navegador no soporta geolocalización.');
        }
    });


    createAirportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(createAirportForm);
        const airportData = Object.fromEntries(formData);

        if (airportData.iata_faa.length !== 3) {
            createResultDiv.innerHTML = `<p style="color:#ffd700;">El código IATA debe tener exactamente 3 letras.</p>`;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(airportData)
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

            createResultDiv.innerHTML = `<p style="color:#00ffcc;">Aeropuerto creado: ${result.name} (${result.iata_code})</p>`;
            createAirportForm.reset();
            airportsCache.push(result);
            if (result.latitude != null && result.longitude != null) {
                const marker = L.marker([result.latitude, result.longitude]);
                marker.on('click', () => {
                    fetchAndShowAirportDetails(result.iata_code);
                    map.setView([result.latitude, result.longitude], 10);
                    marker.bindPopup(`
                        <h3>${result.name} (${result.iata_code})</h3>
                        <p><strong>Ciudad:</strong> ${result.city}</p>
                        <p><strong>País:</strong> ${result.country}</p>
                        <p><strong>Latitud:</strong> ${result.latitude.toFixed(4)}</p>
                        <p><strong>Longitud:</strong> ${result.longitude.toFixed(4)}</p>
                    `).openPopup();
                });
                markers.addLayer(marker);
            }
        } catch (error) {
            console.error('Error al crear aeropuerto:', error);
            createResultDiv.innerHTML = `<p style="color:#ffd700;">Error al crear aeropuerto: ${error.message}</p>`;
        }
    });


    searchManageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const searchName = document.getElementById('manage-name-search').value.toLowerCase();

        if (!searchName) {
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Por favor, ingresa el nombre del aeropuerto.</p>`;
            return;
        }

        const foundAirport = airportsCache.find(airport =>
            airport.name.toLowerCase().includes(searchName)
        );

        if (!foundAirport) {
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">No se encontró un aeropuerto con ese nombre.</p>`;
            updateAirportForm.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${foundAirport.iata_code}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const airport = await response.json();

            manageAirportDetailsDiv.innerHTML = `
                <p><strong>Nombre:</strong> ${airport.name}</p>
                <p><strong>Ciudad:</strong> ${airport.city}</p>
                <p><strong>País:</strong> ${airport.country}</p>
                <p><strong>Latitud:</strong> ${airport.latitude.toFixed(4)}</p>
                <p><strong>Longitud:</strong> ${airport.longitude.toFixed(4)}</p>
                ${airport.altitude ? `<p><strong>Altitud:</strong> ${airport.altitude}m</p>` : ''}
                ${airport.timezone ? `<p><strong>Zona Horaria:</strong> ${airport.timezone}</p>` : ''}
            `;
            updateAirportForm.style.display = 'block';
            document.getElementById('update-name').value = airport.name;
            document.getElementById('update-city').value = airport.raw_city_info;
            document.getElementById('update-lat').value = airport.latitude;
            document.getElementById('update-lng').value = airport.longitude;
            document.getElementById('update-alt').value = airport.altitude || '';
            document.getElementById('update-tz').value = airport.timezone || '';
        } catch (error) {
            console.error(`Error al buscar detalles para ${searchName}:`, error);
            manageAirportDetailsDiv.innerHTML = `<p style="color:#ffd700;">Error al buscar aeropuerto: ${error.message}</p>`;
            updateAirportForm.style.display = 'none';
        }
    });


    updateAirportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const searchName = document.getElementById('manage-name-search').value.toLowerCase();
        const foundAirport = airportsCache.find(airport =>
            airport.name.toLowerCase().includes(searchName)
        );

        if (!foundAirport) {
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Aeropuerto no encontrado.</p>`;
            return;
        }

        const iataCode = foundAirport.iata_code;
        const formData = new FormData(updateAirportForm);
        const airportData = Object.fromEntries(formData);

        try {
            const response = await fetch(`${API_BASE_URL}/${iataCode}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(airportData)
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

            manageResultDiv.innerHTML = `<p style="color:#00ffcc;">Aeropuerto actualizado: ${result.name} (${result.iata_code})</p>`;
            manageAirportDetailsDiv.innerHTML = `
                <p><strong>Nombre:</strong> ${result.name}</p>
                <p><strong>Ciudad:</strong> ${result.city}</p>
                <p><strong>País:</strong> ${result.country}</p>
                <p><strong>Latitud:</strong> ${result.latitude.toFixed(4)}</p>
                <p><strong>Longitud:</strong> ${result.longitude.toFixed(4)}</p>
                ${result.altitude ? `<p><strong>Altitud:</strong> ${result.altitude}m</p>` : ''}
                ${result.timezone ? `<p><strong>Zona Horaria:</strong> ${result.timezone}</p>` : ''}
            `;

            const index = airportsCache.findIndex(airport => airport.iata_code === result.iata_code);
            if (index !== -1) {
                airportsCache[index] = result;
            }
            markers.clearLayers();
            airportsCache.forEach(airport => {
                if (airport.latitude != null && airport.longitude != null) {
                    const marker = L.marker([airport.latitude, airport.longitude]);
                    marker.on('click', () => {
                        fetchAndShowAirportDetails(airport.iata_code);
                        map.setView([airport.latitude, airport.longitude], 10);
                        marker.bindPopup(`
                            <h3>${airport.name} (${airport.iata_code})</h3>
                            <p><strong>Ciudad:</strong> ${airport.city}</p>
                            <p><strong>País:</strong> ${airport.country}</p>
                            <p><strong>Latitud:</strong> ${airport.latitude.toFixed(4)}</p>
                            <p><strong>Longitud:</strong> ${airport.longitude.toFixed(4)}</p>
                        `).openPopup();
                    });
                    markers.addLayer(marker);
                }
            });
        } catch (error) {
            console.error('Error al actualizar aeropuerto:', error);
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Error al actualizar aeropuerto: ${error.message}</p>`;
        }
    });


    deleteAirportButton.addEventListener('click', async () => {
        const searchName = document.getElementById('manage-name-search').value.toLowerCase();
        const foundAirport = airportsCache.find(airport =>
            airport.name.toLowerCase().includes(searchName)
        );

        if (!foundAirport) {
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Aeropuerto no encontrado.</p>`;
            return;
        }

        const iataCode = foundAirport.iata_code;
        if (!confirm(`¿Estás seguro de que deseas eliminar el aeropuerto ${foundAirport.name} (${iataCode})?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${iataCode}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || `HTTP error! status: ${response.status}`);

            manageResultDiv.innerHTML = `<p style="color:#00ffcc;">Aeropuerto eliminado: ${iataCode}</p>`;
            manageAirportDetailsDiv.innerHTML = `<p>Busca otro aeropuerto para modificar o eliminar.</p>`;
            updateAirportForm.style.display = 'none';
            searchManageForm.reset();

            airportsCache = airportsCache.filter(airport => airport.iata_code !== iataCode);
            markers.clearLayers();
            airportsCache.forEach(airport => {
                if (airport.latitude != null && airport.longitude != null) {
                    const marker = L.marker([airport.latitude, airport.longitude]);
                    marker.on('click', () => {
                        fetchAndShowAirportDetails(airport.iata_code);
                        map.setView([airport.latitude, airport.longitude], 10);
                        marker.bindPopup(`
                            <h3>${airport.name} (${airport.iata_code})</h3>
                            <p><strong>Ciudad:</strong> ${airport.city}</p>
                            <p><strong>País:</strong> ${airport.country}</p>
                            <p><strong>Latitud:</strong> ${airport.latitude.toFixed(4)}</p>
                            <p><strong>Longitud:</strong> ${airport.longitude.toFixed(4)}</p>
                        `).openPopup();
                    });
                    markers.addLayer(marker);
                }
            });
        } catch (error) {
            console.error('Error al eliminar aeropuerto:', error);
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Error al eliminar aeropuerto: ${error.message}</p>`;
        }
    });


    fetchAndDisplayAllAirports();
    fetchPopularAirports();


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            map.setView([position.coords.latitude, position.coords.longitude], 6);
            document.getElementById('lat').value = position.coords.latitude.toFixed(4);
            document.getElementById('lng').value = position.coords.longitude.toFixed(4);
        }, () => {
            console.warn('Error al obtener geolocalización. El mapa permanecerá con vista global.');
        });
    }
});