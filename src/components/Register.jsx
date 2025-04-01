import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';
import countries from '../utils/countries'; // Lista de países

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    email: '',
    pais: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (Object.values(formData).some(field => !field)) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
        // Extraemos confirmPassword y enviamos solo los datos necesarios
        const { confirmPassword, ...userData } = formData;
        
        await axios.post('http://localhost:5000/api/auth/register', userData);
        alert('¡Registro exitoso! Por favor inicia sesión');
        navigate('/');
      } catch (err) {
        // Mejor manejo de errores
        const errorMessage = err.response?.data?.error || 
                           (err.response?.status === 404 ? 'Endpoint no encontrado' : 
                           'Error al conectar con el servidor');
        setError(errorMessage);
        
        // Debug
        console.error('Error detallado:', {
          status: err.response?.status,
          data: err.response?.data,
          config: err.config
        });
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Crear cuenta</h2>
        <p className="subtitle">Completa tus datos personales</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="pais">País</label>
            <select
              id="pais"
              name="pais"
              value={formData.pais}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un país</option>
              {countries.map(country => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="login-link">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;