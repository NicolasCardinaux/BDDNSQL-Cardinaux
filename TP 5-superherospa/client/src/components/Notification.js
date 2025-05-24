import React, { useEffect } from 'react';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-500 ${
        type === 'success' ? 'bg-green-800 border-green-600' : 'bg-red-800 border-red-600'
      } text-white border-2 animate-slide-in`}
    >
      <p className="text-lg font-semibold">{message}</p>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white hover:text-gray-300 transition duration-300"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification;