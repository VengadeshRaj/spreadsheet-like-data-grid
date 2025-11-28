import React, { useState } from "react";
import "../styles/add-button.css";

type AddButtonProps = {
  type: "Row" | "Column";
  onClick: () => void;
};

const AddButton = (props: AddButtonProps) => {
  const { type, onClick } = props;
  const [showBtnText, setShowBtnText] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseOver={() => setShowBtnText(true)}
      onMouseLeave={() => setShowBtnText(false)}
      className="btn"
    >
      {showBtnText ? `Add ${type}` : "+"}
    </button>
  );
};

export default AddButton;
