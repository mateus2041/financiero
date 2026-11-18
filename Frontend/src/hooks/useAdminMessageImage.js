import { useCallback } from "react";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer la imagen"));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });

export default function useAdminMessageImage({
  setImage,
  setPreview,
  setError,
}) {
  return useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("El archivo adjunto debe ser una imagen.");
        setImage(null);
        setPreview("");
        event.target.value = "";
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        setImage({ nombre: file.name, dataUrl });
        setPreview(dataUrl);
        setError("");
      } catch (error) {
        console.error("Error al cargar la imagen del mensaje:", error);
        setError("No se pudo cargar la imagen.");
        setImage(null);
        setPreview("");
      }
    },
    [setError, setImage, setPreview]
  );
}
