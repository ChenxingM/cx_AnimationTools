import { useEffect, useState } from "react";
import { subscribeBackgroundColor } from "../lib/utils/bolt";
import { LayerStylePanel } from "./components/layer-style/LayerStylePanel";

export const App = () => {
  const [bgColor, setBgColor] = useState("#232323");

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
  }, []);

  return (
    <div className="app" style={{ backgroundColor: bgColor }}>
      <LayerStylePanel />
    </div>
  );
};
