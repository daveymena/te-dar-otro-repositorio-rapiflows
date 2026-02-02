import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Main.tsx loading...");
const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

if (!rootElement) {
    console.error("Root element NOT FOUND!");
} else {
    createRoot(rootElement).render(<App />);
    console.log("App rendered to root.");
}
