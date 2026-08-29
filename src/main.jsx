import React from "react";
import ReactDOM from "react-dom/client";
import "./storageShim.js";
import PainelDaVida from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PainelDaVida />
  </React.StrictMode>
);
