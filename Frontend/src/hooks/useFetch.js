import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './authService'; // Importamos el cliente con interceptores

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guardamos las opciones en un stringify para evitar bucles infinitos en el useEffect
  const optionsStringified = JSON.stringify(options);

  // Wrap con useCallback para poder re-ejecutar la petición manualmente (ej: un botón de "refrescar")
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(url, {
        signal: controller.signal,
        ...JSON.parse(optionsStringified)
      });
      setData(response.data);
    } catch (err) {
      // Ignorar el error si la petición fue cancelada intencionalmente
      if (err.name !== 'CanceledError') {
        setError(err.message || 'Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [url, optionsStringified]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retornamos data, loading, error y la función refetch por si queremos actualizar bajo demanda
  return { data, loading, error, refetch: fetchData };
};

export default useFetch; 