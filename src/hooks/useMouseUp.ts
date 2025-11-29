import { useEffect } from "react";

export function useMouseUp(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();

    document.addEventListener("mouseup", handler);
    return () => document.removeEventListener("mouseup", handler);
  }, [callback]);
}