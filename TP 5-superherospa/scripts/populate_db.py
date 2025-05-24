import requests
from pymongo import MongoClient
import random
import os
from urllib.parse import urlparse
from werkzeug.utils import secure_filename

# Conectar a MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['superhero_db']
heroes_collection = db['heroes']

# Crear carpeta para imágenes
UPLOAD_FOLDER = '../server/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Solicitar confirmación al usuario
print("¿Desea borrar los datos existentes y descargar 40 nuevos héroes/villanos? (y/n)")
user_input = input().lower()
if user_input != 'y':
    print("Operación cancelada. No se han modificado los datos.")
    exit()

# Eliminar datos existentes
heroes_collection.delete_many({})

# Obtener datos de la API externa
response = requests.get('https://akabab.github.io/superhero-api/api/all.json')
heroes = response.json()

# Filtrar por casas
marvel_heroes = [h for h in heroes if h.get('biography', {}).get('publisher', '') == 'Marvel Comics']
dc_heroes = [h for h in heroes if h.get('biography', {}).get('publisher', '') == 'DC Comics']
other_heroes = [h for h in heroes if h.get('biography', {}).get('publisher', '') not in ['Marvel Comics', 'DC Comics']]

# Seleccionar héroes
selected_heroes = []
selected_heroes.extend(random.sample(marvel_heroes, min(10, len(marvel_heroes))))
selected_heroes.extend(random.sample(dc_heroes, min(10, len(dc_heroes))))
remaining = 40 - len(selected_heroes)
selected_heroes.extend(random.sample(other_heroes, min(remaining, len(other_heroes))))

# Insertar en MongoDB
for hero in selected_heroes[:40]:
    # Descargar imagen
    image_url = hero.get('images', {}).get('lg', '')
    local_image_path = ''
    if image_url:
        try:
            image_response = requests.get(image_url, timeout=5)
            if image_response.status_code == 200:
                image_name = secure_filename(os.path.basename(urlparse(image_url).path))
                image_path = os.path.join(UPLOAD_FOLDER, image_name)
                with open(image_path, 'wb') as f:
                    f.write(image_response.content)
                local_image_path = f'uploads/{image_name}'
        except Exception as e:
            print(f"Error al descargar imagen para {hero['name']}: {e}")

    house = hero.get('biography', {}).get('publisher', '')
    print(f"Guardando héroe/villano: {hero['name']}, house: {house}")  # Para depuración

    # Calcular el promedio de powerstats
    powerstats = hero.get('powerstats', {})
    stats_values = [
        powerstats.get('intelligence', 0),
        powerstats.get('strength', 0),
        powerstats.get('speed', 0),
        powerstats.get('durability', 0),
        powerstats.get('power', 0),
        powerstats.get('combat', 0)
    ]
    stats_average = round(sum(stats_values) / 6) if stats_values else 0

    hero_data = {
        'name': hero['name'],
        'realName': hero.get('biography', {}).get('fullName', ''),
        'year': hero.get('biography', {}).get('firstAppearance', ''),
        'house': house,
        'biography': f"{hero['name']}, un {hero.get('appearance', {}).get('race', 'desconocido')} {hero.get('appearance', {}).get('gender', 'desconocido')} que está {hero.get('biography', {}).get('alignment', 'desconocido')}. Nacido en {hero.get('biography', {}).get('placeOfBirth', 'desconocido')}. Profesión: {hero.get('work', {}).get('occupation', 'desconocida')}.",
        'equipment': stats_average,
        'images': [local_image_path] if local_image_path else []
    }
    heroes_collection.insert_one(hero_data)

print(f"Se insertaron {len(selected_heroes[:40])} héroes/villanos en la base de datos.")