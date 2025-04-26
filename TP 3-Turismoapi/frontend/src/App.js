import React, { useState } from 'react';
import './App.css';

function App() {
  const [category, setCategory] = useState('breweries');
  const [address, setAddress] = useState('Carosini 190, Concepción del Uruguay');
  const [places, setPlaces] = useState([]);
  const [newPlace, setNewPlace] = useState({ name: '', lon: '', lat: '' });
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [error, setError] = useState(null);

  const fetchPlaces = async () => {
    try {
      const fullAddress = `${address}, Concepción del Uruguay, Entre Ríos, Argentina`;
      const response = await fetch(`http://localhost:5000/places?category=${category}&address=${encodeURIComponent(fullAddress)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener lugares');
      }
      const data = await response.json();
      setPlaces(data);
      setSelectedDistance(null);
      setError(null);
    } catch (err) {
      console.error('Error al obtener lugares:', err);
      setError(err.message);
      setPlaces([]);
    }
  };

  const addPlace = async () => {
    if (!newPlace.name || !newPlace.lon || !newPlace.lat) {
      alert('Por favor, completa todos los campos');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          name: newPlace.name,
          lon: parseFloat(newPlace.lon),
          lat: parseFloat(newPlace.lat),
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Lugar agregado exitosamente!');
        setNewPlace({ name: '', lon: '', lat: '' });
        fetchPlaces();
      } else {
        alert('No se pudo agregar el lugar');
      }
    } catch (err) {
      console.error('Error al agregar lugar:', err);
      alert('Error al agregar lugar');
    }
  };

  const calculateDistance = async (place) => {
    try {
      const fullAddress = `${address}, Concepción del Uruguay, Entre Ríos, Argentina`;
      const response = await fetch(
        `http://localhost:5000/distance?category=${category}&point=${encodeURIComponent(place.member)}&address=${encodeURIComponent(fullAddress)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al calcular distancia');
      }
      const data = await response.json();
      if (data.distance !== undefined && data.direction) {
        setSelectedDistance({ place: place.member, distance: data.distance, direction: data.direction });
      } else {
        setSelectedDistance({ place: place.member, distance: 'No encontrado', direction: 'Desconocido' });
      }
    } catch (err) {
      console.error('Error al calcular la distancia:', err);
      setSelectedDistance({ place: place.member, distance: 'Error: ' + err.message, direction: 'Desconocido' });
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>API de Turismo - Concepción del Uruguay</h1>
      </header>
      <main className="main-content">
        <section className="add-place-section">
          <h2>Agregar Nuevo Lugar</h2>
          <div className="form-group">
            <label>Categoría:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="breweries">Cervecerías</option>
              <option value="universities">Universidades</option>
              <option value="pharmacies">Farmacias</option>
              <option value="emergencies">Emergencias</option>
              <option value="supermarkets">Supermercados</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={newPlace.name}
              onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
              placeholder="Ingresa el nombre del lugar"
            />
          </div>
          <div className="form-group">
            <label>Latitud:</label>
            <input
              type="text"
              value={newPlace.lat}
              onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })}
              placeholder="Ingresa la latitud"
            />
          </div>
          <div className="form-group">
            <label>Longitud:</label>
            <input
              type="text"
              value={newPlace.lon}
              onChange={(e) => setNewPlace({ ...newPlace, lon: e.target.value })}
              placeholder="Ingresa la longitud"
            />
          </div>
          <button className="action-button" onClick={addPlace}>
            Agregar Lugar
          </button>
        </section>

        <section className="search-section">
          <h2>Buscar Lugares (dentro de 5 km)</h2>
          <div className="form-group">
            <label>Categoría:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="breweries">Cervecerías</option>
              <option value="universities">Universidades</option>
              <option value="pharmacies">Farmacias</option>
              <option value="emergencies">Emergencias</option>
              <option value="supermarkets">Supermercados</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tu Ubicación (Calle y Número):</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ingresa la calle y número (ej. Carosini 190)"
            />
          </div>
          <button className="action-button" onClick={fetchPlaces}>
            Obtener Lugares
          </button>
        </section>

        <section className="results-section">
          <h2>Lugares Encontrados</h2>
          {error && <p className="error-message">{error}</p>}
          {places.length > 0 ? (
            <ul className="places-list">
              {places.map((place, index) => (
                <li key={index} className="place-item">
                  <div className="place-row">
                    <span className="place-name">{place.member}</span>
                    <span className="place-distance">{place.distance.toFixed(2)} km</span>
                    <button
                      className="distance-button"
                      onClick={() => calculateDistance(place)}
                    >
                      Calcular Distancia
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron lugares dentro de 5 km.</p>
          )}
          {selectedDistance && (
            <div className="distance-result">
              <h3>Distancia a {selectedDistance.place}:</h3>
              <p>
                {typeof selectedDistance.distance === 'number'
                  ? `${selectedDistance.distance.toFixed(2)} metros`
                  : selectedDistance.distance}
              </p>
              <p>Dirección: {selectedDistance.direction}</p>
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <p>© 2025 API de Turismo - Concepción del Uruguay</p>
      </footer>
    </div>
  );
}

export default App;