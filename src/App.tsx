import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import SuggestionPortal from "./SuggestionPortal";
import Suggestion from "./Suggestion";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Suggestion />
    </>
  );
}

export default App;
