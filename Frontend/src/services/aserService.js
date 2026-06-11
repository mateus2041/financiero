import axios from 'axios';

const API_URL = 'https://api.tuempresa.com/auth'; // Cambia por tu URL real

// Configurar una instancia de axios para reutilizar la URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authService = {
  // 1. Iniciar Sesión
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      
      // Si el backend responde con éxito y trae un token
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  },

  // 2. Registrar Usuario
  register: async (name, email, password) => {
    try {
      const response = await api.post('/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error en el registro';
    }
  },

  // 3. Cerrar Sesión
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 4. Obtener el usuario actual guardado
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // 5. Obtener el token (útil para las peticiones de PrivateRoutes)
  getToken: () => {
    return localStorage.getItem('token');
  },

  // 6. Validar si el token sigue siendo válido con el servidor
  verifyToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await api.get('/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.valid;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  }
};

export default authService;