# API de Turismo - Concepción del Uruguay

## Descripción del Proyecto

Este proyecto es una **API de Turismo** desarrollada para Concepción del Uruguay, Entre Ríos, Argentina. Permite a los usuarios buscar puntos de interés cercanos (dentro de un radio de 5 km) a partir de una dirección específica (calle y número), y también permite agregar nuevos puntos de interés de manera manual. Los puntos de interés están organizados en las siguientes categorías:

- **Cervecerías artesanales** (`breweries`)
- **Universidades** (`universities`)
- **Farmacias** (`pharmacies`)
- **Centros de atención de emergencias** (`emergencies`)
- **Supermercados** (`supermarkets`)

La aplicación utiliza **Redis** como base de datos para almacenar los puntos de interés de manera geoespacial, y **Nominatim (OpenStreetMap)** para geocodificar direcciones (convertirlas en coordenadas de latitud y longitud). La API calcula distancias y direcciones cardinales (Norte, Sur, Este, etc.) desde la ubicación del usuario hasta los puntos de interés.

El proyecto está dividido en:
- **Frontend**: Una interfaz web desarrollada en React para buscar y agregar puntos de interés.
- **Backend**: Una API REST desarrollada en Node.js que maneja las solicitudes y la lógica de geocodificación.
- **Redis**: Base de datos para almacenar los puntos de interés.

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado lo siguiente:

- **Docker** y **Docker Compose**: Para gestionar los contenedores del frontend, backend y Redis.
- **Node.js** (opcional): Si deseas ejecutar el proyecto sin Docker, necesitarás Node.js para instalar dependencias.
- Conexión a internet: Para que Nominatim pueda geocodificar las direcciones.

## Instalación

1. **Clona el Repositorio** (si estás trabajando con un repositorio remoto):
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd tp3-turismoapi
