import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const HeroDetail = ({ setNotification }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/heroes/${id}`);
        if (!response.ok) throw new Error('Héroe no encontrado');
        const data = await response.json();
        setHero(data);
      } catch (error) {
        setNotification({ message: 'Error al cargar el héroe', type: 'error' });
      }
    };
    fetchHero();
  }, [id, setNotification]);

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de eliminar este personaje?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/heroes/${id}`, { method: 'DELETE' });
        const data = await response.json();
        setNotification({ message: data.message || data.error, type: data.error ? 'error' : 'success' });
        if (!data.error) navigate('/');
      } catch (error) {
        setNotification({ message: 'Error al eliminar el héroe', type: 'error' });
      }
    }
  };

  if (!hero) return <div className="text-center text-white">Cargando...</div>;

  const images = hero.images || [];

  // Determinar qué logo mostrar
  const getLogo = () => {
    if (hero.house && hero.house.toLowerCase().includes('marvel')) {
      return '/marvel-logo.png';
    } else if (hero.house && hero.house.toLowerCase().includes('dc')) {
      return '/dc-logo.png';
    } else {
      return '/placeholder.png'; // Usar placeholder.png para casas que no sean Marvel ni DC
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        {images.length > 0 ? (
          <div className="carousel relative">
            <img
              src={images[currentImage]}
              alt={hero.name}
              className="w-full h-96 object-cover rounded"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((currentImage - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-red-700 text-white p-2 rounded-full hover:bg-red-800 transition duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImage((currentImage + 1) % images.length)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-700 text-white p-2 rounded-full hover:bg-red-800 transition duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-gray-400">Sin imágenes</span>
          </div>
        )}
        <img
          src={getLogo()}
          alt={hero.house || 'Logo'}
          className="w-24 mt-4"
          onError={(e) => (e.target.src = 'https://via.placeholder.com/100')}
        />
        <h2 className="text-3xl font-bold text-red-600 mt-4">{hero.name}</h2>
        <p className="text-gray-400">Nombre real: {hero.realName || 'Desconocido'}</p>
        <p className="text-gray-400">Año de aparición: {hero.year}</p>
        <p className="text-gray-400">Casa: {hero.house}</p>
        <p className="text-gray-200 mt-2">
          <span className="font-semibold">Biografía:</span> {hero.biography}
        </p>
        <p className="text-gray-200 mt-2">Equipamiento: {hero.equipment !== undefined ? hero.equipment : 'Ninguno'}</p>
        <div className="mt-4 space-x-4">
          <Link
            to={`/edit/${hero._id}`}
            className="hero-detail-button bg-blue-900 text-white hover:bg-blue-800"
            onClick={(e) => {
              e.preventDefault();
              if (window.confirm('¿Estás seguro de modificar la información de este personaje?')) {
                window.location.href = `/edit/${hero._id}`;
              }
            }}
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="hero-detail-button bg-red-900 text-white hover:bg-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroDetail;