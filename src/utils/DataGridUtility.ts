import { Coord, DataGridValue, GridRow, SelRange } from "../types";

export abstract class DataGridUtility {
  static getTitle(type: "row" | "column", no: number) {
    return type == "row" ? `R${no}` : `C${no}`;
  }
  static getMin(a: number, b: number) {
    return Math.min(a, b);
  }
  static getMax(a: number, b: number) {
    return Math.max(a, b);
  }

  static parseTSV(text: string) {
    return text
      .replace(/\r/g, "")
      .split("\n")
      .map((r) => r.split("\t"));
  }

  static getNewGridBody(gridBody: GridRow[]) {
    return gridBody.map((r) => [...r]);
  }

  static createEmptyStrArray(length: number) {
    return new Array(length).fill("");
  }

  static normalizeRange(a: Coord, b: Coord) {
    const r1 = DataGridUtility.getMin(a.r, b.r);
    const r2 = DataGridUtility.getMax(a.r, b.r);
    const c1 = DataGridUtility.getMin(a.c, b.c);
    const c2 = DataGridUtility.getMax(a.c, b.c);
    return { top: r1, bottom: r2, left: c1, right: c2 };
  }

  static coordInRange(
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

  static isCellSelected(currentSelection: SelRange, coord: Coord) {
    if (!currentSelection) return false;
    const norm = DataGridUtility.normalizeRange(
      currentSelection.start,
      currentSelection.end
    );
    return DataGridUtility.coordInRange(coord, norm);
  }

  static isAnchor(anchor: Coord | null, coord: Coord) {
    if (!anchor) return false;
    return anchor.r === coord.r && anchor.c === coord.c;
  }

  static getNewGridSizeForPaste = (
    DataGridValues: DataGridValue,
    start: Coord,
    pasteRows: number,
    pasteCols: number
  ) => {
    let needUpdate = false;
    const bodyCopy = DataGridValues.body.map((r) => [...r]);
    const headerCopy = [...DataGridValues.header];

    // rows
    const requiredRows = start.r + pasteRows;
    while (bodyCopy.length < requiredRows) {
      const newRow = new Array(headerCopy.length).fill("");
      newRow[0] = `R${bodyCopy.length}`;
      bodyCopy.push(newRow);
      needUpdate = true;
    }

    // columns
    const requiredCols = start.c + pasteCols;
    if (headerCopy.length < requiredCols) {
      debugger;
      const addCount = requiredCols - headerCopy.length;
      for (let i = 0; i < addCount; i++) {
        headerCopy.push(`C${headerCopy.length}`);
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
      return { header: headerCopy, body: bodyCopy };
    }
    return DataGridValues;
  };
}
