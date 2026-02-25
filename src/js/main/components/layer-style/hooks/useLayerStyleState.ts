import { useCallback, useEffect, useRef, useState } from "react";
import { evalTS } from "../../../../lib/utils/bolt";
import type { LayerStylePanelState } from "@shared/layer-style-types";

const POLL_ACTIVE = 200;
const POLL_IDLE = 1000;
const IDLE_THRESHOLD = 3000; // ms without change before going idle

export function useLayerStyleState() {
  const [state, setState] = useState<LayerStylePanelState | null>(null);
  const [currentStyleId, setCurrentStyleId] = useState("innerShadow");
  const styleIdRef = useRef(currentStyleId);
  const lastHashRef = useRef("");
  const lastChangeTimeRef = useRef(Date.now());
  const intervalRef = useRef<number | null>(null);

  styleIdRef.current = currentStyleId;

  const poll = useCallback(async () => {
    try {
      const result = await evalTS("getLayerStyleState", styleIdRef.current);
      if (result) {
        // Track changes for adaptive polling
        if (result.layerHash !== lastHashRef.current) {
          lastChangeTimeRef.current = Date.now();
          lastHashRef.current = result.layerHash;
        }
        // If host auto-corrected the style id, sync it
        if (result.currentStyleId !== styleIdRef.current) {
          setCurrentStyleId(result.currentStyleId);
        }
        setState(result);
      }
    } catch {
      // Host not available yet
    }
  }, []);

  const forceRefresh = useCallback(() => {
    lastChangeTimeRef.current = Date.now();
    poll();
  }, [poll]);

  // Adaptive polling
  useEffect(() => {
    const tick = () => {
      poll();
      const elapsed = Date.now() - lastChangeTimeRef.current;
      const interval = elapsed > IDLE_THRESHOLD ? POLL_IDLE : POLL_ACTIVE;
      intervalRef.current = window.setTimeout(tick, interval);
    };
    tick();
    return () => {
      if (intervalRef.current !== null) clearTimeout(intervalRef.current);
    };
  }, [poll]);

  return {
    state,
    currentStyleId,
    setCurrentStyleId,
    forceRefresh,
  };
}
