import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// api client automatically attaches token via interceptor
import "./api/client";

// Comprehensive error suppression for specific endpoints
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function (...args) {
  const errorString = args.join(" ");

  // Suppress various forms of 404 errors for forms/mine/latest
  if (
    errorString.includes("forms/mine/latest") &&
    (errorString.includes("404") ||
      errorString.includes("Not Found") ||
      errorString.includes("GET") ||
      errorString.includes("xhr.js") ||
      errorString.includes("dispatchXhrRequest"))
  ) {
    return; // Suppress the error
  }

  // Otherwise, pass through to the original console.error
  originalConsoleError.apply(console, args);
};

console.warn = function (...args) {
  const warnString = args.join(" ");

  // Suppress warnings for forms/mine/latest 404s
  if (warnString.includes("forms/mine/latest") && warnString.includes("404")) {
    return; // Suppress the warning
  }

  originalConsoleWarn.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
