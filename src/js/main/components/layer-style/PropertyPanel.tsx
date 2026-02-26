import { useCallback, useRef, useState } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import { PropertyRow } from "./PropertyRow";
import type { PropState, KeyframeAction } from "@shared/layer-style-types";

interface PropertyPanelProps {
  fillOpacity: number | null;
  fillOpacityCanVary: boolean;
  fillOpacityNumKeys: number;
  fillOpacityOnKey: boolean;
  fillOpacityHasPrev: boolean;
  fillOpacityHasNext: boolean;
  props: PropState[];
  styleId: string;
  onRefresh: () => void;
}

export function PropertyPanel({
  fillOpacity,
  fillOpacityCanVary,
  fillOpacityNumKeys,
  fillOpacityOnKey,
  fillOpacityHasPrev,
  fillOpacityHasNext,
  props,
  styleId,
  onRefresh,
}: PropertyPanelProps) {
  const [localFill, setLocalFill] = useState<string | null>(null);
  const scrubRef = useRef<{ active: boolean; startX: number; startVal: number } | null>(null);

  const handleFillChange = useCallback(
    (value: number) => {
      evalTS("setFillOpacity", value).then(onRefresh);
    },
    [onRefresh],
  );

  const handleFillKeyframe = useCallback(
    (action: KeyframeAction) => {
      evalTS("operateFillOpacityKeyframe", action).then(onRefresh);
    },
    [onRefresh],
  );

  const handleFillScrubDown = useCallback(
    (e: React.MouseEvent) => {
      if (fillOpacity === null) return;
      scrubRef.current = { active: true, startX: e.clientX, startVal: fillOpacity };

      const onMove = (ev: MouseEvent) => {
        if (!scrubRef.current?.active) return;
        const dx = ev.clientX - scrubRef.current.startX;
        let newVal = Math.round(scrubRef.current.startVal + dx);
        newVal = Math.max(0, Math.min(100, newVal));
        setLocalFill(String(newVal));
        evalTS("setFillOpacity", newVal);
      };

      const onUp = () => {
        if (scrubRef.current) scrubRef.current.active = false;
        setLocalFill(null);
        onRefresh();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [fillOpacity, onRefresh],
  );

  const handleFillSliderDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (fillOpacity === null) return;
      const track = e.currentTarget;

      const calcValue = (clientX: number) => {
        const rect = track.getBoundingClientRect();
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        return Math.round(pct * 100);
      };

      let newVal = calcValue(e.clientX);
      setLocalFill(String(newVal));
      evalTS("setFillOpacity", newVal);

      const onMove = (ev: MouseEvent) => {
        let v = calcValue(ev.clientX);
        setLocalFill(String(v));
        evalTS("setFillOpacity", v);
      };

      const onUp = () => {
        setLocalFill(null);
        onRefresh();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [fillOpacity, onRefresh],
  );

  const handleFillCommit = useCallback(
    (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
      if ("key" in e && e.key !== "Enter") return;
      const val = parseFloat(localFill ?? "");
      if (!isNaN(val)) handleFillChange(Math.max(0, Math.min(100, val)));
      setLocalFill(null);
    },
    [localFill, handleFillChange],
  );

  return (
    <div className="property-panel">
      {fillOpacity !== null && (
        <div className="prop-row fill-opacity-row">
          <span className="prop-label highlight">塗りの不透明度</span>
          <div className="prop-value">
            <div className="number-control">
              <input
                className="number-input"
                type="text"
                value={localFill ?? String(fillOpacity)}
                onFocus={(e) => setLocalFill(e.target.value)}
                onChange={(e) => setLocalFill(e.target.value)}
                onBlur={handleFillCommit}
                onKeyDown={handleFillCommit}
                onMouseDown={handleFillScrubDown}
              />
              <div className="slider-track" onMouseDown={handleFillSliderDown}>
                <div
                  className="slider-fill"
                  style={{ width: `${Math.max(0, Math.min(100, parseFloat(localFill ?? String(fillOpacity)) || 0))}%` }}
                />
              </div>
            </div>
          </div>
          <div className="kf-group">
            <button
              className={`kf-btn${fillOpacityOnKey ? " active" : ""}`}
              disabled={!fillOpacityCanVary}
              onClick={() => handleFillKeyframe("add")}
            >
              K
            </button>
            <button
              className={`kf-btn${fillOpacityHasPrev ? " active" : ""}`}
              disabled={!fillOpacityCanVary}
              onClick={() => handleFillKeyframe("prev")}
            >
              ◀
            </button>
            <button
              className={`kf-btn${fillOpacityHasNext ? " active" : ""}`}
              disabled={!fillOpacityCanVary}
              onClick={() => handleFillKeyframe("next")}
            >
              ▶
            </button>
            <button
              className="kf-btn"
              disabled={!fillOpacityCanVary}
              onClick={() => handleFillKeyframe("remove")}
            >
              －
            </button>
            <button
              className="kf-btn"
              disabled={!fillOpacityCanVary}
              onClick={() => handleFillKeyframe("hold_all")}
            >
              ■
            </button>
          </div>
        </div>
      )}

      {props.map((p, i) => (
        <PropertyRow
          key={`${styleId}-${i}`}
          prop={p}
          propIndex={i}
          styleId={styleId}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
