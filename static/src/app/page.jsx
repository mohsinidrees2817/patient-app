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
    updateSummaryInGlobalState,
    startStreaming,
    stopProcessing,
    restartProcessing,
    proccesingState,
    startProcessing,
    stoppedProcessing,
  } = useMainProvider();

  const handleStart = () => {
    startProcessing(selectedFile);
  };

  const handleStop = () => {
    console.log("Stop Processing");
    stopProcessing(selectedFile);
  };

  const handleRestart = () => {
    restartProcessing(selectedFile);
  };

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [editedSummary, setEditedSummary] = useState("");

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
          i === selectedRowIndex
            ? {
                ...row,
                summary: editedSummary,
                classification: null,
                status: "Pending",
              }
            : row
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
            Download File
          </button>
        )}
      </div>

      {tableData.length > 0 ? (
        <div className="mt-4 overflow-x-auto bg-white   rounded-lg border border-[#e4e5e7] h-full ">
          {selectedFile && (
            <div className="flex w-full justify-between items-center">
              <p className="text-xl text-[#1e7ce7] rounded-t-2xl text-start py-4 px-4">
                {selectedFile?.name}
              </p>

              <div className="flex gap-2 mr-4">
                {/* Start Button (Green) */}
                <button
                  onClick={handleStart}
                  disabled={
                    proccesingState ||
                    tableData.some((row) => row.status === "Pending") === false
                  }
                  className={`py-3 px-3 rounded-md text-white text-xs font-bold bg-gradient-to-r from-green-500 to-green-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Start
                </button>

                <button
                  onClick={handleStop}
                  disabled={!proccesingState}
                  className={`py-3 px-3 rounded-md text-white text-xs font-bold bg-gradient-to-r from-red-500 to-red-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {stoppedProcessing ? "Stoping..." : "Stop"}
                </button>

                <button
                  onClick={handleRestart}
                  disabled={proccesingState || stoppedProcessing}
                  className={`py-3 px-3 rounded-md text-white text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Restart
                </button>
              </div>
            </div>
          )}
          <div className="border border-[#e4e5e7] rounded-t-2xl">
            <table className="min-w-full text-white table-fixed">
              <thead className="bg-[#f3f2f7] text-sm text-start ">
                <tr>
                  {Object.keys(tableData[0])
                    .slice(0, 1)
                    .map((header, index) => (
                      <th
                        key={index}
                        className={`py-4 px-4 
                            w-[200px] font-bold
                         text-black border border-[#e4e5e7] text-start`}
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
                  <th className="py-4 px-4 border border-[#e4e5e7] text-black text-start w-[120px]">
                    Classification
                  </th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[55vh] overflow-y-auto">
              <table className="min-w-full text-white table-fixed">
                <tbody className="text-sm">
                  {tableData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-[#e4e5e7] text-black relative w-[100px] ${
                        selectedRowIndex === rowIndex ? "bg-[#f3f6ff]" : ""
                      }`}
                    >
                      {Object.values(row)
                        .slice(0, 1)
                        .map((value, colIndex) => (
                          <td
                            key={colIndex}
                            className={`py-4 px-4 
                              w-[200px] font-bold
                           text-black border border-[#e4e5e7] text-start`}
                          >
                            {value}
                          </td>
                        ))}
                      <td className="items-center gap-2 py-4 px-4 border border-[#e4e5e7] text-black text-start w-[150px]">
                        <div className="flex items-center gap-2">
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
                                />
                                <stop offset="1" stopColor="#2984FF" />
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
                                />
                              </circle>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pl-6 pr-10 border border-[#e4e5e7] text-black text-start relative ">
                        {row.summary}
                        {(row.classification ||
                          row.classification === null) && (
                          <FaEdit
                            disabled={proccesingState}
                            className={`absolute right-3 top-5 text-lg  transition-colors ${
                              selectedRowIndex === rowIndex
                                ? "text-blue-500"
                                : "text-black/60"
                            }  disabled:opacity-80 ${
                              proccesingState
                                ? "cursor-not-allowed opacity-70"
                                : " cursor-pointer"
                            } `}
                            onClick={() => {
                              !proccesingState && handleEditClick(rowIndex);
                            }}
                          />
                        )}
                      </td>
                      <td className="py-4 px-4 border border-[#e4e5e7] text-black text-start w-[124px]">
                        {row?.classification}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRowIndex !== null && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="relative min-w-[400px] max-w-[700px] w-full px-6 py-6 border border-[#eef0f3] rounded-md bg-white shadow-xl">
                <div
                  className="absolute right-3 top-3 cursor-pointer bg-red-400/30 px-2 py-1 text-xs rounded-full text-red-500"
                  onClick={() => {
                    setSelectedRowIndex(null);
                    setEditedSummary("");
                  }}
                >
                  X
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex w-full justify-start items-center">
                    <div className="w-16 h-16 bg-[#f3f2f7] rounded-full flex justify-center items-center">
                      <FaEdit className="text-xl text-blue-500" />
                    </div>

                    <div className="flex flex-col justify-start items-start ml-3">
                      <p className="font-semibold text-lg">
                        Edit Patient Summary
                      </p>
                      <p className="text-sm  text-[#a6a6a6]">
                        Modify the AI-generated summary before saving.
                      </p>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="w-full mt-6 p-2 text-black rounded-md border border-[#d2d4d9] focus:outline-none"
                    placeholder="Edit summary..."
                  />

                  <div className="flex justify-center gap-3 mt-4">
                    <button
                      onClick={handleReset}
                      className="py-2 px-4 text-blue-500 border cursor-pointer border-blue-500 rounded-md font-bold text-sm hover:bg-blue-500 hover:text-white transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="py-2 px-4 bg-blue-500 text-white rounded-md font-bold text-sm hover:bg-blue-600 transition cursor-pointer"
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
