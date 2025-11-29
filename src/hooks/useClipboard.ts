import { useEffect } from "react";
import { Coord, SelRange } from "../types";
import { DataGridUtility } from "../utils/DataGridUtility";

export function useClipboard(params: {
  currentSelection: SelRange;
  focused: Coord | null;
  anchor: Coord | null;
  buildTSVFromRange: (range: { top: number; bottom: number; left: number; right: number }) => string;
  clearRange: (range: { top: number; bottom: number; left: number; right: number }) => void;
  pasteTextAt: (text: string, start: Coord) => void;
}) {
  const { currentSelection, focused, anchor, buildTSVFromRange, clearRange, pasteTextAt } = params;

  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      if (!currentSelection && !focused) return;
      e.preventDefault();
      const sel = currentSelection ?? (focused ? { start: focused, end: focused } : null);
      if (!sel) return;
      const norm = DataGridUtility.normalizeRange(sel.start, sel.end);
      const tsv = buildTSVFromRange(norm);
      e.clipboardData?.setData("text/plain", tsv);
    };

    const onCut = (e: ClipboardEvent) => {
      if (!currentSelection && !focused) return;
      e.preventDefault();
      const sel = currentSelection ?? (focused ? { start: focused, end: focused } : null);
      if (!sel) return;
      const norm = DataGridUtility.normalizeRange(sel.start, sel.end);
      const tsv = buildTSVFromRange(norm);
      e.clipboardData?.setData("text/plain", tsv);
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
  }, [currentSelection, focused, anchor]);
}
