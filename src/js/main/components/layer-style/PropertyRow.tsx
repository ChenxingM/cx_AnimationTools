import { useCallback, useRef, useState } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import type { PropState, KeyframeAction } from "@shared/layer-style-types";
import { blendModes } from "@shared/layer-style-types";

interface PropertyRowProps {
  prop: PropState;
  propIndex: number;
  styleId: string;
  onRefresh: () => void;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const HIGHLIGHT_LABELS = ["描画モード", "不透明度", "角度", "サイズ"];

function clampValue(label: string, value: number): number {
  if (label.indexOf("不透明度") !== -1) return Math.max(0, Math.min(100, value));
  if (label === "角度") {
    let v = value % 360;
    if (v < 0) v += 360;
    return v;
  }
  if (["サイズ", "距離", "スプレッド", "チョーク"].indexOf(label) !== -1) return Math.max(0, value);
  if (label.indexOf("深さ") !== -1) return Math.max(0, Math.min(1000, value));
  return value;
}

function getSensitivity(label: string): number {
  if (label === "角度") return 1.5;
  if (label.indexOf("不透明度") !== -1) return 1;
  return 0.5;
}

export function PropertyRow({ prop, propIndex, styleId, onRefresh }: PropertyRowProps) {
  const [localVal, setLocalVal] = useState<string | null>(null);
  const scrubRef = useRef<{
    active: boolean;
    startX: number;
    startVal: number;
  } | null>(null);

  const isHighlight = HIGHLIGHT_LABELS.indexOf(prop.label) !== -1;

  const handleValueChange = useCallback(
    (newVal: number | boolean) => {
      evalTS("setPropertyValue", styleId, propIndex, newVal).then(onRefresh);
    },
    [styleId, propIndex, onRefresh],
  );

  const handleKeyframe = useCallback(
    (action: KeyframeAction) => {
      evalTS("operateKeyframe", styleId, propIndex, action).then(onRefresh);
    },
    [styleId, propIndex, onRefresh],
  );

  const handleColorClick = useCallback(() => {
    evalTS("openNativeColorPicker", styleId, propIndex).then(onRefresh);
  }, [styleId, propIndex, onRefresh]);

  const handleBlendModeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = e.target.selectedIndex;
      handleValueChange(blendModes[idx].val);
    },
    [handleValueChange],
  );

  // Scrub drag handling
  const handleScrubDown = useCallback(
    (e: React.MouseEvent) => {
      const currentVal = typeof prop.value === "boolean" ? (prop.value ? 1 : 0) : (prop.value as number);
      scrubRef.current = { active: true, startX: e.clientX, startVal: currentVal };

      const onMove = (ev: MouseEvent) => {
        if (!scrubRef.current?.active) return;
        const dx = ev.clientX - scrubRef.current.startX;
        const sensitivity = getSensitivity(prop.label);
        let newVal = scrubRef.current.startVal + dx * sensitivity;
        newVal = clampValue(prop.label, newVal);
        newVal = Math.round(newVal);
        setLocalVal(String(newVal));
        const applyVal = prop.type === "boolean" ? newVal !== 0 : newVal;
        evalTS("setPropertyValue", styleId, propIndex, applyVal);
      };

      const onUp = () => {
        if (scrubRef.current) scrubRef.current.active = false;
        setLocalVal(null);
        onRefresh();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [prop.value, prop.label, prop.type, styleId, propIndex, onRefresh],
  );

  const handleInputCommit = useCallback(
    (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
      if ("key" in e && e.key !== "Enter") return;
      const val = parseFloat(localVal ?? "");
      if (!isNaN(val)) {
        const applyVal = prop.type === "boolean" ? val !== 0 : val;
        handleValueChange(applyVal);
      }
      setLocalVal(null);
    },
    [localVal, prop.type, handleValueChange],
  );

  const handleUp = useCallback(() => {
    const step = prop.type === "number" && prop.label === "角度" ? 5 : 1;
    const currentVal = typeof prop.value === "boolean" ? (prop.value ? 1 : 0) : (prop.value as number);
    const newVal = prop.type === "boolean" ? (currentVal + step !== 0) : currentVal + step;
    handleValueChange(newVal);
  }, [prop.value, prop.type, prop.label, handleValueChange]);

  const handleDown = useCallback(() => {
    const step = prop.type === "number" && prop.label === "角度" ? 5 : 1;
    const currentVal = typeof prop.value === "boolean" ? (prop.value ? 1 : 0) : (prop.value as number);
    const newVal = prop.type === "boolean" ? (currentVal - step !== 0) : currentVal - step;
    handleValueChange(newVal);
  }, [prop.value, prop.type, prop.label, handleValueChange]);

  // Render value control
  let valueControl: React.ReactNode;
  if (prop.type === "color") {
    const c = prop.value as [number, number, number];
    valueControl = (
      <button
        className="color-btn"
        style={{ backgroundColor: rgbToHex(c[0], c[1], c[2]) }}
        onClick={handleColorClick}
      />
    );
  } else if (prop.type === "blendMode") {
    const currentIdx = blendModes.findIndex((m) => m.val === prop.value);
    valueControl = (
      <select
        className="blend-mode-select"
        value={currentIdx >= 0 ? currentIdx : 0}
        onChange={handleBlendModeChange}
      >
        {blendModes.map((m, i) => (
          <option key={i} value={i}>
            {m.name}
          </option>
        ))}
      </select>
    );
  } else {
    // number or boolean
    const displayVal =
      localVal ??
      (prop.type === "boolean"
        ? prop.value
          ? "1"
          : "0"
        : String(prop.value));
    valueControl = (
      <div className="number-control">
        <input
          className="number-input"
          type="text"
          value={displayVal}
          onFocus={(e) => {
            setLocalVal(e.target.value);
          }}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleInputCommit}
          onKeyDown={handleInputCommit}
          onMouseDown={handleScrubDown}
        />
        <div className="number-arrows">
          <button className="arrow-btn" onClick={handleUp}>
            ▲
          </button>
          <button className="arrow-btn" onClick={handleDown}>
            ▼
          </button>
        </div>
      </div>
    );
  }

  // Keyframe buttons
  const kfDisabled = !prop.canVaryOverTime;

  return (
    <div className="prop-row">
      <span className={`prop-label${isHighlight ? " highlight" : ""}`}>
        {prop.label}
      </span>
      <div className="prop-value">{valueControl}</div>
      <div className="kf-group">
        <button
          className={`kf-btn${prop.onKeyframe ? " active" : ""}`}
          disabled={kfDisabled}
          onClick={() => handleKeyframe("add")}
          title="キーフレーム追加"
        >
          K
        </button>
        <button
          className={`kf-btn${prop.hasPrev ? " active" : ""}`}
          disabled={kfDisabled}
          onClick={() => handleKeyframe("prev")}
          title="前のキーフレーム"
        >
          ◀
        </button>
        <button
          className={`kf-btn${prop.hasNext ? " active" : ""}`}
          disabled={kfDisabled}
          onClick={() => handleKeyframe("next")}
          title="次のキーフレーム"
        >
          ▶
        </button>
        <button
          className="kf-btn"
          disabled={kfDisabled}
          onClick={() => handleKeyframe("remove")}
          title="キーフレーム削除"
        >
          －
        </button>
        <button
          className="kf-btn"
          disabled={kfDisabled}
          onClick={() => handleKeyframe("hold_all")}
          title="すべてHoldに変換"
        >
          ■
        </button>
      </div>
    </div>
  );
}
