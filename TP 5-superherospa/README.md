Superhero SPA
Una elegante aplicación de una sola página (SPA) para gestionar superhéroes y villanos de cómics, con soporte para autocompletado, filtrado y persistencia de datos.

Requisitos

Docker y Docker Compose 
Node.js (para el frontend) 
Python 3.9 (para el backend y scripts) 


Instalación
Sigue estos pasos para poner en marcha el proyecto:

Clona el repositorio:
git clone https://github.com/tu-usuario/superhero-spa.git
cd superhero-spa


Inicia los contenedores:
docker-compose up -d


Instala las dependencias del frontend:
cd client
npm install


Inicia el frontend:
npm start


Carga los datos iniciales:
cd scripts
python populate_db.py




 Uso

 Accede a http://localhost:3000 para explorar la SPA.
 Usa el formulario en /add para agregar nuevos personajes.
 Filtra por nombre en la página principal o por casa en /marvel o /dc.




