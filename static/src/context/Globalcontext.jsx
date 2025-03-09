"use client";
import React, { createContext, useContext, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const MainContext = createContext();

export const MainProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [proccesingState, setProccesingState] = useState(false);
  const [files, setFiles] = useState([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

  const allowedFileTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const parseFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = ({ target }) => {
        let dataWithStatus = [];

        if (file.type === "text/csv") {
          Papa.parse(target.result, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              dataWithStatus = result.data.map((row) => ({
                ...row,
                status: "Pending",
                summary: "",
              }));
              resolve(dataWithStatus);
            },
          });
        } else if (
          file.type === "application/vnd.ms-excel" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          const workbook = XLSX.read(target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const headers = jsonData[0];
          const rows = jsonData.slice(1);

          dataWithStatus = rows.map((row) => {
            const rowData = {};
            headers.forEach((header, index) => {
              rowData[header] = row[index];
            });
            return {
              ...rowData,
              status: "Pending",
              summary: "",
            };
          });

          resolve(dataWithStatus);
        } else {
          console.error("Unsupported file type:", file.type);
          resolve([]);
        }
      };

      if (file.type === "text/csv") {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFileUpload = async (files) => {
    const nonDuplicateFiles = files.filter((file) => {
      const isDuplicate = data.some(
        (item) => item.file.name === file.name && item.file.size === file.size
      );
      if (isDuplicate) {
        console.warn(`Skipping duplicate file: ${file.name}`);
        return false;
      }
      return true;
    });

    if (nonDuplicateFiles.length === 0) {
      console.warn("No new files to upload (all files are duplicates).");
      return;
    }

    const filesWithData = await Promise.all(
      nonDuplicateFiles.map(async (file) => {
        const tableData = await parseFile(file);
        return {
          file,
          status: "Pending",
          summary: "",
          tableData,
        };
      })
    );

    setData((prevData) => [...prevData, ...filesWithData]);

    setSelectedFile(nonDuplicateFiles[0]);

    setTableData(filesWithData[0].tableData);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const filteredFiles = selectedFiles.filter((file) =>
      allowedFileTypes.includes(file.type)
    );

    if (filteredFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...filteredFiles]);
      handleFileUpload(filteredFiles);
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);

    const existingFileData = data.find((item) => item.file.name === file.name);

    if (existingFileData) {
      setTableData(existingFileData.tableData);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const filteredFiles = droppedFiles.filter((file) =>
      allowedFileTypes.includes(file.type)
    );

    if (filteredFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...filteredFiles]);
      setData((prevData) => [...prevData, ...filteredFiles]);
    }
  };

  const handleRemoveFile = (file) => {
    setData((prevData) =>
      prevData.filter((item) => item.file.name !== file.name)
    );

    setFiles((prevFiles) =>
      prevFiles.filter((prevFile) => prevFile.name !== file.name)
    );

    if (selectedFile?.name === file.name) {
      const remainingFiles = data.filter(
        (item) => item.file.name !== file.name
      );

      if (remainingFiles.length > 0) {
        setSelectedFile(remainingFiles[0].file);
        setTableData(remainingFiles[0].tableData);
      } else {
        setSelectedFile(null);
        setTableData([]);
      }
    }
  };

  const startStreaming = async (file) => {
    const fileData = data.find((item) => item.file.name === file.name);
    if (!fileData || fileData.status !== "Pending") return;
    setProccesingState(true);

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name ? { ...item, status: "In Progress" } : item
      )
    );

    for (let i = 0; i < fileData.tableData.length; i++) {
      const row = fileData.tableData[i];

      if (row.status === "Done") {
        continue;
      }

      updateRowStatus(i, "In Progress");

      const summary = await streamSummary(row, i, file);

      if (summary) {
        updateRowStatus(i, "Done");
        updateRowSummary(i, summary);

        setData((prevData) =>
          prevData.map((item) =>
            item.file.name === file.name
              ? {
                  ...item,
                  tableData: item.tableData.map((r, idx) =>
                    idx === i ? { ...r, status: "Done", summary } : r
                  ),
                }
              : item
          )
        );
      }
    }

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name ? { ...item, status: "Done" } : item
      )
    );

    setProccesingState(false);
  };

  const streamSummary = async (row, rowIndex, file) => {
    try {
      const response = await fetch(`${API_BASE}/generate-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let summary = "";
      let classification = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes("summary:")) {
          const summaryChunk = chunk.replace("summary:", "").trim();
          summary += summaryChunk + " ";
          updateRowSummary(rowIndex, summary);
        } else if (chunk.includes("classification:")) {
          const classificationChunk = chunk
            .replace("classification:", "")
            .trim();
          classification += classificationChunk + " ";
          updateRowClassification(rowIndex, classification); 
        }
      }

      updateRowStatus(rowIndex, "Done");
    } catch (error) {
      console.error("Error streaming summary:", error);
      updateRowStatus(rowIndex, "Error!");
      updateRowSummary(rowIndex, "");
      updateRowClassification(rowIndex, "");

      setData((prevData) =>
        prevData.map((item) =>
          item.file.name === file.name
            ? {
                ...item,
                tableData: item.tableData.map((r, idx) =>
                  idx === rowIndex
                    ? {
                        ...r,
                        status: "Error!",
                        summary: "",
                        classification: "",
                      }
                    : r
                ),
              }
            : item
        )
      );
    }
  };

  const updateRowClassification = (rowIndex, classification) => {
    
    setTableData((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, classification } : row))
    );

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === selectedFile.name
          ? {
              ...item,
              tableData: item.tableData.map((row, idx) =>
                idx === rowIndex ? { ...row, classification } : row
              ),
            }
          : item
      )
    );
  };

  const updateRowSummary = (rowIndex, summary) => {
    setTableData((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, summary } : row))
    );

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === selectedFile.name
          ? {
              ...item,
              tableData: item.tableData.map((row, idx) =>
                idx === rowIndex ? { ...row, summary } : row
              ),
            }
          : item
      )
    );
  };

  const updateRowStatus = (index, status) => {
    setTableData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, status } : row))
    );

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === selectedFile.name
          ? {
              ...item,
              tableData: item.tableData.map((row, idx) =>
                idx === index ? { ...row, status } : row
              ),
            }
          : item
      )
    );
  };

  const updateSummaryInGlobalState = (file, rowIndex, newSummary) => {
    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name
          ? {
              ...item,
              status: "Pending",
              tableData: item.tableData.map((row, idx) =>
                idx === rowIndex
                  ? { ...row, summary: newSummary, status: "Pending" }
                  : row
              ),
            }
          : item
      )
    );
  };

  return (
    <MainContext.Provider
      value={{
        data,
        setData,
        selectedFile,
        setSelectedFile,
        tableData,
        setTableData,
        handleFileUpload,
        startStreaming,
        updateRowSummary,
        updateRowStatus,
        updateSummaryInGlobalState,
        proccesingState,
        setProccesingState,
        files,
        setFiles,
        handleFileChange,
        handleFileSelect,
        handleDrop,
        handleRemoveFile,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
export const useMainProvider = () => useContext(MainContext);
