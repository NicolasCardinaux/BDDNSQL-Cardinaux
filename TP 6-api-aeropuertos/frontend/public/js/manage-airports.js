document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api/airports';

    const themeToggleButton = document.getElementById('theme-toggle');
    const closeWindowButton = document.getElementById('close-window');
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


    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        themeToggleButton.innerHTML = document.body.classList.contains('dark-theme') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

 
    closeWindowButton.addEventListener('click', () => {
        window.close();
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
        } catch (error) {
            console.error('Error creating airport:', error);
            createResultDiv.innerHTML = `<p style="color:#ffd700;">Error al crear aeropuerto: ${error.message}</p>`;
        }
    });

    searchManageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const iataCode = document.getElementById('manage-iata-search').value.toUpperCase();

        if (!iataCode || iataCode.length !== 3) {
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Por favor, ingresa un código IATA válido (3 letras).</p>`;
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${iataCode}`);
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
            console.error(`Error fetching details for ${iataCode}:`, error);
            manageAirportDetailsDiv.innerHTML = `<p style="color:#ffd700;">Error al buscar aeropuerto: ${error.message}</p>`;
            updateAirportForm.style.display = 'none';
        }
    });

    updateAirportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const iataCode = document.getElementById('manage-iata-search').value.toUpperCase();
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
        } catch (error) {
            console.error('Error updating airport:', error);
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Error al actualizar aeropuerto: ${error.message}</p>`;
        }
    });


    deleteAirportButton.addEventListener('click', async () => {
        const iataCode = document.getElementById('manage-iata-search').value.toUpperCase();
        if (!confirm(`¿Estás seguro de que deseas eliminar el aeropuerto ${iataCode}?`)) return;

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
        } catch (error) {
            console.error('Error deleting airport:', error);
            manageResultDiv.innerHTML = `<p style="color:#ffd700;">Error al eliminar aeropuerto: ${error.message}</p>`;
        }
    });
});