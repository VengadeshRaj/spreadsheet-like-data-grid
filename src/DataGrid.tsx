import React, { useEffect, useRef, useState } from "react";
import AddButton from "./components/AddButton";
import Cell from "./components/Cell";
import { DataGridUtility } from "./utils/DataGridUtility";
import { DATA_GRID_DEFAULT_VALUES } from "./constants";
import { useMouseUp } from "./hooks/useMouseUp";
import { useGlobalKeyDown } from "./hooks/useKeyDown";
import { SelRange, DataGridValue, Coord } from "./types";
import { useClipboard } from "./hooks/useClipboard";

export default function DataGrid() {
  const mouseDownRef = useRef(false);
  const tableRef: any = useRef(null);

  const [anchor, setAnchor] = useState<Coord | null>(null);
  const [currentSelection, setCurrentSelection] = useState<SelRange>(null);
  const [focused, setFocused] = useState<Coord | null>(null);

  const [DataGridValues, setDataGridValues] = useState<DataGridValue>(
    DATA_GRID_DEFAULT_VALUES
  );

  const ROWS = DataGridValues.body.length;
  const COLS =
    DataGridValues.header?.length ??
    (DataGridValues.body[0] ? DataGridValues.body[0].length : 0);

  useMouseUp(() => {
    mouseDownRef.current = false;
  });

  const setSelectionBetween = (a: Coord, b: Coord) => {
    setCurrentSelection({ start: a, end: b });
  };

  const buildTSVFromRange = (range: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => {
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

  const pasteTextAt = (text: string, start: Coord) => {
    // parse TSV (tabs and newline)
    const rows = text
      .replace(/\r/g, "")
      .split("\n")
      .map((r) => r.split("\t"));
    const pasteRows = rows.length;
    const pasteCols = rows.reduce(
      (m, r) => DataGridUtility.getMax(m, r.length),
      0
    );

    // get update grid size
    const { header, body } = DataGridUtility.getNewGridSizeForPaste(
      DataGridValues,
      start,
      pasteRows,
      pasteCols
    );

    // To be robust, when required grid size exceeds current, expand bodyCopy/headerLen here as well:
    while (body.length < start.r + pasteRows) {
      const newRow = new Array(header.length).fill("");
      newRow[0] = `Label ${body.length}`;
      body.push(newRow);
    }

    if (body[0] && body[0].length < start.c + pasteCols) {
      const addCols = start.c + pasteCols - body[0].length;
      for (let r = 0; r < body.length; r++) {
        for (let k = 0; k < addCols; k++) body[r].push("");
      }
    }

    // write paste data
    for (let rr = 0; rr < rows.length; rr++) {
      for (let cc = 0; cc < rows[rr].length; cc++) {
        const tr = start.r + rr;
        const tc = start.c + cc;
        // ensure row exists
        if (!body[tr]) {
          const newRow = new Array(header.length).fill("");
          newRow[0] = `Label ${body.length}`;
          body.push(newRow);
        }
        body[tr][tc] = rows[rr][cc];
      }
    }

    setDataGridValues({ header, body });

    // update focus and selection to pasted range's end
    const endCoord = { r: start.r + pasteRows - 1, c: start.c + pasteCols - 1 };
    setFocused(endCoord);
    setAnchor(endCoord);
    setSelectionBetween(start, endCoord);
  };

  const clearRange = (range: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => {
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

  useClipboard({
    currentSelection,
    focused,
    anchor,
    buildTSVFromRange,
    clearRange,
    pasteTextAt,
  });

  useGlobalKeyDown({
    focused,
    anchor,
    setFocused,
    setAnchor,
    setSelectionBetween,
    ROWS,
    COLS,
    tableRef,
  });

  const addColumnClick = () => {
    setDataGridValues({
      header: [
        ...DataGridValues.header,
        `Head ${DataGridValues.header.length}`,
      ],
      body: DataGridValues.body.map((body) => [...body, ""]),
    });
  };


  const addRowClick = () => {
    const newRow = new Array(DataGridValues.header.length).fill("");
    newRow[0] = `Label ${DataGridValues.body.length}`;
    setDataGridValues({
      ...DataGridValues,
      body: [...DataGridValues.body, newRow],
    });
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
              isSelected={DataGridUtility.isCellSelected(currentSelection,{ r, c })}
              isAnchor={DataGridUtility.isAnchor(anchor, { r, c })}
              handleMouseDown={cellMouseDown}
              handleMouseEnter={cellMouseEnter}
              onClick={(coord) => setFocused(coord)}
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
      <table className="" ref={tableRef}>
        <thead>{buildHeaders()}</thead>
        <tbody>{buildBody()}</tbody>
      </table>
    </div>
  );
}
