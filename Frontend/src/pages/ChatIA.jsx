import React, { useState } from "react";
import axios from "axios";
import "../styles/chatIA.css";

function ChatIA() {

  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState([]);



  const enviarPregunta = async () => {


    if (!pregunta.trim()) return;



    const token = localStorage.getItem("token");



    console.log("TOKEN EN CHAT IA:", token);



   /* if (!token) {

      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ia",
          texto: "⚠️ Debes iniciar sesión antes de usar el asistente."
        }
      ]);

      return;
    }*/




    setMensajes((prev) => [
      ...prev,
      {
        tipo: "usuario",
        texto: pregunta,
      },
    ]);



    try {


      const res = await axios.post(

        "http://localhost:8000/ia/chat",

        {
          pregunta: pregunta,
        },


        {

          headers: {

            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json",

          },

        }

      );




      setMensajes((prev) => [

        ...prev,

        {

          tipo: "ia",

          texto: res.data.respuesta,

        },

      ]);
    } catch (error) {
      console.error(
        "Error IA:",
        error
      );
      let mensaje = "Error al conectar con la IA.";
      if (error.response) {
        console.log(
          "Código:",
          error.response.status
        );
        console.log(
          "Respuesta:",
          error.response.data
        );

        if (
          error.response.data.detail
        ) {
          mensaje =
            error.response.data.detail;
        }
      } else if (error.request) {
        mensaje =
          "No hay respuesta del servidor.";
      } else {
        mensaje =
          error.message;
      }
      setMensajes((prev) => [
        ...prev,
        {

          tipo:"ia",
          texto:mensaje
        }
      ]);
    }
  
    setPregunta("");
  };

  return (

    <div className="chat-container">

      <div className="chat-header">
        Asistente IA 🤖
      </div>

      <div className="chat-body">

        {mensajes.map(
          (msg,index)=>(

          <div
            key={index}
            className={
              msg.tipo === "usuario"
              ? "usuario"
              : "ia"
            }
          >
            {msg.texto}
          </div>
        ))}
      </div>

      <div className="chat-footer">

        <input
          type="text"
          placeholder="Escribe una pregunta..."
          value={pregunta}
          onChange={
            (e)=>setPregunta(e.target.value)
          }
          onKeyDown={
            (e)=>{
              if(e.key==="Enter"){
                enviarPregunta();
              }
            }
          }
        />
        <button onClick={enviarPregunta}>
          Enviar
        </button>
      </div>
    </div>
  );
}


export default ChatIA;