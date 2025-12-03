import { useEffect } from "react";
import { DataGridUtility } from "../utils/DataGridUtility";
import { Coord } from "../types";

export function useGlobalKeyDown(params: {
  focused: Coord | null;
  anchor: Coord | null;
  setFocused: (c: Coord) => void;
  setAnchor: (c: Coord) => void;
  setSelectionBetween: (a: Coord, b: Coord) => void;
  ROWS: number;
  COLS: number;
}) {
  const { focused, anchor, setFocused, setAnchor, setSelectionBetween, ROWS, COLS } = params;

  useEffect(() => {
    const controlSelection = (ev: KeyboardEvent) => {
      if (!focused) return;

      const { r, c } = focused;
      let newFocus: Coord = { r, c };
      const shift = ev.shiftKey;

      // Arrow keys
      if (ev.key === "ArrowDown") newFocus = { r: DataGridUtility.getMin(ROWS - 1, r + 1), c };
      else if (ev.key === "ArrowUp") newFocus = { r: DataGridUtility.getMax(0, r - 1), c };
      else if (ev.key === "ArrowLeft") newFocus = { r, c: DataGridUtility.getMax(0, c - 1) };
      else if (ev.key === "ArrowRight") newFocus = { r, c: DataGridUtility.getMin(COLS - 1, c + 1) };
      // Tab navigation
      else if (ev.key === "Tab") {
        if (ev.shiftKey) {
          if (c > 0) newFocus = { r, c: c - 1 };
          else if (r > 0) newFocus = { r: r - 1, c: COLS - 1 };
        } else {
          if (c < COLS - 1) newFocus = { r, c: c + 1 };
          else if (r < ROWS - 1) newFocus = { r: r + 1, c: 0 };
        }

        setFocused(newFocus);
        setAnchor(newFocus);
        setSelectionBetween(newFocus, newFocus);
        return;
      } else {
        return;
      }

      // update focused
      setFocused(newFocus);

      if (shift) {
        const anchorToUse = anchor ?? focused;
        if (anchorToUse) {
          if (!anchor) setAnchor(anchorToUse);
          setSelectionBetween(anchorToUse, newFocus);
        } else {
          setAnchor(newFocus);
          setSelectionBetween(newFocus, newFocus);
        }
      } else {
        setAnchor(newFocus);
        setSelectionBetween(newFocus, newFocus);
      }
    };

    const listener = (e: KeyboardEvent) => controlSelection(e);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, anchor, ROWS, COLS]);
}
