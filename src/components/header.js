import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

const Header = ({ userName }) => {
  const navigate = useNavigate();
  
  const getDisplayName = () => {
    try {
      // 1. Prioridad a la prop userName
      if (userName) return userName;
      
      // 2. Intenta obtener del localStorage
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      
      // Construye el nombre completo evitando "undefined"
      const fullName = [userData.nombre, userData.apellido]
        .filter(Boolean) // Elimina valores falsy (undefined, '')
        .join(' ')
        .trim();
      
      if (fullName) return fullName;
      
      // 3. Usa el email como fallback
      if (userData.email) return userData.email;
      
      // 4. Valor por defecto
      return 'Usuario';
    } catch (error) {
      console.error('Error al leer datos de usuario:', error);
      return 'Usuario';
    }
  };

  const handleLogout = () => {
    // Limpia todo el almacenamiento relacionado con la sesión
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirige al login
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="user-info">
          <span className="welcome">Bienvenido, </span>
          <span className="user-name">{getDisplayName()}</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="logout-button"
          aria-label="Cerrar sesión"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;