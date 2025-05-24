import React from 'react';
import { Link, useNavigate } from 'react-router-dom';


const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text + '...';

  const truncated = text.substring(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
};

const HeroCard = ({ hero }) => {
  const navigate = useNavigate();

  const handleViewMore = (e) => {
    e.stopPropagation(); 
    navigate(`/hero/${hero._id}`);
  };


  const getLogo = () => {
    if (hero.house && hero.house.toLowerCase().includes('marvel')) {
      return '/marvel-logo.png';
    } else if (hero.house && hero.house.toLowerCase().includes('dc')) {
      return '/dc-logo.png';
    } else {
      return '/placeholder.png'; 
    }
  };

  return (
    <Link to={`/hero/${hero._id}`} className="hero-card">
      <div className="relative">
        {hero.images && hero.images.length > 0 ? (
          <img
            src={hero.images[0]}
            alt={hero.name}
            className="w-full h-48 object-cover"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <img
            src={getLogo()}
            alt={hero.house || 'Logo'}
            className="w-12"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/50')} 
          />
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-3xl font-bold text-red-600">{hero.name}</h2>
        {hero.realName && (
          <p className="text-gray-400">Nombre real: {hero.realName}</p>
        )}
        <p className="text-gray-400">{truncateText(hero.biography || 'Sin biografía', 50)}</p>
        <button
          onClick={handleViewMore}
          className="mt-2 bg-red-700 text-white p-2 rounded hover:bg-red-800 transition duration-300"
        >
          Ver más
        </button>
      </div>
    </Link>
  );
};

export default HeroCard;