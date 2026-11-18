import { useEffect, useState } from "react";

export default function useResponsiveMenu() {
  const [menuAbierto, setMenuAbierto] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 768);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  return [menuAbierto, setMenuAbierto];
}
