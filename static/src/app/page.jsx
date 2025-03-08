"use client";
import { useEffect, useState } from "react";
import { useMainProvider } from "../context/Globalcontext";
import { FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
export default function Home() {
  const {
    selectedFile,
    tableData,
    setTableData,
    startStreaming,
    updateSummaryInGlobalState,
  } = useMainProvider();

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [editedSummary, setEditedSummary] = useState("");

  useEffect(() => {
    if (selectedFile) {
      startStreaming(selectedFile);
    }
  }, [selectedFile]);

  const handleDownload = () => {
    if (tableData.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(tableData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "downloaded_data.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleEditClick = (rowIndex) => {
    setSelectedRowIndex(rowIndex);
    setEditedSummary(tableData[rowIndex].summary);
  };

  const handleReset = () => {
    setEditedSummary(tableData[selectedRowIndex].summary);
  };

  const handleSave = () => {
    if (selectedRowIndex !== null) {
      setTableData((prev) =>
        prev.map((row, i) =>
          i === selectedRowIndex ? { ...row, summary: editedSummary } : row
        )
      );
      updateSummaryInGlobalState(selectedFile, selectedRowIndex, editedSummary);
      setSelectedRowIndex(null);
      setEditedSummary("");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold text-black">FILE PREVIEW</p>
          <p className="text-sm py-1 text-[#a6a6a6]">
            Your uploaded file will be displayed here.
          </p>
        </div>
        {selectedFile && (
          <button
            onClick={handleDownload}
            className="py-3 px-3 rounded-md text-white text-xs font-bold bg-gradient-to-r from-[#046dfd] via-blue-400 to-[#3cace6] cursor-pointer"
            disabled={tableData.length === 0}
          >
            Download CSV
          </button>
        )}
      </div>

      {tableData.length > 0 ? (
        <div className="mt-4 overflow-x-auto bg-white   rounded-lg border border-[#e4e5e7] min-h-[60vh] h-full">
          {selectedFile && (
            <p className="text-xl text-[#1e7ce7] rounded-t-2xl text-start py-4 px-4">
              {selectedFile?.name}
            </p>
          )}
          <table className="min-w-full border border-[#e4e5e7] text-white ">
            <thead className="rounded-t-2xl">
              <tr className="bg-[#f3f2f7] text-sm text-start ">
                {Object.keys(tableData[0])
                  .slice(0, 2)
                  .map((header, index) => (
                    <th
                      key={index}
                      className={`py-4 px-4 ${
                        index === 0
                          ? "w-[200px] font-bold"
                          : "w-[300px] overflow-hidden text-ellipsis whitespace-nowrap"
                      } text-black border  border-[#e4e5e7] text-start`}
                    >
                      {header}
                    </th>
                  ))}
                <th className="py-4 px-4 border border-[#e4e5e7] text-black text-start w-[150px]">
                  Status
                </th>
                <th className="py-4 px-4 border border-[#e4e5e7] text-black text-start">
                  Summary
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tableData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-[#e4e5e7] text-black relative  ${
                    selectedRowIndex === rowIndex ? "bg-[#f3f6ff]" : ""
                  }`}
                >
                  {Object.values(row)
                    .slice(0, 2)
                    .map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="py-3 px-4 border border-[#e4e5e7] text-black"
                      >
                        {value}
                      </td>
                    ))}
                  <td className="py-4 px-4 text-start text-black min-w-[100px] flex items-center gap-2">
                    <span
                      className={`py-1 px-2 text-xs rounded-full ${
                        row.status === "Pending"
                          ? "bg-red-500/40 text-red-600 font-bold"
                          : row.status === "In Progress"
                          ? "bg-blue-500/40 text-blue-600 font-bold"
                          : "bg-green-500/40 text-green-600 font-bold"
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.status === "In Progress" && (
                      <svg viewBox="0 0 200 200" width={20} height={20}>
                        <linearGradient id="a11">
                          <stop
                            offset="0"
                            stopColor="#2984FF"
                            stopOpacity="0"
                          ></stop>
                          <stop offset="1" stopColor="#2984FF"></stop>
                        </linearGradient>
                        <circle
                          fill="none"
                          stroke="url(#a11)"
                          strokeWidth="35"
                          strokeLinecap="round"
                          strokeDasharray="0 44 0 44 0 44 0 44 0 360"
                          cx="100"
                          cy="100"
                          r="70"
                          transformOrigin="center"
                        >
                          <animateTransform
                            type="rotate"
                            attributeName="transform"
                            calcMode="discrete"
                            dur="1"
                            values="360;324;288;252;216;180;144;108;72;36"
                            repeatCount="indefinite"
                          ></animateTransform>
                        </circle>
                      </svg>
                    )}
                  </td>
                  <td className="py-2 pl-4 pr-12 border border-[#e4e5e7] text-black">
                    {row.summary}
                    {row.summary && (
                      <FaEdit
                        className={`absolute right-4 top-5 cursor-pointer text-lg transition-colors ${
                          selectedRowIndex === rowIndex
                            ? "text-blue-500"
                            : "text-black/60"
                        }`}
                        onClick={() => handleEditClick(rowIndex)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedRowIndex !== null && (
            <div className="mx-6 my-8">
              <div className="    relative  flex w-full px-4 py-6 border border-[#eef0f3] rounded-md bg-white shadow-2xl shadow-blue-50">
                <div
                  className={`absolute right-2 top-2 cursor-pointer transition-colors bg-red-400/30 px-2 py-1 text-xs rounded-full text-red-500`}
                  onClick={() => {
                    setSelectedRowIndex(null);
                    setEditedSummary("");
                  }}
                >
                  X
                </div>
                <div className="mx-3">
                  <div className="w-16 h-16 bg-[#f3f2f7] rounded-full flex justify-center items-center">
                    <FaEdit
                      className={` cursor-pointer text-xl transition-colors text-blue-500
                             `}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <p className="font-[600] ">Edit Patient Summary</p>
                  <p className="text-sm pt-1  text-[#a6a6a6]">
                    Modify the Al-generated summary before saving.
                  </p>
                  <input
                    type="text"
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className=" p-2 w-full mt-3 text-black rounded-md focus:outline-none border-1 border-[#d2d4d9]"
                    placeholder="Edit summary..."
                  />
                  <div className="flex justify-start items-center gap-3">
                    <button
                      onClick={handleReset}
                      className="mt-2 py-3 px-4 text-blue-400 border-2 border-blue-400 rounded-md min-w-[150px] font-bold text-sm hover:bg-gradient-to-r from-[#046dfd] via-blue-400 to-[#3cace6] cursor-pointer hover:text-white hover:border-white"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="mt-2 py-3 px-4 bg-gradient-to-r from-[#046dfd] via-blue-400 to-[#3cace6] text-white rounded-md font-bold text-sm cursor-pointer hover:via-blue-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-white mt-4">No data available.</p>
      )}
    </div>
  );
}
