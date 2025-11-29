export type Coord = { r: number; c: number };

export type SelRange = { start: Coord; end: Coord } | null;

export type GridRow = string[];

export type DataGridValue = {
  header: string[];
  body: GridRow[];
};