import React from 'react';
import { createRoot } from 'react-dom/client';

// 1. IMPORTAR LOS ESTILOS GLOBALES
// Esto carga Tailwind, los scrollbars personalizados y las animaciones de index.css
import './index.css';

// 2. IMPORTAR EL COMPONENTE RAÍZ
// El cerebro que contiene las rutas, contextos de autenticación y tema
import App from './App';

// 3. CAPTURAR EL NODO EN EL DOM
// Busca el <div id="root"></div> dentro de tu archivo public/index.html
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'No se encontró el elemento raíz ("root") en el HTML. Asegúrate de que index.html tenga un <div id="root"></div>'
  );
}

// 4. CREAR LA RAÍZ Y RENDERIZAR LA APLICACIÓN
const root = createRoot(container);

root.render(
  // React.StrictMode es una herramienta de desarrollo que ayuda a identificar
  // efectos secundarios, renderizados dobles innecesarios y código obsoleto.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);