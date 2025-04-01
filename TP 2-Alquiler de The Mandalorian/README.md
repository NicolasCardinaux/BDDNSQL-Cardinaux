# Alquiler de Episodios de The Mandalorian

## Estructura del Proyecto
- .devcontainer/: Configuración para desarrollo en VS Code
- templates/: Plantillas HTML
- app.py: Aplicación Flask principal
- Dockerfile: Configuración de contenedor
- requirements.txt: Dependencias

## Para ejecutar
1. Instalar Docker Desktop
2. Abrir en VS Code
3. Reopen in Container
4. Acceder a http://localhost:5000

## Descripción

**Alquiler de The Mandalorian** es una aplicación web que permite a los usuarios alquilar episodios de la serie *The Mandalorian*. Los episodios están organizados por temporadas, y los usuarios pueden reservar un episodio por 4 minutos antes de confirmar el pago. Una vez confirmado el pago, el episodio queda alquilado por 24 horas. La aplicación utiliza Redis para persistir el estado de los episodios, asegurando que las reservas y alquileres se mantengan incluso si el servidor se reinicia.

### Características principales
- **Listado de episodios**: Muestra los episodios organizados por temporada, con su estado (disponible, reservado, alquilado), precio y tiempo restante de alquiler (si aplica).
- **Reserva de episodios**: Los usuarios pueden reservar un episodio por 4 minutos antes de confirmar el pago.
- **Confirmación de pago**: Una vez reservado, los usuarios pueden confirmar el pago para alquilar el episodio por 24 horas.
- **Persistencia**: El estado de los episodios (disponible, reservado, alquilado) se guarda en Redis, asegurando que no se pierda al reiniciar el servidor.
- **Interfaz amigable**: Diseño moderno con gradientes, sombras, y transiciones suaves para una mejor experiencia de usuario.
- **Manejo de errores**: La aplicación muestra mensajes claros si hay errores (por ejemplo, si la reserva expira o el episodio no está disponible).

## Tecnologías utilizadas

- **Backend**:
  - Python 3.6
  - Flask: Framework web para manejar las rutas y la lógica del servidor.
  - Redis: Base de datos en memoria para persistir el estado de los episodios.
- **Frontend**:
  - HTML/CSS/JavaScript: Interfaz de usuario con diseño responsivo.
  - Jinja2: Motor de plantillas para renderizar las páginas dinámicamente.
- **Contenedores**:
  - Docker: Para empaquetar y ejecutar la aplicación en un entorno aislado.
  - Docker Compose: Para gestionar los servicios (aplicación Flask y Redis).

