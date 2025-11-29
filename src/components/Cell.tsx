import React, { useState, useRef, useEffect } from "react";
import "../styles/cell.css";

type CellProps = {
  type: "header" | "body";
  isEditable?: boolean;
  text: string;
  onCellValueChange?: (cellValue: string) => void;
};

const Cell = (props: CellProps) => {
  const { type, isEditable = false, text, onCellValueChange } = props;
  const inputRef: any = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
   useEffect(() => {
    if (editMode) {
      inputRef.current?.focus();
    }
  }, [editMode]);

  const cellInputOnClick = () => {
    setInputValue(text);
    setEditMode(true);
  };

  const commitCellValue = (newCellValue: string) => {
    setInputValue("");
    setEditMode(false);
    onCellValueChange?.(newCellValue);
  };

  return type == "header" ? (
    <th className={text ? "header" : ""}>{text}</th>
  ) : (
    <td
      className={isEditable ? "row-value" : "row"}
      onClick={() => cellInputOnClick()}
    >
      {editMode ? (
        <input
          ref={inputRef}
          className="row-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={(e) => commitCellValue(e.target.value)}
        />
      ) : (
        text
      )}
    </td>
  );
};

export default Cell;
