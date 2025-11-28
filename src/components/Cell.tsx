import React from "react";

type CellProps = {
  type: "header" | "body";
  isEditable: boolean;
  text: string;
};

const Cell = (props: CellProps) => {
  const { type, isEditable, text } = props;

  return type == "header" ? (
    <th className="">{text}</th>
  ) : (
    <td contentEditable={isEditable}>{text}</td>
  );
};

export default Cell;
