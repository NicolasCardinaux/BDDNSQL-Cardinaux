Superhero SPA
Una Single Page Application para gestionar superhéroes y villanos de cómics.
Requisitos

Docker y Docker Compose
Node.js
Python 3.9

Instalación

Clonar el repositorio:git clone <repositorio>
cd superhero-spa


Iniciar los contenedores:docker-compose up -d


Instalar dependencias del frontend:cd client
npm install


Iniciar el frontend:npm start


Cargar datos iniciales:cd scripts
python populate_db.py



Uso

Accede a http://localhost:3000 para ver la SPA.
Usa el formulario en /add para añadir personajes.
Filtra por nombre en la página principal o por casa en /marvel o /dc.

