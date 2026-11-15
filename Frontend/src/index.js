import React from "react";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";

const isLoopbackHost = (hostname) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "[::1]";

const resolveApiBaseUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL ||
    process.env.VITE_API_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;
  const apiUrl = new URL(configuredUrl, window.location.origin);

  if (
    (apiUrl.protocol !== "https:" &&
      !(apiUrl.protocol === "http:" && isLoopbackHost(apiUrl.hostname))) ||
    apiUrl.username ||
    apiUrl.password
  ) {
    throw new Error("La API debe usar HTTPS fuera de un entorno local.");
  }

  return apiUrl.toString().replace(/\/$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

const normalizeApiUrl = (url) => {
  if (typeof url !== "string") return url;
  const parsedUrl = new URL(url, window.location.origin);

  if (
    parsedUrl.protocol === "http:" &&
    isLoopbackHost(parsedUrl.hostname) &&
    parsedUrl.port === "8000"
  ) {
    return `${API_BASE_URL}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
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