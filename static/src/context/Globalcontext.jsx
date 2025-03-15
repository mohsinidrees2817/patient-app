"use client";
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const MainContext = createContext();

export const MainProvider = ({ children }) => {
  const [data, setData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [proccesingState, setProccesingState] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [fileProcessingState, setFileProcessingState] = useState({});
  const [abortControllers, setAbortControllers] = useState({});
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
  const fileProcessingStateRef = useRef({});
  const [restartTrigger, setRestartTrigger] = useState(null);
  const [stoppedProcessing, setStoppedProcessing] = useState(false);
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
                classification: "",
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
              classification: "",
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
          classification: "",
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startStreaming = async (file) => {
    console.log(`Starting processing for file: ${file.name}`);

    fileProcessingStateRef.current[file.name] = { isPaused: false };

    const fileData = data.find((item) => item.file.name === file.name);
    if (!fileData || fileData.status !== "Pending") {
      console.log(`File: ${file.name} is already processed or in progress`);
      console.log(fileData.status, "fileData.status");
      return;
    }

    setProccesingState(true);
    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name ? { ...item, status: "In Progress" } : item
      )
    );
    console.log("i am here");

    for (let i = 0; i < fileData.tableData.length; i++) {
      if (fileProcessingStateRef.current[file.name]?.isPaused) {
        console.log(`Processing paused for file: ${file.name}`);
        return;
      }

      const row = fileData.tableData[i];

      if (row.status !== "Pending") {
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

    if (!fileProcessingStateRef.current[file.name]?.isPaused) {
      setData((prevData) =>
        prevData.map((item) =>
          item.file.name === file.name ? { ...item, status: "Done" } : item
        )
      );
    }

    setProccesingState(false);
  };

  const streamSummary = async (row, rowIndex, file, signal) => {
    try {
      // Step 1: Fetch Summary from /stream-summary/
      const summaryResponse = await fetch(
        `${API_BASE}/stream-summary?patient_id=${row["Patient ID"]}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        }
      );

      if (!summaryResponse.ok) {
        throw new Error(`HTTP error! status: ${summaryResponse.status}`);
      }

      const summaryReader = summaryResponse.body.getReader();
      const decoder = new TextDecoder();
      let summary = "";

      while (true) {
        const { done, value } = await summaryReader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        summary += chunk; // Append new data
        updateRowSummary(rowIndex, summary);
      }

      console.log(`Final Summary for patient ${row["Patient ID"]}:`, summary);

      // Prevent classification if summary is empty
      if (!summary.trim()) {
        console.error("Empty summary received, skipping classification.");
        updateRowStatus(rowIndex, "Error: error generating summary");
        return;
      }

      // Step 2: Fetch Classification from /classify/ (Streaming)
      const classificationResponse = await fetch(
        `${API_BASE}/classify?summary=${encodeURIComponent(summary)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        }
      );

      if (!classificationResponse.ok) {
        throw new Error(`HTTP error! status: ${classificationResponse.status}`);
      }

      const classificationReader = classificationResponse.body.getReader();
      let classification = "";

      while (true) {
        const { done, value } = await classificationReader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true }).trim();
        console.log("chunk", chunk);
        classification += chunk;
        updateRowClassification(rowIndex, classification);
      }
      updateRowStatus(rowIndex, "Done");
      setStoppedProcessing(false);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Streaming aborted by user");
      } else {
        console.error("Error processing summary and classification:", error);
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
                  ? {
                      ...row,
                      summary: newSummary,
                      classification: null,
                      status: "Pending",
                    }
                  : row
              ),
            }
          : item
      )
    );
  };

  const startProcessing = (file) => {
    console.log(`Resuming processing for file: ${file.name}`);
    console.log(data, "data");
    fileProcessingStateRef.current[file.name] = { isPaused: false };

    setFileProcessingState((prev) => ({
      ...prev,
      [file.name]: { isPaused: false },
    }));

    const fileData = data.find((item) => item.file.name === file.name);

    if (fileData) {
      const hasPendingRows = fileData.tableData.some(
        (row) => row.status === "Pending"
      );

      if (hasPendingRows) {
        startStreaming(file);
      } else {
        console.log(`No pending rows left to process for file: ${file.name}`);
      }
    }
  };

  const stopProcessing = (file) => {
    fileProcessingStateRef.current[file.name] = { isPaused: true };
    setStoppedProcessing(true);

    setFileProcessingState((prev) => ({
      ...prev,
      [file.name]: { isPaused: true },
    }));
    setProccesingState(false);
    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name
          ? {
              ...item,
              status: "Pending",
            }
          : item
      )
    );
  };

  const restartProcessing = (file) => {
    console.log(`Restarting processing for file: ${file.name}`);

    fileProcessingStateRef.current[file.name] = { isPaused: false };

    setData((prevData) =>
      prevData.map((item) =>
        item.file.name === file.name
          ? {
              ...item,
              status: "Pending",
              tableData: item.tableData.map((row) => ({
                ...row,
                status: "Pending",
                summary: "",
                classification: "",
              })),
            }
          : item
      )
    );

    setTableData((prevTableData) =>
      prevTableData.map((row) => ({
        ...row,
        status: "Pending",
        summary: "",
        classification: "",
      }))
    );

    // Set a trigger to restart processing
    setRestartTrigger(file);
  };

  useEffect(() => {
    if (restartTrigger) {
      startStreaming(restartTrigger);
      setRestartTrigger(null); // Reset the trigger after processing starts
    }
  }, [restartTrigger]);

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
        fileInputRef,
        startStreaming,
        stopProcessing,
        restartProcessing,
        proccesingState,
        fileProcessingState,
        startProcessing,
        stoppedProcessing,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
export const useMainProvider = () => useContext(MainContext);
