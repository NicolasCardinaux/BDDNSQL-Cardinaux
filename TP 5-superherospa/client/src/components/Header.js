import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ setNotification }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-black p-4 flex justify-between items-center shadow-lg shadow-red-900/50">
      <Link to="/" className="text-2xl font-bold text-red-600">Superhero SPA</Link>
      <div className="flex items-center space-x-4">
        <select 
          onChange={(e) => navigate(e.target.value)} 
          className="bg-gray-800 text-white p-2 rounded border border-red-700"
        >
          <option value="/">Todos</option>
          <option value="/marvel">Marvel</option>
          <option value="/dc">DC</option>
        </select>
        <Link 
          to="/add" 
          className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition duration-300"
        >
          Añadir Personaje
        </Link>
      </div>
    </header>
  );
};

export default Header;