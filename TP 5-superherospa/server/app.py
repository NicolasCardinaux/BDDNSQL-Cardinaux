from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, resources={r"/uploads/*": {"origins": "*"}, r"/api/*": {"origins": "*"}})

client = MongoClient('mongodb://mongo:27017/')
db = client['superhero_db']
heroes_collection = db['heroes']


UPLOAD_FOLDER = 'C:/Users/Nicolás Cardinaux/Desktop/superhero-spa/server/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/uploads/<filename>')
def serve_image(filename):
    print(f"Sirviendo imagen: {filename}")  
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        print(f"Error al servir imagen {filename}: {e}")
        return jsonify({'error': 'Imagen no encontrada'}), 404

@app.route('/api/external-autocomplete', methods=['GET'])
def external_autocomplete():
    query = request.args.get('query', '').strip().lower()
    if not query:
        return jsonify([])

    try:
        response = requests.get('https://akabab.github.io/superhero-api/api/all.json', timeout=5)
        response.raise_for_status()
        heroes = response.json()

        filtered = [
            {
                'id': str(hero.get('id', '')),
                'name': hero.get('name', ''),
                'realName': hero.get('biography', {}).get('fullName', ''),
                'year': hero.get('biography', {}).get('firstAppearance', ''),
                'house': hero.get('biography', {}).get('publisher', ''),
                'biography': f"{hero['name']}, un {hero.get('appearance', {}).get('race', 'desconocido')} {hero.get('appearance', {}).get('gender', 'desconocido')} que está {hero.get('biography', {}).get('alignment', 'desconocido')}. Nacido en {hero.get('biography', {}).get('placeOfBirth', 'desconocido')}. Profesión: {hero.get('work', {}).get('occupation', 'desconocida')}.",
                'equipment': round(sum([
                    hero.get('powerstats', {}).get('intelligence', 0),
                    hero.get('powerstats', {}).get('strength', 0),
                    hero.get('powerstats', {}).get('speed', 0),
                    hero.get('powerstats', {}).get('durability', 0),
                    hero.get('powerstats', {}).get('power', 0),
                    hero.get('powerstats', {}).get('combat', 0)
                ]) / 6) if hero.get('powerstats') else 0,
                'images': [download_and_store_image(hero.get('images', {}).get('lg', ''))]
            }
            for hero in heroes if query in hero.get('name', '').lower()
        ]
        print(f"Sugerencias encontradas para '{query}': {len(filtered)}") 
        return jsonify(filtered[:10])

    except requests.RequestException as e:
        print(f"Error al consultar API externa: {e}")
        local_heroes = list(heroes_collection.find({
            'name': {'$regex': f'^{query}', '$options': 'i'}
        }).limit(5))

        result = []
        for hero in local_heroes:
            result.append({
                'id': str(hero['_id']),
                'name': hero.get('name', ''),
                'realName': hero.get('realName', ''),
                'year': hero.get('year', ''),
                'house': hero.get('house', ''),
                'biography': hero.get('biography', ''),
                'equipment': hero.get('equipment', ''),
                'images': hero.get('images', []),
            })

        print(f"Héroes locales encontrados para '{query}': {len(result)}")  
        return jsonify(result)

def download_and_store_image(image_url):
    if not image_url:
        return ''
    try:
        image_response = requests.get(image_url, timeout=5)
        if image_response.status_code == 200:
            image_name = secure_filename(os.path.basename(image_url))
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_name)
            with open(image_path, 'wb') as f:
                f.write(image_response.content)
            print(f"Imagen guardada: {image_path}")
            return f'uploads/{image_name}'
        else:
            print(f"Error al descargar imagen {image_url}: {image_response.status_code}")
    except Exception as e:
        print(f"Error al descargar imagen {image_url}: {e}")
    return ''

@app.route('/api/heroes', methods=['GET'])
def get_heroes():
    try:
        house = request.args.get('house', '')
        print(f"Obteniendo héroes con house: {house}") 
        query = {'house': {'$regex': house, '$options': 'i'}} if house else {}
        heroes = list(heroes_collection.find(query))
        for hero in heroes:
            hero['_id'] = str(hero['_id'])
            hero['images'] = [f'http://localhost:5000/{img}' for img in hero.get('images', [])]
        print(f"Héroes encontrados: {len(heroes)}") 
        return jsonify(heroes)
    except Exception as e:
        print(f"Error al obtener héroes: {str(e)}") 
        return jsonify({'error': str(e)}), 500

@app.route('/api/heroes/<id>', methods=['GET'])
def get_hero(id):
    try:
        print(f"Buscando héroe con ID: {id}")  
        hero = heroes_collection.find_one({'_id': ObjectId(id)})
        if not hero:
            print(f"Héroe no encontrado: {id}")
            return jsonify({'error': 'Héroe no encontrado'}), 404
        hero['_id'] = str(hero['_id'])
        hero['images'] = [f'http://localhost:5000/{img}' for img in hero.get('images', [])]
        print(f"Héroe encontrado: {hero}")
        return jsonify(hero)
    except Exception as e:
        print(f"Error al obtener héroe {id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/heroes', methods=['POST'])
def create_hero():
    try:
        print("Creando nuevo héroe")  
        data = request.form.to_dict()
        files = request.files.getlist('images')

        image_paths = []
     
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                image_paths.append(f'uploads/{filename}')
                print(f"Imagen guardada: {file_path}") 

  
        existing_images = request.form.get('existingImages', '').split(',')
        for img in existing_images:
            if img and img.startswith('uploads/'):
                image_paths.append(img)

        data['images'] = image_paths
        result = heroes_collection.insert_one(data)
        print(f"Héroe creado con ID: {result.inserted_id}")  
        return jsonify({'_id': str(result.inserted_id), 'message': 'Héroe creado con éxito'})
    except Exception as e:
        print(f"Error al crear héroe: {str(e)}")  
        return jsonify({'error': str(e)}), 500

@app.route('/api/heroes/<id>', methods=['PUT'])
def update_hero(id):
    try:
        print(f"Actualizando héroe con ID: {id}") 
        data = request.form.to_dict()
        print(f"Datos recibidos: {data}") 
        files = request.files.getlist('images')

       
        if 'equipment' in data:
            try:
                data['equipment'] = int(data['equipment'])
            except ValueError:
                data['equipment'] = 0

        image_paths = []

        existing_images = data.get('existingImages', '').split(',') if data.get('existingImages') else []
        for img in existing_images:
            if img and img.startswith('uploads/'):
                image_paths.append(img)

      
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                image_paths.append(f'uploads/{filename}')
                print(f"Imagen guardada: {file_path}") 
        data['images'] = image_paths

        
        if '_id' in data:
            del data['_id']

        result = heroes_collection.update_one({'_id': ObjectId(id)}, {'$set': data})
        if result.matched_count == 0:
            print(f"Héroe no encontrado para actualizar: {id}")
            return jsonify({'error': 'Héroe no encontrado'}), 404

        print("Héroe actualizado correctamente")
        return jsonify({'message': 'Héroe actualizado con éxito'})
    except Exception as e:
        print(f"Error al actualizar héroe: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/heroes/<id>', methods=['DELETE'])
def delete_hero(id):
    try:
        print(f"Eliminando héroe con ID: {id}")  
        hero = heroes_collection.find_one({'_id': ObjectId(id)})
        if hero:
            for image_path in hero.get('images', []):
                if image_path.startswith('uploads/'):
                    full_path = os.path.join(app.config['UPLOAD_FOLDER'], image_path.replace('uploads/', ''))
                    if os.path.exists(full_path):
                        os.remove(full_path)
                        print(f"Imagen eliminada: {full_path}")
            heroes_collection.delete_one({'_id': ObjectId(id)})
            print("Héroe eliminado correctamente")
            return jsonify({'message': 'Héroe eliminado con éxito'})
        print(f"Héroe no encontrado: {id}")
        return jsonify({'error': 'Héroe no encontrado'}), 404
    except Exception as e:
        print(f"Error al eliminar héroe: {str(e)}")  
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)