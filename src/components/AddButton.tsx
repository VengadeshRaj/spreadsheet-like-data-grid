import React, { useState } from "react";

type AddButtonProps = {
  type: "Row" | "Column";
  onClick: () => void;
};

const AddButton = React.memo((props: AddButtonProps) => {
  const { type, onClick } = props;

  return (
    <button
      onClick={onClick}
      className="bg-blue-700 text-white border px-2 rounded m-1 h-[2rem] w-[2rem]"
    >
      { "+"}
    </button>
  );
});

export default AddButton;
