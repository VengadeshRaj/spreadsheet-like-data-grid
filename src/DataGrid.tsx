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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focused, anchor]);

  const handleKeyDown = (ev: KeyboardEvent) => {
    controlSelection(ev);
    clipBoardEvent(ev);
  };

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

  const clipBoardEvent = (e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // handle copy
    if (ctrl && e.key.toLowerCase() === "c") {
      e.preventDefault();
      if(currentSelection)
      console.log("CTRL + C triggered",normalizeRange(currentSelection.start, currentSelection.end));
      return;
    }
    // handle paste
    if (ctrl && e.key.toLowerCase() === "v") {
      e.preventDefault();
      console.log("CTRL + V triggered");
      return;
    }

    // handle cut
    if (ctrl && e.key.toLowerCase() === "x") {
      e.preventDefault();
      console.log("CTRL + X triggered");
      return;
    }
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
    const bodyCells = DataGridValues.body;
    bodyCells[rowIndex][rowValueIndex] = value;
    setDataGridValues({ ...DataGridValues, body: [...bodyCells] });
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
        <th className={i ? "header" : ""}>{data}</th>
      ))}{" "}
      <AddButton type="Column" onClick={addColumnClick} />
    </tr>
  );

  const buildBody = () => (
    <>
      {DataGridValues.body.map((row, r) => (
        <tr className="">
          {row.map((rowValue, c) => (
            <Cell
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

  return (
    <div>
      <table className="">
        <thead ref={tableRef}>{buildHeaders()}</thead>
        <tbody>{buildBody()}</tbody>
      </table>
    </div>
  );
}
