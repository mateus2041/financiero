import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PrivateRoutes = () => {
  const location = useLocation();
  
  // 1. Aquí simulas o recuperas el estado de autenticación real de tu app.
  // Puede venir de un contexto global (AuthContext), Redux, o localStorage.
  const isAuthenticated = !!localStorage.getItem('token'); 
  const isLoading = false; // Cambiar a true si estás validando el token con el backend

  // 2. Si está cargando la validación, muestra una pantalla de carga rápida
  if (isLoading) {
    return (
      <div className="min-screen bg-slate-900 flex items-center justify-center text-slate-200">
        <p className="text-lg font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }

  // 3. Si está autenticado, permite el paso a las rutas hijas (<Outlet />)
  // Si no, redirige al login guardando la ubicación actual para volver después
  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default PrivateRoutes;