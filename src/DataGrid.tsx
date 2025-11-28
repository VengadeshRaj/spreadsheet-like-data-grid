import React, { useState } from "react";
import AddButton from "./components/AddButton";
import Cell from "./components/Cell";

export default function DataGrid() {
  const [DataGridValues, setDataGridValues] = useState({
    header: ["", "Head 1", "Head 2", "Head 3", "Head 4"],
    body: [
      ["Label 1", "", "", "", ""],
      ["Label 2", "", "", "", ""],
      ["Label 3", "", "", "", ""],
      ["Label 4", "", "", "", ""],
    ],
  });

  const addColumnClick = () => {};

  const addRowClick = () => {};

  const buildHeaders = () => (
    <tr>
      {DataGridValues.header.map((data) => (
        <Cell type="header" text={data} />
      ))}{" "}
      <AddButton type="Column" onClick={addColumnClick} />
    </tr>
  );

  const buildBody = () => (
    <>
      {DataGridValues.body.map((row) => (
        <tr className="">
          {row.map((rowValue, i) => (
            <Cell type="body" isEditable={!(i == 0)} text={rowValue} />
          ))}
        </tr>
      ))}
      <tr>
        <AddButton type="Row" onClick={addRowClick} />
      </tr>
    </>
  );

  return (
    <div>
      <table className="">
        <thead>{buildHeaders()}</thead>
        <tbody>{buildBody()}</tbody>
      </table>
    </div>
  );
}
