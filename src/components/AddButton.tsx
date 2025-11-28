import React from "react";

type AddButtonProps = {
  type: "Row" | "Column";
  onClick: () => void;
};

const AddButton = (props: AddButtonProps) => {
  const { type, onClick } = props;
  return <button onClick={ onClick}>Add {type}</button>;
};

export default AddButton;
