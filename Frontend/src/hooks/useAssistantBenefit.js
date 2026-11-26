import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function useAssistantBenefit() {
  const [beneficioHabilitado, setBeneficioHabilitado] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargarBeneficio = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setBeneficioHabilitado(false);
        return;
      }

      try {
        const respuesta = await fetch(`${API_URL}/usuario`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!respuesta.ok) {
          throw new Error("No se pudo consultar el beneficio del usuario.");
        }

        const usuario = await respuesta.json();
        if (activo) {
          setBeneficioHabilitado(usuario.beneficio_habilitado === true);
        }
      } catch (error) {
        console.error("No se pudo consultar el beneficio del usuario:", error);
        if (activo) {
          setBeneficioHabilitado(false);
        }
      }
    };

    const actualizarBeneficio = () => {
      void cargarBeneficio();
    };

    void cargarBeneficio();
    window.addEventListener("focus", actualizarBeneficio);
    window.addEventListener("beneficio-actualizado", actualizarBeneficio);

    return () => {
      activo = false;
      window.removeEventListener("focus", actualizarBeneficio);
      window.removeEventListener("beneficio-actualizado", actualizarBeneficio);
    };
  }, []);

  return beneficioHabilitado;
}
