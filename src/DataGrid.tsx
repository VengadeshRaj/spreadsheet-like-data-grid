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

  const addColumnClick = () => {
    setDataGridValues({
      header: [
        ...DataGridValues.header,
        `Head ${DataGridValues.header.length}`,
      ],
      body: DataGridValues.body.map((body) => [...body, ""]),
    });
  };

  const addRowClick = () => {
    const newRow = new Array(DataGridValues.header.length).fill("");
    newRow[0] = `Label ${DataGridValues.body.length}`;
     setDataGridValues({
      ...DataGridValues,
      body:[ ...DataGridValues.body,newRow]
    });
  };

  const onCellValueCommit = (
    value: string,
    rowIndex: number,
    rowValueIndex: number
  ) => {
    const bodyCells = DataGridValues.body;
    bodyCells[rowIndex][rowValueIndex] = value;
    setDataGridValues({ ...DataGridValues, body: [...bodyCells] });
  };

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
      {DataGridValues.body.map((row, rowIndex) => (
        <tr className="">
          {row.map((rowValue, rowValueIndex) => (
            <Cell
              type="body"
              isEditable={!(rowValueIndex == 0)}
              text={rowValue}
              onCellValueChange={(e) =>
                onCellValueCommit(e, rowIndex, rowValueIndex)
              }
            />
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
