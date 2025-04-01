from flask import Flask, jsonify, request, render_template, redirect, url_for
from datetime import datetime, timedelta
import threading
from redis import Redis
import time
import json

app = Flask(__name__)

# Conexión a Redis con reintentos
redis_client = Redis(host='redis', port=6379, decode_responses=True)
for _ in range(5):
    try:
        redis_client.ping()
        print("Conexión a Redis exitosa")
        break
    except:
        print("Esperando a Redis...")
        time.sleep(1)

# Estructura inicial de los episodios (solo para inicializar si no existen en Redis)
episodios_iniciales = {
    "Temporada 1": [
        {"id": 1, "titulo": "Capítulo 1: El Mandaloriano", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 2, "titulo": "Capítulo 2: El Niño", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 3, "titulo": "Capítulo 3: El Pecado", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 4, "titulo": "Capítulo 4: Santuario", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 5, "titulo": "Capítulo 5: El Pistolero", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 6, "titulo": "Capítulo 6: El Prisionero", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 7, "titulo": "Capítulo 7: El Ajuste de Cuentas", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 8, "titulo": "Capítulo 8: Redención", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99}
    ],
    "Temporada 2": [
        {"id": 9, "titulo": "Capítulo 9: El Marshal", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 10, "titulo": "Capítulo 10: El Pasajero", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 11, "titulo": "Capítulo 11: La Heredera", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 12, "titulo": "Capítulo 12: El Asedio", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 13, "titulo": "Capítulo 13: El Jedi", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 14, "titulo": "Capítulo 14: La Tragedia", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 15, "titulo": "Capítulo 15: El Creyente", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99},
        {"id": 16, "titulo": "Capítulo 16: El Rescate", "estado": "disponible", "reservado_hasta": None, "alquilado_hasta": None, "precio": 5.99}
    ]
}

# Función para inicializar los episodios en Redis si no existen
def inicializar_episodios():
    if not redis_client.exists("episodios"):
        redis_client.set("episodios", json.dumps(episodios_iniciales))
    return json.loads(redis_client.get("episodios"))

# Función para guardar los episodios en Redis
def guardar_episodios(episodios):
    # Convertir objetos datetime a strings antes de guardar
    episodios_copy = episodios.copy()
    for temporada in episodios_copy.values():
        for episodio in temporada:
            if isinstance(episodio["reservado_hasta"], datetime):
                episodio["reservado_hasta"] = episodio["reservado_hasta"].strftime("%Y-%m-%dT%H:%M:%S.%f")
            if isinstance(episodio["alquilado_hasta"], datetime):
                episodio["alquilado_hasta"] = episodio["alquilado_hasta"].strftime("%Y-%m-%dT%H:%M:%S.%f")
    redis_client.set("episodios", json.dumps(episodios_copy))

# Cargar los episodios desde Redis al iniciar
episodios = inicializar_episodios()

# Función para convertir timestamps de string a datetime (compatible con Python 3.6)
def parse_datetime(timestamp):
    if timestamp is None:
        return None
    if isinstance(timestamp, datetime):
        return timestamp
    # Formato ISO: "2025-04-01T12:34:56.789123"
    return datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%f")

# Función para liberar una reserva
def liberar_reserva(episodio):
    episodio["reservado_hasta"] = parse_datetime(episodio["reservado_hasta"])
    if episodio["reservado_hasta"] and datetime.now() >= episodio["reservado_hasta"]:
        print(f"Liberando episodio {episodio['id']} - Estado: {episodio['estado']}")
        episodio["estado"] = "disponible"
        episodio["reservado_hasta"] = None
        redis_client.decr(f"reserva_count_{episodio['id']}")
        guardar_episodios(episodios)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/episodios', methods=['GET'])
def listar_episodios():
    # Crear una copia de los episodios para modificar los timestamps
    episodios_response = episodios.copy()
    for temporada in episodios_response.values():
        for episodio in temporada:
            episodio["reservado_hasta"] = parse_datetime(episodio["reservado_hasta"])
            episodio["alquilado_hasta"] = parse_datetime(episodio["alquilado_hasta"])
            if episodio["reservado_hasta"] and datetime.now() >= episodio["reservado_hasta"]:
                liberar_reserva(episodio)
            if episodio["alquilado_hasta"] and datetime.now() >= episodio["alquilado_hasta"]:
                episodio["estado"] = "disponible"
                episodio["alquilado_hasta"] = None
                guardar_episodios(episodios)
            # Convertir datetime a string para la respuesta JSON
            if isinstance(episodio["reservado_hasta"], datetime):
                episodio["reservado_hasta"] = episodio["reservado_hasta"].strftime("%Y-%m-%dT%H:%M:%S.%f")
            if isinstance(episodio["alquilado_hasta"], datetime):
                episodio["alquilado_hasta"] = episodio["alquilado_hasta"].strftime("%Y-%m-%dT%H:%M:%S.%f")
    return jsonify(episodios_response)

@app.route('/api/reservar/<int:episodio_id>', methods=['POST'])
def reservar_episodio(episodio_id):
    for temporada in episodios.values():
        for episodio in temporada:
            if episodio["id"] == episodio_id:
                episodio["reservado_hasta"] = parse_datetime(episodio["reservado_hasta"])
                episodio["alquilado_hasta"] = parse_datetime(episodio["alquilado_hasta"])
                print(f"Estado del episodio {episodio_id} antes de reservar: {episodio['estado']}")
                if episodio["estado"] == "disponible":
                    episodio["estado"] = "reservado"
                    episodio["reservado_hasta"] = datetime.now() + timedelta(minutes=4)
                    threading.Timer(240, liberar_reserva, [episodio]).start()
                    redis_client.incr(f"reserva_count_{episodio_id}")
                    guardar_episodios(episodios)
                    print(f"Episodio {episodio_id} reservado hasta: {episodio['reservado_hasta']}")
                    return redirect(url_for('confirmar_pago_page', episodio_id=episodio_id))
                return jsonify({"error": "Episodio no disponible"}), 400
    return jsonify({"error": "Episodio no encontrado"}), 404

@app.route('/confirmar_pago/<int:episodio_id>', methods=['GET'])
def confirmar_pago_page(episodio_id):
    for temporada in episodios.values():
        for episodio in temporada:
            if episodio["id"] == episodio_id:
                episodio["reservado_hasta"] = parse_datetime(episodio["reservado_hasta"])
                print(f"Estado del episodio {episodio_id} al intentar confirmar pago: {episodio['estado']}")
                if episodio["estado"] == "reservado" and episodio["reservado_hasta"] and datetime.now() < episodio["reservado_hasta"]:
                    return render_template('confirmar_pago.html', 
                                         episodio_id=episodio_id, 
                                         precio=episodio["precio"],
                                         episodio_titulo=episodio["titulo"])
                return redirect(url_for('index'))
    return redirect(url_for('index'))

@app.route('/api/confirmar_pago', methods=['POST'])
def confirmar_pago():
    data = request.json
    episodio_id = data.get('episodio_id')
    precio = data.get('precio')
    
    for temporada in episodios.values():
        for episodio in temporada:
            if episodio["id"] == episodio_id:
                episodio["reservado_hasta"] = parse_datetime(episodio["reservado_hasta"])
                if episodio["estado"] == "reservado" and episodio["reservado_hasta"] and datetime.now() < episodio["reservado_hasta"]:
                    if precio == episodio["precio"]:
                        episodio["estado"] = "alquilado"
                        episodio["alquilado_hasta"] = datetime.now() + timedelta(hours=24)
                        episodio["reservado_hasta"] = None
                        guardar_episodios(episodios)
                        return jsonify({"mensaje": f"Episodio {episodio_id} alquilado por 24 horas", "redirect": url_for('index')})
                    return jsonify({"error": "Precio incorrecto"}), 400
                return jsonify({"error": "Episodio no está reservado o la reserva expiró"}), 400
    return jsonify({"error": "Episodio no encontrado"}), 404

@app.route('/reset', methods=['GET'])
def reset_episodios():
    for temporada in episodios.values():
        for episodio in temporada:
            episodio["estado"] = "disponible"
            episodio["reservado_hasta"] = None
            episodio["alquilado_hasta"] = None
            redis_client.set(f"reserva_count_{episodio['id']}", 0)
    guardar_episodios(episodios)
    return jsonify({"mensaje": "Episodios reiniciados"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
