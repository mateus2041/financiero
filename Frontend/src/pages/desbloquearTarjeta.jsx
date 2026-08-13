import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/desbloquearTarjeta.css";

function DesbloquearTarjeta() {

    const [tarjeta, setTarjeta] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [desbloqueando, setDesbloqueando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        cargarTarjeta();
    }, []);

    const cargarTarjeta = async () => {

        try {

            const token = localStorage.getItem("token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/tarjeta",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo consultar la tarjeta");
            }

            const datos = await respuesta.json();

            setTarjeta(datos);

        } catch (error) {

            console.error(error);
            setError("No fue posible consultar el estado de la tarjeta.");

        } finally {

            setCargando(false);

        }
    };

    const desbloquearTarjeta = async () => {

        const confirmar = window.confirm(
            "¿Estás seguro de que deseas desbloquear tu tarjeta?"
        );

        if (!confirmar) {
            return;
        }

        try {

            setDesbloqueando(true);
            setMensaje("");
            setError("");

            const token = localStorage.getItem("token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/tarjeta/desbloquear",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail || "No fue posible desbloquear la tarjeta"
                );
            }

            setMensaje(
                datos.mensaje || "Tu tarjeta fue desbloqueada correctamente."
            );

            setTarjeta((tarjetaAnterior) => ({
                ...tarjetaAnterior,
                estado: "activa"
            }));

        } catch (error) {

            console.error(error);
            setError(error.message);

        } finally {

            setDesbloqueando(false);

        }
    };

    if (cargando) {
        return (
            <div className="tarjeta-container">
                <div className="tarjeta-mensaje">
                    Cargando información de la tarjeta...
                </div>
            </div>
        );
    }

    return (
        <div className="tarjeta-container">

            <div className="tarjeta-box">

                <div className="tarjeta-icono">
                    💳
                </div>

                <h1>Desbloqueo de tarjeta</h1>

                <p className="tarjeta-descripcion">
                    Administra el estado de tu tarjeta y vuelve a utilizarla
                    cuando esté desbloqueada.
                </p>

                {error && (
                    <div className="tarjeta-error">
                        {error}
                    </div>
                )}

                {mensaje && (
                    <div className="tarjeta-exito">
                        {mensaje}
                    </div>
                )}

                {tarjeta && (
                    <>

                        <div className="tarjeta-visual">

                            <div className="tarjeta-chip">
                                ▦
                            </div>

                            <div className="tarjeta-numero">
                                **** **** ****{" "}
                                {tarjeta.ultimos_digitos ||
                                    tarjeta.ultimo_digito ||
                                    "0000"}
                            </div>

                            <div className="tarjeta-tipo">
                                BILLETERA DIGITAL
                            </div>

                        </div>

                        <div className="tarjeta-estado">

                            <span>Estado actual:</span>

                            <strong
                                className={
                                    String(tarjeta.estado).toLowerCase() ===
                                    "activa"
                                        ? "activa"
                                        : "bloqueada"
                                }
                            >
                                {tarjeta.estado || "Bloqueada"}
                            </strong>

                        </div>

                        {String(tarjeta.estado).toLowerCase() ===
                            "bloqueada" ? (

                            <button
                                className="btn-desbloquear"
                                onClick={desbloquearTarjeta}
                                disabled={desbloqueando}
                            >
                                {desbloqueando
                                    ? "Desbloqueando..."
                                    : "🔓 Desbloquear tarjeta"}
                            </button>

                        ) : (

                            <div className="tarjeta-activa">
                                ✅ Tu tarjeta ya está desbloqueada
                            </div>

                        )}

                    </>
                )}

            </div>

        </div>
    );
}

export default DesbloquearTarjeta;