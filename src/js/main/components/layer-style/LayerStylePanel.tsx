import { useCallback } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import { useLayerStyleState } from "./hooks/useLayerStyleState";
import { HeaderRow } from "./HeaderRow";
import { PColorRow } from "./PColorRow";
import { StyleNavGrid } from "./StyleNavGrid";
import { PropertyPanel } from "./PropertyPanel";
import "../../styles/layer-style.css";

export function LayerStylePanel() {
  const { state, currentStyleId, setCurrentStyleId, forceRefresh } =
    useLayerStyleState();

  const handleSelectStyle = useCallback(
    (id: string) => {
      setCurrentStyleId(id);
    },
    [setCurrentStyleId],
  );

  const handlePrevFrame = useCallback(() => {
    evalTS("navigateFrame", -1).then(forceRefresh);
  }, [forceRefresh]);

  const handleNextFrame = useCallback(() => {
    evalTS("navigateFrame", 1).then(forceRefresh);
  }, [forceRefresh]);

  const handleRevealKeys = useCallback(() => {
    evalTS("revealKeyframes").then(forceRefresh);
  }, [forceRefresh]);

  if (!state || !state.hasLayer) {
    return (
      <div className="ls-panel">
        <div className="ls-empty">レイヤーを選択してください</div>
      </div>
    );
  }

  return (
    <div className="ls-panel">
      <HeaderRow
        layerName={state.layerName}
        isSoloActive={state.isSoloActive}
        currentStyleId={currentStyleId}
        onRefresh={forceRefresh}
      />

      <div className="pcolor-nav-row">
        <PColorRow pColors={state.pColors} onRefresh={forceRefresh} />
        <div className="nav-group">
          <button className="nav-btn" onClick={handlePrevFrame} title="前のフレーム">
            ◁
          </button>
          <button className="nav-btn" onClick={handleRevealKeys} title="キーフレーム表示 (U)">
            U
          </button>
          <button className="nav-btn" onClick={handleNextFrame} title="次のフレーム">
            ▷
          </button>
        </div>
      </div>

      <StyleNavGrid
        styleNav={state.styleNav}
        currentStyleId={currentStyleId}
        onSelectStyle={handleSelectStyle}
        onRefresh={forceRefresh}
      />

      <PropertyPanel
        fillOpacity={state.fillOpacity}
        fillOpacityCanVary={state.fillOpacityCanVary}
        fillOpacityNumKeys={state.fillOpacityNumKeys}
        fillOpacityOnKey={state.fillOpacityOnKey}
        fillOpacityHasPrev={state.fillOpacityHasPrev}
        fillOpacityHasNext={state.fillOpacityHasNext}
        props={state.props}
        styleId={currentStyleId}
        onRefresh={forceRefresh}
      />
    </div>
  );
}
