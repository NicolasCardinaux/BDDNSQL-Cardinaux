import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import HeroCard from './components/HeroCard';
import HeroDetail from './components/HeroDetail';
import HeroForm from './components/HeroForm';
import Notification from './components/Notification';

const App = () => {
  const [heroes, setHeroes] = useState([]);
  const [filter, setFilter] = useState('');
  const [notification, setNotification] = useState(null);
  const location = useLocation();

  const fetchHeroes = async (house = '') => {
    try {
      const response = await fetch(`http://localhost:5000/api/heroes${house ? `?house=${house}` : ''}`);
      if (!response.ok) throw new Error('Error al obtener héroes');
      const data = await response.json();
      console.log('Datos fetched:', data); // Para depuración
      setHeroes(data || []);
    } catch (error) {
      setNotification({ message: 'Error al cargar los héroes', type: 'error' });
      console.error(error);
      setHeroes([]);
    }
  };

  useEffect(() => {
    const house = location.pathname === '/marvel' ? 'Marvel' : location.pathname === '/dc' ? 'DC' : '';
    console.log('Ruta actual:', location.pathname, 'House:', house); // Para depuración
    fetchHeroes(house === 'Marvel' ? 'Marvel Comics' : house === 'DC' ? 'DC Comics' : '');
  }, [location.pathname]);

  const handleFilter = (e) => {
    setFilter(e.target.value);
  };

  const filteredHeroes = heroes.filter(hero =>
    (!filter || hero.name.toLowerCase().includes(filter.toLowerCase())) &&
    (!location.pathname.includes('/marvel') || (hero.house && hero.house.toLowerCase().includes('marvel'))) &&
    (!location.pathname.includes('/dc') || (hero.house && hero.house.toLowerCase().includes('dc')))
  );

  return (
    <div>
      <Header setNotification={setNotification} />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <Routes>
        <Route path="/" element={
          <div className="container mx-auto p-4">
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filter}
              onChange={handleFilter}
              className="w-full p-2 mb-4 bg-gray-800 border border-red-700 rounded text-white"
            />
            {filteredHeroes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredHeroes.map(hero => (
                  <HeroCard key={hero._id} hero={hero} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No se encontraron héroes.</div>
            )}
          </div>
        } />
        <Route path="/marvel" element={
          <div className="container mx-auto p-4">
            <input
              type="text"
              placeholder="Filtrar Marvel por nombre..."
              value={filter}
              onChange={handleFilter}
              className="w-full p-2 mb-4 bg-gray-800 border border-red-700 rounded text-white"
            />
            {filteredHeroes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredHeroes.map(hero => (
                  <HeroCard key={hero._id} hero={hero} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No se encontraron héroes de Marvel.</div>
            )}
          </div>
        } />
        <Route path="/dc" element={
          <div className="container mx-auto p-4">
            <input
              type="text"
              placeholder="Filtrar DC por nombre..."
              value={filter}
              onChange={handleFilter}
              className="w-full p-2 mb-4 bg-gray-800 border border-red-700 rounded text-white"
            />
            {filteredHeroes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredHeroes.map(hero => (
                  <HeroCard key={hero._id} hero={hero} />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">No se encontraron héroes de DC.</div>
            )}
          </div>
        } />
        <Route path="/hero/:id" element={<HeroDetail setNotification={setNotification} />} />
        <Route path="/add" element={<HeroForm setNotification={setNotification} />} />
        <Route path="/edit/:id" element={<HeroForm setNotification={setNotification} isEdit />} />
      </Routes>
    </div>
  );
};

export default () => (
  <Router>
    <App />
  </Router>
);