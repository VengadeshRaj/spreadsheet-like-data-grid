import React, { useState, useRef, useEffect } from "react";
import "./table.css";

type Coord = { r: number; c: number };
type SelRange = { start: Coord; end: Coord } | null;

function normalizeRange(a: Coord, b: Coord) {
  const r1 = Math.min(a.r, b.r);
  const r2 = Math.max(a.r, b.r);
  const c1 = Math.min(a.c, b.c);
  const c2 = Math.max(a.c, b.c);
  return { top: r1, bottom: r2, left: c1, right: c2 };
}

function coordInRange(coord: Coord, range: { top: number; bottom: number; left: number; right: number }) {
  return coord.r >= range.top && coord.r <= range.bottom && coord.c >= range.left && coord.c <= range.right;
}

export default function SpreadsheetSelection() {
  const ROWS = 20;
  const COLS = 10;

  const [anchor, setAnchor] = useState<Coord | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelRange>(null);
  const mouseDownRef = useRef(false);
  const [focused, setFocused] = useState<Coord | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const setSelectionBetween = (a: Coord, b: Coord) => {
    setCurrentSelection({ start: a, end: b });
  };

  const handleMouseDown = (e: React.MouseEvent, cell: Coord) => {
    if (e.button !== 0) return;
    const isShift = e.shiftKey;
    const isMeta = e.ctrlKey || e.metaKey;

    if (isShift && anchor) {
      setSelectionBetween(anchor, cell);
      setFocused(cell);
    } else if (isMeta) {
      setAnchor(cell);
      setSelectionBetween(cell, cell);
      setFocused(cell);
    } else {
      setAnchor(cell);
      setSelectionBetween(cell, cell);
      setFocused(cell);
    }

    // keep current behaviour: prevent text selection while dragging
    mouseDownRef.current = true;
    e.preventDefault();
  };

  const handleMouseEnter = (e: React.MouseEvent, cell: Coord) => {
    if (!mouseDownRef.current) return;
    if (!anchor) return;
    setSelectionBetween(anchor, cell);
  };

  const handleMouseUp = () => {
    mouseDownRef.current = false;
  };

  useEffect(() => {
    const onUp = () => (mouseDownRef.current = false);
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  // document-level keyboard handling (includes arrows, shift+arrow, Tab/Shift+Tab)
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!focused) return;

      const { r, c } = focused;
      let newFocus = { r, c };
      const shift = ev.shiftKey;

      // Arrow keys
      if (ev.key === "ArrowDown") newFocus = { r: Math.min(ROWS - 1, r + 1), c };
      else if (ev.key === "ArrowUp") newFocus = { r: Math.max(0, r - 1), c };
      else if (ev.key === "ArrowLeft") newFocus = { r, c: Math.max(0, c - 1) };
      else if (ev.key === "ArrowRight") newFocus = { r, c: Math.min(COLS - 1, c + 1) };
      // Tab navigation
      else if (ev.key === "Tab") {
        ev.preventDefault();
        if (ev.shiftKey) {
          // Shift+Tab -> previous cell
          if (c > 0) newFocus = { r, c: c - 1 };
          else if (r > 0) newFocus = { r: r - 1, c: COLS - 1 };
        } else {
          // Tab -> next cell
          if (c < COLS - 1) newFocus = { r, c: c + 1 };
          else if (r < ROWS - 1) newFocus = { r: r + 1, c: 0 };
        }

        // Move focus and selection to the new cell (Tab behaves like single-cell move)
        setFocused(newFocus);
        setAnchor(newFocus);
        setSelectionBetween(newFocus, newFocus);

        // focus the td element
        const td = tableRef.current?.querySelector(`td[data-r="${newFocus.r}"][data-c="${newFocus.c}"]`) as HTMLElement | null;
        td?.focus();
        return;
      } else {
        return; // not a key we care about
      }

      // for arrow keys / shift+arrow:
      ev.preventDefault();

      // update focused
      setFocused(newFocus);

      if (shift) {
        // If there's no anchor yet, treat current focused as anchor
        const anchorToUse = anchor ?? focused;
        if (anchorToUse) {
          if (!anchor) setAnchor(anchorToUse);
          setSelectionBetween(anchorToUse, newFocus);
        } else {
          setAnchor(newFocus);
          setSelectionBetween(newFocus, newFocus);
        }
      } else {
        // non-shift arrow -> move anchor to newFocus and select single cell
        setAnchor(newFocus);
        setSelectionBetween(newFocus, newFocus);
      }

      // focus the td element for visual focus
      const td = tableRef.current?.querySelector(`td[data-r="${newFocus.r}"][data-c="${newFocus.c}"]`) as HTMLElement | null;
      td?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [focused, anchor]);

  const isCellSelected = (coord: Coord) => {
    if (!currentSelection) return false;
    const norm = normalizeRange(currentSelection.start, currentSelection.end);
    return coordInRange(coord, norm);
  };

  const isAnchor = (coord: Coord) => {
    if (!anchor) return false;
    return anchor.r === coord.r && anchor.c === coord.c;
  };

  const rows = Array.from({ length: ROWS }, (_, r) => r);
  const cols = Array.from({ length: COLS }, (_, c) => c);

  return (
    <div>
      <p>Click and drag to select cells. Shift+click or Shift+Arrow to extend selection. Tab moves to next cell.</p>
      <table
        ref={tableRef}
        tabIndex={0}
        className="table"
        onMouseUp={handleMouseUp}
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              {cols.map((c) => {
                const coord = { r, c };
                const selected = isCellSelected(coord);
                const anchorClass = isAnchor(coord) ? "anchor" : "";
                const className = `cell ${selected ? "selected" : ""} ${anchorClass}`.trim();
                return (
                  <td
                    key={c}
                    data-r={r}
                    data-c={c}
                    className={className}
                    onMouseDown={(e) => handleMouseDown(e, coord)}
                    onMouseEnter={(e) => handleMouseEnter(e, coord)}
                    onFocus={() => {
                      setFocused(coord);
                    }}
                    onClick={() => {
                      setFocused(coord);
                    }}
                    tabIndex={0} // allow programmatic focus
                  >
                    {`${String.fromCharCode(65 + c)}${r + 1}`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
