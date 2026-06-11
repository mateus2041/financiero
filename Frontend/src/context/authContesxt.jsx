import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from './authService';

// 1. Inicializamos el contexto
const AuthContext = createContext(null);

// 2. Proveedor que envolverá la aplicación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificación síncrona/asíncrona inicial al cargar la App
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validamos el token guardado contra el backend
          const isValid = await authService.verifyToken();
          if (isValid) {
            setUser(authService.getCurrentUser());
            setIsAuthenticated(true);
          } else {
            authService.logout();
          }
        } catch (error) {
          authService.logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Función global para iniciar sesión
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data; // Retorna los datos por si el componente Login los necesita
    } catch (error) {
      setIsAuthenticated(false);
      throw error; // Lanza el error hacia el formulario (ej: "Contraseña incorrecta")
    } finally {
      setLoading(false);
    }
  };

  // Función global para cerrar sesión
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook personalizado para consumir el contexto de forma limpia
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};