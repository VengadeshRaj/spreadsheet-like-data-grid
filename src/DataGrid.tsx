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
        <th className="">{data}</th>
      ))}{" "}
      <AddButton type="Row" onClick={addColumnClick} />
    </tr>
  );

  const buildBody = () => (
    <>
      {DataGridValues.body.map((row) => (
        <tr className="">
          {row.map((rowValue, i) => (
            <td contentEditable={!(i == 0)}>{rowValue}</td>
          ))}
        </tr>
      ))}
      <tr>
        <AddButton type="Column" onClick={addRowClick} />
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
