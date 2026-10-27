import React from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";

const resolveApiBaseUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    "http://localhost:8000";

  return configuredUrl.replace(/\/$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

const normalizeApiUrl = (url) => {
  if (typeof url !== "string") return url;

  const candidates = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://0.0.0.0:8000",
  ];

  for (const candidate of candidates) {
    if (url.startsWith(candidate)) {
      return url.replace(candidate, API_BASE_URL);
    }
  }

  return url;
};

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === "string" || input instanceof URL) {
    return originalFetch(normalizeApiUrl(String(input)), init);
  }

  if (input instanceof Request) {
    const requestUrl = normalizeApiUrl(input.url);
    const request = new Request(requestUrl, input);
    return originalFetch(request, init);
  }

  return originalFetch(input, init);
};

axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = normalizeApiUrl(config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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