import "../styles/app-appearance.css";
import { initializeAppAppearance } from "./appearance";

// Run before the first React render, including direct links and page refreshes.
const dispose = initializeAppAppearance();
if (import.meta.hot) import.meta.hot.dispose(dispose);
