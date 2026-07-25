import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { dismissSplash } from "./lib/splash";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root container #root was not found.");
}

createRoot(rootElement).render(<App />);

dismissSplash();
