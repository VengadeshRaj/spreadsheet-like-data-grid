import React, { useEffect, useRef, useState } from "react";
import AddButton from "./components/AddButton";
import Cell, { Coord } from "./components/Cell";

type SelRange = { start: Coord; end: Coord } | null;

export default function DataGrid() {
  const [anchor, setAnchor] = useState<Coord | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelRange>(null);
  const [focused, setFocused] = useState<Coord | null>(null);
  const mouseDownRef = useRef(false);
  const tableRef: any = useRef(null);

  const [DataGridValues, setDataGridValues] = useState({
    header: ["", "Head 1", "Head 2", "Head 3", "Head 4"],
    body: [
      ["Label 1", "", "", "", ""],
      ["Label 2", "", "", "", ""],
      ["Label 3", "", "", "", ""],
      ["Label 4", "", "", "", ""],
    ],
  });
  const ROWS = DataGridValues.body.length;
  const COLS =
    DataGridValues.header?.length ??
    (DataGridValues.body[0] ? DataGridValues.body[0].length : 0);

  useEffect(() => {
    const onUp = () => (mouseDownRef.current = false);
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", controlSelection);
    return () => document.removeEventListener("keydown", controlSelection);
  }, [focused, anchor, currentSelection, DataGridValues]);

  useEffect(() => {
    // Clipboard event handlers using document events:
    const onCopy = (e: ClipboardEvent) => {
      if (!currentSelection && !focused) return;
      e.preventDefault();
      const sel = currentSelection ?? (focused ? { start: focused, end: focused } : null);
      if (!sel) return;
      const norm = normalizeRange(sel.start, sel.end);
      const tsv = buildTSVFromRange(norm);
      e.clipboardData?.setData("text/plain", tsv);
    };

    const onCut = (e: ClipboardEvent) => {
      if (!currentSelection && !focused) return;
      e.preventDefault();
      const sel = currentSelection ?? (focused ? { start: focused, end: focused } : null);
      if (!sel) return;
      const norm = normalizeRange(sel.start, sel.end);
      const tsv = buildTSVFromRange(norm);
      e.clipboardData?.setData("text/plain", tsv);
      // Clear selected cells after copying
      clearRange(norm);
    };

    const onPaste = (e: ClipboardEvent) => {
      if (!focused && !anchor) return;
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (!text) return;
      pasteTextAt(text, focused ?? anchor!);
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [currentSelection, focused, DataGridValues]);


  const controlSelection = (ev: KeyboardEvent) => {
    if (!focused) return;

    const { r, c } = focused;
    let newFocus = { r, c };
    const shift = ev.shiftKey;

    // Arrow keys
    if (ev.key === "ArrowDown") newFocus = { r: Math.min(ROWS - 1, r + 1), c };
    else if (ev.key === "ArrowUp") newFocus = { r: Math.max(0, r - 1), c };
    else if (ev.key === "ArrowLeft") newFocus = { r, c: Math.max(0, c - 1) };
    else if (ev.key === "ArrowRight")
      newFocus = { r, c: Math.min(COLS - 1, c + 1) };
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
      const td = tableRef.current?.querySelector(
        `td[data-r="${newFocus.r}"][data-c="${newFocus.c}"]`
      ) as HTMLElement | null;
      td?.focus();
      return;
    } else {
      return; // not a key we care about
    }

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
    const td = tableRef.current?.querySelector(
      `td[data-r="${newFocus.r}"][data-c="${newFocus.c}"]`
    ) as HTMLElement | null;
    td?.focus();
  };

  const addColumnClick = () => {
    setDataGridValues({
      header: [
        ...DataGridValues.header,
        `Head ${DataGridValues.header.length}`,
      ],
      body: DataGridValues.body.map((body) => [...body, ""]),
    });
  };

  function normalizeRange(a: Coord, b: Coord) {
    const r1 = Math.min(a.r, b.r);
    const r2 = Math.max(a.r, b.r);
    const c1 = Math.min(a.c, b.c);
    const c2 = Math.max(a.c, b.c);
    return { top: r1, bottom: r2, left: c1, right: c2 };
  }

  function coordInRange(
    coord: Coord,
    range: { top: number; bottom: number; left: number; right: number }
  ) {
    return (
      coord.r >= range.top &&
      coord.r <= range.bottom &&
      coord.c >= range.left &&
      coord.c <= range.right
    );
  }

  const setSelectionBetween = (a: Coord, b: Coord) => {
    setCurrentSelection({ start: a, end: b });
  };

  const isCellSelected = (coord: Coord) => {
    if (!currentSelection) return false;
    const norm = normalizeRange(currentSelection.start, currentSelection.end);
    return coordInRange(coord, norm);
  };

  const isAnchor = (coord: Coord) => {
    if (!anchor) return false;
    return anchor.r === coord.r && anchor.c === coord.c;
  };

  const addRowClick = () => {
    const newRow = new Array(DataGridValues.header.length).fill("");
    newRow[0] = `Label ${DataGridValues.body.length}`;
    setDataGridValues({
      ...DataGridValues,
      body: [...DataGridValues.body, newRow],
    });
  };

  const cellOnClick = (coord: Coord) => {
    setFocused(coord);
  };

  const onCellValueCommit = (
    value: string,
    rowIndex: number,
    rowValueIndex: number
  ) => {
    const bodyCells = DataGridValues.body.map((r) => [...r]);
    bodyCells[rowIndex][rowValueIndex] = value;
    setDataGridValues({ ...DataGridValues, body: bodyCells });
  };

  const cellMouseDown = (e: React.MouseEvent, cell: Coord) => {
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
  };

  const cellMouseEnter = (e: React.MouseEvent, cell: Coord) => {
    if (!mouseDownRef.current) return;
    if (!anchor) return;
    setSelectionBetween(anchor, cell);
  };

  const buildHeaders = () => (
    <tr>
      {DataGridValues.header.map((data, i) => (
        <th key={`h-${i}`} className={i ? "header" : ""}>
          {data}
        </th>
      ))}{" "}
      <AddButton type="Column" onClick={addColumnClick} />
    </tr>
  );

  const buildBody = () => (
    <>
      {DataGridValues.body.map((row, r) => (
        <tr key={`r-${r}`} className="">
          {row.map((rowValue, c) => (
            <Cell
              key={`cell-${r}-${c}`}
              coord={{ r, c }}
              isEditable={!(c == 0)}
              text={rowValue}
              onCellValueChange={(e) => onCellValueCommit(e, r, c)}
              isSelected={isCellSelected({ r, c })}
              isAnchor={isAnchor({ r, c })}
              handleMouseDown={cellMouseDown}
              handleMouseEnter={cellMouseEnter}
              onClick={(coord) => cellOnClick(coord)}
            />
          ))}
        </tr>
      ))}

      <tr>
        <AddButton type="Row" onClick={addRowClick} />
      </tr>
    </>
  );

  // -------------------------
  // Clipboard helpers
  // -------------------------
  const buildTSVFromRange = (range: { top: number; bottom: number; left: number; right: number }) => {
    const rows: string[] = [];
    for (let rr = range.top; rr <= range.bottom; rr++) {
      const cols: string[] = [];
      for (let cc = range.left; cc <= range.right; cc++) {
        // If row exists and column exists
        const val =
          DataGridValues.body[rr] && DataGridValues.body[rr][cc] !== undefined
            ? DataGridValues.body[rr][cc]
            : "";
        cols.push(val);
      }
      rows.push(cols.join("\t"));
    }
    return rows.join("\n");
  };

  const clearRange = (range: { top: number; bottom: number; left: number; right: number }) => {
    const bodyCopy = DataGridValues.body.map((r) => [...r]);
    for (let rr = range.top; rr <= range.bottom; rr++) {
      // make sure row exists
      if (!bodyCopy[rr]) continue;
      for (let cc = range.left; cc <= range.right; cc++) {
        bodyCopy[rr][cc] = "";
      }
    }
    setDataGridValues({ ...DataGridValues, body: bodyCopy });
  };

  const ensureGridSizeForPaste = (start: Coord, pasteRows: number, pasteCols: number) => {
    let needUpdate = false;
    const bodyCopy = DataGridValues.body.map((r) => [...r]);
    const headerCopy = [...DataGridValues.header];

    // rows
    const requiredRows = start.r + pasteRows;
    while (bodyCopy.length < requiredRows) {
      const newRow = new Array(headerCopy.length).fill("");
      newRow[0] = `Label ${bodyCopy.length}`;
      bodyCopy.push(newRow);
      needUpdate = true;
    }

    // columns
    const requiredCols = start.c + pasteCols;
    if (headerCopy.length < requiredCols) {
      const addCount = requiredCols - headerCopy.length;
      for (let i = 0; i < addCount; i++) {
        headerCopy.push(`Head ${headerCopy.length}`);
      }
      // expand existing rows
      for (let r = 0; r < bodyCopy.length; r++) {
        for (let k = 0; k < addCount; k++) {
          bodyCopy[r].push("");
        }
      }
      needUpdate = true;
    }

    if (needUpdate) {
      setDataGridValues({ header: headerCopy, body: bodyCopy });
    }
  };

  const pasteTextAt = (text: string, start: Coord) => {
    // parse TSV (tabs and newline)
    const rows = text.replace(/\r/g, "").split("\n").map((r) => r.split("\t"));
    const pasteRows = rows.length;
    const pasteCols = rows.reduce((m, r) => Math.max(m, r.length), 0);

    // ensure grid size
    ensureGridSizeForPaste(start, pasteRows, pasteCols);

    // after ensure, take a fresh copy of grid (because setState may be async)
    const bodyCopy = DataGridValues.body.map((r) => [...r]);
    const headerLen = DataGridValues.header.length;

    // If ensureGridSizeForPaste added rows/cols via setState, DataGridValues might be stale.
    // To be robust, when required grid size exceeds current, expand bodyCopy/headerLen here as well:
    while (bodyCopy.length < start.r + pasteRows) {
      const newRow = new Array(headerLen).fill("");
      newRow[0] = `Label ${bodyCopy.length}`;
      bodyCopy.push(newRow);
    }
    if (bodyCopy[0] && bodyCopy[0].length < start.c + pasteCols) {
      const addCols = start.c + pasteCols - bodyCopy[0].length;
      for (let r = 0; r < bodyCopy.length; r++) {
        for (let k = 0; k < addCols; k++) bodyCopy[r].push("");
      }
    }

    // write paste data
    for (let rr = 0; rr < rows.length; rr++) {
      for (let cc = 0; cc < rows[rr].length; cc++) {
        const tr = start.r + rr;
        const tc = start.c + cc;
        // ensure row exists
        if (!bodyCopy[tr]) {
          const newRow = new Array(DataGridValues.header.length).fill("");
          newRow[0] = `Label ${bodyCopy.length}`;
          bodyCopy.push(newRow);
        }
        bodyCopy[tr][tc] = rows[rr][cc];
      }
    }

    setDataGridValues({ ...DataGridValues, body: bodyCopy });

    // update focus and selection to pasted range's end
    const endCoord = { r: start.r + pasteRows - 1, c: start.c + pasteCols - 1 };
    setFocused(endCoord);
    setAnchor(endCoord);
    setSelectionBetween(start, endCoord);

    // focus the td element for visual focus (if present)
    setTimeout(() => {
      const td = tableRef.current?.querySelector(
        `td[data-r="${endCoord.r}"][data-c="${endCoord.c}"]`
      ) as HTMLElement | null;
      td?.focus();
    }, 0);
  };

  return (
    <div>
      <table className="" ref={tableRef}>
        <thead>{buildHeaders()}</thead>
        <tbody>{buildBody()}</tbody>
      </table>
    </div>
  );
}
