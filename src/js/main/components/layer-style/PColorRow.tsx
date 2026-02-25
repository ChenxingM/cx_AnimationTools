import { useCallback } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import type { PColorState } from "@shared/layer-style-types";

interface PColorRowProps {
  pColors: PColorState[];
  onRefresh: () => void;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => {
    const h = Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
    return h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function PColorRow({ pColors, onRefresh }: PColorRowProps) {
  const handleClick = useCallback(
    (pc: PColorState) => {
      evalTS(
        "openPColorPicker",
        pc.effectName,
        pc.propIdx,
        pc.enableIdx,
      ).then(onRefresh);
    },
    [onRefresh],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, pc: PColorState) => {
      e.preventDefault();
      evalTS("togglePColor", pc.effectName, pc.enableIdx).then(onRefresh);
    },
    [onRefresh],
  );

  if (pColors.length === 0) return null;

  return (
    <div className="pcolor-row">
      {pColors.map((pc, i) => (
        <button
          key={i}
          className={`pcolor-btn${pc.isDisabled ? " disabled" : ""}`}
          style={{ backgroundColor: rgbToHex(pc.color[0], pc.color[1], pc.color[2]) }}
          onClick={() => handleClick(pc)}
          onContextMenu={(e) => handleContextMenu(e, pc)}
          title={pc.isDisabled ? "無効 (右クリックで有効化)" : "左クリック:拾色器 / 右クリック:切替"}
        >
          {pc.isDisabled && <span className="pcolor-x">✕</span>}
        </button>
      ))}
    </div>
  );
}
