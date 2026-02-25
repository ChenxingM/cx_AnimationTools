import { useCallback, useRef, useState } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import { BASE_NAMES, SUFFIXES } from "@shared/layer-style-types";

interface HeaderRowProps {
  layerName: string;
  isSoloActive: boolean;
  currentStyleId: string;
  onRefresh: () => void;
}

export function HeaderRow({
  layerName,
  isSoloActive,
  currentStyleId,
  onRefresh,
}: HeaderRowProps) {
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = isEditing ? editName : layerName;

  const handleNameFocus = () => {
    setEditName(layerName);
    setIsEditing(true);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (editName !== layerName) {
      evalTS("renameLayer", editName).then(onRefresh);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const handleBaseName = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = e.target.selectedIndex;
      if (idx === 0) return;
      evalTS("applyBaseName", e.target.value).then(onRefresh);
      e.target.selectedIndex = 0;
    },
    [onRefresh],
  );

  const handleSuffix = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const suffix = e.target.value;
      evalTS("applyNameSuffix", suffix).then(onRefresh);
    },
    [onRefresh],
  );

  const handleSolo = useCallback(() => {
    evalTS("toggleSolo").then(onRefresh);
  }, [onRefresh]);

  const handleExpand = useCallback(() => {
    evalTS("expandStyleProperty", currentStyleId).then(onRefresh);
  }, [currentStyleId, onRefresh]);

  const handleFxToggle = useCallback(() => {
    evalTS("toggleFxEnabled").then(onRefresh);
  }, [onRefresh]);

  return (
    <div className="header-row">
      <span className="header-label">対象:</span>
      <input
        ref={inputRef}
        className="layer-name-input"
        type="text"
        value={displayName}
        onChange={(e) => setEditName(e.target.value)}
        onFocus={handleNameFocus}
        onBlur={handleNameBlur}
        onKeyDown={handleNameKeyDown}
      />
      <select className="header-select" onChange={handleBaseName}>
        {BASE_NAMES.map((n, i) => (
          <option key={i} value={n}>
            {n}
          </option>
        ))}
      </select>
      <select className="header-select suffix-select" onChange={handleSuffix}>
        {SUFFIXES.map((s, i) => (
          <option key={i} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        className={`header-btn${isSoloActive ? " active" : ""}`}
        onClick={handleSolo}
        title="Solo (独立表示)"
      >
        S
      </button>
      <button className="header-btn" onClick={handleExpand} title="展開">
        ◩
      </button>
      <button className="header-btn" onClick={handleFxToggle} title="FX一括切替">
        FX
      </button>
    </div>
  );
}
