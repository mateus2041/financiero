import { BrowserRouter, Routes, Route } from "react-router-dom";

import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Cuenta from "./pages/cuenta";
import Historial from "../pages/historial";
import DesbloquearTarjeta from "../pages/desbloquearTarjeta";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/cuenta" element={<Cuenta />} />
        <Route path="/historial" element={<Historial />} />
        <Route
    path="/desbloquear-tarjeta"
    element={<DesbloquearTarjeta />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;