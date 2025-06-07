# Superhero SPA

Una elegante aplicación de una sola página (SPA) para gestionar superhéroes y villanos de cómics, con soporte para autocompletado, filtrado y persistencia de datos.

## Requisitos

- Docker y Docker Compose
- Node.js (para el frontend)
- Python 3.9 (para el backend y scripts)

## Instalación

Sigue estos pasos para poner en marcha el proyecto:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/superhero-spa.git
   cd superhero-spa
   ```

2. Inicia los contenedores:
   ```bash
   docker-compose up -d
   ```

3. Instala las dependencias del frontend:
   ```bash
   cd client
   npm install
   ```

4. Inicia el frontend:
   ```bash
   npm start
   ```

5. Carga los datos iniciales:
   ```bash
   cd scripts
   python populate_db.py
   ```

## Uso

- Accede a `http://localhost:3000` para explorar el SPA.
- Usa el formulario en `/add` para agregar nuevos personajes.
- Filtra por nombre en la página principal o por casa en `/marvel` o `/dc`.

