import React, { useCallback, useRef, useState } from "react";
import { Cell, AddButton } from "./components";
import { DataGridUtility } from "./utils/DataGridUtility";
import { DATA_GRID_DEFAULT_VALUES } from "./constants";
import { useMouseUp, useGlobalKeyDown, useClipboard } from "./hooks";
import { SelRange, DataGridValue, Coord } from "./types";

export default function DataGrid() {
  // To hold mouse state
  const mouseDownRef = useRef(false);

  // To store first selected cell place
  const [anchor, setAnchor] = useState<Coord | null>(null);
  // To store selected cells range
  const [currentSelection, setCurrentSelection] = useState<SelRange>(null);
  // To store focused cell place
  const [focused, setFocused] = useState<Coord | null>(null);

  // To store overall spreed sheet datas
  const [DataGridValues, setDataGridValues] = useState<DataGridValue>(
    DATA_GRID_DEFAULT_VALUES
  );

  // To find new focus
  const ROWS = DataGridValues.body.length;
  const COLS =
    DataGridValues.header?.length ??
    (DataGridValues.body[0] ? DataGridValues.body[0].length : 0);

  // Initiating hook to listen mouse release
  useMouseUp(() => {
    mouseDownRef.current = false;
  });

  // Function to store selection coordinate
  const setSelectionBetween = (a: Coord, b: Coord) => {
    setCurrentSelection({ start: a, end: b });
  };

  const buildTSVFromRange = useCallback(
    (range: { top: number; bottom: number; left: number; right: number }) => {
      const rows: string[] = [];
      for (let rr = range.top; rr <= range.bottom; rr++) {
        const cols: string[] = [];
        for (let cc = range.left; cc <= range.right; cc++) {
          const val =
            DataGridValues.body[rr] && DataGridValues.body[rr][cc] !== undefined
              ? DataGridValues.body[rr][cc]
              : "";
          cols.push(val);
        }
        rows.push(cols.join("\t"));
      }
      return rows.join("\n");
    },
    [DataGridValues]
  );

  const pasteTextAt = (text: string, start: Coord) => {
    const rows = DataGridUtility.parseTSV(text);

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
      const newRow = DataGridUtility.createEmptyStrArray(header.length);
      newRow[0] = DataGridUtility.getTitle("row", body.length);
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
          const newRow = DataGridUtility.createEmptyStrArray(header.length);
          newRow[0] = DataGridUtility.getTitle("row", body.length);
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

  const clearRange = useCallback(
    (range: { top: number; bottom: number; left: number; right: number }) => {
      const bodyCopy = DataGridUtility.getNewGridBody(DataGridValues.body);
      for (let rr = range.top; rr <= range.bottom; rr++) {
        if (!bodyCopy[rr]) continue;
        for (let cc = range.left; cc <= range.right; cc++) {
          bodyCopy[rr][cc] = "";
        }
      }
      setDataGridValues((prev) => ({ ...prev, body: bodyCopy }));
    },
    []
  );

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
  });

  // To create column row
  const addColumnClick = () => {
    setDataGridValues({
      header: [
        ...DataGridValues.header,
        DataGridUtility.getTitle("column", DataGridValues.header.length),
      ],
      body: DataGridValues.body.map((body) => [...body, ""]),
    });
  };

  // To create new row
  const addRowClick = () => {
    debugger;
    const newRow = DataGridUtility.createEmptyStrArray(
      DataGridValues.header.length
    );
    newRow[0] = DataGridUtility.getTitle("row", DataGridValues.body.length + 1);
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
    const bodyCells = DataGridUtility.getNewGridBody(DataGridValues.body);
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

    // keep current behaviour, prevent text selection while dragging
    mouseDownRef.current = true;
  };

  const cellMouseEnter = (cell: Coord) => {
    if (!mouseDownRef.current) return;
    if (!anchor) return;
    setSelectionBetween(anchor, cell);
  };

  const buildHeaders = () => (
    <tr className="h-[1rem]">
      {DataGridValues.header.map((data, i) => (
        <th key={`h-${i}`} className={i ? "bg-blue-500 text-white px-4 cursor-not-allowed" : "cursor-not-allowed"}>
          {data}
        </th>
      ))}{" "}
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
              isSelected={DataGridUtility.isCellSelected(currentSelection, {
                r,
                c,
              })}
              isAnchor={DataGridUtility.isAnchor(anchor, { r, c })}
              handleMouseDown={cellMouseDown}
              handleMouseEnter={cellMouseEnter}
              onClick={(coord) => setFocused(coord)}
            />
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-row">
        <table className="">
          <thead>{buildHeaders()}</thead>
          <tbody>{buildBody()}</tbody>
        </table>
        <AddButton type="Column" onClick={addColumnClick} />
      </div>
      <AddButton type="Row" onClick={addRowClick} />
    </div>
  );
}
