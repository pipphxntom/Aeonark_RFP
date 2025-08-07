import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Remove initial loader once React is ready
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  setTimeout(() => {
    initialLoader.style.display = 'none';
  }, 100);
}

createRoot(document.getElementById("root")!).render(<App />);
