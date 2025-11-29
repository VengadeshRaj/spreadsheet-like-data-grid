import React from "react";
import "../styles/cell.css";
import { Coord } from "../types";


type CellProps = {
  isEditable?: boolean;
  text: string;
  isSelected?: boolean;
  isAnchor?: boolean;
  coord:Coord;
  onCellValueChange?: (cellValue: string) => void;
  handleMouseDown?: (e: React.MouseEvent, cell: Coord) => void;
  handleMouseEnter?: (e: React.MouseEvent, cell: Coord) => void;
  onFocus?: () => void;
  onClick?: (coord:Coord) => void;
};

const Cell = (props: CellProps) => {
  const {
    isEditable = false,
    isSelected,
    isAnchor,
    text,
    coord,
    onCellValueChange,
    handleMouseDown,
    handleMouseEnter,
    onClick
  } = props;
  const getClassName = () => {
    if (isEditable) {
      if (isAnchor) return "row-value anchor";
      else if (isSelected) return "row-value selected";
      return "row-value";
    } else return "row";
  };
  const className = getClassName();

  const commitCellValue = (newCellValue: string) => {
    console.log(newCellValue)
    onCellValueChange?.(newCellValue);
  };

  return  (
    <td
      className={className}
      contentEditable={isEditable}
      onBlur={(e) => commitCellValue(e.target.innerText)}
      onMouseDown={(e) => handleMouseDown?.(e, coord)}
      onMouseEnter={(e) => handleMouseEnter?.(e, coord)}
      tabIndex={0}
      onClick={()=> onClick?.(coord)}
    >
      {text}
    </td>
  );
};

export default Cell;
