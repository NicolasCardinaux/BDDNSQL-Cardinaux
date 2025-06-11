# API Aeropuertos

Una aplicación web para visualizar y gestionar aeropuertos en un mapa interactivo, integrando MongoDB, Redis GEO, Redis Popularidad, una API REST y un frontend con Leaflet.js, orquestada con Docker Compose.

## Estructura del Proyecto

- `backend/`: API REST con Node.js, MongoDB y Redis.
- `frontend/`: Frontend estático con Leaflet.js y Leaflet.markercluster.
- `docker-compose.yml`: Configuración de todos los servicios.

## Requisitos

- Node.js
- Docker y Docker Compose
- MongoDB Atlas 
- Redis Cloud 

## Instalación Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/api-aeropuertos.git
   cd api-aeropuertos
   ```

2. Configura el backend:
   ```bash
   cd backend
   npm install
   cp .env
   ```
   Edita `.env` con las credenciales de MongoDB y Redis (local o en la nube).

3. Inicia los servicios con Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Accede al frontend en `http://localhost:8080`.

## Funcionalidades

### Carga Inicial de Datos
- Usa `airports.json` para cargar datos en MongoDB y Redis GEO al iniciar.
- Prepara Redis Popularidad (ZSET vacío con TTL de 1 día).

### API REST - CRUD de Aeropuertos
- `POST /airports`: Crea un aeropuerto en MongoDB y Redis GEO.
- `GET /airports`: Lista todos los aeropuertos.
- `GET /airports/{iata_code}`: Devuelve un aeropuerto y suma +1 a su popularidad.
- `PUT /airports/{iata_code}`: Modifica un aeropuerto.
- `DELETE /airports/{iata_code}`: Elimina un aeropuerto de todas las bases.

### Consultas Geoespaciales
- `GET /airports/nearby?lat=..&lng=..&radius=km`: Busca aeropuertos cercanos con Redis GEO.

### Estadísticas de Popularidad
- `GET /airports/popular`: Devuelve los aeropuertos más visitados (Redis Popularidad).

### Frontend con Leaflet
- Muestra aeropuertos en un mapa con agrupación de marcadores.
- Al clicar un marcador, muestra detalles y registra una visita.

## Despliegue

1. Configura MongoDB Atlas y Redis Cloud con las credenciales en `.env`.
2. Despliega el frontend en Vercel (carpeta `frontend/public`).
3. Despliega el backend en Render (carpeta `backend`).
4. Define las variables de entorno en Vercel y Render.

## Verificación en Consola

- **MongoDB:** `docker exec -it mongo_airports mongosh` → `use airport_db` → `db.airports.find().pretty()`.
- **Redis GEO:** `docker exec -it redis_geo_airports redis-cli` → `GEOPOS airports-geo {iata_code}`.
- **Redis Popularidad:** `docker exec -it redis_pop_airports redis-cli` → `ZRANGE airport_popularity 0 -1 WITHSCORES`.


