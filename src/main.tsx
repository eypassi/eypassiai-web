import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { authCallbackDestination } from "./auth-callback-route";
import "./styles.css";

const callbackDestination = authCallbackDestination(window.location);
if (callbackDestination) {
  window.location.replace(callbackDestination);
} else {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
