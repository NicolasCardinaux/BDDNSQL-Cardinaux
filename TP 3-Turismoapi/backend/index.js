const express = require('express');
const redis = require('redis');
const haversine = require('haversine');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const client = redis.createClient({ url: 'redis://redis:6379' });
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

const categories = ['breweries', 'universities', 'pharmacies', 'emergencies', 'supermarkets'];


const predefinedPlaces = [
  { category: 'breweries', name: 'Cervecería del Puerto', lon: -58.2300, lat: -32.4820 },
  { category: 'universities', name: 'Universidad Autónoma de Entre Ríos (UADER)', lon: -58.2350, lat: -32.4860 },
  { category: 'pharmacies', name: 'Farmacia Central', lon: -58.2330, lat: -32.4835 },
  { category: 'emergencies', name: 'Hospital Justo José de Urquiza', lon: -58.2310, lat: -32.4850 },
  { category: 'supermarkets', name: 'Supermercado La Anónima', lon: -58.2340, lat: -32.4870 },
];

const initializePlaces = async () => {
  for (const place of predefinedPlaces) {
    const { category, name, lon, lat } = place;
    try {
      await client.geoAdd(category, { longitude: lon, latitude: lat, member: name });
      console.log(`Added ${name} to ${category}`);
    } catch (err) {
      console.error(`Error adding ${name}:`, err);
    }
  }
};


client.on('connect', async () => {
  console.log('Connected to Redis');
  await initializePlaces();
});


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para geocodificar una calle usando Nominatim
const geocodeAddress = async (address) => {
  try {
    await delay(1000);
    const fullAddress = `${address}`;
    console.log(`Geocoding address: ${fullAddress}`);
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'TourismAPI/1.0 (nicocardina01@gamil.com)',
      },
    });
    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } else {
      throw new Error('No se encontraron coordenadas para la dirección proporcionada');
    }
  } catch (err) {
    console.error('Error al geocodificar la dirección:', err.message);
    throw err;
  }
};


const getCardinalDirection = (start, end) => {
  const deltaLon = end.longitude - start.longitude;
  const deltaLat = end.latitude - start.latitude;


  const y = Math.sin(deltaLon * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180));
  const x = Math.cos(start.latitude * (Math.PI / 180)) * Math.sin(end.latitude * (Math.PI / 180)) -
            Math.sin(start.latitude * (Math.PI / 180)) * Math.cos(end.latitude * (Math.PI / 180)) * Math.cos(deltaLon * (Math.PI / 180));
  let bearing = Math.atan2(y, x) * (180 / Math.PI);

  bearing = (bearing + 360) % 360;

  // Mapear el ángulo a una dirección cardinal
  if (bearing >= 337.5 || bearing < 22.5) return 'Norte';
  if (bearing >= 22.5 && bearing < 67.5) return 'Noreste';
  if (bearing >= 67.5 && bearing < 112.5) return 'Este';
  if (bearing >= 112.5 && bearing < 157.5) return 'Sureste';
  if (bearing >= 157.5 && bearing < 202.5) return 'Sur';
  if (bearing >= 202.5 && bearing < 247.5) return 'Suroeste';
  if (bearing >= 247.5 && bearing < 292.5) return 'Oeste';
  if (bearing >= 292.5 && bearing < 337.5) return 'Noroeste';

  return 'Desconocido';
};

app.post('/places', async (req, res) => {
  const { category, name, lon, lat } = req.body;
  const key = category;
  try {
    const result = await client.geoAdd(key, { longitude: lon, latitude: lat, member: name });
    console.log(`Manually added ${name} to ${category}`);
    res.json({ success: true, added: result });
  } catch (err) {
    console.error('Error al agregar lugar:', err);
    res.status(500).json({ error: 'Error al agregar lugar: ' + err.message });
  }
});

app.get('/places', async (req, res) => {
  const { category, address } = req.query;
  const key = category;

  try {
    // Geocodificar la dirección para obtener latitud y longitud
    const userPos = await geocodeAddress(address);
    console.log(`User position: ${JSON.stringify(userPos)}`);


    const members = await client.zRange(key, 0, -1);
    if (!members || members.length === 0) {
      console.log(`No members found in category ${category}`);
      return res.json([]);
    }
    console.log(`Members in category ${category}: ${members}`);


    const positions = [];
    for (const member of members) {
      try {
        const pos = await client.geoPos(key, member);
        console.log(`Raw position for ${member}: ${JSON.stringify(pos)}`);
        if (pos && pos.length > 0 && pos[0] && 'longitude' in pos[0] && 'latitude' in pos[0]) {
          const longitude = parseFloat(pos[0].longitude);
          const latitude = parseFloat(pos[0].latitude);
          if (isNaN(longitude) || isNaN(latitude)) {
            console.log(`Coordenadas no numéricas para ${member}: longitude=${pos[0].longitude}, latitude=${pos[0].latitude}`);
            positions.push([null, null]);
          } else {
            positions.push([longitude, latitude]);
          }
        } else {
          console.log(`Posición no válida para ${member}: ${JSON.stringify(pos)}`);
          positions.push([null, null]);
        }
      } catch (err) {
        console.error(`Error al obtener posición para ${member}:`, err);
        positions.push([null, null]);
      }
    }

    // Filtrar miembros dentro de 5 km y calcular distancias
    const result = [];
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const position = positions[i];
      if (!position || position[0] === null || position[1] === null) {
        console.log(`Skipping ${member} due to invalid position`);
        continue;
      }

      const [memberLon, memberLat] = position;
      const memberPos = { latitude: memberLat, longitude: memberLon };
      const distance = haversine(userPos, memberPos, { unit: 'km' });
      console.log(`Distance to ${member}: ${distance} km`);

      if (distance <= 5) {
        result.push({ member, distance });
      }
    }

    result.sort((a, b) => a.distance - b.distance);
    console.log(`GEOSEARCH result for ${category}:`, result);
    res.json(result);
  } catch (err) {
    console.error('Error in GEOSEARCH:', err);
    res.status(500).json({ error: 'Error al buscar lugares: ' + err.message });
  }
});

app.get('/distance', async (req, res) => {
  const { category, point, address } = req.query;
  try {
    const userPos = await geocodeAddress(address);
    const positions = await client.geoPos(category, point);
    console.log(`Raw position for ${point}: ${JSON.stringify(positions)}`);
    if (
      !positions ||
      positions.length === 0 ||
      !positions[0] ||
      !('longitude' in positions[0]) ||
      !('latitude' in positions[0])
    ) {
      return res.status(404).json({ error: 'Point not found' });
    }
    const longitude = parseFloat(positions[0].longitude);
    const latitude = parseFloat(positions[0].latitude);
    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(500).json({ error: 'Coordenadas no válidas para el punto seleccionado' });
    }
    const end = { latitude, longitude };
    const distanceMeters = haversine(userPos, end, { unit: 'meter' });
    const direction = getCardinalDirection(userPos, end);
    res.json({ distance: distanceMeters, direction });
  } catch (err) {
    console.error('Error al calcular distancia:', err);
    res.status(500).json({ error: 'Error al calcular distancia: ' + err.message });
  }
});

app.listen(3000, () => {
  console.log('Backend listening on port 3000');
});