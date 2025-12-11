import React from "react";
import "../styles/cell.css";
import { Coord } from "../types";

type CellProps = {
  isEditable?: boolean;
  text: string;
  isSelected?: boolean;
  isAnchor?: boolean;
  coord: Coord;
  onCellValueChange?: (cellValue: string) => void;
  handleMouseDown?: (e: React.MouseEvent, cell: Coord) => void;
  handleMouseEnter?: (cell: Coord) => void;
  onFocus?: () => void;
  onClick?: (coord: Coord) => void;
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
    onClick,
  } = props;

  const getClassName = () => {
    let cellCss = "text-center px-2 ";
    if (!isEditable) { return cellCss +"cursor-cell bg-green-100 text-green-500";}

    if (isAnchor)
      { return  cellCss + "cursor-text bg-blue-200 outline-2 outline-dashed outline-blue-700";} 
    if (isSelected)
      { return cellCss +"cursor-text bg-blue-100 outline outline-blue-500";} 

    return cellCss+ "cursor-text hover:bg-gray-100";
  };

  const className = getClassName();

  const commitCellValue = (newCellValue: string) => {
    onCellValueChange?.(newCellValue);
  };

  return (
    <td
      className={className}
      contentEditable={isEditable}
      onBlur={(e) => commitCellValue(e.target.innerText)}
      onMouseDown={(e) => handleMouseDown?.(e, coord)}
      onMouseEnter={(e) => handleMouseEnter?.(coord)}
      tabIndex={0}
      onClick={() => onClick?.(coord)}
    >
      {text}
    </td>
  );
};

export default React.memo(Cell);
