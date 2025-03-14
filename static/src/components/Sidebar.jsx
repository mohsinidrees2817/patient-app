"use client";
import React, { useRef } from "react";
import { FaFileCsv, FaFileExcel, FaFileAlt, FaCheck } from "react-icons/fa";
import { useMainProvider } from "../context/Globalcontext";

const Sidebar = () => {

  const {
    selectedFile,
    proccesingState,
    files,
    handleFileChange,
    handleFileSelect,
    handleDrop,
    handleRemoveFile,
    fileInputRef
  } = useMainProvider();

  const getFileIcon = (file) => {
    if (!file || !file.name)
      return <FaFileAlt className="text-gray-400 text-lg" />;
    const fileType = file.type || "";
    const fileName = file.name.toLowerCase();

    if (fileType === "text/csv" || fileName.endsWith(".csv"))
      return <FaFileCsv className="text-green-400 text-lg" />;
    if (
      fileType.includes("spreadsheet") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    )
      return <FaFileExcel className="text-green-500 text-lg" />;

    return <FaFileAlt className="text-gray-400 text-lg" />;
  };

  return (
    <div className="bg-[#20263e] max-w-[300px] w-full min-h-screen">
      <div className="py-3 px-6 border-b border-[#2d345d]">
        <img src="/jupyterlab/default/proxy/8000/logo.png" alt="Logo" />
      </div>
      <div className="py-6 px-6">
        <h1 className="font-[500] text-lg text-white">UPLOAD DATA</h1>
        <p className="text-xs py-1 text-[#a6a6a6]">
          Upload documents you want to summarize
        </p>

        <div>
          <div
            className={`flex flex-col gap-3 justify-center items-center border border-[#3faaeb]/60 rounded-lg mt-4 border-dashed px-4 py-12 ${
              proccesingState ? "cursor-not-allowed" : " cursor-pointer"
            } `}
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="fileInput"
              className="hidden"
              ref={fileInputRef}
              disabled={proccesingState}
              multiple
              accept=".csv, .xls, .xlsx"
              onChange={handleFileChange}
            />
            <svg
              fill="#505b7e"
              height="40px"
              width="40px"
              viewBox="0 0 374.116 374.116"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-6"
            >
              <g>
                <path d="M344.058,207.506c-16.568,0-30,13.432-30,30v76.609h-254v-76.609c0-16.568-13.432-30-30-30s-30,13.432-30,30v106.609c0,16.568,13.432,30,30,30h314c16.568,0,30-13.432,30-30V237.506C374.058,220.938,360.626,207.506,344.058,207.506z" />
                <path d="M123.57,135.915l33.488-33.488v111.775c0,16.568,13.432,30,30,30c16.568,0,30-13.432,30-30V102.426l33.488,33.488 c5.857,5.858,13.535,8.787,21.213,8.787c7.678,0,15.355-2.929,21.213-8.787c11.716-11.716,11.716-30.71,0-42.426L208.271,8.788 c-11.715-11.717-30.711-11.717-42.426,0L81.144,93.489c-11.716,11.716-11.716,30.71,0,42.426 C92.859,147.631,111.855,147.631,123.57,135.915z" />
              </g>
            </svg>
            <div className="flex flex-col gap-1 items-center justify-center">
              <p className="text-xs text-white">Drag and drop files here</p>
              <p className="text-white py-1 text-sm">-OR-</p>
              <button
                className={`py-2 px-3 rounded-md text-white text-xs font-bold bg-gradient-to-r from-[#046dfd] via-blue-400 to-[#3cace6] ${
                  proccesingState ? "cursor-not-allowed" : " cursor-pointer"
                } `}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("fileInput").click();
                }}
              >
                Browse Files
              </button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 bg-[#303751] rounded-lg min-h-[200px] overflow-y-auto">
              <h3 className="text-white text-sm font-semibold px-3 py-2">
                FILES
              </h3>
              <hr className="border-1 border-[#3faaeb]/30 mb-2" />
              <ul
                className={`"text-white text-xs space-y-2 ${
                  proccesingState ? "cursor-not-allowed" : " cursor-pointer"
                }`}
              >
                {files.map((file, index) => (
                  <li
                    key={index}
                    className={`flex items-center justify-between py-2 rounded-md px-2 relative  ${
                      selectedFile?.name === file.name ? "bg-[#2d345d]" : ""
                    }  ${
                      proccesingState ? "cursor-not-allowed" : " cursor-pointer"
                    }`}
                    onClick={() => {
                      !proccesingState && handleFileSelect(file);
                    }}
                  >
                    <button
                      className={`text-red-400  text-lg mr-2 ${
                        proccesingState
                          ? "cursor-not-allowed"
                          : " cursor-pointer"
                      }`}
                      disabled={proccesingState}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(file);
                      }}
                    >
                      &times;
                    </button>
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`flex items-center${
                          proccesingState
                            ? "cursor-not-allowed"
                            : " cursor-pointer"
                        }`}
                      >
                        {getFileIcon(file)}
                        <div className="ml-2">
                          <p className="text-[12px] truncate text-white">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-white">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {selectedFile?.name === file.name && (
                          <FaCheck className="text-green-400 text-lg mr-2" />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
