import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';

const HeroForm = ({ setNotification, isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    realName: '',
    year: '',
    house: '',
    biography: '',
    equipment: '',
    images: [],
  });

  const [suggestions, setSuggestions] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Cargar datos del héroe si es edición
  useEffect(() => {
    if (isEdit && id) {
      const fetchHero = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`http://localhost:5000/api/heroes/${id}`);
          if (!response.ok) throw new Error('Error al cargar el héroe');
          const data = await response.json();
          console.log('Datos recibidos del héroe:', data); // Depuración
          setFormData(data);
          setExistingImages(data.images || []);
          console.log('existingImages establecidos:', data.images || []); // Depuración adicional
        } catch (error) {
          setNotification({ message: error.message, type: 'error' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchHero();
    }
  }, [id, isEdit, setNotification]);

  // Debounce para el autocompletado
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions([]);
        setIsSearching(false);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `http://localhost:5000/api/external-autocomplete?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error('Error al consultar la API externa');
        }
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error en autocompletado:', error);
        setSuggestions([]);
        setSearchError('No se pudieron cargar las sugerencias. Intenta de nuevo.');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'name') {
      fetchSuggestions(value);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData({
      name: suggestion.name || '',
      realName: suggestion.realName || suggestion.name || '',
      year: suggestion.year || '',
      house: suggestion.house || '',
      biography: suggestion.biography || `Héroe de ${suggestion.house || 'desconocido'}.`,
      equipment: suggestion.equipment ? suggestion.equipment.toString() : 'Poderes especiales',
      images: suggestion.images || [],
    });

    setExistingImages(suggestion.images || []);
    setSuggestions([]);
    setSearchError(null);
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const handleRemoveImage = (index, type) => {
    if (type === 'existing') {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else if (type === 'local') {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (key !== 'images') {
        formDataToSend.append(key, formData[key]);
      }
    }

    // Agregar imágenes existentes
    if (existingImages.length > 0) {
      formDataToSend.append('existingImages', existingImages.join(','));
    }

    // Agregar nuevas imágenes
    imageFiles.forEach((file) => {
      formDataToSend.append('images', file);
    });

    try {
      const url = `http://localhost:5000/api/heroes${isEdit ? `/${id}` : ''}`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar');
      }

      setNotification({
        message: isEdit ? 'Héroe actualizado correctamente' : 'Héroe creado correctamente',
        type: 'success',
      });

      navigate(isEdit ? `/hero/${id}` : '/');
    } catch (error) {
      setNotification({
        message: error.message || 'Error al procesar la solicitud',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-6">
          {isEdit ? 'Editar Personaje' : 'Crear Nuevo Personaje'}
        </h2>

        {/* Campo de nombre con autocompletado */}
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">
            Nombre del Héroe *
          </label>
          <div className="relative">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Comienza a escribir (ej: Hulk)"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
              autoComplete="off"
            />
            {isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white">
                Buscando héroes...
              </div>
            )}
            {searchError && !isSearching && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg p-3 text-red-500">
                {searchError}
              </div>
            )}
            {suggestions.length > 0 && !isSearching && !searchError && (
              <ul className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                {suggestions.map((hero, index) => (
                  <li
                    key={hero.id || index}
                    onClick={() => handleSuggestionClick(hero)}
                    className="p-3 hover:bg-gray-600 cursor-pointer flex items-start border-b border-gray-600 last:border-0"
                  >
                    {hero.images && hero.images.length > 0 && (
                      <img
                        src={`http://localhost:5000/${hero.images[0]}`}
                        alt={hero.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                        onError={(e) =>
                          (e.target.src = '/placeholder.png') // Cambiado a /placeholder.png
                        }
                      />
                    )}
                    <div>
                      <div className="font-bold text-white">{hero.name}</div>
                      <div className="text-sm text-gray-300">
                        {(hero.biography || 'Sin descripción').substring(0, 70)}
                        {hero.biography?.length > 70 ? '...' : ''}
                      </div>
                      {hero.house && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-900 rounded-full">
                          {hero.house}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Nombre Real
            </label>
            <input
              type="text"
              name="realName"
              value={formData.realName}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium">
              Año de Aparición
            </label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">
            Casa Editorial *
          </label>
          <select
            name="house"
            value={formData.house}
            onChange={handleChange}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            required
          >
            <option value="">Selecciona una casa</option>
            <option value="Marvel Comics">Marvel Comics</option>
            <option value="DC Comics">DC Comics</option>
            <option value="Image Comics">Image Comics</option>
            <option value="Dark Horse Comics">Dark Horse Comics</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">
            Biografía
          </label>
          <textarea
            name="biography"
            value={formData.biography}
            onChange={handleChange}
            rows="4"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-300 mb-2 font-medium">
            Equipamiento/Poderes
          </label>
          <textarea
            name="equipment"
            value={formData.equipment}
            onChange={handleChange}
            rows="2"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        {/* Imágenes */}
        <div className="mb-8">
          <label className="block text-gray-300 mb-2 font-medium">
            Imágenes
          </label>
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Combinar imágenes de la API y locales, priorizando las de la API */}
            {[...existingImages.map((img, index) => ({ img, type: 'existing', index })), 
              ...imageFiles.map((file, index) => ({ file, type: 'local', index }))].map((item, idx) => (
              <div key={`${item.type}-${item.index}-${idx}`} className="relative group">
                {item.type === 'existing' ? (
                  <>
                    <img
                      src={`http://localhost:5000/${item.img}`}
                      alt={`API Preview ${item.index}`}
                      className="w-24 h-24 object-cover rounded border-2 border-gray-600"
                      onError={(e) => {
                        console.log('Error al cargar la imagen:', e.target.src); // Depuración
                        e.target.src = '/placeholder.png';
                      }}                      
                    />
                    <div className="text-center text-gray-400 text-xs mt-1">API</div>
                  </>
                ) : (
                  <>
                    <img
                      src={URL.createObjectURL(item.file)}
                      alt={`Local Preview ${item.index}`}
                      className="w-24 h-24 object-cover rounded border-2 border-gray-600"
                    />
                    <div className="text-center text-gray-400 text-xs mt-1">Local</div>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(item.index, item.type)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            name="images"
            onChange={handleImageChange}
            multiple
            accept="image/*"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
            isLoading ? 'bg-gray-600' : 'bg-red-700 hover:bg-red-800'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando...
            </span>
          ) : isEdit ? 'Actualizar Héroe' : 'Crear Héroe'}
        </button>
      </form>
    </div>
  );
};

export default HeroForm;