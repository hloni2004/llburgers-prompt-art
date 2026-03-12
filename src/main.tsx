import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Fade out and remove the splash loader
const splash = document.getElementById("splash");
if (splash) {
  splash.style.opacity = "0";
  splash.addEventListener("transitionend", () => splash.remove());
}
