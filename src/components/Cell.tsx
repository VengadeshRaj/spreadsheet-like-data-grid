import React from "react";
import "../styles/cell.css";

type CellProps = {
  type: "header" | "body";
  isEditable?: boolean;
  text: string;
  onInput?: (value: string) => void;
};

const Cell = (props: CellProps) => {
  const { type, isEditable = false, text, onInput } = props;

  const onCellInputChange = (e: any) => {
    console.log(e.target);
  };

  return type == "header" ? (
    <th className={text ? "header" : ""}>{text}</th>
  ) : (
    <td
      className={isEditable ? "row-value" : "row"}
      contentEditable={isEditable}
      onInput={onCellInputChange}
    >
      {text}
    </td>
  );
};

export default Cell;
