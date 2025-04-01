import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

const Header = ({ userName }) => {
  const navigate = useNavigate();
  
  // Obtener usuario directamente del localStorage como respaldo
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  
  // Crear el nombre completo
  const displayName = userName || 
                    (userData.nombre && userData.apellido 
                      ? `${userData.nombre} ${userData.apellido}`
                      : (userData.nombre || userData.email || 'Usuario'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="user-info">
          <span className="welcome">Bienvenido,</span>
          <span className="user-name">{displayName}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;