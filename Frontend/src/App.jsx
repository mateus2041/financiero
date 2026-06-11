import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos Globales
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';

// Guardianes de Ruta
import PrivateRoutes from './PrivateRoutes';

// Componentes Comunes de Diseño (Layout)
import Sidebar from './Sidebar';
import Footer from './Footer';

// Pantallas / Vistas de la App (Ejemplos)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Componente Wrapper para inyectar el Layout Privado (Sidebar + Contenido + Footer)
const PrivateLayout = () => {
  const { logout } = useAuth(); // Extraemos funciones si las necesitamos globales

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* 1. BARRA LATERAL (Se adapta sola si es modo oscuro o claro por Tailwind) */}
      <Sidebar />

      {/* 2. CONTENEDOR PRINCIPAL DE CONTENIDO */}
      {/* Añadimos pl-20 (colapsado) y md:pl-64 (expandido) para que el contenido no quede debajo del Sidebar fixed */}
      <div className="flex-1 flex flex-col pl-20 md:pl-64 min-h-screen transition-all duration-300">
        
        {/* Cuerpo Dinámico de la página actual */}
        <main className="flex-1 p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            {/* Redirección por defecto si entran a una ruta privada inexistente */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* 3. PIE DE PÁGINA */}
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    // PROVEEDOR 1: Controla el Modo Oscuro / Claro en todo el árbol de componentes
    <ThemeProvider>
      {/* PROVEEDOR 2: Controla el estado del Token, Usuario y Login global */}
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            
            {/* RUTAS PÚBLICAS */}
            {/* Si un usuario ya logueado intenta entrar al login, podrías redirigirlo internamente */}
            <Route path="/login" element={<Login />} />

            {/* RUTAS PROTEGIDAS (Controladas por el guardián PrivateRoutes) */}
            <Route element={<PrivateRoutes />}>
              {/* Todas las sub-rutas de aquí dentro heredarán el Sidebar y el Footer */}
              <Route path="/*" element={<PrivateLayout />} />
            </Route>

            {/* Manejo global de error 404 / Ruta desconocida pública */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;