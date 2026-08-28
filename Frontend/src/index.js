import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const historialOriginal = window.history.pushState.bind(window.history);
let ultimaRutaValida = window.location.href;

window.history.pushState = (estado, titulo, url) => {
  historialOriginal(estado, titulo, url);
  ultimaRutaValida = window.location.href;
};

window.addEventListener("popstate", () => {
  historialOriginal(null, "", ultimaRutaValida);
});

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);