import { useCallback } from "react";
import { evalTS } from "../../../lib/utils/bolt";
import type { StyleNavState } from "@shared/layer-style-types";
import { STYLE_BUTTONS } from "@shared/layer-style-types";

interface StyleNavGridProps {
  styleNav: StyleNavState[];
  currentStyleId: string;
  onSelectStyle: (id: string) => void;
  onRefresh: () => void;
}

export function StyleNavGrid({
  styleNav,
  currentStyleId,
  onSelectStyle,
  onRefresh,
}: StyleNavGridProps) {
  const handleClick = useCallback(
    (id: string) => {
      onSelectStyle(id);
    },
    [onSelectStyle],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, nav: StyleNavState) => {
      e.preventDefault();
      if (nav.id === "masterStyle") return;
      if (nav.isExisting && nav.isEnabled) {
        evalTS("removeStyle", nav.id).then(onRefresh);
      } else {
        evalTS("addStyle", nav.id).then(onRefresh);
      }
    },
    [onRefresh],
  );

  return (
    <div className="style-nav-grid">
      {STYLE_BUTTONS.map((sb, i) => {
        const nav = styleNav.find((n) => n.id === sb.id);
        const isExisting = nav?.isExisting ?? false;
        const isEnabled = nav?.isEnabled ?? false;
        const isSelected = currentStyleId === sb.id;

        let className = "style-nav-btn";
        if (isSelected) className += " selected";
        else if (isExisting && isEnabled) className += " exists";
        else className += " absent";

        return (
          <button
            key={sb.id}
            className={className}
            onClick={() => handleClick(sb.id)}
            onContextMenu={(e) =>
              handleContextMenu(e, nav ?? { id: sb.id, isExisting: false, isEnabled: false })
            }
            title={`${sb.label} — 左:選択 / 右:追加・削除`}
          >
            <span className="style-nav-label">{sb.label}</span>
            {(!isExisting || !isEnabled) && <span className="style-nav-slash" />}
          </button>
        );
      })}
    </div>
  );
}
